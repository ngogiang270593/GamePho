using System.ComponentModel.DataAnnotations;
namespace server.DTOs;
public sealed class ResolveEventRequest
{
    [Range(1, int.MaxValue)] public int EventId { get; set; }
    [Range(1, int.MaxValue)] public int OptionId { get; set; }
}
public sealed record EventOptionResponse(int Id, string Text, decimal MoneyChange = 0, int ReputationChange = 0, int ViralChange = 0, string? Path = null);
public sealed record RandomEventResponse(int Id, string Title, string Description, string EventType, List<EventOptionResponse> Options) { public string Actor { get; init; } = "ba-nam"; }
public sealed record ResolveEventResponse(string ResultText, decimal Money, int Reputation, int ViralScore, decimal MoneyChange = 0, int ReputationChange = 0, int ViralChange = 0, bool DramaResolved = false);
