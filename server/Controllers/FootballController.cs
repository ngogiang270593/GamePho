using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/football")]
public sealed class FootballController(FootballService footballService) : ControllerBase
{
    [HttpPost("play")]
    public async Task<ActionResult<FootballResult>> Play(
        FootballPlayRequest request,
        [FromQuery] int playerId = 1,
        CancellationToken ct = default)
    {
        try
        {
            return Ok(await footballService.PlayAsync(playerId, request, ct));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }
}
