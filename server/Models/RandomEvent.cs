using server.Models.Enums;
namespace server.Models;
public class RandomEvent { public int Id { get; set; } public string Title { get; set; } = ""; public string Description { get; set; } = ""; public EventType EventType { get; set; } public bool IsActive { get; set; } = true; public ICollection<EventOption> Options { get; set; } = new List<EventOption>(); }
