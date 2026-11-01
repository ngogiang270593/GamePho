import { DEFAULT_APPEARANCES, type CharacterAppearance, type Facing } from './character';
import { canStandAt, facingForInput, movePlayer, type Point, type WorldFeature, type WorldLocation } from './world';
import { VILLAGE_NPCS } from './villageNpcs';

export interface NpcDefinition {
  id: string;
  name: string;
  role: string;
  appearance: CharacterAppearance;
  route: Point[];
  speed: number;
  rest: number;
  dialogue: string;
  feature?: WorldFeature;
}
export interface NpcMotion { id: string; point: Point; facing: Facing; moving: boolean; next: number; rest: number }

export const NEIGHBORS: NpcDefinition[] = [
  ...VILLAGE_NPCS,
  {
    id: 'co-ba', name: 'Cô Ba', role: 'Chủ quán nước', speed: 34, rest: 2,
    appearance: { ...DEFAULT_APPEARANCES.female, outfit: 'baba', hair: 'bun', skin: 'honey', accessory: 'none', eyes: 'smile' },
    route: [{ x: 735, y: 383 }, { x: 836, y: 383 }, { x: 836, y: 454 }, { x: 710, y: 454 }],
    dialogue: 'Trà sen cô ủ thơm lắm, uống một ngụm là nhớ sử ngay! Uống hai ngụm thì nhớ… trả tiền trà nha con!',
  },
  {
    id: 'ba-nam', name: 'Bà Năm', role: 'Người rành chuyện xóm', speed: 26, rest: 3,
    appearance: { ...DEFAULT_APPEARANCES.female, outfit: 'baba', hair: 'bun', skin: 'tan', accessory: 'nonla', eyes: 'smile' },
    route: [{ x: 405, y: 903 }, { x: 450, y: 903 }, { x: 450, y: 840 }, { x: 405, y: 840 }],
    dialogue: 'Đi thong thả thôi con, lịch sử không chạy mất đâu. Còn nếu lạc đường thì bấm M xem bản đồ; bà chỉ đường chứ không chỉ đáp án đâu nghen!', feature: 'help',
  },
  {
    id: 'ti', name: 'Tí', role: 'Bạn mê UNO', speed: 65, rest: 1,
    appearance: { ...DEFAULT_APPEARANCES.male, hair: 'crop', accessory: 'none', outfit: 'baba', skin: 'peach' },
    route: [{ x: 650, y: 665 }, { x: 820, y: 665 }, { x: 820, y: 748 }, { x: 650, y: 748 }],
    dialogue: 'Anh chị ghé đấu UNO nha! Em đã xếp bài ngay ngắn rồi — trừ lá bài em giấu dưới gầm bàn, nhưng luật cấm em nói lá nào đó!', feature: 'cards',
  },
  {
    id: 'man', name: 'Mận', role: 'Người giữ bộ sưu tập', speed: 39, rest: 2.5,
    appearance: { ...DEFAULT_APPEARANCES.female, outfit: 'tuthan', hair: 'braid', accessory: 'moqua', skin: 'peach' },
    route: [{ x: 1080, y: 382 }, { x: 1228, y: 382 }, { x: 1228, y: 448 }, { x: 1080, y: 448 }],
    dialogue: 'Bến nước soi mặt rõ lắm, nhưng đừng soi lâu quá kẻo cá tưởng có đối thủ thi sắc đẹp! Huy hiệu và nhân vật bạn gặp đều được cất trong bộ sưu tập.', feature: 'character',
  },
  {
    id: 'chu-tu', name: 'Chú Tư', role: 'Chủ cửa hàng', speed: 43, rest: 1.8,
    appearance: { ...DEFAULT_APPEARANCES.male, outfit: 'baba', hair: 'short', accessory: 'none', skin: 'tan' },
    route: [{ x: 950, y: 648 }, { x: 998, y: 648 }, { x: 998, y: 714 }, { x: 950, y: 714 }],
    dialogue: 'Cửa hàng của chú chỉ dùng xu trong game. Chọn món, xem giá rồi xác nhận mua nhé. Đồ đã mua sẽ nằm trong tủ đồ của con!', feature: 'upgrades',
  },
  {
    id: 'bac-sau', name: 'Bác Sáu', role: 'Thủ từ đình làng', speed: 31, rest: 2.4,
    appearance: { ...DEFAULT_APPEARANCES.male, outfit: 'nguthan', hair: 'sidepart', accessory: 'khandong', skin: 'honey', eyes: 'smile' },
    route: [{ x: 580, y: 414 }, { x: 645, y: 414 }, { x: 645, y: 485 }, { x: 580, y: 485 }],
    dialogue: 'Danh vọng giống lúa ngoài đồng: chăm học thì lúa trổ bông, chăm bấm nút bỏ qua thì… bông chưa kịp chào con!', feature: 'statistics',
  },
];

export function createNeighbors(): NpcMotion[] {
  return NEIGHBORS.map(npc => ({ id: npc.id, point: { ...npc.route[0] }, facing: 'down', moving: false, next: 1, rest: 0 }));
}

function faceToward(from: Point, to: Point, facing: Facing): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) + Math.abs(dy) < 1) return facing;
  return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
}

export function stepNeighbors(old: NpcMotion[], player: Point, seconds: number, paused = false): NpcMotion[] {
  const dt = Math.min(Math.max(seconds, 0), .05);
  let changed = false;
  const next = old.map((motion, index) => {
    const npc = NEIGHBORS[index];
    const nearPlayer = Math.hypot(player.x - motion.point.x, player.y - motion.point.y) < 72;
    if (paused || nearPlayer) {
      const facing = nearPlayer ? faceToward(motion.point, player, motion.facing) : motion.facing;
      if (!motion.moving && motion.facing === facing) return motion;
      changed = true;
      return { ...motion, moving: false, facing };
    }
    if (!dt) return motion;
    if (motion.rest > 0) {
      changed = true;
      return { ...motion, rest: Math.max(0, motion.rest - dt), moving: false };
    }
    const target = npc.route[motion.next];
    const input = { x: target.x - motion.point.x, y: target.y - motion.point.y };
    const remaining = Math.hypot(input.x, input.y);
    if (remaining < 1.5) {
      changed = true;
      return { ...motion, point: { ...target }, next: (motion.next + 1) % npc.route.length, rest: npc.rest, moving: false };
    }
    const point = movePlayer(motion.point, input, Math.min(dt, remaining / npc.speed) * npc.speed / 160);
    if (!canStandAt(point)) return motion;
    const moving = Math.hypot(point.x - motion.point.x, point.y - motion.point.y) > .01;
    if (!moving && !motion.moving) return motion;
    changed = true;
    return { ...motion, point, moving, facing: facingForInput(input, motion.facing) };
  });
  return changed ? next : old;
}

export function neighborLocations(motions: NpcMotion[]): WorldLocation[] {
  return motions.map((motion, index) => {
    const npc = NEIGHBORS[index];
    return { id: `npc-${npc.id}`, npcId: npc.id, name: npc.name, point: motion.point, action: `Trò chuyện · ${npc.role}`, dialogue: npc.dialogue, feature: npc.feature };
  });
}
