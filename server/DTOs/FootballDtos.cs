using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public sealed class FootballPlayRequest
{
    [Range(0, 100)] public int ShotPower { get; set; }
    [Range(-45, 45)] public int ShotAngle { get; set; }
    [Range(0, 100)] public int TimingScore { get; set; }
}

public sealed record FootballResult(bool IsGoal, int Score, decimal MoneyReward, int ViralReward, string Commentary);
