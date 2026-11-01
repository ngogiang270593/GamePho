using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using server.Models.Enums;
using server.Services;
using Xunit;

namespace server.Tests;
public sealed class KitchenTests
{
    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
        public void Advance(double seconds) => Now = Now.AddSeconds(seconds);
    }
    private sealed class World : IAsyncDisposable
    {
        public SqliteConnection Connection = new("Data Source=:memory:");
        public GameDbContext Db = null!;
        public Clock Clock = new();
        public KitchenService Service => new(Db, Clock);
        public async Task Open()
        {
            await Connection.OpenAsync(); Db = new(new DbContextOptionsBuilder<GameDbContext>().UseSqlite(Connection).Options);
            await Db.Database.EnsureCreatedAsync();
            Db.Players.Add(new Player { Id = 1, Money = 500000 });
            Db.PhoMenuItems.AddRange(Enum.GetValues<PhoType>().Select(t => new PhoMenuItem { Name = t.ToString(), PhoType = t, BasePrice = 40000, IsAvailable = true }));
            Db.Toppings.Add(new Topping { Name = "Hành lá", Price = 1000, IsAvailable = true });
            Db.Customers.AddRange(new Customer { Id = 1, Name = "Cô Ba", Avatar = "co-ba", PreferredPhoType = (PhoType)0, RequiredToppings = "Hành lá", Patience = 120, BasePatience = 120 },
                new Customer { Id = 2, Name = "Tí", Avatar = "ti", PreferredPhoType = (PhoType)0, RequiredToppings = "", Patience = 120, BasePatience = 120 });
            await Db.SaveChangesAsync();
            var state = new JourneyProgress { IsOpen = true, WaitSeconds = new() { [1] = 120, [2] = 120 }, Arrivals = new() { [1] = 360, [2] = 360 } };
            Db.GameJourneys.Add(new() { PlayerId = 1, StateJson = JsonSerializer.Serialize(state) }); await Db.SaveChangesAsync();
            await Service.Open("test", default);
        }
        public async Task<JourneyProgress> State() => (await new JourneyService(Db).LoadAsync(1)).State;
        public async Task Change(Action<JourneyProgress> change)
        {
            var row = (await Db.GameJourneys.FindAsync(1))!; var state = JsonSerializer.Deserialize<JourneyProgress>(row.StateJson)!;
            change(state); JourneyService.Write(row, state); await Db.SaveChangesAsync();
        }
        public Task<object> Act(string action, int slot = 1, int customerId = 0, int? phoType = null, List<string>? toppings = null, string? value = null) => Service.Act(new("test", action, slot, customerId, phoType, toppings, value), default);
        public async Task Ready(int slot, int customer)
        {
            await Act("accept", slot, customer);
            await Act("recipe", slot, phoType: (int)(PhoType)0, toppings: customer == 1 ? ["Hành lá"] : []);
            await Act("blanch", slot); Clock.Advance(4); await Act("lift", slot); await Act("pour", slot);
        }
        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); await Connection.DisposeAsync(); }
    }
    [Fact]
    public async Task TwoBowlsKeepIndependentRecipesAndCookTimes()
    {
        await using var w = new World(); await w.Open();
        await w.Act("accept", 1, 1); await w.Act("accept", 2, 2);
        Assert.All((await w.State()).Kitchen.Bowls, b => { Assert.Null(b.PhoType); Assert.Empty(b.Toppings); });
        await w.Act("recipe", 1, phoType: 0, toppings: ["Hành lá"]); await w.Act("blanch", 1);
        await w.Act("recipe", 2, phoType: 0, toppings: []);
        w.Clock.Advance(4); await w.Act("lift", 1);
        var bowls = (await w.State()).Kitchen.Bowls;
        Assert.Equal("vừa chín", bowls.Single(b => b.Slot == 1).Texture);
        Assert.Equal("draft", bowls.Single(b => b.Slot == 2).Phase);
        Assert.Empty(bowls.Single(b => b.Slot == 2).Toppings);
        await w.Act("pour", 1); await w.Act("serve", 1);
        Assert.Single((await w.State()).Kitchen.Bowls);
        Assert.Equal(2, (await w.State()).Kitchen.Bowls.Single().Slot);
        Assert.Single(await w.Db.Orders.ToListAsync());
        await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("serve", 1));
    }
    [Fact]
    public async Task CannotSkipRecipeCookingOrSpoofTheDirectOrderEndpoint()
    {
        await using var w = new World(); await w.Open(); await w.Act("accept", 1, 1);
        await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("blanch"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("serve"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("recipe", phoType: 0, toppings: ["Không tồn tại"]));
        await Assert.ThrowsAsync<InvalidOperationException>(() => new GameService(w.Db, new CustomerService(w.Db)).CreateOrderAsync(1, new() { CustomerId = 1, PhoType = (PhoType)0, Toppings = "Hành lá" }));
        Assert.Empty(await w.Db.Orders.ToListAsync());
    }
    [Fact]
    public async Task TimeoutFailsOnlyItsBowlAndTheShiftContinues()
    {
        await using var w = new World(); await w.Open(); await w.Act("accept", 1, 1);
        w.Clock.Advance(30); await w.Act("accept", 2, 2);
        w.Clock.Advance(31); await w.Service.State("test", default);
        var s = await w.State(); Assert.True(s.IsOpen); Assert.Equal(1, s.DayLost); Assert.Equal(0, s.Combo);
        Assert.Equal(2, s.Kitchen.Bowls.Single().CustomerId);
        Assert.True((await w.Db.Customers.FindAsync(1))!.HasLeft);
        Assert.False((await w.Db.Customers.FindAsync(2))!.HasLeft);
    }
    [Fact]
    public async Task LeavingFailsBothOnceButStaleSessionsCannotCloseANewKitchen()
    {
        await using var w = new World(); await w.Open(); await w.Act("accept", 1, 1); await w.Act("accept", 2, 2);
        await w.Act("leave"); await w.Act("leave");
        Assert.Equal(2, (await w.State()).DayLost);
        Assert.Equal(2, await w.Db.GameHistories.CountAsync(h => h.ActionType == "PhoFailed"));
        await w.Service.Open("new", default); await w.Act("leave");
        Assert.Equal("new", (await w.State()).Kitchen.Session);
        await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("fire", value: "high"));
    }
    [Fact]
    public async Task FireRefillAndPrepHaveRealCostsAndServerDelays()
    {
        await using var w = new World(); await w.Open(); await w.Act("fire", value: "high");
        w.Clock.Advance(10); await w.Service.State("test", default);
        var before = await w.State(); Assert.True(before.Kitchen.Heat > 82); Assert.True(before.Kitchen.Broth < 6);
        await w.Act("refill"); await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("refill"));
        var money = (await w.Db.Players.FindAsync(1))!.Money; Assert.Equal(495000m, money);
        await w.Act("prep"); Assert.Equal(4, (await w.State()).Kitchen.Noodles);
        w.Clock.Advance(4); await w.Service.State("test", default);
        var after = await w.State(); Assert.Equal(6, after.Kitchen.Broth); Assert.Equal(8, after.Kitchen.Noodles); Assert.True(after.Kitchen.Heat < before.Kitchen.Heat);
    }
    [Fact]
    public async Task CreditOrderPaysNothingButCreatesPersistedGoodwillAndNextDayGift()
    {
        await using var w = new World(); await w.Open();
        await w.Change(s => s.Kitchen.Requests[1] = new() { Kind = "credit", Text = "Mua chịu" });
        await w.Ready(1, 1); await w.Act("request", value: "accept");
        var before = (await w.Db.Players.FindAsync(1))!.Money;
        await w.Act("serve"); Assert.Equal(before, (await w.Db.Players.FindAsync(1))!.Money);
        var s = await w.State(); Assert.Equal(0, s.Kitchen.LastSale!.Money); Assert.Equal(1, s.Kitchen.Regulars["co-ba"].Helped);
        s.CompletedDays = 1;
        var customer = (await w.Db.Customers.FindAsync(1))!;
        var beforeGift = s.Kitchen.Noodles; KitchenService.PrepareDay(s, [customer]); Assert.Equal(beforeGift + 2, s.Kitchen.Noodles); Assert.Contains("biếu", customer.Description);
        var restored = JsonSerializer.Deserialize<JourneyProgress>(JsonSerializer.Serialize(s))!;
        Assert.Equal(1, restored.Kitchen.Regulars["co-ba"].Helped);
        KitchenService.PrepareDay(restored, [customer]); Assert.Equal(beforeGift + 2, restored.Kitchen.Noodles);
    }
    [Fact]
    public async Task CreativeOrdersUnlockNamedRecipesAfterThreeLikesAndUpgradesChangeCapacity()
    {
        await using var w = new World(); await w.Open();
        for (var i = 0; i < 3; i++)
        {
            var c = (await w.Db.Customers.FindAsync(1))!; c.IsServed = c.HasLeft = false;
            await w.Change(s => { s.Arrivals[1] = s.Minute; s.WaitSeconds[1] = 100; s.Kitchen.Requests[1] = new() { Kind = "chef" }; });
            await w.Ready(1, 1); await w.Act("serve");
        }
        var signature = (await w.State()).Kitchen.Signatures.Single().Value;
        Assert.Equal(3, signature.Likes);
        await w.Act("name", value: signature.Key, toppings: ["Phở tình xóm"]);
        Assert.Equal("Phở tình xóm", (await w.State()).Kitchen.Signatures.Single().Value.Name);
        await w.Act("upgrade", value: "pot"); await w.Act("refill"); w.Clock.Advance(4); await w.Service.State("test", default);
        Assert.Equal(10, (await w.State()).Kitchen.Broth);
        await w.Act("upgrade", value: "rack"); await w.Act("prep"); w.Clock.Advance(3); await w.Service.State("test", default);
        await w.Act("prep"); w.Clock.Advance(3); await w.Service.State("test", default); Assert.Equal(12, (await w.State()).Kitchen.Noodles);
    }
    [Fact]
    public async Task WrongRecipeCanBeRetriedOnceAndRushPromiseHasARealDeadlineAndTip()
    {
        await using var w = new World(); await w.Open();
        await w.Change(s => s.Kitchen.Requests[1] = new() { Kind = "rush", Text = "Đơn gấp" });
        await w.Act("accept", 1, 1); await w.Act("request", value: "accept");
        Assert.InRange(((await w.State()).Kitchen.Bowls.Single().DeadlineUtc - w.Clock.GetUtcNow().UtcDateTime).TotalSeconds, 39, 40);
        await w.Act("recipe", phoType: 0, toppings: []); await w.Act("blanch"); w.Clock.Advance(4); await w.Act("lift"); await w.Act("pour"); await w.Act("serve");
        Assert.False((await w.State()).Kitchen.LastSale!.Correct);
        await w.Act("redo"); await Assert.ThrowsAsync<InvalidOperationException>(() => w.Act("redo"));
        await w.Ready(1, 1); await w.Act("serve");
        var result = (await w.State()).Kitchen.LastSale!;
        Assert.True(result.Correct); Assert.True(result.Money >= 49000);
        Assert.Equal(1, (await w.State()).Kitchen.Regulars["co-ba"].Helped);
    }
    [Fact]
    public async Task FiveCorrectOrdersEarnANextDayReferralAndNamedKitchenStateSurvivesBackup()
    {
        await using var w = new World(); await w.Open();
        await w.Change(s => { s.Combo = 4; s.Kitchen.Requests[1] = new() { Kind = "chef" }; });
        await w.Ready(1, 1); await w.Act("serve");
        var state = await w.State(); Assert.True(state.Kitchen.ReferralPending);
        state.IsOpen = false; state.CompletedDays = 1; state.Arrivals.Clear(); state.WaitSeconds.Clear();
        var other = (await w.Db.Customers.FindAsync(2))!; other.HasLeft = true;
        await w.Change(s => { s.IsOpen = false; s.CompletedDays = 1; s.Arrivals.Clear(); s.WaitSeconds.Clear(); });
        await new GameService(w.Db, new CustomerService(w.Db)).StartDayAsync(1);
        Assert.Contains(await w.Db.Customers.Where(c => !c.HasLeft && !c.IsServed).ToListAsync(), c => c.Name == "Khách được bạn quen giới thiệu");
        var restored = JsonSerializer.Deserialize<JourneyProgress>(JsonSerializer.Serialize(await w.State()))!;
        Assert.False(restored.Kitchen.ReferralPending);
        Assert.Single(restored.Kitchen.Signatures);
        Assert.True(restored.Kitchen.Regulars["co-ba"].GoodOrders > 0);
    }
}
