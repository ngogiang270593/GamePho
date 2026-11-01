import { describe, expect, it } from 'vitest';
import { localApi, newRoot } from './engine';
import type { KitchenSnapshot } from '../kitchenService';

const now = Date.parse('2026-10-26T08:00:00Z');
function setup() {
  const root = newRoot(now);
  const api = (path: string, body: Record<string, unknown> = {}, time = now, method = 'POST') => localApi(root, method, path, body, {}, time);
  api('/game/start-day'); api('/kitchen/open', { session: 'test' });
  const act = (action: string, fields: Record<string, unknown> = {}, time = now) => api('/kitchen/action', { session: 'test', action, ...fields }, time) as KitchenSnapshot;
  return { root, api, act };
}
describe('offline game', () => {
  it('keeps five independent saves and restores character after starting anew', () => {
    const { root, api } = setup();
    for (let slot = 1; slot <= 5; slot++) {
      root.active.player.money = slot * 10000;
      api(`/backup/slots/${slot}`, { 'pho-xom-character-name': `Chủ ${slot}` }, now, 'PUT');
    }
    api('/players/1/game/reset');
    expect(root.active.guests).toHaveLength(0);
    expect(root.active.orders).toHaveLength(0);
    expect(root.slots.filter(Boolean)).toHaveLength(5);
    expect(api('/backup/slots/3/load')).toEqual({ 'pho-xom-character-name': 'Chủ 3' });
    expect(root.active.player.money).toBe(30000);
    root.active.player.money = 1;
    expect(root.slots[2]!.game.player.money).toBe(30000);
  });
  it('cooks two manual bowls independently and awards a correct order only once', () => {
    const { root, act } = setup();
    const [a, b] = root.active.guests;
    act('accept', { slot: 1, customerId: a.id }); act('accept', { slot: 2, customerId: b.id });
    expect(root.active.kitchen.bowls.every(bowl => bowl.phoType === null)).toBe(true);
    expect(() => act('blanch')).toThrow();
    act('recipe', { phoType: a.preferredPhoType, toppings: a.requiredToppings.split(',').filter(Boolean) });
    act('blanch'); act('lift', {}, now + 3500); act('pour', {}, now + 3600);
    const sale = act('serve', {}, now + 3700);
    expect(sale.kitchen.lastSale?.correct).toBe(true);
    expect(sale.kitchen.lastSale!.money).toBeGreaterThan(0);
    expect(root.active.orders).toHaveLength(1);
    expect(root.active.kitchen.bowls.map(bowl => bowl.customerId)).toEqual([b.id]);
    expect(() => act('serve', {}, now + 3800)).toThrow();
  });
  it('fails expired or abandoned bowls, including when reopened after a crash', () => {
    const { root, api, act } = setup();
    act('accept', { customerId: root.active.guests[0].id });
    api('/kitchen/open', { session: 'after-reload' }, now + 500);
    expect(root.active.journey.dayLost).toBe(1);
    localApi(root, 'POST', '/kitchen/action', { session: 'after-reload', action: 'accept', customerId: root.active.guests[1].id }, {}, now + 1000);
    localApi(root, 'GET', '/kitchen/state', {}, { session: 'after-reload' }, now + 61000);
    expect(root.active.kitchen.bowls).toHaveLength(0);
    expect(root.active.journey.dayLost).toBe(2);
    expect(root.active.orders).toHaveLength(0);
  });
  it('completes seven days and preserves collected endings into another season', () => {
    const { root, api } = setup();
    for (let day = 0; day < 7; day++) {
      if (day) api('/game/start-day');
      api('/journey/close', { forfeit: true });
    }
    expect(root.active.journey.ending).toBeTruthy();
    expect(root.active.journey.unlockedEndings).toHaveLength(1);
    api('/journey/continue');
    expect(root.active.journey.season).toBe(2);
    expect(root.active.journey.completedDays).toBe(0);
    expect(root.active.journey.unlockedEndings).toHaveLength(1);
  });
  it('offers a new story each day and resolves choices without a server', () => {
    const { root, api } = setup();
    for (let day = 0; day < 2; day++) {
      if (day) api('/game/start-day');
      for (let tick = 0; tick < 14; tick++) api('/journey/tick', { seconds: 3 });
      expect(root.active.events).toHaveLength(1);
      const event = root.active.events[0];
      api('/events/resolve', { eventId: event.id, optionId: event.options[0].id });
      expect(root.active.events).toHaveLength(0);
      api('/journey/close', { forfeit: true });
    }
    expect(root.active.journey.memories).toHaveLength(2);
  });
});
