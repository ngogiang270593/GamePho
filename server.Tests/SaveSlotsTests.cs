using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using server.Controllers;
using Xunit;

public class SaveSlotsTests
{
    [Fact]
    public async Task SlotsRestoreSavedDatabaseAndCharacterIndependently()
    {
        var directory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> {
            ["ConnectionStrings:GameDb"] = new SqliteConnectionStringBuilder { DataSource = Path.Combine(directory, "game.db"), Pooling = false }.ToString()
        }).Build();
        try
        {
            await using var db = new SqliteConnection(configuration.GetConnectionString("GameDb"));
            await db.OpenAsync();
            async Task Execute(string sql) { await using var command = db.CreateCommand(); command.CommandText = sql; await command.ExecuteNonQueryAsync(); }
            await Execute("CREATE TABLE Progress (Money INTEGER); INSERT INTO Progress VALUES (100);");
            var controller = new BackupController(configuration);
            Assert.IsType<OkResult>(await controller.SaveSlot(1, new() { ["name"] = "First" }, default));
            await Execute("UPDATE Progress SET Money = 200");
            Assert.IsType<OkResult>(await controller.SaveSlot(5, new() { ["name"] = "Second" }, default));
            var restored = Assert.IsType<OkObjectResult>(await controller.LoadSlot(1, default));
            Assert.Equal("First", Assert.IsType<Dictionary<string, string>>(restored.Value)["name"]);
            await using var query = db.CreateCommand(); query.CommandText = "SELECT Money FROM Progress";
            Assert.Equal(100L, await query.ExecuteScalarAsync());
            await controller.LoadSlot(5, default);
            Assert.Equal(200L, await query.ExecuteScalarAsync());
            Assert.IsType<NotFoundResult>(await controller.LoadSlot(2, default));
            Assert.IsType<BadRequestResult>(await controller.LoadSlot(6, default));
            Assert.IsType<BadRequestResult>(await controller.SaveSlot(0, new(), default));
            await db.CloseAsync();
        }
        finally { Directory.Delete(directory, true); }
    }
}
