using server.Models.Enums;
namespace server.DTOs;
public sealed class GameStateResponse
{
    public object? Journey { get; set; }
    public PlayerStateDto Player { get; set; } = new();
    public List<CustomerStateDto> WaitingCustomers { get; set; } = [];
    public List<PhoMenuItemStateDto> Menu { get; set; } = [];
    public List<UpgradeResponse> Upgrades { get; set; } = [];
    public List<UpgradeStateDto> PurchasedUpgrades { get; set; } = [];
    public List<RandomEventResponse> RandomEvents { get; set; } = [];
    public List<AchievementStateDto> Achievements { get; set; } = [];
    public List<FeatureUnlockDto> UnlockedFeatures { get; set; } = [];
}
public sealed class PlayerStateDto { public int Id { get; set; } public string DisplayName { get; set; } = ""; public decimal Money { get; set; } public int Reputation { get; set; } public int ViralScore { get; set; } public int Level { get; set; } public int CurrentDay { get; set; } public int CustomersServedToday { get; set; } public int ViralProgress { get; set; } public int ViralToNextLevel { get; set; } }
public sealed class CustomerStateDto { public string PersonaKey { get; set; } = ""; public int Id { get; set; } public string Name { get; set; } = ""; public CustomerType CustomerType { get; set; } public int Hunger { get; set; } public int Patience { get; set; } public double? SecondsRemaining { get; set; } public PhoType? PreferredPhoType { get; set; } public string RequiredToppings { get; set; } = ""; public DateTime ArrivedAt { get; set; } public string Dialogue { get; set; } = ""; }
public sealed class PhoMenuItemStateDto { public int Id { get; set; } public string Name { get; set; } = ""; public PhoType PhoType { get; set; } public decimal BasePrice { get; set; } public bool IsAvailable { get; set; } public bool IsDailySpecial { get; set; } public string Description { get; set; } = ""; }
public sealed class UpgradeStateDto { public int Id { get; set; } public string Name { get; set; } = ""; public int Level { get; set; } public int MaxLevel { get; set; } public bool IsPurchased { get; set; } }
public sealed class AchievementStateDto { public int Id { get; set; } public string Name { get; set; } = ""; public string Description { get; set; } = ""; public string Code { get; set; } = ""; public int TargetValue { get; set; } public int CurrentValue { get; set; } public bool IsUnlocked { get; set; } public DateTime? UnlockedAt { get; set; } }
public sealed record FeatureUnlockDto(int Level, string Name, string Description);
