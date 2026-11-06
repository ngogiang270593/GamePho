import type { Point, Rect } from './world';
import { OPENING_MAP_WIDTH, OPENING_MAP_HEIGHT } from './openingMapBounds.mjs';

export { OPENING_MAP_WIDTH, OPENING_MAP_HEIGHT } from './openingMapBounds.mjs';

// Geometry is shared by the scenery, navigation, map overview and draft editors.
// 4,320 × 3,000 is exactly ten times the original 1,440 × 900 map area.
export const OPENING_MAP_ID = 'opening-map';
export const OPENING_MAP_BOUNDS = { width: OPENING_MAP_WIDTH, height: OPENING_MAP_HEIGHT };
export const OPENING_MAP_SPAWN: Point = { x: 2160, y: 1620 };
export const OPENING_MAP_REST_POINT: Point = { x: 2912, y: 2006 };
export const OPENING_MAP_MEMORY_KEEPER_CLEARING: Rect = { x: 2500, y: 1580, width: 700, height: 850 };
export const OPENING_MAP_PLAYER_RADIUS = 14;

export interface OpeningMapArea {
  id: string;
  name: string;
  label: string;
  point: Point;
  radius: number;
  type: 'market' | 'north' | 'east' | 'south' | 'west';
  icon: string;
}
export interface OpeningMapRoad { id: string; points: Point[]; width: number }
export interface OpeningMapBuilding extends Rect {
  id: string;
  kind: 'house' | 'stall';
  roof: string;
  color: string;
}
export interface OpeningMapTree {
  id: string;
  x: number;
  y: number;
  scale: number;
  kind: 'bamboo' | 'banyan' | 'palm' | 'fruit';
}
export interface OpeningMapGate {
  id: string;
  direction: 'north' | 'east' | 'south' | 'west';
  name: string;
  point: Point;
  width: number;
}

export const OPENING_MAP_AREAS: readonly OpeningMapArea[] = [
  { id: 'market', name: 'Chợ làng', label: 'CHỢ LÀNG', point: { x: 2160, y: 1500 }, radius: 410, type: 'market', icon: '▤' },
  { id: 'north', name: 'Đồi chè phía Bắc', label: 'ĐỒI CHÈ', point: { x: 2160, y: 610 }, radius: 440, type: 'north', icon: '♧' },
  { id: 'east', name: 'Bến sông phía Đông', label: 'BẾN SÔNG', point: { x: 3650, y: 1500 }, radius: 420, type: 'east', icon: '≈' },
  { id: 'south', name: 'Đồng lúa phía Nam', label: 'ĐỒNG LÚA', point: { x: 2160, y: 2550 }, radius: 450, type: 'south', icon: '♒' },
  { id: 'west', name: 'Rừng tre phía Tây', label: 'RỪNG TRE', point: { x: 780, y: 1500 }, radius: 490, type: 'west', icon: '♧' },
];

export const OPENING_MAP_GATES: readonly OpeningMapGate[] = [
  { id: 'north', direction: 'north', name: 'Cổng Bắc', point: { x: 2160, y: 980 }, width: 180 },
  { id: 'east', direction: 'east', name: 'Cổng Đông', point: { x: 2750, y: 1500 }, width: 190 },
  { id: 'south', direction: 'south', name: 'Cổng Nam', point: { x: 2160, y: 2040 }, width: 180 },
  { id: 'west', direction: 'west', name: 'Cổng Tây', point: { x: 1500, y: 1500 }, width: 190 },
];

export const OPENING_MAP_ROADS: readonly OpeningMapRoad[] = [
  { id: 'north-road', points: [{ x: 2160, y: 1500 }, { x: 2160, y: 420 }], width: 146 },
  { id: 'east-road', points: [{ x: 2160, y: 1500 }, { x: 3740, y: 1500 }], width: 158 },
  { id: 'south-road', points: [{ x: 2160, y: 1500 }, { x: 2160, y: 2670 }], width: 148 },
  { id: 'west-road', points: [{ x: 2160, y: 1500 }, { x: 540, y: 1500 }], width: 156 },
  { id: 'market-ring', points: [{ x: 1770, y: 1400 }, { x: 1770, y: 1760 }, { x: 2530, y: 1760 }, { x: 2530, y: 1400 }], width: 76 },
  { id: 'north-lane', points: [{ x: 1650, y: 1500 }, { x: 1650, y: 1350 }, { x: 2030, y: 1190 }, { x: 2160, y: 1190 }, { x: 2530, y: 1200 }, { x: 2670, y: 1500 }], width: 68 },
  { id: 'tea-loop', points: [{ x: 2160, y: 800 }, { x: 1850, y: 760 }, { x: 1590, y: 610 }, { x: 1730, y: 380 }, { x: 2160, y: 420 }, { x: 2480, y: 340 }, { x: 2640, y: 630 }, { x: 2420, y: 820 }, { x: 2160, y: 800 }], width: 70 },
  { id: 'bamboo-loop', points: [{ x: 1260, y: 1500 }, { x: 1090, y: 1100 }, { x: 680, y: 960 }, { x: 360, y: 1220 }, { x: 540, y: 1500 }, { x: 430, y: 1860 }, { x: 920, y: 2110 }, { x: 1250, y: 1830 }, { x: 1260, y: 1500 }], width: 76 },
  { id: 'rice-west', points: [{ x: 2160, y: 2200 }, { x: 1720, y: 2200 }, { x: 1510, y: 2450 }, { x: 1570, y: 2760 }, { x: 2160, y: 2670 }], width: 62 },
  { id: 'rice-east', points: [{ x: 2160, y: 2240 }, { x: 2650, y: 2220 }, { x: 2840, y: 2540 }, { x: 2720, y: 2780 }, { x: 2160, y: 2670 }], width: 62 },
  { id: 'riverside', points: [{ x: 3440, y: 800 }, { x: 3520, y: 1160 }, { x: 3500, y: 1500 }, { x: 3430, y: 1860 }, { x: 3500, y: 2240 }, { x: 3730, y: 2470 }], width: 84 },
];

export const OPENING_MAP_BUILDINGS: readonly OpeningMapBuilding[] = [
  { id: 'home-nw-1', kind: 'house', x: 1520, y: 1110, width: 170, height: 160, roof: '#9c5942', color: '#ebd5ac' },
  { id: 'home-nw-2', kind: 'house', x: 1720, y: 980, width: 180, height: 155, roof: '#8c5a4d', color: '#e0c99e' },
  { id: 'home-nw-3', kind: 'house', x: 1930, y: 995, width: 145, height: 145, roof: '#a86642', color: '#e8d9b0' },
  { id: 'home-ne-1', kind: 'house', x: 2250, y: 990, width: 175, height: 150, roof: '#8d6452', color: '#daca9f' },
  { id: 'home-ne-2', kind: 'house', x: 2450, y: 1020, width: 185, height: 160, roof: '#a45b42', color: '#edd4ad' },
  { id: 'home-e-2', kind: 'house', x: 2640, y: 1640, width: 165, height: 170, roof: '#8d5d49', color: '#ead5b1' },
  { id: 'home-se-1', kind: 'house', x: 2480, y: 1840, width: 175, height: 160, roof: '#a45c47', color: '#e8cba1' },
  { id: 'home-se-2', kind: 'house', x: 2260, y: 1890, width: 155, height: 150, roof: '#896650', color: '#d7cba9' },
  { id: 'home-sw-1', kind: 'house', x: 1940, y: 1895, width: 145, height: 150, roof: '#a66b48', color: '#e9d9b5' },
  { id: 'home-sw-2', kind: 'house', x: 1735, y: 1840, width: 175, height: 170, roof: '#8c6248', color: '#ddc79d' },
  { id: 'home-w-1', kind: 'house', x: 1500, y: 1650, width: 175, height: 165, roof: '#9e6249', color: '#ead2a9' },
  { id: 'stall-vegetables', kind: 'stall', x: 1810, y: 1240, width: 125, height: 112, roof: '#698564', color: '#d6bc88' },
  { id: 'stall-rice', kind: 'stall', x: 1970, y: 1250, width: 118, height: 110, roof: '#bd9a58', color: '#e0c793' },
  { id: 'stall-flowers', kind: 'stall', x: 1970, y: 1600, width: 118, height: 108, roof: '#a47173', color: '#e5cda0' },
];

export const OPENING_MAP_RIVER = {
  width: 230,
  points: [
    { x: 3210, y: -160 }, { x: 3150, y: 250 }, { x: 3250, y: 650 },
    { x: 3190, y: 1050 }, { x: 3135, y: 1500 }, { x: 3205, y: 1900 },
    { x: 3070, y: 2300 }, { x: 3160, y: 2740 }, { x: 3090, y: 3160 },
  ] as Point[],
};
export const OPENING_MAP_BRIDGES: readonly (Rect & { id: string })[] = [
  { id: 'market-bridge', x: 2920, y: 1415, width: 470, height: 170 },
];
const OPENING_MAP_CHECKPOINT_LINE = { x: 3135, bridge: OPENING_MAP_BRIDGES[0] };
export const OPENING_MAP_DOCK: Rect & { id: string } = {
  id: 'eastern-delivery-dock', x: 3220, y: 1570, width: 250, height: 175,
};
const OPENING_MAP_DOCK_SOLIDS: readonly (Rect | { x: number; y: number; radius: number })[] = [
  { x: 3410, y: 1605, width: 42, height: 38 },
  { x: 3430, y: 1640, width: 34, height: 32 },
  { x: 3240, y: 1587, radius: 11 },
  { x: 3448, y: 1587, radius: 11 },
  { x: 3240, y: 1728, radius: 11 },
  { x: 3448, y: 1728, radius: 11 },
];
export const OPENING_MAP_PONDS: readonly { id: string; x: number; y: number; rx: number; ry: number }[] = [
  { id: 'lotus-lake', x: 1040, y: 560, rx: 185, ry: 110 },
];

function distanceToSegmentSquared(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
  return (point.x - start.x - dx * t) ** 2 + (point.y - start.y - dy * t) ** 2;
}

function nearRoad(point: Point, clearance: number): boolean {
  return OPENING_MAP_ROADS.some(road => road.points.slice(1).some((end, index) =>
    distanceToSegmentSquared(point, road.points[index], end) < (road.width / 2 + clearance) ** 2));
}

// Ground footprints begin below the roof; players can walk behind tall scenery.
export const OPENING_MAP_BUILDING_FOOTPRINTS: readonly Rect[] = OPENING_MAP_BUILDINGS.map(building => ({
  x: building.x + (building.kind === 'house' ? 8 : 4),
  y: building.y + building.height * .56,
  width: building.width - (building.kind === 'house' ? 16 : 8),
  height: building.height * .44,
}));

function makeTrees(): OpeningMapTree[] {
  const trees: OpeningMapTree[] = [];
  let seed = 1847;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const regions: { kind: OpeningMapTree['kind']; count: number; x: number; y: number; width: number; height: number }[] = [
    { kind: 'bamboo', count: 106, x: 180, y: 750, width: 1200, height: 1500 },
    { kind: 'fruit', count: 48, x: 1400, y: 170, width: 1370, height: 740 },
    { kind: 'palm', count: 29, x: 3400, y: 500, width: 640, height: 2120 },
    { kind: 'banyan', count: 28, x: 1330, y: 890, width: 1570, height: 1240 },
    { kind: 'fruit', count: 25, x: 280, y: 2310, width: 980, height: 490 },
  ];
  for (const region of regions) {
    for (let attempt = 0, placed = 0; placed < region.count && attempt < region.count * 20; attempt++) {
      const tree = { x: region.x + random() * region.width, y: region.y + random() * region.height, scale: .7 + random() * .55 };
      if (nearRoad(tree, 46)) continue;
      if (OPENING_MAP_PONDS.some(pond => ((tree.x - pond.x) / (pond.rx + 20)) ** 2 + ((tree.y - pond.y) / (pond.ry + 20)) ** 2 <= 1)) continue;
      if (tree.x > 1680 && tree.x < 2580 && tree.y > 1120 && tree.y < 1820) continue;
      if (tree.x >= OPENING_MAP_MEMORY_KEEPER_CLEARING.x && tree.x <= OPENING_MAP_MEMORY_KEEPER_CLEARING.x + OPENING_MAP_MEMORY_KEEPER_CLEARING.width
        && tree.y >= OPENING_MAP_MEMORY_KEEPER_CLEARING.y && tree.y <= OPENING_MAP_MEMORY_KEEPER_CLEARING.y + OPENING_MAP_MEMORY_KEEPER_CLEARING.height) continue;
      if (OPENING_MAP_BUILDINGS.some(building => tree.x > building.x - 55 && tree.x < building.x + building.width + 55 && tree.y > building.y - 25 && tree.y < building.y + building.height + 65)) continue;
      if (trees.some(other => Math.hypot(other.x - tree.x, other.y - tree.y) < 48)) continue;
      trees.push({ ...tree, id: `${region.kind}-${trees.length}`, kind: region.kind });
      placed++;
    }
  }
  return trees;
}

export const OPENING_MAP_TREES: readonly OpeningMapTree[] = makeTrees();

// Only nearby solid objects need checking, even when A* explores the entire map.
type CollisionShape = { kind: 'rect'; rect: Rect } | { kind: 'tree'; point: Point; radius: number };
const COLLISION_CELL = 192;
const COLLISION_COLUMNS = Math.ceil(OPENING_MAP_WIDTH / COLLISION_CELL);
const COLLISION_ROWS = Math.ceil(OPENING_MAP_HEIGHT / COLLISION_CELL);
const collisionBuckets: (CollisionShape[] | undefined)[] = new Array(COLLISION_COLUMNS * COLLISION_ROWS);
const riverSegments = OPENING_MAP_RIVER.points.slice(1).map((end, index) => ({ start: OPENING_MAP_RIVER.points[index], end }));
function addCollisionShape(shape: CollisionShape, rect: Rect): void {
  for (let x = Math.floor(rect.x / COLLISION_CELL); x <= Math.floor((rect.x + rect.width) / COLLISION_CELL); x++) {
    for (let y = Math.floor(rect.y / COLLISION_CELL); y <= Math.floor((rect.y + rect.height) / COLLISION_CELL); y++) {
      const key = y * COLLISION_COLUMNS + x;
      const bucket = collisionBuckets[key] ?? (collisionBuckets[key] = []);
      bucket.push(shape);
    }
  }
}
for (const rect of OPENING_MAP_BUILDING_FOOTPRINTS) addCollisionShape({ kind: 'rect', rect }, rect);
for (const tree of OPENING_MAP_TREES) {
  const radius = tree.scale * (tree.kind === 'banyan' ? 14 : 9);
  addCollisionShape({ kind: 'tree', point: tree, radius }, { x: tree.x - radius, y: tree.y - radius, width: radius * 2, height: radius * 2 });
}
for (const solid of OPENING_MAP_DOCK_SOLIDS) {
  if ('radius' in solid) {
    addCollisionShape({ kind: 'tree', point: solid, radius: solid.radius }, { x: solid.x - solid.radius, y: solid.y - solid.radius, width: solid.radius * 2, height: solid.radius * 2 });
  } else addCollisionShape({ kind: 'rect', rect: solid }, solid);
}

export function isOpeningMapWalkable(point: Point, radius = OPENING_MAP_PLAYER_RADIUS, checkpointOpen = true): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(radius) || radius < 0) return false;
  const margin = 24 + radius;
  if (point.x < margin || point.y < margin || point.x > OPENING_MAP_WIDTH - margin || point.y > OPENING_MAP_HEIGHT - margin) return false;
  if (OPENING_MAP_PONDS.some(pond => ((point.x - pond.x) / (pond.rx + radius)) ** 2 + ((point.y - pond.y) / (pond.ry + radius)) ** 2 <= 1)) return false;
  const onBridge = OPENING_MAP_BRIDGES.some(bridge => point.x >= bridge.x + radius && point.x <= bridge.x + bridge.width - radius && point.y >= bridge.y + radius && point.y <= bridge.y + bridge.height - radius);
  const onDock = point.x >= OPENING_MAP_DOCK.x + radius && point.x <= OPENING_MAP_DOCK.x + OPENING_MAP_DOCK.width - radius
    && point.y >= OPENING_MAP_DOCK.y + radius && point.y <= OPENING_MAP_DOCK.y + OPENING_MAP_DOCK.height - radius;
  const checkpointBridge = OPENING_MAP_CHECKPOINT_LINE.bridge;
  if (!checkpointOpen && Math.abs(point.x - OPENING_MAP_CHECKPOINT_LINE.x) <= radius
    && point.y >= checkpointBridge.y + radius && point.y <= checkpointBridge.y + checkpointBridge.height - radius) return false;
  if (!onBridge && !onDock) {
    const riverClearance = (OPENING_MAP_RIVER.width / 2 + radius) ** 2;
    for (const segment of riverSegments) {
      if (distanceToSegmentSquared(point, segment.start, segment.end) < riverClearance) return false;
    }
  }
  for (let x = Math.floor((point.x - radius) / COLLISION_CELL); x <= Math.floor((point.x + radius) / COLLISION_CELL); x++) {
    for (let y = Math.floor((point.y - radius) / COLLISION_CELL); y <= Math.floor((point.y + radius) / COLLISION_CELL); y++) {
      const bucket = collisionBuckets[y * COLLISION_COLUMNS + x];
      if (!bucket) continue;
      for (const shape of bucket) {
        if (shape.kind === 'tree') {
          if ((point.x - shape.point.x) ** 2 + (point.y - shape.point.y) ** 2 < (radius + shape.radius) ** 2) return false;
        } else {
          const nearestX = Math.max(shape.rect.x, Math.min(point.x, shape.rect.x + shape.rect.width));
          const nearestY = Math.max(shape.rect.y, Math.min(point.y, shape.rect.y + shape.rect.height));
          if ((point.x - nearestX) ** 2 + (point.y - nearestY) ** 2 <= radius ** 2) return false;
        }
      }
    }
  }
  return true;
}

export function nearestOpeningMapWalkablePoint(target: Point, checkpointOpen = true): Point | null {
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return null;
  const margin = 24 + OPENING_MAP_PLAYER_RADIUS;
  const origin = { x: Math.max(margin, Math.min(OPENING_MAP_WIDTH - margin, target.x)), y: Math.max(margin, Math.min(OPENING_MAP_HEIGHT - margin, target.y)) };
  if (isOpeningMapWalkable(origin, OPENING_MAP_PLAYER_RADIUS, checkpointOpen)) return origin;
  // Eight-pixel rings give click destinations a stable, close edge on houses and water.
  for (let radius = 8; radius <= 720; radius += 8) {
    const count = Math.max(16, Math.ceil(2 * Math.PI * radius / 14));
    let best: Point | null = null;
    let bestDistance = Infinity;
    for (let index = 0; index < count; index++) {
      const angle = index * Math.PI * 2 / count;
      const candidate = { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
      if (!isOpeningMapWalkable(candidate, OPENING_MAP_PLAYER_RADIUS, checkpointOpen)) continue;
      const distance = (candidate.x - target.x) ** 2 + (candidate.y - target.y) ** 2;
      if (distance < bestDistance) { best = candidate; bestDistance = distance; }
    }
    if (best) return best;
  }
  return null;
}

export function isOpeningMapSegmentWalkable(start: Point, end: Point, checkpointOpen = true): boolean {
  const count = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / 7));
  for (let index = 0; index <= count; index++) {
    if (!isOpeningMapWalkable({ x: start.x + (end.x - start.x) * index / count, y: start.y + (end.y - start.y) * index / count }, OPENING_MAP_PLAYER_RADIUS, checkpointOpen)) return false;
  }
  return true;
}

const NAVIGATION_STEP = 36;
const NAVIGATION_COLUMNS = Math.ceil(OPENING_MAP_WIDTH / NAVIGATION_STEP);
const NAVIGATION_ROWS = Math.ceil(OPENING_MAP_HEIGHT / NAVIGATION_STEP);
const NAVIGATION_COUNT = NAVIGATION_COLUMNS * NAVIGATION_ROWS;
const navigationWalkable = new Int8Array(NAVIGATION_COUNT);
const checkpointClosedNavigationWalkable = new Int8Array(NAVIGATION_COUNT);
function nodePoint(index: number): Point {
  return { x: (index % NAVIGATION_COLUMNS + .5) * NAVIGATION_STEP, y: (Math.floor(index / NAVIGATION_COLUMNS) + .5) * NAVIGATION_STEP };
}
function isNodeWalkable(index: number, checkpointOpen: boolean): boolean {
  const cache = checkpointOpen ? navigationWalkable : checkpointClosedNavigationWalkable;
  if (!cache[index]) cache[index] = isOpeningMapWalkable(nodePoint(index), OPENING_MAP_PLAYER_RADIUS, checkpointOpen) ? 1 : -1;
  return cache[index] === 1;
}
function nearbyNode(point: Point, checkpointOpen: boolean): number | null {
  const column = Math.floor(point.x / NAVIGATION_STEP);
  const row = Math.floor(point.y / NAVIGATION_STEP);
  let closest: number | null = null;
  let distance = Infinity;
  for (let ring = 0; ring <= 4; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (ring && Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
        const x = column + dx;
        const y = row + dy;
        if (x < 0 || y < 0 || x >= NAVIGATION_COLUMNS || y >= NAVIGATION_ROWS) continue;
        const index = y * NAVIGATION_COLUMNS + x;
        if (!isNodeWalkable(index, checkpointOpen)) continue;
        const candidate = nodePoint(index);
        const squared = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;
        if (squared < distance && isOpeningMapSegmentWalkable(point, candidate, checkpointOpen)) { closest = index; distance = squared; }
      }
    }
    if (closest !== null) return closest;
  }
  return null;
}

interface SearchNode { index: number; priority: number; cost: number }
class NavigationHeap {
  private nodes: SearchNode[] = [];
  get length(): number { return this.nodes.length; }
  push(node: SearchNode): void {
    let index = this.nodes.length;
    this.nodes.push(node);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.nodes[parent].priority <= node.priority) break;
      this.nodes[index] = this.nodes[parent];
      index = parent;
    }
    this.nodes[index] = node;
  }
  pop(): SearchNode {
    const result = this.nodes[0];
    const last = this.nodes.pop()!;
    if (this.nodes.length) {
      let index = 0;
      while (index * 2 + 1 < this.nodes.length) {
        let child = index * 2 + 1;
        if (child + 1 < this.nodes.length && this.nodes[child + 1].priority < this.nodes[child].priority) child++;
        if (this.nodes[child].priority >= last.priority) break;
        this.nodes[index] = this.nodes[child];
        index = child;
      }
      this.nodes[index] = last;
    }
    return result;
  }
}

/** Click navigation uses A* with a heap and cached terrain, then smooths visible turns. */
export function findOpeningMapPath(start: Point, requestedTarget: Point, checkpointOpen = true): Point[] {
  if (!isOpeningMapWalkable(start, OPENING_MAP_PLAYER_RADIUS, checkpointOpen)) return [];
  if (!checkpointOpen && isOpeningMapWalkable(requestedTarget)
    && !isOpeningMapWalkable(requestedTarget, OPENING_MAP_PLAYER_RADIUS, false)) return [];
  const target = nearestOpeningMapWalkablePoint(requestedTarget, checkpointOpen);
  if (!target) return [];
  if (isOpeningMapSegmentWalkable(start, target, checkpointOpen)) return [target];
  const startIndex = nearbyNode(start, checkpointOpen);
  const targetIndex = nearbyNode(target, checkpointOpen);
  if (startIndex === null || targetIndex === null) return [];
  const costs = new Float64Array(NAVIGATION_COUNT).fill(Infinity);
  const parents = new Int32Array(NAVIGATION_COUNT).fill(-1);
  const closed = new Uint8Array(NAVIGATION_COUNT);
  const targetPoint = nodePoint(targetIndex);
  const heuristic = (index: number) => { const point = nodePoint(index); return Math.hypot(point.x - targetPoint.x, point.y - targetPoint.y); };
  const heap = new NavigationHeap();
  costs[startIndex] = 0;
  heap.push({ index: startIndex, cost: 0, priority: heuristic(startIndex) });
  while (heap.length) {
    const current = heap.pop();
    if (closed[current.index] || current.cost > costs[current.index]) continue;
    if (current.index === targetIndex) {
      const route: Point[] = [target];
      let index = targetIndex;
      while (index !== -1) { route.push(nodePoint(index)); index = parents[index]; }
      route.reverse();
      const smoothed: Point[] = [];
      let anchor = start;
      for (let next = 0; next < route.length;) {
        let furthest = next;
        while (furthest + 1 < route.length && isOpeningMapSegmentWalkable(anchor, route[furthest + 1], checkpointOpen)) furthest++;
        smoothed.push(route[furthest]);
        anchor = route[furthest];
        next = furthest + 1;
      }
      return smoothed;
    }
    closed[current.index] = 1;
    const column = current.index % NAVIGATION_COLUMNS;
    const row = Math.floor(current.index / NAVIGATION_COLUMNS);
    const point = nodePoint(current.index);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const x = column + dx;
        const y = row + dy;
        if (x < 0 || y < 0 || x >= NAVIGATION_COLUMNS || y >= NAVIGATION_ROWS) continue;
        const neighbor = y * NAVIGATION_COLUMNS + x;
        if (closed[neighbor] || !isNodeWalkable(neighbor, checkpointOpen)) continue;
        // Prevent diagonal corner cutting through the edge of a wall or tree trunk.
        if (dx && dy && (!isNodeWalkable(row * NAVIGATION_COLUMNS + x, checkpointOpen) || !isNodeWalkable(y * NAVIGATION_COLUMNS + column, checkpointOpen))) continue;
        const cost = current.cost + NAVIGATION_STEP * (dx && dy ? Math.SQRT2 : 1);
        if (cost >= costs[neighbor] || !isOpeningMapSegmentWalkable(point, nodePoint(neighbor), checkpointOpen)) continue;
        costs[neighbor] = cost;
        parents[neighbor] = current.index;
        heap.push({ index: neighbor, cost, priority: cost + heuristic(neighbor) });
      }
    }
  }
  return [];
}
