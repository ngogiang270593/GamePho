import type { Facing } from './character';

export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface WorldBounds { width: number; height: number }
export interface MapBuilding {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  color: string;
  roof: string;
}
export type HistoricalLandscape = 'me-linh' | 'bach-dang' | 'lam-son' | 'dong-da' | 'dien-bien';
export const WORLD_FEATURES = {
  cards: { title: 'UNO Xóm', activity: 'Chơi UNO', icon: '🎴', hint: 'UNO vui cùng cả xóm · đấu máy hoặc lập nhóm.' },
  shop: { title: 'Quán Xóm Nhà Lá', activity: 'Bán phở', icon: '🍜', hint: 'Nghe gọi món, vào bếp rồi mang phở ra bàn.' },
  character: { title: 'Tiệm may Mận', activity: 'Nhân vật & thú cưng', icon: '👘', hint: 'Chọn Nam/Nữ, thay trang phục và bạn đồng hành.' },
  upgrades: { title: 'Sạp đồ của chú Tư', activity: 'Nâng cấp quán', icon: '🛠️', hint: 'Mua bếp, nồi và vật dụng cho quán.' },
  achievements: { title: 'Bảng vàng của xóm', activity: 'Thành tựu', icon: '🏆', hint: 'Xem thành tích và các mốc đã mở khóa.' },
  statistics: { title: 'Bàn sổ sách', activity: 'Thống kê', icon: '📒', hint: 'Theo dõi doanh thu và lịch sử đơn hàng.' },
  settings: { title: 'Góc nghỉ chân', activity: 'Cài đặt', icon: '⚙️', hint: 'Âm thanh, hình ảnh và dữ liệu trò chơi.' },
  backup: { title: 'Hòm lưu niệm', activity: 'Sao lưu', icon: '💾', hint: 'Lưu và chơi tiếp với 5 ô sao lưu.' },
  help: { title: 'Nhà Bà Năm', activity: 'Hướng dẫn', icon: '📖', hint: 'Làm quen với điều khiển và các địa điểm.' },
  journal: { title: 'Nhật ký xóm mình', activity: 'Chuyện xóm & kết thúc', icon: '✉', hint: 'Chuẩn bị ngày mới, chọn cách xử lý chuyện xóm và mở các kết thúc.' },
} as const;
export type WorldFeature = keyof typeof WORLD_FEATURES;
export type WorldFeatureInfo = { title: string; activity: string; icon: string; hint: string };

export interface WorldLocation {
  icon?: string;
  questId?: string;
  id: string;
  name: string;
  point: Point;
  action: string;
  dialogue?: string;
  feature?: WorldFeature;
  npcId?: string;
  destinationMapId?: string;
  unlockAt?: number;
  locked?: boolean;
}

export const WORLD_SIZE = { width: 1440, height: 1040 };
export const SPAWN: Point = { x: 480, y: 475 };
export const PLAYER_RADIUS = 13;
export const POSITION_STORAGE_KEY = 'pho-xom-world-position';

export const BUILDINGS: MapBuilding[] = [
  { id: 'pho', x: 170, y: 88, width: 360, height: 247, title: 'XÓM NHÀ LÁ', subtitle: 'Nồi nước dùng · Ấm tình xóm', color: '#e8bf75', roof: '#ad4939' },
  { id: 'tea', x: 625, y: 110, width: 242, height: 205, title: 'TRÀ SEN', subtitle: 'Chén trà đầu ngõ', color: '#b3c89a', roof: '#526e68' },
  { id: 'tailor', x: 1000, y: 88, width: 280, height: 247, title: 'TIỆM MAY MẬN', subtitle: 'Áo dài · Áo bà ba', color: '#e8bba8', roof: '#9f5555' },
  { id: 'house', x: 88, y: 685, width: 280, height: 235, title: 'NHÀ BÀ NĂM', subtitle: 'Hẻm 28', color: '#e5d2a6', roof: '#8a5945' },
];

export const OBSTACLES: Rect[] = [
  ...BUILDINGS.map(({ x, y, width, height }) => ({ x, y: y + 46, width, height: height - 46 })),
  { x: 1015, y: 495, width: 250, height: 112 },
  { x: 1050, y: 735, width: 240, height: 155 },
  { x: 623, y: 800, width: 133, height: 30 },
  { x: 412, y: 624, width: 68, height: 14 },
  { x: 548, y: 348, width: 44, height: 24 },
  { x: 964, y: 900, width: 20, height: 27 },
  ...[{ x: 95, y: 465 }, { x: 1335, y: 465 }, { x: 535, y: 745 }, { x: 905, y: 875 }].map(p => ({ x: p.x - 20, y: p.y - 18, width: 40, height: 34 })),
];

export const WORLD_LOCATIONS: WorldLocation[] = [
  { id: 'cards', name: 'UNO Xóm', point: { x: 765, y: 679 }, action: 'Vào bàn UNO', feature: 'cards' },
  { id: 'pho', name: 'Quán Xóm Nhà Lá', point: { x: 350, y: 369 }, action: 'Vào quán bán phở', feature: 'shop' },
  { id: 'journal', name: 'Bàn chuyện xóm', point: { x: 780, y: 369 }, action: 'Mở nhật ký và thư mới', feature: 'journal' },
  { id: 'tailor', name: 'Tiệm may Mận', point: { x: 1138, y: 375 }, action: 'Thay trang phục', feature: 'character' },
  { id: 'market', name: 'Sạp đồ của chú Tư', point: { x: 1135, y: 642 }, action: 'Xem nâng cấp quán', feature: 'upgrades' },
  { id: 'achievements', name: 'Bảng vàng của xóm', point: { x: 445, y: 655 }, action: 'Xem thành tựu', feature: 'achievements' },
  { id: 'statistics', name: 'Bàn sổ sách', point: { x: 568, y: 390 }, action: 'Xem sổ thu chi', feature: 'statistics' },
  { id: 'settings', name: 'Góc nghỉ chân', point: { x: 680, y: 874 }, action: 'Cài đặt trò chơi', feature: 'settings' },
  { id: 'backup', name: 'Hòm lưu niệm', point: { x: 974, y: 952 }, action: 'Lưu và chơi tiếp', feature: 'backup' },
  { id: 'help', name: 'Nhà Bà Năm', point: { x: 225, y: 953 }, action: 'Xem hướng dẫn', feature: 'help' },
  { id: 'pond', name: 'Hồ sen', point: { x: 1170, y: 934 }, action: 'Ngắm hoa sen', dialogue: 'Gió khẽ qua mặt hồ. Hương sen, tiếng chim và tiếng rao buổi sáng làm góc hẻm thêm yên bình.' },
];

export function featurePath(feature: WorldFeature): string { return `/map/${feature}`; }

export function asWorldFeature(value: string | undefined): WorldFeature | undefined {
  return value && Object.prototype.hasOwnProperty.call(WORLD_FEATURES, value) ? value as WorldFeature : undefined;
}

export function canStandAt(point: Point, worldSize: WorldBounds = WORLD_SIZE): boolean {
  const r = PLAYER_RADIUS;
  if (point.x < 40 + r || point.x > worldSize.width - 40 - r || point.y < 60 + r || point.y > worldSize.height - 40 - r) return false;
  return !OBSTACLES.some(rect => {
    const nearestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
    const nearestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
    return (point.x - nearestX) ** 2 + (point.y - nearestY) ** 2 < r * r;
  });
}

export function movePlayer(point: Point, input: Point, seconds: number, running = false): Point {
  const length = Math.hypot(input.x, input.y);
  if (!length) return point;
  const distance = (running ? 250 : 160) * Math.min(Math.max(seconds, 0), 0.05);
  const dx = input.x / length * distance;
  const dy = input.y / length * distance;
  const steps = Math.max(1, Math.ceil(distance / 5));
  let next = { ...point };
  for (let step = 0; step < steps; step++) {
    const horizontal = { x: next.x + dx / steps, y: next.y };
    if (canStandAt(horizontal)) next = horizontal;
    const vertical = { x: next.x, y: next.y + dy / steps };
    if (canStandAt(vertical)) next = vertical;
  }
  return next;
}

export function facingForInput(input: Point, current: Facing): Facing {
  if (input.x) return input.x > 0 ? 'right' : 'left';
  if (input.y) return input.y > 0 ? 'down' : 'up';
  return current;
}

export function nearestLocation(point: Point, locations: readonly WorldLocation[] = WORLD_LOCATIONS): WorldLocation | undefined {
  return locations.filter(location => Math.hypot(location.point.x - point.x, location.point.y - point.y) < 80)
    .sort((a, b) => Math.hypot(a.point.x - point.x, a.point.y - point.y) - Math.hypot(b.point.x - point.x, b.point.y - point.y))[0];
}

export function readPosition(key = POSITION_STORAGE_KEY, fallback: Point = SPAWN): Point {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (value && Number.isFinite(value.x) && Number.isFinite(value.y) && canStandAt(value)) return { x: value.x, y: value.y };
  } catch { /* Recover a damaged or older save at the entrance. */ }
  return { ...fallback };
}
