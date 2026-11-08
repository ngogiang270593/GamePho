import { useEffect, useRef, useState } from 'react';
import type { Facing } from '../game/character';
import { DEFAULT_OPENING_MAP_NPCS, useOpeningMapNpcs } from '../game/openingMapNpcs';
import { freshRiverBattleSnapshot, type RiverBattlePoint, type RiverBattleSnapshot, type RiverBattleSoldier, type RiverCampaignState, type RiverPath } from '../game/riverCampaign';
import { startingCharacterInventory } from '../game/characterInventory';
import { STARTING_CHARACTERS, startingCharacterAppearance } from '../game/startingCharacters';
import { CharacterSprite } from './CharacterSprite';
import { OpeningMapNpcArtwork } from './OpeningMapNpcArtwork';
import { SkillIcon } from './SkillIcon';
import { SkillVFXCanvas } from './SkillVFXCanvas';
import type { SkillVfxEffect, SkillVfxSkill } from '../game/skillVfx';
import { HERO_SKILL_TREE } from '../game/heroSkills';
import { loadHeroSkillLoadout } from '../game/heroSkillLoadout';

type BattleOutcome = { hp: number; mp: number; bambooUsed: number };
type AimMode = 'attack' | 'water-dart' | 'crossbow' | 'ox-bash' | 'whirlpool' | 'trap' | null;
type AnimationKind = 'water-dart' | 'otter-dash' | 'whirlpool' | 'bamboo-trap' | 'turtle-guard';
type SkillAnimation = {
  id: number;
  kind: AnimationKind;
  phase: 'prepare' | 'travel' | 'impact';
  from: RiverBattlePoint;
  to: RiverBattlePoint;
};
type CooldownId = 'attack' | 'water-dart' | 'crossbow' | 'otter-dash' | 'whirlpool' | 'bamboo-trap' | 'ox-bash' | 'turtle-guard';
type BossSkillId = 'hook-shot' | 'mud-surge' | 'iron-gate-charge' | 'river-vortex' | 'execution-cross';
type BossSkillCast = {
  id: number;
  skill: BossSkillId;
  origin: RiverBattlePoint;
  target: RiverBattlePoint;
  impactAt: number;
  expiresAt: number;
  resolved: boolean;
};

const BOSS_SKILLS: Record<BossSkillId, { name: string; kind: 'line' | 'area'; range: number; damage: number }> = {
  'hook-shot': { name: 'Truy Hồn Câu', kind: 'line', range: 2.8, damage: 112 },
  'mud-surge': { name: 'Đầm Lầy Chấn', kind: 'area', range: 2.8, damage: 96 },
  'iron-gate-charge': { name: 'Thiết Môn Xung Phong', kind: 'line', range: 3, damage: 148 },
  'river-vortex': { name: 'Hắc Hà Toàn Lưu', kind: 'area', range: 3.2, damage: 126 },
  'execution-cross': { name: 'Đoạt Mệnh Thập Tự', kind: 'line', range: 2.8, damage: 172 },
};
const BOSS_SKILL_CYCLE = Object.keys(BOSS_SKILLS) as BossSkillId[];

const INITIAL_BOSS_HP = 850;
const PLAYER = STARTING_CHARACTERS[0];
const PLAYER_APPEARANCE = startingCharacterAppearance(PLAYER.id, 'male');
const PLAYER_CUSTOMIZATION = startingCharacterInventory(PLAYER_APPEARANCE, PLAYER);
const VFX_SKILL: Record<AnimationKind, SkillVfxSkill> = {
  'water-dart': 'ca-coc-phon-thuy',
  'otter-dash': 'rai-ca-quan-thuy',
  whirlpool: 'ha-ba-cuon-luu',
  'bamboo-trap': 'bay-tre-gai',
  'turtle-guard': 'rua-dam-lay-thu',
};
const DURATIONS: Record<AnimationKind, { prepare: number; travel: number; impact: number }> = {
  'water-dart': { prepare: 240, travel: 580, impact: 280 },
  'otter-dash': { prepare: 220, travel: 560, impact: 300 },
  whirlpool: { prepare: 420, travel: 1050, impact: 520 },
  'bamboo-trap': { prepare: 250, travel: 430, impact: 300 },
  'turtle-guard': { prepare: 280, travel: 400, impact: 420 },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: RiverBattlePoint, b: RiverBattlePoint) => Math.hypot(a.x - b.x, a.y - b.y);
const BRIDGE_BOUNDS = { minX: .25, maxX: 5, minY: 1.9, maxY: 3.1 };
const onBridge = (point: RiverBattlePoint) =>
  point.x >= BRIDGE_BOUNDS.minX && point.x <= BRIDGE_BOUNDS.maxX
  && point.y >= BRIDGE_BOUNDS.minY && point.y <= BRIDGE_BOUNDS.maxY;
const bridgePoint = (point: RiverBattlePoint): RiverBattlePoint => ({
  x: clamp(point.x, BRIDGE_BOUNDS.minX, BRIDGE_BOUNDS.maxX),
  y: clamp(point.y, BRIDGE_BOUNDS.minY, BRIDGE_BOUNDS.maxY),
});
function distanceToSegment(point: RiverBattlePoint, start: RiverBattlePoint, end: RiverBattlePoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = dx * dx + dy * dy || 1;
  const progress = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / length, 0, 1);
  return distance(point, { x: start.x + progress * dx, y: start.y + progress * dy });
}

const pointAlong = (from: RiverBattlePoint, to: RiverBattlePoint, step: number): RiverBattlePoint => {
  const length = distance(from, to);
  if (length <= step || length === 0) return { ...to };
  return { x: from.x + (to.x - from.x) / length * step, y: from.y + (to.y - from.y) / length * step };
};
const isAlive = (soldier: RiverBattleSoldier) => soldier.hp > 0;

function finishStatus(state: RiverBattleSnapshot): RiverBattleSnapshot {
  if (state.bossHp <= 0) return {
    ...state,
    bossHp: 0,
    status: 'won',
    log: 'Trưởng đội tuần tra gục ngã · hai lính giáo buông vũ khí và đầu hàng. Hãy quyết định kết cục.',
  };
  if (state.hp <= 0) return { ...state, hp: 0, status: 'lost', log: 'Tiểu Mông đã kiệt sức. Hãy rút lui và chuẩn bị lại.' };
  return state;
}

function damageForTerrain(state: RiverBattleSnapshot, talent: string | null, base: number, bladeBonus = false, steelDagger = false, weaponUpgradeLevel = 0) {
  const onRiver = state.hero.y >= 2.5 && state.hero.y <= 3.5;
  const riverBonus = talent === 'forest-and-tide' && onRiver ? 1.25 : 1;
  const critBonus = state.nextCritical ? 2 : 1;
  const armorReduction = 1 + state.armorBreakBonus / 100;
  const daggerBonus = steelDagger ? 1.2 + weaponUpgradeLevel * .05 : 1;
  return Math.round(base * riverBonus * critBonus * (bladeBonus ? 1.1 : 1) * daggerBonus * armorReduction);
}

function getSnapshot(campaign: RiverCampaignState): RiverBattleSnapshot {
  const saved = campaign.battle ?? freshRiverBattleSnapshot(campaign);
  return {
    ...saved,
    hero: bridgePoint(saved.hero),
    boss: bridgePoint(saved.boss),
    soldiers: saved.soldiers.map(soldier => ({ ...soldier, position: bridgePoint(soldier.position) })),
  };
}

export function RealtimeMelinCheckpointBattle({ campaign, talent, onVictory, onRetreat, onStateChange, haBaEquipped }: {
  campaign: RiverCampaignState;
  talent: string | null;
  haBaEquipped: boolean;
  onVictory: (path: RiverPath, battle: BattleOutcome) => boolean;
  onRetreat: (battle: BattleOutcome) => void;
  onStateChange: (battle: RiverBattleSnapshot) => boolean;
}) {
  const mapNpcs = useOpeningMapNpcs();
  const gateGuard = mapNpcs.find(npc => npc.id === 'gate-guard')
    ?? DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'gate-guard')!;
  const patrolArcher = mapNpcs.find(npc => npc.id === 'patrol-archer')
    ?? DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'patrol-archer')!;
  const patrolSwordsman = mapNpcs.find(npc => npc.id === 'patrol-swordsman')
    ?? DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'patrol-swordsman')!;
  const [battle, setBattle] = useState(() => getSnapshot(campaign));
  const [aimMode, setAimMode] = useState<AimMode>(null);
  const [aimPoint, setAimPoint] = useState<RiverBattlePoint | null>(null);
  const [skillAnimation, setSkillAnimation] = useState<SkillAnimation | null>(null);
  const [notice, setNotice] = useState('');
  const [reducedEffects, setReducedEffects] = useState(false);
  const [facing, setFacing] = useState<Facing>('right');
  const [walking, setWalking] = useState(false);
  const [clock, setClock] = useState(() => performance.now());
  const [bossCast, setBossCast] = useState<BossSkillCast | null>(null);
  const [endingStep, setEndingStep] = useState(0);
  const [loadout] = useState(loadHeroSkillLoadout);
  const stage = useRef<HTMLDivElement>(null);
  const battleRef = useRef(battle);
  const saveRef = useRef(onStateChange);
  const keys = useRef(new Set<string>());
  const cooldowns = useRef<Partial<Record<CooldownId, number>>>({});
  const enemyAttackAt = useRef<Record<string, number>>({});
  const attackUntil = useRef<Record<string, number>>({});
  const timers = useRef<number[]>([]);
  const animationId = useRef(0);
  const lastFrame = useRef(0);
  const lastRender = useRef(0);
  const lastSave = useRef(0);
  const lastStatusTick = useRef(0);
  const lastRecoveryTick = useRef(0);
  const lastTurnTick = useRef(performance.now());
  const evasionUntil = useRef(0);
  const rootedUntil = useRef(0);
  const slowedUntil = useRef(0);
  const dashTarget = useRef<RiverBattlePoint | null>(null);
  const bossCastRef = useRef<BossSkillCast | null>(null);
  const nextBossSkillAt = useRef(performance.now() + 1800);
  const bossSkillSequence = useRef(0);
  const guardUntil = useRef(0);
  const guardReflectReady = useRef(false);
  const hotkeyActions = useRef<(key: string) => void>(() => undefined);

  battleRef.current = battle;
  saveRef.current = onStateChange;

  useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
  }, []);

  function updateBattle(update: (state: RiverBattleSnapshot) => RiverBattleSnapshot) {
    const previousStatus = battleRef.current.status;
    const next = finishStatus(update(battleRef.current));
    battleRef.current = next;
    setBattle(next);
    if (previousStatus === 'playing' && next.status !== 'playing' && !saveRef.current(next)) {
      setNotice('Chưa lưu được kết quả trận đấu. Trạng thái vẫn được giữ trên màn hình.');
    }
  }

  function saveBattle() {
    if (!saveRef.current(battleRef.current)) setNotice('Chưa lưu được trận đấu. Trạng thái tạm thời vẫn được giữ trên màn hình.');
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (/^[1-5]$/.test(key)) {
        event.preventDefault();
        hotkeyActions.current(key);
        return;
      }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const onBlur = () => keys.current.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      keys.current.clear();
    };
  }, []);

  useEffect(() => {
    if (battle.status !== 'playing') return;
    let frame = 0;
    const tick = (time: number) => {
      if (document.hidden) {
        lastFrame.current = time;
        frame = requestAnimationFrame(tick);
        return;
      }
      const delta = Math.min(.05, Math.max(0, (time - (lastFrame.current || time)) / 1000));
      lastFrame.current = time;
      const current = battleRef.current;
      if (current.status !== 'playing') return;
      let hero = { ...current.hero };
      const movement = keys.current;
      let dx = Number(movement.has('d') || movement.has('arrowright')) - Number(movement.has('a') || movement.has('arrowleft'));
      let dy = Number(movement.has('s') || movement.has('arrowdown')) - Number(movement.has('w') || movement.has('arrowup'));
      if (dashTarget.current) {
        const remaining = distance(hero, dashTarget.current);
        if (remaining < .06) dashTarget.current = null;
        else {
          const next = pointAlong(hero, dashTarget.current, 7.5 * delta);
          dx = next.x - hero.x;
          dy = next.y - hero.y;
          const magnitude = Math.hypot(dx, dy) || 1;
          hero = bridgePoint({ x: hero.x + dx / magnitude * 7.5 * delta, y: hero.y + dy / magnitude * 7.5 * delta });
        }
      } else if (dx || dy) {
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;
        const speed = talent === 'keen-senses' ? 2.35 : 2.05;
        hero = bridgePoint({ x: hero.x + dx * speed * delta, y: hero.y + dy * speed * delta });
      }
      const isWalking = distance(hero, current.hero) > .001;
      if (isWalking !== walking) setWalking(isWalking);
      if (isWalking) setFacing(Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up'));
      const now = time;
      let hp = current.hp;
      let mp = current.mp;
      let bossHp = current.bossHp;
      let log = current.log;
      let boss = { ...current.boss };
      let trap = current.trap;
      let bossPoisonTurns = current.bossPoisonTurns;
      let bleedTurns = current.bleedTurns;
      let armorTurns = current.armorTurns;
      let armorBreakBonus = current.armorBreakBonus;
      let rootTurns = now < rootedUntil.current ? current.rootTurns : 0;
      let bossSlowTurns = now < slowedUntil.current ? (current.bossSlowTurns ?? 0) : 0;
      let soldiers = current.soldiers.map(soldier => ({ ...soldier, position: { ...soldier.position } }));
      let activeBossCast = bossCastRef.current;
      let bossCastChanged = false;
      const receiveHit = (damage: number, source: string, reflectable = false) => {
        if (now < evasionUntil.current) return `${source} trượt hụt · Tiểu Mông né được đòn.`;
        if (now < guardUntil.current) {
          const blocked = Math.ceil(damage * .65);
          hp = Math.max(0, hp - (damage - blocked));
          if (guardReflectReady.current && reflectable && distance(hero, boss) <= 5) {
            const reflected = Math.round(damage * .5);
            bossHp = Math.max(0, bossHp - reflected);
            guardReflectReady.current = false;
            return `Mai Rùa chặn ${blocked} sát thương và phản ${reflected} sát thương về Trưởng Đội.`;
          }
          return `Mai Rùa chặn ${blocked} sát thương từ ${source}.`;
        }
        hp = Math.max(0, hp - damage);
        return `${source} trúng đòn · Tiểu Mông mất ${damage} HP.`;
      };

      if (!activeBossCast && bossHp > 0 && now >= nextBossSkillAt.current) {
        const skillId = BOSS_SKILL_CYCLE[bossSkillSequence.current % BOSS_SKILL_CYCLE.length];
        bossSkillSequence.current += 1;
        const enraged = bossHp <= INITIAL_BOSS_HP / 2;
        const impactAt = now + (enraged ? 720 : 980);
        activeBossCast = {
          id: bossSkillSequence.current,
          skill: skillId,
          origin: { ...boss },
          target: { ...hero },
          impactAt,
          expiresAt: impactAt + 420,
          resolved: false,
        };
        attackUntil.current.boss = impactAt + 260;
        bossCastRef.current = activeBossCast;
        nextBossSkillAt.current = impactAt + 800;
        bossCastChanged = true;
      }

      if (activeBossCast && !activeBossCast.resolved && now >= activeBossCast.impactAt) {
        const config = BOSS_SKILLS[activeBossCast.skill];
        const inRange = distance(activeBossCast.origin, activeBossCast.target) <= config.range;
        const radius = activeBossCast.skill === 'river-vortex' ? .82 : .62;
        const width = activeBossCast.skill === 'execution-cross' ? .24 : activeBossCast.skill === 'iron-gate-charge' ? .2 : .15;
        const hit = inRange && (config.kind === 'area'
          ? distance(hero, activeBossCast.target) <= radius
          : distanceToSegment(hero, activeBossCast.origin, activeBossCast.target) <= width);
        const damage = Math.round(config.damage * (current.bossHp <= INITIAL_BOSS_HP / 2 ? 1.3 : 1));
        if (hit) log = receiveHit(damage, config.name);
        else log = `Né được ${config.name} · đòn đánh trượt khỏi vùng nguy hiểm.`;
        if (hit && activeBossCast.skill === 'river-vortex' && now >= guardUntil.current) slowedUntil.current = now + 1800;
        activeBossCast = { ...activeBossCast, resolved: true };
        bossCastRef.current = activeBossCast;
        bossCastChanged = true;
      } else if (activeBossCast?.resolved && now >= activeBossCast.expiresAt) {
        activeBossCast = null;
        bossCastRef.current = null;
        bossCastChanged = true;
      }
      if (bossCastChanged) setBossCast(activeBossCast);

      const bossDistance = distance(boss, hero);
      const bossRooted = now < rootedUntil.current;
      const bossSlowed = now < slowedUntil.current;
      if (!bossRooted && bossHp > 0 && bossDistance > .8) {
        boss = bridgePoint(pointAlong(boss, hero, (bossSlowed ? .25 : current.bossHp <= INITIAL_BOSS_HP / 2 ? .82 : .62) * delta));
      } else if (!bossRooted && bossHp > 0 && bossDistance <= .8 && now >= (enemyAttackAt.current.boss ?? 0)) {
        const damage = Math.round((current.bossHp <= INITIAL_BOSS_HP / 2 ? 143 : 110) * (campaign.banditArmorUnlocked ? .8 : 1));
        log = receiveHit(damage, 'Trưởng Đội', true);
        enemyAttackAt.current.boss = now + (current.bossHp <= INITIAL_BOSS_HP / 2 ? 2100 : 2800);
        attackUntil.current.boss = now + 640;
        setClock(now);
      }
      soldiers = soldiers.map(soldier => {
        if (!isAlive(soldier) || (soldier.stunnedTurns ?? 0) > 0) return soldier;
        const range = distance(soldier.position, hero);
        if (range > .7) return { ...soldier, position: bridgePoint(pointAlong(soldier.position, hero, .48 * delta)) };
        const id = soldier.id;
        if (now >= (enemyAttackAt.current[id] ?? 0)) {
          enemyAttackAt.current[id] = now + 2400;
          attackUntil.current[id] = now + 620;
          setClock(now);
          const damage = Math.max(1, Math.round(45 * (campaign.banditArmorUnlocked ? .8 : 1)));
          log = receiveHit(damage, id === 'spear-1' ? 'Lính giáo thứ nhất' : 'Lính giáo thứ hai', true);
        }
        return soldier;
      });

      if (trap) {
        const armedTrap = trap;
        if (distance(boss, armedTrap) < .32 && bossHp > 0) {
          bossHp = Math.max(0, bossHp - 120);
          rootedUntil.current = now + 2400;
          rootTurns = 1;
          trap = null;
          log = 'Bẫy Tre Gai bật lên · Trưởng Đội chịu 120 sát thương xuyên giáp và bị khóa chân.';
        } else {
          const trapped = soldiers.find(soldier => isAlive(soldier) && distance(soldier.position, armedTrap) < .32);
          if (trapped) {
            soldiers = soldiers.map(soldier => soldier.id === trapped.id ? { ...soldier, hp: Math.max(0, soldier.hp - 120) } : soldier);
            soldiers = soldiers.map(soldier => soldier.id === trapped.id ? { ...soldier, stunnedTurns: 1 } : soldier);
            trap = null;
            log = 'Bẫy Tre Gai bật lên · lính giáo chịu 120 sát thương xuyên giáp và bị định thân.';
          }
        }
      }

      if (now - lastStatusTick.current > 2000) {
        lastStatusTick.current = now;
        if (bossPoisonTurns > 0) {
          bossHp = Math.max(0, bossHp - 20);
          bossPoisonTurns -= 1;
          log = 'Độc Thiểm Thư gây 20 sát thương độc duy trì.';
        }
        if (bleedTurns > 0) {
          hp = Math.max(0, hp - 15);
          bleedTurns -= 1;
          log = 'Xung Huyết gây mất 15 HP.';
        }
        if (armorTurns > 0) armorTurns -= 1;
        if (armorTurns === 0) armorBreakBonus = 0;
        soldiers = soldiers.map(soldier => ({ ...soldier, stunnedTurns: Math.max(0, (soldier.stunnedTurns ?? 0) - 1) }));
      }
      let turn = current.turn;
      if (time - lastTurnTick.current >= 5000) {
        turn += Math.floor((time - lastTurnTick.current) / 5000);
        lastTurnTick.current = time;
      }
      if (turn > current.turn && haBaEquipped && onBridge(hero) && now - lastRecoveryTick.current > 4500) {
        lastRecoveryTick.current = now;
        hp = Math.min(current.maxHp, hp + Math.ceil(current.maxHp * .03));
        mp = Math.min(current.maxMp, mp + Math.ceil(current.maxMp * .03));
        log = 'Hà Bá Tức Công hồi 3% HP và 3% MP khi vận hành bên sông.';
      }
      if (bossHp < current.bossHp || hp < current.hp || mp !== current.mp || turn > current.turn || hero.x !== current.hero.x || hero.y !== current.hero.y || boss.x !== current.boss.x || boss.y !== current.boss.y || trap !== current.trap || bossPoisonTurns !== current.bossPoisonTurns || bleedTurns !== current.bleedTurns || armorTurns !== current.armorTurns || rootTurns !== current.rootTurns || bossSlowTurns !== (current.bossSlowTurns ?? 0) || (now >= evasionUntil.current && current.evasionTurns > 0) || soldiers.some((soldier, index) => soldier.position.x !== current.soldiers[index].position.x || soldier.position.y !== current.soldiers[index].position.y || soldier.hp !== current.soldiers[index].hp || soldier.stunnedTurns !== current.soldiers[index].stunnedTurns)) {
        const next = finishStatus({
          ...current,
          hero,
          boss,
          soldiers,
          hp,
          bossHp,
          mp,
          trap,
          turn,
          armorTurns,
          armorBreakBonus,
          rootTurns,
          bossSlowTurns,
          bossPoisonTurns,
          bleedTurns,
          evasionTurns: now >= evasionUntil.current ? 0 : current.evasionTurns,
          log,
        });
        battleRef.current = next;
        if (current.status === 'playing' && next.status !== 'playing' && !saveRef.current(next)) {
          setNotice('Chưa lưu được kết quả trận đấu. Trạng thái vẫn được giữ trên màn hình.');
        }
        if (time - lastRender.current > 45 || next.status !== 'playing') {
          lastRender.current = time;
          setBattle(next);
        }
      }
      if (time - lastSave.current > 600) {
        lastSave.current = time;
        saveBattle();
      }
      if (time - lastRender.current > 180) setClock(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [battle.status, campaign.banditArmorUnlocked, haBaEquipped, talent, walking]);

  function schedule(delay: number, callback: () => void) {
    const timer = window.setTimeout(() => {
      timers.current = timers.current.filter(active => active !== timer);
      callback();
    }, delay);
    timers.current.push(timer);
  }

  function animateSkill(kind: AnimationKind, target: RiverBattlePoint, resolve: () => void) {
    const duration = { ...DURATIONS[kind] };
    if (reducedEffects) {
      duration.prepare *= .6;
      duration.travel *= .6;
      duration.impact *= .6;
    }
    const animation: SkillAnimation = { id: ++animationId.current, kind, phase: 'prepare', from: { ...battleRef.current.hero }, to: target };
    setSkillAnimation(animation);
    setAimMode(null);
    setAimPoint(null);
    setNotice('');
    schedule(duration.prepare, () => setSkillAnimation({ ...animation, phase: 'travel' }));
    schedule(duration.prepare + duration.travel, () => {
      setSkillAnimation({ ...animation, phase: 'impact' });
      resolve();
      schedule(duration.impact, () => setSkillAnimation(null));
    });
  }

  function startCooldown(id: CooldownId, milliseconds: number) {
    cooldowns.current[id] = performance.now() + milliseconds;
    setClock(performance.now());
  }

  function beginAim(mode: AimMode, cooldown: CooldownId, cost: number) {
    const state = battleRef.current;
    if (state.status !== 'playing' || skillAnimation) return;
    if (state.mp < cost) { setNotice(`Không đủ MP để dùng chiêu này · cần ${cost} MP.`); return; }
    if ((cooldowns.current[cooldown] ?? 0) > performance.now()) { setNotice('Chiêu đang hồi, hãy đợi một lát.'); return; }
    setAimMode(mode);
    setAimPoint(null);
    setNotice(mode === 'attack' ? 'Nhấp mục tiêu trong tầm cận chiến để đánh.' : 'Nhấp mặt đất hoặc mục tiêu để ngắm chiêu.');
    stage.current?.focus();
  }

  function handleStageMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setAimPoint({
      x: clamp(event.clientX < rect.left ? 0 : (event.clientX - rect.left) / rect.width * 6 - .5, 0, 5.999),
      y: clamp((event.clientY - rect.top) / rect.height * 6 - .5, 0, 5.999),
    });
  }

  function handleStageClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!aimMode || skillAnimation) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const target = {
      x: clamp((event.clientX - rect.left) / rect.width * 6 - .5, 0, 5.999),
      y: clamp((event.clientY - rect.top) / rect.height * 6 - .5, 0, 5.999),
    };
    if (!onBridge(target)) { setNotice('Chỉ có thể di chuyển và tung chiêu trên mặt cầu.'); return; }
    const state = battleRef.current;
    const bossHit = state.bossHp > 0 && distance(target, state.boss) < .8;
    const soldier = state.soldiers.find(unit => isAlive(unit) && distance(target, unit.position) < .8);
    if (aimMode === 'attack') {
      if (!bossHit && !soldier) { setNotice('Nhấp gần kẻ địch hơn để đánh thường.'); return; }
      if (distance(state.hero, bossHit ? state.boss : soldier!.position) > .95) { setNotice('Mục tiêu còn ngoài tầm cận chiến · chạy lại gần trước.'); return; }
      if ((cooldowns.current.attack ?? 0) > performance.now()) { setNotice('Đòn đánh thường đang hồi.'); return; }
      startCooldown('attack', 650);
      attackUntil.current.hero = performance.now() + 520;
      setClock(performance.now());
      const damage = damageForTerrain(state, talent, 100, true, campaign.daggerForged, campaign.weaponUpgradeLevel);
      const poisonHit = bossHit && campaign.daggerPoisoned && !state.poisonUsed;
      const targetPoint = bossHit ? state.boss : soldier!.position;
      const resolve = () => updateBattle(current => bossHit
        ? { ...current, bossHp: Math.max(0, current.bossHp - damage), bossPoisonTurns: poisonHit ? 3 : current.bossPoisonTurns, poisonUsed: current.poisonUsed || poisonHit, nextCritical: false, log: `Đòn đánh thường gây ${damage} sát thương${poisonHit ? ' · Độc Thiểm Thư đã phát huy' : ''}.` }
        : { ...current, soldiers: current.soldiers.map(unit => unit.id === soldier!.id ? { ...unit, hp: Math.max(0, unit.hp - damage) } : unit), nextCritical: false, log: `Đòn đánh thường gây ${damage} sát thương lên lính giáo.` });
      setAimMode(null);
      setAimPoint(null);
      setNotice('');
      updateBattle(current => ({ ...current, log: 'Tiểu Mông vung đòn áp sát…' }));
      schedule(160, resolve);
      return;
    }
    if (aimMode === 'water-dart') {
      if (!bossHit || distance(state.hero, state.boss) > 6) { setNotice('Chọn Trưởng Đội trong tầm 6 ô để phóng Cá Cóc Phún Thủy.'); return; }
      startCooldown('water-dart', 1800);
      animateSkill('water-dart', state.boss, () => {
        const damage = damageForTerrain(battleRef.current, talent, 100);
        updateBattle(current => ({ ...current, bossHp: Math.max(0, current.bossHp - damage), mp: current.mp - 40, armorTurns: 3, armorBreakBonus: 30, log: `Cá Cóc Phún Thủy gây ${damage} sát thương Thủy, phá 30% giáp trong 3 lượt.` }));
      });
      return;
    }
    if (aimMode === 'crossbow') {
      if (!campaign.crossbowUnlocked) { setNotice('Hãy hoàn thành buổi câu cá đầu tiên với Tảo để nhận Nỏ Cóc.'); return; }
      if (!bossHit || distance(state.hero, state.boss) > 2) { setNotice('Nỏ Cóc Liên Châu chỉ bắn trúng mục tiêu trong 2 ô.'); return; }
      startCooldown('crossbow', 2400);
      animateSkill('water-dart', state.boss, () => updateBattle(current => {
        const damage = damageForTerrain(current, talent, 240);
        return { ...current, bossHp: Math.max(0, current.bossHp - damage), mp: current.mp - 30, log: `Nỏ Cóc Liên Châu bắn 3 phát · gây ${damage} sát thương.` };
      }));
      return;
    }
    if (aimMode === 'ox-bash') {
      if (!campaign.inventory.SKILL_DA_NGUU_BAI_TUONG) { setNotice('Hãy hoàn thành nhiệm vụ ẩn của Hạc Lão để học Đả Ngưu Bái Tướng.'); return; }
      if (!bossHit || distance(state.hero, state.boss) > 1.1) { setNotice('Đả Ngưu Bái Tướng cần đứng gần Trưởng Đội.'); return; }
      startCooldown('ox-bash', 2000);
      animateSkill('otter-dash', state.boss, () => updateBattle(current => {
        const damage = damageForTerrain(current, talent, 220, true, campaign.daggerForged, campaign.weaponUpgradeLevel);
        return { ...current, bossHp: Math.max(0, current.bossHp - damage), mp: current.mp - 40, nextCritical: false, log: `Đả Ngưu Bái Tướng gây ${damage} sát thương.` };
      }));
      return;
    }
    if (aimMode === 'whirlpool') {
      if (distance(state.hero, target) > 8) { setNotice('Tâm xoáy nằm ngoài tầm 8 ô.'); return; }
      const hitsBoss = state.bossHp > 0 && distance(state.boss, target) <= 2;
      const affected = state.soldiers.filter(unit => isAlive(unit) && distance(unit.position, target) <= 2);
      if (!hitsBoss && affected.length === 0) { setNotice('Vùng xoáy cần bao phủ ít nhất một kẻ địch.'); return; }
      startCooldown('whirlpool', 8000);
      animateSkill('whirlpool', target, () => updateBattle(current => {
        const damage = damageForTerrain(current, talent, 110, false, campaign.daggerForged, campaign.weaponUpgradeLevel);
        const pulledSoldiers = current.soldiers.map(unit => affected.some(item => item.id === unit.id)
          ? { ...unit, position: pointAlong(unit.position, target, Math.max(0, distance(unit.position, target) - 1)), stunnedTurns: 1 }
          : unit);
        slowedUntil.current = performance.now() + 3500;
        return {
          ...current,
          bossHp: hitsBoss ? Math.max(0, current.bossHp - damage) : current.bossHp,
          bossSlowTurns: hitsBoss ? 1 : current.bossSlowTurns,
          soldiers: pulledSoldiers,
          mp: current.mp - 30,
          log: `Hà Bá Cuộn Lưu gây ${damage} sát thương · kéo địch thường về tâm và làm chậm Trưởng Đội.`,
        };
      }));
      return;
    }
    if (aimMode === 'trap') {
      if (distance(state.hero, target) > 5) { setNotice('Bẫy Tre Gai chỉ đặt được trong phạm vi 5 ô.'); return; }
      if (campaign.oldBamboo <= state.bambooUsed) { setNotice('Không còn Thân Tre Già để đặt bẫy.'); return; }
      startCooldown('bamboo-trap', 5500);
      const ingenious = talent === 'ingenious-trapper';
      animateSkill('bamboo-trap', target, () => updateBattle(current => ({
        ...current,
        trap: target,
        bambooUsed: current.bambooUsed + 1,
        mp: current.mp - 50 + (ingenious ? 30 : 0),
        nextCritical: ingenious || current.nextCritical,
        log: `Đặt Bẫy Tre Gai tại ${Math.round(target.x + 1)}, ${Math.round(target.y + 1)} · chờ địch giẫm phải.`,
      })));
    }
  }

  function useOtterDash() {
    const state = battleRef.current;
    if (state.status !== 'playing' || state.mp < 50) { setNotice('Rái Cá Quần Thủy cần 50 MP.'); return; }
    if ((cooldowns.current['otter-dash'] ?? 0) > performance.now()) { setNotice('Rái Cá Quần Thủy đang hồi.'); return; }
    if (distance(state.hero, state.boss) > 5) { setNotice('Cần áp sát trong 5 ô để lướt vòng qua mục tiêu.'); return; }
    const dx = state.hero.x - state.boss.x;
    const dy = state.hero.y - state.boss.y;
    const length = Math.hypot(dx, dy) || 1;
    const target = bridgePoint({ x: state.boss.x + dx / length * 1.15, y: state.boss.y + dy / length * 1.15 });
    startCooldown('otter-dash', 5000);
    dashTarget.current = target;
    evasionUntil.current = performance.now() + 1400;
    animateSkill('otter-dash', target, () => updateBattle(current => ({
      ...current,
      mp: current.mp - 50,
      evasionTurns: 1,
      nextCritical: true,
      log: 'Rái Cá Quần Thủy lướt vòng ra sau lưng, né đòn và chuẩn bị đòn kế tiếp chí mạng.',
    })));
  }

  function useTurtleGuard() {
    const state = battleRef.current;
    if (state.status !== 'playing' || state.mp < 16) { setNotice('Rùa Đầm Lầy Thủ cần 16 MP.'); return; }
    if ((cooldowns.current['turtle-guard'] ?? 0) > performance.now()) { setNotice('Rùa Đầm Lầy Thủ đang hồi.'); return; }
    startCooldown('turtle-guard', 7000);
    animateSkill('turtle-guard', state.hero, () => {
      guardUntil.current = performance.now() + 5000;
      guardReflectReady.current = true;
      updateBattle(current => ({ ...current, mp: current.mp - 16, log: 'Rùa Đầm Lầy Thủ dựng mai nước · chặn 65% sát thương và phản đòn cận chiến đầu tiên.' }));
    });
  }

  function useCombatSkill(skillId: string) {
    if (skillId === 'ca-coc-phon-thuy') beginAim('water-dart', 'water-dart', 40);
    else if (skillId === 'rai-ca-quan-thuy') useOtterDash();
    else if (skillId === 'rua-dam-lay-thu') useTurtleGuard();
    else if (skillId === 'bay-tre-gai') beginAim('trap', 'bamboo-trap', 50);
    else setNotice('Chiêu thức chưa được cấu hình trong trận này.');
  }

  function percent(point: RiverBattlePoint) {
    return { left: `${(point.x + .5) / 6 * 100}%`, top: `${(point.y + .5) / 6 * 100}%`, zIndex: Math.round(point.y * 10) + 2 };
  }

  function cooldownText(id: CooldownId) {
    const remaining = Math.max(0, Math.ceil(((cooldowns.current[id] ?? 0) - clock) / 1000));
    return remaining ? ` · ${remaining}s` : '';
  }

  hotkeyActions.current = key => {
    if (key === '1') useCombatSkill(loadout.combatSkillIds[0]);
    else if (key === '2') useCombatSkill(loadout.combatSkillIds[1]);
    else if (key === '3') useCombatSkill(loadout.combatSkillIds[2]);
    else if (key === '4') beginAim('attack', 'attack', 0);
    else if (key === '5') beginAim('whirlpool', 'whirlpool', 30);
  };

  const hpPercent = battle.hp / battle.maxHp * 100;
  const mpPercent = battle.mp / battle.maxMp * 100;
  const bossHpPercent = battle.bossHp / INITIAL_BOSS_HP * 100;
  const bossWalking = battle.bossHp > 0 && distance(battle.boss, battle.hero) > .8 && battle.rootTurns === 0;
  const facingTarget = (from: RiverBattlePoint, to: RiverBattlePoint): Facing => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up');
  };
  const aimRadius = aimMode === 'whirlpool' ? '66.67%' : aimMode === 'water-dart' ? '66.67%' : '20%';
  const heroAttacking = clock < (attackUntil.current.hero ?? 0);
  const bossAttacking = battle.bossHp > 0 && (
    Boolean(bossCast && !bossCast.resolved) || clock < (attackUntil.current.boss ?? 0)
  );
  const heroSpeech = battle.status === 'won' ? 'Đầu hàng đi, đừng làm hại dân làng!'
    : battle.status === 'lost' ? 'Ta… không thể gục ngã…'
      : battle.hp / battle.maxHp > .5 ? 'Ta sẽ phá vòng vây!'
        : battle.hp / battle.maxHp > .25 ? 'Chưa thể dừng bước!'
          : 'Chỉ còn một đòn nữa…';
  const bossSpeech = battle.status === 'won' ? 'Ta đã bại… xin hãy tha cho thuộc hạ.'
    : battle.status === 'lost' ? 'Bỏ vũ khí xuống! Chốt Chặn vẫn là của ta!'
      : battle.bossHp / INITIAL_BOSS_HP > .5 ? 'Qua cầu này, đừng hòng!'
        : battle.bossHp / INITIAL_BOSS_HP > .25 ? 'Ngươi khá lắm, nhưng chưa xong đâu!'
          : 'Đội tuần tra… lui lại!';

  return <section className="river-battle river-battle--realtime" aria-label="Trận chiến Chốt Chặn">
    <header className="river-battle__header">
      <div><span className="sv-kicker">MINI-BOSS · CHỐT CHẶN</span><h1>Đột Phá Vòng Vây</h1><p>Đấu trường hành động 2D · di chuyển tự do · {talent === 'forest-and-tide' ? 'Sơn Lâm Thợ Săn +25% sát thương trên sông' : 'WASD / phím mũi tên để di chuyển'}</p></div>
      <button type="button" className="river-battle__back" disabled={battle.status === 'won'} onClick={() => onRetreat({ hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>Rút khỏi trận</button>
    </header>
    <div className="river-battle__layout">
      <div
        ref={stage}
        className={`river-battle__board river-battle__arena${skillAnimation?.kind === 'whirlpool' ? ' is-whirlpooling' : ''}${aimMode ? ' is-aiming' : ''}`}
        role="application"
        aria-label="Đấu trường thời gian thực. Dùng WASD hoặc phím mũi tên để di chuyển; chuột để ngắm và thi triển."
        tabIndex={0}
        onPointerMove={handleStageMove}
        onClick={handleStageClick}
        onPointerDown={() => stage.current?.focus()}
      >
        <div className="river-battle__map-art">
          <picture>
            <source media="(max-width: 700px) and (orientation: portrait)" srcSet="/assets/maps/chot-chan-river-checkpoint-mobile.svg" />
            <img
              src="/assets/maps/chot-chan-river-checkpoint.svg"
              alt="Góc nhìn từ mũi thuyền trên sông Mê Linh, tiến về hàng cọc chắn và tháp canh giữa rặng tre trong sương sớm."
              draggable={false}
            />
          </picture>
        </div>
        <div className="river-battle__floor" aria-hidden="true">
          {Array.from({ length: 36 }, (_, index) => <span key={index} className={index % 6 === 4 ? 'is-river' : ''} />)}
        </div>
        <div className="river-battle__bridge" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className="river-battle__river-glint" aria-hidden="true" />
        <div className="river-battle__map-label" aria-hidden="true"><span>CHỐT CHẶN</span><i /> <span>BẾN SÔNG</span></div>
        {bossCast && <div className={`river-battle__boss-cast is-${BOSS_SKILLS[bossCast.skill].kind}${bossCast.resolved ? ' is-impact' : ''} is-${bossCast.skill}`} key={bossCast.id} aria-label={`Trưởng Đội thi triển ${BOSS_SKILLS[bossCast.skill].name}`}>
          {BOSS_SKILLS[bossCast.skill].kind === 'area' ? <span className="river-battle__boss-warning river-battle__boss-warning--area" style={{
            left: `${(bossCast.target.x + .5) / 6 * 100}%`,
            top: `${(bossCast.target.y + .5) / 6 * 100}%`,
            width: `${(bossCast.skill === 'river-vortex' ? 1.64 : 1.24) / 6 * 100}%`,
          }} /> : <span className={`river-battle__boss-warning river-battle__boss-warning--line${bossCast.skill === 'execution-cross' ? ' is-cross' : ''}`} style={{
            left: `${(bossCast.origin.x + bossCast.target.x + 1) / 12 * 100}%`,
            top: `${(bossCast.origin.y + bossCast.target.y + 1) / 12 * 100}%`,
            width: `${Math.max(3, distance(bossCast.origin, bossCast.target)) / 6 * 100}%`,
            transform: `translate(-50%, -50%) rotate(${Math.atan2(bossCast.target.y - bossCast.origin.y, bossCast.target.x - bossCast.origin.x)}rad)`,
          }} />}
          <strong style={percent(bossCast.target)}>{BOSS_SKILLS[bossCast.skill].name} · {bossCast.resolved ? 'trúng!' : 'né vùng đỏ!'}</strong>
        </div>}
        {battle.trap && <span className="river-battle__trap" style={percent(battle.trap)} aria-label="Bẫy tre đã đặt"><SkillIcon skill="bay-tre-gai" /></span>}
        {aimMode && aimPoint && <div className={`river-battle__aim${aimMode === 'whirlpool' ? ' is-area' : ''}`} style={{ ...percent(aimPoint), width: aimRadius, height: aimRadius }} aria-hidden="true" />}
        {aimMode && aimPoint && <svg className="river-battle__aim-path" viewBox="0 0 600 600" aria-hidden="true">
          <path d={`M ${(battle.hero.x + .5) * 100} ${(battle.hero.y + .5) * 100} Q ${(battle.hero.x + aimPoint.x + 1) * 50} ${(battle.hero.y + aimPoint.y + .5) * 50} ${(aimPoint.x + .5) * 100} ${(aimPoint.y + .5) * 100}`} />
        </svg>}
        <span className={`river-battle__actor river-battle__actor--hero${walking ? ' is-walking' : ''}${heroAttacking ? ' is-attacking' : ''}`} style={percent(battle.hero)} aria-label={`Tiểu Mông · ${battle.hp} HP`}>
          <i className="river-battle__actor-shadow" />
          <span className="river-battle__speech">{heroSpeech}</span>
          <span className="river-battle__actor-vitals" aria-hidden="true">
            <span className="river-battle__actor-vital-row"><i><b style={{ width: `${hpPercent}%` }} /></i><small>{battle.hp}</small></span>
            <span className="river-battle__actor-vital-row is-mana"><i><b style={{ width: `${mpPercent}%` }} /></i><small>{battle.mp}</small></span>
          </span>
          <CharacterSprite appearance={PLAYER_APPEARANCE} customization={PLAYER_CUSTOMIZATION} startingCharacter={PLAYER.id} walking={walking} facing={facing} spriteAction={heroAttacking ? 'attack' : undefined} spritePlaying={heroAttacking ? true : undefined} spritePlaybackIntervalMultiplier={heroAttacking ? .4 : undefined} className="river-battle__sprite" />
          <small>Tiểu Mông</small>
        </span>
        {(battle.bossHp > 0 || battle.status === 'won') && <span className={`river-battle__actor river-battle__actor--boss${battle.bossHp <= INITIAL_BOSS_HP / 2 ? ' is-enraged' : ''}${battle.status === 'won' ? ' is-defeated' : ''}${bossAttacking ? ' is-attacking' : ''}`} style={percent(battle.boss)} aria-label={`Trưởng Đội · ${battle.bossHp} HP`}>
          <i className="river-battle__actor-shadow" />
          <span className="river-battle__speech">{bossSpeech}</span>
          <span className="river-battle__actor-vitals is-enemy" aria-hidden="true"><span className="river-battle__actor-vital-row"><i><b style={{ width: `${bossHpPercent}%` }} /></i><small>{battle.bossHp}</small></span></span>
          <OpeningMapNpcArtwork npcId={gateGuard.id} appearance={gateGuard.appearance} design={gateGuard.design} artwork={gateGuard.artwork} pose="order" facing={facingTarget(battle.boss, battle.hero)} action={bossAttacking ? 'npc-morning' : bossWalking ? 'walk' : 'idle'} playing={bossAttacking || bossWalking} className="river-battle__sprite" /><small>Trưởng Đội{battle.bossHp <= INITIAL_BOSS_HP / 2 ? ' · Cuồng nộ' : ''}</small>
        </span>}
        {battle.soldiers.filter(soldier => isAlive(soldier) || battle.status !== 'playing').map(soldier => {
          const npc = soldier.id === 'spear-1' ? patrolArcher : patrolSwordsman;
          const soldierWalking = distance(soldier.position, battle.hero) > .7 && (soldier.stunnedTurns ?? 0) === 0;
          const soldierAttacking = clock < (attackUntil.current[soldier.id] ?? 0);
          const soldierSpeech = battle.status === 'won' ? 'Chúng tôi xin đầu hàng!'
            : battle.status === 'lost' ? 'Trưởng đội đã thắng!'
              : soldier.hp / 200 > .5 ? 'Giữ vững cây cầu!'
                : soldier.hp / 200 > .25 ? 'Không được lùi bước!'
                  : 'Cung thủ, yểm trợ ta!';
          return <span key={soldier.id} className={`river-battle__actor river-battle__actor--soldier${(soldier.stunnedTurns ?? 0) > 0 ? ' is-stunned' : ''}${soldierAttacking ? ' is-attacking' : ''}${!isAlive(soldier) ? ' is-defeated' : ''}`} style={percent(soldier.position)} aria-label={`${npc.name} · ${soldier.hp} HP`}>
            <i className="river-battle__actor-shadow" />
            <span className="river-battle__speech">{soldierSpeech}</span>
            <span className="river-battle__actor-vitals is-enemy" aria-hidden="true"><span className="river-battle__actor-vital-row"><i><b style={{ width: `${soldier.hp / 200 * 100}%` }} /></i><small>{soldier.hp}</small></span></span>
            <OpeningMapNpcArtwork npcId={npc.id} appearance={npc.appearance} design={npc.design} artwork={npc.artwork} pose="order" facing={facingTarget(soldier.position, battle.hero)} action={soldierAttacking ? 'npc-morning' : soldierWalking ? 'walk' : 'idle'} playing={soldierAttacking || soldierWalking} className="river-battle__sprite" /><small>{soldier.hp} HP</small>
          </span>;
        })}
        {skillAnimation && <SkillVFXCanvas effect={{
          id: skillAnimation.id,
          skill: VFX_SKILL[skillAnimation.kind],
          phase: skillAnimation.phase,
          from: skillAnimation.from,
          to: skillAnimation.to,
        }} reducedQuality={reducedEffects} />}
        <nav className="river-battle__skill-dock" aria-label="Thanh võ công trong trận">
          {loadout.combatSkillIds.map((id, index) => {
            const equipped = HERO_SKILL_TREE.find(skill => skill.id === id)!;
            const cooldownId: CooldownId = id === 'ca-coc-phon-thuy' ? 'water-dart' : id === 'rai-ca-quan-thuy' ? 'otter-dash' : id === 'rua-dam-lay-thu' ? 'turtle-guard' : 'bamboo-trap';
            const cost = id === 'ca-coc-phon-thuy' ? 40 : id === 'rai-ca-quan-thuy' ? 50 : id === 'rua-dam-lay-thu' ? 16 : 50;
            return <button key={id} type="button" className="river-battle__skill-button" aria-label={`${index + 1} ${equipped.name} · ${cost} MP${cooldownText(cooldownId)}`} title={`${equipped.name}\n${equipped.action}\n${equipped.effect}`} disabled={battle.status !== 'playing' || Boolean(skillAnimation)} onClick={event => { event.stopPropagation(); useCombatSkill(id); }}>
              <kbd>{index + 1}</kbd><SkillIcon skill={id as SkillVfxSkill} /><span>{equipped.name}</span>
            </button>;
          })}
          <button type="button" className="river-battle__skill-button" aria-label={`4 Đánh thường${cooldownText('attack')}`} title="Đánh thường\nTấn công cơ bản bằng vũ khí." disabled={battle.status !== 'playing' || Boolean(skillAnimation)} onClick={event => { event.stopPropagation(); beginAim('attack', 'attack', 0); }}>
            <kbd>4</kbd><svg className="river-battle__skill-basic" viewBox="0 0 32 32" aria-hidden="true"><path d="m22 4 6 6-14 14-6-6L22 4Zm-5 3 6 6M8 18l6 6m-2 2 3 3m-7-7-4 4 3 3 4-4" /></svg><span>Đánh thường</span>
          </button>
          <button type="button" className="river-battle__skill-button is-ultimate" aria-label={`5 Hà Bá Cuộn Lưu · 30 MP${cooldownText('whirlpool')}`} title="Hà Bá Cuộn Lưu\nXoáy nước kéo địch và khiến chúng mất lượt kế tiếp." disabled={battle.status !== 'playing' || battle.mp < 30 || Boolean(skillAnimation)} onClick={event => { event.stopPropagation(); beginAim('whirlpool', 'whirlpool', 30); }}>
            <kbd>5</kbd><SkillIcon skill="ha-ba-cuon-luu" /><span>Tuyệt kỹ</span>
          </button>
          <section className="river-battle__meditation" aria-label="Tâm pháp đang sử dụng" title={`${HERO_SKILL_TREE.find(skill => skill.id === loadout.meditationId)?.name ?? 'Chưa lĩnh hội'}\n${HERO_SKILL_TREE.find(skill => skill.id === loadout.meditationId)?.action ?? ''}\n${HERO_SKILL_TREE.find(skill => skill.id === loadout.meditationId)?.effect ?? ''}`}>
            <span className="river-battle__meditation-orb" aria-hidden="true">✦</span>
            <span className="river-battle__meditation-kicker">TÂM PHÁP</span>
            <strong>{HERO_SKILL_TREE.find(skill => skill.id === loadout.meditationId)?.name ?? 'Chưa lĩnh hội'}</strong>
            <small>{haBaEquipped ? 'Hà Bá Tức Công' : 'Nội lực bị động'}</small>
          </section>
          <span className="river-battle__resource-tile is-health" title={`Bình máu: ${campaign.healthPotionCount ?? 0}`}><b>♥</b><small>Máu</small><strong>{campaign.healthPotionCount ?? 0}</strong></span>
          <span className="river-battle__resource-tile is-mana" title="Bình mana: 0"><b>✦</b><small>Mana</small><strong>0</strong></span>
        </nav>
      </div>
    </div>
    {battle.status === 'won' && <section className="river-battle__outcome" aria-label={endingStep < 3 ? 'Đối thoại cuối trận' : 'Chọn kết cục'}>
      {endingStep < 3 ? <>
        <span className="sv-kicker">ĐỐI THOẠI CUỐI TRẬN · {endingStep === 1 ? 'TIỂU MÔNG' : 'TRƯỞNG ĐỘI'}</span>
        <h2>{endingStep === 0 ? 'Trưởng Đội hạ vũ khí' : endingStep === 1 ? 'Tiểu Mông đối mặt Trưởng Đội' : 'Lời khẩn cầu cuối cùng'}</h2>
        <p>{[
          'Ta đã bại… xin hãy tha cho thuộc hạ. Họ chỉ làm theo lệnh.',
          'Hạ vũ khí và mở cầu. Ta sẽ không để dân làng phải chịu thêm.',
          'Ta sẽ mở chốt ngay. Xin đừng trút giận lên những người lính này.',
        ][endingStep]}</p>
        <button type="button" onClick={() => setEndingStep(step => step + 1)}>{endingStep === 2 ? 'Chọn hành động' : 'Tiếp tục đối thoại'}</button>
      </> : <>
        <h2>Chọn hành động của Tiểu Mông</h2>
        <p>Trưởng Đội đã bị đánh bại. Quyết định số phận của hắn và đội tuần tra.</p>
        <button type="button" onClick={() => onVictory('righteous', { hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>Tha mạng, buộc mở chốt · Chính đạo · Đạo Đức +20 · Mê Linh Hiệp Sĩ</button>
        <button type="button" onClick={() => onVictory('shadow', { hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>Kết liễu và lấy chiến lợi phẩm · Tà đạo · +200 Văn tiền · U Minh Sát Thủ</button>
      </>}
    </section>}
    {battle.status === 'lost' && <section className="river-battle__outcome" aria-label="Thất bại">
      <h2>Tiểu Mông kiệt sức</h2><p>Trận có thể thử lại; tài nguyên vào Chốt Chặn không được hoàn lại.</p>
      <button type="button" onClick={() => onRetreat({ hp: battle.hp, mp: battle.mp, bambooUsed: battle.bambooUsed })}>Rút lui và hồi sức</button>
    </section>}
  </section>;
}
