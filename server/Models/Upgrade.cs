using server.Models.Enums;
namespace server.Models;
public class Upgrade { public int Id { get; set; } public string Name { get; set; } = ""; public string Description { get; set; } = ""; public UpgradeCategory Category { get; set; } public int Level { get; set; } public int MaxLevel { get; set; } public decimal Cost { get; set; } public int EffectValue { get; set; } public bool IsPurchased { get; set; } }
