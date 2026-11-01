import { VillageIllustration } from '../components/VillageIllustration';
import { offlineGame } from '../services/gameMode';
export function MapHelpPage() {
  if (offlineGame) return <section className="village-page map-help"><VillageIllustration kind="help" title="Một ca bán thật ngon" subtitle="HAI CHỖ ĐẶT TÔ · SÁU NGƯỜI KHÁCH · BA PHÚT" /><div className="village-paper">
    <p>Vào Quán Xóm Nhà Lá và bấm Mở cửa. Không cần mở ngày trong nhật ký để bắt đầu ca bán mới.</p>
    <ol><li>Chạm khách để nhận đơn. Đổi giữa Tô 1 và Tô 2 để làm song song.</li><li>Nhúng bánh, chọn thịt và chạm topping trong lúc chờ. Vớt khi vạch xanh, khoảng 2,5–5 giây.</li><li>Giữ vá 1–2,2 giây rồi thả để chan. Có thể giữ Space hoặc Enter khi chọn nút bằng bàn phím.</li><li>Kéo tô tới khách hoặc chạm đúng ghế để giao. Giao trong 15 giây sau khi chan để có tip nóng hổi.</li></ol>
    <p>Chạm lại topping để gắp ra. Bánh quá chín có thể thay và nhúng lại. Giao nhầm ghế không mất tô, hãy giao lại đúng người.</p>
    <p><strong>Giờ vàng:</strong> năm tô đúng liên tiếp mở 20 giây thêm tip. Sai một tô giảm chuỗi một bậc. Phục vụ đủ sáu khách sẽ tổng kết sớm.</p>
    <p><strong>Quán lớn lên:</strong> dùng tiền kiếm từ ca bán để mua xe đẩy, bếp đồng và mái hiên ngay sau ca. Đồ hiện trong quán và có hiệu quả cụ thể. Khách ăn đúng gu nhớ món, quay lại và cho tip thêm.</p>
    <p><strong>Thời gian thật:</strong> ca vẫn chạy khi chuyển tab hoặc rời quán. Rời bếp khiến tô dang dở thất bại. Năm ô sao lưu giữ cả quán mới, khách quen và nâng cấp; khôi phục sẽ lấy lại thời gian ca tại lúc lưu.</p>
    <p><strong>UNO Xóm:</strong> ở vị trí sân bóng cũ giữa map, hoặc bấm Nghỉ tay ở quán phở. Chọn Đấu với máy (1–3 máy, ba độ khó) hoặc Lập nhóm (2–10 người chuyền cùng thiết bị). Đánh cùng màu/số, nhớ hô UNO khi còn một lá. Luật chơi và nhật ký bấm mở khi cần; toàn bộ chơi được offline với tiền ảo.</p>
    <p>Muốn dạo xóm, bấm Trở lại map. Cài đặt, nhân vật, sổ thu chi và hòm sao lưu vẫn ở các địa điểm trong hẻm.</p>
  </div></section>;
  return <section className="village-page map-help"><VillageIllustration kind="help" title="Bà Năm chỉ đường" subtitle="HẺM NHỎ THÔI · CHUYỆN VUI THÌ NHIỀU" /><div className="village-paper">
    <p>Mọi hoạt động đều nằm trong Hẻm 28. Bấm vào biển địa điểm trên map, hoặc đi đến gần và nhấn <kbd>E</kbd> để ghé vào.</p>
    <ul><li><strong>Quán Xóm Nhà Lá:</strong> chọn khách, nấu đúng loại phở, thêm topping rồi phục vụ trước khi khách hết kiên nhẫn.</li><li><strong>Tiệm may Mận:</strong> sửa nhân vật Nam/Nữ, trang phục truyền thống, màu da và thú cưng.</li><li><strong>UNO Xóm:</strong> chơi UNO cùng máy hoặc lập nhóm tại vị trí sân bóng cũ.</li><li><strong>Sạp đồ chú Tư:</strong> nâng cấp bếp, nồi và vật dụng.</li><li><strong>Bảng vàng / Bàn sổ sách:</strong> thành tựu, doanh thu và lịch sử đơn hàng.</li><li><strong>Góc nghỉ chân / Hòm lưu niệm:</strong> cài đặt và sao lưu dữ liệu.</li></ul>
    <p>Dùng <kbd>WASD</kbd> / phím mũi tên để đi, <kbd>Shift</kbd> để chạy, <kbd>M</kbd> để xem sơ đồ. Trên điện thoại có cụm nút di chuyển và nút tương tác.</p>
    <p>Người dân đi lại trong xóm sẽ dừng để chào khi bạn đến gần. Thú cưng theo chân bạn qua những góc hẻm.</p>
    <p><strong>Nhật ký xóm mình:</strong> một mùa gồm 7 ngày. Chọn cách chuẩn bị, mở cửa, phục vụ khách theo đợt rồi tổng kết. Ba tô đúng liên tiếp có thưởng. Các cuộc gặp và lựa chọn có thể dẫn đến 6 kết thúc; sau đó vẫn chơi tiếp với quán đang có.</p><p><strong>Khách có kiên nhẫn thật:</strong> đồng hồ chạy khi đang đi trong xóm hoặc nấu phở. Đọc nhật ký, mở sổ món, trò chuyện, chỉnh nhân vật và rời tab sẽ tạm nghỉ. Chế độ Thong thả cho nhiều thời gian hơn; chọn trước khi mở cửa. Khi hết kiên nhẫn, khách rời quán và giảm 2 uy tín, không phạt tiền.</p><p><strong>Chuyện mới:</strong> chạm phong thư trên đồng hồ hoặc nhật ký. Đọc kỹ giá và tác động trước khi chọn. Không phải chuyện nào cũng cần giải quyết bằng tiền; hài hước và tử tế đều có đường riêng.</p>
  </div></section>;
}
