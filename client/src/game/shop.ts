import { DEFAULT_APPEARANCES, type CharacterAppearance, type Facing } from './character';
import type { Customer, PhoMenuItem, PhoOrder } from '../services/gameTypes';
import type { Point } from './world';
import { customerProfile } from './customerCast';

export type ShopPhase = 'idle' | 'arriving' | 'choosing' | 'blanching' | 'blanched' | 'pouring' | 'plating' | 'ready' | 'carrying' | 'handoff' | 'tasting' | 'happy' | 'unhappy' | 'drama' | 'calming' | 'calmed' | 'expired' | 'leaving';
export interface ShopMoment { phase: ShopPhase; startedAt: number }
export const SHOP_DURATION = { arriving: 850, blanching: 950, pouring: 900, plating: 550, carrying: 1700, handoff: 500, tasting: 900, calming: 900, leaving: 1300 } as const;
export const CUSTOMER_SPEECH_DURATION = 5000;
export const CUSTOMER_KINDS = ['Hàng xóm', 'Shipper', 'Cầu thủ phủi', 'TikToker', 'Bà Tám', 'Sinh viên', 'Khách khó tính', 'Gia đình', 'Khách VIP'];
export const PHASE_LABEL: Record<ShopPhase, string> = {
  idle: 'Chờ khách ghé quán', arriving: 'Khách đang vào bàn', choosing: 'Nghe gọi món · chọn phở và topping',
  blanching: 'Đang nhúng bánh phở', blanched: 'Bánh chín rồi · chan nước dùng nhé', pouring: 'Đang chan nước dùng', plating: 'Đang hoàn thiện tô phở', ready: 'Phở nóng sẵn sàng · mang ra bàn',
  carrying: 'Đang mang phở ra bàn', handoff: 'Mời khách một tô phở nóng', tasting: 'Khách đang nếm phở', happy: 'Khách ăn ngon · quán thêm vui',
  unhappy: 'Khách chưa hài lòng với món', drama: 'Cả quán đang xôn xao!', calming: 'Chủ quán đang làm dịu câu chuyện', calmed: 'Chuyện đã êm · quán lại vui', expired: 'Khách đã hết kiên nhẫn · đón khách tiếp nhé', leaving: 'Chào khách · dọn bàn đón người mới',
};
export const isShopBusy = (phase: ShopPhase) => ['arriving', 'blanching', 'pouring', 'plating', 'carrying', 'handoff', 'tasting', 'calming', 'leaving'].includes(phase);
export const canEditRecipe = (phase: ShopPhase) => ['choosing', 'blanched', 'ready'].includes(phase);
export const isReaction = (phase: ShopPhase) => ['happy', 'unhappy', 'drama', 'calmed', 'expired'].includes(phase);
export function orderReaction(order: PhoOrder): 'happy' | 'unhappy' | 'drama' { return order.dramaTriggered ? 'drama' : order.isCorrect ? 'happy' : 'unhappy'; }
export function recipeIssue(pho: PhoMenuItem | null, toppings: readonly string[]): string | null {
  if (!pho || !pho.isAvailable) return 'Chọn một món phở trong sổ món trước nhé.';
  return new Set(toppings).size > 5 ? 'Mỗi tô dùng tối đa 5 topping. Bỏ bớt trước khi nấu nhé.' : null;
}
export function customerAppearance(customer: Customer): CharacterAppearance {
  const profile = customerProfile(customer);
  if (profile) return profile.appearance;
  const index = Math.abs(customer.id);
  const female = customer.customerType === 4 || customer.customerType === 0 && index % 2 === 1 || customer.customerType === 3 && index % 2 === 0;
  const base = DEFAULT_APPEARANCES[female ? 'female' : 'male'];
  return { ...base, hair: female ? index % 2 ? 'bun' : 'braid' : index % 2 ? 'short' : 'sidepart',
    outfit: customer.customerType === 8 ? 'nguthan' : female && index % 3 === 0 ? 'tuthan' : 'baba',
    accessory: customer.customerType === 4 ? 'moqua' : customer.customerType === 8 ? 'khandong' : 'none',
    skin: (['peach', 'honey', 'tan', 'bronze'] as const)[index % 4], hairColor: index % 3 ? 'ink' : 'brown' };
}

export interface ShopLayout {
  width: number; height: number; compact: boolean; counter: { x: number; y: number; width: number };
  home: Point; pot: Point; noodles: Point; ingredients: Point; seat: Point; table: Point; delivery: Point; door: Point; queue: Point[];
}
export function shopLayout(viewportWidth: number, viewportHeight: number): ShopLayout {
  const compact = viewportWidth < 700;
  const width = compact ? 720 : 1200;
  const height = width * Math.max(120, viewportHeight) / Math.max(280, viewportWidth);
  const kitchenY = height * (compact ? .32 : .43);
  const seat = { x: compact ? 515 : 870, y: height * (compact ? .65 : .57) };
  return { width, height, compact,
    counter: { x: compact ? 40 : 65, y: kitchenY + 22, width: compact ? 430 : 550 },
    home: { x: compact ? 260 : 320, y: kitchenY }, pot: { x: compact ? 110 : 155, y: kitchenY + 25 }, noodles: { x: compact ? 245 : 300, y: kitchenY + 25 }, ingredients: { x: compact ? 392 : 490, y: kitchenY + 25 },
    seat, table: { x: seat.x, y: seat.y + 66 }, delivery: { x: seat.x - (compact ? 155 : 175), y: seat.y + 120 },
    door: { x: width + 90, y: height * .73 }, queue: compact
      ? [{ x: 100, y: height * .79 }, { x: 220, y: height * .88 }, { x: 100, y: height * .95 }]
      : [{ x: 1050, y: height * .76 }, { x: 1130, y: height * .87 }, { x: 990, y: height * .94 }],
  };
}

// Distance-based interpolation keeps the bowl carrier and entering guests moving
// through the open aisle, even on a narrow phone layout.
export function pointOnPath(path: readonly Point[], progress: number): Point {
  if (!path.length) return { x: 0, y: 0 };
  if (progress <= 0) return { ...path[0] };
  if (progress >= 1) return { ...path[path.length - 1] };
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
  let remaining = lengths.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, progress));
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const t = remaining / lengths[i];
      return { x: path[i].x + (path[i + 1].x - path[i].x) * t, y: path[i].y + (path[i + 1].y - path[i].y) * t };
    }
    remaining -= lengths[i];
  }
  return { ...path[path.length - 1] };
}
export function directionBetween(from: Point, to: Point, fallback: Facing = 'down'): Facing {
  const x = to.x - from.x, y = to.y - from.y;
  if (Math.abs(x) + Math.abs(y) < .05) return fallback;
  return Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up';
}
export function deliveryPath(layout: ShopLayout): Point[] {
  const aisle = layout.counter.x + layout.counter.width + 45;
  const front = layout.counter.y + 130;
  return [layout.home, { x: aisle, y: layout.home.y }, { x: aisle, y: front }, { x: layout.delivery.x, y: front }, layout.delivery];
}
