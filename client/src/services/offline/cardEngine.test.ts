import { describe, expect, it } from 'vitest';
import { localApi, newRoot } from './engine';
import { dailyCardRules, localCardDate, makeCardDeck } from './cardEngine';
import { canPlayCard, type CardColor, type CardFace, type CardMatch, type CardSnapshot } from '../../game/cards';

const epoch = Date.parse('2026-10-26T08:00:00Z');
function setup(options: Record<string, unknown> = {}) {
  const root = newRoot(epoch); let time = epoch;
  const api = (action: string, body: Record<string, unknown> = {}) => localApi(root, 'POST', '/cards/' + action, body, {}, time) as CardSnapshot;
  api('start', { mode: 'friends', opponents: 2, missionMode: true, ...options });
  const m = root.active.cards!.active!;
  const tick = (ms: number) => { time += ms; return api('state'); };
  function arrange(hands: [CardColor | null, CardFace][][], top: [CardColor, CardFace] = ['red', '5']) {
    const pool = makeCardDeck();
    const take = ([color, face]: [CardColor | null, CardFace]) => { const index = pool.findIndex(c => c.color === color && c.face === face); if (index < 0) throw Error('Test card unavailable'); return pool.splice(index, 1)[0]; };
    m.discard = [take(top)]; m.color = top[0]; m.players.forEach((p, i) => { p.hand = hands[i].map(take); p.declared = true; });
    m.deck = pool; m.handoff = false;
  }
  function play(face: CardFace, body: Record<string, unknown> = {}) {
    if (m.handoff) api('ready');
    const player = m.turn, card = m.players[player].hand.find(c => c.face === face)!;
    return api('play', { player, cardId: card.id, color: 'blue', ...body });
  }
  return { root, api, m, tick, arrange, play };
}
const fillers: [CardColor, CardFace][] = [['green', '1'], ['blue', '2'], ['yellow', '8']];
describe('Sắc màu xóm mình rules', () => {
  it('has 116 unique cards with all colors, numbers and custom actions', () => {
    const deck = makeCardDeck(); expect(deck).toHaveLength(116); expect(new Set(deck.map(c => c.id)).size).toBe(116);
    for (const face of ['random', 'swap', 'everyone', 'shield']) expect(deck.filter(c => c.face === face)).toHaveLength(2);
    for (const color of ['red', 'blue', 'green', 'yellow']) expect(deck.filter(c => c.color === color && c.face === '0')).toHaveLength(1);
  });
  it('lets offline practice choose NPC identities, opponents, hand size, difficulty, and target score', () => {
    const { m, arrange, play } = setup({
      mode: 'bots',
      variant: 'basic',
      opponents: 2,
      missionMode: true,
      difficulty: 'hard',
      initialCards: 5,
      targetScore: 100,
      names: ['Người chơi', 'Người nấu bếp', 'Người đưa tin'],
      opponentCharacters: ['cook', 'messenger'],
    });
    expect(m).toMatchObject({
      difficulty: 'hard',
      rules: { initialCards: 5, targetScore: 100 },
      players: [
        { name: 'Người chơi', character: 'player' },
        { name: 'Người nấu bếp', character: 'cook' },
        { name: 'Người đưa tin', character: 'messenger' },
      ],
    });
    m.totals![0] = 100;
    arrange([[['red', '5']], [['blue', '3']], [['yellow', '3']]], ['red', '3']);
    play('5');
    expect(m.champion).toBe(0);
  });
  it('deals without duplicates and only permits matching color, symbol or wilds', () => {
    const { m, arrange } = setup();
    arrange([[['red', '3'], ['blue', '5'], ['green', '7'], [null, 'wild']], fillers, [['yellow', '1'], ['yellow', '2']]]);
    expect(m.players[0].hand.map(c => canPlayCard(m, 0, c))).toEqual([true, true, false, true]);
    const all = [...m.deck, ...m.discard, ...m.players.flatMap(p => p.hand)]; expect(new Set(all.map(c => c.id)).size).toBe(116);
  });
  it('reverses direction, skips a player, and reverse with two people repeats your turn', () => {
    const three = setup(); three.arrange([[['red', 'reverse'], ...fillers], [['blue', 'skip'], ['yellow', '3']], [['green', '4'], ['yellow', '4']]]);
    three.play('reverse'); expect(three.m.direction).toBe(-1); expect(three.m.turn).toBe(2);
    const two = setup({ opponents: 1 }); two.arrange([[['red', 'reverse'], ['red', 'skip'], ...fillers], [['yellow', '3'], ['yellow', '4']]]);
    two.play('reverse'); expect(two.m.turn).toBe(0); two.play('skip'); expect(two.m.turn).toBe(0);
  });
  it('draw two forces two cards and loses a turn when stacking is off', () => {
    const { m, api, arrange, play } = setup(); arrange([[['red', 'draw2'], ...fillers], [['blue', 'draw2'], ['yellow', '1']], [['blue', '3'], ['blue', '4']]]);
    play('draw2'); expect(m.pending).toBe(2); expect(canPlayCard(m, 1, m.players[1].hand[0])).toBe(false);
    api('ready'); api('draw', { player: 1 }); expect(m.players[1].hand).toHaveLength(4); expect(m.turn).toBe(2); expect(m.pending).toBe(0);
  });
  it('stacks different draw cards to six, with shield cancelling the entire stack', () => {
    const { m, arrange, play } = setup({ stack: true });
    arrange([[['red', 'draw2'], ...fillers], [[null, 'draw4'], ['yellow', '3'], ['blue', '4']], [[null, 'shield'], ['yellow', '2'], ['green', '7']]]);
    play('draw2'); play('draw4'); expect(m.pending).toBe(6); play('shield'); expect(m.pending).toBe(0);
    expect(m.players[2].hand).toHaveLength(2);
  });
  it('arms a shield ahead of time and consumes it on the next attack', () => {
    const { m, arrange, play } = setup({ opponents: 1 });
    arrange([[[null, 'shield'], ...fillers], [['blue', 'draw2'], ['blue', '7'], ['yellow', '3']]]);
    play('shield'); expect(m.players[0].shield).toBe(true); play('draw2'); expect(m.players[0].shield).toBe(false); expect(m.pending).toBe(0); expect(m.turn).toBe(0);
  });
  it('requires a wild color and applies random color, exchange and everyone-draw', () => {
    const first = setup(); first.arrange([[[null, 'wild'], ...fillers], [['blue', '4'], ['yellow', '3']], [['green', '3'], ['green', '4']]]);
    expect(() => first.api('play', { player: 0, cardId: first.m.players[0].hand[0].id })).toThrow('Chọn màu');
    first.play('wild', { color: 'green' }); expect(first.m.color).toBe('green');
    const random = setup(); random.arrange([[[null, 'random'], ...fillers], [['blue', '4'], ['yellow', '3']], [['green', '3'], ['green', '4']]]); random.play('random'); expect(['red', 'blue', 'green', 'yellow']).toContain(random.m.color);
    const swap = setup(); swap.arrange([[[null, 'swap'], ...fillers], [['red', '4'], ['yellow', '3']], [['green', '3'], ['green', '4']]]); swap.play('swap', { target: 1 }); expect(swap.m.players[0].hand).toHaveLength(2); expect(swap.m.players[1].hand).toHaveLength(3);
    const everyone = setup(); everyone.arrange([[[null, 'everyone'], ...fillers], [['red', '4'], ['yellow', '3']], [['green', '3'], ['green', '4']]]); everyone.play('everyone'); expect(everyone.m.players.map(p => p.hand.length)).toEqual([4, 3, 3]);
  });
  it('allows only the freshly drawn card, otherwise passing is required', () => {
    const { m, api, arrange } = setup(); arrange([[['red', '3'], ...fillers], [['blue', '4'], ['yellow', '3']], [['green', '3'], ['green', '4']]]);
    const index = m.deck.findIndex(c => c.color === 'red' && c.face === '9'); m.deck.push(m.deck.splice(index, 1)[0]);
    api('draw', { player: 0 }); expect(m.didDraw).toBe(true); expect(canPlayCard(m, 0, m.players[0].hand[0])).toBe(false);
    expect(() => api('draw', { player: 0 })).toThrow('đã rút'); api('pass', { player: 0 }); expect(m.turn).toBe(1);
  });
  it('reshuffles discarded cards while preserving the top card', () => {
    const { m, api, arrange } = setup(); arrange([[['green', '3'], ...fillers], [['blue', '4'], ['yellow', '3']], [['green', '7'], ['green', '4']]]);
    m.deck = []; const top = m.discard[0]; m.discard = [{ id: 999, color: 'red', face: '1' }, top];
    api('draw', { player: 0 }); expect(m.discard).toEqual([top]); expect(m.players[0].hand.some(c => c.id === 999)).toBe(true);
  });
  it('gives a human 3.5 seconds to say Còn 1, and penalizes forgetting', () => {
    const { m, arrange, play, tick, api } = setup(); arrange([[['red', '3'], ['green', '2']], fillers, [['yellow', '3'], ['blue', '4']]]); m.players[0].declared = false;
    play('3'); expect(m.onePending?.player).toBe(0); tick(3400); expect(m.players[0].hand).toHaveLength(1);
    tick(200); expect(m.players[0].hand).toHaveLength(3); expect(m.onePending).toBeNull(); expect(m.handoff).toBe(true);
    const called = setup(); called.arrange([[['red', '3'], ['green', '2']], fillers, [['yellow', '3'], ['blue', '4']]]); called.m.players[0].declared = false; called.play('3'); called.api('one', { player: 0 }); expect(called.m.players[0].hand).toHaveLength(1); expect(called.m.handoff).toBe(true);
    expect(() => api('play', { player: 0, cardId: m.players[0].hand[0].id })).toThrow();
  });
  it('pauses the turn clock at handoff and hides hands again when reopened', () => {
    const { m, api, tick } = setup({ turnSeconds: 15 }); expect(m.handoff).toBe(true); tick(60000); expect(m.turn).toBe(0);
    api('ready'); tick(16000); expect(m.turn).toBe(1); expect(m.handoff).toBe(true); expect(m.players[0].hand).toHaveLength(8);
    api('ready'); api('open'); expect(m.handoff).toBe(true); expect(m.deadline).toBeNull();
  });
  it('wins once, unlocks adventure content, and forbids replaying a finished move', () => {
    const { root, m, arrange, play, api } = setup({ mode: 'adventure', opponents: 1 });
    arrange([[['red', '3']], fillers]); play('3'); expect(m.status).toBe('finished'); expect(root.active.cards!.adventureStage).toBe(1); expect(root.active.cards!.unlockedCharacters).toContain('ti');
    expect(() => api('play', { player: 0, cardId: 1 })).toThrow(); expect(root.active.cards!.wins).toBe(1);
  });
  it('daily rules and deals are deterministic and use the Vietnamese date', () => {
    expect(localCardDate(Date.parse('2026-10-26T18:00:00Z'))).toBe('2026-10-27');
    expect(dailyCardRules('2026-10-26')).toEqual(dailyCardRules('2026-10-26'));
    const a = setup({ mode: 'daily' }), b = setup({ mode: 'daily' });
    expect(a.m.players.map(p => p.hand)).toEqual(b.m.players.map(p => p.hand)); expect(a.m.rules).toEqual(b.m.rules);
  });
  it('unlocks beach and roof at their milestones and counts each daily date once', () => {
    for (const [stage, room] of [[1, 'beach'], [3, 'roof']] as const) {
      const { root, m, arrange, play } = setup({ mode: 'adventure' });
      root.active.cards!.adventureStage = stage; m.stage = stage;
      arrange([[['red', '3']], fillers]); play('3');
      expect(root.active.cards!.unlockedRooms).toContain(room);
    }
    const a = setup({ mode: 'daily' }); a.arrange([[['red', '3']], fillers, [['yellow', '3'], ['blue', '4']]]);
    a.root.active.cards!.dailyWins.push(localCardDate(epoch)); a.play('3'); expect(a.root.active.cards!.dailyWins).toHaveLength(1);
  });
  it('resolves last-card exchange and everyone-draw before deciding a winner', () => {
    const swap = setup(); swap.arrange([[[null, 'swap']], fillers, [['yellow', '3'], ['blue', '4']]]); swap.play('swap', { target: 1 });
    expect(swap.m.winner).toBe(1); expect(swap.m.players[0].hand).toHaveLength(3);
    const all = setup(); all.arrange([[[null, 'everyone']], fillers, [['yellow', '3'], ['blue', '4']]]); all.play('everyone');
    expect(all.m.status).toBe('playing'); expect(all.m.players[0].hand).toHaveLength(1);
  });
  it('all three bot difficulties can finish full games without duplicating cards', () => {
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const { m, tick } = setup({ mode: 'bots', difficulty, opponents: 3, initialCards: 5 });
      // Simulation turns every seat into a bot; production always keeps the owner human.
      m.players[0].human = false;
      for (let turn = 0; turn < 2500 && m.status === 'playing'; turn++) tick(1200);
      expect(m.status).toBe('finished'); expect(m.winner).not.toBeNull();
      const all = [...m.deck, ...m.discard, ...m.players.flatMap(p => p.hand)]; expect(all).toHaveLength(116); expect(new Set(all.map(c => c.id)).size).toBe(116);
    }
  });
  it('preserves progress in five slots, resets a new game and rebases restored clocks', () => {
    const { root, api, m } = setup({ turnSeconds: 30 }); api('ready');
    for (let slot = 1; slot <= 5; slot++) localApi(root, 'PUT', `/backup/slots/${slot}`, {}, {}, epoch);
    localApi(root, 'POST', '/players/1/game/reset', {}, {}, epoch); expect(root.active.cards).toBeUndefined();
    localApi(root, 'POST', '/backup/slots/3/load', {}, {}, epoch + 86400000); expect(root.active.cards!.active!.players[0].hand).toEqual(m.players[0].hand); expect(root.active.cards!.active!.handoff).toBe(true);
    expect(root.slots.filter(Boolean)).toHaveLength(5);
  });
});
