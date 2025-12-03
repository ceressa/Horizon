using System.Threading;
using System.Threading.Tasks;

namespace Horizon.Services
{
    public interface IDataSyncService
    {
        Task TriggerSyncAsync(CancellationToken cancellationToken = default);
    }
}
