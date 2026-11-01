# Cửa hàng và bản đồ Xóm Nhà Lá

## Chạy thử

Trong `client`, chạy `npm.cmd run dev`, mở địa chỉ Vite, chọn **Chơi mới** và tạo nhân vật. Trên map có Cửa hàng, Nhiệm vụ, Nhà của bạn và Thú cưỡi. Nút sơ đồ (M) liệt kê toàn bộ địa điểm, bao gồm các chức năng lịch sử/UNO/sao lưu cũ.

Cửa hàng sử dụng số xu/danh vọng của hành trình hiện tại. Nhân vật mới bắt đầu với 0 xu: làm nhiệm vụ hoặc nhặt quà để mua đồ. Mã quà tặng cũ trong màn hình tạo nhân vật vẫn dùng được. Không có thanh toán tiền thật. Danh mục Tiền xu giải thích cách kiếm xu, không bán xu lấy tiền thật hoặc tạo cơ chế đổi xu vô nghĩa.

## Những gì có thể chơi

- Cửa hàng: tìm kiếm, lọc danh mục/độ hiếm/khoảng giá, sắp xếp giá, xem trước SVG, xác nhận mua, trang bị/tháo ra. Tóc/quần áo/nón/giày/cánh/phụ kiện/thú cưỡi/hiệu ứng dùng chung danh mục và kho đồ 2D cũ. Thêm vật phẩm sưu tầm và vé UNO. Chỉ dựng trước 12 thẻ sản phẩm để giảm số SVG trên mobile; bấm Xem thêm để tải tiếp.
- Bát phở đầu ngày: ba lựa chọn theo thứ tự bánh phở → nước dùng → hành/rau thơm, thưởng 80 xu và 10 danh vọng.
- Chăm ruộng lúa: gieo mạ → tưới → chờ 20 giây → thu hoạch, thưởng 60 xu, 8 danh vọng và thóc quê.
- Đố vui cây đa: chọn đáp án, thưởng 30 xu, 5 danh vọng và 1 vé UNO.
- Phiên chợ: trao rau và cảm ơn khách, thưởng 45 xu và 6 danh vọng.
- Quà ở ao sen/cây đa/giếng có thời gian xuất hiện lại 5 phút. Nhiệm vụ lặp lại sau 3–4 phút kể từ lần nhận thưởng. Đóng cửa sổ/tải lại trang không xóa tiến độ hoặc bỏ qua thời gian chờ.
- NPC đi theo đường tuần tra, nghỉ và đối thoại; nhân vật lịch sử, cổng mở theo danh vọng và khu UNO giữ luồng cũ. Thêm người bán phở, nông dân, em nhỏ, người giữ cổng, người bán chợ; Chú Tư mở cửa hàng.
- Bản đồ có nút +/−, kéo bằng chuột/ngón tay, chụm hai ngón để đổi zoom và nút theo nhân vật. WASD/mũi tên hoặc nút cảm ứng tiếp tục di chuyển nhân vật, đồng thời trả camera về chế độ đi theo.
- Chu kỳ ngày đêm mẫu dài 12 phút theo đồng hồ thiết bị, thời tiết thay đổi mỗi 3 phút. Đèn sáng khi đêm xuống; trâu/gà/vịt chuyển động nhẹ. Tôn trọng tùy chọn giảm chuyển động. Đây là mô phỏng cục bộ, không phải thời tiết trực tuyến.

Các hoạt động phở/trồng lúa/chợ hiện là minigame lựa chọn và thời gian chờ, không phải hệ thống mô phỏng nông trại hoặc bếp đầy đủ. Vật phẩm Thóc quê/Hoa sen là đồ sưu tầm trong kho; vé được cộng ngay vào UNO. Không có tính năng bán lại hoặc giao dịch giữa người chơi.

## File và cách mở rộng

| File | Vai trò / thêm dữ liệu |
|---|---|
| `client/src/game/characterItems.json` | Danh mục trang bị cũ. Thêm ID duy nhất, category, rarity, price, fame, description và appearanceValue nếu có. Đồ mới cần thêm cách vẽ trong CharacterSprite/CharacterOutfit/MountSprite nếu chưa có hình tương ứng. |
| `client/src/game/villageShop.ts` | Danh mục cửa hàng, nhãn hiếm tiếng Việt và vật phẩm mẫu. Thêm sản phẩm vào SHOP_PRODUCTS; thiết lập equipment để trang bị hoặc tickets để cộng vé; rewardOnly cho vật phẩm chỉ nhận qua nhiệm vụ. |
| `client/src/game/villageLocations.ts` | Điểm tương tác mới. Thêm WorldLocation với ID bắt đầu `village-`, tọa độ đi được, icon, action và questId khi có nhiệm vụ. Nhà/cửa hàng/thú cưỡi có xử lý riêng trong HistoryGamePage. |
| `client/src/game/villageNpcs.ts` | Định nghĩa NPC, đường tuần tra, tốc độ, thời gian nghỉ và lời thoại. VILLAGE_NPC_ACTIONS nối NPC với địa điểm. Thêm hình NPC trong NeighborSprite/villagers nếu cần mẫu khác. |
| `client/src/game/npcs.ts` | Bộ chuyển động NPC cũ và danh sách tích hợp NPC mới. Các điểm và toàn bộ đường tuần tra phải tránh OBSTACLES. |
| `client/src/game/villageQuests.ts` | Nội dung nhiệm vụ, từng bước/đáp án, thời gian chờ, thưởng, cooldown và các điểm quà. Thêm nhiệm vụ mới vào VILLAGE_QUESTS rồi trỏ questId từ địa điểm. |
| `client/src/services/villageGame.ts` | Quy tắc mua/trang bị/nhiệm vụ/quà. Kiểm tra xu, danh vọng, sở hữu, thứ tự và thời gian; trả bản sao dữ liệu. Lưu hai bản ghi, khôi phục giá trị cũ nếu một lần ghi thất bại. Không cập nhật React trước khi lưu thành công. |
| `client/src/services/historyProgress.ts` | Thêm trường village tùy chọn. Bản lưu cũ không cần chuyển đổi; trạng thái mới nằm cùng hành trình nên được đưa vào 5 ô sao lưu hiện có. |
| `client/src/game/characterCustomization.ts` | Sửa chuẩn hóa để thao tác tháo dép mặc định được giữ sau tải lại. |
| `client/src/components/VillageShop.tsx` | Bộ lọc, thẻ sản phẩm, xác nhận mua. |
| `client/src/components/VillageActivities.tsx` | Nhận nhiệm vụ, thực hiện lựa chọn, đồng hồ chờ, nhận thưởng và nhặt quà. |
| `client/src/components/VillageScenery.tsx` | Nhà/cửa hàng/sạp chợ/ruộng/cầu/giếng/chum và động vật mẫu bằng SVG, không cần tải ảnh ngoài. |
| `client/src/components/WorldMap.tsx` | Tích hợp cảnh và icon, camera kéo/zoom/pinch, ngày đêm/thời tiết; tạm dừng nhân vật khi mở hoạt động. |
| `client/src/components/MapOverview.tsx` | Hiển thị icon và chú thích theo dữ liệu địa điểm mới. |
| `client/src/components/WorldAtmosphere.tsx`, `NeighborhoodLife.tsx` | Nhận thời gian/thời tiết từ bản đồ trong chế độ lịch sử; giữ nguồn Journey cũ ở các chế độ khác. |
| `client/src/pages/HistoryGamePage.tsx` | Nối modal cửa hàng/nhiệm vụ với map và cập nhật trạng thái sau giao dịch. |
| `client/src/styles/village-game.css` | Thanh menu nhỏ bên cạnh trên PC, thanh dưới trên tablet/điện thoại, modal cuộn dọc, animation nhẹ. Giới hạn 25% áp dụng thanh tiện ích khi đang chơi; cửa sổ hoạt động chỉ hiện khi mở. |

Không dùng tên/ID có sẵn cho mục mới. Với loại hoạt động khác bốn minigame hiện tại, thêm xử lý/kiểm thử tại villageGame thay vì chỉ gắn tên vào UI. Vật phẩm sưu tầm cần một hành vi sử dụng mới nếu muốn tiêu hao/chế tạo.

## Lưu dữ liệu

`su-viet-hanh-trinh-progress-v1`: xu, danh vọng, vé, `village.quests`, `village.gathered`, `village.inventory`. `su-viet-hanh-trinh-character-v1`: trang bị và vật phẩm đã mở. Dữ liệu cục bộ theo trình duyệt, không có máy chủ hoặc chống chỉnh sửa localStorage. Đồng hồ mẫu dùng Date.now; chỉnh đồng hồ thiết bị có thể ảnh hưởng lịch xuất hiện. Chưa có đồng bộ nhiều tab/người chơi.

## Kiểm tra

`npm.cmd test` và `npm.cmd run build` trong client. `villageGame.test.ts` kiểm tra giao dịch, thiếu xu, khóa danh vọng, sở hữu trùng, hoàn tác khi lỗi lưu, tháo đồ, bước nhiệm vụ/thời gian chờ, nhận thưởng trùng và tọa độ có thể đi tới. `AppRoutes.test.tsx` kiểm tra UI cửa hàng/xác nhận/mua/trang bị/tháo và quay lại map, cùng nhiệm vụ thực tế. Kiểm thử NPC xác nhận đường tuần tra không xuyên vật cản.

Kết quả kiểm tra: 24 file / 185 test đạt; build production thành công. Có sửa fixture test UNO để chọn một lá số còn trong bộ bài thay vì giả định lá đỏ 3 chưa được chia; không đổi luật UNO.

Từ thư mục gốc chạy `node scripts/check-village-layout.mjs` khi đã build và máy có Chrome Windows. Script chạy Chrome headless, đo 10 viewport từ 360×800 đến 3440×1440, kiểm tra không tràn ngang, nút tối thiểu 44px, thanh tiện ích dưới 25%, mua/trang bị thực tế, zoom/kéo, chụm hai ngón và Escape. Kết quả tại `output/village-layout-check/report.json`; ảnh map và cửa hàng ở cùng thư mục. Thanh tiện ích chiếm khoảng 0,6–8,9% màn hình trong các viewport đã kiểm tra. Cửa sổ hoạt động nổi lớn hơn trên mobile và tạm dừng map khi mở.
