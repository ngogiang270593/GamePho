using Microsoft.AspNetCore.Mvc;
using server.Services;
namespace server.Controllers;
[ApiController]
[Route("api/players/{playerId:int}/game")]
public class GameController(GameService gameService) : ControllerBase
{
    [HttpGet("state")] public async Task<IActionResult> State(int playerId, CancellationToken ct) => (await gameService.GetGameStateAsync(playerId, ct)) is { } state ? Ok(state) : NotFound();
    [HttpPost("new-day")] public async Task<IActionResult> NewDay(int playerId, CancellationToken ct) => (await gameService.StartNewDayAsync(playerId, ct)) is { } player ? Ok(player) : NotFound();
    [HttpPost("reset")] public async Task<IActionResult> Reset(int playerId, CancellationToken ct) => await gameService.ResetGameAsync(playerId, ct) ? Ok() : NotFound();
}
