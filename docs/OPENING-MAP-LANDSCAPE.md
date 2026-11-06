# Bản đồ làng ven sông

Bản đồ đang dùng nằm ở `client/src/pages/OpeningMapPage.tsx`. Cảnh nền được dựng bằng các lớp SVG có chuyển động, thay cho ảnh cũ chứa sẵn nhân vật và biển nhiệm vụ.

- Kích thước: 4.320 × 3.000, diện tích đúng 10 lần bản đồ 1.440 × 900 trước đây. Kích thước dùng chung nằm trong `openingMapBounds.mjs`.
- Trung tâm: chợ làng với tám sạp hàng, nhà dân và đường vòng quanh chợ. Điểm bắt đầu: (2160, 1620).
- Cửa Bắc: đồi chè, vườn cây và đường vòng trên đồi.
- Cửa Đông: cầu qua sông nối với bến giao hàng bằng gỗ, thuyền buộc dây và đường ven bờ.
- Cửa Nam: ruộng lúa xanh/vàng, bờ ruộng và lối đi vòng.
- Cửa Tây: rừng tre và đường mòn xuyên rừng. Hồ sen nằm ở phía Tây Bắc.

Các tuyến đường, nhà, sạp, thân cây, hồ, cầu và bến dùng dữ liệu chung trong `openingMap.ts` để hình vẽ và va chạm cùng vị trí. Nhấn vào bản đồ sẽ tìm đường tránh vật cản; qua sông phải đi trên cầu hoặc phần sàn bến được phép đi. Thùng hàng, cọc neo và vật thể đặc trên bến có va chạm riêng. Camera bám theo nhân vật và giữ đúng tỉ lệ trên điện thoại.

Điều khiển: WASD/phím mũi tên để đi, Shift để chạy, M để đổi toàn cảnh/theo nhân vật. Có nút thu/phóng, bản đồ nhỏ, joystick và nút Chạy cho màn hình cảm ứng. Chế độ giảm chuyển động của thiết bị tắt hoạt ảnh cảnh quan.

Map có 20 NPC chính; ID `memory-keeper` hiển thị là Bà mẹ quê và đứng cạnh bến thuyền. Hắc Lang, Mụ Độc Bà, A Cẩu, Huyết Đao Phượng và Quản Gia Triệu được thêm tại các khu vực riêng, cùng sprite target riêng trong công cụ NPC. Bến có sàn ghép ván, cọc neo, thuyền và kiện hàng. Nhiệm vụ GIAO HÀNG đi theo thứ tự nhận hàng ở Bến Thuyền → giao tận tay Giao ở Chợ Nhỏ → quay lại báo Bà mẹ quê → hỏi Giao về hàng bị tịch thu. Tiến độ lưu riêng bằng khóa `opening-map-delivery-quest-v1`, không ghi đè hồ sơ nhân vật; sau manh mối của Giao, mục tiêu kế tiếp dẫn người chơi tới Tảo ở cầu tre. Dữ liệu vị trí NPC cũ của Bà mẹ quê được nâng cấp sang bến mới khi nạp bản nháp cũ, đồng thời giữ nguyên ID. Các props đặt/chọn NPC của công cụ thiết kế vẫn được giữ.

Mỗi NPC có lịch sáng/trưa/tối gồm hoạt động, lời thoại và tư thế; lịch được chỉnh trong công cụ NPC, lưu vào bản nháp/source và áp dụng trực tiếp lên map. Đồng hồ gameplay bắt đầu lúc 06:00, có thể chờ từng giờ; các hoạt động tiêu AP tiến thêm một giờ và nghỉ tại chõng tre đặt lại đồng hồ về 06:00. Giúp Bà mẹ quê quạt bếp trong khung 11:00–14:00 tiêu AP và tăng Hảo cảm một lần mỗi ngày. Các hoạt động câu cá, rèn, tỷ thí, lựa chọn của Giao và đối đầu chốt dùng hệ thống chiến dịch/minigame hiện có.

`OpeningMapScenery` chứa cảnh nền và chuyển động. Lớp tiền cảnh vẽ lại cây, mái nhà và kiện hàng gần nhân vật để tạo chiều sâu khi đi phía sau. Cảnh nền được memo hóa để tránh dựng lại toàn bộ khi nhân vật di chuyển.

Nhà dân dùng tường vữa, khung gỗ, cửa và cửa sổ nan; mái ngói và mái rạ có đường gờ, xà và vân riêng. Cửa có vân gỗ, mái có đường nóc nổi; mái vải sạp chợ có mảng sáng và đường may tạo chiều sâu. Sạp chợ là kết cấu mở với cột đỡ và quầy gỗ, giữ nguyên các vị trí, lối đi và vùng va chạm trong dữ liệu bản đồ. Bến giao hàng đặt sát cầu phía Đông, tránh lối đi chính; thuyền và hàng hóa trang trí đồng bộ với vật liệu gỗ của map. Bản đồ nhỏ được thu gọn theo kích thước màn hình để che ít cảnh hơn mà vẫn giữ các nút điều khiển.

`OpeningMapNpcHomes` dựng các cụm landmark cho NPC: y quán và sạp tò he; quán cơm, đèn lồng, tửu lâu và gánh trái cây; bờ sông có lục bình cùng bãi trâu; lò rèn và sân luyện võ; lều tiều phu, tường rêu và hang độc; tháp canh cùng góc núp cạnh cầu. Khu mới thêm có hẻm bùn với lều ngụy trang của Hắc Lang, đầm lầy có vũng khí độc và hang Mụ Độc Bà, chỗ trú dưới chân cầu của A Cẩu, vách đá biên giới của Huyết Đao Phượng và trạm thu thuế của Quản Gia Triệu. Khói, hơi xửng, ánh đèn, lửa lò, rèm, bọt đầm lầy và sương rừng có hoạt ảnh nhẹ, tự tắt khi thiết bị bật giảm chuyển động. Đây là SVG trang trí không thêm vật cản hoặc thay đổi đường đi và vị trí NPC.

Kiểm tra nhanh từ thư mục client: `npm run build` và `npm test -- src/game/openingMap.test.ts src/game/openingMapNpcs.test.tsx src/game/openingMapDeliveryQuest.test.ts src/pages/OpeningMapPage.test.tsx`. Từ gốc dự án, `node scripts/check-opening-map.mjs` kiểm tra bản production trên Chrome và lưu ảnh vào `output/opening-map-check`.
