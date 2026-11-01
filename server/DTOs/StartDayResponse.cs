namespace server.DTOs;
public sealed class StartDayResponse { public int CurrentDay { get; set; } public decimal OperatingCost { get; set; } public decimal RemainingMoney { get; set; } public object[] Customers { get; set; } = []; public object? Event { get; set; } public string Message { get; set; } = ""; }
