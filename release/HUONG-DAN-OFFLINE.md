# Xóm Nhà Lá — PWA chơi offline

`PhoXom-Offline-PWA.zip` chứa toàn bộ game; không cần chạy .NET, cơ sở dữ liệu hay máy chủ API.

## Tạo gói PWA mới để triển khai

Sau khi cập nhật giao diện hoặc mã nguồn, build lại PWA và đóng gói nội dung của `client/dist` (không nén cả thư mục `dist`) vào ZIP triển khai:

```powershell
Set-Location .\client
npm run build
.\scripts\package-pwa.ps1
```

Script kiểm tra manifest, service worker và đường dẫn JS/CSS trong `index.html`, sau đó tạo ZIP với đường dẫn chuẩn cho hosting. Sau đó tải ZIP đã cập nhật lên hosting theo hướng dẫn bên dưới. Bản build tạo `index.html`, manifest, service worker và các tài nguyên offline cần thiết.

## Đưa game lên web lần đầu

Giải nén ZIP và đưa toàn bộ nội dung lên hosting tĩnh có HTTPS, tại gốc tên miền (ví dụ `https://game.example.com/`). Cấu hình mọi đường dẫn giao diện như `/map/shop` trả về `/index.html`; các file tĩnh vẫn trả về đúng file. Không cache lâu `index.html`, `sw.js` và `manifest.webmanifest`. Chưa có địa chỉ hosting được cấu hình trong dự án này.

ZIP là gói để đưa lên hosting, không phải APK/IPA. Không mở trực tiếp file HTML trong ZIP để cài trên điện thoại.

### Cloudflare Pages

Trong dự án **phoxom**, chọn **Create deployment**, chọn môi trường **Production**, tải lên bản `PhoXom-Offline-PWA.zip` mới rồi triển khai. Gói đã build sẵn, không cần upload source code hoặc chọn lệnh build. `index.html` nằm ngay gốc ZIP, cùng các thư mục `assets/`, `icons/`, `images/`.

Sau khi triển khai thành công, mở `https://phoxom.pages.dev/`. Nếu trình duyệt vẫn hiện trang cũ, tải lại bằng Ctrl+Shift+R trên máy tính hoặc đóng hết cửa sổ game rồi mở lại trên điện thoại. Không cần xóa dữ liệu trò chơi.

Nếu chỉ hiện trang trắng, kiểm tra link `/assets/...js` được tham chiếu trong HTML: phải trả về JavaScript, không phải HTML. Gói ZIP cũ tạo bằng Windows PowerShell có thể chứa dấu `\` trong tên file, khiến hosting không tìm được file JS/CSS. Script đóng gói hiện tại dùng dấu `/` và kiểm tra tất cả file được HTML tham chiếu trước khi kết thúc.

## Cài lên điện thoại

1. Có mạng, mở địa chỉ game bằng Chrome trên Android hoặc Safari trên iPhone/iPad.
2. Mở mục **Cài Xóm Nhà Lá lên điện thoại**, đợi dòng **Đã tải đủ game để chơi offline**.
3. Android: bấm **Cài ứng dụng** nếu có, hoặc menu Chrome → **Cài đặt ứng dụng / Thêm vào màn hình chính**.
4. iPhone/iPad: **Chia sẻ → Thêm vào MH chính**, bật **Mở dưới dạng ứng dụng web** nếu có, rồi **Thêm**.
5. Mở game từ biểu tượng vừa thêm. Sau lần mở đầu hoàn tất, có thể tắt mạng và chơi.

## Tiến trình và sao lưu

### UNO — màn hình gọn, hai cách chơi

Vào UNO Xóm tại vị trí sân bóng cũ giữa map, hoặc bấm Nghỉ tay tại quán phở. Mini game đá bóng đã được thay bằng UNO; liên kết đá bóng cũ tự chuyển đến phòng bài. Giao diện UNO Xóm dùng nền sáng, bốn màu lá bài và biểu tượng vui nhộn; toàn bộ vẫn chỉ là tiền ảo. Sảnh chỉ có hai lựa chọn:

- **Đấu với máy:** chọn 1–3 máy và độ khó Dễ/Vừa/Khó, rồi bấm Bắt đầu đấu máy.
- **Lập nhóm:** chọn 2–10 người cùng thiết bị. Bấm Đặt tên thành viên nếu cần đổi tên, sau đó bấm Lập nhóm · chia bài. Đây là nhóm offline chuyền máy, không phải phòng qua mạng. Mỗi lượt tay bài được che cho đến khi đúng người bấm sẵn sàng.

Bàn chơi đã thu nhỏ phần đối thủ và lá giữa bàn, giữ các nút Rút bài, Bỏ lượt, Sắp xếp bài và UNO ngay dưới tay bài. Luật chơi và nhật ký chỉ mở khi bấm xem. Ván đang chơi tự lưu và có trong 5 ô sao lưu của game.

**Đồng hồ lượt:** chọn 15, 30 hoặc 60 giây, mặc định 30. Thanh thời gian giảm liên tục; còn 5 giây chuyển màu cảnh báo và phát âm báo một lần nếu bật âm thanh. Hết giờ rút bài rồi chuyển lượt. Khi nhóm đang chuyền máy, đồng hồ dừng đến lúc người mới bấm sẵn sàng. Đồng hồ vẫn chạy trong hộp xác nhận rời bàn.

**Cược tiền ảo:** chọn Miễn phí, 5.000đ, 10.000đ, 20.000đ hoặc 50.000đ mỗi ván. Chỉ là tiền trong game, không nạp/rút tiền thật. Ví của bạn ở ghế 1 bị trừ mức góp khi chia bài. Các ghế khác góp tiền mô phỏng; quỹ bằng mức cược nhân số người. Ghế 1 thắng nhận toàn bộ quỹ, thua mất phần đã góp. Chơi nhóm vẫn dùng quy tắc ví ghế 1 này. Ván kế tiếp góp lại cùng mức, không thu thêm giữa ván; không đủ tiền thì chọn bàn miễn phí.

**Rời bàn là thua:** nút Về xóm, Rời bàn hoặc nút quay lại trong app sẽ hỏi xác nhận. Bấm Ở lại chơi không mất cược; chấp nhận thoát ghi một ván thua và mất cược của ván đó. Trình duyệt có thể hiện hộp xác nhận hệ thống khi đóng/tải lại trang; nếu thực sự rời trang, lần mở lại xử lý thua một lần, không tiếp tục ván đã bỏ. Đổi tab để quay lại xem tiếp không tự tính bỏ cuộc. Cập nhật PWA sau khi kết thúc ván để tránh bị tính thua do tải lại giữa ván.

Ván mới dùng 108 lá, mỗi người 7 lá, không cộng dồn phạt. Đánh cùng màu hoặc số/ký hiệu. +4 chỉ đánh khi không còn lá cùng màu; game tự chặn nước đi sai. Bản số hóa chọn lá số mở đầu để đơn giản hóa phần chia bài.

Hô UNO trước lá kế cuối hoặc ngay khi còn một lá. Quên hô chỉ bị rút thêm hai lá nếu bị bắt lỗi trước hành động lượt tiếp theo. Máy bắt lỗi khi đến lượt nó. Hết bài thắng ván và nhận điểm từ bài còn lại của đối thủ: số theo mặt bài, Skip/Reverse/+2 là 20, Wild/+4 là 50. Bấm Chia ván tiếp · giữ điểm; người đạt 500 điểm thắng trận.

Ván đã lưu từ phiên bản trước vẫn có thể chơi tiếp. Sảnh mới không hiển thị các chế độ phiêu lưu, thử thách ngày, bộ sưu tập hoặc bảng tùy chỉnh dài.

### Bản bán phở mới: ca ba phút

Tạo nhân vật xong sẽ vào thẳng quán. Bấm **Mở cửa** để bắt đầu ca tối đa ba phút với sáu khách. Không cần mở ngày trong nhật ký để chơi ca bán mới.

- Chạm khách để nhận đơn. Hai chỗ đặt tô cho phép nhúng một tô trong lúc xếp thịt cho tô kia.
- Chạm **Nhúng bánh**, chọn thịt và topping trong lúc chờ. **Vớt bánh** khi vạch xanh (2,5–5 giây). Chọn nhầm topping thì chạm lại để gắp ra.
- Giữ nút **Giữ vá · chan nước** khoảng 1–2,2 giây rồi thả. Trên bàn phím, giữ phím Space hoặc Enter khi nút được chọn. Giao trong 15 giây để tô nóng và có tip.
- Chạm đúng khách hoặc kéo tô đến ghế để giao. Giao nhầm ghế có thể sửa; tô vẫn còn. Bánh quá mềm có thể thay rồi nhúng lại.
- Năm tô đúng liên tiếp mở **Giờ vàng** 20 giây, thêm tip. Sai một đơn giảm chuỗi một bậc. Làm hết sáu đơn sẽ tổng kết sớm.
- Kết ca xem tiền, số tô tuyệt đỉnh, chuỗi cao nhất và khách quen. Dùng tiền kiếm từ ca bán để sắm xe đẩy, bếp đồng, mái hiên ngay ở màn hình kết ca. Đồ mới hiện trong quán và có tác dụng thực tế.
- Khách đã ăn đúng món nhớ gu cũ và sẽ quay lại. Ca tiếp theo luôn có một khách quen nếu đã phục vụ đúng ít nhất một người.

Đồng hồ ca chạy theo thời gian thực, kể cả khi chuyển tab hoặc rời quán. Rời bếp khiến tô đang làm thất bại. Trở lại vẫn tiếp tục ca nếu còn thời gian; hết giờ sẽ tổng kết. Quán mới, tiền dành sắm quán, khách quen và nâng cấp đều nằm trong năm ô sao lưu hiện có. Bản lưu từ phiên bản cũ vẫn mở được; ca bán mới khởi tạo ở lần vào quán đầu tiên.

Game xử lý bán phở, khách, câu chuyện, bảy ngày, nâng cấp và bóng đá ngay trên thiết bị. Tiến trình tự lưu bằng IndexedDB. Có 5 ô sao lưu riêng, gồm cả nhân vật; chơi mới khởi tạo lại lượt chơi nhưng giữ các ô này. Thoát bếp hoặc hết thời gian thì tô đang làm thất bại.

Dữ liệu nằm trên trình duyệt/thiết bị đang chơi, không tự đồng bộ sang điện thoại khác. Xóa dữ liệu trang web có thể xóa tiến trình và các ô lưu. Dùng trình duyệt thông thường để giữ dữ liệu qua các lần mở. Giữ nguyên tên miền khi cập nhật game.

Khi có mạng và bản cập nhật, đóng hết cửa sổ game rồi mở lại để nhận bản mới. Không ép tải lại giữa lúc nấu.

## Tạo lại gói

Từ thư mục dự án, chạy `powershell -ExecutionPolicy Bypass -File scripts/package-offline.ps1`. Cần Node.js và các dependencies của `client` đã cài. Chế độ build web dùng backend vẫn có bằng `npm.cmd run build` trong `client`; bản offline dùng `npm.cmd run build -- --mode offline`.
