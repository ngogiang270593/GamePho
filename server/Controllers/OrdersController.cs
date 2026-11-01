using Microsoft.AspNetCore.Mvc; using server.DTOs; using server.Services;
namespace server.Controllers;
[ApiController][Route("api/orders")]
public class OrdersController(GameService gameService, HistoryService historyService):ControllerBase{[HttpPost] public async Task<ActionResult<CreateOrderResponse>> Create(CreateOrderRequest request,[FromQuery]int playerId=1,CancellationToken ct=default){try{var order=await gameService.CreateOrderAsync(playerId,request,ct);await historyService.RecordAsync(playerId,"PhoOrder",order.Message,order.MoneyChange,order.ReputationChange,order.ViralChange,order.Id,ct);return Ok(order);}catch(KeyNotFoundException e){return NotFound(new{message=e.Message});}catch(InvalidOperationException e){return BadRequest(new{message=e.Message});}}}
