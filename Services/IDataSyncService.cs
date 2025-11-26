namespace Horizon.Services;

public interface IDataSyncService
{
    Task TriggerSyncAsync(CancellationToken cancellationToken = default);
}
