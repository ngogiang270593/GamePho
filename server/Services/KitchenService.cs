using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.Enums;

namespace server.Services;

public sealed record KitchenAction(string Session, string Action, int Slot = 1, int CustomerId = 0, int? PhoType = null,
    List<string>? Toppings = null, string? Value = null);

public sealed class KitchenService(GameDbContext db, TimeProvider? clock = null)
{
    private DateTime UtcNow => (clock ?? TimeProvider.System).GetUtcNow().UtcDateTime;
    public static string RegularKey(Customer c) => string.IsNullOrWhiteSpace(c.Avatar) ? c.Name : c.Avatar;
    public static KitchenRegular Regular(KitchenProgress k, Customer c)
    {
        var key = RegularKey(c);
        if (!k.Regulars.TryGetValue(key, out var regular)) k.Regulars[key] = regular = new() { Name = c.Name };
        return regular;
    }
    public static void PrepareDay(JourneyProgress s, IReadOnlyList<Customer> customers)
    {
        var k = s.Kitchen;
        k.Bowls.Clear(); k.Session = null; k.Requests.Clear(); k.Redone.Clear(); k.LastSale = null;
        // Keep paid preparations and supplies between shifts; a new journey supplies the defaults.
        k.DailyGift = 0; k.UpdatedUtc = DateTime.UtcNow;
        foreach (var c in customers)
        {
            var r = Regular(k, c);
            if (r.Helped > r.GiftsReceived && r.LastHelpDay < s.CompletedDays + 1 && r.GiftClaimedDay < s.CompletedDays + 1)
            {
                r.GiftClaimedDay = s.CompletedDays + 1; r.GiftsReceived = r.Helped; k.DailyGift += 2;
                c.Description = $"{r.Memory} Hôm nay tôi mang ít bánh phở biếu quán! " + c.Description;
            }
            else if (r.GoodOrders > 0) c.Description = $"Tôi lại ghé đây! Lần trước quán làm đúng món nên nhớ mãi. " + c.Description;
        }
        k.Noodles = Math.Min(k.PrepRack ? 12 : 8, k.Noodles + Math.Min(4, k.DailyGift));
        AssignRequests(k, s.CompletedDays, customers);
        k.Notice = k.DailyGift > 0 ? $"Khách quen biếu {Math.Min(4, k.DailyGift)} phần bánh. Những lần giúp nhau đã được nhớ!" : "Đầu ca thong thả. Chuẩn bị nước dùng và bánh trước đợt đông.";
    }
    private static void AssignRequests(KitchenProgress k, int completedDays, IReadOnlyList<Customer> customers)
    {
        var ordered = customers.OrderBy(c => c.Id).ToList();
        for (var i = 0; i < ordered.Count; i++)
        {
            var c = ordered[i];
            if (i % 3 == 2) k.Requests[c.Id] = new() { Kind = "chef", Text = "Hôm nay chủ quán chọn giúp một tô ngon nhất đi!" };
            else if (i == 0) k.Requests[c.Id] = completedDays % 2 == 0
                ? new() { Kind = "credit", Text = "Hôm nay tôi thiếu tiền. Quán cho mua chịu một tô được không?" }
                : new() { Kind = "rush", Text = "Tôi đang trễ hẹn. Quán làm trong 40 giây, tôi gửi thêm 5.000đ nhé?" };
        }
    }
    public static void FailBowl(GameDbContext db, JourneyProgress s, Player p, KitchenBowl bowl, Customer? c, string reason)
    {
        s.Kitchen.Bowls.Remove(bowl);
        if (c is null || c.IsServed) return;
        var alreadyLost = c.HasLeft;
        if (!alreadyLost) { c.HasLeft = true; s.DayLost++; s.Combo = 0; p.Reputation = Math.Max(0, p.Reputation - 2); }
        s.WaitSeconds.Remove(c.Id); s.Arrivals.Remove(c.Id);
        s.Kitchen.Notice = $"Tô của {c.Name} thất bại: {reason}. Ca vẫn tiếp tục, mình gỡ ở đơn sau!";
        s.Kitchen.LastSale = new(c.Id, c.Name, false, s.Kitchen.Notice, 0, bowl.Texture, false, false);
        if (!alreadyLost) db.GameHistories.Add(new() { PlayerId = p.Id, ActionType = "PhoFailed", RelatedId = c.Id, Summary = s.Kitchen.Notice, ReputationChange = -2 });
    }
    public async Task Advance(JourneyProgress s, Player p, DateTime now, CancellationToken ct)
    {
        var k = s.Kitchen;
        var elapsed = k.Session is null ? 0 : Math.Clamp((now - k.UpdatedUtc).TotalSeconds, 0, 90);
        k.UpdatedUtc = now;
        k.Heat = Math.Clamp(k.Heat + elapsed * (k.Fire == "high" ? .8 : k.Fire == "low" ? -.18 : .08), 20, 100);
        k.Broth = Math.Max(0, k.Broth - elapsed * (k.Fire == "high" ? .025 : k.Fire == "low" ? .001 : .004));
        if (k.RefillAt <= now) { k.Broth = k.LargePot ? 10 : 6; k.Heat = Math.Max(20, k.Heat - 22); k.RefillAt = null; k.Notice = "Đã châm đầy nước dùng. Tăng lửa để nồi nóng lại."; }
        if (k.PrepAt <= now) { k.Noodles = Math.Min(k.PrepRack ? 12 : 8, k.Noodles + (k.PrepRack ? 6 : 4)); k.PrepAt = null; k.Notice = "Bánh phở đã chia xong. Có thể nhúng hai tô song song."; }
        foreach (var bowl in k.Bowls.ToArray())
        {
            var c = await db.Customers.FindAsync([bowl.CustomerId], ct);
            if (now >= bowl.DeadlineUtc || c is null || c.IsServed || c.HasLeft)
                FailBowl(db, s, p, bowl, c, "hết thời gian hoặc khách đã rời quán");
        }
    }
    private static void CheckSession(KitchenProgress k, string session)
    {
        if (string.IsNullOrWhiteSpace(session) || session.Length > 80 || k.Session != session) throw new InvalidOperationException("Phiên bếp đã đóng. Vào lại quán để bắt đầu ca mới.");
    }
    public async Task<object> Open(string session, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(session) || session.Length > 80) throw new InvalidOperationException("Phiên bếp không hợp lệ.");
        using var gate = await GameActionLock.Enter(1, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var (row, s) = await new JourneyService(db).LoadAsync(1, ct);
        var p = (await db.Players.FindAsync([1], ct))!;
        if (s.ActiveSaleCustomerId is not null) await PhoSaleService.FailAsync(db, 1, row, s, ct);
        if (s.IsOpen && s.Kitchen.Requests.Count == 0)
        {
            var customers = await db.Customers.Where(c => !c.IsServed && !c.HasLeft).OrderBy(c => c.Id).ToListAsync(ct);
            AssignRequests(s.Kitchen, s.CompletedDays, customers);
        }
        if (s.Kitchen.Session != session)
        {
            foreach (var b in s.Kitchen.Bowls.ToArray()) FailBowl(db, s, p, b, await db.Customers.FindAsync([b.CustomerId], ct), "đã thoát quán");
            s.Kitchen.Session = session; s.Kitchen.UpdatedUtc = UtcNow;
        }
        await Advance(s, p, UtcNow, ct);
        JourneyService.Write(row, s); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await View(s, ct);
    }
    public async Task<object> State(string session, CancellationToken ct)
    {
        using var gate = await GameActionLock.Enter(1, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var (row, s) = await new JourneyService(db).LoadAsync(1, ct); CheckSession(s.Kitchen, session);
        await Advance(s, (await db.Players.FindAsync([1], ct))!, UtcNow, ct);
        JourneyService.Write(row, s); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await View(s, ct);
    }
    public async Task<object> Act(KitchenAction action, CancellationToken ct)
    {
        using var gate = await GameActionLock.Enter(1, ct);
        var journey = new JourneyService(db); var (row, s) = await journey.LoadAsync(1, ct);
        var k = s.Kitchen;
        // Stale close requests must not close a newer tab's kitchen.
        if (action.Action == "leave" && k.Session != action.Session) return await View(s, ct);
        CheckSession(k, action.Session);
        var p = (await db.Players.FindAsync([1], ct))!; var now = UtcNow;
        await Advance(s, p, now, ct); JourneyService.Write(row, s); await db.SaveChangesAsync(ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var bowl = k.Bowls.FirstOrDefault(b => b.Slot == action.Slot);
        void NeedBowl() { if (bowl is null) throw new InvalidOperationException("Chọn khách cho chỗ đặt tô này trước nhé."); }
        void Pay(decimal cost) { if (p.Money < cost) throw new InvalidOperationException("Quán chưa đủ tiền."); p.Money -= cost; }
        switch (action.Action)
        {
            case "accept":
                if (!s.IsOpen || action.Slot is < 1 or > 2 || bowl is not null || k.Bowls.Any(b => b.CustomerId == action.CustomerId)) throw new InvalidOperationException("Chỗ đặt tô đã có đơn hoặc quán chưa mở.");
                var guest = await db.Customers.FindAsync([action.CustomerId], ct);
                if (guest is null || guest.HasLeft || guest.IsServed || s.Arrivals.GetValueOrDefault(guest.Id, double.MaxValue) > s.Minute) throw new InvalidOperationException("Khách không còn chờ tại quán.");
                k.Bowls.Add(new() { Slot = action.Slot, CustomerId = guest.Id, StartedUtc = now, DeadlineUtc = now.AddSeconds(k.Requests.GetValueOrDefault(guest.Id) is { Kind: "rush", Decision: "accept" } ? 40 : 60) });
                break;
            case "recipe":
                NeedBowl();
                if (bowl!.Phase != "draft") throw new InvalidOperationException("Tô đang nấu, không thể đổi nguyên liệu.");
                var toppings = (action.Toppings ?? []).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                if (action.PhoType is null || !await db.PhoMenuItems.AnyAsync(m => (int)m.PhoType == action.PhoType && m.IsAvailable, ct) || toppings.Count > 5) throw new InvalidOperationException("Chọn loại phở và tối đa 5 topping hợp lệ.");
                var valid = await db.Toppings.Where(t => t.IsAvailable && t.Name != "Khăn lạnh").Select(t => t.Name).ToListAsync(ct);
                if (toppings.Any(t => !valid.Contains(t))) throw new InvalidOperationException("Topping không có trong bếp.");
                bowl.PhoType = action.PhoType; bowl.Toppings = toppings; bowl.Confirmed = true;
                break;
            case "blanch":
                NeedBowl();
                if (bowl!.Phase != "draft" || !bowl.Confirmed || k.Noodles <= 0) throw new InvalidOperationException("Xác nhận nguyên liệu và chuẩn bị bánh trước khi nhúng.");
                k.Noodles--; bowl.Phase = "blanching"; bowl.BlanchStartedUtc = now;
                break;
            case "lift":
                NeedBowl();
                if (bowl!.Phase != "blanching" || bowl.BlanchStartedUtc is null) throw new InvalidOperationException("Tô chưa được nhúng bánh.");
                bowl.CookSeconds = (now - bowl.BlanchStartedUtc.Value).TotalSeconds;
                if (bowl.CookSeconds < 1) throw new InvalidOperationException("Bánh chưa kịp chín, chờ ít nhất 1 giây nhé.");
                var tolerance = s.Mode == "cozy" ? 1 : 0;
                bowl.Texture = bowl.CookSeconds >= 3 - tolerance && bowl.CookSeconds <= 5 + tolerance ? "vừa chín" : bowl.CookSeconds < 3 ? "hơi dai" : "hơi mềm";
                bowl.Phase = "blanched";
                break;
            case "pour":
                NeedBowl();
                if (bowl!.Phase != "blanched" || k.RefillAt is not null || k.Broth < 1 || k.Heat < (s.Weather == "rain" ? 75 : 65)) throw new InvalidOperationException("Cần nước dùng từ 65°C, đủ một phần và đã châm xong.");
                k.Broth--; bowl.PourHeat = k.Heat; bowl.Phase = "ready"; bowl.ReadyUtc = now;
                break;
            case "fire":
                if (action.Value is not ("low" or "medium" or "high")) throw new InvalidOperationException("Mức lửa không hợp lệ.");
                k.Fire = action.Value; break;
            case "refill":
                if (k.RefillAt is not null || k.Broth >= (k.LargePot ? 10 : 6) - .1) throw new InvalidOperationException("Nồi đang châm hoặc vẫn đầy.");
                Pay(5000); k.RefillAt = now.AddSeconds(4); break;
            case "prep":
                if (k.PrepAt is not null || k.Noodles >= (k.PrepRack ? 12 : 8)) throw new InvalidOperationException("Đang chia bánh hoặc khay đã đầy.");
                Pay(2000); k.PrepAt = now.AddSeconds(3); break;
            case "request":
                NeedBowl();
                if (!k.Requests.TryGetValue(bowl!.CustomerId, out var request) || request.Decision is not null || request.Kind == "chef" || action.Value is not ("accept" or "decline")) throw new InvalidOperationException("Câu chuyện đã được chọn hoặc không hợp lệ.");
                request.Decision = action.Value;
                if (request.Kind == "rush" && action.Value == "accept") bowl.DeadlineUtc = new[] { bowl.DeadlineUtc, bowl.StartedUtc.AddSeconds(40) }.Min();
                k.Notice = action.Value == "accept" ? request.Kind == "credit" ? "Đã hứa mời khách ăn chịu. Tô đúng món sẽ không thu tiền, khách sẽ nhớ lòng tốt." : "Đã nhận đơn gấp: hoàn thành trước hạn để nhận thêm 5.000đ." : "Khách hiểu, hôm nay quán cứ làm theo đơn thường nhé.";
                break;
            case "serve":
                NeedBowl();
                if (bowl!.Phase != "ready" || bowl.PhoType is null) throw new InvalidOperationException("Nhúng bánh, vớt và chan nước trước khi phục vụ.");
                var customer = (await db.Customers.FindAsync([bowl.CustomerId], ct))!;
                var chefChoice = k.Requests.GetValueOrDefault(customer.Id)?.Kind == "chef";
                if (chefChoice) { customer.PreferredPhoType = (PhoType)bowl.PhoType; customer.RequiredToppings = string.Join(',', bowl.Toppings); }
                JourneyService.Write(row, s); await db.SaveChangesAsync(ct);
                var result = await new GameService(db, new CustomerService(db)).CreateOrderAsync(1, new() { CustomerId = customer.Id, PhoType = (PhoType)bowl.PhoType, Toppings = string.Join(',', bowl.Toppings), ServiceTimeSeconds = (int)Math.Ceiling((now - bowl.StartedUtc).TotalSeconds) }, ct, true);
                // Order recording updates journey JSON; merge kitchen changes into that newer state.
                s = JsonSerializer.Deserialize<JourneyProgress>(row.StateJson)!; k = s.Kitchen;
                var regular = Regular(k, customer); regular.Visits++;
                var bonus = result.IsCorrect && bowl.Texture == "vừa chín" && (now - bowl.ReadyUtc!.Value).TotalSeconds <= (k.Insulated ? 35 : 20) ? 3000 : 0;
                if (result.IsCorrect && s.Weather == "rain" && bowl.PourHeat >= 85) bonus += 1000;
                if (result.IsCorrect)
                {
                    regular.GoodOrders++; regular.FavoritePho = bowl.PhoType; regular.FavoriteToppings = string.Join(',', bowl.Toppings);
                    if (k.Requests.GetValueOrDefault(customer.Id) is { Kind: "credit", Decision: "accept" })
                    {
                        p.Money -= result.MoneyChange; result.MoneyChange = 0; bonus = 0;
                        regular.Helped++; regular.LastHelpDay = s.CompletedDays + 1; regular.Memory = "Lần trước chủ quán cho tôi ăn chịu, tôi vẫn nhớ.";
                        s.Community += 2; result.Message += " Đã ghi món mua chịu. Khách nhớ lòng tốt và sẽ mang quà khi quay lại.";
                    }
                    if (k.Requests.GetValueOrDefault(customer.Id) is { Kind: "rush", Decision: "accept" })
                    {
                        bonus += 5000; result.Message += " Đơn gấp kịp giờ: khách gửi tip 5.000đ."; regular.Helped++; regular.LastHelpDay = s.CompletedDays + 1; regular.Memory = "Lần trước quán cứu đơn gấp cho tôi.";
                    }
                    if (chefChoice)
                    {
                        var key = bowl.PhoType + ":" + string.Join('|', bowl.Toppings.Order(StringComparer.Ordinal));
                        if (!k.Signatures.TryGetValue(key, out var signature)) k.Signatures[key] = signature = new() { Key = key, PhoType = bowl.PhoType.Value, Toppings = bowl.Toppings.ToList() };
                        signature.Likes++; result.Message += $" Tô sáng tạo được yêu thích ({signature.Likes}/3).";
                    }
                    if (s.Combo >= 5) { if (!k.ReferralPending) result.Message += " Khách hứa giới thiệu bạn tới quán ngày sau!"; k.ReferralPending = true; }
                }
                p.Money += bonus; result.MoneyChange += bonus;
                result.Message += $" Bánh {bowl.Texture}." + (bonus > 0 ? $" Thưởng chăm tô: +{bonus:N0}đ." : "");
                if (!result.IsCorrect)
                {
                    var expected = customer.RequiredToppings.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    var missing = expected.Except(bowl.Toppings, StringComparer.OrdinalIgnoreCase).ToArray();
                    var extra = bowl.Toppings.Except(expected, StringComparer.OrdinalIgnoreCase).ToArray();
                    if ((int?)customer.PreferredPhoType != bowl.PhoType) result.Message += " Loại phở chưa đúng.";
                    if (missing.Length > 0) result.Message += " Thiếu: " + string.Join(", ", missing) + ".";
                    if (extra.Length > 0) result.Message += " Khách không dặn: " + string.Join(", ", extra) + ".";
                    result.Message += " Có thể xin làm lại một lần trong kết quả đơn.";
                }
                if ((now - bowl.ReadyUtc!.Value).TotalSeconds > (k.Insulated ? 35 : 20)) result.Message += " Tô để lâu, không nhận thưởng giữ nóng.";
                k.Bowls.RemoveAll(b => b.Slot == action.Slot);
                k.LastSale = new(customer.Id, customer.Name, result.IsCorrect, result.Message, result.MoneyChange, bowl.Texture, result.DramaTriggered, !result.IsCorrect && !k.Redone.Contains(customer.Id));
                k.Notice = result.Message;
                db.GameHistories.Add(new() { PlayerId = 1, ActionType = "KitchenSale", RelatedId = result.Id, Summary = result.Message, MoneyChange = result.MoneyChange, ReputationChange = result.ReputationChange });
                break;
            case "redo":
                if (k.LastSale is not { Correct: false, CanRedo: true } last || k.Redone.Contains(last.CustomerId) || !s.IsOpen) throw new InvalidOperationException("Đơn này không thể làm lại.");
                var redo = (await db.Customers.FindAsync([last.CustomerId], ct))!;
                Pay(3000); redo.IsServed = false; redo.HasLeft = false;
                s.Arrivals[redo.Id] = s.Minute; s.WaitSeconds[redo.Id] = 70; k.Redone.Add(redo.Id);
                k.LastSale = last with { CanRedo = false }; k.Notice = "Khách nhận lời đợi thêm một lần. Chọn lại khách và sửa đúng món nhé.";
                break;
            case "upgrade":
                switch (action.Value)
                {
                    case "pot" when !k.LargePot: Pay(45000); k.LargePot = true; break;
                    case "rack" when !k.PrepRack: Pay(30000); k.PrepRack = true; break;
                    case "insulation" when !k.Insulated: Pay(60000); k.Insulated = true; break;
                    default: throw new InvalidOperationException("Nâng cấp đã có hoặc không hợp lệ.");
                }
                k.Notice = "Đã nâng cấp bếp. Dụng cụ mới được lưu cùng quán."; break;
            case "name":
                var signatureToName = k.Signatures.GetValueOrDefault(action.Value ?? "");
                var name = action.Toppings?.FirstOrDefault()?.Trim();
                if (signatureToName is null || signatureToName.Likes < 3 || string.IsNullOrWhiteSpace(name) || name.Length > 30) throw new InvalidOperationException("Cần 3 lượt thích và tên món từ 1–30 ký tự.");
                signatureToName.Name = name; break;
            case "leave":
                foreach (var b in k.Bowls.ToArray()) FailBowl(db, s, p, b, await db.Customers.FindAsync([b.CustomerId], ct), "đã thoát quán");
                k.Session = null; break;
            default: throw new InvalidOperationException("Thao tác bếp không hợp lệ.");
        }
        JourneyService.Write(row, s); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await View(s, ct);
    }
    private async Task<object> View(JourneyProgress s, CancellationToken ct)
    {
        var waiting = await new JourneyService(db).WaitingAsync(s, ct);
        return new { kitchen = s.Kitchen, serverUtc = UtcNow, waitingCustomers = waiting,
            randomEvents = await new JourneyService(db).EventsAsync(s, ct), player = JourneyService.PlayerDto((await db.Players.FindAsync([1], ct))!), journey = new JourneyService(db).View(s),
            rhythm = !s.IsOpen ? "preparation" : waiting.Count == 0 ? "rest" : s.DayServed < 2 ? "warmup" : waiting.Count >= 3 ? "rush" : "steady" };
    }
}
