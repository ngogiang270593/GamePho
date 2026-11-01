using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;

namespace server.Services;

public sealed class FootballService(GameDbContext db, HistoryService historyService)
{
    private static readonly string[] Commentaries =
    [
        "Bóng chưa vào lưới nhưng tô phở đã vào bụng.",
        "Trọng tài VAR đang kiểm tra cọng hành.",
        "Cú sút này mạnh đến mức chú chó cũng bỏ chạy.",
        "Đội bạn pressing, quán mình cũng đang quá tải.",
        "Bóng đi tìm khung thành, khung thành đi tìm bóng.",
        "Pha xử lý làm khán giả quên mất mình đang đứng ở đâu.",
        "Thủ môn bay người, dép tổ ong bay theo.",
        "Cú sút cong như sợi bánh phở ngày mưa.",
        "Bóng chạm cột dọc, cột dọc xin nghỉ giải lao.",
        "Khán giả nín thở, cô bán nước vẫn tính tiền đều tay.",
        "Đường bóng đẹp đến mức nồi nước dùng cũng sôi thêm.",
        "Pha phối hợp ăn ý như hành lá với nước lèo.",
        "Sút xa quá, bóng ghé luôn quán bên cạnh.",
        "Bóng đi nhẹ nhàng như khách hỏi xin thêm rau.",
        "Cú đá khiến chiếc ghế nhựa phải đứng dậy vỗ tay.",
        "Thủ môn đổ người, trái bóng thì chẳng buồn đi theo.",
        "Pha bóng hồi hộp hơn lúc khách hỏi giá tô đặc biệt.",
        "Bóng lăn chậm đến mức shipper kịp giao thêm đơn.",
        "Cú sút có lực, tiếc là lực đi nhầm hướng.",
        "Khán đài reo vang, mấy tô phở cũng rung theo.",
        "Bóng bay qua hàng rào, suýt đáp xuống rổ quẩy.",
        "Một pha cứu thua khiến cả hẻm quên mất chuyện hôm qua.",
        "Cầu thủ lấy đà lâu hơn thời gian hầm xương.",
        "Bóng đi sát mép lưới, lưới giả vờ không thấy.",
        "Pha bóng sạch sẽ, chỉ có áo trắng là dính nước lèo.",
        "Cú sút hiểm hóc, hiểm cho cả người nhặt bóng.",
        "Khách xem bóng đá gọi thêm tô nữa để lấy bình tĩnh.",
        "Bóng bật ra như tin đồn mới nhất trong hẻm.",
        "Pha dứt điểm gọn ghẽ như chan nước dùng đúng một vá.",
        "Thủ môn bắt bóng chắc tay hơn chủ quán giữ công thức.",
        "Cú sút làm bảng hiệu rung, nhưng bảng điểm vẫn bình yên.",
        "Bóng tìm được lưới, cả xóm tìm được lý do ăn mừng.",
        "Pha bóng kịch tính đến mức quên khuấy nồi đang sôi.",
        "Cú sút hụt khiến chú bán quẩy cũng phải ngoái nhìn.",
        "Đường chuyền chuẩn xác như gọi đúng phần tái nạm.",
        "Bóng bay cao, ước mơ vô địch còn bay cao hơn."
    ];

    public async Task<FootballResult> PlayAsync(
        int playerId,
        FootballPlayRequest request,
        CancellationToken ct = default)
    {
        using var gate = await GameActionLock.Enter(playerId, ct);
        var player = await db.Players.FindAsync([playerId], ct)
            ?? throw new KeyNotFoundException("Không tìm thấy người chơi.");

        var purchasedUpgrades = await db.Upgrades
            .Where(upgrade => upgrade.IsPurchased)
            .GroupBy(upgrade => upgrade.Name)
            .Select(group => new { Name = group.Key, Level = group.Max(upgrade => upgrade.Level) })
            .ToListAsync(ct);

        var footballAreaLevel = purchasedUpgrades
            .Where(upgrade => upgrade.Name == "Khu vực xem bóng đá")
            .Select(upgrade => upgrade.Level)
            .FirstOrDefault();
        var staffLevel = purchasedUpgrades
            .Where(upgrade => upgrade.Name == "Thuê nhân viên")
            .Select(upgrade => upgrade.Level)
            .FirstOrDefault();

        var power = request.ShotPower;
        var accuracy = Math.Clamp(100 - Math.Abs(request.ShotAngle - 15) * 2, 0, 100);
        var difficulty = Math.Clamp(1 + (player.CurrentDay - 1) / 2, 1, 10);
        var obstacleCount = Random.Shared.Next(0, difficulty + 1);
        var upgradeBonus = footballAreaLevel * 6 + staffLevel * 2;
        var isGoal = Random.Shared.NextDouble() < CalculateGoalChance(
            power,
            accuracy,
            request.TimingScore,
            difficulty,
            obstacleCount,
            player.Level,
            upgradeBonus);

        var score = isGoal
            ? Math.Clamp((power + accuracy + request.TimingScore) / 3, 0, 100)
            : 0;
        var moneyReward = isGoal ? score * 100m : 0m;
        var viralReward = isGoal ? 1 + score / 25 : 0;

        player.Money += moneyReward;
        player.ViralScore += viralReward;
        player.Level = Math.Max(1, 1 + player.ViralScore / 100);
        player.UpdatedAt = DateTime.UtcNow;
        await new JourneyService(db).TouchAsync(playerId, ct);
        await db.SaveChangesAsync(ct);

        var commentary = Commentaries[Random.Shared.Next(Commentaries.Length)];
        await historyService.RecordAsync(
            playerId,
            isGoal ? "FootballGoal" : "FootballShot",
            commentary,
            moneyReward,
            0,
            viralReward,
            ct: ct);
        return new FootballResult(isGoal, score, moneyReward, viralReward, commentary);
    }

    private static double CalculateGoalChance(
        int power,
        int accuracy,
        int timingScore,
        int difficulty,
        int obstacleCount,
        int playerLevel,
        int upgradeBonus)
    {
        var chance = 0.08
            + power / 100d * 0.15
            + accuracy / 100d * 0.25
            + timingScore / 100d * 0.30
            + Math.Min(playerLevel, 20) * 0.01
            + upgradeBonus / 100d
            - difficulty * 0.035
            - obstacleCount * 0.04;

        return Math.Clamp(chance, 0.02, 0.9);
    }
}
