import { describe, expect, it } from 'vitest';
import { localApi, newRoot } from './engine';
import { cardPoints, makeCardDeck } from './cardEngine';
import { canPlayCard, type CardColor, type CardFace, type CardSnapshot } from '../../game/cards';
const now = Date.parse('2026-10-26T09:00:00Z');
function setup(opponents = 1) {
  const root = newRoot(now); let time = now;
  const api = (action: string, body: Record<string, unknown> = {}) => localApi(root, 'POST', '/cards/' + action, body, {}, time) as CardSnapshot;
  api('start', { mode: 'friends', variant: 'basic', opponents, missionMode: true });
  const m = root.active.cards!.active!;
  const tick = (ms: number) => { time += ms; return api('state'); };
  function arrange(hands: [CardColor | null, CardFace][][]) {
    const pool = makeCardDeck('basic');
    const pick = ([color, face]: [CardColor | null, CardFace]) => { const index = pool.findIndex(c => c.color === color && c.face === face); if (index < 0) throw Error('Invalid fixture'); return pool.splice(index, 1)[0]; };
    m.discard = [pick(['red', '5'])]; m.color = 'red'; m.handoff = false;
    m.players.forEach((p, i) => { p.hand = hands[i].map(pick); p.declared = false; }); m.deck = pool;
  }
  return { root, api, m, tick, arrange };
}
describe('UNO basic', () => {
  it('deals seven cards to ten people from exactly 108 unique cards', () => {
    const { m } = setup(9); expect(m.players).toHaveLength(10); expect(m.players.every(p => p.hand.length === 7)).toBe(true);
    const all = [...m.deck, ...m.discard, ...m.players.flatMap(p => p.hand)]; expect(all).toHaveLength(108); expect(new Set(all.map(c => c.id)).size).toBe(108);
    expect(all.some(c => ['shield', 'random', 'everyone', 'swap'].includes(c.face))).toBe(false);
    expect(m.rules).toEqual({ variant: 'basic', stack: false, initialCards: 7, targetScore: 500, turnSeconds: 0 });
  });
  it('disallows +4 when holding the active color, even after drawing it', () => {
    const { m, arrange } = setup(); arrange([[[null, 'draw4'], ['red', '7']], [['blue', '3'], ['green', '1']]]);
    expect(canPlayCard(m, 0, m.players[0].hand[0])).toBe(false);
    m.players[0].hand[1].color = 'blue'; expect(canPlayCard(m, 0, m.players[0].hand[0])).toBe(true);
    m.players[0].hand[1].color = 'red'; m.didDraw = true; m.drawn = m.players[0].hand[0].id; expect(canPlayCard(m, 0, m.players[0].hand[0])).toBe(false);
  });
  it('treats a match with a missing discard card as having no playable cards', () => {
    const { m } = setup();
    const handCard = m.players[0].hand[0];
    m.discard = [];
    expect(canPlayCard(m, 0, handCard)).toBe(false);
  });
  it('does not automatically penalize a forgotten call just because time passed', () => {
    const { m, api, tick, arrange } = setup(); arrange([[['red', '7'], ['blue', '3']], [['green', '2'], ['yellow', '1']]]);
    api('play', { player: 0, cardId: m.players[0].hand[0].id }); expect(m.unoVulnerable).toBe(0); expect(m.onePending).toBeNull();
    tick(60000); expect(m.players[0].hand).toHaveLength(1);
    api('ready'); api('catch', { player: 1 }); expect(m.players[0].hand).toHaveLength(3); expect(m.unoVulnerable).toBeUndefined();
    expect(() => api('catch', { player: 1 })).toThrow();
  });
  it('closes the catch window once the next player draws, and allows a late UNO before that', () => {
    const a = setup(); a.arrange([[['red', '7'], ['blue', '3']], [['green', '2'], ['yellow', '1']]]);
    a.api('play', { player: 0, cardId: a.m.players[0].hand[0].id }); a.api('ready'); a.api('one', { player: 0 });
    expect(a.m.unoVulnerable).toBeUndefined(); expect(a.m.players[0].hand).toHaveLength(1);
    const b = setup(); b.arrange([[['red', '7'], ['blue', '3']], [['green', '2'], ['yellow', '1']]]);
    b.api('play', { player: 0, cardId: b.m.players[0].hand[0].id }); b.api('ready'); b.api('draw', { player: 1 });
    expect(b.m.unoVulnerable).toBeUndefined(); expect(b.m.players[0].hand).toHaveLength(1); expect(() => b.api('catch', { player: 1 })).toThrow();
  });
  it('scores numbers, functions and wilds, then carries totals to the next round', () => {
    expect(cardPoints({ id: 1, color: 'red', face: '9' })).toBe(9);
    expect(cardPoints({ id: 1, color: 'red', face: 'draw2' })).toBe(20);
    expect(cardPoints({ id: 1, color: null, face: 'draw4' })).toBe(50);
    const { m, api, arrange } = setup(); arrange([[['red', '7']], [[null, 'wild'], ['red', 'draw2'], ['yellow', '9']]]);
    api('play', { player: 0, cardId: m.players[0].hand[0].id }); expect(m.roundPoints).toBe(79); expect(m.totals).toEqual([79, 0]);
    const next = api('next-round').progress.active!; expect(next.round).toBe(2); expect(next.totals).toEqual([79, 0]); expect(next.players[0].hand).toHaveLength(7);
  });
  it('includes last-card draw penalties in scoring and stops a match at 500', () => {
    const { m, api, arrange } = setup(); arrange([[['red', 'draw2']], [['yellow', '9']]]); m.totals = [490, 0];
    const cards = m.deck.filter(c => c.color === 'blue' && (c.face === '1' || c.face === '2')).slice(0, 2);
    m.deck = m.deck.filter(c => !cards.includes(c)); m.deck.push(...cards);
    api('play', { player: 0, cardId: m.players[0].hand[0].id });
    expect(m.players[1].hand).toHaveLength(3); expect(m.roundPoints).toBe(11); expect(m.totals![0]).toBe(501); expect(m.champion).toBe(0);
    expect(() => api('next-round')).toThrow();
  });
});
