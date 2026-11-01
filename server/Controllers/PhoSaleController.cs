using Microsoft.AspNetCore.Mvc;
using server.Data;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/pho-sale")]
public sealed class PhoSaleController(GameDbContext db) : ControllerBase
{
    [HttpPost("{customerId:int}/begin")]
    public async Task<IActionResult> Begin(int customerId, CancellationToken ct)
    {
        try { return Ok(await new PhoSaleService(db).BeginAsync(customerId, ct)); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("{customerId:int}/fail")]
    public async Task<IActionResult> Fail(int customerId)
    {
        // Complete the failure even when the browser has already left the page.
        await new PhoSaleService(db).EndAsync(customerId, CancellationToken.None);
        return Ok();
    }
}
