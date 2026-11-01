import { describe, expect, it } from 'vitest';
import { localApi, newRoot } from './engine';
import { SHIFT_DISHES, SHIFT_LENGTH, SHIFT_TOPPINGS, type CounterSnapshot } from '../../game/shift';

const epoch = Date.parse('2026-10-26T09:00:00Z');
function game() {
  const root = newRoot(epoch); let time = epoch;
  const api = (action: string, fields: Record<string, unknown> = {}) => localApi(root, 'POST', '/counter/' + action, { session: 'cook', slot: 1, ...fields }, {}, time) as CounterSnapshot;
  const tick = (ms: number) => { time += ms; return api('state'); };
  api('start');
  const serve = (correct = true) => {
    const guest = root.active.counter!.current!.guests.find(c => c.status === 'waiting')!;
    api('take', { guestId: guest.id }); api('blanch');
    api('meat', { pho: correct ? guest.pho : (guest.pho + 1) % 3 });
    for (const name of guest.toppings) api('topping', { name });
    tick(3200); api('lift'); api('pour', { duration: 1400 });
    return api('serve', { guestId: guest.id });
  };
  return { root, api, tick, serve };
}
describe('three minute counter', () => {
  it('starts six guests with manual empty recipes, and supports two simultaneous bowls', () => {
    const { root, api } = game(); const s = root.active.counter!.current!;
    expect(s.guests).toHaveLength(6); expect(s.guests.filter(c => c.status === 'waiting')).toHaveLength(2);
    api('take', { guestId: s.guests[0].id }); api('take', { slot: 2, guestId: s.guests[1].id });
    expect(s.bowls.map(b => b.pho)).toEqual([null, null]);
    expect(s.bowls.every(b => b.toppings.length === 0)).toBe(true);
    expect(() => api('pour', { duration: 1400 })).toThrow();
  });
  it('lets the player remove a wrong topping and replace overcooked noodles', () => {
    const { root, api, tick } = game(); const s = root.active.counter!.current!;
    api('take', { guestId: s.guests[0].id }); api('topping', { name: SHIFT_TOPPINGS[0] }); api('topping', { name: SHIFT_TOPPINGS[0] });
    expect(s.bowls[0].toppings).toEqual([]);
    api('blanch'); tick(9000); api('lift'); expect(s.bowls[0].cooked).toBe(9);
    api('replace'); expect(s.bowls[0].phase).toBe('draft'); expect(s.bowls[0].cooked).toBe(0);
  });
  it('awards explicit tips once, keeps a regular, and rejects duplicate serving', () => {
    const { root, api, serve } = game(); const before = root.active.player.money;
    const s = serve().progress.current!;
    expect(s.receipt?.perfect).toBe(true); expect(s.receipt!.money).toBe(22000);
    expect(s.receipt!.tips.map(t => t.label)).toEqual(['Bánh vừa chín', 'Nóng hổi, vừa nước']);
    expect(root.active.player.money).toBe(before + 22000);
    expect(root.active.orders[0].phoType).toBe(SHIFT_DISHES[s.guests[0].pho]);
    expect(Object.keys(root.active.counter!.regulars)).toHaveLength(1);
    expect(() => api('serve', { guestId: s.guests[0].id })).toThrow();
    expect(root.active.player.money).toBe(before + 22000);
  });
  it('opens one twenty second golden window after five correct orders', () => {
    const { root, serve } = game();
    for (let i = 0; i < 5; i++) serve();
    const s = root.active.counter!.current!;
    expect(s.combo).toBe(5); expect(s.goldenTriggered).toBe(true);
    expect(s.goldenUntil).toBe(epoch + 5 * 3200 + 20000);
    expect(s.receipt!.tips.some(t => t.label === 'Giờ vàng')).toBe(true);
    const until = s.goldenUntil;
    serve(); expect(s.goldenUntil).toBe(until); expect(s.ended).not.toBeNull();
  });
  it('reduces a missed chain by one and lets a wrong delivery be corrected', () => {
    const { root, api, tick, serve } = game(); serve(); serve(); serve(false);
    const s = root.active.counter!.current!; expect(s.combo).toBe(1);
    const [a, b] = s.guests.filter(c => c.status === 'waiting');
    api('take', { guestId: a.id }); api('meat', { pho: a.pho }); api('blanch'); tick(3000); api('lift'); api('pour', { duration: 1400 });
    expect(() => api('serve', { guestId: b.id })).toThrow('Nhầm ghế');
    expect(s.bowls).toHaveLength(1); expect(a.status).toBe('waiting');
  });
  it('ends after three minutes, and a stale window cannot act on a resumed session', () => {
    const { root, api, tick } = game(); const s = root.active.counter!.current!;
    api('take', { guestId: s.guests[0].id });
    api('open', { session: 'new-window' }); expect(s.bowls).toHaveLength(0); expect(s.lost).toBe(1);
    expect(() => api('take', { guestId: s.guests[1].id })).toThrow();
    api('leave'); expect(s.session).toBe('new-window');
    tick(SHIFT_LENGTH); expect(s.ended).not.toBeNull(); expect(s.lost).toBe(6);
  });
  it('buys a visible upgrade from earned money and remembers a returning guest', () => {
    const { root, api, serve } = game(); for (let i = 0; i < 6; i++) serve();
    const regular = root.active.counter!.current!.guests[0];
    const balance = root.active.counter!.balance;
    api('buy', { upgrade: 'cart' }); expect(root.active.counter!.balance).toBe(balance - 90000);
    expect(root.active.counter!.upgrades).toContain('cart');
    expect(() => api('buy', { upgrade: 'cart' })).toThrow();
    api('start'); const first = root.active.counter!.current!.guests[0];
    expect(first.personaKey).toBe(regular.personaKey); expect(first.pho).toBe(regular.pho); expect(first.familiar).toBeGreaterThan(0);
  });
  it('includes the new shop in all save slots and resets it for a new game', () => {
    const { root, api, serve } = game(); serve();
    localApi(root, 'PUT', '/backup/slots/2', {}, {}, epoch + 4000);
    api('finish'); localApi(root, 'POST', '/players/1/game/reset', {}, {}, epoch + 5000);
    expect(root.active.counter).toBeUndefined();
    localApi(root, 'POST', '/backup/slots/2/load', {}, {}, epoch + 86400000);
    expect(root.active.counter!.current!.served).toBe(1);
    expect(root.active.counter!.balance).toBe(22000);
    const resumed = localApi(root, 'POST', '/counter/open', { session: 'next-day' }, {}, epoch + 86400000) as CounterSnapshot;
    expect(resumed.progress.current!.ended).toBeNull();
    expect(resumed.now - resumed.progress.current!.started).toBe(4000);
  });
});
