using System.ComponentModel.DataAnnotations;

namespace server.Models;

// Kept in SQLite with the rest of the save, including downloaded backups.
public sealed class GameJourney
{
    [Key] public int PlayerId { get; set; }
    public string StateJson { get; set; } = "{}";
}

public sealed class JourneyProgress
{
    public int? ActiveSaleCustomerId { get; set; }
    public DateTime? SaleDeadlineUtc { get; set; }
    public KitchenProgress Kitchen { get; set; } = new();
    public long Revision { get; set; }
    public int Season { get; set; } = 1;
    public int CompletedDays { get; set; }
    public bool IsOpen { get; set; }
    public double Minute { get; set; } = 360;
    public DateTime LastTickUtc { get; set; } = DateTime.UtcNow;
    public string Mode { get; set; } = "cozy";
    public string Boon { get; set; } = "tea";
    public string Weather { get; set; } = "clear";
    public int DayServed { get; set; }
    public int DayCorrect { get; set; }
    public int DayLost { get; set; }
    public int DayChoices { get; set; }
    public decimal DayStartMoney { get; set; }
    public int Combo { get; set; }
    public int BestCombo { get; set; }
    public int TotalServed { get; set; }
    public int TotalCorrect { get; set; }
    public int GoalsWon { get; set; }
    public int Community { get; set; }
    public int Craft { get; set; }
    public int Fame { get; set; }
    public int Mischief { get; set; }
    public int StoriesToday { get; set; }
    public Dictionary<int, double> WaitSeconds { get; set; } = [];
    public Dictionary<int, double> Arrivals { get; set; } = [];
    public List<int> PendingEvents { get; set; } = [];
    public Dictionary<int, string> EventKeys { get; set; } = [];
    public List<string> SeenStories { get; set; } = [];
    public List<string> VisitsToday { get; set; } = [];
    public List<JourneyMemory> Memories { get; set; } = [];
    public List<string> UnlockedEndings { get; set; } = [];
    public string? Ending { get; set; }
    public JourneyReport? Report { get; set; }
}

public sealed record JourneyMemory(int Day, string Title, string Choice, string Result, string Path);
public sealed record JourneyReport(int Day, int Served, int Correct, int Lost, int BestCombo, decimal NetMoney, bool GoalMet, decimal Reward, string Quip);
