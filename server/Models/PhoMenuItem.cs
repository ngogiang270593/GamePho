using server.Models.Enums;
namespace server.Models;
public class PhoMenuItem { public int Id { get; set; } public string Name { get; set; } = ""; public PhoType PhoType { get; set; } public decimal BasePrice { get; set; } public bool IsAvailable { get; set; } = true; public string Description { get; set; } = ""; }
