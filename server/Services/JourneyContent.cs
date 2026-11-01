using server.Models;

namespace server.Services;

public sealed record DayTheme(string Title, string Weather, string Goal, int Target, string GoalKind, string Hint);
public sealed record StoryChoice(string Text, decimal Money, int Reputation, int Viral, string Path, string Result);
public sealed record StoryCard(string Key, string Title, string Description, string Actor, StoryChoice[] Choices);
public sealed record EndingCard(string Id, string Title, string Description, string Hint, string Color);

public static class JourneyContent
{
    public static readonly DayTheme[] Days = [
        new("Mùi phở gọi cả hẻm", "clear", "Nấu đúng 3 tô phở", 3, "correct", "Trà đá miễn phí giúp khách chờ lâu hơn. Cứ thong thả làm quen bếp."),
        new("Mưa rơi, bụng réo", "rain", "Phục vụ đúng 3 tô liên tiếp", 3, "combo", "Hơi nước dùng gặp mưa đầu mùa. Khách ghé trú mưa mang theo chuyện mới."),
        new("Tóp tóp ghé hẻm", "breeze", "Nấu đúng 4 tô phở", 4, "correct", "Máy quay có thể ăn trước, nhưng khách vẫn muốn phở nóng!"),
        new("Một hẻm, nhiều người thương", "clear", "Trò chuyện với 2 người hàng xóm", 2, "visits", "Ghé cô Ba, bà Năm hoặc tiệm Mận trước giờ mở cửa cũng được tính."),
        new("Đại hội hóng chuyện", "rain", "Giải quyết một chuyện trong xóm", 1, "choices", "Mở nhật ký khi có thư mới. Đồng hồ tạm nghỉ để bạn đọc và chọn."),
        new("Kèo bóng, kèo phở", "breeze", "Nấu đúng 5 tô phở", 5, "correct", "Có người mê bàn thắng, có người chỉ mê bàn có tương ớt."),
        new("Đêm đèn lồng đầu hẻm", "clear", "Nấu đúng 5 tô trong ngày hội", 5, "correct", "Khép lại bảy ngày đầu bằng một đêm vui. Những lựa chọn sẽ viết đoạn kết.")
    ];

    private static StoryChoice Kind(string text, string result) => new(text, -5000, 2, 0, "community", result);
    private static StoryChoice Skill(string text, string result) => new(text, -3000, 1, 1, "craft", result);
    private static StoryChoice Fun(string text, string result) => new(text, 0, 0, 5, "fame", result);
    private static StoryChoice Chaos(string text, string result) => new(text, 3000, -1, 3, "mischief", result);

    // A shuffled deck without replacement. All people and situations are fictional.
    public static readonly StoryCard[] Stories = [
        new("cat-manager", "Sếp Mướp lên ca", "Một chú mèo chiếm ghế đẹp nhất quán. Khách bảo: ‘Sếp chưa duyệt thì tụi em chưa dám ngồi!’", "co-ba", [Kind("Kê thêm ghế, cho sếp ngủ", "Sếp ngủ ngon. Cả quán được duyệt tăng ca… ăn phở."), Fun("Chụp ảnh ‘trưởng phòng kiểm tra cá’", "Ảnh sếp Mướp nổi hơn ảnh chủ quán. Sếp nhận lương bằng cái vuốt đầu."), Skill("Làm góc riêng cho thú cưng", "Một chiếc giỏ sạch cạnh hiên vừa giữ bếp gọn vừa giữ lòng khách.")]),
        new("qr-spinner", "QR quay vòng như chong chóng", "Anh shipper đã quét mã ba lần. Điện thoại cứ xoay, tô phở thì sắp nguội. Anh thở dài: ‘Mạng này chắc đang đi giao hàng.’", "chu-tu", [Kind("Mời anh ăn nóng, chuyển khoản sau", "Anh quay lại trả đủ, còn dắt thêm đồng nghiệp. Niềm tin giao đúng địa chỉ."), Skill("Đưa mã QR dự phòng", "Mã mới chạy vèo. Anh shipper gọi bạn là chuyên gia cứu bữa trưa."), Fun("Quay clip ‘đợi QR chín’", "Cả hẻm cười vì nồi phở sôi trước khi giao dịch thành công.")]),
        new("mic-on", "Tóp Tóp quên tắt mic", "Tí Tóp Tóp livestream: ‘Quán này bí quyết là…’ rồi cúi xuống hỏi nhỏ có được thêm hành miễn phí không. Mic vẫn bật!", "ti", [Kind("Thêm hành, cứu bạn một pha", "Khán giả thả tim vì chủ quán duyên. Tí hứa lần sau kiểm tra mic trước kiểm tra tóc."), Skill("Chỉ cách ăn phở đúng ý mình", "Buổi review thành lớp học nêm phở vui vẻ. Không ai bị ép ăn hành."), Chaos("Treo biển ‘Hành miễn phí, drama tự trả’", "Câu nói thành meme của hẻm. Tí đỏ mặt mà vẫn xin thêm hành.")]),
        new("gps-auntie", "Cô Tám dẫn đường bằng miệng", "Khách hỏi quán ở đâu. Cô Tám chỉ: ‘Qua nhà có con chó hay cười, rẽ chỗ cô bán chè từng giận chú Tư…’ Khách đã lạc đến sân bóng.", "ba-nam", [Kind("Ra đầu hẻm đón khách", "Khách tới nơi an toàn. Cô Tám nhận chức trưởng ban đón tiếp."), Skill("Vẽ sơ đồ nhỏ treo trước hiên", "Bản đồ có tô phở thật to. Lần này chẳng ai phải hỏi con chó."), Fun("Làm video chỉ đường 15 giây", "Chưa kịp nói ‘đăng ký kênh’ thì khách đã đến quán.")]),
        new("no-onion", "Bé Bo và hạt hành lạc", "Bé Bo Không Hành phát hiện một chấm xanh và mở cuộc điều tra. Hóa ra đó là hình chiếc lá in trên bát.", "man", [Kind("Đổi bát trơn cho bé yên tâm", "Bé cấp giấy chứng nhận ‘an toàn không hành’ bằng hình vẽ ngôi sao."), Skill("Chỉ bé phân biệt họa tiết và rau", "Nhà điều tra nhỏ phá án thành công, thưởng cho mình một miếng thịt."), Fun("Vẽ huy hiệu thám tử tô phở", "Bo hứa chỉ điều tra bát nhà mình, cho cả quán được ăn yên.")]),
        new("rain-umbrella", "Mưa có đôi, ô có một", "Mưa rào bất chợt. Hai người khách nhường nhau chiếc ô tới mức chưa ai ra khỏi hiên, phở thêm một vòng vẫn chưa xong.", "co-ba", [Kind("Cho mượn ô của quán", "Hôm sau chiếc ô trở về cùng một bó hoa nhỏ."), Skill("Dọn lối khô, bọc tô mang về", "Tô phở đi qua cơn mưa vẫn ấm. Khách khen cả sự chu đáo."), Fun("Mời mọi người đặt tên cho cơn mưa", "‘Mưa thêm tái’ thắng áp đảo. Dự báo thời tiết của hẻm từ đó rất đói.")]),
        new("ai-review", "AI đoán nhầm hành", "Anh Phúc Rì Viu dùng ứng dụng nhận diện món ăn. Máy bảo tô phở là ‘vườn thực vật có hồ bơi’. Cả bàn đứng hình.", "bac-sau", [Skill("Bày tô mới để chụp rõ nguyên liệu", "Ứng dụng cuối cùng nhận ra phở. Người thật đã ăn hết trước khi máy chấm điểm."), Fun("Đặt tên ảnh ‘hệ sinh thái ăn được’", "Bức ảnh lan khắp nhóm xóm. Cư dân mạng xin địa chỉ khu bảo tồn."), Kind("Mời anh nếm trước rồi hãy chấm", "Review lần này chỉ có một câu: ‘Ăn nóng đi, đừng hỏi điện thoại!’")]),
        new("football-var", "VAR của bàn số ba", "Chú Bảy Húp Sạch quả quyết bóng vào rồi, chú Sáu Bù Giờ bảo chưa. Cái thìa được trưng dụng làm micro bình luận.", "chu-tu", [Kind("Mời hai chú trà, cùng xem lại", "Hai chú thống nhất: bàn thắng chưa chắc, tô phở ngon thì chắc."), Fun("Mở bình chọn ‘đội nhiều thịt’", "Không đội nào thua, chỉ nồi nước dùng vơi nhanh."), Chaos("Thu phí bình luận bằng một lời khen", "Chú Sáu khen bếp có phong độ ổn định. Chú Bảy đề nghị ký hợp đồng dài hạn.")]),
        new("herb-swap", "Hội nghị xin thêm giá", "Cô Ba Xin Thêm Giá mang mớ rau vườn nhà. Cô đề nghị hợp tác chiến lược: rau đổi phở, tình làng nghĩa xóm tính riêng.", "co-ba", [Kind("Nhận rau sạch, mời cô một tô", "Cô vui vẻ hứa chọn rau kỹ. Sổ quán có thêm một dòng rất ấm."), Skill("Thử một tô với rau theo mùa", "Khách thích sự tươi mới. Bạn ghi lại tỉ lệ thay vì nấu theo cảm hứng."), Fun("Giới thiệu ‘nhà tài trợ rau thơm’", "Cô Ba ký tên lên rổ giá bằng nét chữ nắn nót.")]),
        new("sleepy-delivery", "Shipper giao nhầm giấc ngủ", "Anh Tèo Tốc Hành ôm túi giao hàng ngủ gật. Điện thoại reo, anh giật mình hỏi nồi nước dùng: ‘Anh nhận hàng giùm em?’", "ti", [Kind("Mời nước và cho anh nghỉ ít phút", "Anh tỉnh táo rồi mới lên đường. Bữa trưa bớt vội một chút."), Skill("Gói món rõ tên, kiểm tra địa chỉ", "Đơn giao đúng người. Nồi nước dùng không phải ký nhận nữa."), Fun("Vẽ biển ‘nồi chưa có căn cước’", "Anh Tèo cười tỉnh ngủ, xin chụp biển đem khoe đồng nghiệp.")]),
        new("tea-vip", "VIP đi dép tổ ong", "Một vị khách giản dị gọi phở và trà đá. Cả quán đoán là giám khảo bí mật, riêng bác chỉ lo đôi dép bị mèo tha mất.", "bac-sau", [Kind("Chăm bác như mọi khách quen", "Bác là người giữ xe đầu hẻm. Cả xóm bỗng nhận ra VIP cũng là Very Important Người Quen."), Skill("Nấu tô thật chuẩn, không diễn", "Bác khen nước dùng hôm nay trong. Một lời khen chậm mà nhớ lâu."), Chaos("Trao thẻ VIP ‘Vừa Ý Phở’", "Bác vui vẻ giữ thẻ, yêu cầu quyền lợi được vuốt mèo.")]),
        new("lantern-photo", "Đèn lồng và góc nghiêng", "Mận dựng góc chụp ảnh đèn lồng. Ba người cùng nghiêng một bên khiến chú Tư lo cái hẻm sắp lệch.", "man", [Kind("Giúp treo đèn cho cả xóm", "Ai cũng có một tấm ảnh đẹp. Chú Tư xác nhận cái hẻm vẫn thẳng."), Skill("Bày bàn phở dưới ánh đèn ấm", "Ảnh đẹp, phở vẫn nóng. Bạn tìm ra góc bày món mới."), Fun("Tổ chức tạo dáng ‘húp không rung’", "Ảnh nào cũng cười, ảnh nào cũng có một đôi đũa lạc khung.")]),
        new("lucky-seat", "Ghế hợp vía thi cử", "Hai sinh viên tranh chiếc ghế từng có người ngồi ôn rồi được điểm cao. Chiếc ghế im lặng vì chưa từng đi học.", "ti", [Kind("Kê hai ghế, chúc cả hai thi tốt", "Hai bạn cùng ôn, cùng ăn. Ghế nào cũng thành ghế may mắn."), Skill("Làm suất nhỏ gọn cho giờ học", "Không ai ngủ gật vì quá no. Cả hai hẹn quay lại báo kết quả."), Fun("Treo biển ‘buff tập trung +1’", "Nhóm học kéo đến, tự nhắc nhau giữ yên để buff không bay mất.")]),
        new("tiny-critic", "Chấm sao trước khi ăn", "Anh Phúc Rì Viu giơ tay chấm điểm khi phở còn chưa ra. Cô Tám hỏi: ‘Con chấm cái ghế hay chấm cái bụng đói?’", "ba-nam", [Skill("Mời nếm rồi góp ý cụ thể", "Anh sửa bài thành nhận xét hữu ích. Cái ghế thở phào vì không bị đánh giá nữa."), Kind("Hỏi anh thích vị nào", "Một câu hỏi tử tế đổi cả giọng review. Anh thôi cố diễn nét khó tính."), Chaos("Cho ghế bảng tên ‘chuyên gia đỡ khách’", "Ghế nhận năm sao về độ chịu đựng. Cả bàn không nhịn được cười.")]),
        new("power-cut", "Cúp điện, bật chuyện", "Đèn vụt tắt giữa buổi. Chú Tư tuyên bố: ‘Không có Wi-Fi thì chúng ta kết nối bằng… hỏi thăm!’", "chu-tu", [Kind("Mời khách ra hiên sáng, rót trà", "Mọi người lần đầu nhớ tên nhau thay vì tên mạng Wi-Fi."), Skill("Kiểm tra bếp và đèn dự phòng", "Bếp vẫn an toàn. Nhịp phục vụ chậm hơn nhưng không rối."), Fun("Tổ chức kể chuyện cười một phút", "Câu chuyện của chú Tư dài ba phút, may mà điện đã về.")]),
        new("pet-influencer", "KOL bốn chân", "Tí Tóp Tóp xin quay mèo. Mèo quay lưng đúng lúc anh đọc câu mở đầu lần thứ bảy. Đạo diễn bắt đầu xin lỗi diễn viên.", "ti", [Kind("Để mèo nghỉ, quay bữa ăn thôi", "Một clip nhẹ nhàng vẫn có người xem. Diễn viên bốn chân giữ nguyên quyền ngủ."), Fun("Quay cảnh hậu trường thất bại", "Lần quay hỏng lại được yêu thích nhất. Tí học được cách cười với chính mình."), Skill("Chọn góc sạch, cất máy khỏi bếp", "Không vướng đường phục vụ. Clip ngắn mà rõ món.")]),
        new("pepper-dare", "Kèo tương ớt cấp vũ trụ", "Chú Sáu thách bạn ăn cay. Mới một thìa đã nhắc chuyện thời tiết nóng, dù ngoài trời đang mưa.", "bac-sau", [Kind("Đưa nước, khuyên nêm vừa miệng", "Chú xin hòa. Cả bàn nhất trí sức khỏe thắng mọi kèo."), Skill("Chia tương riêng, ghi độ cay", "Từ nay ai nêm người nấy chịu, không còn tô phở ‘bất ngờ’."), Fun("Đặt tên kèo ‘dũng cảm có nước mắt’", "Chú Sáu tự nhận giải diễn xuất chân thật nhất buổi trưa.")]),
        new("neighborhood-song", "Ban nhạc không thuộc lời", "Cả xóm tập hát cho đêm hội. Ai cũng chắc mình đúng lời, thành ra bài hát có tới bốn phiên bản cùng lúc.", "man", [Kind("In lời, rót trà cho cả nhóm", "Giọng hát chưa đều, tiếng cười thì đồng thanh."), Skill("Sắp giờ tập sau khi bếp đóng", "Khách được yên ăn, ban nhạc có sân khấu. Chú Tư phụ trách vỗ tay đúng nhịp."), Fun("Đặt tên nhóm ‘Lệch Tông Nhưng Ấm’", "Tên nhóm hay tới mức mọi người quên tranh nhau giọng chính.")])
    ];

    public static readonly EndingCard[] Endings = [
        new("community", "Người giữ lửa đầu hẻm", "Quán nhỏ thành nơi mọi người tìm đến cả lúc vui lẫn lúc cần một người lắng nghe. Trong ảnh cả xóm, ai cũng đứng gần nồi phở.", "Tình xóm ≥14 và ít nhất bằng một nửa tay nghề.", "#d97154"),
        new("craft", "Bếp trưởng không cần loa", "Không cần quảng cáo quá lớn, khách tự nhớ đường về nhờ những tô phở đều tay. Chú Bảy chính thức ký hợp đồng húp sạch.", "Tay nghề ≥18, đúng món ít nhất 85% số tô.", "#d5a141"),
        new("fame", "Ngôi sao phở lên sóng", "Cả hẻm lên hình nhưng tô phở vẫn là nhân vật chính. Tí xin làm đạo diễn, sếp Mướp yêu cầu được duyệt kịch bản.", "Độ phủ ≥12; giữ tình xóm và độ quậy dưới ngưỡng kết thúc tương ứng.", "#9273b3"),
        new("meme", "Truyền thuyết phở meme", "Câu chuyện của quán trở thành bộ sưu tập ảnh chế thân thiện. Người ta ghé vì tò mò, ở lại vì tiếng cười và nước dùng nóng.", "Độ quậy ≥10 và độ phủ ≥8.", "#528e92"),
        new("comeback", "Cú trở lại thơm lừng", "Có hôm lỡ tay, có lúc khách bỏ đi. Bạn vẫn mở cửa, học thêm và làm lại. Đêm hội dành tiếng vỗ tay cho người không bỏ bếp.", "Hoàn thành ít nhất 4 mục tiêu, chưa đạt các nhánh phía trên.", "#68975c"),
        new("cozy", "Quán nhỏ, niềm vui vừa đủ", "Bảy ngày không cần hoàn hảo. Vẫn có chiếc ghế quen, lời chào buổi sáng và một tô phở ấm chờ người bạn mới.", "Đi hết bảy ngày; không cần đạt chỉ tiêu hay kiếm thật nhiều tiền.", "#b68159")
    ];

    public static DayTheme Theme(JourneyProgress s) => Days[Math.Min(s.CompletedDays, 6)];
    public static int GoalProgress(JourneyProgress s) => Theme(s).GoalKind switch { "combo" => s.BestCombo, "visits" => s.VisitsToday.Count, "choices" => s.DayChoices, _ => s.DayCorrect };
    public static string SelectEnding(JourneyProgress s) =>
        s.Mischief >= 10 && s.Fame >= 8 ? "meme" :
        s.Community >= 14 && s.Community * 2 >= s.Craft ? "community" :
        s.Craft >= 18 && s.TotalServed > 0 && s.TotalCorrect / (double)s.TotalServed >= .85 ? "craft" :
        s.Fame >= 12 ? "fame" : s.GoalsWon >= 4 ? "comeback" : "cozy";

    public static StoryCard PickStory(JourneyProgress s, Random? random = null)
    {
        var available = Stories.Where(x => !s.SeenStories.Contains(x.Key)).ToArray();
        if (available.Length == 0) { var last = s.SeenStories.LastOrDefault(); s.SeenStories.Clear(); available = Stories.Where(x => x.Key != last).ToArray(); }
        return available[(random ?? Random.Shared).Next(available.Length)];
    }
}
