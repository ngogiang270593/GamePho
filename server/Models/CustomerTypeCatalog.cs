using server.Models.Enums;
namespace server.Models;
public static class CustomerTypeCatalog
{
    public static readonly IReadOnlyDictionary<CustomerType, (string Description, string Behavior)> Definitions = new Dictionary<CustomerType, (string, string)>
    {
        [CustomerType.HangXom] = ("Người hàng xóm thân thiện, thích trò chuyện.", "Tăng uy tín nếu phục vụ đúng món; kiên nhẫn vừa phải."),
        [CustomerType.Shipper] = ("Đang tranh thủ ăn giữa các chuyến giao hàng.", "Phục vụ nhanh sẽ nhận thêm tiền boa; hết kiên nhẫn rất nhanh."),
        [CustomerType.CauThu] = ("Cầu thủ cần bữa ăn nhiều năng lượng.", "Ưu tiên phần lớn và quẩy; thưởng uy tín khi no bụng."),
        [CustomerType.TikToker] = ("Nhà sáng tạo nội dung luôn săn chuyện lạ.", "Món đẹp và phục vụ tốt có thể tăng ViralScore; dễ đánh giá công khai."),
        [CustomerType.BaTam] = ("Khách thích cập nhật mọi chuyện trong hẻm.", "Chờ lâu sẽ lan truyền tin xấu; phục vụ nhanh giúp tăng uy tín."),
        [CustomerType.SinhVien] = ("Sinh viên cần món ngon với ngân sách tiết kiệm.", "Nhạy cảm với giá; ưu đãi hợp lý giúp quay lại."),
        [CustomerType.KhachKhoTinh] = ("Khách kỹ tính, để ý từng chi tiết.", "Sai topping hoặc sai nhiệt độ sẽ giảm mạnh uy tín."),
        [CustomerType.GiaDinh] = ("Gia đình đi ăn cùng nhau, gọi nhiều phần.", "Phục vụ đủ món cho cả bàn tạo doanh thu và uy tín cao."),
        [CustomerType.KhachVip] = ("Một vị khách VIP hư cấu ghé quán, thích sự chỉn chu và kín đáo.", "Phục vụ đúng món giúp tăng uy tín và viral; không cần ưu tiên ngoài hàng chờ."),
    };
}
