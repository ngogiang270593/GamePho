using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;

namespace server.Controllers;

[ApiController]
[Route("api/players/{playerId:int}")]
public sealed class StatisticsController(GameDbContext db) : ControllerBase
{
    [HttpGet("statistics")]
    public async Task<ActionResult<GameStatisticsResponse>> GetStatistics(int playerId, CancellationToken ct)
    {
        if (!await db.Players.AnyAsync(player => player.Id == playerId, ct)) return NotFound();

        var orders = await db.Orders.AsNoTracking()
            .Where(order => order.PlayerId == playerId)
            .Select(order => new { order.IsCorrect, order.CreatedAt })
            .ToListAsync(ct);
        var history = await db.GameHistories.AsNoTracking()
            .Where(entry => entry.PlayerId == playerId)
            .Select(entry => new { entry.ActionType, entry.MoneyChange })
            .ToListAsync(ct);
        var level = await db.Players.Where(player => player.Id == playerId).Select(player => player.Level).SingleAsync(ct);
        var servedDays = orders.Where(order => order.IsCorrect)
            .Select(order => DateOnly.FromDateTime(order.CreatedAt))
            .ToHashSet();
        var streak = 0;
        for (var date = DateOnly.FromDateTime(DateTime.UtcNow); servedDays.Contains(date); date = date.AddDays(-1)) streak++;

        return Ok(new GameStatisticsResponse(
            orders.Count,
            orders.Count(order => order.IsCorrect),
            history.Where(entry => entry.MoneyChange > 0).Sum(entry => entry.MoneyChange),
            history.Count(entry => entry.ActionType == "FootballGoal"),
            streak,
            level));
    }

    [HttpGet("history/orders")]
    public async Task<ActionResult<IReadOnlyList<OrderHistoryResponse>>> GetOrderHistory(
        int playerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (!await db.Players.AnyAsync(player => player.Id == playerId, ct)) return NotFound();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var orders = await db.Orders.AsNoTracking()
            .Where(order => order.PlayerId == playerId)
            .OrderByDescending(order => order.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(order => new OrderHistoryResponse(
                order.Id,
                order.Customer == null ? "Khách trong hẻm" : order.Customer.Name,
                order.PhoType.ToString(),
                order.Toppings,
                order.Price,
                order.IsCorrect,
                order.ServiceTimeSeconds,
                order.CreatedAt))
            .ToListAsync(ct);

        return Ok(orders);
    }

    [HttpGet("history/events")]
    public async Task<ActionResult<IReadOnlyList<EventHistoryResponse>>> GetEventHistory(
        int playerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (!await db.Players.AnyAsync(player => player.Id == playerId, ct)) return NotFound();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var events = await db.GameHistories.AsNoTracking()
            .Where(entry => entry.PlayerId == playerId && entry.ActionType.Contains("Event"))
            .OrderByDescending(entry => entry.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(entry => new EventHistoryResponse(
                entry.Id,
                entry.ActionType,
                entry.Summary,
                entry.MoneyChange,
                entry.ReputationChange,
                entry.ViralChange,
                entry.CreatedAt))
            .ToListAsync(ct);

        return Ok(events);
    }

    [HttpGet("history/revenue")]
    public async Task<ActionResult<IReadOnlyList<RevenueHistoryResponse>>> GetRevenueHistory(
        int playerId,
        [FromQuery] int days = 30,
        CancellationToken ct = default)
    {
        if (!await db.Players.AnyAsync(player => player.Id == playerId, ct)) return NotFound();
        days = Math.Clamp(days, 1, 365);
        var since = DateTime.UtcNow.Date.AddDays(-days + 1);
        var entries = await db.GameHistories.AsNoTracking()
            .Where(entry => entry.PlayerId == playerId && entry.CreatedAt >= since && entry.MoneyChange > 0)
            .Select(entry => new { entry.CreatedAt, entry.MoneyChange })
            .ToListAsync(ct);
        var revenue = entries
            .GroupBy(entry => DateOnly.FromDateTime(entry.CreatedAt))
            .OrderBy(group => group.Key)
            .Select(group => new RevenueHistoryResponse(group.Key.ToString("yyyy-MM-dd"), group.Sum(entry => entry.MoneyChange)))
            .ToList();

        return Ok(revenue);
    }
}
