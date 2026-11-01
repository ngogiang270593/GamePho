# Xóm Nhà Lá — bản Online

Bản Online cho phép tạo tài khoản, đăng nhập trên nhiều thiết bị, đồng bộ tiến trình và chơi UNO cùng bạn bè. Frontend và API chạy trên Cloudflare Pages/Workers; Cloudflare D1 lưu tài khoản/phòng và Firebase Realtime Database phát trạng thái công khai theo thời gian thực. Gói ZIP offline không có máy chủ tài khoản.

## Chuẩn bị Firebase

1. Tạo Firebase project và Realtime Database, không bật billing.
2. Áp dụng rules từ `client/firebase.database.rules.json`. Trình duyệt chỉ đọc danh sách phòng và trạng thái công khai; mọi ghi từ trình duyệt bị cấm.
3. Tạo service account, sau đó cấp IAM role **Firebase Realtime Database Admin** (`roles/firebasedatabase.admin`) cho account đó trong đúng Firebase project. Lưu `client_email` và `private_key` an toàn; không đưa JSON key vào frontend, repository hoặc gói phát hành.
4. Ghi lại `databaseURL` của Realtime Database.

## Triển khai Cloudflare bằng Wrangler

Mở PowerShell tại thư mục gốc dự án `D:\GamePho`. Cài Wrangler nếu chưa có và đăng nhập vào tài khoản Cloudflare:

```powershell
npx wrangler login
```

Tạo D1 database và ghi lại `database_id` Wrangler trả về:

```powershell
npx wrangler d1 create xom-nha-la
```

Tạo cấu hình thật từ template. Thay `database_id` bằng ID vừa tạo, giữ binding là `DB`, tên Pages project là `phoxom`. Không commit file cấu hình thật:

```powershell
Copy-Item client\wrangler.toml.example client\wrangler.toml
```

Mở `client\wrangler.toml`, cập nhật `database_id`, sau đó tạo bảng D1:

```powershell
Set-Location client
npx wrangler d1 execute xom-nha-la --remote --file=cloudflare\schema.sql
```

Đặt secrets Firebase trên Cloudflare Pages. Nhập giá trị khi Wrangler hỏi; tuyệt đối không thêm private key vào tham số lệnh, file `.env`, `VITE_*`, output build hoặc chat:

```powershell
npx wrangler pages secret put FIREBASE_DATABASE_URL --project-name phoxom
npx wrangler pages secret put FIREBASE_CLIENT_EMAIL --project-name phoxom
npx wrangler pages secret put FIREBASE_PRIVATE_KEY --project-name phoxom
```

Không cần nhúng Firebase URL hoặc service-account key vào bundle frontend. Worker cung cấp URL RTDB cho trình duyệt qua endpoint same-origin; URL và khóa service account chỉ được lưu trong Cloudflare Worker secrets.

Build và kiểm thử:

```powershell
npm run build:online
npm run test:online
```

Vẫn ở thư mục `client`, deploy Pages:

```powershell
npx wrangler pages deploy dist-online --project-name phoxom
```

Nếu dùng Cloudflare Dashboard thay cho Wrangler, tạo gói bằng `powershell -ExecutionPolicy Bypass -File scripts\package-online.ps1` tại thư mục gốc, rồi upload **nội dung** `release\XomNhaLa-Online-Pages` lên Pages project `phoxom`. Trong Pages settings, thêm D1 binding tên `DB` và ba secrets Firebase ở trên. Nếu dùng luồng upload tĩnh, đảm bảo `_worker.js` được upload cùng assets. Redeploy sau khi thay D1 binding, secrets hoặc build environment.

Sau deploy, mở `https://phoxom.pages.dev/api/auth/me`: API khi chưa đăng nhập phải trả JSON lỗi `401`, không được trả trang HTML. Vào giao diện Online, kiểm tra trạng thái Realtime, tạo phòng, dùng tài khoản thứ hai để tham gia, cả hai sẵn sàng, bắt đầu và đánh/rút bài. Không coi build hay kiểm thử giả lập là bằng chứng Firebase production hoạt động.

Nếu tạo phòng báo lỗi Firebase, trạng thái “Realtime đang kết nối” chỉ xác nhận trình duyệt đọc được luồng Firebase, không xác nhận Worker có quyền ghi. Lỗi `403` yêu cầu cấp role `roles/firebasedatabase.admin` cho service account; lỗi `401` yêu cầu kiểm tra `FIREBASE_CLIENT_EMAIL` và `FIREBASE_PRIVATE_KEY`; lỗi `404` yêu cầu kiểm tra `FIREBASE_DATABASE_URL` và database. Cập nhật đúng secrets cho môi trường Pages đang dùng rồi deploy lại. Worker sẽ trả hướng dẫn theo mã lỗi thay vì thông báo đồng bộ chung.

## Tài khoản và phòng UNO

- Mật khẩu tối thiểu 10 ký tự; tên đăng nhập dùng chữ không dấu, số hoặc `_`.
- Mỗi tài khoản có tiến trình và 5 ô sao lưu riêng. Đăng nhập trên thiết bị khác tải đúng nhân vật và tiến trình của tài khoản.
- Trong khu Giải trí, vào **Tìm trận** để tạo phòng hoặc tham gia bằng mã 6 ký tự. Phòng có 2–4 người, tên/avatar, trạng thái sẵn sàng, mã và liên kết mời.
- Worker xác thực luật và hành động UNO, lưu trạng thái có thẩm quyền trong D1. Firebase chỉ phát trạng thái phòng công khai; tay bài và bộ bài không được công khai.
- Phòng online không đặt cược tiền thật. Firebase RTDB dùng gói Spark; không bật billing hoặc thêm phương thức thanh toán.

## Giới hạn phát hành

Nếu `wrangler whoami` báo chưa đăng nhập, cần đăng nhập Wrangler. Nếu chưa có D1 ID, Firebase database URL hoặc secrets Firebase, chưa thể tạo bản production hoàn chỉnh. Không tạo giá trị giả và không công khai service-account key. Cần kiểm tra trên hai trình duyệt sau khi deploy bản Online mới.
