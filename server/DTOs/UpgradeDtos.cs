namespace server.DTOs;
public sealed class BuyUpgradeRequest { public int UpgradeId { get; set; } }
public sealed record UpgradeResponse(int Id, string Name, string Description, string Category, int Level, int MaxLevel, decimal Cost, int EffectValue, bool IsPurchased);
