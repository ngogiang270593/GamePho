import { useGameStore } from '../context/GameContext';
import { buyUpgrade } from '../services/gameService';
import { useState } from 'react';
import { VillageIllustration } from '../components/VillageIllustration';
import { UpgradeObject } from '../components/UpgradeObject';

export function UpgradesPage() {
  const { gameState, loadGame, isLoading, showNotification } = useGameStore();
  const upgrades = gameState?.upgrades ?? [];
  const names = [...new Set(upgrades.map(upgrade => upgrade.name))];
  const [buying, setBuying] = useState<number | null>(null);
  const [bought, setBought] = useState('');

  async function buy(upgradeId: number) {
    if (buying !== null) return;
    setBuying(upgradeId);
    try {
      const upgrade = await buyUpgrade(upgradeId);
      showNotification('success', `Đã mua ${upgrade.name} cấp ${upgrade.level}.`);
      setBought(upgrade.name);
      await loadGame();
    } catch (cause) {
      showNotification('error', cause instanceof Error ? cause.message : 'Không thể mua nâng cấp.');
    } finally { setBuying(null); }
  }

  return <section className="village-page"><VillageIllustration kind="upgrades" title="Sạp đồ chú Tư" subtitle={`VÍ QUÁN: ${(gameState?.player.money ?? 0).toLocaleString('vi-VN')}đ · ĐỒ BỀN, PHỞ NGON`} /><div className="upgrade-stall">
    {names.map(name => {
      const levels = upgrades.filter(upgrade => upgrade.name === name).sort((a, b) => a.level - b.level);
      const next = levels.find(upgrade => !upgrade.isPurchased);
      const owned = levels.filter(upgrade => upgrade.isPurchased).reduce((highest, upgrade) => Math.max(highest, upgrade.level), 0);
      const nextEffect = next?.name === 'Bếp nấu nhanh'
        ? `Cấp ${next.level} giảm ${next.effectValue} giây thời gian phục vụ.`
        : next?.name === 'Nồi nước dùng lớn'
          ? `Cấp ${next.level} tăng thêm ${next.effectValue} khách mỗi ngày.`
          : null;
      return <article className={`stall-object${bought === name ? ' stall-purchased-flash' : ''}`} key={name}><UpgradeObject name={name} level={owned} /><div><span className="stall-level">ĐANG SỞ HỮU {owned}/{levels[0]?.maxLevel ?? 0}</span><h2>{name}</h2><p>{levels[0]?.description}</p>
        {nextEffect && <p>{nextEffect}</p>}
        {next ? <button disabled={isLoading || buying !== null || (gameState?.player.money ?? 0) < next.cost} onClick={() => void buy(next.id)}>{buying === next.id ? 'Chú Tư đang giao đồ…' : (gameState?.player.money ?? 0) < next.cost ? `Cần ${next.cost.toLocaleString('vi-VN')}đ` : `Mua cấp ${next.level} · ${next.cost.toLocaleString('vi-VN')}đ`}</button> : <span className="status-pill">Đã đạt tối đa</span>}
      </div></article>;
    })}
  </div></section>;
}
