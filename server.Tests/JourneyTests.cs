using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.Enums;
using server.Services;
using Xunit;

namespace server.Tests;

public sealed class JourneyTests
{
    private sealed class World : IAsyncDisposable
    {
        public SqliteConnection Connection { get; } = new("Data Source=:memory:");
        public GameDbContext Db { get; private set; } = null!;
        public JourneyService Journey => new(Db);
        public GameService Game => new(Db, new CustomerService(Db));
        public async Task Open()
        {
            await Connection.OpenAsync();
            Db = new(new DbContextOptionsBuilder<GameDbContext>().UseSqlite(Connection).Options);
            await Db.Database.EnsureCreatedAsync();
            Db.Players.Add(new Player { Id = 1, Money = 500000, Level = 3, ViralScore = 200 });
            Db.PhoMenuItems.AddRange(Enum.GetValues<PhoType>().Select(t => new PhoMenuItem { Name = t.ToString(), PhoType = t, BasePrice = 40000, IsAvailable = true }));
            Db.Toppings.AddRange(new Topping { Name = "Hành lá", Price = 1000 }, new Topping { Name = "Giá đỗ", Price = 1000 });
            await Db.SaveChangesAsync();
        }
        public async ValueTask DisposeAsync() { await Db.DisposeAsync(); await Connection.DisposeAsync(); }
    }

    [Fact]
    public async Task CompletedSaleIsNotFailedWhenLeavingTheShop()
    {
        await using var world = new World(); await world.Open();
        await world.Game.StartDayAsync(1);
        var (_, state) = await world.Journey.LoadAsync(1);
        var customer = (await world.Journey.WaitingAsync(state)).First();
        var service = new PhoSaleService(world.Db);
        await service.BeginAsync(customer.Id, default);
        var result = await world.Game.CreateOrderAsync(1, new() {
            CustomerId = customer.Id, PhoType = customer.PreferredPhoType!.Value, Toppings = customer.RequiredToppings
        });
        Assert.True(result.IsCorrect);
        await service.EndAsync(customer.Id, default);
        Assert.Empty(await world.Db.GameHistories.Where(h => h.ActionType == "PhoFailed").ToListAsync());
        Assert.Equal(0, (await world.Journey.LoadAsync(1)).State.DayLost);
        Assert.Null((await world.Journey.LoadAsync(1)).State.ActiveSaleCustomerId);
    }

    [Fact]
    public async Task AbandoningASaleFailsOnceAndCannotBeRestarted()
    {
        await using var world = new World(); await world.Open();
        await world.Game.StartDayAsync(1);
        var (_, state) = await world.Journey.LoadAsync(1);
        var customer = (await world.Journey.WaitingAsync(state)).First();
        var service = new PhoSaleService(world.Db);
        await service.BeginAsync(customer.Id, default);
        await service.EndAsync(customer.Id, default);
        await service.EndAsync(customer.Id, default);
        Assert.True((await world.Db.Customers.FindAsync(customer.Id))!.HasLeft);
        Assert.Single(await world.Db.GameHistories.Where(h => h.ActionType == "PhoFailed").ToListAsync());
        Assert.Equal(1, (await world.Journey.LoadAsync(1)).State.DayLost);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.BeginAsync(customer.Id, default));
    }

    [Fact]
    public async Task ExpiredSaleIsRejectedByServerAndReceivesNoMoney()
    {
        await using var world = new World(); await world.Open();
        await world.Game.StartDayAsync(1);
        var (_, state) = await world.Journey.LoadAsync(1);
        var customer = (await world.Journey.WaitingAsync(state)).First();
        await new PhoSaleService(world.Db).BeginAsync(customer.Id, default);
        var (row, started) = await world.Journey.LoadAsync(1);
        started.SaleDeadlineUtc = DateTime.UtcNow.AddSeconds(-1);
        JourneyService.Write(row, started); await world.Db.SaveChangesAsync();
        var money = (await world.Db.Players.FindAsync(1))!.Money;
        await Assert.ThrowsAsync<InvalidOperationException>(() => world.Game.CreateOrderAsync(1, new() {
            CustomerId = customer.Id, PhoType = customer.PreferredPhoType!.Value, Toppings = customer.RequiredToppings
        }));
        Assert.True((await world.Db.Customers.FindAsync(customer.Id))!.HasLeft);
        Assert.Empty(await world.Db.Orders.ToListAsync());
        Assert.Equal(money, (await world.Db.Players.FindAsync(1))!.Money);
        Assert.Equal(0, (await world.Journey.LoadAsync(1)).State.Combo);
    }

    [Fact]
    public async Task ReloadingAnUnfinishedSaleCannotRestartItsClock()
    {
        await using var world = new World(); await world.Open();
        await world.Game.StartDayAsync(1);
        var (_, state) = await world.Journey.LoadAsync(1);
        var customer = (await world.Journey.WaitingAsync(state)).First();
        var service = new PhoSaleService(world.Db);
        await service.BeginAsync(customer.Id, default);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.BeginAsync(customer.Id, default));
        Assert.True((await world.Db.Customers.FindAsync(customer.Id))!.HasLeft);
    }

    [Fact]
    public async Task NewGameClearsThePreviousJourneyAndRestoresStartingProgress()
    {
        await using var world = new World(); await world.Open();
        await world.Journey.ConfigureAsync(1, "cozy", "tea");
        await world.Game.StartDayAsync(1);
        var player = (await world.Db.Players.FindAsync(1))!;
        player.Money = 999999; player.CurrentDay = 6; player.ViralScore = 1000;
        await world.Db.SaveChangesAsync();
        Assert.True(await world.Game.ResetGameAsync(1));
        Assert.Equal(500000m, player.Money);
        Assert.Equal(1, player.CurrentDay);
        Assert.Equal(1, player.Level);
        Assert.Equal(0, player.ViralScore);
        Assert.Empty(await world.Db.Orders.ToListAsync());
        Assert.Empty(await world.Db.GameHistories.ToListAsync());
        Assert.Empty(await world.Db.GameJourneys.ToListAsync());
        Assert.Empty(await world.Db.Customers.Where(c => !c.HasLeft).ToListAsync());
    }
    [Fact]
    public async Task MigrationPreservesAnExistingPlayersMoneyAndAdoptsOldCustomers()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:"); await connection.OpenAsync();
        await using var db = new GameDbContext(new DbContextOptionsBuilder<GameDbContext>().UseSqlite(connection).Options);
        await db.GetService<IMigrator>().MigrateAsync("20261020110000_AddGameHistory");
        db.Players.Add(new Player { Id = 1, Money = 123456, CurrentDay = 4 });
        db.Customers.Add(new Customer { Name = "Khách cũ", Patience = 70, ArrivedAt = DateTime.UtcNow.AddYears(-1) });
        await db.SaveChangesAsync();
        await db.Database.MigrateAsync();
        var (_, state) = await new JourneyService(db).LoadAsync(1);
        Assert.True(state.IsOpen);
        Assert.Equal(123456m, (await db.Players.FindAsync(1))!.Money);
        Assert.All(state.WaitSeconds.Values, time => Assert.True(time >= 100));
        Assert.Single(await db.GameJourneys.ToListAsync());
    }

    [Fact]
    public async Task WavesDoNotChargeCustomersBeforeTheyArriveAndOfflineTimeIsNotCharged()
    {
        await using var world = new World(); await world.Open();
        await world.Journey.ConfigureAsync(1, "cozy", "tea"); await world.Game.StartDayAsync(1);
        var (row, state) = await world.Journey.LoadAsync(1);
        Assert.Equal(2, (await world.Journey.WaitingAsync(state)).Count);
        var futureId = state.Arrivals.First(x => x.Value > state.Minute).Key;
        var future = await world.Db.Customers.FindAsync(futureId);
        await Assert.ThrowsAsync<InvalidOperationException>(() => world.Game.CreateOrderAsync(1, new() { CustomerId = futureId, PhoType = future!.PreferredPhoType!.Value, Toppings = future.RequiredToppings }));
        var budget = state.WaitSeconds[futureId];
        state.LastTickUtc = DateTime.UtcNow.AddDays(-30); JourneyService.Write(row, state); await world.Db.SaveChangesAsync();
        await world.Journey.TickAsync(1, 3);
        (_, state) = await world.Journey.LoadAsync(1);
        Assert.Equal(budget, state.WaitSeconds[futureId]);
        Assert.InRange(state.Minute, 377.9, 378.1); // Exactly three seconds, not thirty offline days.
        var before = state.WaitSeconds.ToDictionary(x => x.Key, x => x.Value);
        await world.Journey.TickAsync(1, 0);
        (_, state) = await world.Journey.LoadAsync(1);
        Assert.Equal(before, state.WaitSeconds);
        await Assert.ThrowsAsync<InvalidOperationException>(() => world.Journey.ConfigureAsync(1, "story", "sign"));
    }

    [Fact]
    public async Task PatienceExpiresOnceAndExpiredOrdersCannotEarnMoney()
    {
        await using var world = new World(); await world.Open(); await world.Game.StartDayAsync(1);
        var (row, state) = await world.Journey.LoadAsync(1);
        var id = state.Arrivals.First(x => x.Value <= state.Minute).Key;
        state.WaitSeconds[id] = 1; state.LastTickUtc = DateTime.UtcNow.AddSeconds(-10);
        JourneyService.Write(row, state); await world.Db.SaveChangesAsync();
        var before = (await world.Db.Players.FindAsync(1))!.Money;
        await world.Journey.TickAsync(1, 3);
        Assert.True((await world.Db.Customers.FindAsync(id))!.HasLeft);
        Assert.Equal(48, (await world.Db.Players.FindAsync(1))!.Reputation);
        await world.Journey.TickAsync(1, 0);
        Assert.Equal(48, (await world.Db.Players.FindAsync(1))!.Reputation);
        await Assert.ThrowsAsync<InvalidOperationException>(() => world.Game.CreateOrderAsync(1, new() { CustomerId = id, PhoType = PhoType.BoTai }));
        Assert.Equal(before, (await world.Db.Players.FindAsync(1))!.Money);
        Assert.Empty(await world.Db.Orders.ToListAsync());
    }

    [Fact]
    public async Task SevenDaysChoicesAndEndingSurviveReloadAndRewardsCannotBeClaimedTwice()
    {
        await using var world = new World(); await world.Open();
        var seen = new HashSet<string>();
        for (var day = 0; day < 7; day++)
        {
            await world.Game.StartDayAsync(1);
            for (var guard = 0; guard < 35; guard++)
            {
                var (_, state) = await world.Journey.LoadAsync(1);
                var events = await world.Journey.EventsAsync(state);
                if (events.Count > 0)
                {
                    var item = events[0]; Assert.True(seen.Add(item.Title), "A story repeated before the deck was exhausted.");
                    await world.Game.ResolveEventAsync(1, new() { EventId = item.Id, OptionId = item.Options[0].Id });
                    await Assert.ThrowsAsync<InvalidOperationException>(() => world.Game.ResolveEventAsync(1, new() { EventId = item.Id, OptionId = item.Options[0].Id }));
                    continue;
                }
                var waiting = await world.Journey.WaitingAsync(state);
                if (waiting.Count == 0) { if (state.Arrivals.Values.Any(m => m > state.Minute)) { await world.Journey.NextWaveAsync(1); continue; } break; }
                var customer = waiting[0];
                var order = await world.Game.CreateOrderAsync(1, new() { CustomerId = customer.Id, PhoType = customer.PreferredPhoType!.Value, Toppings = customer.RequiredToppings, ServiceTimeSeconds = 7 });
                Assert.True(order.IsCorrect);
            }
            await world.Journey.CloseAsync(1, false);
            var money = (await world.Db.Players.FindAsync(1))!.Money;
            await Assert.ThrowsAsync<InvalidOperationException>(() => world.Journey.CloseAsync(1, true));
            Assert.Equal(money, (await world.Db.Players.FindAsync(1))!.Money);
            world.Db.ChangeTracker.Clear(); // Simulate reopening the save in a new request.
        }
        var (_, final) = await world.Journey.LoadAsync(1);
        Assert.Equal(7, final.CompletedDays); Assert.NotNull(final.Ending); Assert.Contains(final.Ending, final.UnlockedEndings);
        Assert.True(final.Memories.Count >= 7); Assert.True(final.TotalCorrect >= 30);
        var oldMoney = (await world.Db.Players.FindAsync(1))!.Money;
        await world.Journey.ContinueAsync(1);
        var (_, continued) = await world.Journey.LoadAsync(1);
        Assert.Equal(2, continued.Season); Assert.Equal(0, continued.CompletedDays); Assert.Null(continued.Ending);
        Assert.NotEmpty(continued.UnlockedEndings); Assert.Equal(oldMoney, (await world.Db.Players.FindAsync(1))!.Money);
    }

    [Fact]
    public async Task NpcVisitsAreCountedOnceAndCarryFromMorningIntoTheDay()
    {
        await using var world = new World(); await world.Open();
        await world.Journey.VisitAsync(1, "co-ba"); await world.Journey.VisitAsync(1, "co-ba");
        var (_, state) = await world.Journey.LoadAsync(1); Assert.Equal(1, state.Community);
        await world.Game.StartDayAsync(1);
        (_, state) = await world.Journey.LoadAsync(1); Assert.Single(state.VisitsToday);
    }

    [Theory]
    [InlineData(20, 20, 0, 0, 5, "community")]
    [InlineData(0, 24, 0, 0, 5, "craft")]
    [InlineData(0, 0, 20, 0, 5, "fame")]
    [InlineData(0, 0, 12, 12, 5, "meme")]
    [InlineData(0, 0, 0, 0, 4, "comeback")]
    [InlineData(0, 0, 0, 0, 0, "cozy")]
    public void EndingDependsOnThePathActuallyPlayed(int community, int craft, int fame, int mischief, int goals, string ending) =>
        Assert.Equal(ending, JourneyContent.SelectEnding(new() { Community = community, Craft = craft, Fame = fame, Mischief = mischief, GoalsWon = goals, TotalServed = 30, TotalCorrect = 29 }));

    [Fact]
    public void StoryDeckExhaustsBeforeRepeatingAndAvoidsAnImmediateRepeatAtReshuffle()
    {
        var state = new JourneyProgress(); var selected = new List<string>(); var rng = new Random(7);
        for (var i = 0; i < JourneyContent.Stories.Length + 1; i++) { var story = JourneyContent.PickStory(state, rng); selected.Add(story.Key); state.SeenStories.Add(story.Key); }
        Assert.Equal(JourneyContent.Stories.Length, selected.Take(JourneyContent.Stories.Length).Distinct().Count());
        Assert.NotEqual(selected[^2], selected[^1]);
    }
}
