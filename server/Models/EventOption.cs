namespace server.Models;
public class EventOption { public int Id { get; set; } public int RandomEventId { get; set; } public RandomEvent? RandomEvent { get; set; } public string Text { get; set; } = ""; public decimal MoneyChange { get; set; } public int ReputationChange { get; set; } public int ViralChange { get; set; } public string ResultText { get; set; } = ""; }
