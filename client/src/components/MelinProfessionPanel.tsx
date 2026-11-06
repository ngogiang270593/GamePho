import { useEffect, useRef, useState } from 'react';
import { riverFishingLevel, type RiverCampaignAction, type RiverCampaignState } from '../game/riverCampaign';

export function MelinProfessionPanel({ campaign, onAction, atRiverbank, atForge, atNoon }: {
  campaign: RiverCampaignState;
  onAction: (action: RiverCampaignAction) => boolean;
  atRiverbank: boolean;
  atForge: boolean;
  atNoon: boolean;
}) {
  const [forging, setForging] = useState(false);
  const [heat, setHeat] = useState(0);
  const [notice, setNotice] = useState('');
  const heatRef = useRef(heat);
  heatRef.current = heat;
  const direction = useRef(1);
  const level = riverFishingLevel(campaign);

  useEffect(() => {
    if (!forging) return;
    const timer = window.setInterval(() => {
      setHeat(value => {
        let next = value + direction.current * 5;
        if (next >= 100 || next <= 0) {
          direction.current *= -1;
          next = Math.max(0, Math.min(100, next));
        }
        return next;
      });
    }, 60);
    return () => window.clearInterval(timer);
  }, [forging]);

  useEffect(() => {
    if (!forging) return;
    const hit = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      if (heatRef.current >= 40 && heatRef.current <= 60) {
        if (onAction({ type: 'forge-dagger' })) {
          setNotice('Rèn thành công Dao Găm Thép Mê Linh.');
          setForging(false);
        }
      } else {
        setNotice('Nhiệt chưa vào vùng xanh. Canh lại rồi nhấn Space.');
      }
    };
    window.addEventListener('keydown', hit);
    return () => window.removeEventListener('keydown', hit);
  }, [forging, onAction]);

  function collectOre() {
    if (!atRiverbank) return;
    setNotice(onAction({ type: 'collect-ore' }) ? 'Đã nhặt 1 quặng sắt ven sông.' : '');
  }

  function cookMeal() {
    setNotice(onAction({ type: 'cook-river-meal' }) ? 'Món ăn bồi bổ tăng vĩnh viễn 25 HP tối đa.' : '');
  }

  return <div className="opening-map-profession">
    <article>
      <span aria-hidden="true">🎣</span>
      <strong>Câu Cá · Cấp {level}</strong>
      <p>{level >= 5 ? 'Đã đạt cấp tối đa.' : `${campaign.fishingXp % 3}/3 kinh nghiệm tới cấp ${level + 1}`} · đã câu {campaign.fishCaught} lần.</p>
      <small>Cấp 2 mở Ba Ba; cấp 3 mở Rùa Đầm Lầy và món ăn tăng chỉ số.</small>
      <p>Cá trong túi: {campaign.fishStock} · mồi thường: {campaign.baitCount} · mồi xịn: {campaign.premiumBaitCount}</p>
    </article>
    <article>
      <span aria-hidden="true">⚒️</span>
      <strong>Rèn Búa · {campaign.daggerForged ? 'Dao thép đã rèn' : 'Chưa rèn Dao Găm Thép'}</strong>
      <p>Quặng sắt: {campaign.ironOre} · Rèn cần 2 quặng, 20 Văn tiền và 1 AP. Thu quặng ở bờ sông; rèn tại sân của Võ Sư Nương.</p>
      <button type="button" disabled={!atRiverbank || campaign.actionPoints < 1} onClick={collectOre}>Nhặt quặng ven sông · 1 AP</button>
      {!atRiverbank && <small>Đến gần bến cá của Tảo để nhặt quặng.</small>}
      {!campaign.daggerForged && (forging
        ? <div className="opening-map-forge-game">
          <label htmlFor="opening-map-forge-heat">Canh nhiệt · nhấn Space trong vùng xanh</label>
          <progress id="opening-map-forge-heat" max="100" value={heat} />
          <span>Vùng xanh: 40–60%</span>
          <button type="button" onClick={() => {
            if (heatRef.current >= 40 && heatRef.current <= 60) {
              if (onAction({ type: 'forge-dagger' })) { setNotice('Rèn thành công Dao Găm Thép Mê Linh.'); setForging(false); }
            } else setNotice('Nhiệt chưa vào vùng xanh. Canh lại rồi nhấn Space.');
          }}>Dập búa</button>
        </div>
        : <button type="button" disabled={!atForge || !atNoon || campaign.actionPoints < 1 || campaign.ironOre < 2 || campaign.vanTien < 20}
          onClick={() => { setHeat(0); direction.current = 1; setNotice(''); setForging(true); }}>Bắt đầu rèn Dao Găm Thép</button>)}
      {!atForge && !campaign.daggerForged && <small>Đến sân luyện võ của Võ Sư Nương để rèn vũ khí.</small>}
      {atForge && !atNoon && !campaign.daggerForged && <small>Minigame rèn búa chỉ mở buổi trưa (11:00–14:00).</small>}
      {campaign.daggerForged && <p>Đao pháp và đòn đánh cận chiến được tăng sức mạnh.</p>}
    </article>
    <article>
      <span aria-hidden="true">🍲</span>
      <strong>Món ăn bồi bổ</strong>
      <p>{campaign.riverMealCooked ? 'Đã dùng · HP tối đa +25.' : 'Cần Câu Cá cấp 2 và cá trong túi · tăng vĩnh viễn 25 HP tối đa.'}</p>
      {!campaign.riverMealCooked && <button type="button" disabled={campaign.actionPoints < 1 || level < 2 || campaign.fishStock < 1} onClick={cookMeal}>Nấu món cá · 1 AP</button>}
    </article>
    {campaign.daggerPoisoned && <p>Dao găm đã tẩm độc · đòn cận chiến kế tiếp gây độc 3 lượt.</p>}
    {notice && <p role="status">{notice}</p>}
  </div>;
}
