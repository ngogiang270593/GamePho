import type { Customer, GameState, Player, RandomEvent } from '../services/gameTypes';

export interface DayTheme { title: string; weather: string; goal: string; target: number; goalKind: string; hint: string }
export interface JourneyMemory { day: number; title: string; choice: string; result: string; path: string }
export interface JourneyReport { day: number; served: number; correct: number; lost: number; bestCombo: number; netMoney: number; goalMet: boolean; reward: number; quip: string }
export interface EndingCard { id: string; title: string; description: string; hint: string; color: string }
export interface Journey {
  revision?: number;
  season: number; chapter: number; completedDays: number; isOpen: boolean; minute: number;
  mode: 'cozy' | 'story'; boon: 'tea' | 'stove' | 'sign'; weather: 'clear' | 'rain' | 'breeze';
  theme: DayTheme; goalProgress: number; dayServed: number; dayCorrect: number; dayLost: number;
  combo: number; bestCombo: number; community: number; craft: number; fame: number; mischief: number; goalsWon: number;
  upcomingCustomers: number; nextArrivalMinute: number | null; pendingEvents: number[]; visitsToday: string[];
  memories: JourneyMemory[]; report: JourneyReport | null; ending: string | null; unlockedEndings: string[]; endings: EndingCard[];
  decoration: 'none' | 'flowers' | 'lanterns';
}
export interface JourneyUpdate { journey: Journey; player: Player; waitingCustomers: Customer[]; randomEvents: RandomEvent[] }
export type JourneyAction = 'tick' | 'prepare' | 'next-wave' | 'visit' | 'close' | 'continue';
export const PATH_LABEL: Record<string, string> = { community: 'Tình xóm', craft: 'Tay nghề', fame: 'Độ phủ', mischief: 'Độ quậy' };
export const BOONS = [
  { id: 'tea', title: 'Ấm trà mời khách', icon: 'tea', detail: '+25 giây kiên nhẫn cho mỗi khách' },
  { id: 'stove', title: 'Nhóm bếp thật kỹ', icon: 'pot', detail: 'Giảm thêm 2 giây khi tính thưởng nhanh' },
  { id: 'sign', title: 'Treo biển vui vẻ', icon: 'sign', detail: '+1 độ phủ cho mỗi tô đúng món' },
] as const;
export function formatClock(minute: number) { const m = Math.floor(Math.max(0, Math.min(1439, minute))); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
export function timeOfDay(minute: number) { return minute < 540 ? 'morning' : minute < 960 ? 'day' : minute < 1110 ? 'sunset' : 'night'; }
export const TIME_LABEL = { morning: 'Sớm mai', day: 'Ban ngày', sunset: 'Hoàng hôn', night: 'Đêm trong hẻm' };
export const WEATHER_LABEL = { clear: 'Trời trong', rain: 'Mưa rào', breeze: 'Gió nhẹ' };
export function mergeJourney(state: GameState, update: JourneyUpdate): GameState { return { ...state, ...update }; }
