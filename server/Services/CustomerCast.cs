using server.Models.Enums;

namespace server.Services;

public sealed record CustomerPersona(string Key, CustomerType Type, string Name, int PatienceBonus, string Greeting, string Happy, string Unhappy);

public static class CustomerCast
{
    public static readonly CustomerPersona[] All = [
        new("bay", CustomerType.HangXom, "Chú Bảy Húp Sạch", 12, "Cho chú tô nóng nha. Tô sạch là lời khen chân thành nhất!", "Húp sạch rồi! Chủ quán khỏi rửa… à vẫn phải rửa nha!", "Ủa chú gọi món kia. Chú húp kỹ chứ không húp đại nghen."),
        new("ba-gia", CustomerType.HangXom, "Cô Ba Xin Thêm Giá", 15, "Cô ăn như mọi bữa. Thêm chút giá là cô vui cả ngày.", "Nước trong, giá giòn! Chiều cô đem bó rau vườn qua.", "Con ơi, hình như tô của cô đi lạc qua bàn bên rồi."),
        new("nam-dep", CustomerType.HangXom, "Bác Năm Dép Tổ Ong", 20, "Từ từ làm con, bác còn đang tìm chiếc dép bên trái.", "Ngon, ấm bụng. Dép cũng tìm thấy rồi, ngày đẹp quá!", "Bác không vội, nhưng món này chưa đúng ý bác gọi."),
        new("teo", CustomerType.Shipper, "Anh Tèo Tốc Hành", -8, "Cho anh tô gọn lẹ. Hôm nay anh giao đồ, đừng để bụng giao réo!", "Nạp đủ năng lượng! Chuyến này anh giao luôn lời khen cho cả hẻm.", "Anh cần đúng món để còn chạy đơn. Mình kiểm tra lại nha."),
        new("ship-lac", CustomerType.Shipper, "Chị Na Không Lạc Đường", -5, "Chị tìm đúng hẻm rồi. Mong tô phở cũng tìm đúng bàn chị!", "Định vị chuẩn nhất hôm nay: ngay cạnh nồi phở này.", "Chắc món này rẽ nhầm ngõ rồi em. Cho chị xem lại đơn nhé."),
        new("bin-pin", CustomerType.Shipper, "Bin Pin Còn Một Vạch", -10, "Điện thoại còn một vạch, bụng thì hết pin. Cứu anh tô phở!", "Bụng đầy pin, điện thoại vẫn đỏ. Nhưng đời đẹp hơn rồi!", "Đơn chưa đúng, mà pin anh không đủ để mở họp khẩn đâu."),
        new("sau", CustomerType.CauThu, "Chú Sáu Bù Giờ", 5, "Cho chú tô trước giờ bóng lăn. Lượt này đừng bù giờ lâu quá!", "Tô này xứng đáng vào đội hình tiêu biểu!", "VAR đâu? Chú gọi tái mà sao tô này trông như đổi chiến thuật?"),
        new("hung-var", CustomerType.CauThu, "Hùng VAR Miệng", 0, "Anh nhìn đơn kỹ lắm, nhưng chuyện việt vị thì anh hay nhìn nhầm.", "Bàn này hợp lệ. Công nhận tuyệt phẩm nước dùng!", "Khoan trao bàn thắng, mình xem lại topping đã nhé."),
        new("dat-khung", CustomerType.CauThu, "Đạt Sút Trúng Khung Cửa", 8, "Anh chỉ sút trúng cửa nhà. Ăn xong nhớ chỉ đường ra sân nha.", "Phở vào đúng dạ dày. Ước gì bóng cũng vào đúng lưới!", "Món hơi lệch mục tiêu, giống cú sút của anh. Mình sửa được mà."),
        new("ti-top", CustomerType.TikToker, "Tí Tóp Tóp", -4, "A lô cả nhà! Máy quay ăn trước ba giây, người thật ăn sau nha!", "Quay được đúng một giây, ngon quá nên quên quay tiếp!", "Cả nhà ơi khoan… món chưa đúng. Cho quán cơ hội kiểm tra nhé."),
        new("phuc-review", CustomerType.TikToker, "Phúc Rì Viu", -2, "Mình review bằng vị giác, hôm nay quyết không chấm cái ghế nữa.", "Đánh giá ngắn gọn: còn tô nữa không?", "Mình gọi món khác. Sửa đơn trước, sửa video sau nha."),
        new("mi-filter", CustomerType.TikToker, "Mi Không Cần Filter", 2, "Ánh sáng đẹp rồi, phở ngon là khỏi cần hiệu ứng luôn!", "Nước dùng trong hơn cả filter yêu thích của mình!", "Màu đẹp nhưng đơn hơi sai. Filter không sửa được topping đâu."),
        new("tam", CustomerType.BaTam, "Cô Tám Tin Nóng", -5, "Cô chỉ nghe chuyện thôi, không kể ai đâu… trừ nhóm xóm mình.", "Tin nóng: phở ngon! Tin này cô cho phép cả hẻm biết.", "Tô này chưa đúng. Cô chưa đăng nhóm đâu, con xem lại trước nha."),
        new("tu-wifi", CustomerType.BaTam, "Dì Tư Wi-Fi Mạnh", 0, "Mạng nhà dì bắt được từ đầu ngõ. Chuyện xóm cũng vậy.", "Tín hiệu tốt: ngon năm vạch!", "Món bị mất kết nối với đơn dì gọi rồi con."),
        new("lan-hong", CustomerType.BaTam, "Cô Lan Hóng Có Chọn Lọc", 5, "Cô hóng chuyện vui thôi, chuyện buồn để cô phụ một tay.", "Có chuyện đáng kể rồi: bếp mình ngày càng ngon!", "Chưa đúng món, con sửa giúp cô. Hóng thì hóng, mình vẫn phải công bằng."),
        new("linh-deadline", CustomerType.SinhVien, "Linh Chạy Deadline", -4, "Deadline dí sau lưng, bụng réo phía trước. Cho em tô cứu trợ!", "Tô phở cứu một chiếc deadline! Em về gõ tiếp đây.", "Em chọn món kia, chắc deadline làm ai cũng hơi rối. Mình sửa nha."),
        new("khoi-hoc", CustomerType.SinhVien, "Khôi Học Từ Mai", 8, "Hôm nay em ăn lấy sức. Mai em học, lần này mai thật!", "Ngon quá! Em quyết tâm… mai quay lại.", "Đơn chưa đúng, mà em không thể trì hoãn cơn đói tới mai đâu."),
        new("vy-cuoi", CustomerType.SinhVien, "Vy Cuối Tháng", 12, "Ví mỏng nhưng tinh thần dày. Cho em đúng món em chọn nhé.", "Ăn no mà vẫn đủ tiền về. Hôm nay em giàu niềm vui!", "Em tính tiền kỹ lắm, cho em đúng tô đã gọi nha."),
        new("chu-binh", CustomerType.KhachKhoTinh, "Chú Bình Soi Topping", -12, "Chú hơi kỹ tính, chứ không khó thương. Cứ đúng đơn là chú vui.", "Đúng từng topping! Chú đã soi và chú công nhận.", "Chú phát hiện chi tiết chưa khớp. Mình đối chiếu lại đơn nhé."),
        new("co-hanh", CustomerType.KhachKhoTinh, "Cô Hạnh Không Hành", -8, "Tên cô có Hạnh, tô cô đừng có hành. Mình nhớ khác nhau nha!", "Không một cọng hành lạc. Cô rất hạnh phúc!", "Tên cô không phải yêu cầu topping đâu con. Xem lại giúp cô nhé."),
        new("anh-chuan", CustomerType.KhachKhoTinh, "Anh Chuẩn Từng Sợi", -10, "Anh gọi sao ăn vậy. Đừng thêm bất ngờ, anh dễ giật mình.", "Chuẩn vị, chuẩn đơn, chuẩn luôn cái bụng vui!", "Bất ngờ này anh chưa đặt. Mình làm đúng yêu cầu giúp anh nha."),
        new("bo", CustomerType.GiaDinh, "Bé Bo Không Hành", 18, "Con tìm hành giỏi lắm! Nhưng hôm nay con muốn tìm thịt cơ.", "Con chấm nhiều sao hơn số bài tập con làm được!", "Cô chú ơi tô này khác hình con chọn. Con báo mẹ kiểm tra nha."),
        new("me-min", CustomerType.GiaDinh, "Mẹ Mít Và Biệt Đội Đói", 15, "Nhà chị ba người, ba cái bụng cùng biểu tình. Mình nấu đúng đơn nha.", "Biệt đội đã yên lặng. Đây là lời khen lớn nhất của nhà chị!", "Bọn nhỏ chờ hơi sốt ruột rồi, mình kiểm tra giúp chị đơn nhé."),
        new("ong-tam", CustomerType.GiaDinh, "Ông Tám Dắt Cháu Đi Chơi", 22, "Ông ăn từ tốn, cháu thì hỏi liên tục. Quán cứ làm đúng món giúp ông.", "Cháu ông bảo mai lại đi chơi… đúng quán này thôi.", "Ông nhớ mình gọi món khác. Chậm chút cũng được, đúng món là vui."),
        new("co-sen", CustomerType.KhachVip, "Cô Sen VIP Đi Dép Lào", 8, "VIP là Vừa Ý Phở thôi. Đừng làm khác với khách quen nha con.", "Vừa ý phở, vừa ý người. Cô sẽ quay lại thật thường.", "Quán quý khách thì cũng nhớ đúng yêu cầu của cô nhé."),
        new("chu-an", CustomerType.KhachVip, "Chú An Ăn Ẩn Danh", 10, "Chú ăn ẩn danh mà cả hẻm cứ gọi tên. Cho chú tô như đã chọn nhé.", "Giữ bí mật giùm chú: chú muốn gọi thêm một tô!", "Chú không cần ưu tiên, chỉ cần đúng đơn thôi con."),
        new("hai-hat", CustomerType.KhachVip, "Chị Hai Hạt Michelin Tự Trồng", 5, "Nhà chị có hai chậu hạt giống, ai cũng nghe nhầm thành hai sao. Chị chỉ đến ăn phở!", "Nếu hạt giống mọc nhanh như lời khen thì nhà chị thành rừng rồi!", "Chị chưa chấm sao đâu, nhưng đơn này cần mình sửa trước nha.")
    ];
    public static CustomerPersona? Find(string key) => All.FirstOrDefault(x => x.Key == key);
}
