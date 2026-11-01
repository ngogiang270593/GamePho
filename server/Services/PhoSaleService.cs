using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Services;

public sealed class PhoSaleService(GameDbContext db)
{
    public const int DurationSeconds = 60;

    public static async Task FailAsync(GameDbContext db, int playerId, GameJourney row, JourneyProgress state, CancellationToken ct)
    {
        var id = state.ActiveSaleCustomerId;
        state.ActiveSaleCustomerId = null; state.SaleDeadlineUtc = null;
        if (id is null) return;
        var customer = await db.Customers.FindAsync([id.Value], ct);
        if (customer is not null && !customer.IsServed && !customer.HasLeft)
        {
            customer.HasLeft = true; state.DayLost++; state.Combo = 0;
            var player = (await db.Players.FindAsync([playerId], ct))!;
            player.Reputation = Math.Max(0, player.Reputation - 2);
            db.GameHistories.Add(new GameHistory { PlayerId = playerId, ActionType = "PhoFailed", RelatedId = id,
                Summary = $"Tô phở của {customer.Name} thất bại: hết thời gian hoặc rời quán.", ReputationChange = -2 });
        }
        state.WaitSeconds.Remove(id.Value); state.Arrivals.Remove(id.Value);
        JourneyService.Write(row, state);
        await db.SaveChangesAsync(ct);
    }

    public async Task<object> BeginAsync(int customerId, CancellationToken ct)
    {
        using var gate = await GameActionLock.Enter(1, ct);
        var journey = new JourneyService(db);
        var (row, state) = await journey.LoadAsync(1, ct);
        // An interrupted attempt cannot be restarted by reloading or returning to the shop.
        if (state.ActiveSaleCustomerId is not null) await FailAsync(db, 1, row, state, ct);
        var customer = await db.Customers.FindAsync([customerId], ct);
        if (customer is null || customer.IsServed || customer.HasLeft || !state.IsOpen || state.Arrivals.GetValueOrDefault(customerId, double.MaxValue) > state.Minute)
            throw new InvalidOperationException("Khách đã rời quán hoặc lượt bán trước đã thất bại.");
        state.ActiveSaleCustomerId = customerId;
        state.SaleDeadlineUtc = DateTime.UtcNow.AddSeconds(DurationSeconds);
        JourneyService.Write(row, state); await db.SaveChangesAsync(ct);
        return new { customerId, deadlineUtc = state.SaleDeadlineUtc, durationSeconds = DurationSeconds };
    }

    public async Task EndAsync(int customerId, CancellationToken ct)
    {
        using var gate = await GameActionLock.Enter(1, ct);
        var (row, state) = await new JourneyService(db).LoadAsync(1, ct);
        if (state.ActiveSaleCustomerId == customerId) await FailAsync(db, 1, row, state, ct);
    }
}
