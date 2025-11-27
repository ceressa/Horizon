using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Horizon.Services
{
    /// <summary>
    /// Copies Excel files from the ServiceNow drop folder into the publish data folder.
    /// Runs hourly and can also be triggered manually.
    /// </summary>
    public class DataSyncService : IHostedService, IDataSyncService, IDisposable
    {
        private readonly ILogger<DataSyncService> _logger;
        private readonly string _sourcePath;
        private readonly string _targetPath;
        private readonly List<string> _fileNames;
        private readonly SemaphoreSlim _syncLock = new SemaphoreSlim(1, 1);
        private static readonly TimeSpan SyncInterval = TimeSpan.FromHours(1);

        private Timer? _timer;

        public DataSyncService(IOptions<DataSyncOptions> options, IWebHostEnvironment environment, ILogger<DataSyncService> logger)
        {
            _logger = logger;

            var syncOptions = options.Value ?? new DataSyncOptions();
            _sourcePath = syncOptions.SourcePath ?? Path.Combine(environment.ContentRootPath, "Data");
            _targetPath = syncOptions.TargetPath ?? Path.Combine(environment.ContentRootPath, "publish", "Data");
            _fileNames = syncOptions.FileNames?
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(Path.GetFileName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList() ?? new List<string>();
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("DataSyncService starting. Source: {Source}, Target: {Target}, Interval: {Interval}", _sourcePath, _targetPath, SyncInterval);
            _ = TriggerSyncInternalAsync("startup", cancellationToken);
            StartTimer();
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
            _syncLock.Dispose();
        }

        public Task TriggerSyncAsync(CancellationToken cancellationToken = default)
        {
            return TriggerSyncInternalAsync("manual", cancellationToken);
        }

        private void StartTimer()
        {
            _timer?.Dispose();
            _timer = new Timer(async _ => await RunScheduledSyncAsync(), null, SyncInterval, SyncInterval);
            _logger.LogInformation("Recurring data sync timer started. Next run at ~{NextRun}.", DateTime.Now + SyncInterval);
        }

        private Task RunScheduledSyncAsync()
        {
            return TriggerSyncInternalAsync("scheduled");
        }

        private async Task TriggerSyncInternalAsync(string reason, CancellationToken cancellationToken = default)
        {
            if (!await _syncLock.WaitAsync(0, cancellationToken).ConfigureAwait(false))
            {
                _logger.LogWarning("Data sync skipped ({Reason}) because a sync is already in progress.", reason);
                return;
            }

            try
            {
                _logger.LogInformation("Starting data sync ({Reason}).", reason);
                await CopyDataAsync(cancellationToken).ConfigureAwait(false);
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

            foreach (var file in files)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var fileName = Path.GetFileName(file);
                var destinationPath = Path.Combine(_targetPath, fileName);

                try
                {
                    using (var sourceStream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    using (var destinationStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.Read))
                    {
                        await sourceStream.CopyToAsync(destinationStream, cancellationToken).ConfigureAwait(false);
                    }

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
}
