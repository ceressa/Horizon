using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Horizon.Services;

public class DataSyncService : IHostedService, IDataSyncService, IDisposable
namespace Horizon.Services;

public class DataSyncService : IHostedService, IDisposable
{
    private readonly ILogger<DataSyncService> _logger;
    private readonly string _sourcePath;
    private readonly string _targetPath;
    private readonly List<string> _fileNames;
    private readonly SemaphoreSlim _syncLock = new(1, 1);
    private Timer? _timer;

    private static readonly TimeSpan SyncInterval = TimeSpan.FromHours(1);

    public DataSyncService(
        IOptions<DataSyncOptions> options,
        IWebHostEnvironment environment,
        ILogger<DataSyncService> logger)
    {
        _logger = logger;

        var syncOptions = options.Value ?? new DataSyncOptions();

        _sourcePath = syncOptions.SourcePath
            ?? Path.Combine(environment.ContentRootPath, "Data");

        _targetPath = syncOptions.TargetPath
            ?? Path.Combine(environment.ContentRootPath, "publish", "Data");

        _fileNames = syncOptions.FileNames?.Where(f => !string.IsNullOrWhiteSpace(f))
            .Select(Path.GetFileName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

    private Timer? _timer;

    private static readonly TimeSpan SyncTime = new(17, 0, 0); // 17:00 every day

    public DataSyncService(IConfiguration configuration, IWebHostEnvironment environment, ILogger<DataSyncService> logger)
    {
        _logger = logger;

        _sourcePath = configuration.GetValue<string>("DataPath")
            ?? Path.Combine(environment.ContentRootPath, "Data");

        _targetPath = configuration.GetValue<string>("PublishDataPath")
            ?? Path.Combine(environment.ContentRootPath, "Data");
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("DataSyncService starting. Source: {Source}, Target: {Target}, Interval: {Interval}",
            _sourcePath, _targetPath, SyncInterval);

        _ = TriggerSyncInternalAsync("startup", cancellationToken);
        StartTimer();

        _logger.LogInformation("DataSyncService starting. Source: {Source}, Target: {Target}", _sourcePath, _targetPath);

        _ = CopyDataAsync(cancellationToken);
        ScheduleNextRun();

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("DataSyncService stopping.");
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }

    private void StartTimer()
    {
        _timer?.Dispose();
        _timer = new Timer(async _ => await RunScheduledSyncAsync(), null, SyncInterval, SyncInterval);
        _logger.LogInformation("Recurring data sync timer started. Next run at ~{NextRun}.", DateTime.Now + SyncInterval);
    }

    private async Task RunScheduledSyncAsync()
    {
        await TriggerSyncInternalAsync("scheduled");
    }

    public Task TriggerSyncAsync(CancellationToken cancellationToken = default)
    {
        return TriggerSyncInternalAsync("manual", cancellationToken);
    }

    private async Task TriggerSyncInternalAsync(string reason, CancellationToken cancellationToken = default)
    {
        if (!await _syncLock.WaitAsync(0, cancellationToken))
        {
            _logger.LogWarning("Data sync skipped ({Reason}) because a sync is already in progress.", reason);
            return;
        }

        try
        {
            _logger.LogInformation("Starting data sync ({Reason}).", reason);
            await CopyDataAsync(cancellationToken);
            _logger.LogInformation("Data sync completed ({Reason}).", reason);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Data sync cancelled ({Reason}).", reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Data sync failed ({Reason}).", reason);
        }
        finally
        {
            _syncLock.Release();

    private void ScheduleNextRun()
    {
        var now = DateTime.Now;
        var nextRun = now.Date + SyncTime;

        if (now >= nextRun)
        {
            nextRun = nextRun.AddDays(1);
        }

        var delay = nextRun - now;

        _logger.LogInformation("Next data sync scheduled for {NextRun} (in {Delay}).", nextRun, delay);

        _timer?.Dispose();
        _timer = new Timer(async _ => await RunSyncAsync(), null, delay, Timeout.InfiniteTimeSpan);
    }

    private async Task RunSyncAsync()
    {
        try
        {
            await CopyDataAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Data sync failed.");
        }
        finally
        {
            ScheduleNextRun();
        }
    }

    private async Task CopyDataAsync(CancellationToken cancellationToken)
    {
        if (!Directory.Exists(_sourcePath))
        {
            _logger.LogWarning("Source data directory does not exist: {SourcePath}", _sourcePath);
            return;
        }

        Directory.CreateDirectory(_targetPath);

        var files = ResolveFilesToCopy();

        if (!files.Any())
        {
            _logger.LogWarning("No Excel files found to copy from {SourcePath}.", _sourcePath);
            return;
        }

        var files = Directory.GetFiles(_sourcePath, "*.xlsx", SearchOption.TopDirectoryOnly);

        foreach (var file in files)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var fileName = Path.GetFileName(file);
            var destinationPath = Path.Combine(_targetPath, fileName);

            try
            {
                using var sourceStream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var destinationStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.Read);
                await sourceStream.CopyToAsync(destinationStream, cancellationToken);

                _logger.LogInformation("Copied {FileName} to {DestinationPath}", fileName, destinationPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to copy {FileName} to {DestinationPath}", fileName, destinationPath);
            }
        }
    }

    private IEnumerable<string> ResolveFilesToCopy()
    {
        if (_fileNames.Count == 0)
        {
            return Directory.GetFiles(_sourcePath, "*.xlsx", SearchOption.TopDirectoryOnly);
        }

        var resolved = new List<string>();

        foreach (var fileName in _fileNames)
        {
            var fullPath = Path.Combine(_sourcePath, fileName);

            if (File.Exists(fullPath))
            {
                resolved.Add(fullPath);
            }
            else
            {
                _logger.LogWarning("Configured data file not found in source directory: {FileName}", fileName);
            }
        }

        return resolved;
    }
}
