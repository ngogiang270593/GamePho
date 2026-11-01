using Microsoft.AspNetCore.Mvc;
using server.Data;
using server.Services;

namespace server.Controllers;
[ApiController]
[Route("api/kitchen")]
public sealed class KitchenController(GameDbContext db) : ControllerBase
{
    public sealed record OpenRequest(string Session);
    [HttpPost("open")]
    public Task<IActionResult> Open(OpenRequest request, CancellationToken ct) => Run(() => new KitchenService(db).Open(request.Session, ct));
    [HttpGet("state")]
    public Task<IActionResult> State([FromQuery] string session, CancellationToken ct) => Run(() => new KitchenService(db).State(session, ct));
    [HttpPost("action")]
    public Task<IActionResult> Action(KitchenAction request, CancellationToken ct) => Run(() => new KitchenService(db).Act(request, request.Action == "leave" ? CancellationToken.None : ct));
    private async Task<IActionResult> Run(Func<Task<object>> action)
    {
        try { return Ok(await action()); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
