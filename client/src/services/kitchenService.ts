import apiClient from './apiClient';
import type { Customer, Player, RandomEvent } from './gameTypes';
import { offlineGame } from './gameMode';
import type { Journey } from '../game/journey';

export interface KitchenBowl {
  slot: number; customerId: number; deadlineUtc: string; startedUtc: string;
  phoType: number | null; toppings: string[]; phase: 'draft' | 'blanching' | 'blanched' | 'ready';
  blanchStartedUtc: string | null; readyUtc: string | null; cookSeconds: number; texture: string; confirmed: boolean;
}
export interface KitchenRegular { name: string; visits: number; goodOrders: number; helped: number; memory: string; favoritePho: number | null; favoriteToppings: string }
export interface KitchenRequest { kind: 'chef' | 'credit' | 'rush'; text: string; decision: string | null }
export interface KitchenSignature { key: string; name: string; phoType: number; toppings: string[]; likes: number }
export interface KitchenSale { customerId: number; customerName: string; correct: boolean; message: string; money: number; texture: string; drama: boolean; canRedo: boolean }
export interface KitchenProgress {
  session: string | null; heat: number; fire: 'low' | 'medium' | 'high'; broth: number; noodles: number;
  refillAt: string | null; prepAt: string | null; largePot: boolean; prepRack: boolean; insulated: boolean;
  bowls: KitchenBowl[]; regulars: Record<string, KitchenRegular>; requests: Record<string, KitchenRequest>;
  signatures: Record<string, KitchenSignature>; lastSale: KitchenSale | null; notice: string;
}
export interface KitchenSnapshot {
  kitchen: KitchenProgress; serverUtc: string; player: Player; waitingCustomers: Customer[];
  journey: Journey; randomEvents: RandomEvent[]; rhythm: 'preparation' | 'warmup' | 'rush' | 'rest' | 'steady';
}
export interface KitchenAction { action: string; slot?: number; customerId?: number; phoType?: number; toppings?: string[]; value?: string }
export async function openKitchen(session: string): Promise<KitchenSnapshot> { return (await apiClient.post<KitchenSnapshot>('/kitchen/open', { session })).data; }
export async function readKitchen(session: string): Promise<KitchenSnapshot> { return (await apiClient.get<KitchenSnapshot>('/kitchen/state', { params: { session } })).data; }
export async function kitchenAction(session: string, action: KitchenAction): Promise<KitchenSnapshot> { return (await apiClient.post<KitchenSnapshot>('/kitchen/action', { session, ...action })).data; }
export function leaveKitchen(session: string) {
  if (offlineGame) { void apiClient.post('/kitchen/action', { session, action: 'leave' }).catch(() => {}); return; }
  void fetch(apiClient.getUri({ url: '/kitchen/action' }), { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session, action: 'leave' }) }).catch(() => {});
}
