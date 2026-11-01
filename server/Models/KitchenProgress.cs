namespace server.Models;

public sealed class KitchenProgress
{
    public string? Session { get; set; }
    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;
    public double Heat { get; set; } = 82;
    public string Fire { get; set; } = "medium";
    public double Broth { get; set; } = 6;
    public int Noodles { get; set; } = 4;
    public DateTime? RefillAt { get; set; }
    public DateTime? PrepAt { get; set; }
    public bool LargePot { get; set; }
    public bool PrepRack { get; set; }
    public bool Insulated { get; set; }
    public List<KitchenBowl> Bowls { get; set; } = [];
    public Dictionary<string, KitchenRegular> Regulars { get; set; } = [];
    public Dictionary<int, KitchenRequest> Requests { get; set; } = [];
    public Dictionary<string, KitchenSignature> Signatures { get; set; } = [];
    public List<int> Redone { get; set; } = [];
    public KitchenSaleResult? LastSale { get; set; }
    public string Notice { get; set; } = "Hai chỗ đặt tô. Chọn khách, chuẩn bị nguyên liệu rồi giữ nhịp bếp.";
    public bool ReferralPending { get; set; }
    public int DailyGift { get; set; }
}
public sealed class KitchenBowl
{
    public int Slot { get; set; }
    public int CustomerId { get; set; }
    public DateTime DeadlineUtc { get; set; }
    public DateTime StartedUtc { get; set; }
    public int? PhoType { get; set; }
    public List<string> Toppings { get; set; } = [];
    public string Phase { get; set; } = "draft";
    public DateTime? BlanchStartedUtc { get; set; }
    public DateTime? ReadyUtc { get; set; }
    public double PourHeat { get; set; }
    public double CookSeconds { get; set; }
    public string Texture { get; set; } = "chưa nhúng";
    public bool Confirmed { get; set; }
}
public sealed class KitchenRegular
{
    public string Name { get; set; } = "";
    public int Visits { get; set; }
    public int GoodOrders { get; set; }
    public int Helped { get; set; }
    public int LastHelpDay { get; set; }
    public int GiftsReceived { get; set; }
    public int GiftClaimedDay { get; set; }
    public string Memory { get; set; } = "";
    public int? FavoritePho { get; set; }
    public string FavoriteToppings { get; set; } = "";
}
public sealed class KitchenRequest
{
    public string Kind { get; set; } = "";
    public string Text { get; set; } = "";
    public string? Decision { get; set; }
}
public sealed class KitchenSignature
{
    public string Key { get; set; } = "";
    public string Name { get; set; } = "Món tủ chưa đặt tên";
    public int PhoType { get; set; }
    public List<string> Toppings { get; set; } = [];
    public int Likes { get; set; }
}
public sealed record KitchenSaleResult(int CustomerId, string CustomerName, bool Correct, string Message, decimal Money, string Texture, bool Drama, bool CanRedo);
