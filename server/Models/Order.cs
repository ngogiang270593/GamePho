using server.Models.Enums;
namespace server.Models;
public class Order { public int Id { get; set; } public int PlayerId { get; set; } public Player? Player { get; set; } public int CustomerId { get; set; } public Customer? Customer { get; set; } public PhoType PhoType { get; set; } public string Toppings { get; set; } = ""; public decimal Price { get; set; } public bool IsCorrect { get; set; } public int ServiceTimeSeconds { get; set; } public int ReputationChange { get; set; } public int ViralChange { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
