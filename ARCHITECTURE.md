# Kiến trúc game Phở Xóm

## Hiện trạng

Client hiện là Vite React tối giản với một component trong `src/main.tsx`. Các thư mục nghiệp vụ frontend đã được tạo nhưng chưa có module. Server là ASP.NET Core Web API .NET 8 với controller mẫu và health check; chưa có EF Core, SQLite, service nghiệp vụ hay migration. `WeatherForecast*` là mã mẫu nên được xóa khi bắt đầu triển khai game.

## Nguyên tắc phân lớp

- **React** chỉ hiển thị state, nhận thao tác, gọi API và hiển thị loading/error/toast. Client có thể giữ state tạm thời như menu đang mở, giỏ hàng nháp và bộ lọc.
- **.NET API** là nguồn sự thật: xác thực món và số lượng, tính tiền, áp khuyến mãi, tính điểm uy tín/phần thưởng, sinh khách, xử lý sự kiện và quyết định trạng thái ngày chơi.
- Client không gửi `total`, `reward`, `reputation` hoặc giá cuối cùng làm dữ liệu tin cậy. API nhận các lựa chọn của người chơi, tự đọc giá từ database và trả về kết quả đã tính.
- Mọi thay đổi quan trọng chạy trong transaction SQLite và có thể ghi audit/event log.

## Cấu trúc đề xuất

```text
client/src/
  components/       Thành phần UI dùng lại (OrderPanel, CustomerCard, Toast)
  pages/            GamePage, ShopPage, ResultPage
  services/         apiClient, gameService, orderService
  models/           DTO TypeScript chỉ phản ánh response/request API
  hooks/            useGameSession, useOrderDraft, useNotifications
  store/            state tạm thời (Context hoặc Zustand nếu cần)
  styles/           theme và style toàn cục

server/
  Controllers/      GameController, OrdersController, CustomersController
  Services/         OrderService, PricingService, ReputationService,
                    CustomerSpawner, EventService, GameSessionService
  Models/           Entity: GameSession, MenuItem, Order, OrderLine,
                    Customer, GameEvent, ReputationRecord
  DTOs/             Command/response DTO, không expose entity trực tiếp
  Data/             PhoDbContext, SQLite options, repository/query helpers
  Migrations/       EF Core migrations
  Seed/             Menu, khách mẫu, cấu hình sự kiện
```

## Luồng đặt món

1. Client gọi `GET /api/game/sessions/{id}` để nhận ngày chơi, khách và menu hiện tại.
2. Người chơi chọn món; client chỉ cập nhật `OrderDraft` tạm thời.
3. Client gửi `POST /api/sessions/{id}/orders` với `customerId` và các dòng `{ menuItemId, quantity }`.
4. `OrdersController` chuyển command cho `OrderService`.
5. Service kiểm tra session/khách/món/số lượng, đọc giá SQLite, tính subtotal/discount/total và ghi order trong transaction.
6. `ReputationService` và `EventService` xử lý kết quả trên server; response trả về receipt, thay đổi uy tín, tiền và event đã kích hoạt.
7. Client cập nhật store từ response và hiển thị thông báo.

## API nền tảng

- `GET /api/health`: kiểm tra server.
- `POST /api/game/sessions`: tạo phiên chơi.
- `GET /api/game/sessions/{id}`: snapshot màn chơi.
- `POST /api/game/sessions/{id}/orders`: gửi đơn và nhận hóa đơn authoritative.
- `GET /api/game/sessions/{id}/events`: sự kiện đã phát sinh.
- `POST /api/game/sessions/{id}/advance`: kết thúc lượt/ngày; server sinh khách tiếp theo.

Các response nên có `sessionVersion` hoặc `updatedAt` để phát hiện request cũ; command nên có `IdempotencyKey` để tránh gửi trùng đơn khi retry.

## SQLite và dữ liệu

Dùng EF Core SQLite với `PhoDbContext`. Bảng tối thiểu: `GameSessions`, `MenuItems`, `Customers`, `Orders`, `OrderLines`, `GameEvents`, `ReputationRecords`. Giá tiền lưu dạng `int` theo đơn vị đồng, không dùng floating point. Seed menu và cấu hình sự kiện ở môi trường phát triển; production dùng migration.

## Trạng thái và lỗi

API trả lỗi theo `ProblemDetails` với mã ổn định như `ORDER_INVALID_ITEM`, `ORDER_OUT_OF_STOCK`, `SESSION_NOT_ACTIVE`. Frontend ánh xạ mã lỗi sang thông báo tiếng Việt, không tự suy diễn lại kết quả tính toán.

## Lộ trình triển khai

1. Thêm EF Core SQLite, `PhoDbContext`, cấu hình connection string và migration đầu tiên.
2. Tạo entity/DTO/seed và `GameSessionService`.
3. Tạo `PricingService` + `OrderService` với transaction và test nghiệp vụ.
4. Tạo reputation, customer spawning và event engine.
5. Tách React thành pages/components/services/store, nối API và thêm loading/error states.
6. Xóa controller/model WeatherForecast, bổ sung integration test API và build kiểm tra hai dự án.