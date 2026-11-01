using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;

namespace server.Controllers;

[ApiController]
[Route("api/players/{playerId:int}/achievements")]
public sealed class AchievementsController(GameDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AchievementResponse>>> Get(int playerId, CancellationToken ct)
    {
        if (!await db.Players.AnyAsync(player => player.Id == playerId, ct)) return NotFound();

        var achievements = await db.Achievements.AsNoTracking().OrderBy(item => item.Id).ToListAsync(ct);
        var orderCount = await db.Orders.CountAsync(order => order.PlayerId == playerId, ct);
        var correctCount = await db.Orders.CountAsync(order => order.PlayerId == playerId && order.IsCorrect, ct);
        var goals = await db.GameHistories.CountAsync(entry => entry.PlayerId == playerId && entry.ActionType == "FootballGoal", ct);
        var viralScore = await db.Players.Where(player => player.Id == playerId).Select(player => player.ViralScore).SingleAsync(ct);
        var revenueEntries = await db.GameHistories.AsNoTracking()
            .Where(entry => entry.PlayerId == playerId && entry.MoneyChange > 0)
            .Select(entry => entry.MoneyChange)
            .ToListAsync(ct);
        var revenue = revenueEntries.Sum();
        var dramaCount = await db.GameHistories.CountAsync(entry => entry.PlayerId == playerId && entry.ActionType == "DramaEventResolved", ct);

        var results = achievements.Select(achievement =>
        {
            var current = achievement.Code switch
            {
                "FIRST_BOWL" or "BOWLS_10" or "BOWLS_100" or "BOWLS_500" => orderCount,
                "ACCURATE_10" or "ACCURATE_50" => correctCount,
                "GOAL_1" or "GOAL_10" => goals,
                "MONEY_100K" or "MONEY_1M" => (int)Math.Min(int.MaxValue, revenue),
                "VIRAL_100" or "VIRAL_1K" or "VIRAL_5K" => viralScore,
                "DRAMA_1" or "DRAMA_10" => dramaCount,
                _ => achievement.CurrentValue
            };
            var unlocked = current >= achievement.TargetValue;
            return new AchievementResponse(
                achievement.Id,
                achievement.Name,
                achievement.Description,
                achievement.Code,
                achievement.TargetValue,
                current,
                unlocked,
                unlocked ? achievement.UnlockedAt ?? DateTime.UtcNow : null);
        }).ToList();

        return Ok(results);
    }
}
