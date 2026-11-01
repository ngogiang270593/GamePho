# Điều khiển di chuyển

PC: bỏ cụm nút mũi tên trên giao diện. Nhấp chuột trái vào đường để tìm lộ trình và tự đi; kéo chuột để xem map. Chuột phải không ra lệnh đi. Tùy chọn Chạm để di chuyển chỉ áp dụng cảm ứng/bút, không tắt nhấp chuột trên PC. WASD/mũi tên và Shift vẫn hoạt động.

Khôi phục vị trí cũ: khi vào map, nếu vị trí lưu nằm trong footprint nhà mới hoặc trùng NPC thì đưa tới nền đất trống gần nhất, cập nhật vị trí lưu và bạn đồng hành. Không xóa hồ sơ, xu hoặc tiến trình. Kiểm tra hồi quy bằng `node scripts/check-village-layout.mjs --movement --stuck`, với bản lưu mẫu nằm trong nhà tại (220,710); kết quả tại `output/movement-layout-check/stuck-recovery.json`.

PC giữ WASD/mũi tên, Shift chạy, E tương tác, M mở sơ đồ. Một phím di chuyển sẽ hủy lộ trình tự đi và ẩn joystick. Pointer cảm ứng/bút hiển thị joystick tự động, không dựa vào tên thiết bị; thao tác chuột chuyển lại giao diện PC. Tablet có vòng joystick 152px, điện thoại 116px (100px ở chế độ ngang thấp), nút chạm ít nhất 44–48px.

Joystick dùng Pointer Events và pointer capture. Độ kéo được chuẩn hóa với vùng chết 12%, tốc độ tăng dần đến tốc độ đi 160 đơn vị/giây; giữ Chạy hoặc Shift tăng tốc đến 250. Đường chéo không nhanh hơn đường thẳng. Cập nhật theo thời gian frame và chia nhỏ bước va chạm; giới hạn khoảng thời gian mỗi frame 100ms để tránh nhảy khi khôi phục tab.

Chạm nhẹ trên đường sẽ tìm lộ trình bằng lưới 20 đơn vị với tám hướng. Các đoạn đi được kiểm tra mỗi 5 đơn vị nên không cắt chéo góc nhà. Chạm vào điểm không thể tới hiển thị thông báo. Joystick/bàn phím hủy tự đi. NPC động có bán kính va chạm; nếu NPC chặn lộ trình khi đang đi, nhân vật dừng và đề nghị chọn điểm khác, không xuyên qua NPC.

Kéo quá 8px hoặc chụm hai ngón chỉ đổi camera, không tạo lệnh đi. Kéo camera hủy đầu vào di chuyển trước đó. Địa điểm/NPC khi dùng cảm ứng sẽ được chọn, hiện nút Tương tác; tự tìm điểm tiếp cận nếu chạm để đi được bật. Chỉ tương tác khi đã đến trong bán kính 80 đơn vị. Phím E và luồng chọn địa điểm từ sơ đồ cũ vẫn dùng được.

Trong Cài đặt có **Chạm để di chuyển**, mặc định bật, lưu tại `xom-nha-la-tap-to-move`. Thay đổi áp dụng ngay qua sự kiện `xom-nha-la-controls-changed`. Bật/tắt không ảnh hưởng bàn phím hoặc joystick.

Thả tay, pointercancel, lostpointercapture, mất focus/ẩn tab, xoay/đổi kích thước và mở cửa sổ đều xóa đầu vào; lộ trình không tự chạy lại khi đóng cửa sổ. Nhân vật đứng yên sau khi joystick được thả. Chạy nhanh là thao tác giữ, không phải nút bật/tắt.

## File

- `client/src/game/movement/keyboard.ts`: ánh xạ phím, chuẩn hóa vector.
- `client/src/game/movement/joystick.ts`: vùng chết, giới hạn và cường độ joystick.
- `client/src/game/movement/navigation.ts`: va chạm, bước di chuyển, tìm đường. Dùng vật cản cũ, footprint nhà hiện tại, NPC; vùng sông Bạch Đằng dành lối cho đường/cầu/bến, cầu ao sen được cho đi qua.
- `client/src/game/movement/preferences.ts`: khóa lưu và sự kiện cài đặt.
- `client/src/components/VirtualJoystick.tsx`: pointer capture, vòng kéo và reset.
- `client/src/components/WorldMap.tsx`: hợp nhất đầu vào theo thứ tự bàn phím → joystick → đường tự đi, chuyển phương thức và điều khiển camera.
- `client/src/components/SystemPreferences.tsx`: bật/tắt chạm.
- `client/src/styles/movement-controls.css`: vị trí joystick, nút cảm ứng, safe area và tablet/landscape.

Khi thêm nhà/vật cản, khai báo footprint trong dữ liệu MapBuilding/OBSTACLES. Nhà chức năng lấy footprint từ HISTORY_MENU_PLACES. Nếu đổi hình học sông/cầu, cập nhật vùng đi được tương ứng trong navigation.ts. Các đồ trang trí nhỏ không tự động trở thành vật cản chỉ vì được vẽ lên SVG.

## Kiểm tra

`npm.cmd test`, `npm.cmd run build` trong client. Test movement xác nhận tốc độ ở 30/60/120 FPS, đường chéo, cường độ joystick, sprint, tuyến đi quanh nhà, vùng sông/ao/cầu, NPC và nhà mới. AppRoutes kiểm tra lưu tùy chọn chạm từ giao diện Cài đặt.

Từ thư mục gốc: `node scripts/check-village-layout.mjs --movement`. Cần Chrome Windows và đã build. Bài kiểm tra Chrome dùng cảm ứng thật qua DevTools Protocol để kiểm tra joystick, thả tay, pointercancel, chuyển sang bàn phím, chạm đến đích, tắt chạm và dừng dưới modal; tiếp tục đo bố cục 10 viewport, xác nhận joystick không chồng thanh tiện ích/nút chức năng và không tràn ngang. Có thêm thử zoom, pinch, kéo camera, mua/trang bị, Escape. Kết quả và ảnh tại `output/movement-layout-check`.
