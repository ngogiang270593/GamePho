import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import type { CharacterAppearance, Facing } from '../game/character';
import type { PlayableCharacterId } from '../game/startingCharacters';
import type { CharacterSpriteSheet, SpriteAction } from '../game/characterSpriteSheet';
import { OPENING_MAP_WIDTH, OPENING_MAP_HEIGHT, OPENING_MAP_SPAWN, OPENING_MAP_AREAS, OPENING_MAP_PLAYER_RADIUS, isOpeningMapWalkable, findOpeningMapPath, nearestOpeningMapWalkablePoint } from '../game/openingMap';
import type { Point } from '../game/world';
import { createOpeningMapVillagers, openingMapDayPeriod, OPENING_MAP_MEMORY_KEEPER_HOME_POINT, useOpeningMapNpcs, type OpeningMapNpc } from '../game/openingMapNpcs';
import { CharacterSprite } from '../components/CharacterSprite';
import { OpeningMapNpcArtwork } from '../components/OpeningMapNpcArtwork';
import { OpeningMapNpcHomes, OPENING_MAP_REST_POINT } from '../components/OpeningMapNpcHomes';
import { OpeningMapNpcMarker } from '../components/OpeningMapNpcMarker';
import { OpeningMapScenery, openingMapForegroundIds } from '../components/OpeningMapScenery';
import { VirtualJoystick } from '../components/VirtualJoystick';
import { keyboardVector, DIRECTION_KEYS } from '../game/movement/keyboard';
import { moveControlled } from '../game/movement/navigation';
import { freshHistoryProfile, readHistoryProfile, type HistoryProfile } from '../services/historyProfile';
import { freshHistoryProgress, readHistoryProgress, saveHistoryProgress, type HistoryProgress } from '../services/historyProgress';
import { applyRiverCampaignAction, normalizeRiverCampaign, OPENING_MAP_AFFINITY_IDS, OPENING_MAP_SIDE_NPC_IDS, type OpeningMapSideNpcAction, type OpeningMapSideNpcId, type RiverCampaignAction } from '../game/riverCampaign';
import { MelinRiverCampaign } from '../components/MelinRiverCampaign';
import { MelinCheckpointBattle } from '../components/MelinCheckpointBattle';
import { MelinProfessionPanel } from '../components/MelinProfessionPanel';
import { SkillIcon } from '../components/SkillIcon';
import { HERO_ALIGNMENT_PATHS, HERO_BASE_ATTRIBUTES, HERO_BIOGRAPHY, HERO_STARTING_TALENTS } from '../game/heroDevelopment';
import { HERO_SKILL_TREE } from '../game/heroSkills';
import type { SkillVfxSkill } from '../game/skillVfx';
import { isInPatrolVision } from '../game/patrolVision';
import { openingMapLightPhase, openingMapLightPhaseLabel, openingMapWeather } from '../game/openingMapAtmosphere';
import { splitOpeningMapDialogue } from '../game/openingMapDialogue';
import {
  advanceOpeningMapDeliveryQuest,
  INITIAL_OPENING_MAP_DELIVERY_QUEST,
  readOpeningMapDeliveryQuest,
  saveOpeningMapDeliveryQuest,
  type OpeningMapDeliveryQuestAction,
} from '../game/openingMapDeliveryQuest';
import '../styles/opening-map.css';

export { isOpeningMapWalkable, OPENING_MAP_AREAS } from '../game/openingMap';
const PLAYER_POSITION_KEY = 'opening-map-player-position-landscape-v2';
const CHARACTER_PANEL_TABS = [
  ['character-overview', 'Tổng quan'],
  ['character-stats', 'Chỉ số'],
  ['character-talents', 'Thiên phú'],
  ['character-story', 'Tiểu sử'],
  ['character-path', 'Định hướng'],
  ['character-skills', 'Võ học'],
] as const;
const OPENING_SIDE_ITEM_LABELS: Record<string, string> = {
  ITEM_XUYEN_KHUNG: 'Xuyên Khung',
  ITEM_BANH_BAO: 'Bánh bao',
  ITEM_RUOU_NEP: 'Rượu nếp',
  ITEM_TRAI_CAY: 'Trái cây theo mùa',
  ITEM_TO_HE: 'Tò he may mắn',
  ITEM_GO_QUY: 'Gỗ quý',
  SKILL_DA_NGUU_BAI_TUONG: 'Tâm pháp Đả Ngưu Bái Tướng',
  ITEM_TIN_BIEN_AI: 'Tin tình báo biên ải',
  ITEM_TIN_DA_CHIA_SE: 'Tin tình báo đã chia sẻ',
  ITEM_SO_DO_DUONG_TAT: 'Chỉ dẫn đường tắt',
  CLOTHES_GIAP_DANH_BINH: 'Giáp dân binh',
};

function loadPlayerPosition(checkpointOpen: boolean, firstEntry: boolean): { point: Point; error: string } {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(PLAYER_POSITION_KEY) ?? 'null');
    if (stored && typeof stored === 'object' && Number.isFinite((stored as Point).x) && Number.isFinite((stored as Point).y) && isOpeningMapWalkable(stored as Point, OPENING_MAP_PLAYER_RADIUS, checkpointOpen)) return { point: stored as Point, error: '' };
    return { point: firstEntry ? OPENING_MAP_REST_POINT : OPENING_MAP_SPAWN, error: '' };
  } catch (cause) {
    return { point: OPENING_MAP_SPAWN, error: cause instanceof Error ? `Không đọc được vị trí nhân vật: ${cause.message}` : 'Không đọc được vị trí nhân vật.' };
  }
}
function loadProfile(): { profile: HistoryProfile; error: string } {
  try { return { profile: readHistoryProfile(), error: '' }; }
  catch (cause) { return { profile: freshHistoryProfile(), error: cause instanceof Error ? cause.message : 'Không đọc được hồ sơ nhân vật.' }; }
}
function loadCampaignProgress(): { progress: HistoryProgress; error: string } {
  try { return { progress: readHistoryProgress(), error: '' }; }
  catch (cause) { return { progress: freshHistoryProgress(), error: cause instanceof Error ? cause.message : 'Không đọc được hành trình Bến Nước.' }; }
}
export interface OpeningMapPageProps {
  embedded?: boolean;
  overview?: boolean;
  interactive?: boolean;
  appearance?: CharacterAppearance;
  startingCharacter?: PlayableCharacterId | null;
  playerSpriteSheet?: CharacterSpriteSheet | null;
  playerName?: string;
  previewMotion?: { action: SpriteAction; facing: Facing; frame?: number; playing?: boolean };
  previewNpc?: OpeningMapNpc;
  npcs?: readonly OpeningMapNpc[];
  placingNpc?: boolean;
  onNpcPlace?: (point: Point) => void;
  onNpcSelect?: (id: string) => void;
  selectedNpcId?: string;
  focusPoint?: Point;
  persistPlayerPosition?: boolean;
  onChapterEntry?: (entry: 'righteous' | 'shadow') => void;
}
function mapEventPoint(event: MouseEvent<SVGSVGElement>, view: { x: number; y: number; width: number; height: number }): Point | null {
  const svg = event.currentTarget;
  const matrix = svg.getScreenCTM?.();
  if (matrix && svg.createSVGPoint) {
    const cursor = svg.createSVGPoint(); cursor.x = event.clientX; cursor.y = event.clientY;
    const result = cursor.matrixTransform(matrix.inverse());
    return { x: view.x + result.x, y: view.y + result.y };
  }
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const scale = Math.min(rect.width / view.width, rect.height / view.height);
  return { x: view.x + (event.clientX - rect.left - (rect.width - view.width * scale) / 2) / scale, y: view.y + (event.clientY - rect.top - (rect.height - view.height * scale) / 2) / scale };
}

export function OpeningMapPage({ embedded = false, overview = false, interactive = true, appearance, startingCharacter, playerSpriteSheet, playerName, previewMotion, previewNpc, npcs, placingNpc = false, onNpcPlace, onNpcSelect, selectedNpcId, focusPoint, persistPlayerPosition = true, onChapterEntry }: OpeningMapPageProps = {}) {
  const defaultNpcs = useOpeningMapNpcs();
  const [loaded] = useState(loadProfile);
  const [campaignLoaded] = useState(loadCampaignProgress);
  const [campaignProgress, setCampaignProgress] = useState(campaignLoaded.progress);
  const campaign = normalizeRiverCampaign(campaignProgress.riverCampaign);
  const baseNpcs = (npcs ?? defaultNpcs).filter(npc => !npc.hidden).map(npc => {
    if (!campaign.villageBetrayed || !['memory-keeper', 'fisherman-tao', 'woman-general', 'gate-guard'].includes(npc.id)) return npc;
    const dialogue: Record<string, string> = {
      'memory-keeper': 'Bà đã mất niềm tin nơi con. Dân làng phải lánh nạn vì mật thư của Giao.',
      'fisherman-tao': 'Ta từng nghĩ con biết thương người. Giờ dân làng phải trốn chạy vì lựa chọn của con.',
      'woman-general': 'Con đã phản bội thôn làng. Ta không còn gì để chỉ dạy.',
      'gate-guard': 'Ngươi tưởng bán đứng dân làng thì có thể yên ổn sao? Chốt Chặn vẫn ở phía trước.',
    };
    return { ...npc, dialogue: dialogue[npc.id], mission: 'Mất lòng tin sau khi Tiểu Mông tiết lộ mật thư cho Đông Hán.', schedule: undefined };
  });
  const includeWorldNpcs = npcs === undefined;
  const guardNpc = baseNpcs.find(npc => npc.id === 'gate-guard') ?? defaultNpcs.find(npc => npc.id === 'gate-guard');
  const messengerNpc = baseNpcs.find(npc => npc.id === 'messenger') ?? defaultNpcs.find(npc => npc.id === 'messenger');
  const villageNpcs: OpeningMapNpc[] = includeWorldNpcs && !campaign.villageBetrayed && messengerNpc
    ? createOpeningMapVillagers(messengerNpc, !!campaign.inventory.ITEM_CA_COC_SONG_DAY)
    : [];
  const patrolNpcs: OpeningMapNpc[] = includeWorldNpcs && campaign.villageBetrayed
    && guardNpc
    ? createOpeningMapVillagers(messengerNpc ?? guardNpc).map(({ point }, index) => ({ id: `enemy-patrol-${index + 1}`, point }))
      .map(({ id, point }) => {
        return { ...guardNpc, id, point, name: 'Lính tuần tra Đông Hán', alias: 'Địch tuần tra', role: 'Lính Đông Hán lục soát thôn sau khi Giao tiết lộ mật thư.', mission: 'Tuần tra khu dân cư.', dialogue: 'Dân làng đã bỏ trốn. Không phận sự thì tránh đường!', kind: 'guard' };
      })
    : [];
  const openingNpcs = [...baseNpcs, ...villageNpcs, ...patrolNpcs];
  const [dialogNpcId, setDialogNpcId] = useState<string | null>(null);
  const [dialoguePage, setDialoguePage] = useState(0);
  const [dialogueFinished, setDialogueFinished] = useState(false);
  const selectedNpc = openingNpcs.find(npc => npc.id === dialogNpcId);
  const rootRef = useRef<HTMLElement>(null);
  const artRef = useRef<SVGSVGElement>(null);
  const cameraLayerRef = useRef<SVGGElement>(null);
  const playerShadowRef = useRef<SVGEllipseElement>(null);
  const playerPositionRef = useRef<SVGForeignObjectElement>(null);
  const playerBodyRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<SVGGElement>(null);
  const minimapCameraRef = useRef<SVGRectElement>(null);
  const minimapPlayerRef = useRef<SVGCircleElement>(null);
  const minimapDirectionRef = useRef<SVGPathElement>(null);
  const uniqueId = useId().replace(/:/g, '');
  const artworkId = `opening-map-artwork-${uniqueId}`;
  const catalogRef = useRef(openingNpcs); catalogRef.current = openingNpcs;
  const npcPositionsRef = useRef(new Map(openingNpcs.map(npc => [npc.id, npc.point])));
  const npcFacingsRef = useRef(new Map(openingNpcs.map(npc => [npc.id, npc.facing])));
  const minimapNpcRefs = useRef(new Map<string, SVGCircleElement>());
  for (const npc of openingNpcs) {
    if (!npcPositionsRef.current.has(npc.id)) npcPositionsRef.current.set(npc.id, npc.point);
    if (!npcFacingsRef.current.has(npc.id)) npcFacingsRef.current.set(npc.id, npc.facing);
  }
  const selectRef = useRef(onNpcSelect); selectRef.current = onNpcSelect;
  const suspended = useRef(false);
  const checkpointOpen = campaign.bossDefeated;
  const [campaignError, setCampaignError] = useState(campaignLoaded.error);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [bossOpen, setBossOpen] = useState(false);
  const [fruitGiftRecipient, setFruitGiftRecipient] = useState('singer-le-nuong');
  const [patrolDetected, setPatrolDetected] = useState(false);
  const [openMapPanel, setOpenMapPanel] = useState<typeof CHARACTER_PANEL_TABS[number][0] | 'bag' | 'quest' | 'skills' | 'profession' | null>(null);
  const characterPanelTab = CHARACTER_PANEL_TABS.find(([id]) => id === openMapPanel);
  const isCharacterPanel = !!characterPanelTab;
  suspended.current = !!selectedNpc || campaignOpen || isCharacterPanel || placingNpc || !interactive;
  const [deliveryQuestInitial] = useState(() => {
    try { return { state: readOpeningMapDeliveryQuest(), error: '' }; }
    catch (cause) {
      return {
        state: INITIAL_OPENING_MAP_DELIVERY_QUEST,
        error: cause instanceof Error ? cause.message : 'Không đọc được nhiệm vụ Giao hàng.',
      };
    }
  });
  const [deliveryQuest, setDeliveryQuest] = useState(deliveryQuestInitial.state);
  const [deliveryQuestError, setDeliveryQuestError] = useState(deliveryQuestInitial.error);
  const [initialPosition] = useState(() => persistPlayerPosition
    ? loadPlayerPosition(checkpointOpen, !campaign.mainQuestActivated)
    : { point: OPENING_MAP_SPAWN, error: '' });
  const { profile, error } = loaded;
  const [, setPositionRevision] = useState(0);
  const pointRef = useRef(initialPosition.point);
  const checkpointTriggerActivated = useRef(false);
  const checkpointOpenRef = useRef(checkpointOpen);
  checkpointOpenRef.current = checkpointOpen;
  const [facing, setFacing] = useState<Facing>('down');
  const [walking, setWalking] = useState(false);
  const [running, setRunning] = useState(false);
  const [miniMapOpen, setMiniMapOpen] = useState(false);
  const [fullMap, setFullMap] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [activeAreaId, setActiveAreaId] = useState<string | null>('market');
  const [areaNotice, setAreaNotice] = useState('');
  const keys = useRef(new Set<string>());
  const joystick = useRef<Point>({ x: 0, y: 0 });
  const [touchRunning, setTouchRunning] = useState(false);
  const touchRunningRef = useRef(false); touchRunningRef.current = touchRunning;
  const route = useRef<Point[]>([]);
  const [destination, setDestination] = useState<Point | null>(null);
  const walkingRef = useRef(false);
  const facingRef = useRef<Facing>('down');
  const runningRef = useRef(false);
  const [movementError, setMovementError] = useState(initialPosition.error);
  const showingOverview = overview || fullMap;
  const cameraOptionsRef = useRef({ aspect, zoom, showingOverview });
  cameraOptionsRef.current = { aspect, zoom, showingOverview };

  function stopMovement() {
    keys.current.clear(); joystick.current = { x: 0, y: 0 }; route.current = [];
    walkingRef.current = false; runningRef.current = false;
    setWalking(false); setRunning(false); setDestination(null);
    if (facingRef.current !== 'down') {
      facingRef.current = 'down';
      setFacing('down');
    }
  }
  const applyCampaignAction = useCallback((action: RiverCampaignAction) => {
    try {
      const currentCampaign = normalizeRiverCampaign(campaignProgress.riverCampaign);
      const updatedCampaign = normalizeRiverCampaign(applyRiverCampaignAction(
        currentCampaign,
        action,
        profile.heroDevelopment.talent,
      ));
      if (action.type !== 'wait-hour' && action.type !== 'rest-at-dock' && updatedCampaign.actionPoints < currentCampaign.actionPoints) {
        updatedCampaign.timeMinutes = (updatedCampaign.timeMinutes + 60) % 1440;
      }
      const next = {
        ...campaignProgress,
        riverCampaign: updatedCampaign,
      };
      saveHistoryProgress(next);
      setCampaignProgress(next);
      setCampaignError('');
      return true;
    } catch (cause) {
      setCampaignError(cause instanceof Error ? cause.message : 'Chưa thể cập nhật tiến trình Bến Nước.');
      return false;
    }
  }, [campaignProgress, profile.heroDevelopment.talent]);
  function openRiverCampaign() {
    stopMovement();
    setDialogNpcId(null);
    setOpenMapPanel(null);
    setBossOpen(false);
    setCampaignOpen(true);
  }
  function openCharacterSheet() {
    stopMovement();
    setDialogNpcId(null);
    setBossOpen(false);
    setCampaignOpen(false);
    setOpenMapPanel(value => value === 'character-overview' ? null : 'character-overview');
  }
  function restAtDock() {
    stopMovement();
    if (applyCampaignAction({ type: 'rest-at-dock' })) {
      setAreaNotice(campaignProgress.riverCampaign.mainQuestActivated
        ? 'Đã nghỉ qua đêm ở chõng tre · HP, MP và 3 AP đã hồi phục.'
        : 'Tiểu Mông thức dậy tại chõng tre · nhiệm vụ Hơi Thở Quê Hương đã được kích hoạt.');
    }
  }
  function progressDeliveryQuest(action: OpeningMapDeliveryQuestAction) {
    try {
      const next = advanceOpeningMapDeliveryQuest(deliveryQuest, action);
      saveOpeningMapDeliveryQuest(next);
      setDeliveryQuest(next);
      setDeliveryQuestError('');
      if (action === 'ask-tao') setAreaNotice('Tảo đã chỉ đường tới Bến Nước · tham gia hoạt động sinh tồn để học cách chế Bẫy Tre Gai.');
    } catch (cause) {
      setDeliveryQuestError(cause instanceof Error ? cause.message : 'Chưa cập nhật được nhiệm vụ Giao hàng.');
    }
  }
  function runSideNpcAction(npcId: OpeningMapSideNpcId, action: OpeningMapSideNpcAction, recipient?: string) {
    if (applyCampaignAction({ type: 'opening-npc-action', npcId, action, recipient })) {
      setAreaNotice('Đã cập nhật nhiệm vụ và hành trang.');
    }
  }
  function sideNpcButton(npcId: OpeningMapSideNpcId, action: OpeningMapSideNpcAction, label: string, disabled = false, recipient?: string) {
    return <button type="button" disabled={disabled} onClick={() => runSideNpcAction(npcId, action, recipient)}>{label}</button>;
  }
  function closeDialog() { setDialogNpcId(null); rootRef.current?.focus({ preventScroll: true }); }
  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => { const { width, height } = entries[0].contentRect; if (width && height) setAspect(width / height); });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => { if (suspended.current) stopMovement(); }, [dialogNpcId, campaignOpen, openMapPanel, placingNpc, interactive]);
  useEffect(() => { if (!areaNotice) return; const timer = window.setTimeout(() => setAreaNotice(''), 2800); return () => window.clearTimeout(timer); }, [areaNotice]);
  useEffect(() => {
    if (!focusPoint || !isOpeningMapWalkable(focusPoint, OPENING_MAP_PLAYER_RADIUS, checkpointOpenRef.current)) return;
    stopMovement(); pointRef.current = { ...focusPoint }; setPositionRevision(revision => revision + 1); setMovementError('');
  }, [focusPoint?.x, focusPoint?.y]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
      if (embedded && !rootRef.current?.contains(document.activeElement)) return;
      if (key === 'escape') { closeDialog(); setOpenMapPanel(null); setFullMap(false); return; }
      if (key === 'm' && !event.repeat) { event.preventDefault(); setFullMap(value => !value); return; }
      if (key === 'e' && !event.repeat) {
        if (suspended.current) return;
        const nearest = catalogRef.current.filter(npc => {
          const npcPoint = npcPositionsRef.current.get(npc.id) ?? npc.point;
          return Math.hypot(npcPoint.x - pointRef.current.x, npcPoint.y - pointRef.current.y) <= 90;
        }).sort((a, b) => {
          const pointA = npcPositionsRef.current.get(a.id) ?? a.point;
          const pointB = npcPositionsRef.current.get(b.id) ?? b.point;
          return Math.hypot(pointA.x - pointRef.current.x, pointA.y - pointRef.current.y)
            - Math.hypot(pointB.x - pointRef.current.x, pointB.y - pointRef.current.y);
        })[0];
        if (nearest) { event.preventDefault(); stopMovement(); if (selectRef.current) selectRef.current(nearest.id); else { setDialoguePage(0); setDialogueFinished(false); setDialogNpcId(nearest.id); } }
        return;
      }
      if ((!DIRECTION_KEYS[key] && key !== 'shift') || suspended.current) return;
      event.preventDefault(); keys.current.add(key);
      if (DIRECTION_KEYS[key]) { route.current = []; setDestination(null); }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const clearKeys = () => { keys.current.clear(); joystick.current = { x: 0, y: 0 }; };
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', clearKeys);
    let frame = 0, previousTime = 0, lastSaved = 0, lastForegroundUpdate = 0;
    let previousAreaId: string | null = null;
    let foregroundSignature = '';
    // Keep per-frame coordinates out of React; rerendering the full SVG scene while walking is expensive.
    const syncPosition = (position: Point, updateCamera: boolean) => {
      const { aspect: currentAspect, zoom: currentZoom, showingOverview: overviewNow } = cameraOptionsRef.current;
      const height = Math.min(1150, 1500 / currentAspect) / currentZoom;
      const width = height * currentAspect;
      const x = overviewNow ? 0 : Math.max(0, Math.min(OPENING_MAP_WIDTH - width, position.x - width / 2));
      const y = overviewNow ? 0 : Math.max(0, Math.min(OPENING_MAP_HEIGHT - height, position.y - height / 2));
      cameraBoundsRef.current = { x, y, width, height };
      if (updateCamera) {
        cameraLayerRef.current?.setAttribute('transform', `translate(${-x} ${-y})`);
        minimapCameraRef.current?.setAttribute('x', String(x));
        minimapCameraRef.current?.setAttribute('y', String(y));
        minimapCameraRef.current?.setAttribute('width', String(width));
        minimapCameraRef.current?.setAttribute('height', String(height));
      }
      playerShadowRef.current?.setAttribute('cx', String(position.x));
      playerShadowRef.current?.setAttribute('cy', String(position.y + 3));
      playerPositionRef.current?.setAttribute('x', String(position.x - 46));
      playerPositionRef.current?.setAttribute('y', String(position.y - 121));
      playerBodyRef.current?.setAttribute('data-player-x', String(Math.round(position.x)));
      playerBodyRef.current?.setAttribute('data-player-y', String(Math.round(position.y)));
      minimapPlayerRef.current?.setAttribute('cx', String(position.x));
      minimapPlayerRef.current?.setAttribute('cy', String(position.y));
      minimapDirectionRef.current?.setAttribute('d', `M${position.x} ${position.y - 28}l-18 38h36z`);
    };
    const syncForeground = (position: Point) => {
      const group = foregroundRef.current;
      if (!group) return;
      const ids = openingMapForegroundIds(position);
      const signature = ids.join('|');
      if (signature === foregroundSignature) return;
      foregroundSignature = signature;
      const fragment = document.createDocumentFragment();
      for (const id of ids) {
        const object = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        object.setAttribute('href', `#scenery-${uniqueId}-object-${id}`);
        fragment.append(object);
      }
      group.replaceChildren(fragment);
    };
    syncForeground(pointRef.current);
    const update = (time: number) => {
      frame = window.requestAnimationFrame(update);
      if (!previousTime) { previousTime = time; return; }
      const delta = Math.min((time - previousTime) / 1000, 0.1); previousTime = time;
      if (suspended.current) return;
      const keyboard = keyboardVector(keys.current);
      let vector = Math.hypot(keyboard.x, keyboard.y) > 0 ? keyboard : joystick.current;
      const isRunning = keys.current.has('shift') || touchRunningRef.current;
      const step = (isRunning ? 190 : 120) * delta;
      if (Math.hypot(vector.x, vector.y) === 0 && route.current.length) {
        while (route.current.length && Math.hypot(route.current[0].x - pointRef.current.x, route.current[0].y - pointRef.current.y) < .75) route.current.shift();
        const target = route.current[0];
        if (target) { const dx = target.x - pointRef.current.x, dy = target.y - pointRef.current.y, distance = Math.hypot(dx, dy), speed = Math.min(1, distance / step); vector = { x: dx / distance * speed, y: dy / distance * speed }; }
        else setDestination(null);
      }
      let actuallyMoving = false;
      if (Math.hypot(vector.x, vector.y) > 0) {
        const nextFacing: Facing = Math.abs(vector.x) > Math.abs(vector.y) ? vector.x < 0 ? 'left' : 'right' : vector.y < 0 ? 'up' : 'down';
        const nextPoint = moveControlled(pointRef.current, vector, delta, isRunning, point => isOpeningMapWalkable(point, OPENING_MAP_PLAYER_RADIUS, checkpointOpenRef.current));
        actuallyMoving = Math.hypot(nextPoint.x - pointRef.current.x, nextPoint.y - pointRef.current.y) > .01;
        if (actuallyMoving) {
          if (nextFacing !== facingRef.current) { facingRef.current = nextFacing; setFacing(nextFacing); }
          pointRef.current = nextPoint;
          syncPosition(nextPoint, true);
          if (time - lastForegroundUpdate >= 100) {
            lastForegroundUpdate = time;
            syncForeground(nextPoint);
          }
        }
        else if (route.current.length) { route.current = []; setDestination(null); }
      }
      if (actuallyMoving) {
        const area = OPENING_MAP_AREAS.map(candidate => ({ candidate, distance: Math.hypot(candidate.point.x - pointRef.current.x, candidate.point.y - pointRef.current.y) }))
          .filter(item => item.distance <= item.candidate.radius).sort((a, b) => a.distance - b.distance)[0]?.candidate;
        const nextAreaId = area?.id ?? null;
        if (nextAreaId !== previousAreaId) { previousAreaId = nextAreaId; setActiveAreaId(nextAreaId); if (area) setAreaNotice(area.name); }
      }
      if (walkingRef.current !== actuallyMoving) {
        walkingRef.current = actuallyMoving;
        setWalking(actuallyMoving);
      }
      if (!actuallyMoving && facingRef.current !== 'down') {
        facingRef.current = 'down';
        setFacing('down');
      }
      if (runningRef.current !== (actuallyMoving && isRunning)) { runningRef.current = actuallyMoving && isRunning; setRunning(runningRef.current); }
      if (persistPlayerPosition && actuallyMoving && time - lastSaved > 1500) {
        lastSaved = time;
        try { localStorage.setItem(PLAYER_POSITION_KEY, JSON.stringify(pointRef.current)); }
        catch (cause) { setMovementError(cause instanceof Error ? cause.message : 'Không lưu được vị trí nhân vật.'); }
      }
    };
    frame = window.requestAnimationFrame(update);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', clearKeys); };
  }, [embedded, persistPlayerPosition]);

  function setJoystickVector(vector: Point) {
    if (suspended.current) return;
    joystick.current = vector;
    if (Math.hypot(vector.x, vector.y) > 0) { route.current = []; setDestination(null); }
  }
  function setWalkingDestination(target: Point) {
    if (suspended.current) return;
    if (!checkpointOpenRef.current && isOpeningMapWalkable(target)
      && !isOpeningMapWalkable(target, OPENING_MAP_PLAYER_RADIUS, false)) {
      setMovementError('Chốt Chặn phía Đông chỉ mở sau khi đánh bại Trưởng Đội Tuần Tra.');
      return;
    }
    const allowedTarget = isOpeningMapWalkable(target, OPENING_MAP_PLAYER_RADIUS, checkpointOpenRef.current)
      ? target : nearestOpeningMapWalkablePoint(target, checkpointOpenRef.current);
    if (!allowedTarget) { setMovementError('Hãy chọn đường đi hoặc khoảng đất trống.'); return; }
    const path = findOpeningMapPath(pointRef.current, allowedTarget, checkpointOpenRef.current);
    if (!path.length) { setMovementError('Chưa tìm được lối tới đây. Hãy chọn một điểm gần đường đi.'); return; }
    keys.current.clear(); route.current = path; setDestination(allowedTarget); setMovementError('');
    if (!overview) setFullMap(false);
    rootRef.current?.focus({ preventScroll: true });
  }
  const point = pointRef.current;
  useEffect(() => {
    if (!interactive || campaign.mainQuestActivated) return;
    if (!applyCampaignAction({ type: 'activate-main-quest' })) return;
    const wokeAtCot = pointRef.current.x === OPENING_MAP_REST_POINT.x && pointRef.current.y === OPENING_MAP_REST_POINT.y;
    setAreaNotice(wokeAtCot
      ? 'Tiểu Mông thức dậy tại chõng tre · nhiệm vụ Hơi Thở Quê Hương đã được kích hoạt.'
      : 'Nhiệm vụ Hơi Thở Quê Hương đã được kích hoạt.');
    if (persistPlayerPosition) {
      try { localStorage.setItem(PLAYER_POSITION_KEY, JSON.stringify(pointRef.current)); }
      catch (cause) { setMovementError(cause instanceof Error ? `Không lưu được vị trí nhân vật: ${cause.message}` : 'Không lưu được vị trí nhân vật.'); }
    }
  }, [interactive, campaign.mainQuestActivated, applyCampaignAction, persistPlayerPosition]);
  useEffect(() => {
    if (!interactive || placingNpc || selectedNpc || campaignOpen || checkpointOpen
      || campaign.bossStarted || campaign.bossDefeated || checkpointTriggerActivated.current) return;
    const checkpointTrigger = { x: 3060, y: 1500 };
    if (Math.hypot(point.x - checkpointTrigger.x, point.y - checkpointTrigger.y) > 90) return;
    if (!campaign.trapRecipe || !campaign.knowsDaoManual) {
      setAreaNotice('Chốt Chặn yêu cầu Bẫy Tre Gai của Tảo và Lạc Thủy Đao Pháp của Võ Sư Nương.');
      return;
    }
    checkpointTriggerActivated.current = true;
    stopMovement();
    if (applyCampaignAction({ type: 'start-boss' })) {
      setCampaignOpen(true);
      setBossOpen(true);
      setAreaNotice('Zone_CauGo_Trigger · Trưởng Đội Đông Hán đã chặn đường rời map.');
    } else {
      checkpointTriggerActivated.current = false;
    }
  }, [interactive, placingNpc, selectedNpc, campaignOpen, checkpointOpen, campaign.bossStarted, campaign.bossDefeated, campaign.trapRecipe, campaign.knowsDaoManual, point.x, point.y, applyCampaignAction]);
  const followHeight = Math.min(1150, 1500 / aspect) / zoom;
  const followWidth = followHeight * aspect;
  const followCameraX = Math.max(0, Math.min(OPENING_MAP_WIDTH - followWidth, point.x - followWidth / 2));
  const followCameraY = Math.max(0, Math.min(OPENING_MAP_HEIGHT - followHeight, point.y - followHeight / 2));
  const camera = showingOverview ? { x: 0, y: 0, width: OPENING_MAP_WIDTH, height: OPENING_MAP_HEIGHT } : { x: followCameraX, y: followCameraY, width: followWidth, height: followHeight };
  const cameraBoundsRef = useRef(camera);
  cameraBoundsRef.current = camera;
  function handleMapClick(event: MouseEvent<SVGSVGElement>, view = cameraBoundsRef.current) {
    const target = mapEventPoint(event, view);
    if (!target) return;
    if (placingNpc) {
      if (!isOpeningMapWalkable(target)) { setMovementError('Chọn vị trí trên đường hoặc đất trống, tránh sông và nhà.'); return; }
      setMovementError(''); onNpcPlace?.(target);
    } else setWalkingDestination(target);
  }
  function interactWithNpc(npc: OpeningMapNpc) {
    if (placingNpc || !interactive) return;
    stopMovement();
    if (onNpcSelect) onNpcSelect(npc.id);
    else { setDialoguePage(0); setDialogueFinished(false); setDialogNpcId(npc.id); }
  }
  function updateNpcPosition(id: string, npcPoint: Point, facing: Facing) {
    npcPositionsRef.current.set(id, npcPoint);
    npcFacingsRef.current.set(id, facing);
    const marker = minimapNpcRefs.current.get(id);
    marker?.setAttribute('cx', String(npcPoint.x));
    marker?.setAttribute('cy', String(npcPoint.y));
  }
  const deliveryQuestConversation = selectedNpc?.id === 'memory-keeper' || selectedNpc?.id === 'messenger'
    ? (() => {
      if (selectedNpc.id === 'memory-keeper') {
        switch (deliveryQuest.stage) {
          case 'available':
            return { dialogue: 'Chuyến hàng của làng bị Trưởng Đội Tuần Tra chặn lại. Bà còn giữ được một kiện hàng; con mang giúp bà tới Giao ở Chợ Nhỏ nhé.', mission: 'GIAO HÀNG · Mang kiện hàng đến Giao ở Chợ Nhỏ.', action: 'accept' as const, label: 'Nhận kiện hàng' };
          case 'carrying':
            return { dialogue: 'Kiện hàng bà gửi đang chờ Giao ở Chợ Nhỏ. Hãy trao tận tay cho cậu ấy rồi quay lại báo bà.', mission: 'ĐANG LÀM · Giao kiện hàng cho Giao ở Chợ Nhỏ.', action: null, label: '' };
          case 'delivered':
            return { dialogue: 'Giao đã nhận hàng rồi phải không con? Bà cần biết kiện hàng đã tới nơi an toàn.', mission: 'ĐÃ GIAO HÀNG · Trở lại báo tin cho Bà mẹ quê.', action: 'report' as const, label: 'Báo đã giao hàng' };
          case 'completed':
            return { dialogue: 'Cảm ơn con. Giao đang ghi lại những món hàng bị lấy khỏi các sạp. Hãy hỏi xem cậu ấy tìm được gì.', mission: 'BƯỚC TIẾP THEO · Hỏi Giao về hàng bị tịch thu.', action: null, label: '' };
          case 'clue-revealed':
            return { dialogue: 'Giao đã tìm thấy dấu vết về lệnh thu gom hàng. Tảo có thể biết vì sao thuyền bị chặn ở cầu tre.', mission: 'MANH MỐI MỚI · Hỏi Tảo về vật chắn dưới cầu tre.', action: null, label: '' };
          case 'tao-informed':
            return { dialogue: 'Tảo đã giải thích vật chắn dưới cầu tre. Hãy câu Cá Cóc ở Bến Nước rồi chia cho ba hộ dân để học công thức Bẫy Tre Gai.', mission: 'BƯỚC TIẾP THEO · Câu Cá Cóc ở Bến Nước, chọn chia cá và giao cho ba hộ dân để mở Bẫy Tre Gai.', action: null, label: '' };
        }
      }
      switch (deliveryQuest.stage) {
        case 'carrying':
          return { dialogue: 'Bà mẹ quê gửi kiện hàng này tới chợ phải không? Ta nhận hàng. Nhiều sạp khác cũng bị Trưởng Đội Tuần Tra lấy mất hàng.', mission: 'GIAO HÀNG · Trao kiện hàng cho Giao.', action: 'deliver' as const, label: 'Giao kiện hàng' };
        case 'delivered':
          return { dialogue: 'Hàng đã được xếp an toàn. Nhiều sạp khác cũng bị Trưởng Đội Tuần Tra lấy mất hàng. Hãy quay lại bến báo cho Bà mẹ quê biết nhé.', mission: 'ĐÃ NHẬN HÀNG · Trở lại Bến Thuyền báo tin.', action: null, label: '' };
        case 'completed':
          return { dialogue: 'Ta đang ghi lại tên các hộ bị lấy hàng. Nếu muốn biết thêm, hãy hỏi ta về cuốn sổ hàng bị tịch thu.', mission: 'MANH MỐI · Tìm hiểu việc Trưởng Đội Tuần Tra tịch thu hàng.', action: 'reveal-clue' as const, label: 'Hỏi về hàng bị tịch thu' };
        case 'clue-revealed':
          return { dialogue: 'Cuốn sổ ghi rõ nhiều kiện hàng bị đưa qua chốt. Tảo từng thấy dây chắn dưới cầu tre; hãy hỏi anh ấy về lối qua sông.', mission: 'BƯỚC TIẾP THEO · Hỏi Tảo về vật chắn dưới cầu tre.', action: null, label: '' };
        case 'tao-informed':
          return { dialogue: 'Dấu dây chắn ấy là của bọn giữ chốt. Muốn qua sông an toàn, con hãy câu Cá Cóc ở Bến Nước rồi chia cho ba hộ dân; họ sẽ giúp con mở công thức Bẫy Tre Gai.', mission: 'BƯỚC TIẾP THEO · Câu Cá Cóc ở Bến Nước, chọn chia cá và giao cho ba hộ dân để mở Bẫy Tre Gai.', action: null, label: '' };
        case 'available':
          return { dialogue: selectedNpc.dialogue, mission: selectedNpc.mission, action: null, label: '' };
      }
    })()
    : null;
  const taoQuestConversation = selectedNpc?.id === 'fisherman-tao' && ['clue-revealed', 'tao-informed'].includes(deliveryQuest.stage)
    ? deliveryQuest.stage === 'clue-revealed'
      ? { dialogue: 'Cuốn sổ của Giao có nhắc đến dây chắn dưới cầu tre. Đúng vậy, ta từng thấy chúng được buộc vào cọc ở bến. Ta sẽ chỉ con cách chuẩn bị để vượt qua.', mission: 'MANH MỐI MỚI · Hỏi Tảo về vật chắn dưới cầu tre.', action: 'ask-tao' as const, label: 'Hỏi Tảo về vật chắn' }
      : { dialogue: 'Ta đã chỉ con dấu vết vật chắn. Hãy câu Cá Cóc ở Bến Nước rồi chia cho ba hộ dân; họ sẽ giúp con học công thức Bẫy Tre Gai để vượt chốt.', mission: 'BƯỚC TIẾP THEO · Câu Cá Cóc ở Bến Nước, chọn chia cá và giao cho ba hộ dân để mở Bẫy Tre Gai.', action: null, label: '' }
    : null;
  const npcQuestConversation = taoQuestConversation ?? deliveryQuestConversation;
  const deliveryQuestObjective = {
    available: 'Tìm Bà mẹ quê ở Bến Thuyền để nhận kiện hàng.',
    carrying: 'Mang kiện hàng đến Giao ở Chợ Nhỏ.',
    delivered: 'Quay lại Bến Thuyền báo tin cho Bà mẹ quê.',
    completed: 'Hỏi Giao về những món hàng bị tịch thu.',
    'clue-revealed': 'Hỏi Tảo về vật chắn dưới cầu tre.',
    'tao-informed': 'Câu Cá Cóc ở Bến Nước, chọn chia cá và giao cho ba hộ dân để mở Bẫy Tre Gai.',
  }[deliveryQuest.stage];
  const activeArea = OPENING_MAP_AREAS.find(area => area.id === activeAreaId);
  const riverCampaign = normalizeRiverCampaign(campaignProgress.riverCampaign);
  const activePeriod = openingMapDayPeriod(riverCampaign.timeMinutes);
  const selectedSchedule = selectedNpc?.schedule?.find(entry => entry.period === activePeriod);
  const dialogueText = npcQuestConversation?.dialogue ?? selectedSchedule?.dialogue ?? selectedNpc?.dialogue ?? '';
  const dialoguePages = splitOpeningMapDialogue(dialogueText);
  const visibleDialoguePage = dialoguePages[Math.min(dialoguePage, dialoguePages.length - 1)];
  useEffect(() => { setDialoguePage(0); setDialogueFinished(false); }, [dialogNpcId, dialogueText]);
  const clockLabel = `${String(Math.floor(riverCampaign.timeMinutes / 60)).padStart(2, '0')}:${String(riverCampaign.timeMinutes % 60).padStart(2, '0')}`;
  const lightPhase = openingMapLightPhase(riverCampaign.timeMinutes);
  const lightPhaseLabel = openingMapLightPhaseLabel(lightPhase);
  const weather = openingMapWeather(riverCampaign.day, riverCampaign.timeMinutes);
  const gameDateLabel = `${riverCampaign.day.slice(8, 10)}/${riverCampaign.day.slice(5, 7)}`;
  const patrolVisionRange = riverCampaign.patrolMap ? 120 : 240;
  useEffect(() => {
    if (!interactive || placingNpc || activePeriod !== 'evening') {
      setPatrolDetected(false);
      return;
    }
    const checkVision = () => {
      const detected = openingNpcs.some(npc => npc.kind === 'guard' && isInPatrolVision(
        npcPositionsRef.current.get(npc.id) ?? npc.point,
        npcFacingsRef.current.get(npc.id) ?? npc.facing,
        pointRef.current,
        patrolVisionRange,
      ));
      setPatrolDetected(current => current === detected ? current : detected);
    };
    checkVision();
    const timer = window.setInterval(checkVision, 150);
    return () => window.clearInterval(timer);
  }, [activePeriod, interactive, openingNpcs, patrolVisionRange, placingNpc]);
  const taoPosition = npcPositionsRef.current.get('fisherman-tao');
  const martialPosition = npcPositionsRef.current.get('woman-general');
  const atRiverbank = !!taoPosition && Math.hypot(pointRef.current.x - taoPosition.x, pointRef.current.y - taoPosition.y) <= 180;
  const atForge = !!martialPosition && Math.hypot(pointRef.current.x - martialPosition.x, pointRef.current.y - martialPosition.y) <= 180;
  return <section ref={rootRef} className={`opening-map${embedded ? ' opening-map--embedded' : ''}${showingOverview ? ' opening-map--overview' : ''}${placingNpc ? ' is-placing-npc' : ''}`} aria-label="Bản đồ khởi đầu" data-village-betrayed={riverCampaign.villageBetrayed || undefined} data-light-phase={lightPhase} data-weather={weather.type} tabIndex={0}
    onPointerDown={event => { if (!(event.target instanceof Element && event.target.closest('input,textarea,select,button,a'))) event.currentTarget.focus({ preventScroll: true }); }}
    onBlur={event => { if (embedded && !event.currentTarget.contains(event.relatedTarget)) stopMovement(); }}>
    <svg ref={artRef} className="opening-map-art" viewBox={`0 0 ${camera.width} ${camera.height}`} role="img" aria-labelledby={`opening-map-title-${uniqueId} opening-map-description-${uniqueId}`} preserveAspectRatio="xMidYMid meet" onClick={event => handleMapClick(event)}>
      <title id={`opening-map-title-${uniqueId}`}>Làng quê Việt Nam ven sông, tranh màu nước chuyển động</title>
      <desc id={`opening-map-description-${uniqueId}`}>Làng ven sông có y quán, sạp tò he, chợ đèn lồng, tửu lâu, bến cá, lò rèn, sân luyện võ, đầm lầy, sào huyệt Hắc Lang, vách đá của Huyết Đao Phượng, trạm thu thuế và tháp canh cầu gỗ. Bốn cửa nối đồi cây phía Bắc, bến sông phía Đông, ruộng lúa phía Nam và rừng tre phía Tây. Nhấn vào đường để di chuyển.</desc>
      <g ref={cameraLayerRef} data-opening-map-camera="" transform={`translate(${-camera.x} ${-camera.y})`}>
      <g id={artworkId} pointerEvents="none"><OpeningMapScenery idPrefix={uniqueId} simplified={walking} /></g>
      <OpeningMapNpcHomes simplified={walking} />
      {!checkpointOpen && <g className="opening-map-checkpoint-barrier" data-checkpoint-barrier="" pointerEvents="none">
        <path d="M3135 1436v128" stroke="#493b2c" strokeWidth="20" />
        <path d="M3135 1436v128" stroke="#a57b43" strokeWidth="12" />
        <path d="M3117 1450h36m-36 32h36m-36 32h36m-36 32h36" stroke="#594632" strokeWidth="8" strokeLinecap="round" />
        <path d="M3117 1450h36m-36 32h36m-36 32h36m-36 32h36" stroke="#c5a16b" strokeWidth="3" />
        <text x="3135" y="1424" textAnchor="middle">CHỐT CHẶN</text>
      </g>}
      {showingOverview && OPENING_MAP_AREAS.map(area => <g key={area.id} className={`opening-map-area opening-map-area--${area.type}${activeAreaId === area.id ? ' is-active' : ''}`} role="button" tabIndex={0} aria-label={`Đi đến ${area.name}`}
        onClick={event => { event.stopPropagation(); setWalkingDestination(area.point); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); setWalkingDestination(area.point); } }}>
        <rect x={area.point.x - 170} y={area.point.y - 28} width="340" height="56" rx="28" /><text x={area.point.x} y={area.point.y + 7} textAnchor="middle">{area.label}</text>
      </g>)}
      {destination && <g className="opening-map-destination" pointerEvents="none"><ellipse cx={destination.x} cy={destination.y} rx="24" ry="12" /><path d={`M${destination.x} ${destination.y}v-38l25 7-25 9`} /></g>}
      {[...openingNpcs].sort((left, right) => left.point.y - right.point.y).map(npc => <OpeningMapNpcMarker
        key={npc.id}
        npc={npc}
        selected={selectedNpcId === npc.id}
        showLocationLabel={showingOverview}
        interactionLabel={onNpcSelect ? 'Chọn ' : 'Trò chuyện với '}
        visionRange={interactive && activePeriod === 'evening' && npc.kind === 'guard' ? patrolVisionRange : undefined}
        onInteract={() => interactWithNpc(npc)}
        onPosition={updateNpcPosition}
      />)}
      {interactive && <g className="opening-map-rest-point" data-rest-point="" role="button" tabIndex={0} aria-label="Nghỉ qua đêm tại chõng tre"
        transform={`translate(${OPENING_MAP_REST_POINT.x} ${OPENING_MAP_REST_POINT.y})`}
        onClick={event => { event.stopPropagation(); restAtDock(); }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); restAtDock(); } }}>
        <circle r="38" /><path d="M-13 1h26m-23 0v12m20-12v12m-24-15h28m-25-3v-7h22v7" /><text y="28" textAnchor="middle">NGHỈ</text>
      </g>}
      {interactive && !riverCampaign.waterQuestComplete && !riverCampaign.waterItemCarried && <g className="opening-map-water-quest" data-water-quest="" role="button" tabIndex={0} aria-label="Múc gáo nước tại chum"
        transform="translate(2987 1976)"
        onClick={event => {
          event.stopPropagation();
          if (applyCampaignAction({ type: 'mother-water' })) setAreaNotice('Đã múc gáo nước sạch · hãy mang về cho Bà mẹ quê.');
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            if (applyCampaignAction({ type: 'mother-water' })) setAreaNotice('Đã múc gáo nước sạch · hãy mang về cho Bà mẹ quê.');
          }
        }}>
        <circle r="26" /><text textAnchor="middle" y="5">NƯỚC</text>
      </g>}
      <ellipse ref={playerShadowRef} cx={point.x} cy={point.y + 3} rx="21" ry="7" fill="#243c304a" pointerEvents="none" />
      <foreignObject ref={playerPositionRef} x={point.x - 46} y={point.y - 121} width="92" height="128" className="opening-map-overview-player"><div ref={playerBodyRef} className={`opening-map-player${walking ? ' is-walking' : ''}`} role="img" aria-label={playerName ?? 'Nhân vật chính'} data-player-x={Math.round(point.x)} data-player-y={Math.round(point.y)}>
        {previewNpc
          ? <OpeningMapNpcArtwork npcId={previewNpc.id} className="opening-map-player__sprite" appearance={previewNpc.appearance} design={previewNpc.design} artwork={previewNpc.artwork} pose={previewNpc.pose} facing={previewMotion?.facing ?? previewNpc.facing} action={previewMotion?.action} frame={previewMotion?.frame} playing={previewMotion?.playing} />
          : <CharacterSprite className="opening-map-player__sprite" appearance={appearance ?? profile.appearance} customization={appearance ? undefined : profile.customization} startingCharacter={startingCharacter === null ? undefined : startingCharacter ?? profile.startingCharacterId} spriteSheet={playerSpriteSheet} facing={previewMotion?.facing ?? facing}
            walking={walking || previewMotion?.action === 'walk' || previewMotion?.action === 'run'} running={running || previewMotion?.action === 'run'} spriteAction={previewMotion?.action} spriteFrame={previewMotion?.frame} spritePlaying={previewMotion?.playing} aria-hidden="true" />}
      </div></foreignObject>
      <g ref={foregroundRef} className="opening-map-scenery opening-map-foreground" aria-hidden="true" />
      </g>
    </svg>
    <div className={`opening-map-atmosphere opening-map-atmosphere--${lightPhase} opening-map-atmosphere--${weather.type}`} aria-hidden="true">
      <div className="opening-map-atmosphere__light" />
      {weather.type === 'rain' && <div className="opening-map-atmosphere__rain">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ left: `${index * 6}%`, animationDelay: `${-index * .17}s` }} />)}</div>}
      {lightPhase === 'night' && <div className="opening-map-atmosphere__fireflies">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ left: `${8 + index * 8}%`, top: `${25 + index % 4 * 13}%`, animationDelay: `${-index * .43}s` }} />)}</div>}
    </div>
    <header className="opening-map-location"><span className="opening-map-location__mark" aria-hidden="true">❧</span><div><span>LÀNG VEN SÔNG</span><h1>{activeArea?.name ?? 'Đường làng Mê Linh'}</h1><p>{weather.label} · {lightPhaseLabel}</p></div></header>
    {interactive && <div className={`opening-map-clock opening-map-clock--${lightPhase}`} aria-label="Thời gian và thời tiết trong game">
      <span className="opening-map-clock__date">LỊCH XÓM · {gameDateLabel}</span>
      <div className="opening-map-clock__main"><span className="opening-map-clock__sun" aria-hidden="true">{lightPhase === 'night' ? '☾' : lightPhase === 'dawn' || lightPhase === 'sunset' ? '◒' : '☼'}</span><strong>{clockLabel}</strong><span className="opening-map-clock__phase">{lightPhaseLabel}</span></div>
      <div className="opening-map-clock__weather" data-weather={weather.type}><span aria-hidden="true">{weather.icon}</span>{weather.label}</div>
      <button type="button" onClick={() => applyCampaignAction({ type: 'wait-hour' })}>Chờ thêm 1 giờ</button>
    </div>}
    {interactive && riverCampaign.villageBetrayed && <p className="opening-map-area-notice" role="status">Dân làng đã lánh nạn · lính tuần tra Đông Hán xuất hiện trong thôn.</p>}
    {interactive && activePeriod === 'evening' && openingNpcs.some(npc => npc.kind === 'guard') && <p className={`opening-map-patrol-alert${patrolDetected ? ' is-detected' : ''}`} role="status" data-patrol-vision-range={patrolVisionRange}>
      {patrolDetected ? 'Bạn đang trong tầm mắt tuần tra! Hãy khuất khỏi hướng nhìn của lính gác.' : `Tầm nhìn tuần tra ban đêm: ${patrolVisionRange} · ${riverCampaign.patrolMap ? 'Bản đồ tuần tra giảm 50% tầm phát hiện.' : 'Đi theo hướng khuất để tránh bị phát hiện.'}`}
    </p>}
    {miniMapOpen ? <aside id={`opening-map-minimap-${uniqueId}`} className="opening-map-minimap" aria-label="Bản đồ thu nhỏ">
      <header className="opening-map-minimap__header"><span className="opening-map-minimap__compass" aria-hidden="true">⌖</span><div><strong>Mê Linh</strong><small>BỐN MIỀN · MỘT LÀNG QUÊ</small></div><button type="button" aria-expanded="true" aria-controls={`opening-map-minimap-${uniqueId}`} aria-label="Ẩn bản đồ nhỏ" onClick={() => setMiniMapOpen(false)}>−</button></header>
      <div className="opening-map-minimap__viewport"><svg viewBox={`0 0 ${OPENING_MAP_WIDTH} ${OPENING_MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Toàn cảnh bản đồ thu nhỏ, nhấn để di chuyển" onClick={event => handleMapClick(event, { x: 0, y: 0, width: OPENING_MAP_WIDTH, height: OPENING_MAP_HEIGHT })}>
        <use href={`#${artworkId}`} />
        {OPENING_MAP_AREAS.map(area => <circle key={area.id} cx={area.point.x} cy={area.point.y} r="30" className={`opening-map-minimap__area-pin opening-map-minimap__area-pin--${area.type}`}><title>{area.name}</title></circle>)}
        {openingNpcs.map(npc => <circle key={npc.id} ref={element => {
          if (element) {
            minimapNpcRefs.current.set(npc.id, element);
            const npcPoint = npcPositionsRef.current.get(npc.id) ?? npc.point;
            element.setAttribute('cx', String(npcPoint.x));
            element.setAttribute('cy', String(npcPoint.y));
          } else minimapNpcRefs.current.delete(npc.id);
        }} cx={npc.point.x} cy={npc.point.y} r="25" className="opening-map-minimap__npc-pin"><title>{npc.name} · {npc.locationLabel}</title></circle>)}
        <rect ref={minimapCameraRef} x={followCameraX} y={followCameraY} width={followWidth} height={followHeight} rx="18" className="opening-map-minimap__camera" /><circle ref={minimapPlayerRef} cx={point.x} cy={point.y} r="40" className="opening-map-minimap__player-pin" /><path ref={minimapDirectionRef} d={`M${point.x} ${point.y - 28}l-18 38h36z`} className="opening-map-minimap__player-direction" />
      </svg><span className="opening-map-minimap__north" aria-hidden="true">B ↑</span><span className="opening-map-minimap__zoom">DIỆN TÍCH ×10</span></div>
      <footer className="opening-map-minimap__footer"><span><i className="is-player" /> BẠN ĐANG Ở ĐÂY</span><button type="button" onClick={() => setWalkingDestination(OPENING_MAP_SPAWN)}>Đến chợ ↗</button></footer>
    </aside> : <button className="opening-map-minimap-collapsed" type="button" aria-expanded="false" aria-controls={`opening-map-minimap-${uniqueId}`} aria-label="Hiện bản đồ nhỏ" title="Bản đồ thu nhỏ" onClick={() => setMiniMapOpen(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></svg></button>}
    <div className="opening-map-view-controls" aria-label="Góc nhìn bản đồ">
      {!overview && <button type="button" className={showingOverview ? 'is-active' : ''} aria-pressed={showingOverview} onClick={() => setFullMap(value => !value)}><kbd>M</kbd>{showingOverview ? 'Theo nhân vật' : 'Toàn cảnh'}</button>}
      {!showingOverview && <div className="opening-map-zoom-controls"><button type="button" aria-label="Thu nhỏ góc nhìn" disabled={zoom <= .75} onClick={() => setZoom(value => Math.max(.75, value - .25))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Phóng to góc nhìn" disabled={zoom >= 1.75} onClick={() => setZoom(value => Math.min(1.75, value + .25))}>+</button></div>}
    </div>
    {interactive && <><VirtualJoystick onChange={setJoystickVector} resetKey={selectedNpc ? 1 : 0} /><button className={`opening-map-run${touchRunning ? ' is-active' : ''}`} type="button" aria-label="Bật chạy nhanh" aria-pressed={touchRunning} onClick={() => setTouchRunning(value => !value)}>Chạy</button><div className="opening-map-controls-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> di chuyển</span><span><kbd>Shift</kbd> chạy</span><span className="opening-map-controls-hint__click">Chạm đường để đi</span></div></>}
    {areaNotice && <p className="opening-map-area-notice" role="status">{areaNotice}</p>}
    {showingOverview && !placingNpc && <p className="opening-map-overview-hint">Chọn một vùng để đi đến đó</p>}
    {placingNpc && <p className="opening-map-placement-hint" role="status">Bấm vào đất trống để đặt nhân vật · tránh sông và nhà.</p>}
    {interactive && <div className={`opening-map-panels${openMapPanel ? ' has-open-panel' : ''}`}>
      {openMapPanel && <section className={`opening-map-panel${isCharacterPanel ? ' is-character' : ''}`} aria-label={isCharacterPanel ? 'Nhân vật' : openMapPanel === 'bag' ? 'Hành trang' : openMapPanel === 'quest' ? 'Nhiệm vụ' : openMapPanel === 'skills' ? 'Công pháp' : 'Nghề nghiệp'} aria-live="polite">
        <button className="opening-map-panel__close" type="button" aria-label="Đóng bảng" onClick={() => setOpenMapPanel(null)}>×</button>
        <span className="opening-map-panel__eyebrow">{isCharacterPanel ? 'HỒ SƠ NHÂN VẬT' : 'TIỂU MÔNG · HỒ SƠ PHIÊU LƯU'}</span>
        <h2>{isCharacterPanel ? 'Nhân vật' : openMapPanel === 'bag' ? 'Hành trang' : openMapPanel === 'quest' ? 'Nhiệm vụ' : openMapPanel === 'skills' ? 'Công pháp' : 'Nghề nghiệp'}</h2>
        {isCharacterPanel && <div className="opening-map-panel__tabs opening-map-panel__tabs--character" role="tablist" aria-label="Thông tin nhân vật">
          {CHARACTER_PANEL_TABS.map(([id, label]) => <button
            key={id}
            id={`opening-map-tab-${id}-${uniqueId}`}
            type="button"
            role="tab"
            aria-selected={openMapPanel === id}
            aria-controls={`opening-map-tabpanel-${id}-${uniqueId}`}
            onClick={() => setOpenMapPanel(id)}
          >{label}</button>)}
        </div>}
        <div id={`opening-map-tabpanel-${openMapPanel}-${uniqueId}`} className="opening-map-panel__content" role={isCharacterPanel ? 'tabpanel' : undefined} aria-labelledby={isCharacterPanel ? `opening-map-tab-${openMapPanel}-${uniqueId}` : undefined}>
        {isCharacterPanel ? <>
          {openMapPanel === 'character-overview' && <>
          <header className="opening-map-profile">
            <div className="opening-map-profile__portrait"><CharacterSprite
              appearance={appearance ?? profile.appearance}
              customization={profile.customization}
              startingCharacter={startingCharacter ?? profile.startingCharacterId}
              spriteSheet={playerSpriteSheet}
              facing="down"
              className="opening-map-profile__sprite"
              role="img"
              aria-label={`Chân dung ${playerName || profile.displayName || HERO_BIOGRAPHY.title}`}
            /></div>
            <div><span>{HERO_BIOGRAPHY.epithet}</span><strong>{playerName || profile.displayName || HERO_BIOGRAPHY.title}</strong><small>{HERO_BIOGRAPHY.age} · {HERO_BIOGRAPHY.home}</small></div>
          </header>
          <div className="opening-map-profile-overview"><p>Một thiếu niên lớn lên bên sông Mê Linh, đang bắt đầu hành trình của mình.</p></div>
          </>}
          {openMapPanel === 'character-stats' && <>
          <section className="opening-map-profile-section" aria-labelledby={`opening-map-profile-status-${uniqueId}`}>
            <h3 id={`opening-map-profile-status-${uniqueId}`}>Trạng thái hiện tại</h3>
            <div className="opening-map-profile-resources">
              <div><span>Khí huyết</span><strong>{riverCampaign.hp}/{riverCampaign.maxHp} HP</strong><i role="progressbar" aria-label="Khí huyết" aria-valuenow={riverCampaign.hp} aria-valuemin={0} aria-valuemax={riverCampaign.maxHp}><b style={{ width: `${Math.max(0, Math.min(100, riverCampaign.hp / riverCampaign.maxHp * 100))}%` }} /></i></div>
              <div><span>Nội lực</span><strong>{riverCampaign.mp}/{riverCampaign.maxMp} MP</strong><i role="progressbar" aria-label="Nội lực" aria-valuenow={riverCampaign.mp} aria-valuemin={0} aria-valuemax={riverCampaign.maxMp}><b style={{ width: `${Math.max(0, Math.min(100, riverCampaign.mp / riverCampaign.maxMp * 100))}%` }} /></i></div>
            </div>
            <div className="opening-map-profile__currencies"><span>Thể lực ngày <strong>{riverCampaign.actionPoints}/3 AP</strong></span><span>Văn tiền <strong>{riverCampaign.vanTien}</strong></span></div>
          </section>
          <section className="opening-map-profile-section" aria-labelledby={`opening-map-profile-attributes-${uniqueId}`}>
            <h3 id={`opening-map-profile-attributes-${uniqueId}`}>Chỉ số căn bản</h3>
            <div className="opening-map-profile-attributes">{HERO_BASE_ATTRIBUTES.map(attribute => {
              const value = {
                health: riverCampaign.maxHp,
                'inner-force': riverCampaign.maxMp,
                insight: attribute.value + riverCampaign.insightBonus,
                agility: profile.heroDevelopment.talent === 'keen-senses' ? Math.round(attribute.value * 1.2) : attribute.value,
                virtue: riverCampaign.morality,
                corruption: riverCampaign.evil,
              }[attribute.id];
              return <article key={attribute.id}><span>{attribute.label}</span><strong>{value} <small>{attribute.unit}</small></strong><p>{attribute.description}</p></article>;
            })}
              <article><span>Mị lực</span><strong>{50 + riverCampaign.charismaBonus} <small>điểm</small></strong><p>Ảnh hưởng đến giao tiếp và các lựa chọn tình báo.</p></article>
              <article><span>May mắn</span><strong>{50 + riverCampaign.luckBonus} <small>điểm</small></strong><p>Tăng từ vật phẩm sưu tầm và các lựa chọn phụ.</p></article>
            </div>
          </section>
          </>}
          {openMapPanel === 'character-talents' && <>
          <section className="opening-map-profile-section" aria-labelledby={`opening-map-profile-talent-${uniqueId}`}>
            <h3 id={`opening-map-profile-talent-${uniqueId}`}>Thiên phú khởi đầu</h3>
            <div className="opening-map-profile-talents">{HERO_STARTING_TALENTS.map(talent => <article key={talent.id} className={profile.heroDevelopment.talent === talent.id ? 'is-selected' : ''}>
              <strong>{talent.name}{profile.heroDevelopment.talent === talent.id && <small>ĐANG DÙNG</small>}</strong><p>{talent.description}</p>
            </article>)}</div>
            <p className="opening-map-panel__footnote">{profile.heroDevelopment.talent ? 'Thiên phú đã chọn được áp dụng trong hành trình.' : 'Chưa chọn thiên phú; có thể chọn trong phần phát triển nhân vật.'}</p>
          </section>
          </>}
          {openMapPanel === 'character-story' && <>
          <section className="opening-map-profile-section" aria-labelledby={`opening-map-profile-story-${uniqueId}`}>
            <h3 id={`opening-map-profile-story-${uniqueId}`}>Tiểu sử</h3>
            <div className="opening-map-profile-story">{HERO_BIOGRAPHY.story.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            <dl className="opening-map-profile-facts"><div><dt>Tính cách</dt><dd>{HERO_BIOGRAPHY.personality}</dd></div><div><dt>Động lực</dt><dd>{HERO_BIOGRAPHY.motivation}</dd></div><div><dt>Hành trình</dt><dd>{HERO_BIOGRAPHY.arc}</dd></div></dl>
          </section>
          </>}
          {openMapPanel === 'character-path' && <>
          <section className="opening-map-profile-section" aria-labelledby={`opening-map-profile-path-${uniqueId}`}>
            <h3 id={`opening-map-profile-path-${uniqueId}`}>Định hướng</h3>
            <div className="opening-map-profile-paths">{HERO_ALIGNMENT_PATHS.map(path => <article key={path.id} className={profile.heroDevelopment.alignmentGoal === path.id ? 'is-selected' : ''}>
              <strong>{path.name}</strong><small>{path.alignment} · hiện tại {path.id === 'righteous' ? riverCampaign.morality : riverCampaign.evil}/100 · mốc {path.alignmentThreshold}</small><p>{path.style}</p><p>Cần thiên phú: {path.requiredTalent} · Bí kíp: {path.requiredManual}</p>
            </article>)}</div>
          </section>
          </>}
          {openMapPanel === 'character-skills' && <>
          <section className="opening-map-profile-section" aria-labelledby={`opening-map-profile-skills-${uniqueId}`}>
            <h3 id={`opening-map-profile-skills-${uniqueId}`}>Võ học và kỹ năng</h3>
            <div className="opening-map-skill-list">{HERO_SKILL_TREE.map(skill => <article className="opening-map-skill" key={skill.id}>
              <span className="opening-map-skill__icon"><SkillIcon skill={skill.id as SkillVfxSkill} /></span>
              <div><small>{skill.kind} · {skill.branch}</small><strong>{skill.name}</strong><p>{skill.action}</p><p>{skill.effect}</p><footer>{skill.innerForce > 0 && <span>{skill.innerForce} MP</span>}{skill.cooldown !== null && skill.cooldown > 0 && <span>Hồi {skill.cooldown} lượt</span>}<span>{skill.unlock}</span></footer></div>
            </article>)}
              {riverCampaign.inventory.SKILL_DA_NGUU_BAI_TUONG && <article className="opening-map-skill">
                <span className="opening-map-skill__icon" aria-hidden="true">☯</span>
                <div><small>Tâm pháp ẩn · Hạc Lão</small><strong>Đả Ngưu Bái Tướng</strong><p>Đòn đánh cận chiến bí truyền, gây 220 sát thương cơ bản.</p><footer><span>40 MP · 1 AP · cần đứng kề mục tiêu</span></footer></div>
              </article>}
            </div>
          </section>
          </>}
        </> : openMapPanel === 'bag' ? <>
          <h3>Túi đồ</h3>
          {deliveryQuest.stage === 'carrying' && <article className="opening-map-bag-item is-active">
              <span className="opening-map-bag-item__icon" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M12 16h24l3 25H9l3-25Z" /><path d="M17 16v-3a7 7 0 0 1 14 0v3M12 23h24M18 29h12M16 35h16" /></svg>
              </span>
              <span className="opening-map-bag-item__details"><strong>Kiện hàng bọc vải</strong><small>VẬT PHẨM NHIỆM VỤ</small><span>Đang có trong túi</span></span>
              <span className="opening-map-bag-item__status">×1</span>
            </article>}
          {riverCampaign.motherChoice && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">◉</span><span className="opening-map-bag-item__details"><strong>Nhẫn đồng gia truyền</strong><small>VẬT PHẨM NHIỆM VỤ</small><span>Vật kỷ niệm của Bà mẹ quê</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.waterItemCarried && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">◉</span><span className="opening-map-bag-item__details"><strong>Gáo nước sông Đáy</strong><small>VẬT PHẨM NHIỆM VỤ</small><span>Mang về cho Bà mẹ quê</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.inventory.BOOK_LAC_THUY_DAO_PHAP && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">📖</span><span className="opening-map-bag-item__details"><strong>Lạc Thủy Đao Pháp</strong><small>BÍ KÍP VÕ HỌC</small><span>Nhận sau khi tỷ thí Khiêm Tốn với Võ Sư Nương</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.patrolMap && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🗺️</span><span className="opening-map-bag-item__details"><strong>Bản Đồ Tuần Tra</strong><small>VẬT PHẨM NHIỆM VỤ</small><span>Mở thuốc hồi HP giá rẻ</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.inventory.ITEM_MAT_THU_DONG_HAN && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">📜</span><span className="opening-map-bag-item__details"><strong>Mật Thư Đông Hán</strong><small>VẬT PHẨM TÀ ĐẠO</small><span>Bằng chứng đã bán đứng dân làng</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.inventory.WEAPON_DONG_HAN_SWORD && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🗡️</span><span className="opening-map-bag-item__details"><strong>Kiếm Đông Hán</strong><small>VŨ KHÍ</small><span>Chiến lợi phẩm tại Chốt Chặn</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.inventory.CLOTHES_ME_LINH_HIEP_SI && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🥋</span><span className="opening-map-bag-item__details"><strong>Trang phục Mê Linh Hiệp Sĩ</strong><small>TRANG PHỤC</small><span>Phần thưởng tha mạng Trưởng Đội</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.healthPotionCount > 0 && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🧪</span><span className="opening-map-bag-item__details"><strong>Thuốc hồi HP</strong><small>DƯỢC PHẨM</small><span>Hồi tối đa 150 HP</span></span><span className="opening-map-bag-item__status">×{riverCampaign.healthPotionCount}</span></article>}
          {riverCampaign.trapRecipe && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🎋</span><span className="opening-map-bag-item__details"><strong>Công thức Bẫy Tre Gai</strong><small>BÍ KÍP CHẾ TẠO</small><span>Đã mở công thức chế tạo</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.oldBamboo > 0 && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🎋</span><span className="opening-map-bag-item__details"><strong>Thân tre già</strong><small>NGUYÊN LIỆU</small><span>Dùng để đặt Bẫy Tre Gai tại Chốt Chặn</span></span><span className="opening-map-bag-item__status">×{riverCampaign.oldBamboo}</span></article>}
          {riverCampaign.daggerForged && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🗡️</span><span className="opening-map-bag-item__details"><strong>Dao Găm Thép Mê Linh</strong><small>VŨ KHÍ</small><span>{riverCampaign.daggerPoisoned ? 'Đã tẩm độc' : 'Đã trang bị'}</span></span><span className="opening-map-bag-item__status">×1</span></article>}
          {riverCampaign.fishStock > 0 && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🐟</span><span className="opening-map-bag-item__details"><strong>Cá Sông Đáy</strong><small>VẬT PHẨM CÂU CÁ</small><span>Có thể bán cho Giao hoặc nấu ăn</span></span><span className="opening-map-bag-item__status">×{riverCampaign.fishStock}</span></article>}
          {riverCampaign.ironOre > 0 && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">⛏️</span><span className="opening-map-bag-item__details"><strong>Quặng sắt</strong><small>NGUYÊN LIỆU</small><span>Dùng để rèn vũ khí</span></span><span className="opening-map-bag-item__status">×{riverCampaign.ironOre}</span></article>}
          {riverCampaign.baitCount + riverCampaign.premiumBaitCount > 0 && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">🪱</span><span className="opening-map-bag-item__details"><strong>Mồi câu thường / mồi xịn</strong><small>NGUYÊN LIỆU</small><span>Dùng cho lần câu tiếp theo</span></span><span className="opening-map-bag-item__status">×{riverCampaign.baitCount + riverCampaign.premiumBaitCount}</span></article>}
          {riverCampaign.poisonSupplies > 0 && <article className="opening-map-bag-item"><span className="opening-map-bag-item__icon">☠️</span><span className="opening-map-bag-item__details"><strong>Dược liệu pha độc</strong><small>NGUYÊN LIỆU TÀ ĐẠO</small><span>Có thể tẩm vào dao găm</span></span><span className="opening-map-bag-item__status">×{riverCampaign.poisonSupplies}</span></article>}
          {Object.entries(riverCampaign.inventory).filter(([id]) => id in OPENING_SIDE_ITEM_LABELS).map(([id, count]) => <article className="opening-map-bag-item" key={id}>
            <span className="opening-map-bag-item__icon" aria-hidden="true">✦</span><span className="opening-map-bag-item__details"><strong>{OPENING_SIDE_ITEM_LABELS[id]}</strong><small>VẬT PHẨM NPC</small><span>Đã lưu trong hành trang</span></span><span className="opening-map-bag-item__status">×{count}</span>
          </article>)}
          {deliveryQuest.stage !== 'carrying' && !riverCampaign.motherChoice && !riverCampaign.waterItemCarried && !riverCampaign.trapRecipe && !riverCampaign.daggerForged && riverCampaign.fishStock === 0 && riverCampaign.ironOre === 0 && riverCampaign.baitCount + riverCampaign.premiumBaitCount === 0 && riverCampaign.poisonSupplies === 0 && riverCampaign.healthPotionCount === 0 && Object.values(riverCampaign.inventory).every(count => count < 1)
            && <div className="opening-map-bag-empty"><span aria-hidden="true">◇</span><strong>Túi đồ đang trống</strong><p>Nhận vật phẩm để xem trong túi đồ.</p></div>}
        </> : openMapPanel === 'quest' ? <>
          <h3>Nhiệm vụ chính</h3>
          <article className="opening-map-quest-card opening-map-quest-card--river">
            <header><span className="opening-map-quest-card__mark" aria-hidden="true">✦</span><div><strong>HƠI THỞ QUÊ HƯƠNG</strong><small>{riverCampaign.motherChoice ? 'ĐÃ NHẬN NHẪN' : riverCampaign.mainQuestActivated ? 'ĐANG CHỜ LỰA CHỌN' : 'CHƯA KÍCH HOẠT'}</small></div></header>
            <div className="opening-map-quest-card__giver"><span aria-hidden="true">⚑</span><span><small>NGƯỜI GIAO NHIỆM VỤ</small><strong>Bà mẹ quê · Bến Thuyền</strong></span></div>
            <div className="opening-map-quest-card__objective"><small>MỤC TIÊU</small><strong>{riverCampaign.motherChoice
              ? riverCampaign.motherChoice === 'righteous' ? 'Giữ lời hứa bảo vệ dân làng; chèo thuyền đi nhanh đã mở.' : 'Giữ chiếc nhẫn và đối mặt với lựa chọn Tà đạo.'
              : riverCampaign.mainQuestActivated ? 'Nói chuyện với bà và chọn cách nhận chiếc nhẫn đồng gia truyền.'
                : 'Nghỉ tại chõng tre nhà bà để thức dậy và tự động nhận nhiệm vụ.'}</strong></div>
            <div className="opening-map-quest-card__objective"><small>VIỆC PHỤ · GÁO NƯỚC SÔNG ĐÁY</small><strong>{riverCampaign.waterQuestComplete ? 'Đã mang nước sạch · Khí Huyết tối đa +50.' : 'Tương tác chum nước sạch ngoài hiên để tăng vĩnh viễn 50 HP tối đa.'}</strong></div>
          </article>
          <article className="opening-map-quest-card">
            <header><span className="opening-map-quest-card__mark" aria-hidden="true">✦</span><div><strong>GIAO HÀNG</strong><small>{deliveryQuest.stage === 'tao-informed' ? 'ĐANG CHUẨN BỊ' : deliveryQuest.stage === 'completed' || deliveryQuest.stage === 'clue-revealed' ? 'ĐÃ HOÀN THÀNH' : 'NHIỆM VỤ CHÍNH'}</small></div><span className="opening-map-quest-card__count">{deliveryQuest.stage === 'available' ? '0/4' : deliveryQuest.stage === 'carrying' ? '1/4' : deliveryQuest.stage === 'delivered' ? '2/4' : deliveryQuest.stage === 'completed' ? '3/4' : '4/4'}</span></header>
            <div className="opening-map-quest-card__giver"><span aria-hidden="true">⚑</span><span><small>NGƯỜI GIAO NHIỆM VỤ</small><strong>Bà mẹ quê · Bến Thuyền</strong></span></div>
            <ol className="opening-map-steps">
              <li className={deliveryQuest.stage === 'available' ? 'is-current' : 'is-done'}><span>{deliveryQuest.stage === 'available' ? '1' : '✓'}</span><div><strong>Nhận kiện hàng</strong><small>Bến Thuyền · Bà mẹ quê</small></div></li>
              <li className={deliveryQuest.stage === 'carrying' ? 'is-current' : ['delivered', 'completed', 'clue-revealed', 'tao-informed'].includes(deliveryQuest.stage) ? 'is-done' : 'is-pending'}><span>{deliveryQuest.stage === 'carrying' ? '2' : ['delivered', 'completed', 'clue-revealed', 'tao-informed'].includes(deliveryQuest.stage) ? '✓' : '2'}</span><div><strong>Giao hàng cho Giao</strong><small>Chợ Nhỏ · Dãy sạp chợ</small></div></li>
              <li className={deliveryQuest.stage === 'delivered' ? 'is-current' : ['completed', 'clue-revealed', 'tao-informed'].includes(deliveryQuest.stage) ? 'is-done' : 'is-pending'}><span>{deliveryQuest.stage === 'delivered' ? '3' : ['completed', 'clue-revealed', 'tao-informed'].includes(deliveryQuest.stage) ? '✓' : '3'}</span><div><strong>Báo lại Bà mẹ quê</strong><small>Bến Thuyền · Phía Đông</small></div></li>
              <li className={deliveryQuest.stage === 'clue-revealed' ? 'is-current' : deliveryQuest.stage === 'tao-informed' ? 'is-done' : 'is-pending'}><span>{deliveryQuest.stage === 'tao-informed' ? '✓' : '4'}</span><div><strong>Hỏi Tảo về vật chắn</strong><small>Bến Nước · Tảo</small></div></li>
            </ol>
            <div className="opening-map-quest-card__objective"><small>{['completed', 'clue-revealed', 'tao-informed'].includes(deliveryQuest.stage) ? 'MANH MỐI TIẾP THEO' : 'MỤC TIÊU HIỆN TẠI'}</small><strong>{deliveryQuestObjective}</strong></div>
          </article>
          {OPENING_MAP_SIDE_NPC_IDS.filter(id => id !== 'inn-server' && id !== 'fruit-aunt-tu').map(id => {
            const npc = openingNpcs.find(character => character.id === id);
            const stage = riverCampaign.npcQuestStages[id] ?? 0;
            if (!npc) return null;
            const completed = id === 'singer-le-nuong' ? stage === 4 || stage === 5 : stage >= 3;
            const awaitingChoice = id === 'singer-le-nuong' && stage === 3;
            const objective = completed ? 'Đã hoàn thành'
              : awaitingChoice ? 'Đã nhận tin tình báo · chọn chia sẻ hoặc giữ bí mật'
                : stage === 0 && id === 'herbalist-lang' ? 'Chưa nhận · tìm Xuyên Khung ven suối, rồi mang về giao'
                  : stage === 0 && id === 'smith-thiet-chuy' ? 'Chưa nhận · tìm đủ 2 quặng sắt ở suối nguồn'
                    : stage === 0 && id === 'woodcutter' ? 'Chưa nhận · dọn bầy sói trên đường mòn phía tây'
                      : stage === 0 && id === 'village-captain' ? 'Chưa nhận · truy bắt băng cướp quấy rối dân làng'
                        : stage === 0 && id === 'singer-le-nuong' ? 'Chưa nhận · trả 15 Văn tiền để nhận tin tình báo'
                          : stage === 0 && id === 'beggar-hac-lao' ? `Chưa nhận · cần 1 bánh bao và 1 rượu nếp (${riverCampaign.inventory.ITEM_BANH_BAO ?? 0}/1, ${riverCampaign.inventory.ITEM_RUOU_NEP ?? 0}/1)`
                            : stage === 0 && id === 'toy-seller' ? 'Chưa nhận · tò he may mắn giá 15 Văn tiền'
                              : stage === 0 && id === 'herdboy-a-sang' ? 'Chưa nhận · hỏi chỉ đường tắt miễn phí'
                                : id === 'herbalist-lang' ? stage === 2 ? 'Mang Xuyên Khung về giao cho Lão Lang Trung' : 'Tìm Xuyên Khung ven suối, rồi mang về giao'
                                  : id === 'smith-thiet-chuy' ? `Tìm đủ 2 quặng sắt · hiện có ${riverCampaign.ironOre}/2`
                                    : id === 'woodcutter' ? 'Dọn bầy sói hoang trên đường mòn phía tây'
                                      : id === 'village-captain' ? 'Truy bắt băng cướp quấy rối dân làng'
                                        : 'Hoàn thành việc đã nhận';
            return <article className="opening-map-quest-card" key={id}>
              <header><span className="opening-map-quest-card__mark" aria-hidden="true">✦</span><div><strong>{npc.name}</strong><small>{completed ? 'ĐÃ HOÀN THÀNH' : awaitingChoice ? 'CHỜ CHỌN HƯỚNG' : stage > 0 ? 'ĐANG THỰC HIỆN' : 'CÓ THỂ NHẬN'}</small></div></header>
              <div className="opening-map-quest-card__objective"><small>MỤC TIÊU</small><strong>{objective}</strong></div>
            </article>;
          })}
        </> : openMapPanel === 'skills' ? <>
          <h3>Công pháp & chiêu thức</h3>
          <p className="opening-map-panel__intro">Bộ võ học sông nước của Tiểu Mông. Điều kiện mở khóa được ghi rõ trên từng bí kíp.</p>
          <p className="opening-map-panel__intro">{riverCampaign.morality >= 60
            ? 'Đã đủ Đạo Đức để nhận Hà Bá Tức Công · trang bị để hồi 3% HP/MP mỗi lượt chiến đấu cạnh sông.'
            : `Hà Bá Tức Công cần Đạo Đức ≥60 · hiện tại ${riverCampaign.morality}.`}
            {' '}{riverCampaign.knowsDaoManual ? 'Đã học Lạc Thủy Đao Pháp.' : 'Lạc Thủy Đao Pháp học được sau buổi thử tập với Võ Sư Nương.'}
            {' '}{riverCampaign.evil >= 50 ? 'Đã mở Sát Thủ Sổ Tay / Độc Thiểm Thư.' : `Độc Thiểm Thư cần Tà Khí ≥50 · hiện tại ${riverCampaign.evil}.`}
            {' '}{riverCampaign.poisonRecipeUnlocked ? 'Lão Lang Trung đã mở công thức độc/dược liệu.' : 'Công thức độc/dược liệu chưa mở.'}
            {' '}{riverCampaign.inventory.SKILL_DA_NGUU_BAI_TUONG ? 'Đã học tâm pháp Đả Ngưu Bái Tướng từ Hạc Lão.' : 'Tâm pháp ẩn của Hạc Lão chưa được truyền.'}
          </p>
          {riverCampaign.morality >= 60 && <button type="button" onClick={() => applyCampaignAction({ type: 'equip-ha-ba', equipped: !riverCampaign.haBaEquipped })}>
            {riverCampaign.haBaEquipped ? 'Tháo Hà Bá Tức Công' : 'Trang bị Hà Bá Tức Công'}
          </button>}
          <div className="opening-map-skill-list">{HERO_SKILL_TREE.map(skill => <article className="opening-map-skill" key={skill.id}>
            <span className="opening-map-skill__icon"><SkillIcon skill={skill.id as SkillVfxSkill} /></span>
            <div><small>{skill.kind} · {skill.branch}</small><strong>{skill.name}</strong><p>{skill.effect}</p><footer>{skill.innerForce > 0 && <span>{skill.innerForce} MP</span>}{skill.cooldown !== null && skill.cooldown > 0 && <span>Hồi {skill.cooldown} lượt</span>}<span>{skill.unlock}</span></footer></div>
          </article>)}</div>
        </> : <>
          <h3>Nghề nghiệp</h3>
          <MelinProfessionPanel campaign={riverCampaign} onAction={applyCampaignAction} atRiverbank={atRiverbank} atForge={atForge} atNoon={activePeriod === 'noon'} />
        </>}
        </div>
      </section>}
      <div className="opening-map-panel-buttons" aria-label="Các chức năng">
        <button type="button" className={campaignOpen ? 'is-active' : ''} aria-label="Bến Nước · Mở hành trình" title="Hành trình" aria-expanded={campaignOpen} onClick={openRiverCampaign}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2M3 21c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2M12 2v10m-4-4 4 4 4-4" /></svg>
          <span>Hành trình</span>
        </button>
        <button type="button" className={isCharacterPanel ? 'is-active' : ''} aria-label="Nhân vật" title="Nhân vật" aria-expanded={isCharacterPanel} onClick={openCharacterSheet}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2Z" /></svg>
          <span>Nhân vật</span>
        </button>
        <button type="button" className={openMapPanel === 'bag' ? 'is-active' : ''} aria-label="Hành trang" title="Hành trang" aria-expanded={openMapPanel === 'bag'} onClick={() => setOpenMapPanel(value => value === 'bag' ? null : 'bag')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1.5 13h-17L5 8Zm3 0V6a4 4 0 0 1 8 0v2m-8 4h8" /></svg>
          <span>Hành trang</span>{deliveryQuest.stage === 'carrying' && <i aria-hidden="true" />}
        </button>
        <button type="button" className={openMapPanel === 'quest' ? 'is-active' : ''} aria-label="Nhiệm vụ" title="Nhiệm vụ" aria-expanded={openMapPanel === 'quest'} onClick={() => setOpenMapPanel(value => value === 'quest' ? null : 'quest')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h12v17H5V4h3Zm0 0V2h8v2M8 9h8M8 13h8M8 17h5" /></svg>
          <span>Nhiệm vụ</span>{!['completed', 'clue-revealed', 'tao-informed'].includes(deliveryQuest.stage) && <i aria-hidden="true" />}
        </button>
        <button type="button" className={openMapPanel === 'skills' ? 'is-active' : ''} aria-label="Công pháp" title="Công pháp" aria-expanded={openMapPanel === 'skills'} onClick={() => setOpenMapPanel(value => value === 'skills' ? null : 'skills')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 3 7 7-3 3-7-7 3-3ZM4 20l5-1 8-8-4-4-8 8-1 5ZM3 3l2 2m4-4v3M2 9h3" /></svg>
          <span>Công pháp</span>
        </button>
        <button type="button" className={openMapPanel === 'profession' ? 'is-active' : ''} aria-label="Nghề nghiệp" title="Nghề nghiệp" aria-expanded={openMapPanel === 'profession'} onClick={() => setOpenMapPanel(value => value === 'profession' ? null : 'profession')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18v13H3zM8 8V5a4 4 0 0 1 8 0v3M3 13h18m-12 0v3h6v-3" /></svg>
          <span>Nghề nghiệp</span>
        </button>
      </div>
    </div>}
    {interactive && campaignOpen && <div className="opening-map-campaign-backdrop">
      <section className="opening-map-campaign" role="dialog" aria-modal="true" aria-label={bossOpen ? 'Trận chiến Chốt Chặn' : 'Hành trình Bến Nước'}>
        <button className="opening-map-campaign__close" type="button" aria-label="Đóng hành trình" onClick={() => { setBossOpen(false); setCampaignOpen(false); }}>×</button>
        {bossOpen
          ? <MelinCheckpointBattle
            campaign={riverCampaign}
            talent={profile.heroDevelopment.talent}
            haBaEquipped={riverCampaign.haBaEquipped}
            onStateChange={battle => applyCampaignAction({ type: 'boss-progress', battle })}
            onVictory={(path, battle) => {
              const saved = applyCampaignAction({ type: 'boss-victory', path, ...battle });
              if (saved) setBossOpen(false);
              return saved;
            }}
            onRetreat={battle => {
              if (applyCampaignAction({ type: 'boss-retreat', ...battle })) setBossOpen(false);
            }}
          />
          : <MelinRiverCampaign
            progress={campaignProgress}
            talent={profile.heroDevelopment.talent}
            onAction={applyCampaignAction}
            onStartBoss={() => setBossOpen(true)}
            onWorldMap={() => {
              setCampaignOpen(false);
              if (riverCampaign.worldMapEntry && onChapterEntry) onChapterEntry(riverCampaign.worldMapEntry);
              else setFullMap(true);
            }}
            onFastTravel={() => {
              stopMovement();
              pointRef.current = OPENING_MAP_MEMORY_KEEPER_HOME_POINT;
              if (persistPlayerPosition) {
                try { localStorage.setItem(PLAYER_POSITION_KEY, JSON.stringify(OPENING_MAP_MEMORY_KEEPER_HOME_POINT)); }
                catch (cause) { setMovementError(cause instanceof Error ? cause.message : 'Chưa lưu được điểm đi nhanh.'); }
              }
              setPositionRevision(value => value + 1);
            }}
          />}
      </section>
    </div>}
    {selectedNpc && <div className="opening-map-dialog-backdrop" onClick={closeDialog}><section className="opening-map-dialog" role="dialog" aria-modal="true" aria-labelledby={`opening-npc-dialog-title-${uniqueId}`} tabIndex={-1}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDialog(); }
        if (event.key !== 'Tab') return;
        event.stopPropagation();
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
          .filter(control => !control.closest('[inert]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
      }}>
      <button className="opening-map-dialog__close" type="button" aria-label="Đóng trò chuyện" onClick={closeDialog} autoFocus>×</button>
      <header className="opening-map-dialog__header">
        <div className="opening-map-dialog__portrait" aria-hidden="true">
          <OpeningMapNpcArtwork npcId={selectedNpc.id} appearance={selectedNpc.appearance} design={selectedNpc.design} artwork={selectedNpc.artwork} pose={selectedNpc.pose} facing={selectedNpc.facing} className="opening-map-dialog__portrait-art" portrait />
        </div>
        <div className="opening-map-dialog__identity">
          <span className="opening-map-dialog__location">{selectedNpc.locationLabel}</span>
          <h2 id={`opening-npc-dialog-title-${uniqueId}`}>{selectedNpc.name}</h2>
          {selectedNpc.alias && <p className="opening-map-dialog__alias">{selectedNpc.alias}</p>}
          {OPENING_MAP_AFFINITY_IDS.includes(selectedNpc.id as typeof OPENING_MAP_AFFINITY_IDS[number]) && selectedNpc.id !== 'memory-keeper' && <span className="opening-map-dialog__affinity">Hảo cảm · {selectedNpc.id === 'woman-general' ? riverCampaign.martialAffinity : riverCampaign.npcAffinities[selectedNpc.id] ?? 50}/100</span>}
        </div>
      </header>
      {dialogueFinished && selectedSchedule && <p className="opening-map-dialog__schedule"><strong>{activePeriod === 'morning' ? 'Buổi sáng' : activePeriod === 'noon' ? 'Buổi trưa' : 'Buổi tối'} · </strong>{selectedSchedule.activity}</p>}
      <div className="opening-map-dialog__speech" aria-label="Lời thoại NPC" aria-live="polite">
        <span>{selectedNpc.name}</span>
        <p>{visibleDialoguePage}</p>
        {dialoguePages.length > 1 && <div className="opening-map-dialog__pagination" aria-label="Trang lời thoại">
          <button type="button" aria-label="Lời thoại trước" disabled={dialoguePage === 0} onClick={() => setDialoguePage(page => Math.max(0, page - 1))}>‹ Trước</button>
          <span aria-live="polite">{Math.min(dialoguePage + 1, dialoguePages.length)}/{dialoguePages.length}</span>
          <button type="button" aria-label="Lời thoại tiếp" disabled={dialoguePage >= dialoguePages.length - 1} onClick={() => setDialoguePage(page => Math.min(dialoguePages.length - 1, page + 1))}>Tiếp ›</button>
        </div>}
      </div>
      {!dialogueFinished && <button className="opening-map-dialog__continue" type="button" onClick={() => {
        if (dialoguePage < dialoguePages.length - 1) setDialoguePage(page => page + 1);
        else setDialogueFinished(true);
      }}>{dialoguePage < dialoguePages.length - 1 ? 'Đọc tiếp câu chuyện' : 'Kết thúc trò chuyện'}</button>}
      {dialogueFinished && <>
      {(npcQuestConversation?.mission ?? selectedNpc.mission) && <div className="opening-map-dialog__mission"><strong>Nhiệm vụ</strong><p>{npcQuestConversation?.mission ?? selectedNpc.mission}</p></div>}
      {selectedNpc.id === 'memory-keeper' && <>
        <p className="opening-map-dialog__role">Hảo cảm: {riverCampaign.motherAffinity}/100</p>
        {!riverCampaign.motherChoice && <div className="opening-map-dialog__mission">
          <strong>MQ_01 · Hơi Thở Quê Hương</strong>
          <p>Cầm lấy chiếc nhẫn này đi con... tìm đường cứu lấy xóm làng.</p>
          <button type="button" disabled={!riverCampaign.mainQuestActivated || riverCampaign.actionPoints < 1} onClick={() => {
            if (applyCampaignAction({ type: 'mother-main', path: 'righteous' })) setAreaNotice('Con đã thề bảo vệ xóm làng · nhận Nhẫn Đồng và mở đi thuyền nhanh.');
          }}>Con xin thề bảo vệ xóm làng!</button>
          <button type="button" disabled={!riverCampaign.mainQuestActivated || riverCampaign.actionPoints < 1} onClick={() => {
            if (applyCampaignAction({ type: 'mother-main', path: 'shadow' })) setAreaNotice('Đã nhận Nhẫn Đồng và 100 Văn tiền · Bà mẹ quê mất 30 Hảo cảm.');
          }}>Thời buổi này lo thân chưa xong, đưa đây!</button>
        </div>}
        {!riverCampaign.waterQuestComplete && <div className="opening-map-dialog__mission">
          <strong>SQ_01 · Gáo Nước Sông Đáy</strong>
          <p>{riverCampaign.waterItemCarried ? 'Đã múc nước sạch. Hãy giao gáo nước để tăng vĩnh viễn 50 HP tối đa.' : `Cần Hảo cảm ≥50 và Nội Lực dưới 40% (${riverCampaign.mp}/${riverCampaign.maxMp}) · tương tác chum nước ngoài hiên.`}</p>
          {riverCampaign.waterItemCarried && <button type="button" disabled={riverCampaign.actionPoints < 1} onClick={() => {
            if (applyCampaignAction({ type: 'mother-water-return' })) setAreaNotice(`Đã giao gáo nước · HP tối đa +50${riverCampaign.morality >= 60 ? ' · mở Hà Bá Tức Công' : ''}.`);
          }}>Giao gáo nước · +50 HP tối đa</button>}
        </div>}
      </>}
      {selectedNpc.id === 'memory-keeper' && activePeriod === 'noon' && !riverCampaign.motherStoveHelped && <button type="button" onClick={() => { if (applyCampaignAction({ type: 'mother-stove-help' })) setAreaNotice('Đã giúp Bà mẹ quê quạt bếp · Hảo cảm +10.'); }}>Giúp bà quạt bếp · Hảo cảm +10</button>}
      {npcQuestConversation?.action && <button type="button" onClick={() => progressDeliveryQuest(npcQuestConversation.action!)}>{npcQuestConversation.label}</button>}
      {OPENING_MAP_SIDE_NPC_IDS.includes(selectedNpc.id as OpeningMapSideNpcId) && <div className="opening-map-dialog__mission" data-opening-side-npc={selectedNpc.id}>
        {selectedNpc.id === 'herbalist-lang' && <>
          <strong>Việc phụ · Xuyên Khung ven suối</strong>
          <p>{riverCampaign.npcQuestStages['herbalist-lang'] === 3 ? 'Đã hoàn thành · Khí Huyết tối đa +50, mở công thức độc/dược liệu.' : riverCampaign.npcQuestStages['herbalist-lang'] === 2 ? 'Đã nhặt Xuyên Khung. Mang về giao cho Lão Lang Trung.' : riverCampaign.npcQuestStages['herbalist-lang'] === 1 ? 'Hãy tìm Xuyên Khung ở bờ suối gần rừng tre.' : 'Nhận việc tìm dược liệu để giúp thầy thuốc.'}</p>
          {(riverCampaign.npcQuestStages['herbalist-lang'] ?? 0) === 0 && sideNpcButton('herbalist-lang', 'accept', 'Nhận việc tìm Xuyên Khung', riverCampaign.actionPoints < 1)}
          {riverCampaign.npcQuestStages['herbalist-lang'] === 1 && sideNpcButton('herbalist-lang', 'gather-herb', 'Tìm Xuyên Khung ven suối · 1 AP', riverCampaign.actionPoints < 1)}
          {riverCampaign.npcQuestStages['herbalist-lang'] === 2 && sideNpcButton('herbalist-lang', 'deliver-herb', 'Giao thuốc · nhận +50 HP tối đa · 1 AP', riverCampaign.actionPoints < 1)}
        </>}
        {selectedNpc.id === 'inn-server' && <>
          <strong>Quán Rạp · đồ ăn và tin đồn</strong>
          <p>Thể lực {riverCampaign.actionPoints}/3 AP · Văn tiền {riverCampaign.vanTien}. Tin tuần tra được lưu thành Bản Đồ Tuần Tra trong hành trang.</p>
          {sideNpcButton('inn-server', 'buy-meal', 'Ăn cháo nóng · +1 AP · 10 Văn tiền', riverCampaign.actionPoints >= 3 || riverCampaign.vanTien < 10)}
          {sideNpcButton('inn-server', 'buy-rumor', 'Nghe tin tuần tra · 5 Văn tiền · 1 AP', (riverCampaign.npcQuestStages['inn-server'] ?? 0) > 0 || riverCampaign.actionPoints < 1 || riverCampaign.vanTien < 5)}
          {sideNpcButton('inn-server', 'buy-bun', 'Mua bánh bao · 5 Văn tiền · 1 AP', riverCampaign.actionPoints < 1 || riverCampaign.vanTien < 5)}
          {sideNpcButton('inn-server', 'buy-wine', 'Mua rượu nếp · 10 Văn tiền · 1 AP', riverCampaign.actionPoints < 1 || riverCampaign.vanTien < 10)}
        </>}
        {selectedNpc.id === 'fruit-aunt-tu' && <>
          <strong>Trái cây theo mùa</strong>
          <p>Trong túi có {riverCampaign.inventory.ITEM_TRAI_CAY ?? 0} phần trái cây. Ăn hồi 75 MP hoặc tặng một nhân vật để tăng 10 Hảo cảm.</p>
          {sideNpcButton('fruit-aunt-tu', 'buy-fruit', 'Mua trái cây · 8 Văn tiền · 1 AP', riverCampaign.actionPoints < 1 || riverCampaign.vanTien < 8)}
          {sideNpcButton('fruit-aunt-tu', 'eat-fruit', 'Ăn trái cây · hồi 75 MP', !riverCampaign.inventory.ITEM_TRAI_CAY || riverCampaign.mp >= riverCampaign.maxMp)}
          <label>Người nhận quà<select aria-label="Nhân vật nhận trái cây" value={fruitGiftRecipient} onChange={event => setFruitGiftRecipient(event.target.value)}>
            <option value="memory-keeper">Bà mẹ quê</option><option value="woman-general">Võ Sư Nương</option><option value="fruit-aunt-tu">Thím Tư</option><option value="toy-seller">Tiểu Muội</option><option value="singer-le-nuong">Lệ Nương</option>
          </select></label>
          {sideNpcButton('fruit-aunt-tu', 'give-fruit', 'Tặng trái cây · +10 Hảo cảm · 1 AP', !riverCampaign.inventory.ITEM_TRAI_CAY || riverCampaign.actionPoints < 1, fruitGiftRecipient)}
        </>}
        {selectedNpc.id === 'smith-thiet-chuy' && <>
          <strong>Nhiệm vụ · Quặng sắt suối nguồn</strong>
          <p>{riverCampaign.npcQuestStages['smith-thiet-chuy'] === 3 ? `Đã mở cường hóa · cấp ${riverCampaign.weaponUpgradeLevel}.` : `Quặng sắt: ${riverCampaign.ironOre}/2. Mang đủ quặng tới lò để mở cường hóa vũ khí.`}</p>
          {(riverCampaign.npcQuestStages['smith-thiet-chuy'] ?? 0) === 0 && sideNpcButton('smith-thiet-chuy', 'accept', 'Nhận việc tìm quặng · 1 AP', riverCampaign.actionPoints < 1)}
          {riverCampaign.npcQuestStages['smith-thiet-chuy'] === 1 && <>
            <button type="button" disabled={riverCampaign.actionPoints < 1} onClick={() => { if (applyCampaignAction({ type: 'collect-ore' })) setAreaNotice('Đã nhặt 1 quặng sắt · hãy tìm thêm ở suối nguồn.'); }}>Nhặt quặng sắt · 1 AP</button>
            {sideNpcButton('smith-thiet-chuy', 'finish-forging-quest', 'Giao 2 quặng · mở cường hóa · 1 AP', riverCampaign.actionPoints < 1 || riverCampaign.ironOre < 2)}
          </>}
        </>}
        {selectedNpc.id === 'woodcutter' && <>
          <strong>Nhiệm vụ · An toàn đường rừng</strong>
          <p>{riverCampaign.npcQuestStages['woodcutter'] === 3 ? 'Đã dọn bầy sói · nhận gỗ quý và mở công thức Bẫy Tre Gai.' : 'Dọn bầy sói hoang quanh đường mòn để học sinh tồn và nhận gỗ quý.'}</p>
          {(riverCampaign.npcQuestStages['woodcutter'] ?? 0) === 0 && sideNpcButton('woodcutter', 'accept', 'Nhận việc dọn sói · 1 AP', riverCampaign.actionPoints < 1)}
          {riverCampaign.npcQuestStages['woodcutter'] === 1 && sideNpcButton('woodcutter', 'clear-wolves', 'Dọn bầy sói · 1 AP', riverCampaign.actionPoints < 1)}
        </>}
        {selectedNpc.id === 'toy-seller' && <>
          <strong>Đồ chơi sưu tầm</strong>
          <p>{riverCampaign.npcQuestStages['toy-seller'] === 3 ? 'Đã sưu tầm tò he · Ngộ Tính +5, May mắn +5.' : 'Tò he may mắn giá 15 Văn tiền · vật phẩm sưu tầm tăng Ngộ Tính và May mắn.'}</p>
          {sideNpcButton('toy-seller', 'buy-toy', 'Mua tò he · 15 Văn tiền · 1 AP', riverCampaign.npcQuestStages['toy-seller'] === 3 || riverCampaign.actionPoints < 1 || riverCampaign.vanTien < 15)}
        </>}
        {selectedNpc.id === 'beggar-hac-lao' && <>
          <strong>Nhiệm vụ ẩn · Tâm pháp khuyết danh</strong>
          <p>{riverCampaign.npcQuestStages['beggar-hac-lao'] === 3 ? 'Hạc Lão đã truyền Đả Ngưu Bái Tướng. Bí kíp nằm trong hành trang.' : `Cần 1 bánh bao và 1 rượu nếp · hiện có ${riverCampaign.inventory.ITEM_BANH_BAO ?? 0} bánh, ${riverCampaign.inventory.ITEM_RUOU_NEP ?? 0} rượu.`}</p>
          {sideNpcButton('beggar-hac-lao', 'give-offering', 'Biếu bánh bao và rượu · học tâm pháp · 1 AP', riverCampaign.actionPoints < 1 || !riverCampaign.inventory.ITEM_BANH_BAO || !riverCampaign.inventory.ITEM_RUOU_NEP)}
        </>}
        {selectedNpc.id === 'singer-le-nuong' && <>
          <strong>Tình báo vùng biên ải</strong>
          <p>{riverCampaign.npcQuestStages['singer-le-nuong'] >= 4 ? riverCampaign.npcQuestStages['singer-le-nuong'] === 4 ? 'Đã chia sẻ tin tình báo · Chính đạo +5.' : 'Đã giữ kín tin tình báo · Tà Khí +5.' : riverCampaign.npcQuestStages['singer-le-nuong'] === 3 ? 'Đã nhận tin tình báo · Mị lực +5. Chọn cách xử lý để mở nhánh cốt truyện.' : 'Trả 15 Văn tiền để nhận tin về triều đình và mở đầu mối cốt truyện.'}</p>
          {sideNpcButton('singer-le-nuong', 'buy-intel', 'Nhận tin tình báo · 15 Văn tiền · 1 AP', riverCampaign.npcQuestStages['singer-le-nuong'] > 0 || riverCampaign.actionPoints < 1 || riverCampaign.vanTien < 15)}
          {riverCampaign.npcQuestStages['singer-le-nuong'] === 3 && <>
            {sideNpcButton('singer-le-nuong', 'share-intel', 'Chia sẻ tin với dân làng · Chính đạo +5 · 1 AP', riverCampaign.actionPoints < 1)}
            {sideNpcButton('singer-le-nuong', 'keep-intel', 'Giữ bí mật cho riêng mình · Tà Khí +5 · 1 AP', riverCampaign.actionPoints < 1)}
          </>}
        </>}
        {selectedNpc.id === 'herdboy-a-sang' && <>
          <strong>Đường tắt trong thôn</strong>
          <p>{riverCampaign.shortcutHintUnlocked ? 'Đã ghi nhớ đường tắt và mở đi nhanh trên bản đồ.' : 'A Sáng chỉ miễn phí lối vòng tránh chốt kiểm soát ở cầu gỗ.'}</p>
          {sideNpcButton('herdboy-a-sang', 'reveal-shortcut', 'Nhận chỉ đường miễn phí', riverCampaign.shortcutHintUnlocked)}
        </>}
        {selectedNpc.id === 'village-captain' && <>
          <strong>Nhiệm vụ · Bảo vệ dân làng</strong>
          <p>{riverCampaign.npcQuestStages['village-captain'] === 3 ? 'Đã dẹp băng cướp · Chính đạo +10 và nhận giáp dân binh.' : 'Truy bắt băng cướp ở khu phụ cận để nhận điểm Chính đạo và trang phục phòng thủ.'}</p>
          {(riverCampaign.npcQuestStages['village-captain'] ?? 0) === 0 && sideNpcButton('village-captain', 'accept', 'Nhận nhiệm vụ truy bắt · 1 AP', riverCampaign.actionPoints < 1)}
          {riverCampaign.npcQuestStages['village-captain'] === 1 && sideNpcButton('village-captain', 'clear-bandits', 'Dẹp băng cướp · 1 AP', riverCampaign.actionPoints < 1)}
        </>}
      </div>}
      {selectedNpc.id.startsWith('NPC_DAN_NONG_') && riverCampaign.fishStock > 0 && !riverCampaign.villageBetrayed && <button type="button" disabled={riverCampaign.actionPoints < 1 || riverCampaign.taoHandoffs.includes(selectedNpc.id)} onClick={() => {
        const villagerId = selectedNpc.id;
        if (villagerId === 'NPC_DAN_NONG_01' || villagerId === 'NPC_DAN_NONG_02' || villagerId === 'NPC_DAN_NONG_03') {
          if (applyCampaignAction({ type: 'tao-handoff', villagerId })) setAreaNotice(`Đã chia Cá Cóc cho ${selectedNpc.name} · ${riverCampaign.taoHandoffs.length + 1}/3 hộ dân.`);
        }
      }}>{riverCampaign.taoHandoffs.includes(selectedNpc.id) ? 'Đã nhận cá' : 'Chia Cá Cóc Sông Đáy · 1 AP'}</button>}
      {selectedNpc.id.startsWith('enemy-patrol-')
        ? <p className="opening-map-dialog__mission"><strong>Thôn bị chiếm đóng</strong><span>NPC_DAN_LANG đã rời đi; tuần tra Đông Hán thay vào vị trí dân làng.</span></p>
        : !OPENING_MAP_SIDE_NPC_IDS.includes(selectedNpc.id as OpeningMapSideNpcId) && <button type="button" onClick={openRiverCampaign}>{selectedNpc.id === 'gate-guard' ? 'Đối đầu Trưởng Đội Tuần Tra'
          : selectedNpc.id === 'woman-general' && activePeriod === 'noon' ? 'Mở minigame rèn búa'
            : selectedNpc.id === 'woman-general' && activePeriod === 'evening' ? 'Mở bảng tỷ thí'
              : selectedNpc.id === 'fisherman-tao' ? 'Mở hoạt động câu cá'
                : selectedNpc.id === 'messenger' && activePeriod === 'evening' ? 'Mở lựa chọn giao liên' : 'Mở hành trình Bến Nước'} · {riverCampaign.actionPoints}/3 AP</button>}
      </>}
      {dialogueFinished && <footer className="opening-map-dialog__footer"><span>{riverCampaign.actionPoints}/3 AP còn lại hôm nay</span><button type="button" onClick={closeDialog}>Tiếp tục đi</button></footer>}
    </section></div>}
    {(error || movementError || deliveryQuestError || campaignError) && <p className="opening-map-error" role="alert">{error || movementError || deliveryQuestError || campaignError}</p>}
  </section>;
}
