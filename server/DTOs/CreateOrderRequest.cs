using server.Models.Enums;
namespace server.DTOs;
public class CreateOrderRequest { public int CustomerId { get; set; } public PhoType PhoType { get; set; } public string Toppings { get; set; } = ""; public int ServiceTimeSeconds { get; set; } }
