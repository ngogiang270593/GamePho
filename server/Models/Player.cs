namespace server.Models;

public class Player
{
    public int Id { get; set; }
    public string DisplayName { get; set; } = "";
    public decimal Money { get; set; } = 500000m;
    public int Reputation { get; set; } = 50;
    public int DramaScore { get; set; }
    public int ViralScore { get; set; } = 0;
    public int Level { get; set; } = 1;
    public int CurrentDay { get; set; } = 1;
    public int CustomersServedToday { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
