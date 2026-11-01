using Microsoft.AspNetCore.Mvc; using Microsoft.EntityFrameworkCore; using server.Data;
namespace server.Controllers;
[ApiController][Route("api/menu")]
public class MenuController(GameDbContext db) : ControllerBase { [HttpGet] public async Task<IActionResult> Get() => Ok(await db.MenuItems.Where(x=>x.IsAvailable).Select(x=>new { x.Id, x.Name, x.Price }).ToListAsync()); }
