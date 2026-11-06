import { useState } from 'react';
import type {
  RiverBattlePoint,
  RiverBattleSnapshot,
  RiverBattleSoldier,
  RiverCampaignState,
  RiverPath,
} from '../game/riverCampaign';
import '../styles/river-campaign.css';

type BattleMode = 'move' | 'attack' | 'trap' | null;
type BattleState = RiverBattleSnapshot;

const BOARD_SIZE = 6;
const INITIAL_BOSS_HP = 850;

function distance(a: RiverBattlePoint, b: RiverBattlePoint) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function inside(point: RiverBattlePoint) {
  return point.x >= 0 && point.x < BOARD_SIZE && point.y >= 0 && point.y < BOARD_SIZE;
}

function damageForTerrain(state: BattleState, talent: string | null, base: number, bladeBonus = false, steelDagger = false, weaponUpgradeLevel = 0) {
  const riverBonus = talent === 'forest-and-tide' && state.hero.y === 3 ? 1.25 : 1;
  const critBonus = state.nextCritical ? 2 : 1;
  const armorReduction = 1 + state.armorBreakBonus / 100;
  const daggerBonus = steelDagger ? 1.2 + weaponUpgradeLevel * .05 : 1;
  return Math.round(base * riverBonus * critBonus * (bladeBonus ? 1.1 : 1) * daggerBonus * armorReduction);
}

function occupied(state: BattleState, point: RiverBattlePoint) {
  return (state.bossHp > 0 && state.boss.x === point.x && state.boss.y === point.y)
    || state.soldiers.some(soldier => soldier.hp > 0
      && soldier.position.x === point.x && soldier.position.y === point.y);
}

function bossConeContains(boss: RiverBattlePoint, target: RiverBattlePoint) {
  const dx = target.x - boss.x;
  const dy = target.y - boss.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const forward = Math.sign(dx);
    return forward !== 0 && dx === forward && Math.abs(dy) <= 1;
  }
  const forward = Math.sign(dy);
  return forward !== 0 && dy === forward && Math.abs(dx) <= 1;
}

function finishStatus(state: BattleState): BattleState {
  if (state.bossHp <= 0) {
    return {
      ...state,
      bossHp: 0,
      status: 'won',
      log: 'Trưởng đội tuần tra gục ngã · hai lính giáo buông vũ khí và đầu hàng. Hãy quyết định kết cục.',
    };
  }
  if (state.hp <= 0) return { ...state, hp: 0, status: 'lost', log: 'Tiểu Mông đã kiệt sức. Hãy rút lui và chuẩn bị lại.' };
  return state;
}

function stepToward(state: BattleState, from: RiverBattlePoint, target: RiverBattlePoint): RiverBattlePoint | null {
  const candidates = [
    { x: from.x + Math.sign(target.x - from.x), y: from.y },
    { x: from.x, y: from.y + Math.sign(target.y - from.y) },
  ].filter((point, index, list) => (point.x !== from.x || point.y !== from.y)
    && inside(point)
    && !occupied(state, point)
    && list.findIndex(candidate => candidate.x === point.x && candidate.y === point.y) === index)
    .sort((a, b) => distance(a, target) - distance(b, target));
  return candidates[0] ?? null;
}

function enemyTurn(input: BattleState, talent: string | null, haBaEquipped: boolean, banditArmorUnlocked: boolean): BattleState {
  let state = { ...input, soldiers: input.soldiers.map(soldier => ({ ...soldier, position: { ...soldier.position } })) };
  let log = 'Lượt của quân Đông Hán.';
  let trapTriggered = false;
  const evading = state.evasionTurns > 0;
  const physicalDamage = (amount: number) => Math.max(1, Math.round(amount * (banditArmorUnlocked ? .8 : 1)));

  if (state.bleedTurns > 0) {
    state = { ...state, hp: Math.max(0, state.hp - 15), bleedTurns: state.bleedTurns - 1 };
    log = 'Xung Huyết gây mất 15 HP đầu lượt.';
    state = finishStatus(state);
    if (state.status !== 'playing') return state;
  }

  if (state.bossPoisonTurns > 0) {
    state = {
      ...state,
      bossHp: Math.max(0, state.bossHp - 20),
      bossPoisonTurns: state.bossPoisonTurns - 1,
    };
    log = 'Độc Thiểm Thư gây 20 sát thương độc duy trì.';
    state = finishStatus(state);
    if (state.status !== 'playing') return state;
  }

  for (const id of ['spear-1', 'spear-2'] as const) {
    let soldier = state.soldiers.find(candidate => candidate.id === id);
    if (!soldier || soldier.hp <= 0 || evading) continue;
    for (let ap = 0; ap < 3 && state.status === 'playing'; ap += 1) {
      soldier = state.soldiers.find(candidate => candidate.id === id);
      if (!soldier || soldier.hp <= 0) break;
      if (distance(soldier.position, state.hero) <= 1) {
        const damage = physicalDamage(45);
        state = { ...state, hp: state.hp - damage };
        log = `${id === 'spear-1' ? 'Lính giáo thứ nhất' : 'Lính giáo thứ hai'} đánh trúng · Tiểu Mông mất ${damage} HP.`;
        state = finishStatus(state);
        if (state.status !== 'playing') break;
        continue;
      }
      const step = stepToward(state, soldier.position, state.hero);
      if (!step) break;
      state = {
        ...state,
        soldiers: state.soldiers.map(candidate => candidate.id === id ? { ...candidate, position: step } : candidate),
      };
      log = 'Lính giáo áp sát Tiểu Mông.';
    }
    if (state.status !== 'playing') return state;
  }

  if (state.rootTurns > 0) {
    state = { ...state, rootTurns: state.rootTurns - 1 };
    log = 'Bẫy Tre Gai định thân Trưởng Đội · mini-boss mất trọn lượt.';
  } else if (!evading) {
    const phaseTwo = state.bossHp <= INITIAL_BOSS_HP / 2;
    const bossDamage = physicalDamage(Math.round(110 * (phaseTwo ? 1.3 : 1)));
    if (!phaseTwo && state.turn % 2 === 0) {
      const hit = bossConeContains(state.boss, state.hero);
      if (hit) state = { ...state, hp: Math.max(0, state.hp - bossDamage) };
      log = hit ? `Chém Ngang trúng vùng nón 3 ô · Tiểu Mông mất ${bossDamage} HP.` : 'Chém Ngang quét vùng nón 3 ô nhưng hụt.';
    } else if (phaseTwo && state.turn % 2 === 0) {
      const dx = state.hero.x - state.boss.x;
      const dy = state.hero.y - state.boss.y;
      const aligned = dx === 0 || dy === 0;
      if (aligned && distance(state.boss, state.hero) <= 2) {
        state = { ...state, hp: Math.max(0, state.hp - bossDamage), bleedTurns: 3 };
        log = `Vung Kiếm Trừu Khí gây ${bossDamage} sát thương và Xung Huyết (15 HP/lượt trong 3 lượt).`;
      } else {
        log = 'Trưởng Đội vung kiếm trừu khí nhưng chưa áp sát được.';
      }
    } else {
      const dashDistance = phaseTwo ? 3 : 2;
      let moved = 0;
      while (moved < dashDistance && distance(state.boss, state.hero) > 1) {
        const step = stepToward(state, state.boss, state.hero);
        if (!step) break;
        const entersTrap = state.trap?.x === step.x && state.trap.y === step.y;
        state = { ...state, boss: step };
        moved += 1;
        if (entersTrap) {
          state = {
            ...state, bossHp: state.bossHp - 120, trap: null, rootTurns: 1,
            armorTurns: 2, armorBreakBonus: 50,
          };
          log = 'BÙM! Trưởng Đội dẫm Bẫy Tre Gai · xuyên giáp 120 HP và bị định thân.';
          trapTriggered = true;
          break;
        }
      }
      if (!trapTriggered && phaseTwo && distance(state.boss, state.hero) <= 1) {
        state = { ...state, hp: Math.max(0, state.hp - bossDamage) };
        log = `Lướt Đâm 3 ô · Tiểu Mông mất ${bossDamage} HP.`;
      } else if (!trapTriggered) {
        log = phaseTwo ? 'Trưởng Đội Lướt Đâm áp sát tối đa 3 ô.' : 'Trưởng Đội di chuyển áp sát tối đa 2 ô.';
      }
    }
  } else {
    log = 'Rái Cá Quần Thủy né toàn bộ đòn đánh trong lượt này.';
  }

  state = finishStatus(state);
  if (state.status !== 'playing') return state;
  const riverRest = state.hero.y === 3 && haBaEquipped;
  const recovered = riverRest
    ? {
        hp: Math.min(state.maxHp, state.hp + Math.ceil(state.maxHp * .03)),
        mp: Math.min(state.maxMp, state.mp + Math.ceil(state.maxMp * .03)),
      }
    : { hp: state.hp, mp: state.mp };
  return {
    ...state,
    ...recovered,
    ap: 3,
    turn: state.turn + 1,
    evasionTurns: 0,
    armorTurns: Math.max(0, state.armorTurns - (trapTriggered ? 0 : 1)),
    armorBreakBonus: state.armorTurns > (trapTriggered ? 0 : 1) ? state.armorBreakBonus : 0,
    log: riverRest ? 'Sang lượt mới · Hà Bá Tức Công hồi 3% HP/MP bên sông.' : log,
  };
}

export function MelinCheckpointBattle({ campaign, talent, onVictory, onRetreat, onStateChange, haBaEquipped }: {
  campaign: RiverCampaignState;
  talent: string | null;
  haBaEquipped: boolean;
  onVictory: (path: RiverPath, battle: { hp: number; mp: number; bambooUsed: number }) => boolean;
  onRetreat: (battle: { hp: number; mp: number; bambooUsed: number }) => void;
  onStateChange: (battle: RiverBattleSnapshot) => boolean;
}) {
  const [battle, setBattle] = useState<BattleState>(() => campaign.battle ?? {
    ...{
      hero: { x: 0, y: 2 },
      boss: { x: 4, y: 2 },
      soldiers: [
        { id: 'spear-1', position: { x: 3, y: 1 }, hp: 200 },
        { id: 'spear-2', position: { x: 3, y: 3 }, hp: 200 },
      ],
      hp: 650,
      maxHp: 650,
      bossHp: INITIAL_BOSS_HP,
      mp: 350,
      maxMp: 350,
      ap: 3,
      armorTurns: 0,
      armorBreakBonus: 0,
      rootTurns: 0,
      bossPoisonTurns: 0,
      poisonUsed: false,
      evasionTurns: 0,
      bleedTurns: 0,
      trap: null,
      bambooUsed: 0,
      nextCritical: false,
      status: 'playing' as const,
      log: 'Thân pháp 75 giúp Tiểu Mông đi trước · Tiểu Mông có 3 AP.',
      turn: 1,
    },
  });
  const [mode, setMode] = useState<BattleMode>(null);
  const [notice, setNotice] = useState('');
  const terrainTitle = talent === 'forest-and-tide' ? ' · Sơn Lâm Thợ Săn +25% sát thương trên ô sông' : '';

  function applyAction(next: BattleState, message: string, apCost: number, consumesCritical = false) {
    let updated = finishStatus({
      ...next,
      ap: next.ap - apCost,
      nextCritical: consumesCritical ? false : next.nextCritical,
    });
    if (updated.status === 'playing' && updated.ap <= 0) updated = enemyTurn(updated, talent, haBaEquipped, campaign.banditArmorUnlocked);
    const savedState = { ...updated, log: updated.status === 'playing' && updated.turn === battle.turn ? message : updated.log };
    if (!onStateChange(savedState)) {
      setNotice('Chưa lưu được nước đi. Trạng thái trận được giữ nguyên.');
      return;
    }
    setBattle(savedState);
    setMode(null);
    setNotice('');
  }

  function moveTo(x: number, y: number) {
    const target = { x, y };
    if (battle.ap < 1 || distance(battle.hero, target) !== 1 || !inside(target) || occupied(battle, target)) return;
    applyAction({ ...battle, hero: target }, 'Tiểu Mông di chuyển 1 ô · tốn 1 AP.', 1);
  }

  function attack(targetId: RiverBattleSoldier['id'] | 'boss') {
    const target = targetId === 'boss'
      ? battle.boss
      : battle.soldiers.find(soldier => soldier.id === targetId)?.position;
    if (!target || battle.ap < 1 || distance(battle.hero, target) > 1) {
      setNotice('Cần đứng cạnh mục tiêu và còn ít nhất 1 AP.');
      return;
    }
    const damage = damageForTerrain(battle, talent, 100, true, campaign.daggerForged, campaign.weaponUpgradeLevel);
    const poisonHit = targetId === 'boss' && campaign.daggerPoisoned && !battle.poisonUsed;
    const next = targetId === 'boss'
      ? { ...battle, bossHp: battle.bossHp - damage, bossPoisonTurns: poisonHit ? 3 : battle.bossPoisonTurns, poisonUsed: battle.poisonUsed || poisonHit }
      : {
          ...battle,
          soldiers: battle.soldiers.map(soldier => soldier.id === targetId
            ? { ...soldier, hp: Math.max(0, soldier.hp - damage) }
            : soldier),
        };
    applyAction(next, poisonHit
      ? `Đánh dao gây ${damage} sát thương · Độc Thiểm Thư gây thêm 20 sát thương mỗi lượt trong 3 lượt.`
      : `Đòn đánh thường gây ${damage} sát thương · tốn 1 AP.`, 1, true);
  }

  function useWaterDart() {
    if (battle.ap < 2 || battle.mp < 40) { setNotice('Cá Cóc Phún Thủy cần 2 AP và 40 MP.'); return; }
    if (distance(battle.hero, battle.boss) > 4) { setNotice('Cá Cóc Phún Thủy chỉ đánh trúng mục tiêu trong 4 ô.'); return; }
    const damage = damageForTerrain(battle, talent, 100);
    applyAction({
      ...battle, bossHp: battle.bossHp - damage, mp: battle.mp - 40, armorTurns: 4, armorBreakBonus: 30,
    }, `Cá Cóc Phún Thủy gây ${damage} sát thương, phá giáp trong 3 lượt · tốn 2 AP.`, 2, true);
  }

  function useOxBash() {
    if (!campaign.inventory.SKILL_DA_NGUU_BAI_TUONG) { setNotice('Hãy hoàn thành nhiệm vụ ẩn của Hạc Lão để học Đả Ngưu Bái Tướng.'); return; }
    if (battle.ap < 1 || battle.mp < 40) { setNotice('Đả Ngưu Bái Tướng cần 1 AP và 40 MP.'); return; }
    if (distance(battle.hero, battle.boss) > 1) { setNotice('Đả Ngưu Bái Tướng cần đứng kề Trưởng Đội.'); return; }
    const damage = damageForTerrain(battle, talent, 220, true, campaign.daggerForged, campaign.weaponUpgradeLevel);
    applyAction({
      ...battle,
      bossHp: battle.bossHp - damage,
      mp: battle.mp - 40,
    }, `Đả Ngưu Bái Tướng gây ${damage} sát thương · tốn 40 MP và 1 AP.`, 1, true);
  }

  function useOtterDash() {
    if (battle.ap < 2 || battle.mp < 50) { setNotice('Rái Cá Quần Thủy cần 2 AP và 50 MP.'); return; }
    const dx = battle.hero.x - battle.boss.x;
    const dy = battle.hero.y - battle.boss.y;
    const behind = Math.abs(dx) >= Math.abs(dy)
      ? { x: battle.boss.x - Math.sign(dx || -1), y: battle.boss.y }
      : { x: battle.boss.x, y: battle.boss.y - Math.sign(dy || -1) };
    if (!inside(behind) || occupied(battle, behind) || distance(battle.hero, behind) > 4) {
      setNotice('Chưa có đường trống để lướt vòng ra sau lưng Trưởng Đội.');
      return;
    }
    const damage = damageForTerrain({ ...battle, hero: behind }, talent, 310, false, campaign.daggerForged, campaign.weaponUpgradeLevel);
    const poisonHit = campaign.daggerPoisoned && !battle.poisonUsed;
    applyAction({
      ...battle,
      hero: behind,
      bossHp: battle.bossHp - damage,
      mp: battle.mp - 50,
      evasionTurns: 1,
      bossPoisonTurns: poisonHit ? 3 : battle.bossPoisonTurns,
      poisonUsed: battle.poisonUsed || poisonHit,
    }, poisonHit
      ? `Rái Cá Quần Thủy chí mạng · 310 sát thương cơ bản (thực nhận ${damage}), né phản công · đã gây độc 3 lượt.`
      : `Rái Cá Quần Thủy chí mạng · 310 sát thương cơ bản (thực nhận ${damage}), lướt ra sau lưng và né đòn · 2 AP.`, 2, true);
  }

  function placeBambooTrap(x: number, y: number) {
    const target = { x, y };
    if (battle.ap < 1 || battle.mp < 50) { setNotice('Bẫy Tre Gai cần 1 AP và 50 MP.'); return; }
    if (campaign.oldBamboo <= battle.bambooUsed) { setNotice('Không còn Thân Tre Già để đặt bẫy.'); return; }
    if (!inside(target) || distance(battle.hero, target) !== 1 || occupied(battle, target)) {
      setNotice('Chọn một ô trống kề bên để đặt bẫy.');
      return;
    }
    const ingenious = talent === 'ingenious-trapper';
    applyAction({
      ...battle,
      trap: target,
      bambooUsed: battle.bambooUsed + 1,
      mp: battle.mp - 50,
      nextCritical: ingenious || battle.nextCritical,
    }, ingenious
      ? `Đặt Bẫy Tre Gai tại ô ${x + 1}, ${y + 1} · 1 AP · Cơ Biến Vô Song hồi 30 MP, đòn kế chắc chắn chí mạng.`
      : `Đặt Bẫy Tre Gai tại ô ${x + 1}, ${y + 1} · tốn 1 AP và 50 MP.`, 1);
  }

  function useToadCrossbow() {
    if (!campaign.crossbowUnlocked) { setNotice('Hãy hoàn thành buổi câu cá đầu tiên với Tảo để nhận Nỏ Cóc.'); return; }
    if (battle.ap < 1 || battle.mp < 30) { setNotice('Nỏ Cóc Liên Châu cần 1 AP và 30 MP.'); return; }
    if (distance(battle.hero, battle.boss) > 2) { setNotice('Nỏ Cóc Liên Châu chỉ bắn trúng mục tiêu trong 2 ô.'); return; }
    const damage = damageForTerrain(battle, talent, 240);
    applyAction({
      ...battle,
      bossHp: battle.bossHp - damage,
      mp: battle.mp - 30,
    }, `Nỏ Cóc Liên Châu bắn 3 phát · 240 sát thương cơ bản (thực nhận ${damage}) · 1 AP.`, 1);
  }

  function endTurn() {
    if (battle.status !== 'playing') return;
    const next = enemyTurn(battle, talent, haBaEquipped, campaign.banditArmorUnlocked);
    if (!onStateChange(next)) {
      setNotice('Chưa lưu được lượt đi. Trạng thái trận được giữ nguyên.');
      return;
    }
    setBattle(next);
    setMode(null);
  }

  return <section className="river-battle" aria-label="Trận chiến Chốt Chặn">
    <header className="river-battle__header">
      <div><span className="sv-kicker">MINI-BOSS · CHỐT CHẶN</span><h1>Đột Phá Vòng Vây</h1><p>Bàn cờ chiến đấu 6 × 6 · 3 AP mỗi lượt{terrainTitle}</p></div>
      <button type="button" className="river-battle__back" disabled={battle.status === 'won'} onClick={() => onRetreat({ hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>Rút khỏi trận</button>
    </header>
    <div className="river-battle__hud">
      <span>🧑 Tiểu Mông HP {battle.hp} / {battle.maxHp} · MP {battle.mp} / {battle.maxMp} · Thân Pháp {talent === 'keen-senses' ? 90 : 75}</span>
      <span>🛡️ Trưởng Đội {battle.bossHp} / {INITIAL_BOSS_HP} HP · 200 / 200 MP · Thân Pháp {battle.bossHp <= INITIAL_BOSS_HP / 2 ? '80 · Cuồng nộ +30% ATK' : '60 · Phase 1'} · sát thương 110–150{battle.armorTurns > 0 ? ` · giáp vỡ +${battle.armorBreakBonus}% sát thương trong ${battle.armorTurns} lượt` : ''}{battle.bossPoisonTurns > 0 ? ` · trúng độc ${battle.bossPoisonTurns} lượt` : ''}</span>
      <span>AP {battle.ap} / 3 · Lượt {battle.turn}</span>
      <span>🗡️ Lính giáo: {battle.soldiers.map(soldier => `${soldier.hp} / 200 HP`).join(' · ')} · 50 MP · Thân Pháp 40 · sát thương 45–60</span>
      <span>🎋 Bẫy đã đặt {battle.bambooUsed}/{campaign.oldBamboo}</span>
    </div>
    <div className="river-battle__layout">
      <div className="river-battle__board" role="grid" aria-label="Bàn cờ 6 nhân 6">
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
          const x = index % BOARD_SIZE;
          const y = Math.floor(index / BOARD_SIZE);
          const isHero = battle.hero.x === x && battle.hero.y === y;
          const isBoss = battle.bossHp > 0 && battle.boss.x === x && battle.boss.y === y;
          const soldier = battle.soldiers.find(unit => unit.hp > 0 && unit.position.x === x && unit.position.y === y);
          const isTrap = battle.trap?.x === x && battle.trap?.y === y;
          const river = y === 3;
          const isEnemy = isBoss || soldier !== undefined;
          return <button
            type="button"
            role="gridcell"
            key={`${x}-${y}`}
            aria-label={`Ô ${x + 1}, ${y + 1}${isHero ? ', Tiểu Mông' : ''}${isBoss ? ', Trưởng đội' : ''}${soldier ? `, Lính giáo ${soldier.id === 'spear-1' ? 'một' : 'hai'} ${soldier.hp} HP` : ''}${isTrap ? ', Bẫy tre' : ''}${river ? ', sông' : ''}`}
            className={`river-battle__cell${river ? ' is-river' : ''}${isHero ? ' is-hero' : ''}${isBoss ? ' is-boss' : ''}${soldier ? ' is-soldier' : ''}${isTrap ? ' has-trap' : ''}${mode === 'move' || mode === 'trap' ? ' is-move-target' : ''}`}
            onClick={() => {
              if (mode === 'attack' && isEnemy) attack(isBoss ? 'boss' : soldier!.id);
              else if (mode === 'move') moveTo(x, y);
              else if (mode === 'trap') placeBambooTrap(x, y);
            }}
          >{isHero ? '🧑' : isBoss ? '🛡️' : soldier ? '🗡️' : isTrap ? '🎋' : river ? '≈' : ''}</button>;
        })}
      </div>
      <aside className="river-battle__controls">
        <h2>Hành động</h2>
        <button type="button" disabled={battle.status !== 'playing' || battle.ap < 1} aria-pressed={mode === 'move'} onClick={() => { setNotice('Chọn một ô trống kề bên · di chuyển tốn 1 AP.'); setMode('move'); }}>Di chuyển · 1 AP</button>
        <button type="button" disabled={battle.status !== 'playing' || battle.ap < 1} aria-pressed={mode === 'attack'} onClick={() => { setNotice('Chọn lính giáo hoặc Trưởng Đội đứng kề bên để đánh.'); setMode('attack'); }}>Đánh thường · 1 AP</button>
        {campaign.inventory.SKILL_DA_NGUU_BAI_TUONG && <button type="button" disabled={battle.status !== 'playing' || battle.ap < 1 || battle.mp < 40} onClick={useOxBash}>Đả Ngưu Bái Tướng · 40 MP · 1 AP</button>}
        <button type="button" disabled={battle.status !== 'playing' || battle.ap < 2} onClick={useWaterDart}>Cá Cóc Phún Thủy · 40 MP · 2 AP</button>
        <button type="button" disabled={battle.status !== 'playing' || !campaign.crossbowUnlocked || battle.ap < 1} onClick={useToadCrossbow}>Nỏ Cóc Liên Châu · 30 MP · 1 AP</button>
        <button type="button" disabled={battle.status !== 'playing' || battle.ap < 2} onClick={useOtterDash}>Rái Cá Quần Thủy · 50 MP · 2 AP</button>
        <button type="button" disabled={battle.status !== 'playing' || battle.ap < 1} aria-pressed={mode === 'trap'} onClick={() => { setNotice('Chọn ô trống kề bên để đặt bẫy · 1 AP, 50 MP.'); setMode('trap'); }}>Bẫy Tre Gai · 50 MP · 1 AP</button>
        <button type="button" disabled={battle.status !== 'playing'} onClick={endTurn}>Kết thúc lượt</button>
        {notice && <p role="status">{notice}</p>}
        <p className="river-battle__log" role="status">{battle.log}</p>
        <small>Xuất phát: Tiểu Mông (1,3), lính giáo (4,2) và (4,4), Trưởng Đội (5,3). Ô xanh là dòng sông. {haBaEquipped ? 'Hà Bá Tức Công đang trang bị, hồi 3% HP/MP khi kết thúc lượt bên sông.' : 'Hà Bá Tức Công cần đạt Đạo Đức 60 và trang bị trong Công pháp.'}</small>
      </aside>
    </div>
    {battle.status === 'won' && <section className="river-battle__outcome" aria-label="Chọn kết cục">
      <h2>Trưởng Đội đã bị đánh bại. Chọn kết cục map:</h2>
      <button type="button" onClick={() => onVictory('righteous', { hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>
        Tha mạng · Chính đạo · Đạo Đức +20 · Mê Linh Hiệp Sĩ
      </button>
      <button type="button" onClick={() => onVictory('shadow', { hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>
        Kết liễu & cướp chiến lợi phẩm · Tà đạo · +200 Văn tiền · U Minh Sát Thủ
      </button>
    </section>}
    {battle.status === 'lost' && <section className="river-battle__outcome" aria-label="Thất bại">
      <h2>Tiểu Mông kiệt sức</h2>
      <p>Trận có thể thử lại; AP đã dùng để vào Chốt Chặn không được hoàn lại.</p>
      <button type="button" onClick={() => onRetreat({ hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>Rút lui và hồi sức</button>
    </section>}
  </section>;
}
