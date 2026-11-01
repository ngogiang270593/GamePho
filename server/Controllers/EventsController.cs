using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;
namespace server.Controllers;
[ApiController]
[Route("api/events")]
public sealed class EventsController(GameService gameService, HistoryService historyService) : ControllerBase
{
    [HttpGet("random")]
    public async Task<ActionResult<RandomEventResponse>> Random(CancellationToken ct)
    {
        var result = await gameService.GetRandomEventAsync(ct);
        return result is null ? NoContent() : Ok(result);
    }
    [HttpPost("resolve")]
    public async Task<ActionResult<ResolveEventResponse>> Resolve(ResolveEventRequest request, CancellationToken ct)
    {
        try
        {
            var result = await gameService.ResolveEventAsync(1, request, ct);
            await historyService.RecordAsync(1, result.DramaResolved ? "DramaEventResolved" : "GameEventResolved", result.ResultText, result.MoneyChange, result.ReputationChange, result.ViralChange, request.EventId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}
