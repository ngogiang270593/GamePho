namespace server.Services;

public static class ProgressionService
{
    public const int ViralPerLevel = 100;

    public static int GetLevel(int viralScore) => Math.Max(1, 1 + Math.Max(0, viralScore) / ViralPerLevel);

    public static int GetViralProgress(int viralScore) => Math.Max(0, viralScore) % ViralPerLevel;

    public static int GetViralToNextLevel(int viralScore) => ViralPerLevel - GetViralProgress(viralScore);

    public static IReadOnlyList<FeatureUnlock> FeatureUnlocks { get; } =
    [
        new(1, "Mở quán phở", "Bắt đầu phục vụ khách trong hẻm."),
        new(2, "Sân bóng hẻm", "Mở mini-game đá bóng và nhận thưởng viral."),
        new(3, "Khách VIP", "Có cơ hội đón khách VIP hư cấu."),
        new(4, "Thử thách khu phố", "Mở các sự kiện khu phố đặc biệt.")
    ];

    public static IReadOnlyList<FeatureUnlock> GetUnlockedFeatures(int level) =>
        FeatureUnlocks.Where(feature => level >= feature.Level).ToList();
}

public sealed record FeatureUnlock(int Level, string Name, string Description);
