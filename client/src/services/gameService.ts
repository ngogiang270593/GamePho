import apiClient from './apiClient';
import type { JourneyAction, JourneyUpdate } from '../game/journey';
import type {
  CreatePhoOrderRequest,
  FootballPlayRequest,
  FootballResult,
  GameState,
  GameStatistics,
  Achievement,
  EventHistory,
  OrderHistory,
  PhoOrder,
  RevenueHistory,
  ResolveEventResult,
  StartDayResult,
  Topping,
  Upgrade,
} from './gameTypes';

const PLAYER_ID = 1;

export async function journeyAction(action: JourneyAction, body: Record<string, unknown> = {}): Promise<JourneyUpdate> {
  const response = await apiClient.post<JourneyUpdate>(`/journey/${action}`, body);
  return response.data;
}

export async function getGameState(): Promise<GameState> {
  const response = await apiClient.get<GameState>('/game-state', { params: { playerId: PLAYER_ID } });
  const toppings = await getToppings();
  return { ...response.data, toppings };
}

export async function getToppings(): Promise<Topping[]> {
  const response = await apiClient.get<Topping[]>('/toppings');
  return response.data;
}

export async function servePho(request: CreatePhoOrderRequest): Promise<PhoOrder> {
  const response = await apiClient.post<PhoOrder>('/orders', request, { params: { playerId: PLAYER_ID } });
  return response.data;
}

export async function startGameDay(): Promise<StartDayResult> {
  const response = await apiClient.post<StartDayResult>('/game/start-day', null, { params: { playerId: PLAYER_ID } });
  return response.data;
}

export async function resetGame(): Promise<void> {
  await apiClient.post<void>(`/players/${PLAYER_ID}/game/reset`);
}

export async function downloadGameBackup(): Promise<Blob> {
  const response = await apiClient.get<Blob>('/backup', { responseType: 'blob' });
  return response.data;
}

export async function getStatistics(): Promise<GameStatistics> {
  const response = await apiClient.get<GameStatistics>('/players/1/statistics');
  return response.data;
}

export async function getAchievementProgress(): Promise<Achievement[]> {
  const response = await apiClient.get<Achievement[]>('/players/1/achievements');
  return response.data;
}

export async function getOrderHistory(): Promise<OrderHistory[]> {
  const response = await apiClient.get<OrderHistory[]>('/players/1/history/orders');
  return response.data;
}

export async function getEventHistory(): Promise<EventHistory[]> {
  const response = await apiClient.get<EventHistory[]>('/players/1/history/events');
  return response.data;
}

export async function getRevenueHistory(): Promise<RevenueHistory[]> {
  const response = await apiClient.get<RevenueHistory[]>('/players/1/history/revenue');
  return response.data;
}

export async function getUpgrades(): Promise<Upgrade[]> {
  const response = await apiClient.get<Upgrade[]>('/upgrades');
  return response.data;
}

export async function buyUpgrade(upgradeId: number): Promise<Upgrade> {
  const response = await apiClient.post<Upgrade>('/upgrades/buy', { upgradeId }, { params: { playerId: PLAYER_ID } });
  return response.data;
}

export async function playFootball(request: FootballPlayRequest): Promise<FootballResult> {
  const response = await apiClient.post<FootballResult>('/football/play', request, { params: { playerId: PLAYER_ID } });
  return response.data;
}

export async function resolveGameEvent(eventId: number, optionId: number): Promise<ResolveEventResult> {
  const response = await apiClient.post<ResolveEventResult>('/events/resolve', { eventId, optionId });
  return response.data;
}

export interface PhoSale { customerId: number; deadlineUtc: string; durationSeconds: number }
export async function beginPhoSale(customerId: number): Promise<PhoSale> {
  return (await apiClient.post<PhoSale>(`/pho-sale/${customerId}/begin`)).data;
}
export async function failPhoSale(customerId: number): Promise<void> {
  await apiClient.post(`/pho-sale/${customerId}/fail`);
}
export function abandonPhoSale(customerId: number): void {
  void fetch(apiClient.getUri({ url: `/pho-sale/${customerId}/fail` }), { method: 'POST', keepalive: true }).catch(() => {});
}
