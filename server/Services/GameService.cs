using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.Enums;

namespace server.Services;

public sealed class GameService(GameDbContext db, CustomerService customerService)
{
    public async Task<object?> GetGameStateAsync(int playerId, CancellationToken ct = default) {
        var p = await db.Players.AsNoTracking().SingleOrDefaultAsync(x => x.Id == playerId, ct);
        return p is null ? null : new { player = p, customers = await db.Customers.AsNoTracking().Where(x => !x.IsServed && !x.HasLeft).ToListAsync(ct), menu = await db.PhoMenuItems.AsNoTracking().Where(x => x.IsAvailable).ToListAsync(ct), upgrades = await db.Upgrades.AsNoTracking().ToListAsync(ct) };
    }
    public async Task<Player?> StartNewDayAsync(int id, CancellationToken ct = default) {
        await StartDayAsync(id, ct);
        return await db.Players.FindAsync([id], ct);
    }
    public async Task<bool> ResetGameAsync(int id, CancellationToken ct = default) {
        using var gate = await GameActionLock.Enter(id, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var p = await db.Players.FindAsync([id], ct); if (p is null) return false;
        p.Money = 500000; p.Reputation = 50; p.ViralScore = p.DramaScore = p.CustomersServedToday = 0; p.Level = p.CurrentDay = 1; p.UpdatedAt = DateTime.UtcNow;
        var journey = await db.GameJourneys.FindAsync([id], ct);
        if (journey is not null) {
            var s = JsonSerializer.Deserialize<JourneyProgress>(journey.StateJson);
            if (s is not null) await db.RandomEvents.Where(e => s.PendingEvents.Contains(e.Id)).ExecuteUpdateAsync(x => x.SetProperty(e => e.IsActive, false), ct);
            db.GameJourneys.Remove(journey);
        }
        await db.Orders.Where(x => x.PlayerId == id).ExecuteDeleteAsync(ct);
        await db.GameHistories.Where(x => x.PlayerId == id).ExecuteDeleteAsync(ct);
        await db.Upgrades.ExecuteUpdateAsync(x => x.SetProperty(u => u.IsPurchased, false), ct);
        await db.Achievements.ExecuteUpdateAsync(x => x.SetProperty(a => a.CurrentValue, 0).SetProperty(a => a.IsUnlocked, false).SetProperty(a => a.UnlockedAt, (DateTime?)null), ct);
        await db.Customers.ExecuteUpdateAsync(x => x.SetProperty(c => c.IsServed, false).SetProperty(c => c.HasLeft, true), ct);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct); return true;
    }
    public async Task<Player?> UpdatePlayerAsync(int id, CancellationToken ct = default) {
        var p = await db.Players.FindAsync([id], ct); if (p is null) return null;
        p.Level = ProgressionService.GetLevel(p.ViralScore); p.Reputation = Math.Clamp(p.Reputation, 0, 100); p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct); return p;
    }
    public Task<Player?> ApplyRewardAsync(int id, decimal m, int r, int v, CancellationToken ct = default) => ApplyChangeAsync(id, Math.Abs(m), Math.Abs(r), Math.Abs(v), ct);
    public Task<Player?> ApplyPenaltyAsync(int id, decimal m, int r, int v, CancellationToken ct = default) => ApplyChangeAsync(id, -Math.Abs(m), -Math.Abs(r), -Math.Abs(v), ct);
    private async Task<Player?> ApplyChangeAsync(int id, decimal m, int r, int v, CancellationToken ct) {
        using var gate = await GameActionLock.Enter(id, ct);
        var p = await db.Players.FindAsync([id], ct); if (p is null) return null;
        p.Money = Math.Max(0, p.Money + m); p.Reputation = Math.Clamp(p.Reputation + r, 0, 100); p.ViralScore = Math.Max(0, p.ViralScore + v); p.Level = ProgressionService.GetLevel(p.ViralScore); p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct); return p;
    }

    public async Task<CreateOrderResponse> CreateOrderAsync(int playerId, CreateOrderRequest req, CancellationToken ct = default, bool kitchenTransaction = false) {
        using var gate = kitchenTransaction ? null : await GameActionLock.Enter(playerId, ct);
        await using var tx = kitchenTransaction ? null : await db.Database.BeginTransactionAsync(ct);
        var p = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException("Không tìm thấy người chơi.");
        var c = await db.Customers.FindAsync([req.CustomerId], ct) ?? throw new KeyNotFoundException("Không tìm thấy khách hàng.");
        if (c.IsServed || c.HasLeft) throw new InvalidOperationException("Khách đã rời bàn hoặc đã được phục vụ. Đón khách tiếp theo nhé.");
        if (!kitchenTransaction)
        {
            var activeKitchen = await db.GameJourneys.FindAsync([playerId], ct);
            if (activeKitchen is not null && JsonSerializer.Deserialize<JourneyProgress>(activeKitchen.StateJson)?.Kitchen.Session is not null)
                throw new InvalidOperationException("Đơn trong ca bếp phải được nấu và phục vụ qua hai chỗ đặt tô.");
        }
        if (req.ServiceTimeSeconds < 0) throw new InvalidOperationException("Thời gian phục vụ không hợp lệ.");
        var pho = await db.PhoMenuItems.OrderBy(x => x.Id).FirstOrDefaultAsync(x => x.PhoType == req.PhoType && x.IsAvailable, ct) ?? throw new InvalidOperationException("Món phở không khả dụng.");
        var capacity = await db.Upgrades.Where(x => x.Name == "Nồi nước dùng lớn" && x.IsPurchased).MaxAsync(x => (int?)x.EffectValue, ct) ?? 0;
        var normalCapacity = Math.Min(10, Math.Max(3, p.CurrentDay + 2)) + capacity;
        static string[] Parts(string text) => text.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct(StringComparer.OrdinalIgnoreCase).Order(StringComparer.OrdinalIgnoreCase).ToArray();
        var actual = Parts(req.Toppings); var expected = Parts(c.RequiredToppings);
        if (actual.Length > 5) throw new InvalidOperationException("Mỗi tô dùng tối đa 5 topping.");
        var validToppings = await db.Toppings.Where(x => x.IsAvailable && x.Name != "Khăn lạnh").ToListAsync(ct);
        if (actual.Any(name => validToppings.All(t => !string.Equals(name, t.Name, StringComparison.OrdinalIgnoreCase)))) throw new InvalidOperationException("Topping không có trong bếp.");
        var journeyRow = await db.GameJourneys.FindAsync([playerId], ct);
        var journey = journeyRow is null ? null : JsonSerializer.Deserialize<JourneyProgress>(journeyRow.StateJson);
        var dailyCapacity = journey is null ? normalCapacity : Math.Max(normalCapacity, p.CustomersServedToday + journey.Arrivals.Count);
        if (p.CustomersServedToday >= dailyCapacity) throw new InvalidOperationException("Quán đã phục vụ hết số khách tối đa trong ngày.");
        if (journey is not null && (!journey.IsOpen || journey.Arrivals.GetValueOrDefault(c.Id, double.MaxValue) > journey.Minute || journey.WaitSeconds.GetValueOrDefault(c.Id) <= 0))
            throw new InvalidOperationException("Khách đã hết kiên nhẫn hoặc chưa đến quán. Hãy đón khách tiếp theo.");
        if (journey?.ActiveSaleCustomerId == c.Id && journey.SaleDeadlineUtc <= DateTime.UtcNow)
        {
            await PhoSaleService.FailAsync(db, playerId, journeyRow!, journey, ct);
            if (tx is not null) await tx.CommitAsync(ct);
            throw new InvalidOperationException("Hết thời gian: tô phở này đã thất bại.");
        }
        var speed = await db.Upgrades.Where(x => x.Name == "Bếp nấu nhanh" && x.IsPurchased).MaxAsync(x => (int?)x.EffectValue, ct) ?? 0;
        if (journey?.Boon == "stove") speed += 2;
        var effectiveTime = Math.Max(0, req.ServiceTimeSeconds - speed);
        var correct = (!c.PreferredPhoType.HasValue || c.PreferredPhoType == req.PhoType) && actual.SequenceEqual(expected, StringComparer.OrdinalIgnoreCase);
        var rep = correct ? 2 : -3; var viral = correct ? 1 : 0;
        var special = correct && pho.PhoType == (PhoType)((p.CurrentDay - 1) % Enum.GetValues<PhoType>().Length) ? 5000m : 0m;
        var speedBonus = correct && effectiveTime < 8 ? 5000m : 0m;
        var bonus = special + speedBonus;
        var persona = CustomerCast.Find(c.Avatar);
        var message = correct ? persona?.Happy ?? OrderFeedback.Correct() : persona?.Unhappy ?? OrderFeedback.Incorrect();
        var dramaTriggered = !correct && Random.Shared.Next(100) < (c.CustomerType is CustomerType.BaTam or CustomerType.TikToker ? 60 : 25);
        RandomEvent? drama = null;
        if (dramaTriggered) {
            drama = new RandomEvent { Title = "Tô phở gây sóng gió", Description = c.Name + ": " + message, EventType = EventType.Customer, IsActive = true,
                Options = [new() { Text = "Xin lỗi và làm lại", MoneyChange = -10000, ReputationChange = 2, ResultText = "Khách nguôi giận. Cô Tám cập nhật: hiểu lầm đã được nêm lại vừa miệng." },
                    new() { Text = "Mời khách ly trà, nghe góp ý", MoneyChange = -5000, ReputationChange = 1, ResultText = "Trà mát làm dịu chuyện nóng. Khách vui vì được lắng nghe." }] };
            db.RandomEvents.Add(drama);
            await db.SaveChangesAsync(ct); // Obtain the event id inside the same transaction.
        }
        var comboBonus = await new JourneyService(db).RecordOrderAsync(playerId, c, correct, drama, ct);
        bonus += comboBonus;
        if (comboBonus > 0) message += " Chuỗi 3 tô đúng món: +3.000đ!";
        var extra = validToppings.Where(t => actual.Contains(t.Name, StringComparer.OrdinalIgnoreCase)).Sum(t => t.Price);
        var o = new Order { PlayerId = playerId, CustomerId = c.Id, PhoType = req.PhoType, Toppings = string.Join(',', actual), Price = pho.BasePrice + extra, IsCorrect = correct, ServiceTimeSeconds = effectiveTime, ReputationChange = rep, ViralChange = viral };
        c.IsServed = true; db.Orders.Add(o); p.CustomersServedToday++; p.Money += correct ? o.Price + bonus : 0;
        p.Reputation = Math.Clamp(p.Reputation + rep, 0, 100); p.ViralScore += viral; p.Level = ProgressionService.GetLevel(p.ViralScore); p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct); if (tx is not null) await tx.CommitAsync(ct);
        return new() { Id = o.Id, Price = o.Price, IsCorrect = correct, ReputationChange = rep, ViralChange = viral, CreatedAt = o.CreatedAt, RequestedServiceTimeSeconds = req.ServiceTimeSeconds,
            EffectiveServiceTimeSeconds = effectiveTime, ServiceTimeReductionSeconds = speed, BonusMoney = bonus, MoneyChange = correct ? o.Price + bonus : 0, DramaTriggered = dramaTriggered, Message = message };
    }

    public async Task<StartDayResponse?> StartDayAsync(int id, CancellationToken ct = default) {
        using var gate = await GameActionLock.Enter(id, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var p = await db.Players.FindAsync([id], ct); if (p is null) return null;
        var service = new JourneyService(db);
        var (row, s) = await service.LoadAsync(id, ct);
        if (s.IsOpen || await db.Customers.AnyAsync(c => !c.IsServed && !c.HasLeft, ct)) throw new InvalidOperationException("Hãy tổng kết ngày đang mở trước khi mở cửa lần nữa.");
        if (s.CompletedDays >= 7) throw new InvalidOperationException("Xem kết thúc và chọn chơi tiếp mùa mới trong nhật ký nhé.");
        var before = p.Money;
        if (s.CompletedDays > 0 || s.Season > 1) p.CurrentDay++;
        p.CustomersServedToday = 0; var cost = Math.Min(p.Money, 5000 + p.CurrentDay * 2500); p.Money -= cost; p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        var customers = (await customerService.GenerateCustomersAsync(id, ct)).ToList();
        if (s.Kitchen.ReferralPending && customers.Count > 0)
        {
            var source = customers[0];
            var referral = new Customer { Name = "Khách được bạn quen giới thiệu", Avatar = "", CustomerType = source.CustomerType,
                PreferredPhoType = source.PreferredPhoType, RequiredToppings = source.RequiredToppings, Hunger = 70, Patience = 100, BasePatience = 100,
                Description = "Nghe bạn kể quán phục vụ năm tô liên tiếp rất tốt, tôi ghé thử đây!", ArrivedAt = DateTime.UtcNow };
            db.Customers.Add(referral); await db.SaveChangesAsync(ct); customers.Add(referral); s.Kitchen.ReferralPending = false;
        }
        JourneyService.PrepareDay(s, customers, before); KitchenService.PrepareDay(s, customers); JourneyService.Write(row, s);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return new() { CurrentDay = p.CurrentDay, OperatingCost = cost, RemainingMoney = p.Money, Customers = (await service.WaitingAsync(s, ct)).Cast<object>().ToArray(),
            Message = "Mở cửa: " + JourneyContent.Theme(s).Title + ". Khách đến theo đợt, nồi phở đã sẵn sàng!" };
    }

    public async Task<object?> ExpireCustomersAsync(int playerId, CancellationToken ct = default) {
        if (await db.GameJourneys.AnyAsync(x => x.PlayerId == playerId, ct)) return await new JourneyService(db).TickAsync(playerId, 0, ct);
        using var gate = await GameActionLock.Enter(playerId, ct);
        var p = await db.Players.FindAsync([playerId], ct); if (p is null) return null;
        var now = DateTime.UtcNow;
        var waiting = await db.Customers.Where(c => !c.IsServed && !c.HasLeft).ToListAsync(ct);
        var expired = waiting.Where(c => c.ArrivedAt > DateTime.MinValue && (now - c.ArrivedAt).TotalSeconds >= c.Patience).ToList();
        foreach (var c in expired) c.HasLeft = true;
        p.Reputation = Math.Max(0, p.Reputation - expired.Count * 2);
        p.DramaScore += expired.Count(c => c.CustomerType is CustomerType.BaTam or CustomerType.TikToker);
        await db.SaveChangesAsync(ct);
        return new { expiredCustomerIds = expired.Select(c => c.Id), reputation = p.Reputation, message = expired.Count > 0 ? "Khách đã rời quán. Mình đón khách sau thật chu đáo nhé." : "Khách vẫn đang đợi." };
    }

    public async Task<RandomEventResponse?> GetRandomEventAsync(CancellationToken ct = default) {
        using var gate = await GameActionLock.Enter(1, ct);
        var service = new JourneyService(db); var (_, s) = await service.LoadAsync(1, ct);
        return (await service.EventsAsync(s, ct)).FirstOrDefault();
    }
    public async Task<ResolveEventResponse> ResolveEventAsync(int playerId, ResolveEventRequest request, CancellationToken ct = default) {
        using var gate = await GameActionLock.Enter(playerId, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var player = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException("Không tìm thấy người chơi.");
        var item = await db.RandomEvents.Include(e => e.Options).SingleOrDefaultAsync(e => e.Id == request.EventId, ct) ?? throw new KeyNotFoundException("Không tìm thấy sự kiện.");
        if (!item.IsActive) throw new InvalidOperationException("Sự kiện đã kết thúc.");
        var option = item.Options.SingleOrDefault(o => o.Id == request.OptionId) ?? throw new InvalidOperationException("Lựa chọn không thuộc sự kiện này.");
        var beforeMoney = player.Money; var beforeReputation = player.Reputation; var beforeViral = player.ViralScore;
        await new JourneyService(db).RecordChoiceAsync(playerId, item, option, ct);
        player.Money = Math.Max(0, player.Money + option.MoneyChange); player.Reputation = Math.Clamp(player.Reputation + option.ReputationChange, 0, 100);
        player.ViralScore = Math.Max(0, player.ViralScore + option.ViralChange); player.Level = ProgressionService.GetLevel(player.ViralScore); player.UpdatedAt = DateTime.UtcNow;
        item.IsActive = false; await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return new(option.ResultText, player.Money, player.Reputation, player.ViralScore, player.Money-beforeMoney, player.Reputation-beforeReputation, player.ViralScore-beforeViral, item.Title == "Tô phở gây sóng gió");
    }

    public async Task<IReadOnlyList<UpgradeResponse>> GetUpgradesAsync(CancellationToken ct = default) => await db.Upgrades.AsNoTracking().OrderBy(x => x.Name).ThenBy(x => x.Level).Select(x => new UpgradeResponse(x.Id, x.Name, x.Description, x.Category.ToString(), x.Level, x.MaxLevel, x.Cost, x.EffectValue, x.IsPurchased)).ToListAsync(ct);
    public async Task<UpgradeResponse> BuyUpgradeAsync(int playerId, BuyUpgradeRequest request, CancellationToken ct = default) {
        using var gate = await GameActionLock.Enter(playerId, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var player = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException("Không tìm thấy người chơi.");
        var selected = await db.Upgrades.FindAsync([request.UpgradeId], ct) ?? throw new KeyNotFoundException("Không tìm thấy nâng cấp.");
        var next = await db.Upgrades.Where(x => x.Name == selected.Name && !x.IsPurchased).OrderBy(x => x.Level).FirstOrDefaultAsync(ct);
        if (next is null || next.Level > selected.MaxLevel || next.Level > next.MaxLevel) throw new InvalidOperationException("Nâng cấp đã đạt cấp tối đa.");
        if (selected.Id != next.Id) throw new InvalidOperationException("Chỉ có thể mua cấp nâng cấp kế tiếp.");
        if (player.Money < next.Cost) throw new InvalidOperationException("Không đủ tiền để mua nâng cấp.");
        player.Money -= next.Cost; player.UpdatedAt = DateTime.UtcNow; next.IsPurchased = true;
        await new JourneyService(db).TouchAsync(playerId, ct);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return new(next.Id, next.Name, next.Description, next.Category.ToString(), next.Level, next.MaxLevel, next.Cost, next.EffectValue, next.IsPurchased);
    }
}
