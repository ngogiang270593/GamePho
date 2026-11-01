using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using server.Controllers;
using server.Data;
using server.Models;
using server.Services;
using Xunit;

namespace server.Tests;

public sealed class ProgressionTests
{
    [Theory]
    [InlineData(0, 1, 0, 100)]
    [InlineData(99, 1, 99, 1)]
    [InlineData(100, 2, 0, 100)]
    [InlineData(350, 4, 50, 50)]
    public void ViralScoreMapsToLevelAndProgress(int viral, int level, int progress, int remaining)
    {
        Assert.Equal(level, ProgressionService.GetLevel(viral));
        Assert.Equal(progress, ProgressionService.GetViralProgress(viral));
        Assert.Equal(remaining, ProgressionService.GetViralToNextLevel(viral));
    }

    [Fact]
    public void FeatureUnlocksOnlyIncludeReachedLevels()
    {
        var unlocked = ProgressionService.GetUnlockedFeatures(2);

        Assert.Contains(unlocked, feature => feature.Name == "Sân bóng hẻm");
        Assert.DoesNotContain(unlocked, feature => feature.Name == "Khách VIP");
    }

    [Fact]
    public async Task ProgressionApiReturnsComputedLevelAndUnlocks()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<GameDbContext>().UseSqlite(connection).Options;
        await using var db = new GameDbContext(options);
        await db.Database.EnsureCreatedAsync();
        db.Players.Add(new Player { Id = 1, DisplayName = "Chủ quán thử nghiệm", ViralScore = 250 });
        await db.SaveChangesAsync();

        var controller = new ProgressionController(db);
        var result = await controller.Get(1, CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result);
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(response.Value, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        Assert.Equal(3, json.RootElement.GetProperty("level").GetInt32());
        Assert.Equal(50, json.RootElement.GetProperty("viralProgress").GetInt32());
        Assert.Contains(json.RootElement.GetProperty("unlockedFeatures").EnumerateArray(),
            feature => feature.GetProperty("name").GetString() == "Khách VIP");
    }

    [Fact]
    public async Task BackupApiReturnsReadableSqliteFile()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"phoxom-test-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<GameDbContext>()
                .UseSqlite($"Data Source={databasePath}")
                .Options;
            await using (var db = new GameDbContext(options))
            {
                await db.Database.EnsureCreatedAsync();
                db.Players.Add(new Player { Id = 1, DisplayName = "Chủ quán sao lưu" });
                await db.SaveChangesAsync();
            }

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:GameDb"] = $"Data Source={databasePath}"
                })
                .Build();
            var result = await new BackupController(configuration).Download(CancellationToken.None);
            var file = Assert.IsType<FileContentResult>(result);
            Assert.NotEmpty(file.FileContents);
            Assert.EndsWith(".db", file.FileDownloadName);
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            if (File.Exists(databasePath)) File.Delete(databasePath);
            if (File.Exists($"{databasePath}-shm")) File.Delete($"{databasePath}-shm");
            if (File.Exists($"{databasePath}-wal")) File.Delete($"{databasePath}-wal");
        }
    }
}
