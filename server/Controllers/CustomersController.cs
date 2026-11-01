using Microsoft.AspNetCore.Mvc;
using server.Services;
namespace server.Controllers;
[ApiController]
[Route("api/players/{playerId:int}/customers")]
public class CustomersController(CustomerService customerService, GameService gameService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate(int playerId, CancellationToken ct)
    {
        try { return Ok(await customerService.GenerateCustomersAsync(playerId, ct)); }
        catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
    }
    [HttpPost("expire")]
    public async Task<IActionResult> Expire(int playerId, CancellationToken ct)
        => await gameService.ExpireCustomersAsync(playerId, ct) is { } result ? Ok(result) : NotFound();}
