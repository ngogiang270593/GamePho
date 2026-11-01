using System.Collections.Concurrent;

namespace server.Services;

// Tick, handoff, choices and closing use the same gate so a customer is charged once.
public static class GameActionLock
{
    private static readonly ConcurrentDictionary<int, SemaphoreSlim> Gates = new();
    public static async Task<IDisposable> Enter(int playerId, CancellationToken ct = default)
    {
        var gate = Gates.GetOrAdd(playerId, _ => new(1, 1));
        await gate.WaitAsync(ct);
        return new Release(gate);
    }
    private sealed class Release(SemaphoreSlim gate) : IDisposable { public void Dispose() => gate.Release(); }
}
