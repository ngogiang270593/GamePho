# Xóm Nhà Lá – Hành Trình Sử Việt

Game web PWA học lịch sử dành cho học sinh. Người chơi khám phá xóm làng Việt Nam, gặp Hai Bà Trưng, Trần Hưng Đạo, Lê Lợi, Quang Trung và Võ Nguyên Giáp, trả lời câu hỏi trắc nghiệm, tích lũy vàng/danh vọng và đấu UNO với máy. Không cần tài khoản hay kết nối mạng để chơi.

## Chạy game

```powershell
cd client
npm install
npm run dev
```

Tạo bản phát hành bằng `npm run build`; chạy kiểm thử bằng `npm test`. PWA lưu giao diện và tài nguyên hình ảnh để có thể mở lại khi offline.

## Vòng chơi

1. Tạo nhân vật 2D rồi tự đi bộ khám phá xóm làng, ghé các địa điểm và gặp nhân vật đã mở khóa.
2. Đọc mẩu chuyện lịch sử và trả lời câu hỏi. Phản hồi giải thích hiện ngay sau khi trả lời.
3. Hoàn thành bộ câu hỏi để nhận huy hiệu nhân vật; câu đúng đầu tiên có thưởng cao hơn lượt ôn tập.
4. Đấu UNO cơ bản với 1–3 máy không giới hạn số ván. Trận thường yêu cầu cược tối thiểu 5.000 xu ảo; UNO trong nhiệm vụ lịch sử được miễn cược. Thắng ván trong hành trình nhận thêm vàng, danh vọng, huy hiệu và trang phục; sau trận luyện tập có thể bấm chơi ván mới ngay.
5. Dùng danh vọng mở nhân vật và địa điểm mới; bộ sưu tập và thành tích được lưu trong `localStorage`.

Câu chuyện và câu hỏi nằm trong `client/src/game/suViet.ts`; cấu trúc lưu tiến trình ở `client/src/services/historyProgress.ts`. Màn UNO tái sử dụng bộ luật cơ bản, giao diện bài và máy chơi sẵn có.

## Bản đồ, hồ sơ và sao lưu Sử Việt

Người chơi tạo hoặc chỉnh sửa nhân vật 2D ngay trong hành trình; hồ sơ và ngoại hình được lưu riêng với dữ liệu game quán cũ. Trên bản đồ, dùng WASD/phím mũi tên, giữ Shift để chạy, nhấn E để tương tác hoặc M để mở sơ đồ; điện thoại có nút điều khiển cảm ứng. Cổng xóm, đình làng, quán nước, bến nước, ruộng lúa và các điểm gặp nhân vật đều có tương tác. Sáu NPC 2D đi tuần tra và có lời thoại vui theo chủ đề học sử.

Quán nước UNO có biển hiệu riêng trên bản đồ; chạm biển hiệu hoặc chọn quán trong sơ đồ để vào chơi. Có thể đấu máy liên tục không giới hạn số ván, không cần chờ hay tiêu hao lượt.

Các nút **Cài đặt** và **Sao lưu** nằm trên bản đồ. Tiến trình, hồ sơ nhân vật, vật phẩm đã mở và vị trí tự lưu vào localStorage để tiếp tục sau khi tải lại hoặc thoát game. Năm ô sao lưu cục bộ cho phép giữ các mốc riêng, khôi phục hoặc ghi đè từng ô. Cài đặt hỗ trợ âm thanh, tương phản cao, giảm chuyển động và cài PWA. Các khóa lưu của hành trình dùng tiền tố `su-viet-hanh-trinh-`, không ghi đè hồ sơ nhân vật của bản game cũ.

Nhân vật có tủ đồ 2D theo lớp gồm tóc, trang phục, giày, nón, cánh, phụ kiện, thú cưỡi và hiệu ứng. Vật phẩm có độ hiếm, giá xu và điều kiện danh vọng; mở khóa bằng xu kiếm trong game. Dữ liệu mẫu nằm trong `client/src/game/characterItems.json`; hình nhân vật được vẽ bằng các lớp SVG trong suốt, không dùng thương hiệu hoặc hình có bản quyền. Icon mẫu nằm trong `client/public/assets/icons/`. Để thay icon, đặt PNG/SVG đã được cấp phép vào `client/public/assets/icons/` rồi cập nhật trường `image` trong JSON; giữ viewBox nhất quán. Các ảnh trong `client/public/assets/` được đưa vào bộ nhớ đệm PWA để dùng offline. Các trạng thái đi, chạy, cưỡi, vui mừng và hiệu ứng dùng CSS tôn trọng cài đặt giảm chuyển động.

Bản đồ chơi mở toàn màn hình, gồm năm vùng lịch sử được vẽ riêng: Mê Linh, Bạch Đằng, Lam Sơn, Đống Đa và Điện Biên. Mỗi vùng có cảnh quan, công trình, nhân vật lịch sử và một cổng dẫn sang vùng kế tiếp. Cổng cùng thẻ bản đồ trong **Các bản đồ** chỉ cho đi vào khi đủ danh vọng (0, 100, 300, 600 và 1.000 điểm); vị trí nhân vật được lưu riêng ở từng vùng. Các menu bản đồ, bộ sưu tập, danh vọng, sao lưu, cài đặt, nhân vật và thoát game nằm tại những ngôi nhà/địa điểm riêng trên map, không còn dàn thành thanh nút che cảnh; nhấn **M** để xem sơ đồ địa điểm. Dữ liệu cũ được chuyển sang bản đồ Mê Linh khi mở game lần đầu sau cập nhật.

## Ghi chú phiên bản game trước

Các ghi chú dưới đây mô tả bản mô phỏng quản lý quán trước đây. Những màn quán phở, nông nghiệp và chơi online không còn nằm trong luồng game hiện tại.

## Nhân vật và bản đồ 2D

Chọn **Chơi mới → Tạo nhân vật → Nam / Nữ** để phối tóc, màu tóc, mắt, khuôn mặt, sắc da, trang phục và phụ kiện Việt Nam. Nam và nữ có dáng người, khuôn mặt, bộ tóc và trang phục riêng; có áo ngũ thân, áo dài nam, áo dài gấm và áo hoa sen. Đổi Nam/Nữ giữ bản tùy chỉnh đang thử của mỗi bên; phối ngẫu nhiên giữ lựa chọn Nam/Nữ. Nhân vật toàn thân được vẽ bằng SVG, có bốn hướng nhìn và hoạt ảnh đi/chạy. Có thể xoay nhân vật, xem bước đi hoặc chọn **Thử đi trong map** trước khi lưu.

Sau khi lưu, **map là màn chơi chính** (`/map`), không có sidebar hay thanh điều hướng dưới. Dùng **WASD / phím mũi tên** để đi, giữ **Shift** để chạy và nhấn **E** gần vòng sáng hoặc người dân để tương tác; điện thoại có cụm nút điều hướng và nút tương tác. Camera đi theo nhân vật, nhà/cây/hồ sen và đồ vật có va chạm. Chạm biển hiệu để mở địa điểm, hoặc nhấn **M / sơ đồ xóm** để tìm đủ mười chức năng.

| Địa điểm trên map | Chức năng |
| --- | --- |
| Quán Phở Xóm | Bán hàng, nấu phở, bắt đầu ngày mới |
| Tiệm may Mận | Nam/Nữ, diện mạo, trang phục, thú cưng |
| Sân bóng đầu hẻm | Đá bóng |
| Sạp đồ chú Tư | Nâng cấp quán |
| Bảng vàng của xóm | Thành tựu |
| Bàn sổ sách | Thống kê, doanh thu, đơn hàng |
| Góc nghỉ chân | Cài đặt |
| Hòm lưu niệm | Lưu và chơi tiếp |
| Nhà Bà Năm | Hướng dẫn |
| Bàn chuyện xóm | Nhật ký, chuẩn bị, sự kiện, tổng kết, kết thúc và album khách quen |

Các hoạt động mở thành cửa sổ trên map (`/map/shop`, `/map/character`…), giữ nguyên vị trí đang đi. **Esc / Trở lại map** đóng cửa sổ; nhân vật, thú cưng và người dân tạm dừng khi cửa sổ hoặc hội thoại đang mở. Các đường dẫn cũ như `/football`, `/settings` vẫn chuyển đến đúng địa điểm.

Có **6 NPC 2D chuyển động thật trên map**: Cô Ba, Bà Năm, Tí, Mận, Chú Tư và Bác Sáu. Mỗi người có diện mạo, đường tuần tra và thời gian nghỉ riêng, bước đi và xoay theo bốn hướng, dừng và quay về phía bạn khi bạn đến gần. Nhấn **E** hoặc chạm người dân để trò chuyện; một số người mở hoạt động liên quan ngay trong hội thoại.

### Nấu và bán phở trong cảnh quán 2D

Ghé **Quán Phở Xóm** để vào quán được vẽ bằng SVG, với bếp, nồi nước dùng, bàn ăn và khách chibi đi lại. Khách vào bàn và gọi món bằng bong bóng thoại; thoại tự tắt sau **5 giây**, bấm lại khách (hoặc nút **Lời khách**) để xem thêm một lượt 5 giây. Tên và kiên nhẫn vẫn hiện trên đầu khách; nút dọn bàn và lựa chọn xử lý drama nằm ở thanh thao tác, dùng được cả khi thoại đã ẩn. Chạm **Sổ món / Topping** để chọn đúng yêu cầu. Nhấn **1. Nhúng bánh → 2. Chan nước → 3. Đưa món**: chủ quán nhúng bánh, múc nước, hoàn thiện tô rồi đi qua lối trống để mang phở tới bàn. Tô phở được đưa sang bàn, khách nếm và phản ứng trước khi bạn dọn bàn đón người tiếp theo. Có thể chọn khách khác từ các nhân vật đang chờ hoặc nút **khách**; đổi công thức sau khi nấu sẽ yêu cầu làm lại các bước. Khi đi trái/phải, nhân vật chính, NPC và khách dùng góc nhìn ba phần tư để giữ cả hai mắt.

Phản ứng lấy từ kết quả đơn hàng: món đúng có nét mặt vui, cử động tay, tim và tiền thưởng; món sai có nét mặt giận, lời phàn nàn và ký hiệu tức giận. Khi `dramaTriggered` xảy ra, cảnh quán rung nhẹ một lần, người xung quanh quay lại bàn tán và có người giơ điện thoại. Các lựa chọn hòa giải dùng sự kiện vừa được tạo và gọi API thật; chỉ khi xử lý thành công khách mới nguôi giận. Tiền/uy tín/viral hiển thị theo dữ liệu trả về, không tự cộng do hoạt ảnh.

Giữ nguyên khách đang ăn và nét mặt trong suốt phản ứng dù danh sách chờ đã cập nhật. Chặn bấm liên tục khi đang nấu/đưa món và không gửi đơn trước khi đưa tô tới bàn. Cảnh co giãn cho điện thoại; lựa chọn giảm chuyển động vẫn giữ đủ các bước và kết quả bằng chữ.

Mục **Màu da** luôn hiển thị với 6 sắc độ cho cả Nam/Nữ. Trong **Thú cưng**, chọn mèo mướp, chó vàng, thỏ trắng hoặc không nuôi. Thú cưng có hoạt ảnh và đi theo đường nhân vật đã đi, tránh vật cản; có thể thử cùng thú cưng trước khi lưu. Phối ngẫu nhiên diện mạo giữ thú cưng đang chọn. Màu da và thú cưng được lưu cùng ngoại hình và khôi phục khi tải lại.

Ngoại hình và vị trí được lưu trong `localStorage` của trình duyệt, độc lập với SQLite lưu tiến trình quán. Map có thể di chuyển khi API chưa kết nối; hoạt động bán phở và nâng cấp vẫn cần backend.

Trong **Quần áo**, có năm dòng trang phục Kinh: áo dài, áo tứ thân (yếm đào, váy đen, thắt lưng), áo bà ba (cúc giữa, hai túi), áo Nhật Bình (cổ hình chữ nhật, tay rộng, dải màu) và áo ngũ thân (cổ đứng, năm khuy, vạt phải). Áo ngũ thân có cho cả Nam/Nữ. Phòng thử đồ hiện mô tả từng bộ và cho phối phụ kiện; có thêm nón quai thao, khăn mỏ quạ. Các mẫu là minh họa chibi, được vẽ riêng ở bốn hướng và dùng chung với nhân vật trên map.

Tư liệu tham khảo cho thiết kế: [Y phục thời Nguyễn — Bảo tàng Lịch sử quốc gia](https://baotanglichsu.vn/vi/Articles/3096/18741/y-phuc-thoi-nguyen-tai-bao-tang-lich-su-quoc-gia.html), [Quần áo “Mớ bảy mớ ba” — Bảo tàng Lịch sử quốc gia](https://baotanglichsu.vn/vi/Articles/3096/11423/quan-ao-mo-bay-mo-ba-thoi-xua.html), [Việt phục Hoàng thành Thăng Long](https://hoangthanhthanglong.com/2023/07/10/den-gan-lich-su-hon-voi-viet-phuc-hoang-thanh-thang-long/).

## Nhịp sống, khách quen và hành trình bảy ngày

Mở **Nhật ký xóm mình** từ bàn trước quán trà, đồng hồ hoặc thanh mục tiêu. Mỗi mùa gồm **7 ngày**, với chủ đề, thời tiết và mục tiêu khác nhau. Trước khi mở cửa, chọn một chuẩn bị miễn phí: trà tăng kiên nhẫn, nhóm bếp cải thiện thưởng nhanh, hoặc biển vui tăng độ phủ. Chọn **Thong thả** hay **Nhộn nhịp** trước khi đón khách.

Đồng hồ đi từ sáng qua trưa, hoàng hôn tới đêm; cảnh map và quán có sắc sáng tương ứng, đèn lồng, mưa rào, lá bay hoặc đom đóm. Một giây đang chơi tương ứng sáu phút trong xóm. Đọc nhật ký, mở sổ món/topping, hội thoại NPC, các trang phụ và ẩn tab đều tạm nghỉ đồng hồ. Không trừ kiên nhẫn do đóng trình duyệt hoặc đi vắng. Mỗi nhịp API chỉ nhận tối đa ba giây và không bắt kịp thời gian ngoại tuyến.

Khách đến **theo đợt**: hai người đầu vào trước, các người sau đến dần và chỉ bắt đầu mất kiên nhẫn khi tới quán. Có thể đón đợt tiếp ngay khi hết khách hiện tại. Thanh chờ hiển thị trên từng khách; hết kiên nhẫn thì khách rời hàng chờ và giảm hai uy tín một lần, không phạt tiền. Máy chủ từ chối bán cho khách đã đi hoặc chưa tới. Cứ ba tô đúng liên tiếp có thưởng 3.000đ; sai món hoặc mất khách thì ngắt chuỗi.

**27 khách hư cấu** có tên, lời gọi món, phản ứng và ngoại hình riêng: Chú Bảy Húp Sạch, Cô Ba Xin Thêm Giá, Bé Bo Không Hành, Tí Tóp Tóp, Phúc Rì Viu, Cô Tám Tin Nóng, Linh Chạy Deadline… Khách mới luân phiên nhóm và ưu tiên tên chưa xuất hiện gần đây. Bé Bo không gọi hành hoặc topping cay. Album **Khách quen** nằm trong nhật ký.

NPC và khách dùng hệ hình vẽ riêng, không lấy hình nhân vật chính rồi đổi màu. Trẻ em có dáng thấp, đầu tròn; thanh niên gọn, người lớn có vóc dáng đa dạng; người cao tuổi có tóc bạc, nếp mặt và nhịp bước chậm. Tóc, kính, khăn, mũ, ba lô, điện thoại, áo bà ba, áo khoác shipper, áo bóng đá… theo từng người. Sáu NPC trên map có tuổi thiết kế: Tí 17, Mận 26, Cô Ba 48, Chú Tư 55, Bác Sáu 66, Bà Năm 73. Cùng hình vẽ được dùng khi đi bốn hướng, gọi món, ăn bằng đũa, vui vẻ hay phàn nàn.

Bộ **18 chuyện xóm** rút không lặp cho đến khi dùng hết, tránh lặp ngay khi trộn lại: sếp mèo chiếm ghế, QR quay mãi, Tóp Tóp quên tắt mic, cô Tám dẫn đường, VAR bàn số ba… Sự kiện xuất hiện theo thời gian hoặc số tô đã bán; tối đa hai chuyện thường mỗi ngày, bên cạnh drama do sai món. Mỗi lựa chọn cho biết tác động và ghi vào nhật ký. Chào từng NPC tăng tình xóm một lần mỗi ngày, có thể chào từ lúc chuẩn bị sáng.

Hết khách, chọn **Tổng kết** trong nhật ký để lên đèn, xem thu chi và nhận thưởng mục tiêu một lần. Đóng sớm cần chọn lại nút xác nhận ngay trong nhật ký; các khách đã tới còn chờ sẽ rời quán. Phải giải quyết chuyện đang có trước khi tổng kết. Sau bảy ngày, hành động và tỉ lệ đúng món mở một trong **6 kết thúc**: Người giữ lửa đầu hẻm, Bếp trưởng không cần loa, Ngôi sao phở lên sóng, Truyền thuyết phở meme, Cú trở lại thơm lừng hoặc Quán nhỏ, niềm vui vừa đủ. Album hiển thị điều kiện từng nhánh; chơi tiếp mùa mới giữ tiền, nâng cấp và các kết thúc đã sưu tập.

Các trang hoạt động có cảnh 2D: sạp đồ với vật dụng minh họa, bảng huy chương, sổ thu chi và biểu đồ, góc nghỉ, hòm lưu niệm, bàn nhật ký. Sân bóng có thủ môn, khán giả, chốt góc, canh lực và hoạt ảnh bóng bay theo kết quả máy chủ; hỗ trợ nút chạm và dấu cách. Chế độ giảm chuyển động giữ đủ kết quả và cho cố định thước canh ở sân bóng.

Hành trình được lưu trong bảng SQLite `GameJourneys`, đi cùng bản sao lưu. Migration `20261023090000_AddGameJourney` giữ tiền và tiến trình quán hiện có; lần đầu đọc bản lưu cũ sẽ đưa khách đang chờ vào nhịp mới và chuẩn hóa topping mẫu cũ. Ngoại hình nhân vật chính/vị trí vẫn lưu tại trình duyệt như trước. Các phản hồi đồng hồ có số phiên bản để tránh ghi đè một giao dịch mới bằng dữ liệu cũ.

Tham khảo cơ chế vòng chơi nấu ăn và khách có cá tính: trang nhà phát triển [Let’s Café](https://letscafegame.com/) và giới thiệu chính thức [Burgie’s Cozy Kitchen](https://store.steampowered.com/app/3314340/Burgies_Cozy_Kitchen/). Tình huống, lời thoại và hình vẽ Việt Nam trong game được viết/vẽ riêng.

## Yêu cầu

- Node.js 22 trở lên và npm.
- .NET 8 SDK.
- (Tuỳ chọn) Docker Engine với Docker Compose.

## Chạy môi trường phát triển

### Backend

```powershell
cd server
dotnet restore
dotnet run
```

Backend đọc `ConnectionStrings:GameDb` từ `server/appsettings.json` (mặc định `Data Source=phoxom.db`). Khi khởi động, EF Core tự áp dụng migration và seed món ăn, khách, nâng cấp, thành tích và sự kiện.

### Frontend

Mở terminal khác:

```powershell
cd client
npm ci
npm run dev
```

Vite chạy tại `http://localhost:5173`. Để trỏ tới API ở địa chỉ khác, tạo `client/.env.local`:

```dotenv
VITE_API_URL=http://localhost:5113/api
```

`VITE_API_URL` phải kết thúc bằng `/api`. Khởi động lại Vite sau khi sửa biến môi trường.

## CORS

Backend chỉ chấp nhận origin được liệt kê trong `Cors:AllowedOrigins`. Mặc định là `http://localhost:5173`. Có thể cấu hình bằng biến môi trường:

```powershell
$env:Cors__AllowedOrigins__0 = "http://localhost:5173"
dotnet run
```

Mỗi origin phải gồm scheme và host, không có đường dẫn API. Khi triển khai, hãy đặt đúng origin frontend thay vì mở CORS cho mọi website.

## Docker Compose

Từ thư mục gốc:

```powershell
docker compose up --build
```

- Frontend: `http://localhost:8081`.
- API: `http://localhost:8080/api`.
- SQLite được giữ trong volume `phoxom-data`; container backend tự chạy migration khi khởi động.
- CORS được cấu hình cho `http://localhost:8081`.

Để triển khai frontend ở domain khác, đổi `VITE_API_URL` trong phần build của service `client`, đồng thời đặt `Cors__AllowedOrigins__0` của `server` thành origin frontend đó rồi build lại.

## Bếp phở hai tô

Bán phở mở thành trang toàn màn hình. Chọn một trong hai chỗ đặt tô rồi nhận khách; mỗi tô có 60 giây độc lập. Chọn loại phở/topping bằng tay và xác nhận, nhúng bánh, vớt đúng nhịp rồi chan nước và phục vụ. Có thể chuyển sang soạn tô thứ hai trong lúc tô đầu đang nhúng. Nhịp thư thả thưởng độ chín ở 2–6 giây, nhịp câu chuyện ở 3–5 giây. Tô đúng món, vừa chín, phục vụ trong 20 giây sau khi chan được thêm 3.000đ. Hết giờ chỉ mất tô đó, ca vẫn tiếp tục. Thoát hoặc tải lại trang làm thất bại các tô dang dở; một phiên cũ không thể đóng bếp của phiên mới.

Bấm nồi để chỉnh lửa, châm nước dùng (4 giây, 5.000đ) hoặc chia bánh (3 giây, 2.000đ). Lửa lớn nóng nhanh và hao nước; châm nước làm nồi nguội đi. Nồi cần ít nhất 65°C để chan, ngày mưa cần 75°C; tô đúng món được chan từ 85°C ngày mưa có thêm 1.000đ. Trong lúc châm nồi vẫn có thể soạn/nhúng tô khác.

Khách có thể xin mua chịu, nhờ làm gấp hoặc để chủ quán sáng tạo. Nhận mua chịu không thu tiền nếu phục vụ đúng; nhận đơn gấp rút hạn còn tối đa 40 giây và thưởng thêm 5.000đ. Khách được giúp nhớ chuyện, quay lại và mang quà bánh ở ngày sau; mỗi lần giúp chỉ nhận quà một lần. Đơn sai có thể xin làm lại một lần, phí 3.000đ; lời phản hồi chỉ rõ món/topping bị sai. Chuỗi 5 tô đúng mở một khách được giới thiệu ở ngày sau.

Khách nhờ chủ quán chọn món sẽ đánh giá công thức tự phối. Công thức đạt 3 lượt thích có thể được đặt tên trong **Sổ quán → Món tủ**, rồi chọn lại cho đơn sáng tạo. Sổ quán cũng chứa ký ức khách quen và ba nâng cấp: khay soạn (trữ 12 phần/chia 6 phần mỗi lượt), nồi lớn (10 phần nước dùng), đế giữ nóng (35 giây thưởng nóng). Tiền, dụng cụ, công thức và ký ức lưu trong JSON hành trình, đi cùng 5 ô sao lưu; chơi mới đặt lại toàn bộ tiến trình đang chơi.

## API chính

- `POST /api/kitchen/open`: mở phiên bếp hai tô, bỏ các tô dang dở của phiên cũ.
- `GET /api/kitchen/state`: đồng hồ, lửa, nước dùng, nguyên liệu, khách chờ.
- `POST /api/kitchen/action`: nhận khách, xác nhận tô, nhúng/vớt/chan/phục vụ, giúp khách, nâng cấp và đặt tên món tủ.
- `POST /api/pho-sale/{customerId}/begin`: bắt đầu lượt bán phở 60 giây.
- `POST /api/pho-sale/{customerId}/fail`: bỏ lượt bán khi thoát quán, không nhận tiền, ngắt combo.
- `POST /api/journey/tick`: đồng hồ và kiên nhẫn; chỉ tính số giây đang chơi, tối đa 3 giây mỗi nhịp.
- `POST /api/journey/prepare`: chọn nhịp chơi và một cách chuẩn bị trước khi mở cửa.
- `POST /api/journey/next-wave`: đón đợt tiếp khi không còn khách đang chờ.
- `POST /api/journey/visit`: ghi lần chào một NPC trong ngày, không nhận điểm lặp.
- `POST /api/journey/close`: tổng kết, thưởng mục tiêu một lần và mở kết thúc ngày thứ bảy.
- `POST /api/journey/continue`: mở mùa tiếp, giữ tiền/nâng cấp/bộ sưu tập.
- `GET /api/game-state?playerId=1`: trạng thái quán.
- `POST /api/game/start-day?playerId=1`: mở ngày mới.
- `POST /api/orders?playerId=1`: phục vụ đơn hàng.
- `POST /api/upgrades/buy?playerId=1`: mua nâng cấp.
- `POST /api/football/play?playerId=1`: chơi bóng; kết quả được tính ở backend.
- `GET /api/players/{playerId}/statistics`: thống kê.
- `GET /api/players/{playerId}/achievements`: tiến độ thành tích.
- `GET /api/players/{playerId}/history/orders`, `/events`, `/revenue`: lịch sử.
- `GET /api/backup`: tải bản sao SQLite.
- `GET /api/backup/slots`: danh sách 5 ô lưu và thời gian lưu.
- `PUT /api/backup/slots/{id}`: lưu tiến trình và nhân vật vào ô 1–5.
- `POST /api/backup/slots/{id}/load`: khôi phục ô lưu đã chọn.
- `POST /api/players/{playerId}/game/reset`: đặt lại tiến trình.

Các endpoint quản lý hiện dùng người chơi mặc định `1`; không đưa instance này lên Internet công khai nếu chưa bổ sung xác thực và phân quyền.

## Sao lưu và khôi phục

Ghé **Hòm lưu niệm** hoặc **Cài đặt** để lưu trò chơi vào một trong **5 ô lưu**. Mỗi ô giữ tiến trình quán, nhân vật và vị trí trên map; lưu đè cần xác nhận. Chọn **Sao lưu** ở màn hình ban đầu rồi bấm **Chơi bản lưu** để khôi phục ô muốn chơi tiếp.

Các ô lưu được giữ trong thư mục `saves` cạnh database (cùng volume dữ liệu khi dùng Docker). Nút **Thoát về màn hình ban đầu** trong cài đặt quay về menu. Hãy lưu vào ô trước khi thoát để giữ mốc chơi mong muốn.

## Build và kiểm tra

```powershell
cd client
npm run build
npm test
cd ..\server
dotnet build server.csproj
cd ..
dotnet test server.Tests\server.Tests.csproj
```

Backend unit/API tests dùng xUnit trong `server.Tests`; component tests dùng Vitest trong `client`. Smoke test môi trường sạch có thể chạy bằng database SQLite riêng để xác nhận migration và seed mà không ảnh hưởng dữ liệu đang chơi.

## Migration SQLite

Tạo migration mới sau khi cập nhật model:

```powershell
cd server
dotnet ef migrations add TenMigration
```

Ứng dụng tự gọi `Database.Migrate()` khi khởi động. Với dữ liệu quan trọng, luôn tải bản sao lưu trước khi cập nhật migration.
