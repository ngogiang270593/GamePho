using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models.Enums;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/game-state")]
public sealed class GameStateController(GameDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<GameStateResponse>> Get([FromQuery] int? playerId, CancellationToken ct)
    {
        using var gate = await GameActionLock.Enter(playerId ?? 1, ct);
        var player = await db.Players.AsNoTracking()
            .OrderBy(item => item.Id)
            .FirstOrDefaultAsync(item => !playerId.HasValue || item.Id == playerId.Value, ct);
        if (player is null) return NotFound();

        var dailySpecialType = (PhoType)((player.CurrentDay - 1) % Enum.GetValues<PhoType>().Length);
        var response = new GameStateResponse
        {
            Player = new PlayerStateDto
            {
                Id = player.Id,
                DisplayName = player.DisplayName,
                Money = player.Money,
                Reputation = player.Reputation,
                ViralScore = player.ViralScore,
                Level = ProgressionService.GetLevel(player.ViralScore),
                CurrentDay = player.CurrentDay,
                CustomersServedToday = player.CustomersServedToday,
                ViralProgress = ProgressionService.GetViralProgress(player.ViralScore),
                ViralToNextLevel = ProgressionService.GetViralToNextLevel(player.ViralScore)
            },
            WaitingCustomers = await db.Customers.AsNoTracking()
                .Where(customer => !customer.IsServed && !customer.HasLeft)
                .Select(customer => new CustomerStateDto
                {
                    Id = customer.Id,
                    Name = customer.Name,
                    CustomerType = customer.CustomerType,
                    Hunger = customer.Hunger,
                    Patience = customer.Patience,
                    PreferredPhoType = customer.PreferredPhoType,
                    RequiredToppings = customer.RequiredToppings,
                    ArrivedAt = customer.ArrivedAt,
                    Dialogue = customer.Description
                })
                .ToListAsync(ct),
            Menu = await db.PhoMenuItems.AsNoTracking()
                .Where(item => item.IsAvailable)
                .Select(item => new PhoMenuItemStateDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    PhoType = item.PhoType,
                    BasePrice = item.BasePrice,
                    IsAvailable = item.IsAvailable,
                    IsDailySpecial = item.PhoType == dailySpecialType,
                    Description = item.Description
                })
                .ToListAsync(ct),
            Upgrades = await db.Upgrades.AsNoTracking()
                .OrderBy(item => item.Name).ThenBy(item => item.Level)
                .Select(item => new UpgradeResponse(item.Id, item.Name, item.Description, item.Category.ToString(), item.Level, item.MaxLevel, item.Cost, item.EffectValue, item.IsPurchased))
                .ToListAsync(ct),
            PurchasedUpgrades = await db.Upgrades.AsNoTracking()
                .Where(item => item.IsPurchased)
                .Select(item => new UpgradeStateDto { Id = item.Id, Name = item.Name, Level = item.Level, MaxLevel = item.MaxLevel, IsPurchased = item.IsPurchased })
                .ToListAsync(ct),
            Achievements = await db.Achievements.AsNoTracking()
                .Select(item => new AchievementStateDto { Id = item.Id, Name = item.Name, Description = item.Description, Code = item.Code, TargetValue = item.TargetValue, CurrentValue = item.CurrentValue, IsUnlocked = item.IsUnlocked, UnlockedAt = item.UnlockedAt })
                .ToListAsync(ct),
            UnlockedFeatures = ProgressionService.GetUnlockedFeatures(player.Level)
                .Select(feature => new FeatureUnlockDto(feature.Level, feature.Name, feature.Description))
                .ToList()
        };

        var journeyService = new JourneyService(db);
        var (_, journey) = await journeyService.LoadAsync(player.Id, ct);
        response.Journey = journeyService.View(journey);
        response.WaitingCustomers = await journeyService.WaitingAsync(journey, ct);
        response.RandomEvents = await journeyService.EventsAsync(journey, ct);
        return Ok(response);
    }
}
