import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { CharacterAppearance, Facing } from '../game/character';
import type { CharacterCustomization } from '../game/characterCustomization';
import {
  BUILDINGS, facingForInput, nearestLocation, POSITION_STORAGE_KEY, WORLD_FEATURES,
  readPosition, SPAWN, WORLD_LOCATIONS, WORLD_SIZE, type HistoricalLandscape, type MapBuilding, type Point, type WorldFeature, type WorldFeatureInfo, type WorldLocation,
} from '../game/world';
import { createNeighbors, NEIGHBORS, neighborLocations, stepNeighbors } from '../game/npcs';
import { CharacterSprite } from './CharacterSprite';
import { MountSprite } from './MountSprite';
import { PetSprite } from './PetSprite';
import { createCompanion, followPlayer } from '../game/companion';
import { NeighborhoodGround, neighborhoodScenery } from './NeighborhoodScene';
import { MapDialog } from './MapDialog';
import { MapOverview } from './MapOverview';
import { useJourney, useJourneyPause } from '../context/JourneyContext';
import { WorldAtmosphere } from './WorldAtmosphere';
import { NeighborhoodLife } from './NeighborhoodLife';
import { NeighborSprite } from './NeighborSprite';
import { timeOfDay } from '../game/journey';
import { VillageScenery } from './VillageScenery';
import { VirtualJoystick } from './VirtualJoystick';
import {DIRECTION_KEYS as directionKeys,keyboardVector} from '../game/movement/keyboard';
import {walkable,moveControlled,findWalkingPath,nearestWalkablePoint} from '../game/movement/navigation';
import {CONTROL_SETTINGS_EVENT,tapMovementEnabled} from '../game/movement/preferences';
import '../styles/movement-controls.css';
import {HISTORY_MENU_PLACES} from '../game/suVietMap';
import { MAP_ONE_NPCS } from '../game/mapOneNpcs';
import { MAP_ONE_LAYOUT_SCALE, MAP_ONE_WORLD_SIZE, MAP_ONE_ZONES } from '../game/mapOneMap';
import type { StartingCharacterId } from '../game/startingCharacters';
import type { CharacterSpriteSheet, SpriteAction } from '../game/characterSpriteSheet';

interface WorldMapProps {
  appearance: CharacterAppearance;
  playerName: string;
  compact?: boolean;
  persist?: boolean;
  suspended?: boolean;
  onInteract?: (location: WorldLocation) => void;
  locations?: readonly WorldLocation[];
  featureLabels?: Partial<Record<WorldFeature, WorldFeatureInfo>>;
  mapName?: string;
  buildings?: readonly MapBuilding[];
  positionStorageKey?: string;
  historyMode?: boolean;
  landscape?: HistoricalLandscape;
  spawn?: Point;
  fame?: number;
  customization?: CharacterCustomization;
  activeQuestLocationId?: string;
  startingCharacter?: StartingCharacterId;
  playerSpriteSheet?: CharacterSpriteSheet | null;
  previewMotion?: { action: SpriteAction; facing: Facing; playing?: boolean; frame?: number };
}

function readMapOnePosition(key: string, fallback: Point): Point {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Point | null;
    const versionKey = `${key}:layout-v2`;
    const migrated = localStorage.getItem(versionKey) === '1';
    if (!saved || !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) {
      if (!migrated) localStorage.setItem(versionKey, '1');
      return { ...fallback };
    }
    const point = !migrated && saved.x <= WORLD_SIZE.width && saved.y <= WORLD_SIZE.height
      ? { x: saved.x * MAP_ONE_LAYOUT_SCALE, y: saved.y * MAP_ONE_LAYOUT_SCALE }
      : saved;
    if (point.x < 53 || point.y < 73 || point.x > MAP_ONE_WORLD_SIZE.width - 53 || point.y > MAP_ONE_WORLD_SIZE.height - 53) return { ...fallback };
    if (!migrated) {
      localStorage.setItem(versionKey, '1');
      localStorage.setItem(key, JSON.stringify(point));
    }
    return point;
  } catch {
    return { ...fallback };
  }
}

function readMapOneDiscoveredZones(key: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(`${key}:discovered-zones`) ?? '[]');
    if (!Array.isArray(saved)) return [];
    const zoneIds = new Set<string>(MAP_ONE_ZONES.map(zone => zone.id));
    return saved.filter((value): value is string => typeof value === 'string' && zoneIds.has(value));
  } catch {
    return [];
  }
}

export function WorldMap({ appearance, playerName, compact = false, persist = true, suspended = false, onInteract, locations: configuredLocations, featureLabels, mapName = 'Hẻm 28', buildings = BUILDINGS, positionStorageKey = POSITION_STORAGE_KEY, historyMode = false, landscape, spawn = SPAWN, fame = 0, customization, activeQuestLocationId, startingCharacter, playerSpriteSheet, previewMotion }: WorldMapProps) {
  const id = `map-${useId().replace(/:/g, '')}`;
  const mapOneMode = historyMode && landscape === 'me-linh';
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const worldSize = mapOneMode ? MAP_ONE_WORLD_SIZE : WORLD_SIZE;
  const inputs = useRef(new Set<string>());
  const shouldPersist = useRef(persist);
  shouldPersist.current = persist;
  const [motion, setMotion] = useState(() => {
    const point = persist ? mapOneMode ? readMapOnePosition(positionStorageKey, spawn) : readPosition(positionStorageKey, spawn) : { ...spawn };
    return { point, facing: 'down' as Facing, moving: false, running: false, companion: createCompanion(point), neighbors: mapOneMode ? [] : createNeighbors() };
  });
  const current = useRef(motion);
  const [bounds, setBounds] = useState({ width: compact ? 380 : 1000, height: compact ? 360 : 600 });
  const [dialogue, setDialogue] = useState<WorldLocation | null>(null);
  const [overview, setOverview] = useState(false);
  const [zoom, setZoom] = useState(mapOneMode ? .65 : 1);
  const [miniMapOpen, setMiniMapOpen] = useState(() => !(typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches));
  const [discoveredZoneIds, setDiscoveredZoneIds] = useState(() => readMapOneDiscoveredZones(positionStorageKey));
  const [pan, setPan] = useState({x:0,y:0});
  const [clock, setClock] = useState(Date.now);
  const drag = useRef<{x:number;y:number;pan:Point}|null>(null);
  const dragged = useRef(false);
  const touchPoints = useRef(new Map<number,Point>());
  const pinch = useRef<{distance:number;zoom:number}|null>(null);
  const [touchMode,setTouchMode]=useState(()=>typeof matchMedia!=='undefined'&&matchMedia('(pointer: coarse)').matches);
  const [controlReset,setControlReset]=useState(0);
  const [tapEnabled,setTapEnabled]=useState(tapMovementEnabled);
  const [destination,setDestination]=useState<Point|null>(null);
  const [movementHint,setMovementHint]=useState('');
  const joystick=useRef<Point>({x:0,y:0});
  const sprintPointer=useRef<number|null>(null);
  const walkingPath=useRef<Point[]>([]);
  const collisionBuildings=useMemo(()=>historyMode
    ? [
      ...buildings,
      ...(mapOneMode ? [] : HISTORY_MENU_PLACES.map(place=>({id:place.id,x:place.point.x-39,y:place.point.y-100,width:78,height:95,title:'',subtitle:'',color:'',roof:''}))),
      ...(mapOneMode ? [] : [{id:'village-home-body',x:95,y:654,width:250,height:201},{id:'village-well-body',x:815,y:844,width:70,height:81},{id:'village-market-body',x:880,y:484,width:100,height:126}].map(body=>({...body,title:'',subtitle:'',color:'',roof:''}))),
    ]
    : buildings,[historyMode,mapOneMode,buildings]);
  const collisionScene=useRef(collisionBuildings);collisionScene.current=collisionBuildings;
  const collisionLandscape=useRef(landscape);collisionLandscape.current=landscape;
  const [selectedInteraction,setSelectedInteraction]=useState<string|null>(null);
  const { journey, act } = useJourney();
  const worldMinute = historyMode ? Math.floor(clock / 500) % 1440 : journey?.minute;
  const worldWeather = historyMode ? (['clear','breeze','clear','rain'] as const)[Math.floor(clock / 180000) % 4] : journey?.weather;

  useEffect(()=>{
    if (!historyMode) return;
    const timer=window.setInterval(()=>setClock(Date.now()),15000);
    return()=>window.clearInterval(timer);
  },[historyMode]);
  useEffect(()=>{
    if(!mapOneMode)return;
    const discovered=MAP_ONE_ZONES.filter(zone=>Math.hypot(motion.point.x-zone.point.x,motion.point.y-zone.point.y)<510).map(zone=>zone.id);
    const next=[...new Set([...discoveredZoneIds,...discovered])];
    if(next.length===discoveredZoneIds.length)return;
    setDiscoveredZoneIds(next);
    try {
      localStorage.setItem(`${positionStorageKey}:discovered-zones`,JSON.stringify(next));
    } catch {
      setMovementHint('Không thể lưu khu vực đã khám phá trên thiết bị.');
    }
  },[mapOneMode,motion.point.x,motion.point.y,positionStorageKey,discoveredZoneIds]);
  const mapLocations = configuredLocations ?? WORLD_LOCATIONS;
  useJourneyPause(!compact && (Boolean(dialogue) || overview));
  const blocked = suspended || Boolean(dialogue) || overview;
  const paused = useRef(blocked);
  const scenery = useMemo(() => neighborhoodScenery(buildings, historyMode, landscape), [buildings, historyMode, landscape]);
  const allLocations = [...mapLocations, ...neighborLocations(motion.neighbors)];
  const nearby = nearestLocation(motion.point, allLocations);
  const interactionLocation=allLocations.find(location=>location.id===selectedInteraction)??nearby;
  const interactionReady=interactionLocation&&Math.hypot(interactionLocation.point.x-motion.point.x,interactionLocation.point.y-motion.point.y)<80;

  function clearInput() {
    inputs.current.clear();
    joystick.current={x:0,y:0};sprintPointer.current=null;walkingPath.current=[];
    setDestination(null);
  }

  useEffect(()=>{
    const mode=(event:globalThis.PointerEvent)=>{if(event.pointerType==='touch'||event.pointerType==='pen'){setTouchMode(true);if(!(event.target instanceof Element)||!event.target.closest('.map-minimap-one'))setMiniMapOpen(false);}else if(event.pointerType==='mouse'){setTouchMode(false);}};
    const settings=()=>{setTapEnabled(tapMovementEnabled());walkingPath.current=[];setDestination(null);};
    const resize=()=>{clearInput();setControlReset(value=>value+1);const rect=viewport.current?.getBoundingClientRect();if(rect?.width&&rect.height)setBounds({width:rect.width,height:rect.height});};
    window.addEventListener('pointerdown',mode,true);window.addEventListener(CONTROL_SETTINGS_EVENT,settings);window.addEventListener('storage',settings);
    window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);
    return()=>{window.removeEventListener('pointerdown',mode,true);window.removeEventListener(CONTROL_SETTINGS_EVENT,settings);window.removeEventListener('storage',settings);window.removeEventListener('resize',resize);window.removeEventListener('orientationchange',resize);};
  },[]);

  useEffect(() => {
    const target = viewport.current;
    if (!target) return;
    const measure = () => {
      const rect = target.getBoundingClientRect();
      if (rect.width && rect.height) setBounds({ width: rect.width, height: rect.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { if (!suspended) root.current?.focus({ preventScroll: true }); }, []);
  useEffect(()=>{
    const old=current.current;
    const npcPoints=old.neighbors.map(npc=>npc.point);
    const allowed=(point:Point)=>walkable(point,collisionBuildings,npcPoints,landscape,worldSize);
    if(allowed(old.point))return;
    const point=nearestWalkablePoint(old.point,allowed)??nearestWalkablePoint(spawn,allowed);
    if(!point)return;
    current.current={...old,point,moving:false,running:false,companion:createCompanion(point)};
    setMotion(current.current);
    if(persist&&shouldPersist.current)localStorage.setItem(positionStorageKey,JSON.stringify(point));
  },[collisionBuildings,landscape,positionStorageKey,persist,spawn]);
  useEffect(() => {
    const wasPaused = paused.current;
    paused.current = blocked;
    clearInput();
    setControlReset(value=>value+1);
    if (root.current) root.current.inert = blocked;
    if (wasPaused && !blocked) root.current?.focus({ preventScroll: true });
  }, [blocked]);

  useEffect(() => {
    let frame = 0;
    let previousTime = 0;
    let lastSave = 0;
    let dirty = false;
    function save() {
      if (persist && shouldPersist.current && dirty) {
        localStorage.setItem(positionStorageKey, JSON.stringify(current.current.point));
        if (historyMode) localStorage.setItem('su-viet-hanh-trinh-saved-at', new Date().toISOString());
        dirty = false;
      }
    }
    function animate(time: number) {
      const seconds = previousTime ? (time - previousTime) / 1000 : 0;
      previousTime = time;
      const old = current.current;
      const npcPoints=old.neighbors.map(npc=>npc.point);
      const allowed=(point:Point)=>walkable(point,collisionScene.current,npcPoints,collisionLandscape.current,worldSize);
      let input={x:0,y:0};
      const running = (inputs.current.has('shift')||sprintPointer.current!==null) && !paused.current;
      if(!paused.current){
        input=keyboardVector(inputs.current);
        if(!input.x&&!input.y)input=joystick.current;
        if((input.x||input.y)&&walkingPath.current.length){walkingPath.current=[];setDestination(null);}
        if(!input.x&&!input.y&&walkingPath.current.length){
          let target=walkingPath.current[0];
          if(Math.hypot(target.x-old.point.x,target.y-old.point.y)<3){walkingPath.current.shift();target=walkingPath.current[0];}
          if(target){const dx=target.x-old.point.x,dy=target.y-old.point.y,length=Math.hypot(dx,dy);const scale=Math.min(1,length/Math.max(.01,(running?250:160)*Math.min(.1,seconds)));input={x:dx/length*scale,y:dy/length*scale};}
          else setDestination(null);
        }
      }
      const point = moveControlled(old.point,input,seconds,running,allowed);
      const moving = Math.hypot(point.x - old.point.x, point.y - old.point.y) > .01;
      if(!moving&&seconds>0&&walkingPath.current.length&&(input.x||input.y)){walkingPath.current=[];setDestination(null);setMovementHint('Đường đang bị chắn. Hãy chọn điểm khác.');}
      const facing = facingForInput(input, old.facing);
      const companion = paused.current
        ? old.companion.moving ? { ...old.companion, moving: false } : old.companion
        : followPlayer(old.companion, point, seconds, running);
      const neighbors = mapOneMode ? old.neighbors : stepNeighbors(old.neighbors, point, seconds, paused.current);
      if (moving || old.moving !== moving || old.facing !== facing || old.running !== running || companion !== old.companion || neighbors !== old.neighbors) {
        current.current = { point, facing, moving, running, companion, neighbors };
        setMotion(current.current);
        if (moving) dirty = true;
      }
      if (time - lastSave > 1000) { save(); lastSave = time; }
      frame = requestAnimationFrame(animate);
    }
    const keyUp = (event: globalThis.KeyboardEvent) => inputs.current.delete(event.key.toLowerCase());
    const loseFocus = () => { clearInput();setControlReset(value=>value+1); save(); };
    const visibility = () => { if (document.hidden) loseFocus(); };
    frame = requestAnimationFrame(animate);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', loseFocus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      clearInput(); save();
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', loseFocus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [historyMode, mapOneMode, persist, positionStorageKey, worldSize.width, worldSize.height]);

  function activate(location: WorldLocation) {
    clearInput();
    if (location.dialogue) {
      const greetings = historyMode
        ? ['Sáng làng trong veo, học thêm một chuyện xưa là ngày mới đủ vui rồi!', 'Nắng trưa rực rỡ, nhớ uống nước và đừng để câu hỏi lịch sử làm khó nha.', 'Hoàng hôn xuống, chuyện xưa kể bên bến nước là hợp nhất!', 'Đèn làng lên rồi, nghỉ ngơi một chút rồi mai mình học tiếp nhé!']
        : ['Sáng rồi, phở thơm cả hẻm! Nhớ mời khách trà cho đỡ sốt ruột nha.', 'Nắng trưa thì bụng ai cũng réo. Chủ quán giữ bếp đều tay nghen.', 'Hoàng hôn đẹp quá, cả xóm lại ngóng chuyện mới. Có thư thì nhớ mở nhật ký.', 'Đèn lên rồi! Một ngày chưa hoàn hảo vẫn đáng được nghỉ ngơi và ăn ngon.'];
      const stage = timeOfDay(worldMinute ?? 480);
      const comment = historyMode || journey ? greetings[(['morning','day','sunset','night'] as const).indexOf(stage)] : '';
      setDialogue({ ...location, dialogue: comment ? `${location.dialogue}\n\n${journey?.weather === 'rain' ? 'Mưa rồi, đứng dưới hiên nói chuyện cho khô nha! ' : ''}${comment}` : location.dialogue });
      if (!compact && !historyMode && location.npcId && journey) void act('visit', { npcId: location.npcId });
    }
    else if (onInteract) onInteract(location);
    else setDialogue({ ...location, dialogue: 'Lưu nhân vật để ghé các địa điểm và khám phá cả xóm với diện mạo này nhé!' });
  }

  function interact() {
    const locations=[...mapLocations,...neighborLocations(current.current.neighbors)];
    const selected=locations.find(location=>location.id===selectedInteraction);
    const location=selected&&Math.hypot(selected.point.x-current.current.point.x,selected.point.y-current.current.point.y)<80?selected:nearestLocation(current.current.point,locations);
    if (location) activate(location);
  }

  function navigateTo(target:Point):boolean {
    const npcPoints=current.current.neighbors.map(npc=>npc.point);
    const allowed=(point:Point)=>walkable(point,collisionScene.current,npcPoints,collisionLandscape.current,worldSize);
    const path=findWalkingPath(current.current.point,target,allowed,worldSize);
    walkingPath.current=path;
    setDestination(path.length?target:null);
    setMovementHint(path.length?'':'Không có đường đi an toàn tới điểm này.');
    if(path.length)setPan({x:0,y:0});
    return path.length>0;
  }
  function requestLocation(location:WorldLocation){
    if(!touchMode){activate(location);return;}
    clearInput();setControlReset(value=>value+1);setSelectedInteraction(location.id);setMovementHint('');
    if(tapEnabled&&Math.hypot(location.point.x-current.current.point.x,location.point.y-current.current.point.y)>=80){
      const candidates=Array.from({length:12},(_,i)=>({x:location.point.x+Math.cos(i*Math.PI/6)*58,y:location.point.y+Math.sin(i*Math.PI/6)*58})).sort((a,b)=>Math.hypot(a.x-current.current.point.x,a.y-current.current.point.y)-Math.hypot(b.x-current.current.point.x,b.y-current.current.point.y));
      for(const candidate of candidates)if(navigateTo(candidate))break;
    }
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (paused.current || (event.target as HTMLElement).matches('input, textarea, select')) return;
    const key = event.key.toLowerCase();
    if(directionKeys[key]||key==='shift'||key==='e'||key==='m')setTouchMode(false);
    if (directionKeys[key] || key === 'shift') {
      setMovementHint('');
      setTouchMode(false);joystick.current={x:0,y:0};sprintPointer.current=null;
      setPan({x:0,y:0});
      event.preventDefault();
      if(directionKeys[key]){walkingPath.current=[];setDestination(null);}
      inputs.current.add(key);
    } else if (key === 'e' && !event.repeat) {
      event.preventDefault(); interact();
    } else if (key === 'm' && !compact && !event.repeat) {
      event.preventDefault(); clearInput(); setOverview(true);
    }
  }

  function returnToEntrance() {
    setPan({x:0,y:0});setZoom(mapOneMode ? .65 : 1);
    clearInput();
    current.current = { ...current.current, point: { ...spawn }, facing: 'down', moving: false, running: false, companion: createCompanion(spawn) };
    setMotion(current.current);
    if (persist) localStorage.setItem(positionStorageKey, JSON.stringify(spawn));
    root.current?.focus({ preventScroll: true });
  }

  const desiredHeight = Math.min(worldSize.height, Math.min(compact ? 460 : 760, worldSize.width * bounds.height / bounds.width) / zoom);
  const viewWidth = Math.min(worldSize.width, desiredHeight * bounds.width / bounds.height);
  const viewHeight = viewWidth * bounds.height / bounds.width;
  const camera = {
    x: Math.max(0, Math.min(worldSize.width - viewWidth, motion.point.x - viewWidth / 2 + pan.x)),
    y: Math.max(0, Math.min(worldSize.height - viewHeight, motion.point.y - viewHeight * .58 + pan.y)),
  };
  function startPan(event:PointerEvent<HTMLDivElement>) {
    if(event.pointerType==='mouse'&&event.button!==0)return;
    if (compact || blocked || !(event.target instanceof Element) || event.target.closest('button,[role="button"],.virtual-joystick,input,select')) return;
    clearInput();
    setControlReset(value=>value+1);
    event.currentTarget.setPointerCapture(event.pointerId);
    touchPoints.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    root.current?.focus({preventScroll:true});
    if(touchPoints.current.size===2){
      const [a,b]=[...touchPoints.current.values()];
      pinch.current={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom};
      dragged.current=true;
      drag.current=null;
    }else {drag.current={x:event.clientX,y:event.clientY,pan:{x:camera.x-(motion.point.x-viewWidth/2),y:camera.y-(motion.point.y-viewHeight*.58)}};dragged.current=false;}
  }
  function movePan(event:PointerEvent<HTMLDivElement>) {
    if(!touchPoints.current.has(event.pointerId))return;
    touchPoints.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pinch.current&&touchPoints.current.size===2){
      const [a,b]=[...touchPoints.current.values()];
      setZoom(Math.max(mapOneMode ? .42 : .6,Math.min(2.2,pinch.current.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.current.distance))));dragged.current=true;return;
    }
    if(!drag.current)return;
    const dx=event.clientX-drag.current.x,dy=event.clientY-drag.current.y;
    if(Math.hypot(dx,dy)>8)dragged.current=true;
    if(dragged.current)setPan({x:drag.current.pan.x-dx*viewWidth/bounds.width,y:drag.current.pan.y-dy*viewHeight/bounds.height});
  }
  function endPan(event:PointerEvent<HTMLDivElement>) {
    const clickToWalk=event.pointerType==='mouse'&&event.button===0;
    const tapToWalk=(event.pointerType==='touch'||event.pointerType==='pen')&&tapEnabled;
    if(event.type==='pointerup'&&drag.current&&!dragged.current&&!pinch.current&&(clickToWalk||tapToWalk)){
      const rect=event.currentTarget.getBoundingClientRect();
      setSelectedInteraction(null);
      navigateTo({x:camera.x+(event.clientX-rect.left)/rect.width*viewWidth,y:camera.y+(event.clientY-rect.top)/rect.height*viewHeight});
    }
    touchPoints.current.delete(event.pointerId);drag.current=null;pinch.current=null;
    window.setTimeout(()=>{dragged.current=false;},0);
  }
  const inView = (point: Point) => point.x > camera.x + 25 && point.x < camera.x + viewWidth - 25 && point.y > camera.y + 70 && point.y < camera.y + viewHeight - 80;
  const player = {
    id: 'player', depth: motion.point.y,
    element: <g transform={`translate(${motion.point.x} ${motion.point.y})`} data-testid="world-player" data-x={motion.point.x.toFixed(1)} data-y={motion.point.y.toFixed(1)} data-facing={motion.facing}>
      <ellipse cy="2" rx={mapOneMode ? 20.5 : 28} ry={mapOneMode ? 7 : 10} fill="#fcf1b1" opacity=".75" />
      {customization?.equipped.mount && <MountSprite mountId={customization.equipped.mount} className={`world-mount world-mount-${customization.equipped.mount}`} x={mapOneMode ? '-36' : '-51'} y={mapOneMode ? '-12' : '-18'} width={mapOneMode ? '72' : '102'} height={mapOneMode ? '42' : '58'} aria-hidden="true" />}
      <CharacterSprite x={mapOneMode ? -32.4 : -48} y={mapOneMode ? -85.68 : -127.2} width={mapOneMode ? '64.8' : '96'} height={mapOneMode ? customization?.equipped.mount ? '99.72' : '90.72' : customization?.equipped.mount ? '151.2' : '134.4'} appearance={appearance} facing={previewMotion?.facing ?? motion.facing} walking={previewMotion ? previewMotion.action === 'walk' : motion.moving} running={previewMotion ? previewMotion.action === 'run' : motion.running} customization={customization} startingCharacter={startingCharacter} spriteSheet={playerSpriteSheet} spriteAction={previewMotion?.action} spriteFrame={previewMotion?.frame} spritePlaying={previewMotion?.playing} />
      <g transform={mapOneMode ? 'translate(0 -100)' : 'translate(0 -143)'}>
        <rect x={mapOneMode ? -42 : -59} y="-13" width={mapOneMode ? 84 : 118} height={mapOneMode ? 20 : 25} rx="10" fill="#fff8e8" fillOpacity=".87" stroke="#b59b77" strokeWidth="1" />
        <text textAnchor="middle" y="1" fill="#624c39" fontSize={mapOneMode ? 10 : 12} fontWeight="800">{(playerName || 'Người chơi').slice(0, 16)}</text>
        <path d="M-4 7L0 11L4 7" fill="#fff8e8" fillOpacity=".87" />
      </g>
    </g>,
  };
  const companions = appearance.pet === 'none' ? [] : [{
    id: 'companion', depth: motion.companion.point.y,
    element: <g transform={`translate(${motion.companion.point.x} ${motion.companion.point.y})`} data-testid="world-companion" data-pet={appearance.pet} data-x={motion.companion.point.x.toFixed(1)} data-y={motion.companion.point.y.toFixed(1)}>
      <PetSprite x={-31.4} y={-56} width="64" height="65.2" pet={appearance.pet} facing={motion.companion.facing} walking={motion.companion.moving} />
    </g>,
  }];
  const movingNeighbors = motion.neighbors.map((npc, index) => {
    const definition = NEIGHBORS[index];
    const location = allLocations.find(item => item.npcId === npc.id)!;
    const small = npc.id === 'ti' || npc.id === 'village-child';
    const height = small ? 104 : 118;
    const width = small ? 74 : 84;
    return {
      id: npc.id, depth: npc.point.y,
      element: <g className={`map-npc${nearby?.npcId === npc.id ? ' is-nearby' : ''}`} transform={`translate(${npc.point.x} ${npc.point.y})`}
        data-testid="world-npc" data-npc={npc.id} data-x={npc.point.x.toFixed(1)} data-y={npc.point.y.toFixed(1)} data-moving={npc.moving} data-facing={npc.facing}
        role="button" tabIndex={inView(npc.point) && !blocked ? 0 : -1} aria-label={`Trò chuyện với ${definition.name} · ${definition.role}`}
        onClick={event => { event.stopPropagation(); requestLocation(location); }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); activate(location); } }}>
        <NeighborSprite npcId={npc.id} x={-width / 2} y={-height + 7} width={width} height={height} facing={npc.facing} walking={npc.moving} />
        <g className="map-npc-label" transform={`translate(0 ${-height - 12})`}>
          <rect x="-39" y="-12" width="78" height="22" rx="11" fill={nearby?.npcId === npc.id ? '#ffe7a1' : '#fff8e8'} stroke="#b5a180" />
          <text y="3" textAnchor="middle" fill="#66553f" fontSize="11" fontWeight="700">{definition.name}{nearby?.npcId === npc.id ? ' · E' : ''}</text>
        </g>
        <rect x={-width / 2} y={-height - 24} width={width} height={height + 34} rx="18" fill="transparent" />
      </g>,
    };
  });
  const mapOneSpeaker = mapOneMode && dialogue ? MAP_ONE_NPCS.find(npc => npc.locationId === dialogue.id) : undefined;
  const speaker = mapOneMode ? mapOneSpeaker : dialogue?.npcId ? NEIGHBORS.find(npc => npc.id === dialogue.npcId) : undefined;
  const staticMapNpcs = mapOneMode ? MAP_ONE_NPCS.flatMap(npc => {
    const location = mapLocations.find(item => item.id === npc.locationId);
    if (!location || !inView(npc.point)) return [];
    const isNearby = nearby?.id === npc.locationId;
    const isSelected = selectedInteraction === npc.locationId;
    const mainMissionNpc = activeQuestLocationId === npc.locationId;
    const important = npc.kind === 'historical' || mainMissionNpc;
    const distant = Math.hypot(npc.point.x - motion.point.x, npc.point.y - motion.point.y) > 430;
    return [{
      id: npc.id,
      depth: npc.point.y,
      element: <g className={`map-npc map-npc-history map-npc-${npc.kind}${isNearby ? ' is-nearby' : ''}${isSelected ? ' is-selected' : ''}${distant ? ' npc-is-distant' : ''}`} transform={`translate(${npc.point.x} ${npc.point.y})`}
        data-testid="world-npc" data-npc={npc.id} data-location={npc.locationId} data-moving="false"
        role="button" tabIndex={!blocked ? 0 : -1} aria-label={`${npc.name} · ${npc.activity}`}
        onClick={event => { event.stopPropagation(); requestLocation(location); }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); activate(location); } }}>
        <ellipse cy="2" rx="25" ry="8" fill="#6c60474a" />
        <CharacterSprite x={-31} y={-86} width="62" height="88" appearance={npc.appearance} pose={npc.pose} npcDesign={npc.design} />
        {npc.kind !== 'hidden' && <g className={`map-npc-pin${important ? ' is-important' : ' is-secondary'}`} transform="translate(0 -101)" aria-hidden="true">
          <circle r={important ? 13 : 8} fill={important ? '#fff0c8' : '#fff8e8'} stroke={important ? '#a8753f' : '#9a8159'} strokeWidth={important ? 2 : 1.4} />
          <text y={important ? 5 : 3} textAnchor="middle" fontSize={important ? 13 : 8}>{mainMissionNpc ? '❗' : important ? npc.icon : '•'}</text>
        </g>}
        <g className="map-npc-label" transform="translate(0 -126)">
          <rect x={-Math.max(38, npc.name.length * 3.2 + 16)} y="-12" width={Math.max(76, npc.name.length * 6.4 + 32)} height="21" rx="10" fill={npc.kind === 'historical' ? '#fff0c8' : '#fff8e8'} fillOpacity=".9" stroke={npc.kind === 'historical' ? '#b88442' : '#b5a180'} strokeWidth={important ? 1.6 : 1} />
          <text y="2" textAnchor="middle" fill="#5b4935" fontSize="10" fontWeight={important ? 900 : 700}>{npc.icon} {npc.name}</text>
        </g>
        <rect x="-34" y="-110" width="68" height="116" rx="20" fill="transparent" />
      </g>,
    }];
  }) : [];
  const featureInfo = (feature: WorldFeature) => featureLabels?.[feature] ?? WORLD_FEATURES[feature];
  const markerLocations = mapLocations.filter(location => !location.id.startsWith('me-linh-hidden-')
    && !(mapOneMode && location.id !== 'hero-hai-ba-trung' && MAP_ONE_NPCS.some(npc => npc.locationId === location.id))
    && (location.feature || location.destinationMapId) && inView(location.point)
    && (!historyMode || location.destinationMapId || Math.hypot(location.point.x - motion.point.x, location.point.y - motion.point.y) < 160));
  const infoForLocation = (location: WorldLocation): WorldFeatureInfo => location.destinationMapId
    ? { title: location.name, activity: location.action, icon: location.unlockAt !== undefined && fame < location.unlockAt ? '🔒' : '🧭', hint: location.dialogue ?? location.action }
    : location.icon ? {title:location.name,activity:location.action,icon:location.icon,hint:location.action} : featureInfo(location.feature!);

  return <>
    <div ref={root} className={`world-map${compact ? ' world-map-compact' : ''}${blocked ? ' village-world-paused' : ''}${touchMode?' touch-controls-active':''}`} tabIndex={blocked ? -1 : 0} aria-hidden={blocked}
      role="region" aria-label={`Bản đồ ${mapName}. WASD hoặc mũi tên để đi, E để tương tác, M mở sơ đồ xóm.`}
      onKeyDown={keyDown} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)){clearInput();setControlReset(value=>value+1);} }}>
      <div className="world-map-viewport" ref={viewport} onWheel={event => {
        if (touchMode) return;
        event.preventDefault();
        setPan({ x: 0, y: 0 });
        setZoom(value => Math.max(mapOneMode ? .42 : .6, Math.min(2.2, value + (event.deltaY < 0 ? .12 : -.12))));
      }} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={endPan}
        onClickCapture={event=>{if(dragged.current){event.stopPropagation();dragged.current=false;}}}>
        <svg className="neighborhood-svg" viewBox={`${camera.x} ${camera.y} ${viewWidth} ${viewHeight}`} role="group" aria-label="Xóm làng Việt Nam với các địa điểm và người hàng xóm">
          <NeighborhoodGround id={id} label={mapName} landscape={landscape} />
          {destination&&<g transform={`translate(${destination.x} ${destination.y})`} aria-hidden="true"><ellipse rx="15" ry="9" fill="#fff5bd88" stroke="#87672e" strokeWidth="2"/><path d="M-6 0H6M0-6V6" stroke="#87672e" strokeWidth="2"/></g>}
          {mapOneMode ? <g transform={`scale(${MAP_ONE_LAYOUT_SCALE})`}><NeighborhoodLife minute={worldMinute} /></g> : <NeighborhoodLife minute={worldMinute} />}
          {historyMode&&!mapOneMode&&<VillageScenery />}
          {mapLocations.map(location => mapOneMode && MAP_ONE_NPCS.some(npc => npc.locationId === location.id) ? null : <g key={location.id} transform={`translate(${location.point.x} ${location.point.y + 5})`} opacity={nearby?.id === location.id ? 1 : .55}>
            <ellipse rx="27" ry="10" fill={nearby?.id === location.id ? '#f9d17c' : '#f5e1ae'} stroke="#c6a976" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M-5-2L0 2L5-2" fill="none" stroke="#9b7551" strokeWidth="2" />
            {location.icon&&<g transform="translate(0 -22)"><circle r="18" fill="#fff7df" stroke="#c2a576"/><text y="7" textAnchor="middle" fontSize="21">{location.icon}</text><title>{location.name}</title></g>}
          </g>)}
          {[...scenery, player, ...companions, ...movingNeighbors, ...staticMapNpcs].sort((a, b) => a.depth - b.depth).map(item => <g key={item.id}>{item.element}</g>)}
        </svg>
        {!compact && <div className="map-location-markers" aria-label="Các địa điểm trong xóm">{markerLocations.map(location => {
          const info = infoForLocation(location);
          return <button key={location.id} type="button" className={`map-location-marker${nearby?.id === location.id ? ' is-nearby' : ''}`}
            style={{ left: `clamp(85px, ${(location.point.x - camera.x) / viewWidth * 100}%, calc(100% - 85px))`, top: `${(location.point.y + 20 - camera.y) / viewHeight * 100}%` }}
            data-location={location.destinationMapId ? 'history-gate' : location.feature} aria-label={`${location.name} · ${info.activity}${location.locked ? `, cần ${location.unlockAt} danh vọng` : ''}`} title={historyMode ? `${location.name} · ${info.hint}` : info.hint} onClick={() => requestLocation(location)}>
            <span aria-hidden="true">{info.icon}</span><strong>{historyMode ? location.name : info.activity}</strong><span className="marker-arrow" aria-hidden="true">↗</span>
          </button>;
        })}</div>}
        <WorldAtmosphere minute={worldMinute} weather={worldWeather} />
        {!compact&&<div className="village-camera-controls" aria-label="Điều khiển góc nhìn">
          <button type="button" aria-label="Phóng to bản đồ" disabled={zoom>=2.2} onClick={()=>setZoom(value=>Math.min(2.2,value+.2))}>＋</button>
          <button type="button" aria-label="Thu nhỏ bản đồ" disabled={zoom <= (mapOneMode ? .42 : .6)} onClick={()=>setZoom(value=>Math.max(mapOneMode ? .42 : .6,value-.2))}>−</button>
          <button type="button" aria-label="Theo nhân vật" onClick={()=>{setPan({x:0,y:0});setZoom(mapOneMode ? .65 : 1);}}>◎</button>
        </div>}
        <div className="map-place-label"><span className="map-sun" aria-hidden="true">{timeOfDay(worldMinute ?? 480) === 'night' ? '☾' : '☀'}</span><div><strong>{mapName}</strong><span>{compact ? 'Đi thử một vòng nhé!' : `${mapOneMode ? MAP_ONE_NPCS.filter(npc => npc.kind !== 'hidden').length : NEIGHBORS.length} nhân vật · ${mapLocations.filter(location => location.feature).length} nơi để ghé`}</span></div></div>
        {!compact && (mapOneMode ? <aside className={`map-minimap map-minimap-one${miniMapOpen ? ' is-open' : ' is-collapsed'}`} aria-label="Mini-map Mê Linh">
          <div className="map-minimap-one__heading">
            <strong>🧭 Mê Linh</strong>
            <button type="button" aria-label={miniMapOpen ? 'Thu gọn mini-map' : 'Mở mini-map'} aria-expanded={miniMapOpen} onClick={() => setMiniMapOpen(value => !value)}>{miniMapOpen ? '−' : '+'}</button>
          </div>
          {miniMapOpen && <>
            <svg viewBox={`0 0 ${worldSize.width} ${worldSize.height}`} aria-label="Vị trí, khu vực và nhiệm vụ">
              <rect width={worldSize.width} height={worldSize.height} rx="80" fill="#a9bd84" />
              <path d="M0 990Q650 900 1190 1010T2880 960M1120 200Q1020 770 1650 1070T2450 1840M1120 500Q920 740 640 1080M1570 1280Q1200 1600 700 1840" fill="none" stroke="#f1dfba" strokeWidth="92" strokeLinecap="round" />
              <path d="M0 990Q650 900 1190 1010T2880 960M1120 200Q1020 770 1650 1070T2450 1840M1120 500Q920 740 640 1080M1570 1280Q1200 1600 700 1840" fill="none" stroke="#fff4d8" strokeWidth="5" strokeDasharray="25 30" strokeLinecap="round" />
              <path d="M2200 1230Q2580 1160 2880 1290V1960Q2610 2010 2280 1880Z" fill="#83b5a3" stroke="#e8d7ab" strokeWidth="24" />
              {MAP_ONE_ZONES.map(zone => {
                const discovered = discoveredZoneIds.includes(zone.id);
                return <g key={zone.id} opacity={discovered ? 1 : .48}>
                  <circle cx={zone.point.x} cy={zone.point.y} r="82" fill={discovered ? '#f5e7bf' : '#82976d'} fillOpacity=".76" stroke={discovered ? '#fff7dd' : '#e3d4a9'} strokeWidth="14" />
                  <text x={zone.point.x} y={zone.point.y + 12} textAnchor="middle" fill="#365740" fontSize="75">{zone.id === 'me-linh-memorial' ? '🏛' : zone.id === 'me-linh-fields' ? '🌾' : zone.id === 'me-linh-market' ? '🧺' : zone.id === 'me-linh-river' ? '🛶' : zone.id === 'me-linh-forest' ? '🌳' : zone.id === 'me-linh-uno' ? '🎴' : '●'}</text>
                  <title>{zone.name} · {discovered ? 'Đã khám phá' : 'Chưa khám phá'}</title>
                </g>;
              })}
              {buildings.map(building => <rect key={building.id} x={building.x} y={building.y} width={building.width} height={building.height} rx="18" fill={building.roof} stroke="#fff0c8" strokeWidth="12" />)}
              {MAP_ONE_NPCS.filter(npc => npc.kind === 'historical' && mapLocations.some(location => location.id === npc.locationId)).map(npc => <circle key={npc.id} cx={npc.point.x} cy={npc.point.y} r="48" fill="#f3c75e" stroke="#fff8df" strokeWidth="16" />)}
              {mapLocations.filter(location => location.destinationMapId).map(location => <g key={location.id} transform={`translate(${location.point.x} ${location.point.y})`}><circle r="62" fill="#748a54" stroke="#fff8df" strokeWidth="16" /><text textAnchor="middle" y="30" fontSize="74">🚪</text><title>Điểm chuyển bản đồ · {location.name}</title></g>)}
              {activeQuestLocationId && mapLocations.find(location => location.id === activeQuestLocationId) && <path d={`M${mapLocations.find(location => location.id === activeQuestLocationId)!.point.x} ${mapLocations.find(location => location.id === activeQuestLocationId)!.point.y - 100}l45 80h-90Z`} fill="#d85e42" stroke="#fff3d4" strokeWidth="12" />}
              <circle cx={motion.point.x} cy={motion.point.y} r="65" fill="#bd4b39" stroke="#fff7dc" strokeWidth="25" />
            </svg>
            <button type="button" className="map-minimap-one__expand" onClick={() => { clearInput(); setOverview(true); }}><kbd>M</kbd> Mở sơ đồ</button>
          </>}
        </aside> : <button type="button" className="map-minimap" aria-label="Mở sơ đồ xóm · tất cả chức năng" aria-keyshortcuts="M" onClick={() => { clearInput(); setOverview(true); }}>
          <svg viewBox={`0 0 ${worldSize.width} ${worldSize.height}`} aria-hidden="true"><rect width={worldSize.width} height={worldSize.height} rx="60" fill="#afbd8a" />{buildings.map(building => <rect key={building.id} x={building.x} y={building.y} width={building.width} height={building.height} rx="10" fill={building.roof} />)}{mapLocations.filter(location => location.feature).map(location => <circle key={location.id} cx={location.point.x} cy={location.point.y} r={mapOneMode ? 22 : 18} fill="#fff4ce" />)}<circle cx={motion.point.x} cy={motion.point.y} r="31" fill="#bd4b39" stroke="#fff7dc" strokeWidth="15" /></svg>
          <span><kbd>M</kbd> SƠ ĐỒ <b aria-hidden="true">↗</b></span>
        </button>)}
        {touchMode&&<VirtualJoystick resetKey={controlReset} onChange={vector=>{joystick.current=vector;if(vector.x||vector.y){walkingPath.current=[];setDestination(null);setPan({x:0,y:0});setMovementHint('');}}} />}
        <div className="map-interaction" aria-live="polite">
          {interactionLocation ? <button type="button" disabled={touchMode&&!interactionReady} onClick={interact}><kbd>E</kbd><span><strong>{touchMode?'Tương tác':interactionLocation.name}</strong><small>{touchMode?interactionReady?interactionLocation.name:'Đến gần để tương tác':interactionLocation.action}</small></span><span aria-hidden="true">↗</span></button> : <span className="map-walk-hint">{compact ? 'Đi đến vòng sáng để tương tác' : 'Chạm biển hiệu để ghé · M mở sơ đồ'}</span>}
        </div>
        {touchMode&&<div className="touch-action-buttons">
          <button type="button" aria-label="Giữ để chạy nhanh" onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);sprintPointer.current=event.pointerId;}} onPointerUp={()=>{sprintPointer.current=null;}} onPointerCancel={()=>{sprintPointer.current=null;}} onLostPointerCapture={()=>{sprintPointer.current=null;}}>Chạy</button>
          <button type="button" aria-label="Bản đồ cảm ứng" onClick={()=>{clearInput();setOverview(true);}}>Bản đồ</button>
        </div>}
        {movementHint&&<p className="movement-hint" role="status">{movementHint}</p>}
      </div>
      <div className="map-control-bar"><span>Nhấp chuột để đi · Kéo để xem bản đồ · <kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> {!compact && <><kbd>Shift</kbd> Chạy · <kbd>E</kbd> Trò chuyện · <kbd>M</kbd> Sơ đồ</>}</span><button type="button" onClick={returnToEntrance}>↺ Về đầu hẻm</button></div>
    </div>
    {overview && <MapOverview point={motion.point} locations={mapLocations} featureLabels={featureLabels} worldName={mapName.toUpperCase()} buildings={buildings} landscape={landscape} historyMode={historyMode} fame={fame} onClose={() => setOverview(false)} onSelect={location => { setOverview(false); activate(location); }} />}
    {dialogue && <MapDialog title={dialogue.name} subtitle={speaker ? ('role' in speaker ? speaker.role : speaker.activity) : 'Chuyện trong xóm'} onClose={() => setDialogue(null)} closeLabel="Đi tiếp" className="location-conversation">
      <div className="neighbor-conversation">{speaker ? mapOneMode && mapOneSpeaker ? <CharacterSprite className="conversation-portrait" appearance={mapOneSpeaker.appearance} npcDesign={mapOneSpeaker.design} portrait /> : <NeighborSprite npcId={speaker.id} className="conversation-portrait" portrait /> : <span className="conversation-lotus" aria-hidden="true">❀</span>}<div><p>{dialogue.dialogue}</p>{(dialogue.feature || dialogue.destinationMapId) && onInteract && <button type="button" className="neighbor-feature-button" disabled={dialogue.locked && !dialogue.destinationMapId} onClick={() => { setDialogue(null); onInteract(dialogue); }}>{historyMode ? dialogue.action : featureInfo(dialogue.feature!).activity} <span aria-hidden="true">↗</span></button>}</div></div>
    </MapDialog>}
  </>;
}
