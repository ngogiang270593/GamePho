import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { GameProvider, useGameStore } from './GameContext';
import { getGameState, servePho } from '../services/gameService';
import type { Customer, GameState, PhoMenuItem, PhoOrder } from '../services/gameTypes';
import type { JourneyUpdate } from '../game/journey';

vi.mock('../services/gameService', () => ({ getGameState: vi.fn(), servePho: vi.fn(), resetGame: vi.fn(), startGameDay: vi.fn() }));
vi.mock('../services/audioService', () => ({ playUiSound: vi.fn() }));
afterEach(cleanup);

it('returns the committed order even when refreshing the queue fails afterwards', async () => {
  const customer = { id: 7, requiredToppings: '', preferredPhoType: 0 } as Customer;
  const pho = { id: 1, phoType: 0 } as PhoMenuItem;
  const order = { id: 9, isCorrect: true, moneyChange: 40000, message: 'Đã phục vụ' } as PhoOrder;
  vi.mocked(getGameState).mockResolvedValueOnce({ menu: [pho], waitingCustomers: [customer] } as GameState).mockRejectedValueOnce(new Error('Mất kết nối'));
  vi.mocked(servePho).mockResolvedValue(order);
  const hook = renderHook(useGameStore, { wrapper: GameProvider });
  await act(async () => { await hook.result.current.loadGame(); });
  act(() => hook.result.current.selectCustomer(customer));
  act(() => hook.result.current.selectPho(pho));
  let completed: PhoOrder | null = null;
  await act(async () => { completed = await hook.result.current.serveCustomer(6); });
  expect(completed).toBe(order);
  expect(hook.result.current.selectedCustomer).toBeNull();
  expect(hook.result.current.error).toContain('Đơn đã được ghi nhận');
  expect(servePho).toHaveBeenCalledTimes(1);
});

it('keeps newer money and queue data when a clock or page response arrives late', async () => {
  const newer = { menu: [], player: { money: 120000 }, waitingCustomers: [], journey: { revision: 5 } } as unknown as GameState;
  vi.mocked(getGameState).mockResolvedValueOnce(newer).mockResolvedValueOnce({ ...newer, player: { money: 100000 }, journey: { revision: 4 } } as GameState);
  const hook = renderHook(useGameStore, { wrapper: GameProvider });
  await act(async () => { await hook.result.current.loadGame(); });
  act(() => hook.result.current.applyJourneyUpdate({ player: { money: 90000 }, journey: { revision: 3 }, waitingCustomers: [], randomEvents: [] } as unknown as JourneyUpdate));
  expect(hook.result.current.gameState?.player.money).toBe(120000);
  await act(async () => { await hook.result.current.loadGame(); });
  expect(hook.result.current.gameState?.player.money).toBe(120000);
  expect(hook.result.current.gameState?.journey?.revision).toBe(5);
});

it('starts each customer with an empty bowl and submits only manually chosen ingredients', async () => {
  const customer = { id: 7, requiredToppings: 'Hành lá', preferredPhoType: 0 } as Customer;
  const pho = { id: 1, phoType: 0 } as PhoMenuItem;
  const chosen = { id: 2, phoType: 2 } as PhoMenuItem;
  vi.mocked(getGameState).mockResolvedValue({ menu: [pho, chosen], waitingCustomers: [customer] } as GameState);
  const hook = renderHook(useGameStore, { wrapper: GameProvider });
  await act(async () => { await hook.result.current.loadGame(); });
  act(() => hook.result.current.selectCustomer(customer));
  expect(hook.result.current.selectedPho).toBeNull();
  expect(hook.result.current.selectedToppings).toEqual([]);
  act(() => { hook.result.current.selectPho(chosen); hook.result.current.toggleTopping('Ớt'); });
  await act(async () => { await hook.result.current.serveCustomer(6); });
  expect(servePho).toHaveBeenLastCalledWith({ customerId: 7, phoType: 2, toppings: 'Ớt', serviceTimeSeconds: 6 });
  act(() => { hook.result.current.selectPho(pho); hook.result.current.toggleTopping('Hành lá'); });
  act(() => hook.result.current.selectCustomer({ ...customer, id: 8 }));
  expect(hook.result.current.selectedPho).toBeNull();
  expect(hook.result.current.selectedToppings).toEqual([]);
});