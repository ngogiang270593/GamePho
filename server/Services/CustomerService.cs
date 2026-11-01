using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using server.Models.Enums;

namespace server.Services;

public sealed class CustomerService(GameDbContext db)
{
    private const int MaxCustomers = 10;

    public async Task<IReadOnlyList<Customer>> GenerateCustomersAsync(int playerId, CancellationToken ct = default)
    {
        var player = await db.Players.AsNoTracking().SingleOrDefaultAsync(x => x.Id == playerId, ct)
            ?? throw new InvalidOperationException("Không tìm thấy người chơi.");
        var activeCount = await db.Customers.CountAsync(x => !x.IsServed && !x.HasLeft, ct);
        var baseDailyLimit = Math.Min(MaxCustomers, Math.Max(3, player.CurrentDay + 2));
        var capacityIncrease = await db.Upgrades
            .Where(x => x.Name == "Nồi nước dùng lớn" && x.IsPurchased)
            .MaxAsync(x => (int?)x.EffectValue, ct) ?? 0;
        var dailyLimit = baseDailyLimit + capacityIncrease;
        var amount = Math.Max(0, dailyLimit - player.CustomersServedToday - activeCount);
        if (amount == 0) return await db.Customers.Where(x => !x.IsServed && !x.HasLeft).ToListAsync(ct);

        var dishes = await db.PhoMenuItems.Where(x => x.IsAvailable).ToListAsync(ct);
        var toppings = await db.Toppings.Where(x => x.IsAvailable && x.Name != "Khăn lạnh").ToListAsync(ct);
        if (dishes.Count == 0) throw new InvalidOperationException("Chưa có món phở khả dụng.");

        var types = Enum.GetValues<CustomerType>();
        var created = new List<Customer>();
        var journeyRow = await db.GameJourneys.AsNoTracking().SingleOrDefaultAsync(x => x.PlayerId == playerId, ct);
        var memories = journeyRow is null ? new JourneyProgress() : JsonSerializer.Deserialize<JourneyProgress>(journeyRow.StateJson) ?? new();
        var loyalKey = memories.Kitchen.Regulars.Where(x => x.Value.GoodOrders > 0).OrderByDescending(x => x.Value.Helped).ThenBy(x => x.Value.GiftClaimedDay).Select(x => x.Key).FirstOrDefault();
        var recent = await db.Customers.OrderByDescending(x => x.Id).Take(12).Select(x => x.Name).ToListAsync(ct);
        var shuffledTypes = types.OrderBy(_ => Random.Shared.Next()).ToArray();
        for (var i = 0; i < amount; i++)
        {
            var type = shuffledTypes[i % shuffledTypes.Length];
            var dish = dishes[Random.Shared.Next(dishes.Count)];
            var difficulty = Math.Min(35, Math.Max(0, player.CurrentDay - 1) * 3 + Math.Max(0, player.Level - 1) * 2);
            var basePatience = Math.Max(20, 75 - difficulty + Random.Shared.Next(-8, 9));
            var required = toppings.Count == 0 ? "" : string.Join(',', toppings.OrderBy(_ => Random.Shared.Next()).Take(Random.Shared.Next(1, Math.Min(3, toppings.Count) + 1)).Select(x => x.Name));
            var definition = CustomerTypeCatalog.Definitions[type];
            if (type == CustomerType.KhachVip && player.Level < 3) type = CustomerType.HangXom;
            definition = CustomerTypeCatalog.Definitions[type];
            var persona = CustomerCast.All.Where(x => x.Type == type).OrderBy(x => created.Count(c => c.Name == x.Name)).ThenBy(x => recent.Contains(x.Name) ? 1 : 0).ThenBy(_ => Random.Shared.Next()).First();
            if (i == 0 && loyalKey is not null && CustomerCast.Find(loyalKey) is { } loyal) { persona = loyal; type = loyal.Type; }
            basePatience = Math.Max(25, basePatience + persona.PatienceBonus);
            if (persona.Key is "bo" or "co-hanh") required = string.Join(',', required.Split(',').Where(x => !x.Contains("hành", StringComparison.OrdinalIgnoreCase)));
            if (persona.Key == "bo") required = string.Join(',', required.Split(',').Where(x => !x.Contains("ớt", StringComparison.OrdinalIgnoreCase) && !x.Contains("Sa tế", StringComparison.OrdinalIgnoreCase) && !x.Contains("Tiêu", StringComparison.OrdinalIgnoreCase)));
            created.Add(new Customer { Name = persona.Name, CustomerType = type, Avatar = persona.Key, Hunger = Math.Min(100, 45 + player.CurrentDay * 3 + Random.Shared.Next(0, 31)), Patience = basePatience, BasePatience = basePatience, PreferredPhoType = dish.PhoType, RequiredToppings = required, IsServed = false, ArrivedAt = DateTime.UtcNow, Description = persona.Greeting, Behavior = definition.Behavior });
        }
        db.Customers.AddRange(created);
        await db.SaveChangesAsync(ct);
        return created;
    }

}
