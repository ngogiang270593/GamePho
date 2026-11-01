using Microsoft.AspNetCore.Mvc;
using server.Data;
using server.Services;

namespace server.Controllers;

public sealed record TickRequest(double Seconds);
public sealed record PrepareRequest(string Mode, string Boon);
public sealed record VisitRequest(string NpcId);
public sealed record CloseDayRequest(bool Forfeit = false);

[ApiController]
[Route("api/journey")]
public sealed class JourneyController(GameDbContext db) : ControllerBase
{
    [HttpPost("tick")]
    public Task<IActionResult> Tick(TickRequest request, CancellationToken ct) => Run(s => s.TickAsync(1, request.Seconds, ct));
    [HttpPost("prepare")]
    public Task<IActionResult> Prepare(PrepareRequest request, CancellationToken ct) => Run(s => s.ConfigureAsync(1, request.Mode, request.Boon, ct));
    [HttpPost("next-wave")]
    public Task<IActionResult> NextWave(CancellationToken ct) => Run(s => s.NextWaveAsync(1, ct));
    [HttpPost("visit")]
    public Task<IActionResult> Visit(VisitRequest request, CancellationToken ct) => Run(s => s.VisitAsync(1, request.NpcId, ct));
    [HttpPost("close")]
    public Task<IActionResult> Close(CloseDayRequest request, CancellationToken ct) => Run(s => s.CloseAsync(1, request.Forfeit, ct));
    [HttpPost("continue")]
    public Task<IActionResult> Continue(CancellationToken ct) => Run(s => s.ContinueAsync(1, ct));

    private async Task<IActionResult> Run(Func<JourneyService, Task<object>> action)
    {
        try { return Ok(await action(new JourneyService(db))); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}
