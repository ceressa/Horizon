using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Horizon.Services;

public class DataSyncService : IHostedService, IDisposable
{
    private readonly ILogger<DataSyncService> _logger;
    private readonly string _sourcePath;
    private readonly string _targetPath;
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
}
