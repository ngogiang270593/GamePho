namespace server.Models;
public class Achievement { public int Id { get; set; } public string Name { get; set; } = ""; public string Description { get; set; } = ""; public string Code { get; set; } = ""; public int TargetValue { get; set; } public int CurrentValue { get; set; } public bool IsUnlocked { get; set; } public DateTime? UnlockedAt { get; set; } }
