using server.Data;
using server.Models;

namespace server.Services;

public sealed class HistoryService(GameDbContext db)
{
    public async Task RecordAsync(
        int playerId,
        string actionType,
        string summary,
        decimal moneyChange,
        int reputationChange,
        int viralChange,
        int? relatedId = null,
        CancellationToken ct = default)
    {
        db.GameHistories.Add(new GameHistory
        {
            PlayerId = playerId,
            ActionType = actionType,
            Summary = summary,
            MoneyChange = moneyChange,
            ReputationChange = reputationChange,
            ViralChange = viralChange,
            RelatedId = relatedId,
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
    }
}
