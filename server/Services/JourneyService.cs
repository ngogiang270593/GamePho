using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.Enums;

namespace server.Services;

public sealed class JourneyService(GameDbContext db)
{
    public async Task<(GameJourney Row, JourneyProgress State)> LoadAsync(int playerId, CancellationToken ct = default)
    {
        var row = await db.GameJourneys.FindAsync([playerId], ct);
        if (row is not null) return (row, JsonSerializer.Deserialize<JourneyProgress>(row.StateJson) ?? new());
        var player = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException("Không tìm thấy chủ quán.");
        var state = new JourneyProgress { DayStartMoney = player.Money };
        var waiting = await db.Customers.Where(x => !x.IsServed && !x.HasLeft).OrderBy(x => x.Id).ToListAsync(ct);
        var aliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["Hanh"] = "Hành lá", ["RauThom"] = "Rau thơm", ["Ot"] = "Ớt tươi" };
        var availableToppings = await db.Toppings.Where(t => t.IsAvailable && t.Name != "Khăn lạnh").Select(t => t.Name).ToListAsync(ct);
        for (var i = 0; i < waiting.Count; i++)
        {
            var c = waiting[i];
            c.RequiredToppings = string.Join(',', c.RequiredToppings.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => availableToppings.Contains(t) ? t : aliases.GetValueOrDefault(t, t)).Where(availableToppings.Contains).Distinct());
            if (CustomerCast.Find(c.Avatar) is null)
            {
                var pool = CustomerCast.All.Where(x => x.Type == c.CustomerType).ToArray();
                if (pool.Length > 0) { var profile = pool[i % pool.Length]; c.Name = profile.Name; c.Avatar = profile.Key; c.Description = profile.Greeting; }
            }
        }
        // Existing saves are adopted without expiring customers while the game was closed.
        if (waiting.Count > 0) PrepareDay(state, waiting, player.Money);
        var unresolved = await db.RandomEvents.Where(e => e.IsActive && e.Title == "Tô phở gây sóng gió").OrderByDescending(e => e.Id).Take(1).Select(e => e.Id).ToListAsync(ct);
        state.PendingEvents.AddRange(unresolved);
        row = new GameJourney { PlayerId = playerId };
        db.GameJourneys.Add(row);
        Write(row, state);
        await db.SaveChangesAsync(ct);
        return (row, state);
    }

    public static void Write(GameJourney row, JourneyProgress state) { state.Revision++; row.StateJson = JsonSerializer.Serialize(state); }

    public async Task TouchAsync(int playerId, CancellationToken ct)
    {
        var row = await db.GameJourneys.FindAsync([playerId], ct);
        if (row is not null) Write(row, JsonSerializer.Deserialize<JourneyProgress>(row.StateJson) ?? new());
    }

    public static void PrepareDay(JourneyProgress s, IReadOnlyList<Customer> customers, decimal startingMoney)
    {
        s.IsOpen = true; s.Minute = 360; s.LastTickUtc = DateTime.UtcNow;
        s.Weather = JourneyContent.Theme(s).Weather; s.Report = null;
        s.DayServed = s.DayCorrect = s.DayLost = s.DayChoices = s.Combo = s.BestCombo = s.StoriesToday = 0;
        s.DayStartMoney = startingMoney; s.WaitSeconds.Clear(); s.Arrivals.Clear();
        for (var i = 0; i < customers.Count; i++)
        {
            var c = customers[i];
            var original = c.BasePatience > 0 ? c.BasePatience : c.Patience;
            c.Patience = Math.Max(s.Mode == "cozy" ? 100 : 55, (s.Mode == "cozy" ? 145 : 95) + original - 75) + (s.Boon == "tea" ? 25 : 0);
            s.WaitSeconds[c.Id] = c.Patience;
            s.Arrivals[c.Id] = 360 + Math.Max(0, i - 1) * 130;
        }
    }

    public async Task<List<CustomerStateDto>> WaitingAsync(JourneyProgress s, CancellationToken ct = default)
    {
        var customers = await db.Customers.AsNoTracking().Where(c => !c.IsServed && !c.HasLeft).OrderBy(c => c.Id).ToListAsync(ct);
        return customers.Where(c => s.IsOpen && s.Arrivals.GetValueOrDefault(c.Id, 360) <= s.Minute).Select(c => new CustomerStateDto {
            Id = c.Id, Name = c.Name, PersonaKey = c.Avatar, CustomerType = c.CustomerType, Hunger = c.Hunger, Patience = c.Patience,
            PreferredPhoType = c.PreferredPhoType, RequiredToppings = c.RequiredToppings, ArrivedAt = c.ArrivedAt,
            Dialogue = c.Description, SecondsRemaining = Math.Max(0, s.WaitSeconds.GetValueOrDefault(c.Id, c.Patience))
        }).ToList();
    }

    public async Task<List<RandomEventResponse>> EventsAsync(JourneyProgress s, CancellationToken ct = default)
    {
        var events = await db.RandomEvents.AsNoTracking().Include(e => e.Options).Where(e => e.IsActive && s.PendingEvents.Contains(e.Id)).ToListAsync(ct);
        return events.OrderBy(e => s.PendingEvents.IndexOf(e.Id)).Select(e => new RandomEventResponse(e.Id, e.Title, e.Description, e.EventType.ToString(), e.Options.Select(o => {
            var story = JourneyContent.Stories.FirstOrDefault(x => x.Key == s.EventKeys.GetValueOrDefault(e.Id));
            var choice = story?.Choices.FirstOrDefault(x => x.Text == o.Text);
            return new EventOptionResponse(o.Id, o.Text, o.MoneyChange, o.ReputationChange, o.ViralChange, choice?.Path);
        }).ToList()) { Actor = JourneyContent.Stories.FirstOrDefault(x => x.Key == s.EventKeys.GetValueOrDefault(e.Id))?.Actor ?? "ba-nam" }).ToList();
    }

    public object View(JourneyProgress s) => new {
        s.Revision, s.Season, chapter = Math.Min(7, s.CompletedDays + 1), s.CompletedDays, s.IsOpen, s.Minute, s.Mode, s.Boon, s.Weather,
        theme = JourneyContent.Theme(s), goalProgress = !s.IsOpen && s.Report is not null && JourneyContent.Theme(s).GoalKind != "visits" ? 0 : JourneyContent.GoalProgress(s), s.DayServed, s.DayCorrect, s.DayLost,
        s.Combo, s.BestCombo, s.Community, s.Craft, s.Fame, s.Mischief, s.GoalsWon, visitsToday = s.VisitsToday,
        upcomingCustomers = s.Arrivals.Count(x => x.Value > s.Minute), nextArrivalMinute = s.Arrivals.Where(x => x.Value > s.Minute).Select(x => (double?)x.Value).Min(),
        s.PendingEvents, memories = s.Memories.TakeLast(40).Reverse(), s.Report, s.Ending, s.UnlockedEndings, endings = JourneyContent.Endings,
        decoration = s.UnlockedEndings.Count > 0 ? "lanterns" : s.CompletedDays >= 3 ? "flowers" : "none"
    };

    public async Task<object> SnapshotAsync(int playerId, CancellationToken ct = default)
    {
        var (_, s) = await LoadAsync(playerId, ct);
        var p = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException();
        return new { journey = View(s), player = PlayerDto(p), waitingCustomers = await WaitingAsync(s, ct), randomEvents = await EventsAsync(s, ct) };
    }

    public static PlayerStateDto PlayerDto(Player p) => new() { Id = p.Id, DisplayName = p.DisplayName, Money = p.Money, Reputation = p.Reputation,
        ViralScore = p.ViralScore, Level = ProgressionService.GetLevel(p.ViralScore), CurrentDay = p.CurrentDay, CustomersServedToday = p.CustomersServedToday,
        ViralProgress = ProgressionService.GetViralProgress(p.ViralScore), ViralToNextLevel = ProgressionService.GetViralToNextLevel(p.ViralScore) };

    public async Task<object> TickAsync(int playerId, double seconds, CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var (row, s) = await LoadAsync(playerId, ct);
        var p = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException();
        var now = DateTime.UtcNow;
        if (s.ActiveSaleCustomerId is not null && s.SaleDeadlineUtc <= now)
            await PhoSaleService.FailAsync(db, playerId, row, s, ct);
        // The client only reports visible, unpaused play; never catch up offline time.
        var elapsed = double.IsFinite(seconds) ? Math.Clamp(seconds, 0, Math.Min(3, Math.Max(0, (now - s.LastTickUtc).TotalSeconds))) : 0;
        s.LastTickUtc = now;
        if (s.IsOpen && elapsed > 0)
        {
            var oldMinute = s.Minute;
            s.Minute = Math.Min(1320, s.Minute + elapsed * 6);
            var waiting = await db.Customers.Where(c => !c.IsServed && !c.HasLeft).ToListAsync(ct);
            foreach (var c in waiting)
            {
                var arrival = s.Arrivals.GetValueOrDefault(c.Id, 360);
                if (arrival > s.Minute) continue;
                var charged = Math.Min(elapsed, Math.Max(0, (s.Minute - Math.Max(oldMinute, arrival)) / 6));
                var left = s.WaitSeconds.GetValueOrDefault(c.Id, c.Patience) - charged;
                s.WaitSeconds[c.Id] = Math.Max(0, left);
                if (left <= 0 || s.Minute >= 1320) { c.HasLeft = true; s.DayLost++; s.Combo = 0; p.Reputation = Math.Max(0, p.Reputation - 2); s.Mischief++; }
            }
            if (s.PendingEvents.Count == 0 && s.StoriesToday < 2 && s.Minute >= (s.StoriesToday == 0 ? 600 : 1020))
                await AddStoryAsync(s, ct);
        }
        Write(row, s); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await SnapshotAsync(playerId, ct);
    }

    private async Task AddStoryAsync(JourneyProgress s, CancellationToken ct)
    {
        var story = JourneyContent.PickStory(s);
        var item = new RandomEvent { Title = story.Title, Description = story.Description, EventType = EventType.Neighborhood, IsActive = true,
            Options = story.Choices.Select(o => new EventOption { Text = o.Text, MoneyChange = o.Money, ReputationChange = o.Reputation, ViralChange = o.Viral, ResultText = o.Result }).ToList() };
        db.RandomEvents.Add(item); await db.SaveChangesAsync(ct);
        s.PendingEvents.Add(item.Id); s.EventKeys[item.Id] = story.Key; s.SeenStories.Add(story.Key); s.StoriesToday++;
    }

    public async Task<object> ConfigureAsync(int playerId, string mode, string boon, CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        var (row, s) = await LoadAsync(playerId, ct);
        if (s.IsOpen) throw new InvalidOperationException("Chọn nhịp chơi và chuẩn bị trước khi mở cửa nhé.");
        if (mode is not ("cozy" or "story") || boon is not ("tea" or "stove" or "sign")) throw new InvalidOperationException("Lựa chọn chuẩn bị không hợp lệ.");
        s.Mode = mode; s.Boon = boon; Write(row, s); await db.SaveChangesAsync(ct);
        return await SnapshotAsync(playerId, ct);
    }

    public async Task<object> NextWaveAsync(int playerId, CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        var (row, s) = await LoadAsync(playerId, ct);
        if (!s.IsOpen || (await WaitingAsync(s, ct)).Count > 0) throw new InvalidOperationException("Hãy phục vụ khách đang đợi trước nhé.");
        var next = s.Arrivals.Values.Where(m => m > s.Minute).Select(m => (double?)m).Min();
        if (next is null) throw new InvalidOperationException("Hôm nay không còn đợt khách mới.");
        s.Minute = next.Value; s.LastTickUtc = DateTime.UtcNow;
        Write(row, s); await db.SaveChangesAsync(ct); return await SnapshotAsync(playerId, ct);
    }

    public async Task<object> VisitAsync(int playerId, string npcId, CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        var (row, s) = await LoadAsync(playerId, ct);
        if (npcId is not ("co-ba" or "ba-nam" or "ti" or "man" or "chu-tu" or "bac-sau")) throw new InvalidOperationException("Người hàng xóm chưa có trong hẻm.");
        if (s.CompletedDays < 7 && !s.VisitsToday.Contains(npcId)) { s.VisitsToday.Add(npcId); s.Community++; }
        Write(row, s); await db.SaveChangesAsync(ct); return await SnapshotAsync(playerId, ct);
    }

    public async Task<object> CloseAsync(int playerId, bool forfeit, CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        var (row, s) = await LoadAsync(playerId, ct);
        if (!s.IsOpen) throw new InvalidOperationException("Ngày này đã tổng kết. Không thể nhận thưởng lần nữa.");
        if (s.PendingEvents.Count > 0) throw new InvalidOperationException("Còn câu chuyện chưa xử lý. Mở nhật ký để chọn cách giải quyết nhé.");
        var waiting = await db.Customers.Where(x => !x.IsServed && !x.HasLeft).ToListAsync(ct);
        if (waiting.Count > 0 && !forfeit) throw new InvalidOperationException("Còn khách hôm nay. Phục vụ tiếp hoặc chọn đóng cửa sớm.");
        var p = await db.Players.FindAsync([playerId], ct) ?? throw new KeyNotFoundException();
        foreach (var c in waiting) { c.HasLeft = true; if (s.Arrivals.GetValueOrDefault(c.Id, 360) <= s.Minute) { s.DayLost++; p.Reputation = Math.Max(0, p.Reputation - 2); } }
        s.Kitchen.Bowls.Clear(); s.Kitchen.Session = null;
        var goalMet = JourneyContent.GoalProgress(s) >= JourneyContent.Theme(s).Target;
        var reward = goalMet ? 15000m + s.CompletedDays * 2500 : 0m;
        if (goalMet) { p.Money += reward; s.GoalsWon++; db.GameHistories.Add(new GameHistory { PlayerId = playerId, ActionType = "DayGoalReward", Summary = $"Hoàn thành mục tiêu ngày {s.CompletedDays+1}", MoneyChange = reward }); }
        s.Report = new(s.CompletedDays + 1, s.DayServed, s.DayCorrect, s.DayLost, s.BestCombo, p.Money - s.DayStartMoney, goalMet, reward,
            s.DayLost > 0 ? "Có khách chạy mất, nhưng nồi nước dùng vẫn tin ở bạn." : s.DayCorrect > 0 ? "Chú Bảy báo cáo: nồi sạch, bụng vui, không có gì để hóng!" : "Bếp được nghỉ, chủ quán đã thu thập thêm kinh nghiệm sống.");
        s.IsOpen = false; s.Minute = 1260; s.CompletedDays++;
        if (s.CompletedDays >= 7) { s.Ending = JourneyContent.SelectEnding(s); if (!s.UnlockedEndings.Contains(s.Ending)) s.UnlockedEndings.Add(s.Ending); }
        s.Arrivals.Clear(); s.WaitSeconds.Clear(); s.VisitsToday.Clear();
        Write(row, s); await db.SaveChangesAsync(ct); return await SnapshotAsync(playerId, ct);
    }

    public async Task<object> ContinueAsync(int playerId, CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        var (row, s) = await LoadAsync(playerId, ct);
        if (s.IsOpen || s.CompletedDays < 7) throw new InvalidOperationException("Hãy hoàn thành bảy ngày trước khi mở mùa mới.");
        s.Season++; s.CompletedDays = s.GoalsWon = s.Community = s.Craft = s.Fame = s.Mischief = s.TotalServed = s.TotalCorrect = 0;
        s.Report = null; s.Ending = null; s.Minute = 360; s.VisitsToday.Clear();
        Write(row, s); await db.SaveChangesAsync(ct); return await SnapshotAsync(playerId, ct);
    }

    public async Task<int> RecordOrderAsync(int playerId, Customer customer, bool correct, RandomEvent? drama, CancellationToken ct)
    {
        var row = await db.GameJourneys.FindAsync([playerId], ct);
        if (row is null) return 0;
        var s = JsonSerializer.Deserialize<JourneyProgress>(row.StateJson) ?? new();
        if (!s.IsOpen || s.Arrivals.GetValueOrDefault(customer.Id, double.MaxValue) > s.Minute || s.WaitSeconds.GetValueOrDefault(customer.Id, 0) <= 0)
            throw new InvalidOperationException("Khách đã hết kiên nhẫn hoặc chưa đến quán. Hãy đón khách tiếp theo.");
        if (s.ActiveSaleCustomerId == customer.Id) { s.ActiveSaleCustomerId = null; s.SaleDeadlineUtc = null; }
        s.DayServed++; s.TotalServed++;
        var bonus = 0;
        if (correct) { s.DayCorrect++; s.TotalCorrect++; s.Craft++; s.Combo++; s.BestCombo = Math.Max(s.BestCombo, s.Combo); if (s.Combo % 3 == 0) { bonus = 3000; s.Fame++; } if (s.Boon == "sign") s.Fame++; }
        else { s.Combo = 0; s.Mischief += 2; }
        if (drama is not null) { s.PendingEvents.Add(drama.Id); s.EventKeys[drama.Id] = "order-drama"; }
        else if (s.PendingEvents.Count == 0 && s.StoriesToday < 2 && s.DayServed >= 2 + s.StoriesToday * 3) await AddStoryAsync(s, ct);
        s.WaitSeconds.Remove(customer.Id); s.Arrivals.Remove(customer.Id);
        Write(row, s); return bonus;
    }

    public async Task RecordChoiceAsync(int playerId, RandomEvent item, EventOption option, CancellationToken ct)
    {
        var row = await db.GameJourneys.FindAsync([playerId], ct); if (row is null) return;
        var s = JsonSerializer.Deserialize<JourneyProgress>(row.StateJson) ?? new();
        if (!s.PendingEvents.Contains(item.Id)) throw new InvalidOperationException("Chuyện này chưa xảy ra trong hành trình hiện tại.");
        var story = JourneyContent.Stories.FirstOrDefault(x => x.Key == s.EventKeys.GetValueOrDefault(item.Id));
        var path = story?.Choices.FirstOrDefault(x => x.Text == option.Text)?.Path ?? "community";
        switch (path) { case "community": s.Community += 3; break; case "craft": s.Craft += 3; break; case "fame": s.Fame += 3; break; case "mischief": s.Mischief += 3; s.Fame += 2; break; }
        s.DayChoices++; s.PendingEvents.Remove(item.Id);
        s.Memories.Add(new(Math.Min(7, s.CompletedDays + 1), item.Title, option.Text, option.ResultText, path));
        if (s.Memories.Count > 100) s.Memories.RemoveAt(0);
        Write(row, s);
    }
}
