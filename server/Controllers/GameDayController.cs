using Microsoft.AspNetCore.Mvc; using server.DTOs; using server.Services;
namespace server.Controllers;
[ApiController][Route("api/game")]
public class GameDayController(GameService gameService) : ControllerBase
{
 [HttpPost("start-day")]
 public async Task<ActionResult<StartDayResponse>> StartDay([FromQuery] int playerId = 1, CancellationToken ct = default) { try { var result = await gameService.StartDayAsync(playerId, ct); return result is null ? NotFound() : Ok(result); } catch (InvalidOperationException ex) { return Conflict(new { code="DAY_NOT_FINISHED", message=ex.Message }); } }
}
