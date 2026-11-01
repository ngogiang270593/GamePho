namespace server.Models;

public class GameHistory
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public string ActionType { get; set; } = "";
    public string Summary { get; set; } = "";
    public decimal MoneyChange { get; set; }
    public int ReputationChange { get; set; }
    public int ViralChange { get; set; }
    public int? RelatedId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
