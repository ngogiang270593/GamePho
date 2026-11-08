import { useEffect, useRef, useState } from 'react';
import type { Facing } from '../game/character';
import { HERO_SKILL_TREE } from '../game/heroSkills';
import {
  DEFAULT_HERO_SKILL_LOADOUT,
  MEDITATION_SKILLS,
  SELECTABLE_COMBAT_SKILLS,
  ULTIMATE_SKILL_ID,
  loadHeroSkillLoadout,
  saveHeroSkillLoadout,
  type HeroSkillLoadout,
} from '../game/heroSkillLoadout';
import { startingCharacterInventory } from '../game/characterInventory';
import { STARTING_CHARACTERS, startingCharacterAppearance } from '../game/startingCharacters';
import { freshRiverBattleSnapshot, freshRiverCampaign, type RiverCampaignState, type RiverPath } from '../game/riverCampaign';
import { RealtimeMelinCheckpointBattle } from './RealtimeMelinCheckpointBattle';
import { CharacterSprite } from './CharacterSprite';
import { SkillIcon } from './SkillIcon';
import { SkillVFXCanvas } from './SkillVFXCanvas';
import type { SkillVfxEffect, SkillVfxSkill } from '../game/skillVfx';

const BOARD_SIZE = 6;
const INITIAL_POST_HP = 1500;
const PRACTICE_STORAGE_KEY = 'gamepho-skill-practice-post-v1';
const STARTING_HERO = { x: .5, y: 2.5 };
const WOODEN_POST = { x: 4.5, y: 2.5 };
const PRACTICE_CHARACTER = STARTING_CHARACTERS[0];
const PRACTICE_APPEARANCE = startingCharacterAppearance(PRACTICE_CHARACTER.id, 'male');
const PRACTICE_CUSTOMIZATION = startingCharacterInventory(PRACTICE_APPEARANCE, PRACTICE_CHARACTER);

function freshCheckpointPractice() {
  const campaign = {
    ...freshRiverCampaign(),
    bossStarted: true,
    trapRecipe: true,
    oldBamboo: 3,
    knowsDaoManual: true,
    haBaEquipped: true,
  };
  return { ...campaign, battle: freshRiverBattleSnapshot(campaign) };
}

const PRACTICE_STATS: Record<string, { range: number; damage: number }> = {
  'ha-ba-tuc-cong': { range: 0, damage: 0 },
  'ca-coc-phon-thuy': { range: 6, damage: 100 },
  'rai-ca-quan-thuy': { range: 5, damage: 310 },
  'rua-dam-lay-thu': { range: 5, damage: 80 },
  'ha-ba-cuon-luu': { range: 8, damage: 110 },
  'bay-tre-gai': { range: 5, damage: 120 },
  'basic-attack': { range: 1, damage: 45 },
};
const BASIC_ATTACK = { id: 'basic-attack', name: 'Đánh thường', effect: 'Đòn đánh cơ bản, không tiêu hao nội lực.' };

type Point = { x: number; y: number };
type CastPhase = 'prepare' | 'travel' | 'impact';

function distance(from: Point, to: Point) {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

function loadPracticePostHp() {
  const savedHp = window.sessionStorage.getItem(PRACTICE_STORAGE_KEY);
  if (savedHp === null) return INITIAL_POST_HP;
  const hp = Number(savedHp);
  if (!Number.isInteger(hp) || hp < 0 || hp > INITIAL_POST_HP) {
    throw new Error('Dữ liệu HP cọc tập không hợp lệ trong sessionStorage.');
  }
  return hp;
}

export function HeroSkillPlayground() {
  const [hero, setHero] = useState<Point>(STARTING_HERO);
  const [selectedSkillId, setSelectedSkillId] = useState(DEFAULT_HERO_SKILL_LOADOUT.combatSkillIds[0]);
  const [loadout, setLoadout] = useState<HeroSkillLoadout>(loadHeroSkillLoadout);
  const [setupStep, setSetupStep] = useState<'encounter' | 'loadout' | 'battle' | 'practice' | 'result'>('encounter');
  const [encounterSelected, setEncounterSelected] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [battleCampaign, setBattleCampaign] = useState<RiverCampaignState>(freshCheckpointPractice);
  const [battleResult, setBattleResult] = useState('');
  const [postHp, setPostHp] = useState(loadPracticePostHp);
  const [castPhase, setCastPhase] = useState<CastPhase | null>(null);
  const [activeEffect, setActiveEffect] = useState<Omit<SkillVfxEffect, 'phase'> | null>(null);
  const [reducedEffects, setReducedEffects] = useState(false);
  const [log, setLog] = useState('Dùng WASD hoặc phím mũi tên để di chuyển; rê chuột và nhấp vào cọc để thi triển.');
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [aimPoint, setAimPoint] = useState<Point | null>(null);
  const [facing, setFacing] = useState<Facing>('right');
  const [walking, setWalking] = useState(false);
  const castId = useRef(0);
  const timers = useRef<number[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const heroRef = useRef(hero);
  const castPhaseRef = useRef(castPhase);
  const keys = useRef(new Set<string>());
  const selectedSkillIdRef = useRef(selectedSkillId);
  const loadoutRef = useRef(loadout);
  const setupStepRef = useRef(setupStep);
  heroRef.current = hero;
  castPhaseRef.current = castPhase;
  selectedSkillIdRef.current = selectedSkillId;
  loadoutRef.current = loadout;
  setupStepRef.current = setupStep;

  useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
  }, []);
  useEffect(() => {
    let frame = 0;
    let previousTime = 0;
    let lastUpdate = 0;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (setupStepRef.current === 'practice' && /^[1-5]$/.test(key) && !castPhaseRef.current) {
        event.preventDefault();
        const slot = Number(key);
        const equipped = loadoutRef.current.combatSkillIds;
        if (slot <= 3) castSkill(equipped[slot - 1]);
        else if (slot === 4) castSkill('basic-attack');
        else castSkill(ULTIMATE_SKILL_ID);
        return;
      }
      if (setupStepRef.current === 'practice' && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
        setWalking(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase());
      if (keys.current.size === 0) setWalking(false);
    };
    const onBlur = () => {
      keys.current.clear();
      setWalking(false);
    };
    const tick = (time: number) => {
      const delta = Math.min(.05, Math.max(0, (time - (previousTime || time)) / 1000));
      previousTime = time;
      const direction = keys.current;
      if (setupStepRef.current === 'practice' && direction.size && !castPhaseRef.current && time - lastUpdate >= 30) {
        let dx = Number(direction.has('d') || direction.has('arrowright')) - Number(direction.has('a') || direction.has('arrowleft'));
        let dy = Number(direction.has('s') || direction.has('arrowdown')) - Number(direction.has('w') || direction.has('arrowup'));
        const magnitude = Math.hypot(dx, dy) || 1;
        dx /= magnitude;
        dy /= magnitude;
        const current = heroRef.current;
        const next = {
          x: Math.max(.12, Math.min(5.88, current.x + dx * 2.4 * delta)),
          y: Math.max(.12, Math.min(5.88, current.y + dy * 2.4 * delta)),
        };
        heroRef.current = next;
        setHero(next);
        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) setFacing(dx > 0 ? 'right' : 'left');
        else if (dy !== 0) setFacing(dy > 0 ? 'down' : 'up');
        lastUpdate = time;
      }
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      keys.current.clear();
    };
  }, []);
  useEffect(() => {
    window.sessionStorage.setItem(PRACTICE_STORAGE_KEY, String(postHp));
  }, [postHp]);
  const skill = HERO_SKILL_TREE.find(candidate => candidate.id === selectedSkillId)
    ?? (selectedSkillId === 'basic-attack' ? BASIC_ATTACK : HERO_SKILL_TREE[1]);
  const stats = PRACTICE_STATS[skill.id] ?? { range: 1, damage: 100 };
  const postInRange = stats.range > 0 && distance(hero, WOODEN_POST) <= stats.range;

  function pointFromEvent(event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(5.99, (event.clientX - rect.left) / rect.width * BOARD_SIZE)),
      y: Math.max(0, Math.min(5.99, (event.clientY - rect.top) / rect.height * BOARD_SIZE)),
    };
  }

  function schedule(delay: number, callback: () => void) {
    const timer = window.setTimeout(() => {
      timers.current = timers.current.filter(active => active !== timer);
      callback();
    }, delay);
    timers.current.push(timer);
  }

  function handleStageClick(event: React.MouseEvent<HTMLDivElement>) {
    if (castPhase) return;
    const target = pointFromEvent(event);
    setAimPoint(target);
    if (selectedSkillIdRef.current === 'ha-ba-tuc-cong' && distance(target, heroRef.current) < .7) {
      castSkill(selectedSkillIdRef.current);
      return;
    }
    if (distance(target, WOODEN_POST) < .7) castSkill(selectedSkillIdRef.current);
    else setLog('Ngắm vào cọc gỗ để thi triển; di chuyển tự do để đổi vị trí và kiểm tra tầm đánh.');
  }

  function castSkill(skillId = selectedSkillIdRef.current) {
    const skill = HERO_SKILL_TREE.find(candidate => candidate.id === skillId)
      ?? (skillId === 'basic-attack' ? BASIC_ATTACK : HERO_SKILL_TREE[1]);
    const stats = PRACTICE_STATS[skill.id] ?? { range: 1, damage: 100 };
    const isBasicAttack = skill.id === 'basic-attack';
    const isSelfSkill = skill.id === 'ha-ba-tuc-cong';
    setSelectedSkillId(skill.id);
    if (stats.range > 0 && distance(heroRef.current, WOODEN_POST) > stats.range && !isSelfSkill) {
      setLog('Cọc gỗ đang ngoài tầm. Hãy di chuyển Tiểu Mông đến gần hơn.');
      return;
    }
    if (isSelfSkill) {
      const id = ++castId.current;
      setActiveEffect({ id, skill: skill.id as SkillVfxSkill, from: heroRef.current, to: heroRef.current });
      setCastPhase('prepare');
      setLastDamage(null);
      setLog(`${skill.name}: Tiểu Mông điều hòa hơi thở, vận khí theo nhịp nước…`);
      schedule(280, () => setCastPhase('travel'));
      schedule(700, () => {
        setCastPhase('impact');
        setLog(`${skill.name} vận hành · hiệu ứng hồi phục 3% HP và 3% MP.`);
        schedule(280, () => { setCastPhase(null); setActiveEffect(null); });
      });
      return;
    }
    if (postHp <= 0) {
      setLog('Cọc gỗ đã vỡ. Nhấn Đặt lại để dựng cọc mới.');
      return;
    }
    setCastPhase('prepare');
    const id = ++castId.current;
    setActiveEffect(isBasicAttack ? null : { id, skill: skill.id as SkillVfxSkill, from: heroRef.current, to: WOODEN_POST });
    setLastDamage(null);
    setLog(`${skill.name}: ${isBasicAttack ? 'vung đòn cơ bản' : 'vào thế, chuẩn bị thi triển'}…`);
    schedule(250, () => setCastPhase('travel'));
    schedule(skill.id === 'ha-ba-cuon-luu' ? 1200 : 650, () => {
      setCastPhase('impact');
      setPostHp(hp => Math.max(0, hp - stats.damage));
      setLastDamage(stats.damage);
      setLog(`${skill.name} gây ${stats.damage} sát thương lên cọc gỗ.`);
      schedule(360, () => { setCastPhase(null); setActiveEffect(null); });
    });
  }

  function reset() {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
    setHero(STARTING_HERO);
    heroRef.current = STARTING_HERO;
    setPostHp(INITIAL_POST_HP);
    setCastPhase(null);
    setActiveEffect(null);
    setLastDamage(null);
    setAimPoint(null);
    keys.current.clear();
    setLog('Đã đặt lại sân tập.');
  }

  function persistLoadout(next: HeroSkillLoadout) {
    try {
      saveHeroSkillLoadout(next);
      loadoutRef.current = next;
      setLoadout(next);
      setSetupError('');
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : 'Không thể lưu bộ võ công.');
    }
  }

  function changeCombatSkill(index: number, skillId: string) {
    const nextSkills = [...loadoutRef.current.combatSkillIds] as HeroSkillLoadout['combatSkillIds'];
    const duplicateIndex = nextSkills.indexOf(skillId);
    if (duplicateIndex !== -1 && duplicateIndex !== index) {
      setSetupError('Mỗi ô phải trang bị một chiêu thức khác nhau.');
      return;
    }
    nextSkills[index] = skillId;
    persistLoadout({ ...loadoutRef.current, combatSkillIds: nextSkills });
  }

  function startCheckpointBattle() {
    const campaign = freshCheckpointPractice();
    setBattleCampaign(campaign);
    setBattleResult('');
    setSetupStep('battle');
  }

  function finishCheckpointBattle(path?: RiverPath) {
    setBattleResult(path
      ? path === 'righteous'
        ? 'Đã chọn tha mạng · Chính đạo trong trận thử.'
        : 'Đã chọn kết liễu · Tà đạo trong trận thử.'
      : 'Đã rút khỏi trận thử Chốt Chặn.');
    setSetupStep('result');
  }

  return <section className="sprite-editor__skill-playground" aria-label="Công cụ võ công">
    <header className="sprite-editor__skill-playground-header">
      <div>
        <span className="sprite-editor__eyebrow">{setupStep === 'battle' ? 'TRẬN THỬ · CHỐT CHẶN' : setupStep === 'practice' ? 'SÂN TẬP · 6 × 6' : 'VÕ CÔNG · TRẬN 6 × 6'}</span>
        <h2>{setupStep === 'practice' ? 'Thử võ công trên cọc gỗ' : 'Đột Phá Vòng Vây'}</h2>
        <p>{setupStep === 'practice'
          ? 'Di chuyển tự do, ngắm chuột và thử chiêu lên cọc gỗ; máu cọc chỉ hồi khi bạn đặt lại.'
          : 'Chọn trận, trang bị tâm pháp cùng ba chiêu chiến đấu rồi tự do di chuyển và giao chiến với Trưởng Đội.'}</p>
      </div>
      {setupStep === 'practice' && <button type="button" onClick={reset}>Đặt lại sân tập</button>}
      {setupStep === 'battle' && <button type="button" onClick={() => setSetupStep('loadout')}>Đổi bộ chiêu</button>}
    </header>
    {setupStep === 'encounter' && <section className="sprite-editor__skill-setup" aria-label="Chọn trận">
      <span className="sprite-editor__eyebrow">BƯỚC 1 · CHỌN TRẬN</span>
      <button type="button" className={`sprite-editor__encounter-card${encounterSelected ? ' is-selected' : ''}`} aria-pressed={encounterSelected} onClick={() => setEncounterSelected(true)}>
        <img src="/assets/maps/chot-chan-river-checkpoint.svg" alt="" />
        <span><strong>Chốt Chặn · Đột Phá Vòng Vây</strong><small>Phục kích trên sông Mê Linh · thuyền, hàng cọc chắn và tháp canh tuần tra</small></span>
      </button>
      <button type="button" disabled={!encounterSelected} onClick={() => setSetupStep('loadout')}>Tiếp tục chọn bộ võ công</button>
    </section>}
    {setupStep === 'loadout' && <section className="sprite-editor__skill-setup" aria-label="Chọn bộ võ công">
      <span className="sprite-editor__eyebrow">BƯỚC 2 · TRANG BỊ CHIÊU THỨC</span>
      <label>Tâm pháp · chọn 1
        <select value={loadout.meditationId} onChange={event => persistLoadout({ ...loadout, meditationId: event.target.value })}>
          {MEDITATION_SKILLS.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select>
      </label>
      <div className="sprite-editor__loadout-slots">
        {loadout.combatSkillIds.map((id, index) => <label key={index}>Phím {index + 1} · võ công chiến đấu {index + 1}
          <select value={id} onChange={event => changeCombatSkill(index, event.target.value)}>
            {SELECTABLE_COMBAT_SKILLS.map(candidate => <option key={candidate.id} value={candidate.id} disabled={loadout.combatSkillIds.includes(candidate.id) && candidate.id !== id}>{candidate.name}</option>)}
          </select>
          <small>{SELECTABLE_COMBAT_SKILLS.find(candidate => candidate.id === id)?.effect}</small>
        </label>)}
      </div>
      {setupError && <p role="alert">{setupError}</p>}
      <div className="sprite-editor__setup-actions">
        <button type="button" onClick={() => setSetupStep('encounter')}>Quay lại chọn trận</button>
        <button type="button" className="is-primary" onClick={startCheckpointBattle}>Vào trận Chốt Chặn</button>
        <button type="button" onClick={() => { setSelectedSkillId(loadout.combatSkillIds[0]); setSetupStep('practice'); }}>Thử trên cọc gỗ</button>
      </div>
    </section>}
    {setupStep === 'battle' && <RealtimeMelinCheckpointBattle
      campaign={battleCampaign}
      talent={null}
      haBaEquipped={battleCampaign.haBaEquipped}
      onStateChange={snapshot => {
        setBattleCampaign(current => ({ ...current, battle: snapshot, hp: snapshot.hp, mp: snapshot.mp }));
        return true;
      }}
      onVictory={(path) => { finishCheckpointBattle(path); return true; }}
      onRetreat={() => finishCheckpointBattle()}
    />}
    {setupStep === 'result' && <section className="sprite-editor__skill-setup" aria-label="Kết quả trận thử">
      <span className="sprite-editor__eyebrow">KẾT THÚC TRẬN THỬ</span>
      <h3>{battleResult}</h3>
      <div className="sprite-editor__setup-actions">
        <button type="button" onClick={() => setSetupStep('loadout')}>Đổi bộ chiêu</button>
        <button type="button" onClick={startCheckpointBattle}>Đánh lại Chốt Chặn</button>
      </div>
    </section>}
    {setupStep === 'practice' && <>
    <div className="sprite-editor__skill-playground-controls">
      <label>Chọn võ công
        <select value={selectedSkillId} onChange={event => { setSelectedSkillId(event.target.value); setLastDamage(null); }}>
          {loadout.combatSkillIds.map(id => <option key={id} value={id}>{HERO_SKILL_TREE.find(candidate => candidate.id === id)?.name}</option>)}
          <option value={loadout.meditationId}>{HERO_SKILL_TREE.find(candidate => candidate.id === loadout.meditationId)?.name} · tâm pháp</option>
          <option value="basic-attack">Đánh thường · phím 4</option>
          <option value={ULTIMATE_SKILL_ID}>Hà Bá Cuộn Lưu · phím 5</option>
        </select>
      </label>
      <div className="sprite-editor__skill-info">
        <strong><SkillIcon skill={skill.id === 'basic-attack' ? 'ca-coc-phon-thuy' : skill.id as SkillVfxSkill} />{skill.name}</strong>
        <span>{stats.range === 0 ? 'Tâm pháp · tự thân' : `Tầm ${stats.range} ô · sát thương thử ${stats.damage}`}</span>
        <small>{skill.effect}</small>
      </div>
      <p className="sprite-editor__skill-movement-hint">WASD / ↑↓←→ · phím 1–5 thi triển · rê chuột để ngắm</p>
      <label className="sprite-editor__skill-quality"><input type="checkbox" checked={reducedEffects} onChange={event => setReducedEffects(event.target.checked)} /><span>Giảm chất lượng hiệu ứng</span></label>
    </div>
    <nav className="sprite-editor__skill-hotbar" aria-label="Thanh võ công phím tắt">
      {loadout.combatSkillIds.map((id, index) => {
        const equipped = HERO_SKILL_TREE.find(candidate => candidate.id === id)!;
        return <button type="button" key={id} aria-pressed={selectedSkillId === id} onClick={() => setSelectedSkillId(id)}>
          <kbd>{index + 1}</kbd><SkillIcon skill={id as SkillVfxSkill} /><span>{equipped.name}</span>
        </button>;
      })}
      <button type="button" aria-pressed={selectedSkillId === 'basic-attack'} onClick={() => setSelectedSkillId('basic-attack')}><kbd>4</kbd><span>Đánh thường</span></button>
      <button type="button" aria-pressed={selectedSkillId === ULTIMATE_SKILL_ID} onClick={() => setSelectedSkillId(ULTIMATE_SKILL_ID)}><kbd>5</kbd><SkillIcon skill="ha-ba-cuon-luu" /><span>Tuyệt kỹ</span></button>
      <button type="button" onClick={() => castSkill(loadout.meditationId)}><SkillIcon skill={loadout.meditationId as SkillVfxSkill} /><span>Vận hành tâm pháp</span></button>
      <button type="button" className="is-edit" onClick={() => setSetupStep('loadout')}>Đổi bộ chiêu</button>
    </nav>
    <div className="sprite-editor__skill-playground-layout">
      <div
        ref={board}
        className={`sprite-editor__skill-board${castPhase ? ` is-casting is-${castPhase}` : ''}`}
        role="application"
        aria-label="Sân tập võ công thời gian thực · dùng WASD hoặc phím mũi tên để di chuyển"
        tabIndex={0}
        onPointerMove={event => setAimPoint(pointFromEvent(event))}
        onClick={handleStageClick}
      >
        <div className="sprite-editor__skill-floor" aria-hidden="true">
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => <span key={index} className={Math.floor(index / BOARD_SIZE) === 2 ? 'is-river' : ''} />)}
        </div>
        <SkillVFXCanvas effect={activeEffect && castPhase ? { ...activeEffect, phase: castPhase } : null} reducedQuality={reducedEffects} />
        {stats.range > 0 && <span className="sprite-editor__skill-range" style={{
          left: `${(hero.x + .5) / BOARD_SIZE * 100}%`,
          top: `${(hero.y + .5) / BOARD_SIZE * 100}%`,
          width: `${stats.range / BOARD_SIZE * 200}%`,
        }} aria-hidden="true" />}
        {aimPoint && <span className="sprite-editor__skill-aim" style={{
          left: `${aimPoint.x / BOARD_SIZE * 100}%`,
          top: `${aimPoint.y / BOARD_SIZE * 100}%`,
        }} aria-hidden="true" />}
        <button type="button" className={`sprite-editor__skill-actor is-hero${walking ? ' is-walking' : ''}`} style={{
          left: `${(hero.x + .5) / BOARD_SIZE * 100}%`,
          top: `${(hero.y + .5) / BOARD_SIZE * 100}%`,
        }} aria-label={`Tiểu Mông · vị trí ${hero.x.toFixed(1)}, ${hero.y.toFixed(1)}`}>
          <CharacterSprite
                appearance={PRACTICE_APPEARANCE}
                customization={PRACTICE_CUSTOMIZATION}
                startingCharacter={PRACTICE_CHARACTER.id}
                facing={facing}
                walking={walking}
                className="sprite-editor__skill-character"
              />
        </button>
        <button type="button" className={`sprite-editor__skill-actor is-post${postHp === 0 ? ' is-broken' : ''}`} style={{
          left: `${(WOODEN_POST.x + .5) / BOARD_SIZE * 100}%`,
          top: `${(WOODEN_POST.y + .5) / BOARD_SIZE * 100}%`,
        }} aria-label={`${postHp === 0 ? 'Cọc gỗ vỡ' : 'Cọc gỗ'}, ${postHp} HP`}>
                <svg className="sprite-editor__skill-post-art" viewBox="0 0 48 64" aria-hidden="true" focusable="false">
                  <ellipse cx="24" cy="59" rx="17" ry="4" fill="#47341f" opacity=".38" />
                  <path d="m13 14 9-7 13 7v42H13z" fill="#80542f" stroke="#553a25" strokeWidth="2" />
                  <path d="m22 7 13 7v42l-13-3z" fill="#684329" opacity=".72" />
                  <path d="m13 14 9-7 13 7-10 7z" fill="#bd8950" stroke="#68472d" strokeWidth="1.5" />
                  <path d="M22 9v43m-5-34c2 4 2 8 0 12m12-9c-2 5-2 10 0 15M17 37c2 4 2 8 0 12" fill="none" stroke="#d3a66c" strokeWidth="2" strokeLinecap="round" />
                  <path d="m13 14 12 7v36m-12-43v42" fill="none" stroke="#d8a363" strokeWidth="1.4" opacity=".7" />
                  <path d="m13 14 9-7 13 7" fill="none" stroke="#e0b576" strokeWidth="2" />
                  {postHp === 0 && <path d="m19 20 5 7-4 5 6 6-4 8 7 6" fill="none" stroke="#302820" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                <small>{postHp} HP</small>
        </button>
        {lastDamage !== null && <span className="sprite-editor__skill-damage" key={`${postHp}-${lastDamage}`}>−{lastDamage}</span>}
      </div>
      <aside className="sprite-editor__skill-playground-status">
        <h3>Trạng thái sân tập</h3>
        <p role="status">{log}</p>
        <p>Vị trí: {hero.x.toFixed(1)}, {hero.y.toFixed(1)}</p>
        <p>Cọc gỗ: {postHp} / {INITIAL_POST_HP} HP</p>
        <small>{postHp === 0 ? 'Cọc đã vỡ và không tự hồi máu. Nhấn Đặt lại sân tập để dựng cọc mới.' : skill.id === 'ha-ba-tuc-cong' ? 'Nhấp gần Tiểu Mông để vận khí; tâm pháp không gây sát thương lên cọc.' : postInRange ? 'Cọc gỗ đang trong tầm — rê chuột để ngắm rồi nhấp cọc để thi triển.' : 'Cọc gỗ ngoài tầm — di chuyển đến gần hơn.'}</small>
      </aside>
    </div>
    </>}
  </section>;
}
