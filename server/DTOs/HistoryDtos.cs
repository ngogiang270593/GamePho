namespace server.DTOs;

public sealed record GameStatisticsResponse(
    int TotalOrders,
    int CorrectOrders,
    decimal TotalRevenue,
    int TotalGoals,
    int CurrentStreak,
    int ShopLevel);

public sealed record OrderHistoryResponse(
    int Id,
    string CustomerName,
    string PhoType,
    string Toppings,
    decimal Price,
    bool IsCorrect,
    int ServiceTimeSeconds,
    DateTime CreatedAt);

public sealed record EventHistoryResponse(
    int Id,
    string ActionType,
    string Summary,
    decimal MoneyChange,
    int ReputationChange,
    int ViralChange,
    DateTime CreatedAt);

public sealed record RevenueHistoryResponse(string Date, decimal Revenue);

public sealed record AchievementResponse(
    int Id,
    string Name,
    string Description,
    string Code,
    int TargetValue,
    int CurrentValue,
    bool IsUnlocked,
    DateTime? UnlockedAt);
