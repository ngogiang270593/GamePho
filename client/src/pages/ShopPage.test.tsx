import type { ShopMoment } from '../game/shop';
import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ShopPage } from './ShopPage';
import type { KitchenAction, KitchenSnapshot } from '../services/kitchenService';
import type { Customer, GameState } from '../services/gameTypes';

const store = vi.hoisted(() => ({ gameState: null as GameState | null, character: { displayName: 'Út Mận', avatar: '' }, applyJourneyUpdate: vi.fn(), loadGame: vi.fn() }));
const sceneFrames = vi.hoisted(() => vi.fn());
const api = vi.hoisted(() => ({ openKitchen: vi.fn(), readKitchen: vi.fn(), kitchenAction: vi.fn(), leaveKitchen: vi.fn() }));
vi.mock('../context/GameContext', () => ({ useGameStore: () => store }));
vi.mock('../services/kitchenService', () => api);
vi.mock('../services/gameService', () => ({ resolveGameEvent: vi.fn() }));
vi.mock('../components/ShopScene', () => ({ ShopScene: ({ children, active, moment }: { children: () => ReactNode; active: Customer | null; moment: ShopMoment }) => { sceneFrames(moment); return <div data-testid="scene" data-customer={active?.id}>{children()}</div>; } }));
let state: KitchenSnapshot;
const snapshot = () => ({ ...structuredClone(state), serverUtc: new Date().toISOString() });
async function enter() { await act(async () => { render(<MemoryRouter><ShopPage /></MemoryRouter>); }); }
async function click(name: string | RegExp) { await act(async () => { fireEvent.click(screen.getByRole('button', { name })); }); }
async function acceptFirst() { await click('Chọn khách'); await click(/Cô Ba/); }

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  const guests = [{ id: 1, name: 'Cô Ba', personaKey: 'co-ba', customerType: 0, hunger: 80, patience: 120, secondsRemaining: 120, preferredPhoType: 0, requiredToppings: 'Hành lá', arrivedAt: '', dialogue: 'Cho cô một tô nóng.' }, { id: 2, name: 'Tí', customerType: 1, hunger: 70, patience: 100, preferredPhoType: 2, requiredToppings: '', arrivedAt: '', dialogue: 'Cho con phở gà.' }];
  store.gameState = { menu: [{ id: 1, name: 'Phở bò tái', phoType: 0, basePrice: 40000, isAvailable: true }, { id: 2, name: 'Phở gà', phoType: 2, basePrice: 40000, isAvailable: true }], toppings: [{ id: 1, name: 'Hành lá', price: 1000 }] } as GameState;
  state = { kitchen: { session: 'test', heat: 82, fire: 'medium', broth: 6, noodles: 4, refillAt: null, prepAt: null, largePot: false, prepRack: false, insulated: false, bowls: [], regulars: {}, requests: {}, signatures: {}, lastSale: null, notice: 'Nồi đã sẵn sàng.' }, serverUtc: new Date().toISOString(), player: { money: 500000 }, waitingCustomers: guests, journey: { revision: 1, isOpen: true, mode: 'cozy', weather: 'clear', combo: 0, pendingEvents: [] }, randomEvents: [], rhythm: 'warmup' } as unknown as KitchenSnapshot;
  api.openKitchen.mockImplementation(async () => snapshot()); api.readKitchen.mockImplementation(async () => snapshot());
  api.kitchenAction.mockImplementation(async (_session: string, a: KitchenAction) => {
    const bowl = state.kitchen.bowls.find(b => b.slot === a.slot);
    if (a.action === 'accept') state.kitchen.bowls.push({ slot: a.slot ?? 1, customerId: a.customerId!, deadlineUtc: new Date(Date.now() + 60000).toISOString(), startedUtc: new Date().toISOString(), phoType: null, toppings: [], phase: 'draft', blanchStartedUtc: null, readyUtc: null, cookSeconds: 0, texture: 'chưa nhúng', confirmed: false });
    if (a.action === 'recipe' && bowl) { bowl.phoType = a.phoType ?? null; bowl.toppings = a.toppings ?? []; bowl.confirmed = true; }
    if (a.action === 'blanch' && bowl) { bowl.phase = 'blanching'; bowl.blanchStartedUtc = new Date().toISOString(); }
    if (a.action === 'fire') state.kitchen.fire = a.value as 'high';
    state.journey.revision = (state.journey.revision ?? 0) + 1; return snapshot();
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('starts with a clear scene and makes recipe selection manual', async () => {
  await enter(); expect(screen.queryByRole('complementary')).toBeNull();
  await acceptFirst();
  expect(screen.getByRole('button', { name: 'Phở bò tái' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', { name: '+ Hành lá' }).getAttribute('aria-pressed')).toBe('false');
  expect((screen.getByRole('button', { name: 'Xác nhận tô phở' }) as HTMLButtonElement).disabled).toBe(true);
  await click('Phở bò tái'); await click('+ Hành lá'); await click('Xác nhận tô phở');
  expect(api.kitchenAction).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ action: 'recipe', slot: 1, phoType: 0, toppings: ['Hành lá'] }));
  expect(screen.queryByRole('complementary')).toBeNull(); expect(screen.getByRole('button', { name: 'Nhúng bánh' })).toBeTruthy();
});
it('can prepare the second bowl while the first bowl is cooking', async () => {
  await enter(); await acceptFirst(); await click('Phở bò tái'); await click('+ Hành lá'); await click('Xác nhận tô phở'); await click('Nhúng bánh');
  await click(/Tô 2 · Trống/); await click('Chọn khách'); await click(/Tí/);
  const first = state.kitchen.bowls.find(b => b.slot === 1)!;
  expect(first.phase).toBe('blanching'); expect(first.toppings).toEqual(['Hành lá']);
  expect(state.kitchen.bowls.find(b => b.slot === 2)?.confirmed).toBe(false);
  await click('Đóng bảng'); await click(/Tô 1 · Cô Ba/);
  await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
  expect(screen.getByLabelText('Canh bánh phở').textContent).toContain('4.0s');
  expect((screen.getByRole('button', { name: 'Vớt bánh' }) as HTMLButtonElement).disabled).toBe(false);
});
it('keeps pot controls outside the scene and closes them on demand', async () => {
  await enter(); await click('Mở nồi nước dùng');
  const panel = screen.getByRole('complementary', { name: 'Bảng thao tác bếp' });
  expect(screen.getByTestId('scene').contains(panel)).toBe(false);
  await click('Lửa Lớn'); expect(api.kitchenAction).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ action: 'fire', value: 'high' }));
  await click('Đóng bảng'); expect(screen.queryByRole('complementary')).toBeNull();
});
it('exposes persistent regulars and signature dishes through the compact notebook', async () => {
  state.kitchen.regulars['co-ba'] = { name: 'Cô Ba', visits: 2, goodOrders: 2, helped: 1, memory: 'Quán từng cho mua chịu.', favoritePho: 0, favoriteToppings: 'Hành lá' };
  state.kitchen.signatures['signature'] = { key: 'signature', name: 'Phở tình xóm', phoType: 0, toppings: ['Hành lá'], likes: 3 };
  await enter(); await click('Sổ quán');
  for (const details of screen.getByRole('complementary').querySelectorAll('details')) details.open = true;
  expect(screen.getByText('Quán từng cho mua chịu.')).toBeTruthy();
  expect(screen.getByText('Phở tình xóm · ♥ 3/3')).toBeTruthy();
  expect(within(screen.getByRole('complementary')).getByText('Nâng cấp cách chơi')).toBeTruthy();
});
it('does not pretend an action succeeded when the server rejects it', async () => {
  await enter(); api.kitchenAction.mockRejectedValueOnce(new Error('Khách đã rời quán.'));
  await acceptFirst(); expect(screen.getByRole('alert').textContent).toContain('Khách đã rời quán.');
  expect(screen.queryByRole('button', { name: 'Xác nhận tô phở' })).toBeNull();
});
it('sends the kitchen session on leaving, without failing a newer session', async () => {
  const view = render(<MemoryRouter><ShopPage /></MemoryRouter>);
  await act(async () => {}); view.unmount(); await act(async () => {});
  expect(api.leaveKitchen).toHaveBeenCalledWith(expect.any(String));
});

it('keeps the idle animation stable across clock ticks after the last bowl is finished', async () => {
  await enter();
  const initial = sceneFrames.mock.lastCall![0] as ShopMoment;
  expect(initial.phase).toBe('idle');
  for (let tick = 0; tick < 4; tick++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
  }
  const frames = sceneFrames.mock.calls.map(([moment]) => moment as ShopMoment);
  expect(frames.length).toBeGreaterThan(2);
  expect(frames.every(moment => moment.startedAt === initial.startedAt)).toBe(true);
  expect(frames.every(moment => moment.phase === 'idle')).toBe(true);
});