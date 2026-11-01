namespace server.Services;

internal static class OrderFeedback
{
    private static readonly string[] CorrectMessages =
    [
        "Tô phở chuẩn vị, khách gật gù như vừa nghe tin vui đầu tháng!",
        "Đúng món đúng topping, bà Tám chưa kịp chê đã kịp khen.",
        "Khách ăn một miếng, cả hẻm thơm lây thêm một đoạn.",
        "Pha phục vụ mượt mà hơn dép tổ ong trên nền gạch mới.",
        "Tô phở ngon đến mức shipper xin nghỉ một nhịp để ăn.",
        "Đúng đơn rồi, hôm nay quán né được một vòng drama!",
        "Khách vui vẻ, nồi nước dùng cũng sôi nghe có nhịp.",
        "Món lên chuẩn chỉnh, điện thoại TikToker tự bật camera.",
        "Cầu thủ phủi ăn xong tuyên bố chân sút đã hồi phục.",
        "Sinh viên cuối tháng mỉm cười, ví tiền cũng thở phào.",
        "Cả nhà ăn ngon, cuộc họp gia đình kết thúc trong hòa bình.",
        "Một tô phở đúng ý, uy tín quán tăng nhẹ mà chắc.",
        "Khách khen ngon, hàng xóm bên kia cũng hỏi mua mang về.",
        "Nước dùng vừa miệng, chuyện đầu hẻm tạm nghỉ giải lao.",
        "Topping đúng đủ, không cần gọi trọng tài VAR.",
        "Bữa phở hoàn hảo, chiếc bụng gửi lời cảm ơn chủ quán.",
        "Khách vui tới mức quên hỏi hôm nay có chuyện gì mới.",
        "Đơn chuẩn từng cọng rau, quán mình hôm nay có phong độ!",
        "Phục vụ đúng món, tiếng xuýt xoa át luôn tiếng xe đầu ngõ.",
        "Tô phở trọn vẹn, chủ quán xứng đáng được nghỉ tay một phút."
    ];

    private static readonly string[] IncorrectMessages =
    [
        "Tô phở đi lạc topping, chắc vừa tham quan một vòng con hẻm.",
        "Khách gọi một kiểu, nồi phở nghe thành một câu chuyện khác.",
        "Sai món rồi, chiếc muỗng cũng ngập ngừng chưa dám khuấy.",
        "Topping này bất ngờ đến mức bà Tám phải hỏi nguồn tin.",
        "Đơn hàng lệch nhịp, giống karaoke nhà bên lúc mất điện.",
        "Khách nhìn tô phở, tô phở nhìn lại như chưa từng quen.",
        "Hình như cọng hành vừa tự ý chuyển sang bàn bên.",
        "Món này thiếu một chút đúng ý và thừa một chút hồi hộp.",
        "Shipper giao nhầm địa chỉ còn có lý do, tô này thì chưa.",
        "TikToker chưa đăng video mà bình luận đã chạy trong đầu.",
        "Cầu thủ sút lệch khung thành, tô phở cũng lệch yêu cầu.",
        "Sinh viên xem lại đề: đáp án quán chọn hơi khác đáp án khách.",
        "Cả nhà nhìn nhau, không ai nhận phần topping bí ẩn.",
        "Tô phở nóng nhưng không nóng bằng cuộc thảo luận quanh bàn.",
        "Khách xin đúng món, quán tặng thêm màn đoán nguyên liệu.",
        "Nước dùng thơm, tiếc là món chính đang đi nhầm hẻm.",
        "Bà Tám chưa nói gì, nhưng chiếc điện thoại đã mở sẵn.",
        "Đơn này cần chỉnh lại, chứ chiếc bụng không biết nói dối.",
        "Khách lịch sự mỉm cười, topping thì không biết xin lỗi.",
        "Thêm một chút tập trung, lần sau quán mình sẽ chuẩn hơn."
    ];

    public static string Correct() => CorrectMessages[Random.Shared.Next(CorrectMessages.Length)];

    public static string Incorrect() => IncorrectMessages[Random.Shared.Next(IncorrectMessages.Length)];
}
