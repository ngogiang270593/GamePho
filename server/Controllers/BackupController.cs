using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace server.Controllers;

[ApiController]
[Route("api/backup")]
public sealed class BackupController(IConfiguration configuration) : ControllerBase
{
    private static readonly SemaphoreSlim SlotLock = new(1, 1);
    private string SlotDirectory => Path.Combine(Path.GetDirectoryName(Path.GetFullPath(
        new SqliteConnectionStringBuilder(configuration.GetConnectionString("GameDb")).DataSource))!, "saves");

    [HttpGet("slots")]
    public IActionResult Slots() => Ok(Enumerable.Range(1, 5).Select(id => new {
        id, savedAt = System.IO.File.Exists(Path.Combine(SlotDirectory, $"slot-{id}.db"))
            ? (DateTime?)System.IO.File.GetLastWriteTimeUtc(Path.Combine(SlotDirectory, $"slot-{id}.db")) : null
    }));

    [HttpPut("slots/{id:int}")]
    public async Task<IActionResult> SaveSlot(int id, [FromBody] Dictionary<string, string> character, CancellationToken ct)
    {
        if (id < 1 || id > 5) return BadRequest();
        await SlotLock.WaitAsync(ct);
        string? temporary = null;
        try
        {
            Directory.CreateDirectory(SlotDirectory);
            temporary = Path.Combine(SlotDirectory, $"{Guid.NewGuid():N}.db");
            await using var source = new SqliteConnection(configuration.GetConnectionString("GameDb"));
            await using var target = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = temporary, Pooling = false }.ToString());
            await source.OpenAsync(ct);
            await target.OpenAsync(ct);
            source.BackupDatabase(target);
            await using (var command = target.CreateCommand())
            {
                command.CommandText = "CREATE TABLE IF NOT EXISTS SaveCharacter (Id INTEGER PRIMARY KEY, Json TEXT NOT NULL); INSERT OR REPLACE INTO SaveCharacter VALUES (1, $json);";
                command.Parameters.AddWithValue("$json", System.Text.Json.JsonSerializer.Serialize(character));
                await command.ExecuteNonQueryAsync(ct);
            }
            await target.CloseAsync();
            System.IO.File.Move(temporary, Path.Combine(SlotDirectory, $"slot-{id}.db"), true);
            return Ok();
        }
        finally { if (temporary != null && System.IO.File.Exists(temporary)) System.IO.File.Delete(temporary); SlotLock.Release(); }
    }

    [HttpPost("slots/{id:int}/load")]
    public async Task<IActionResult> LoadSlot(int id, CancellationToken ct)
    {
        if (id < 1 || id > 5) return BadRequest();
        await SlotLock.WaitAsync(ct);
        try
        {
            var path = Path.Combine(SlotDirectory, $"slot-{id}.db");
            if (!System.IO.File.Exists(path)) return NotFound();
            await using var source = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = path, Mode = SqliteOpenMode.ReadOnly, Pooling = false }.ToString());
            await using var target = new SqliteConnection(configuration.GetConnectionString("GameDb"));
            await source.OpenAsync(ct);
            await target.OpenAsync(ct);
            await using var command = source.CreateCommand();
            command.CommandText = "SELECT Json FROM SaveCharacter WHERE Id = 1";
            var character = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>((string)(await command.ExecuteScalarAsync(ct))!);
            source.BackupDatabase(target);
            return Ok(character);
        }
        finally { SlotLock.Release(); }
    }

    [HttpGet]
    public async Task<IActionResult> Download(CancellationToken ct)
    {
        var connectionString = configuration.GetConnectionString("GameDb")
            ?? throw new InvalidOperationException("Chưa cấu hình ConnectionStrings:GameDb.");
        var backupPath = Path.Combine(Path.GetTempPath(), $"phoxom-{Guid.NewGuid():N}.db");
        try
        {
            var sourceConnectionString = new SqliteConnectionStringBuilder(connectionString) { Pooling = false }.ToString();
            var targetConnectionString = new SqliteConnectionStringBuilder { DataSource = backupPath, Pooling = false }.ToString();
            await using (var source = new SqliteConnection(sourceConnectionString))
            await using (var target = new SqliteConnection(targetConnectionString))
            {
                await source.OpenAsync(ct);
                await target.OpenAsync(ct);
                source.BackupDatabase(target);
            }

            var content = await System.IO.File.ReadAllBytesAsync(backupPath, ct);
            return File(content, "application/vnd.sqlite3", $"phoxom-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}.db");
        }
        finally
        {
            if (System.IO.File.Exists(backupPath))
                System.IO.File.Delete(backupPath);
        }
    }
}
