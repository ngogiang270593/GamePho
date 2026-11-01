using Microsoft.AspNetCore.Mvc; using server.DTOs; using server.Services;
namespace server.Controllers;
[ApiController][Route("api/upgrades")]
public sealed class UpgradesController(GameService gameService, HistoryService historyService) : ControllerBase
{
 [HttpGet] public async Task<ActionResult<IReadOnlyList<UpgradeResponse>>> Get(CancellationToken ct) => Ok(await gameService.GetUpgradesAsync(ct));
 [HttpPost("buy")] public async Task<ActionResult<UpgradeResponse>> Buy(BuyUpgradeRequest request,[FromQuery]int playerId=1,CancellationToken ct=default){try{var upgrade=await gameService.BuyUpgradeAsync(playerId,request,ct);await historyService.RecordAsync(playerId,"UpgradePurchase",$"Mua {upgrade.Name} cấp {upgrade.Level}.",-upgrade.Cost,0,0,upgrade.Id,ct);return Ok(upgrade);}catch(KeyNotFoundException e){return NotFound(new{message=e.Message});}catch(InvalidOperationException e){return BadRequest(new{message=e.Message});}}
}
