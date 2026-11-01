using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/players/{playerId:int}/progression")]
public sealed class ProgressionController(GameDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int playerId, CancellationToken ct)
    {
        var player = await db.Players.AsNoTracking().SingleOrDefaultAsync(item => item.Id == playerId, ct);
        if (player is null) return NotFound();

        var level = ProgressionService.GetLevel(player.ViralScore);
        return Ok(new
        {
            level,
            viralScore = player.ViralScore,
            viralProgress = ProgressionService.GetViralProgress(player.ViralScore),
            viralToNextLevel = ProgressionService.GetViralToNextLevel(player.ViralScore),
            viralPerLevel = ProgressionService.ViralPerLevel,
            unlockedFeatures = ProgressionService.GetUnlockedFeatures(level)
        });
    }
}
