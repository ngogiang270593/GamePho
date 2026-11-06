import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { HistoryProgress } from '../services/historyProgress';
import { HERO_STARTING_TALENTS } from '../game/heroDevelopment';
import {
  localDayKey,
  normalizeRiverCampaign,
  RIVER_QUEST_ITEMS,
  riverFishingLevel,
  type RiverCampaignAction,
  type RiverPath,
} from '../game/riverCampaign';
import '../styles/river-campaign.css';

const paths: { id: RiverPath; label: string; tone: string }[] = [
  { id: 'righteous', label: 'Chọn Chính đạo', tone: 'is-righteous' },
  { id: 'shadow', label: 'Chọn Tà đạo', tone: 'is-shadow' },
];

function ChoiceButtons({ onChoose, disabled = false, righteous, shadow }: {
  onChoose: (path: RiverPath) => void;
  disabled?: boolean;
  righteous?: string;
  shadow?: string;
}) {
  return <div className="river-campaign__choices">{paths.map(path => (
    <button className={path.tone} type="button" key={path.id} disabled={disabled} onClick={() => onChoose(path.id)}>
      {path.id === 'righteous' ? righteous ?? path.label : shadow ?? path.label}
    </button>
  ))}</div>;
}

function QuestCard({ icon, location, title, description, children }: {
  icon: string; location: string; title: string; description: string; children: ReactNode;
}) {
  return <article className="river-campaign__npc">
    <span className="river-campaign__npc-icon" aria-hidden="true">{icon}</span>
    <div className="river-campaign__npc-content">
      <small>{location}</small>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  </article>;
}

export function MelinRiverCampaign({ progress, talent, onAction, onStartBoss, onWorldMap, onFastTravel }: {
  progress: HistoryProgress;
  talent: string | null;
  onAction: (action: RiverCampaignAction) => boolean;
  onStartBoss: () => void;
  onWorldMap: () => void;
  onFastTravel: () => void;
}) {
  const [notice, setNotice] = useState('');
  const [fishingPhase, setFishingPhase] = useState<'idle' | 'waiting' | 'biting' | 'caught'>('idle');
  const [selectedBait, setSelectedBait] = useState<'basic' | 'premium'>('basic');
  const [fishingMarker, setFishingMarker] = useState(0);
  const fishingMarkerRef = useRef(fishingMarker);
  fishingMarkerRef.current = fishingMarker;
  const fishingDirection = useRef(1);
  const [sparring, setSparring] = useState(false);
  const [sparringReady, setSparringReady] = useState(false);
  const [sparringLost, setSparringLost] = useState(false);
  const [sparringHeroHp, setSparringHeroHp] = useState(300);
  const [sparringEnemyHp, setSparringEnemyHp] = useState(300);
  const [sparringHeroCell, setSparringHeroCell] = useState(6);
  const [sparringStrikeCell, setSparringStrikeCell] = useState(5);
  const [sparringSafeTurns, setSparringSafeTurns] = useState(0);
  const state = normalizeRiverCampaign(progress.riverCampaign);
  const fishingLevel = riverFishingLevel(state);
  const fishQuestInProgress = state.taoHandoffs.length > 0
    || (state.inventory[RIVER_QUEST_ITEMS.toadFish] ?? 0) > 0;
  const nightSparringOpen = state.timeMinutes >= 840 || state.timeMinutes < 360;
  const nightMarketOpen = state.timeMinutes >= 840 || state.timeMinutes < 360;
  const biteDelay = selectedBait === 'basic' && state.baitCount > 0
    || selectedBait === 'premium' && state.premiumBaitCount > 0
    ? Math.round(1400 / 1.15) : 1400;
  const talentName = HERO_STARTING_TALENTS.find(option => option.id === talent)?.name ?? 'Chưa chọn';
  useEffect(() => {
    if (progress.riverCampaign.day !== localDayKey()) onAction({ type: 'refresh-day' });
  }, [progress.riverCampaign.day, onAction]);
  useEffect(() => {
    if (fishingPhase !== 'waiting') return;
    const timer = window.setTimeout(() => setFishingPhase('biting'), biteDelay);
    return () => window.clearTimeout(timer);
  }, [fishingPhase, biteDelay]);
  useEffect(() => {
    if (fishingPhase !== 'biting') return;
    const timer = window.setInterval(() => {
      setFishingMarker(value => {
        let next = value + fishingDirection.current * 2.5;
        if (next >= 300 || next <= 0) {
          fishingDirection.current *= -1;
          next = Math.max(0, Math.min(300, next));
        }
        return next;
      });
    }, 1000 / 60);
    return () => window.clearInterval(timer);
  }, [fishingPhase]);

  function reelIn() {
    if (fishingMarkerRef.current >= 130 && fishingMarkerRef.current <= 170) {
      setFishingPhase('caught');
      setNotice('');
    } else {
      setFishingPhase('idle');
      setNotice('Cá thoát mất rồi · canh vạch xanh và thử lại.');
    }
  }

  function startFishing(bait: 'basic' | 'premium' = 'basic') {
    setNotice('');
    setSelectedBait(bait);
    fishingDirection.current = 1;
    setFishingMarker(0);
    setFishingPhase('waiting');
  }

  useEffect(() => {
    if (fishingPhase !== 'biting') return;
    const onSpace = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      reelIn();
    };
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
  }, [fishingPhase]);

  function act(action: RiverCampaignAction) {
    setNotice('');
    if (onAction(action)) setNotice('Đã ghi lại lựa chọn và cập nhật hành trình.');
  }

  function startSparring() {
    setNotice('');
    setSparringHeroHp(300);
    setSparringEnemyHp(300);
    setSparringHeroCell(6);
    setSparringStrikeCell(6);
    setSparringSafeTurns(0);
    setSparringLost(false);
    setSparringReady(false);
    setSparring(true);
  }

  function resolveSparringTurn(nextCell: number, attack = false) {
    const enemyCell = 2;
    const heroCell = attack ? sparringHeroCell : nextCell;
    const adjacent = Math.abs(heroCell % 3 - enemyCell % 3) + Math.abs(Math.floor(heroCell / 3) - Math.floor(enemyCell / 3)) === 1;
    const movementDistance = Math.abs(nextCell % 3 - sparringHeroCell % 3)
      + Math.abs(Math.floor(nextCell / 3) - Math.floor(sparringHeroCell / 3));
    if (attack && !adjacent) return;
    if (!attack && (nextCell === enemyCell || movementDistance !== 1)) return;
    const strength = 60;
    const weaponAttack = state.daggerForged ? 30 : 10;
    const enemyDefense = 30;
    const damage = Math.max(1, Math.round(strength * 1.2 + weaponAttack - enemyDefense * .5));
    const enemyHp = attack ? Math.max(0, sparringEnemyHp - damage) : sparringEnemyHp;
    const hit = heroCell === sparringStrikeCell;
    const heroHp = Math.max(0, sparringHeroHp - (hit ? 45 : 0));
    const safeTurns = hit ? 0 : sparringSafeTurns + 1;
    setSparringEnemyHp(enemyHp);
    setSparringHeroHp(heroHp);
    setSparringHeroCell(heroCell);
    setSparringStrikeCell(heroCell);
    setSparringSafeTurns(safeTurns);
    if (enemyHp === 0 || safeTurns >= 5) {
      setSparring(false);
      setSparringReady(true);
      setNotice(enemyHp === 0
        ? `Tỷ thí thắng · sát thương ${damage} = 60 × 1,2 + ${weaponAttack} − 30 × 0,5.`
        : 'Đã né trọn 5 lượt mà không trúng đòn.');
    } else if (heroHp === 0) {
      setSparring(false);
      setSparringLost(true);
      setNotice('Tỷ thí thất bại · đã trúng đòn quá nhiều. Có thể thử lại.');
    } else {
      setNotice(hit ? 'Đòn chém trúng · mất 45 HP, chuỗi né đòn trở về 0.' : `Né thành công · chuỗi ${safeTurns}/5 lượt.`);
    }
  }

  return <section className="river-campaign">
    <header className="river-campaign__header">
      <div>
        <span className="sv-kicker">MAP KHỞI ĐẦU · THÔN MÊ LINH</span>
        <h1>Bến nước · việc làng mỗi ngày</h1>
        <p>Trước giờ giới nghiêm, hãy chọn việc cần làm. Mỗi tương tác tốn 1 AP; AP làm mới 3 điểm vào ngày hôm sau.</p>
      </div>
      <div className="river-campaign__ap" aria-label={`${state.actionPoints} trên 3 điểm hoạt động còn lại`}>
        <span>ĐIỂM HOẠT ĐỘNG HÔM NAY</span>
        <strong>{state.actionPoints}<small> / 3 AP</small></strong>
        <div aria-hidden="true">{[0, 1, 2].map(point => <i className={point < state.actionPoints ? 'is-ready' : ''} key={point} />)}</div>
      </div>
    </header>

    <section className="river-campaign__status" aria-label="Chỉ số Tiểu Mông">
      <div><small>Khí huyết</small><strong>{state.hp} / {state.maxHp}</strong></div>
      <div><small>Nội lực</small><strong>{state.mp} / {state.maxMp}</strong></div>
      <div><small>Thân pháp</small><strong>{talent === 'keen-senses' ? '90' : '75'}</strong></div>
      <div><small>Ngộ tính</small><strong>65</strong></div>
      <div><small>Thiên phú</small><strong>{talentName}</strong></div>
      <div><small>Đạo đức</small><strong>{state.morality} / 100</strong></div>
      <div><small>Tà khí</small><strong>{state.evil} / 100</strong></div>
      <div><small>Văn tiền</small><strong>🪙 {state.vanTien}</strong></div>
      <div><small>Thân tre già</small><strong>🎋 {state.oldBamboo}</strong></div>
    </section>

    {notice && <p className="river-campaign__notice" role="status">{notice}</p>}

    <div className="river-campaign__quest-list">
      <QuestCard icon="🧺" location="BẾN THUYỀN" title="Bà Mẹ Quê · Hơi Thở Quê Hương"
        description="Bà đang đan lưới dưới mái tranh. Chiếc nhẫn gia truyền là lời nhắc Tiểu Mông đừng quên người dân trong làng.">
        {!state.mainQuestActivated
          ? <p className="river-campaign__warning">Nhiệm vụ sẽ kích hoạt khi Tiểu Mông vào map lần đầu.</p>
          : state.motherChoice ? <p className="river-campaign__complete">✓ Đã nhận Nhẫn Đồng · {state.motherChoice === 'righteous' ? 'đã thề bảo vệ xóm làng' : 'đã chọn lo thân trước'}{state.fastTravel ? ' · Mở khóa đi thuyền nhanh' : ''}</p>
          : <ChoiceButtons
            righteous="Thề bảo vệ xóm làng · +10 Đạo Đức · +20 Hảo cảm"
            shadow="Lo thân trước · +10 Tà Khí · −15 Đạo Đức · +100 Văn"
            onChoose={path => act({ type: 'mother-main', path })}
            disabled={state.actionPoints < 1}
          />}
        <div className="river-campaign__side-quest">
          <strong>Việc phụ · Gáo Nước Sông Đáy</strong>
          <span>{state.waterQuestComplete ? '✓ Đã giao nước · Khí Huyết tối đa +50' : state.waterItemCarried ? 'Đã múc nước. Hãy giao gáo nước cho Bà mẹ quê.' : `Cần Hảo cảm ≥50 và MP dưới 40% (${state.mp}/${state.maxMp}) để múc nước.`}</span>
          {!state.waterQuestComplete && <button type="button" disabled={state.actionPoints < 1 || (state.waterItemCarried ? false : state.motherAffinity < 50 || state.mp >= state.maxMp * .4)}
            onClick={() => act({ type: state.waterItemCarried ? 'mother-water-return' : 'mother-water' })}>
            {state.waterItemCarried ? 'Giao gáo nước · +50 HP tối đa' : 'Múc gáo nước · 1 AP'}
          </button>}
        </div>
        {state.waterSkillUnlocked && <small className="river-campaign__unlock">Đã mở nội công Hà Bá Tức Công · cần Đạo Đức ≥60 lúc giao nước.</small>}
      </QuestCard>

      <QuestCard icon="🎣" location="BẾN CÁ NGẠNH" title="Tảo · Mưu Sinh Và Sinh Tồn"
        description="Dùng cần câu tre và nhấn Space khi vạch trượt đi vào vùng xanh để kéo cá.">
        {state.fishChoice && <p className="river-campaign__complete">✓ Nhiệm vụ câu cá hoàn thành · {state.fishChoice === 'righteous' ? 'chia cá cho dân nghèo' : 'bán cá ở chợ'} · Bẫy Tre Gai · +{talent === 'forest-and-tide' ? 6 : 3} Thân Tre Già · Nỏ Cóc đã mở.</p>}
        {!state.fishChoice && !fishQuestInProgress ? (
          fishingPhase === 'idle'
            ? <button type="button" disabled={state.actionPoints < 1} onClick={() => startFishing()}>🎣 Thả câu · bắt đầu minigame</button>
            : fishingPhase === 'waiting'
              ? <p role="status">Phao tre đang trôi theo dòng. Chờ cá cắn câu…</p>
              : fishingPhase === 'biting'
                ? <div className="river-campaign__fishing-game">
                  <p>Phao rung! Nhấn Space khi vạch ở vùng xanh.</p>
                  <div className="river-campaign__fishing-meter" role="progressbar" aria-label="Vị trí vạch câu cá" aria-valuenow={fishingMarker} aria-valuemin={0} aria-valuemax={300}>
                    <i /><b style={{ left: `${fishingMarker / 3}%` }} />
                  </div>
                  <button type="button" onClick={reelIn}>Kéo cần câu</button>
                </div>
                : <div><p className="river-campaign__complete">Bắt được Cá Cóc Sông Đáy! Chọn cách chia phần cá:</p>
                  <ChoiceButtons onChoose={path => {
                    if (onAction({ type: 'tao-fish', path })) { setFishingPhase('idle'); setNotice(''); }
                  }} disabled={state.actionPoints < 1}
                    righteous="Mang cá chia cho 3 hộ dân"
                    shadow="Bán cá · +10 Tà Khí · +80 Văn"
                  />
                </div>
        ) : fishQuestInProgress ? (
          <div className="river-campaign__side-quest">
            <strong>Chia Cá Cóc cho ba hộ dân ({state.taoHandoffs.length}/3)</strong>
            <span>Văn tiền không mất; hãy giao một con cá cho từng hộ để mở công thức Bẫy Tre Gai.</span>
            {([
              ['NPC_DAN_NONG_01', 'Bé Thảo'],
              ['NPC_DAN_NONG_02', 'Cậu Tùng'],
              ['NPC_DAN_NONG_03', 'Bác Hòa'],
            ] as const).map(([villagerId, label]) => (
              <button type="button" key={villagerId}
                disabled={state.actionPoints < 1 || state.taoHandoffs.includes(villagerId)}
                onClick={() => act({ type: 'tao-handoff', villagerId })}>
                {state.taoHandoffs.includes(villagerId) ? `✓ Đã chia · ${label}` : `Chia cá · ${label}`}
              </button>
            ))}
          </div>
        ) : (
          fishingPhase === 'idle'
            ? <div className="river-campaign__shop">
              <button type="button" disabled={state.actionPoints < 1 || state.baitCount < 1} onClick={() => startFishing('basic')}>
                Câu bằng mồi thường · {state.baitCount} · 1 AP
              </button>
              {fishingLevel >= 2 && <button type="button" disabled={state.actionPoints < 1 || state.premiumBaitCount < 1} onClick={() => startFishing('premium')}>
                Câu bằng mồi xịn · {state.premiumBaitCount} · 1 AP
              </button>}
            </div>
            : fishingPhase === 'waiting'
              ? <p role="status">Phao tre đang trôi theo dòng. Chờ cá cắn câu…</p>
              : fishingPhase === 'biting'
                ? <div className="river-campaign__fishing-game">
                  <p>Phao rung! Nhấn Space khi vạch ở vùng xanh.</p>
                  <div className="river-campaign__fishing-meter" role="progressbar" aria-label="Vị trí vạch câu cá" aria-valuenow={fishingMarker} aria-valuemin={0} aria-valuemax={300}>
                    <i /><b style={{ left: `${fishingMarker / 3}%` }} />
                  </div>
                  <button type="button" onClick={reelIn}>Kéo cần câu</button>
                </div>
                : <div><p className="river-campaign__complete">Câu được {fishingLevel >= 3 ? 'Rùa Đầm Lầy' : fishingLevel >= 2 ? 'Ba Ba' : 'Cá Cóc Sông Đáy'}.</p>
                  <button type="button" disabled={state.actionPoints < 1} onClick={() => {
                    if (onAction({ type: 'fish-again', bait: selectedBait })) { setFishingPhase('idle'); setNotice('Đã ghi nhận kinh nghiệm nghề Câu Cá.'); }
                  }}>Kéo cá lên · 1 AP</button>
                </div>
        )}
        {state.fishChoice && <small className="river-campaign__unlock">Nghề Câu Cá cấp {fishingLevel} · {state.fishingXp % 3}/3 kinh nghiệm cấp tiếp theo · cấp 2 mở Ba Ba, cấp 3 mở Rùa Đầm Lầy.</small>}
        {talent === 'forest-and-tide' && <small className="river-campaign__unlock">Thiên phú Sơn Lâm Thợ Săn: thu được gấp đôi Thân Tre Già cùng Tảo.</small>}
      </QuestCard>

      <QuestCard icon="⚔️" location="KHU LUYỆN VÕ · GỐC ĐA" title="Võ Sư Nương · Khí Phách Mê Linh"
        description="Bàn đấu 3 × 3. Hạ đối thủ 300 HP hoặc né trọn 5 lượt liên tiếp mà không trúng đòn.">
        {state.sparChoice ? <p className="river-campaign__complete">✓ Đã tỷ thí · {state.sparChoice === 'righteous' ? 'nhận BOOK_LAC_THUY_DAO_PHAP và mở SKILL_RAI_CA_QUAN_THUY.' : 'Hảo cảm Võ Sư Nương −20; lò rèn khóa 2 ngày.'}</p>
          : !sparring && !sparringReady
            ? <button type="button" disabled={!nightSparringOpen || state.actionPoints < 1 || (talent === 'keen-senses' ? 90 : 75) < 40} onClick={startSparring}>Bắt đầu tỷ thí · 3 × 3</button>
            : sparringLost
              ? <button type="button" onClick={startSparring}>Thử lại tỷ thí</button>
            : sparring
              ? <div><p>Đệ tử Võ Sư (HP {sparringEnemyHp}/300) · Tiểu Mông (HP {sparringHeroHp}/300) · Né liên tiếp {sparringSafeTurns}/5 lượt.</p>
                <p>Đệ tử nhắm vào ô {sparringStrikeCell % 3 + 1}, {Math.floor(sparringStrikeCell / 3) + 1}. Mỗi lượt chỉ được di chuyển sang ô kề.</p>
                <div className="river-campaign__spar-board" role="grid" aria-label="Bàn cờ thử tập 3 nhân 3">
                  {Array.from({ length: 9 }, (_, index) => <button
                    type="button"
                    role="gridcell"
                    key={index}
                    aria-label={`Ô tập ${index % 3 + 1}, ${Math.floor(index / 3) + 1}${index === 2 ? ', Đệ tử Võ Sư' : index === sparringHeroCell ? ', Tiểu Mông' : ''}${index === sparringStrikeCell ? ', bị nhắm' : ''}`}
                    className={index === sparringStrikeCell ? 'is-strike' : ''}
                    disabled={index === 2 || index === sparringHeroCell
                      || Math.abs(index % 3 - sparringHeroCell % 3) + Math.abs(Math.floor(index / 3) - Math.floor(sparringHeroCell / 3)) !== 1}
                    onClick={() => resolveSparringTurn(index)}
                  >{index === 2 ? '⚔️' : index === sparringHeroCell ? '🧑' : index === sparringStrikeCell ? '✕' : ''}</button>)}
                </div>
                <p>Damage = (Strength 60 × 1,2) + Weapon.Atk ({state.daggerForged ? 30 : 10}) − (Defense 30 × 0,5).</p>
                <button type="button" disabled={Math.abs(sparringHeroCell % 3 - 2) + Math.abs(Math.floor(sparringHeroCell / 3)) !== 1}
                  onClick={() => resolveSparringTurn(sparringHeroCell, true)}>Tấn công · {Math.round(60 * 1.2 + (state.daggerForged ? 30 : 10) - 30 * .5)} sát thương</button>
              </div>
              : <div><p className="river-campaign__complete">Tỷ thí hoàn tất. Chọn cách ứng xử:</p>
                <ChoiceButtons onChoose={path => {
                  if (onAction({ type: 'martial-spar', path })) setSparringReady(false);
                }} disabled={state.actionPoints < 1}
                  righteous="Khiêm Tốn · nhận sách và kỹ năng"
                  shadow="Hiếu Chiến · +10 Tà Khí · lò rèn khóa 2 ngày"
                />
              </div>}
        <small className="river-campaign__unlock">Tỷ thí buổi tối 14:00–06:00 · điều kiện Thân Pháp ≥40; nhánh Khiêm Tốn cần Thân Pháp ≥60 và Ngộ Tính ≥50. Hảo cảm: {state.martialAffinity}/100 · lò rèn khóa: {state.forgeLockDays} ngày.</small>
      </QuestCard>

      <QuestCard icon="📜" location="CHỢ NHỎ" title="Giao · Mật Thư Đổi Ca"
        description="Mở hội thoại ngầm buổi tối (14:00–06:00) để chọn bảo vệ hoặc phản bội thôn làng.">
        {state.marketChoice ? <p className="river-campaign__complete">✓ Đã chọn {state.marketChoice === 'righteous' ? 'Chính đạo · −30 Văn · Bản Đồ Tuần Tra · mở thuốc rẻ' : 'Tà đạo · Mật Thư Đông Hán · NPC trong làng mất niềm tin'}.</p>
          : !nightMarketOpen ? <p className="river-campaign__warning">Giao chỉ nhận nhiệm vụ từ 14:00 đến 06:00 · hiện tại {String(Math.floor(state.timeMinutes / 60)).padStart(2, '0')}:{String(state.timeMinutes % 60).padStart(2, '0')}.</p>
          : <ChoiceButtons
            righteous="Bảo vệ làng · −30 Văn · +20 Đạo Đức"
            shadow="Phản bội làng · +40 Tà Khí · −50 Đạo Đức"
            onChoose={path => act({ type: 'market-choice', path })}
            disabled={state.actionPoints < 1}
          />}
        {state.vanTien < 30 && !state.marketChoice && <small className="river-campaign__warning">Chưa đủ 30 Văn tiền để mua mật thư Chính đạo.</small>}
        <div className="river-campaign__side-quest river-campaign__shop">
          <strong>Tiệm tạp hóa & tuyến ngầm</strong>
          <button type="button" disabled={state.actionPoints < 1 || state.vanTien < 15} onClick={() => act({ type: 'buy-bait' })}>Mua 3 phần mồi câu · −15 Văn · 1 AP</button>
          <button type="button" disabled={state.actionPoints < 1 || fishingLevel < 2 || state.vanTien < 25} onClick={() => act({ type: 'buy-premium-bait' })}>Mồi xịn cấp 2+ · 3 phần · −25 Văn · 1 AP</button>
          <button type="button" disabled={state.actionPoints < 1 || state.fishStock < 1} onClick={() => act({ type: 'sell-fish' })}>Bán 1 cá trong túi · +20 Văn · 1 AP ({state.fishStock})</button>
          {state.cheapMedicineUnlocked && <>
            <button type="button" disabled={state.actionPoints < 1 || state.vanTien < 10} onClick={() => act({ type: 'buy-health-potion' })}>Mua thuốc hồi 150 HP · −10 Văn · 1 AP</button>
            <button type="button" disabled={state.healthPotionCount < 1 || state.hp >= state.maxHp} onClick={() => act({ type: 'use-health-potion' })}>Dùng thuốc hồi HP ({state.healthPotionCount})</button>
          </>}
          {state.evil >= 50 || state.poisonRecipeUnlocked
            ? <><small className="river-campaign__unlock">{state.poisonRecipeUnlocked ? 'Lão Lang Trung đã dạy công thức độc/dược liệu.' : 'Đã mở Sát Thủ Sổ Tay / Độc Thiểm Thư.'}</small>
              <button type="button" disabled={state.actionPoints < 1 || state.vanTien < 25} onClick={() => act({ type: 'buy-poison-supplies' })}>Mua dược liệu pha độc · −25 Văn · 1 AP</button>
              <button type="button" disabled={state.actionPoints < 1 || state.poisonSupplies < 1 || state.daggerPoisoned} onClick={() => act({ type: 'coat-dagger' })}>Tẩm độc dao găm · 1 AP</button>
            </>
            : <small>Cần Tà Khí ≥50 hoặc học dược liệu từ Lão Lang Trung ({state.evil}/50).</small>}
          <small>Mồi thường: {state.baitCount} · mồi xịn: {state.premiumBaitCount} · cá: {state.fishStock} · dược liệu độc: {state.poisonSupplies}</small>
        </div>
      </QuestCard>

      <QuestCard icon="🛡️" location="CHỐT CHẶN · CẦU GỖ" title="Trưởng Đội Tuần Tra Đông Hán · Đột Phá Vòng Vây"
        description="Mini-boss cuối map. Cần công thức Bẫy Tre Gai của Tảo và bí kíp đao pháp của Võ Sư Nương.">
        {state.bossDefeated ? <p className="river-campaign__complete">✓ Đã vượt Chốt Chặn · danh hiệu: {state.title} · {state.outfitReward ? `trang phục: ${state.outfitReward} ·` : 'đã cướp ấn tín ·'} World Map đã mở · lối vào {state.worldMapEntry === 'righteous' ? 'Chính đạo' : 'Tà đạo'}.</p>
          : <div className="river-campaign__boss-entry">
            <span>{state.trapRecipe ? '✓ Bẫy Tre Gai' : '○ Chưa có công thức bẫy'} · {state.knowsDaoManual ? '✓ Lạc Thủy Đao Pháp' : '○ Chưa học đao pháp'}</span>
            <button type="button" disabled={!state.trapRecipe || !state.knowsDaoManual || state.bossStarted}
              onClick={() => { if (onAction({ type: 'start-boss' })) onStartBoss(); }}>
              {state.bossStarted ? 'Trận đánh đang chờ tiếp tục' : 'Vào trận 6 × 6'}
            </button>
            {state.bossStarted && <button type="button" onClick={onStartBoss}>Tiếp tục trận đánh →</button>}
          </div>}
      </QuestCard>
    </div>

    <footer className="river-campaign__note">
      <strong>Hà Bá Tức Công · Tàn Quyển</strong>
      <span>{state.morality >= 60
        ? 'Đã đủ điều kiện nhận. Trang bị tâm pháp để hồi 3% HP và 3% MP mỗi lượt khi đứng gần sông nước.'
        : `Cần Đạo Đức 60 · hiện tại ${state.morality}.`}</span>
      {state.morality >= 60 && <button type="button" onClick={() => act({ type: 'equip-ha-ba', equipped: !state.haBaEquipped })}>
        {state.haBaEquipped ? 'Tháo Hà Bá Tức Công' : 'Trang bị Hà Bá Tức Công'}
      </button>}
      {state.haBaEquipped && <span>✓ Hà Bá Tức Công đang trang bị.</span>}
      {state.fastTravel && <span>✓ Đi nhanh đã mở khóa từ Bến Thuyền.</span>}
      {state.fastTravel && <button type="button" onClick={onFastTravel}>Chèo thuyền độc mộc về Bến Thuyền →</button>}
      {state.patrolMap && <span>✓ Bản Đồ Tuần Tra đã ghi nhận lối đi an toàn.</span>}
      {state.worldMapUnlocked && <button type="button" onClick={onWorldMap}>World Map đã mở · xem bản đồ →</button>}
    </footer>
  </section>;
}
