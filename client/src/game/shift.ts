export const SHIFT_LENGTH = 180000;
export const SHIFT_TOPPINGS = ['Hành lá', 'Giá đỗ', 'Rau thơm', 'Chanh', 'Ớt tươi', 'Quẩy giòn'];
export const SHIFT_DISHES = ['Phở bò tái', 'Phở bò chín', 'Phở gà'];
export const SHOP_BUYS = [
  { id: 'cart', name: 'Xe đẩy gỗ', cost: 90000, detail: 'Bàn bếp mới, thêm 2.000đ mỗi tô đúng món.', icon: '▤' },
  { id: 'stove', name: 'Bếp đồng', cost: 160000, detail: 'Bánh vừa chín từ 2 đến 6 giây, dễ cứu đơn hơn.', icon: '♨' },
  { id: 'awning', name: 'Mái hiên xanh', cost: 240000, detail: 'Khách chờ thêm 20 giây. Quán có mái che mới.', icon: '⌂' },
] as const;
export interface ShiftGuest {
  id: number; name: string; personaKey: string; customerType: number; pho: number; toppings: string[];
  arrival: number; deadline: number; status: 'coming' | 'waiting' | 'served' | 'lost'; familiar: number; special: boolean;
}
export interface ShiftBowl {
  slot: number; guestId: number; pho: number | null; toppings: string[]; phase: 'draft' | 'cooking' | 'lifted' | 'ready';
  started: number; deadline: number; cookAt: number; cooked: number; poured: number; readyAt: number;
}
export interface ShiftReceipt { id: number; guest: string; correct: boolean; perfect: boolean; title: string; detail: string; money: number; tips: { label: string; amount: number }[] }
export interface CounterShift {
  number: number; started: number; ended: number | null; session: string | null; guests: ShiftGuest[]; bowls: ShiftBowl[];
  combo: number; bestCombo: number; goldenUntil: number; goldenTriggered: boolean; earned: number; perfects: number; served: number; lost: number;
  receipt: ShiftReceipt | null;
}
export interface CounterProgress {
  balance: number; upgrades: string[]; shifts: number; regulars: Record<string, { name?: string; visits: number; pho: number; toppings: string[] }>;
  current: CounterShift | null;
}
export interface CounterSnapshot { progress: CounterProgress; now: number; money: number; revision: number }
