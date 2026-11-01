using server.Models.Enums;

namespace server.Services;

internal static class CustomerDialogue
{
    private static readonly string[] FunnyLines =
    [
        "Tô phở nóng tới mức chuyện trong hẻm cũng nguội bớt.",
        "Tôi gọi một tô phở, không gọi bài kiểm tra trí nhớ topping.",
        "Nước dùng thơm quá, hàng xóm nhà tôi cũng vừa ló đầu qua.",
        "Ăn xong tô này chắc tôi chạy nhanh hơn chiếc xe giao hàng.",
        "Phở ngon thì tôi kể, phở dở thì cô tôi kể trước.",
        "Tôi đang đói đến mức nhìn cái vá cũng thấy giống bánh phở.",
        "Cho thêm rau nhé, bác sĩ bảo tôi cần sống xanh.",
        "Topping này lạ quá, hay là quà bí mật của quán?",
        "Tôi đến ăn phở, tiện thể cập nhật tình hình đầu hẻm.",
        "Tô phở bốc khói, tin đồn trong xóm cũng bốc theo.",
        "Ăn nhanh còn kịp giao hàng, khách chờ chắc đang tập kiên nhẫn.",
        "Thơm thế này mà quay video thì bụng tôi lên xu hướng trước.",
        "Tôi đói tới mức nghe tiếng nồi sôi cũng tưởng chuông gọi món.",
        "Bát này mà đúng yêu cầu thì tôi giới thiệu cả nhóm chat.",
        "Sai một cọng hành là cô tôi có thêm chuyện kể cả tuần.",
        "Tôi gọi phở gà, không gọi buổi họp gia đình với topping lạ.",
        "Nước dùng ngon quá, tôi xin phép im lặng để tập trung ăn.",
        "Đói quá nên cái ghế nhựa cũng trông như món khai vị.",
        "Tôi đang canh giờ, chứ không phải canh xem ai trong hẻm mới chuyển nhà.",
        "Tô phở này mà giao nhầm địa chỉ thì shipper cũng bó tay.",
        "Ăn xong tôi sẽ đánh giá bằng cả trái tim và cái bụng.",
        "Tôi xin thêm chanh, không xin thêm chuyện thị phi.",
        "Nồi phở sôi nghe vui như nhóm chat vừa có tin nóng.",
        "Mùi thơm này đi xa hơn cả tin bà Tám vừa kể.",
        "Chủ quán chan nước dùng, còn tôi chan thêm chút hy vọng.",
        "Tô vừa đủ no, ví vừa đủ vui, tháng này vừa đủ sống.",
        "Tôi gọi món rõ ràng, chắc cái bụng nghe nhầm thành gọi thêm.",
        "Ăn phở xong tôi sẽ sút bóng, nếu bụng cho phép.",
        "Tô này thơm tới mức chú chó đầu hẻm cũng xin làm thực khách.",
        "Để nguội một chút nhé, tôi còn phải chụp ảnh gửi hội bạn.",
        "Tôi không khó tính, tôi chỉ nhớ chính xác từng cọng rau.",
        "Quán đông thế này chắc nước dùng cũng đang chạy deadline.",
        "Tôi đặt món bằng lời, mong tô phở đừng trả lời bằng hành.",
        "Ăn xong nhớ tính tiền, đừng tính luôn chuyện nhà bên cạnh.",
        "Tôi thấy tô phở rồi, giờ chỉ thiếu chiếc bụng thứ hai.",
        "Phở ngon là chuyện vui, phở đúng đơn là kỳ tích.",
        "Tôi đang đói, xin đừng kể chuyện dài hơn sợi bánh phở.",
        "Bát phở này mà ngon thì hôm nay tôi bỏ qua mọi drama.",
        "Cẩn thận nhé, điện thoại tôi đang quay cả nồi nước dùng.",
        "Tôi muốn ăn phở, không muốn chơi trò đoán nguyên liệu.",
        "Mùi thơm lan khắp hẻm, kế hoạch ăn kiêng vừa xin nghỉ.",
        "Bát phở nóng hơn cuộc tranh luận xem ai giữ remote.",
        "Tôi gọi ít cay, chứ không gọi thử thách lòng can đảm.",
        "Nước dùng đậm đà, câu chuyện trong xóm cũng đậm không kém.",
        "Nếu ngon tôi quay lại, nếu chưa ngon tôi cũng quay lại góp ý.",
        "Tôi ăn xong rồi mới kể chuyện, hứa danh dự của người đang đói.",
        "Món lên chậm quá, tôi kịp học thuộc cả bảng giá rồi.",
        "Thêm quẩy nhé, để cuộc đời hôm nay giòn hơn một chút.",
        "Khách đông nhưng đừng quên tô của tôi đang nhớ chủ.",
        "Đúng món rồi, giờ chỉ còn nhiệm vụ ăn cho hết chuyện.",
        "Tô phở này cứu đói tốt hơn mọi tin nhắn động viên."
    ];

    public static string For(CustomerType type)
    {
        var line = FunnyLines[Random.Shared.Next(FunnyLines.Length)];
        var opening = type switch
        {
            CustomerType.HangXom => "Hàng xóm sát bên có lời nhắn: ",
            CustomerType.Shipper => "Shipper tranh thủ nói: ",
            CustomerType.CauThu => "Cầu thủ phủi cười: ",
            CustomerType.TikToker => "TikToker đang quay nói: ",
            CustomerType.BaTam => "Bà Tám thủ thỉ: ",
            CustomerType.SinhVien => "Sinh viên cuối tháng than: ",
            CustomerType.KhachKhoTinh => "Khách kỹ tính nhắc: ",
            CustomerType.GiaDinh => "Cả nhà đồng thanh: ",
            CustomerType.KhachVip => "Vị khách VIP bí ẩn mỉm cười: ",
            _ => "Khách trong hẻm nói: "
        };

        return opening + line;
    }
}
