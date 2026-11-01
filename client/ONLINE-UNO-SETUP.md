# Chơi UNO cùng bạn bè

## Kiến trúc và dữ liệu

Phòng hỗ trợ 2–4 người, mã 6 ký tự, tên/avatar riêng, sẵn sàng, bắt đầu/chơi lại, danh sách phòng và liên kết mời. Cloudflare Worker là máy chủ có thẩm quyền: kiểm tra lượt và luật bài, lưu tiến trình/phòng trong D1, chỉ trả bài riêng cho đúng tài khoản. Firebase Realtime Database phát trạng thái công khai qua SSE; dữ liệu này chỉ gồm tên/avatar, trạng thái phòng, số lá, lá bỏ trên cùng và lượt hiện tại. Trình duyệt không được ghi vào Firebase. Bộ bài, tay bài và kết quả có thẩm quyền không được ghi vào nhánh công khai. URL database được đọc từ `/api/realtime-config`, không cần build lại frontend khi đổi database.

Firebase Realtime Database dùng gói Spark; Cloudflare Pages/Workers và D1 cần được cấu hình trong giới hạn miễn phí hiện hành. Không bật billing và không thêm phương thức thanh toán. Firebase có giới hạn lưu trữ/lưu lượng theo gói; giữ dữ liệu phòng nhỏ và không ghi heartbeat liên tục vào RTDB.

## Menu và dữ liệu hành trình

- **Chơi mới** và **Quê nhà** là chế độ offline, không cần tài khoản hoặc mạng. Tiến trình, nhân vật, túi đồ, danh vọng, nhiệm vụ, bản đồ và UNO chiến dịch được lưu trên thiết bị; Quê nhà hiển thị ngày lưu và phần trăm bản đồ đã hoàn thành.
- Chơi mới chỉ thay hành trình offline sau khi người chơi xác nhận và hoàn tất tạo nhân vật. Các ô sao lưu offline không bị xóa.
- **Thế giới** yêu cầu đăng nhập/đăng ký. Hành trình online được lưu trong hồ sơ tài khoản ở D1; phòng UNO nhiều người tiếp tục dùng Worker, D1 và Firebase realtime.
- Nếu hành trình online và dữ liệu trên thiết bị khác nhau, game yêu cầu chọn giữ dữ liệu offline, dùng dữ liệu online hoặc hủy. Khi chọn online, bản offline được giữ riêng trên thiết bị và được sao lưu thêm vào ô trống nếu còn chỗ.
- Chế độ đã chọn được ghi trên thiết bị để khôi phục khi tải lại. Đăng xuất không xóa hành trình offline. Tài khoản hiện chưa có email khôi phục mật khẩu; yêu cầu đặt lại cần quản trị viên hỗ trợ.

## Firebase Realtime Database

1. Tạo một Firebase project và Realtime Database ở chế độ khóa. Chọn vị trí database phù hợp; không cần bật billing.
2. Trong Rules, triển khai nội dung `firebase.database.rules.json`. Quy tắc cho phép đọc duy nhất danh sách chờ và trạng thái công khai của phòng; mọi ghi từ trình duyệt bị từ chối.
3. Trong Project settings → Service accounts, tạo service account/key, rồi cấp IAM role **Firebase Realtime Database Admin** (`roles/firebasedatabase.admin`) cho service account trong đúng Firebase project. Giữ file JSON riêng tư; không đưa file này vào repository hoặc frontend.
4. Lấy `databaseURL` từ phần Realtime Database.

## Chạy bản Online

1. Chọn mode Online khi build: `npm run build:online`. Không cần nhúng Firebase URL hoặc service-account key vào bundle frontend; Worker cung cấp URL RTDB cho client qua endpoint same-origin.
2. Tạo D1 database miễn phí và cấu hình binding `DB`. Sao chép `wrangler.toml.example` thành `wrangler.toml`, thay `database_id` bằng ID thật. Khởi tạo các bảng:

   ```powershell
   npx wrangler d1 create xom-nha-la
   npx wrangler d1 execute xom-nha-la --remote --file=cloudflare\schema.sql
   ```

   Nếu vừa tạo database, cập nhật ID mà lệnh đầu trả về vào `wrangler.toml` trước khi chạy migration.
3. Đưa `FIREBASE_DATABASE_URL`, `FIREBASE_CLIENT_EMAIL`, và `FIREBASE_PRIVATE_KEY` vào **Worker secrets** của Cloudflare Pages. Dùng giá trị `databaseURL`, `client_email`, và `private_key` tương ứng trong service-account JSON. Lệnh mẫu:

   ```powershell
   npx wrangler pages secret put FIREBASE_DATABASE_URL --project-name YOUR_PAGES_PROJECT
   npx wrangler pages secret put FIREBASE_CLIENT_EMAIL --project-name YOUR_PAGES_PROJECT
   npx wrangler pages secret put FIREBASE_PRIVATE_KEY --project-name YOUR_PAGES_PROJECT
   ```

   Nhập từng giá trị khi Wrangler yêu cầu; không dán private key vào lệnh, file cấu hình, log build hoặc biến `VITE_*`.
4. Chạy `npm run build:online`, sau đó triển khai thư mục `dist-online` cùng Worker/D1:

   ```powershell
   npx wrangler pages deploy dist-online --project-name YOUR_PAGES_PROJECT
   ```

   `wrangler.toml` cần ở thư mục dự án và có D1 binding `DB`. Không chia sẻ secrets giữa preview và production; cấu hình từng môi trường riêng.

Worker dùng service account để ghi Firebase REST API và D1 compare-and-swap để chống ghi đè đồng thời. Nếu thiếu secrets Firebase, Worker báo lỗi cấu hình thay vì giả lập phòng. Nếu Firebase tạm thời lỗi, phòng vẫn được xác thực/lưu trong D1 nhưng cập nhật realtime sẽ báo lỗi rõ ràng.

Nếu giao diện hiện “Realtime đang kết nối” nhưng thao tác tạo/cập nhật phòng thất bại, kết nối đọc của trình duyệt vẫn có thể hoạt động trong khi Worker thiếu quyền ghi. Với lỗi `403`, cấp `roles/firebasedatabase.admin` cho service account; với `401`, kiểm tra email/private key; với `404`, kiểm tra URL database. Thông báo lỗi từ Worker sẽ chỉ rõ nguyên nhân cần kiểm tra.

## Kiểm thử

- `npm run test:online` chạy kiểm thử Worker/D1 với Firebase REST được giả lập tại lớp HTTP, không dùng project thật.
- `npm run build:online` kiểm tra TypeScript frontend/Worker và đóng gói bản Online.
- Kiểm tra đầu-cuối với hai trình duyệt cần một project Firebase/Cloudflare đã triển khai và hai tài khoản riêng: tạo phòng → sao chép mã/liên kết → tham gia → cả hai sẵn sàng → chủ phòng bắt đầu → đánh/rút bài. Không thể xác nhận kết nối Firebase thật chỉ bằng kiểm thử cục bộ.
