using server.Data; using server.Models; using server.Models.Enums;
namespace server.Seed;
public static class SeedData
{
 public static void Initialize(GameDbContext db)
 {
  var quickCookUpgrades = db.Upgrades.Where(x => x.Name == "Bếp nấu nhanh").ToList();
  for (var level = 1; level <= 5; level++)
  {
   var upgrade = quickCookUpgrades.FirstOrDefault(x => x.Level == level);
   if (upgrade is null)
   {
    db.Upgrades.Add(new Upgrade { Name = "Bếp nấu nhanh", Description = "Giảm thời gian phục vụ món.", Category = UpgradeCategory.Kitchen, Level = level, MaxLevel = 5, Cost = 120000m * level, EffectValue = level });
   }
   else
   {
    upgrade.Description = "Giảm thời gian phục vụ món.";
    upgrade.MaxLevel = 5;
    upgrade.EffectValue = level;
   }
  }
  var brothPotUpgrades = db.Upgrades.Where(x => x.Name == "Nồi nước dùng lớn").ToList();
  for (var level = 1; level <= 3; level++)
  {
   var upgrade = brothPotUpgrades.FirstOrDefault(x => x.Level == level);
   if (upgrade is null)
   {
    db.Upgrades.Add(new Upgrade { Name = "Nồi nước dùng lớn", Description = "Mỗi cấp tăng thêm 5 khách có thể phục vụ mỗi ngày.", Category = UpgradeCategory.Kitchen, Level = level, MaxLevel = 3, Cost = 150000m * level, EffectValue = level * 5 });
   }
   else
   {
    upgrade.Description = "Mỗi cấp tăng thêm 5 khách có thể phục vụ mỗi ngày.";
    upgrade.MaxLevel = 3;
    upgrade.EffectValue = level * 5;
   }
  }
  if (db.PhoMenuItems.Count() < 8) { var items = new[] { ("Phở tái nạm", PhoType.BoTai, 50000m, "Tái mềm và nạm bò."), ("Phở bò viên", PhoType.BoChin, 48000m, "Bò viên dai thơm."), ("Phở gà xé", PhoType.PhoGa, 42000m, "Gà xé lá chanh."), ("Phở gà trứng non", PhoType.PhoGa, 52000m, "Gà xé và trứng non."), ("Phở đặc biệt Xóm", PhoType.PhoDacBiet, 70000m, "Đủ loại thịt cho ngày đói bụng.") }; foreach (var x in items) if (!db.PhoMenuItems.Any(p => p.Name == x.Item1)) db.PhoMenuItems.Add(new PhoMenuItem { Name=x.Item1, PhoType=x.Item2, BasePrice=x.Item3, Description=x.Item4 }); }
  if (db.Toppings.Count() < 20) { var names = new[] { "Hành lá", "Giá đỗ", "Rau thơm", "Chanh", "Ớt tươi", "Quẩy giòn", "Trứng gà", "Thịt bò thêm", "Gà xé thêm", "Bò viên", "Nạm bò", "Gân bò", "Sách bò", "Hành phi", "Tiêu xay", "Tương ớt", "Tương đen", "Sa tế", "Nước béo", "Khăn lạnh" }; foreach (var n in names) if (!db.Toppings.Any(t => t.Name == n)) db.Toppings.Add(new Topping { Name=n, Price=n == "Khăn lạnh" ? 2000 : 5000 }); }
  if (db.Customers.Count() < 12) { var data = new[] { ("Bà Tám đầu hẻm", CustomerType.BaTam, "Bà Tám biết hết chuyện trong xóm.", "Hỏi chuyện lâu sẽ giảm kiên nhẫn."), ("Shipper đói bụng", CustomerType.Shipper, "Anh shipper tranh thủ ghé ăn giữa ca.", "Phục vụ chậm là bỏ đi ngay."), ("Khách xin ghi sổ", CustomerType.HangXom, "Khách quen nhưng hôm nay quên ví.", "Có thể ghi sổ, tăng uy tín nhưng chưa thu tiền."), ("Khách cuối tháng", CustomerType.SinhVien, "Cuối tháng nên ngân sách rất eo hẹp.", "Nhạy cảm với giá, thích phần vừa túi tiền."), ("Chú mê bóng đá", CustomerType.CauThu, "Chú vừa xem xong trận bóng ở đầu hẻm.", "Thích quẩy và bàn luận bàn thắng."), ("Khách chuyển khoản lỗi", CustomerType.HangXom, "Khách báo đã chuyển khoản nhưng app đang lỗi.", "Cần xác nhận giao dịch trước khi phục vụ thêm."), ("Khách gọi món khó hiểu", CustomerType.KhachKhoTinh, "Gọi món bằng một danh sách yêu cầu dài.", "Sai một topping là phàn nàn ngay."), ("Gia đình ba thế hệ", CustomerType.GiaDinh, "Cả nhà đi ăn sau buổi chợ.", "Gọi nhiều phần, cần phục vụ theo thứ tự."), ("Tiktoker hẻm nhỏ", CustomerType.TikToker, "Đang tìm quán có câu chuyện vui.", "Món đẹp sẽ tăng viral, món xấu sẽ bị quay lại."), ("Cô hàng xóm mới", CustomerType.HangXom, "Mới chuyển đến và muốn làm quen.", "Phục vụ tử tế sẽ trở thành khách quen."), ("Anh công trình", CustomerType.HangXom, "Vừa tan ca, cần ăn thật no.", "Ưu tiên tô lớn và phục vụ nhanh."), ("Bé sinh viên năm nhất", CustomerType.SinhVien, "Lần đầu tự đi ăn ngoài.", "Cần hướng dẫn nhẹ nhàng khi gọi món.") }; foreach (var x in data) if (!db.Customers.Any(c => c.Name == x.Item1)) db.Customers.Add(new Customer { Name=x.Item1, CustomerType=x.Item2, Avatar=x.Item2.ToString(), Hunger=70, Patience=60, BasePatience=60, Description=x.Item3, Behavior=x.Item4, ArrivedAt=DateTime.UtcNow }); }
  if (db.RandomEvents.Count() < 15) for (var i = db.RandomEvents.Count() + 1; i <= 15; i++) db.RandomEvents.Add(new RandomEvent { Title=$"Chuyện vui trong hẻm {i}", Description="Một tình huống bất ngờ khiến cả quán xôn xao.", EventType=EventType.Neighborhood, Options=new List<EventOption> { new() { Text="Giúp đỡ mọi người", ReputationChange=2, ViralChange=1, ResultText="Cả hẻm vui vẻ hơn." }, new() { Text="Kệ cho qua", ReputationChange=-1, ResultText="Chuyện vẫn còn được bàn tán." } } });
  if (!db.RandomEvents.Any(e => e.Title == "Khách cuối tháng xin ghi sổ"))
  {
   db.RandomEvents.Add(new RandomEvent
   {
    Title = "Khách cuối tháng xin ghi sổ",
    Description = "Ăn hết tô phở, khách vỗ túi rồi cười trừ: Chủ quán ơi, lương chưa về mà bụng đã tới hạn. Cho em ghi sổ được không?",
    EventType = EventType.Customer,
    IsActive = true,
    Options = new List<EventOption>
    {
     new() { Text = "Cho ghi sổ", MoneyChange = -15000m, ReputationChange = 5, ViralChange = 2, ResultText = "Bạn ghi thêm một dòng vào sổ, tạm chịu 15.000đ tiền nguyên liệu. Khách hứa ngày lương sẽ trả, còn cả hẻm khen quán có tâm!" },
     new() { Text = "Yêu cầu chuyển khoản", MoneyChange = 45000m, ReputationChange = -1, ViralChange = 1, ResultText = "Khách gọi bạn cứu viện, chuyển đủ 45.000đ rồi thở dài: Tình bạn còn đó, tiền ăn phở thì đi rồi!" },
     new() { Text = "Đề nghị khách rửa chén", MoneyChange = 0m, ReputationChange = 2, ViralChange = 6, ResultText = "Khách xắn tay rửa chén đổi tô phở. Đoạn clip Đổi công lấy phở lan khắp hẻm, chén sạch mà quán cũng nổi tiếng!" }
    }
   });
  }
  db.SaveChanges();
 }
}
