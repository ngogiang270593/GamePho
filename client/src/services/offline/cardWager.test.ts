import { describe, expect, it } from 'vitest';
import { localApi, newRoot } from './engine';
import { makeCardDeck } from './cardEngine';
import type { CardSnapshot } from '../../game/cards';
const now = Date.parse('2026-10-27T08:00:00Z');
function setup(stake = 10000) {
  const root = newRoot(now);
  const api = (action: string, body: Record<string, unknown> = {}, at = now) => localApi(root, 'POST', '/cards/' + action, body, {}, at) as CardSnapshot;
  api('start', { mode: 'bots', variant: 'basic', opponents: 2, stake, turnSeconds: 15, missionMode: stake === 0 });
  return { root, api, m: root.active.cards!.active! };
}
function readyToWin(m: ReturnType<typeof setup>['m']) {
  const deck = makeCardDeck('basic');
  const pick = (color: string, face: string) => { const i = deck.findIndex(c => c.color === color && c.face === face); return deck.splice(i, 1)[0]; };
  m.discard = [pick('red', '5')]; m.color = 'red'; m.players[0].hand = [pick('red', '7')];
  m.players[1].hand = [pick('blue', '2')]; m.players[2].hand = [pick('green', '3')]; m.deck = deck;
}
describe('virtual UNO stakes and surrender', () => {
  it('deducts a stake at deal and pays the whole virtual pot exactly once', () => {
    const { root, m, api } = setup(); expect(root.active.player.money).toBe(490000); expect(m.wager?.pot).toBe(30000);
    readyToWin(m); api('play', { player: 0, cardId: m.players[0].hand[0].id });
    expect(root.active.player.money).toBe(520000); expect(m.wager?.payout).toBe(30000); expect(m.wager?.settled).toBe(true);
    api('state'); api('quit'); api('open'); expect(root.active.player.money).toBe(520000);
  });
  it('counts an exit as a loss, keeps the stake and never settles twice', () => {
    const { root, m, api } = setup(); api('quit'); expect(m.status).toBe('finished'); expect(m.forfeitedBy).toBe(0);
    expect(root.active.cards!.losses).toBe(1); expect(root.active.cards!.wins).toBe(0); expect(root.active.player.money).toBe(490000);
    api('quit'); api('open', { abandonId: m.id }); expect(root.active.cards!.losses).toBe(1); expect(root.active.player.money).toBe(490000);
    expect(() => api('next-round')).toThrow();
  });
  it('settles a real page-exit marker when reopened, but ignores stale markers', () => {
    const { root, m, api } = setup(); api('open', { abandonId: m.id + 1 }); expect(m.status).toBe('playing');
    api('open', { abandonId: m.id }); expect(m.forfeitedBy).toBe(0); expect(root.active.cards!.losses).toBe(1);
    api('open', { abandonId: m.id }); expect(root.active.cards!.losses).toBe(1);
  });
  it('recharges only at the next round and preserves stake, clock and scores', () => {
    const { root, m, api } = setup(); readyToWin(m); api('play', { player: 0, cardId: m.players[0].hand[0].id });
    const totals = [...m.totals!]; const result = api('next-round');
    expect(root.active.player.money).toBe(510000); expect(result.progress.active!.totals).toEqual(totals);
    expect(result.progress.active!.wager?.stake).toBe(10000); expect(result.progress.active!.rules.turnSeconds).toBe(15);
  });
  it('keeps subsequent mission rounds free', () => {
    const { root, m, api } = setup(0);
    m.status = 'finished'; m.winner = 0; m.totals = [0, 0, 0];
    const next = api('next-round');
    expect(next.progress.active?.missionMode).toBe(true);
    expect(next.progress.active?.wager?.stake).toBe(0);
    expect(root.active.player.money).toBe(500000);
  });
  it('rejects unaffordable and invalid stakes before taking any money', () => {
    const root = newRoot(now); root.active.player.money = 4000;
    expect(() => localApi(root, 'POST', '/cards/start', { mode: 'bots', variant: 'basic', stake: 5000 }, {}, now)).toThrow('chưa đủ');
    expect(root.active.player.money).toBe(4000); expect(root.active.cards!.active).toBeNull();
    expect(() => localApi(root, 'POST', '/cards/start', { mode: 'bots', stake: -1 }, {}, now)).toThrow('không hợp lệ');
    expect(root.active.player.money).toBe(4000);
  });
  it('requires a stake for ordinary matches but exempts a declared mission match', () => {
    const root = newRoot(now);
    expect(() => localApi(root, 'POST', '/cards/start', { mode: 'bots', variant: 'basic' }, {}, now))
      .toThrow('cần cược tối thiểu 5.000 xu');
    expect(root.active.player.money).toBe(500000);
    const mission = localApi(root, 'POST', '/cards/start', { mode: 'bots', variant: 'basic', missionMode: true }, {}, now) as CardSnapshot;
    expect(mission.progress.active?.wager?.stake).toBe(0);
    expect(root.active.player.money).toBe(500000);
  });
  it('draws and changes turn at the actual deadline, and still offers free play', () => {
    const { root, m, api } = setup(0); expect(root.active.player.money).toBe(500000);
    api('state', {}, now + 15000); expect(m.players[0].hand).toHaveLength(8); expect(m.turn).toBe(1);
    expect(m.deadline).toBe(now + 30000);
  });
});
