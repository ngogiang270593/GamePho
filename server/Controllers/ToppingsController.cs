using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;

namespace server.Controllers;

[ApiController]
[Route("api/toppings")]
public sealed class ToppingsController(GameDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ToppingResponse>>> Get(CancellationToken ct)
    {
        var toppings = await db.Toppings.AsNoTracking()
            .Where(topping => topping.IsAvailable && topping.Name != "Khăn lạnh")
            .OrderBy(topping => topping.Name)
            .Select(topping => new ToppingResponse(topping.Id, topping.Name, topping.Price))
            .ToListAsync(ct);

        return Ok(toppings);
    }
}
