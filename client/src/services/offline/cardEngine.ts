import { CARD_CAST, CARD_COLORS, CARD_ROOMS, canPlayCard, cardName, cardPlayStyleIndex, type CardColor, type CardDifficulty, type CardFace, type CardMatch, type CardMode, type CardProgress, type CardRoom, type CardRules, type PlayingCard } from '../../game/cards';
import type { LocalGame } from './engine';

function ensure(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function rng(m: { seed: number }) { m.seed = (Math.imul(m.seed, 1664525) + 1013904223) >>> 0; return m.seed / 4294967296; }
function shuffle<T>(items: T[], m: { seed: number }): T[] {
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rng(m) * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items;
}
export function makeCardDeck(variant: 'basic' | 'expanded' = 'expanded'): PlayingCard[] {
  const cards: PlayingCard[] = []; let id = 1;
  for (const color of CARD_COLORS) {
    cards.push({ id: id++, color, face: '0' });
    for (const face of [...Array.from({ length: 9 }, (_, i) => String(i + 1)), 'reverse', 'skip', 'draw2'] as CardFace[]) for (let n = 0; n < 2; n++) cards.push({ id: id++, color, face });
  }
  for (const face of ['wild', 'draw4', 'random', 'swap', 'everyone', 'shield'] as CardFace[]) for (let n = 0; n < (face === 'wild' || face === 'draw4' ? 4 : 2); n++) cards.push({ id: id++, color: null, face });
  return variant === 'basic' ? cards.filter(c => !['random', 'swap', 'everyone', 'shield'].includes(c.face)) : cards;
}
export function cardPoints(card: PlayingCard) { return /^\d$/.test(card.face) ? Number(card.face) : card.face === 'wild' || card.face === 'draw4' ? 50 : 20; }
export function localCardDate(now: number) { return new Date(now + 7 * 3600000).toISOString().slice(0, 10); }
function dateSeed(date: string) { return [...date].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261); }
export function dailyCardRules(date: string): { title: string; rules: CardRules } {
  return [
    { title: 'Chuỗi phạt nối dài', rules: { stack: true, turnSeconds: 0, initialCards: 7 } },
    { title: 'Năm lá, quyết định nhanh', rules: { stack: false, turnSeconds: 15, initialCards: 5 } },
    { title: 'Tay bài chín lá', rules: { stack: false, turnSeconds: 30, initialCards: 9 } },
    { title: 'Bảy sắc thư thả', rules: { stack: false, turnSeconds: 0, initialCards: 7 } },
    { title: 'Lá phạt chớp nhoáng', rules: { stack: true, turnSeconds: 15, initialCards: 5 } },
  ][dateSeed(date) % 5];
}
function progress(g: LocalGame): CardProgress {
  return g.cards ??= { wins: 0, played: 0, adventureStage: 0, unlockedCharacters: ['co-ba'], unlockedRooms: ['cafe', 'living'], dailyWins: [], active: null };
}
function log(m: CardMatch, text: string) { m.log.unshift(text); m.log = m.log.slice(0, 18); }
function next(m: CardMatch, from = m.turn, steps = 1) { return (from + m.direction * steps + m.players.length * 4) % m.players.length; }
function draw(m: CardMatch, index: number, count: number): PlayingCard[] {
  const cards: PlayingCard[] = [];
  for (let i = 0; i < count; i++) {
    if (!m.deck.length && m.discard.length > 1) { const top = m.discard.pop()!; m.deck = shuffle(m.discard, m); m.discard = [top]; }
    if (!m.deck.length) break;
    const card = m.deck.pop()!; m.players[index].hand.push(card); cards.push(card);
  }
  m.players[index].declared = false;
  if (count) { m.players[index].expression = 'surprised'; m.players[index].line = `Ôi, thêm ${cards.length} lá rồi!`; }
  return cards;
}
function armTurn(m: CardMatch, previous: number, now: number) {
  m.drawn = null; m.didDraw = false;
  m.handoff = m.players.filter(p => p.human).length > 1 && m.players[m.turn].human && previous !== m.turn;
  m.deadline = m.rules.turnSeconds && !m.handoff ? now + m.rules.turnSeconds * 1000 : null;
  m.nextBotAt = now + 950;
}
function win(g: LocalGame, m: CardMatch, index: number, now: number) {
  if (m.status !== 'playing') return;
  const p = progress(g); m.status = 'finished'; m.winner = index; m.onePending = null; m.handoff = false; m.deadline = null;
  m.unoVulnerable = undefined;
  if (m.rules.variant === 'basic') {
    m.roundPoints = m.players.reduce((sum, player, i) => sum + (i === index ? 0 : player.hand.reduce((total, card) => total + cardPoints(card), 0)), 0);
    m.totals ??= m.players.map(() => 0); m.totals[index] += m.roundPoints;
    const targetScore = m.rules.targetScore ?? 500;
    m.champion = m.totals[index] >= targetScore ? index : null;
    log(m, `${m.players[index].name} nhận ${m.roundPoints} điểm, tổng ${m.totals[index]}/${targetScore}.`);
  }
  p.played++; m.players[index].expression = 'happy'; m.players[index].line = 'Hết bài! Hẹn mọi người ván nữa nha!'; log(m, `${m.players[index].name} đã hết bài và thắng ván!`);
  if (m.wager && !m.wager.settled) {
    m.wager.settled = true; m.wager.payout = index === 0 ? m.wager.pot : 0;
    g.player.money += m.wager.payout;
    if (m.wager.stake) g.history.unshift({ id: g.nextId++, actionType: 'CardPayout', summary: `${m.players[index].name} thắng ván UNO${m.forfeitedBy !== undefined ? ' do bỏ cuộc' : ''}.`, moneyChange: m.wager.payout, reputationChange: 0, viralChange: 0, createdAt: new Date(now).toISOString() });
  }
  if (index !== 0 || m.forfeitedBy === 0) { p.losses = (p.losses ?? 0) + 1; return; }
  p.wins++;
  if (m.mode === 'adventure' && index === 0 && m.stage === p.adventureStage && p.adventureStage < 8) {
    p.adventureStage++;
    for (const person of CARD_CAST) if (person.unlock <= p.adventureStage && !p.unlockedCharacters.includes(person.id)) p.unlockedCharacters.push(person.id);
    for (const room of CARD_ROOMS) if (room.unlock <= p.adventureStage && !p.unlockedRooms.includes(room.id)) p.unlockedRooms.push(room.id);
    log(m, `Đã vượt bàn ${p.adventureStage}/8. Nhân vật và địa điểm mới đã lưu!`);
  }
  if (m.mode === 'daily' && m.dailyDate && !p.dailyWins.includes(m.dailyDate)) p.dailyWins.push(m.dailyDate);
}
function settleOne(m: CardMatch, now: number, penalty: boolean) {
  if (!m.onePending) return;
  const player = m.onePending.player;
  if (penalty) { draw(m, player, 2); log(m, `${m.players[player].name} quên hô Còn 1, rút thêm 2 lá.`); }
  else { m.players[player].declared = true; log(m, `${m.players[player].name}: Còn 1!`); }
  m.onePending = null; armTurn(m, player, now);
}
function play(g: LocalGame, m: CardMatch, index: number, cardId: number, color: unknown, target: unknown, now: number) {
  const player = m.players[index], card = player?.hand.find(c => c.id === cardId);
  ensure(card && canPlayCard(m, index, card), 'Lá này chưa đánh được. Hãy theo màu hoặc số/ký hiệu trên bàn.');
  if (card.color === null && card.face !== 'random') ensure(CARD_COLORS.includes(color as CardColor), 'Chọn màu tiếp theo trước nhé.');
  if (card.face === 'swap') ensure(Number.isInteger(target) && Number(target) >= 0 && Number(target) < m.players.length && target !== index, 'Chọn đối thủ để đổi tay bài.');
  const declared = player.declared;
  m.unoVulnerable = undefined;
  player.hand = player.hand.filter(c => c.id !== cardId); m.discard.push(card); m.color = card.color ?? (card.face === 'random' ? CARD_COLORS[Math.floor(rng(m) * 4)] : color as CardColor); m.moves++;
  player.expression = 'happy'; player.line = card.face === 'shield' ? 'Có khiên rồi, yên tâm!' : 'Tới lượt bạn đó!'; log(m, `${player.name} đánh ${cardName(card)}.`);
  let steps = 1;
  if (card.face === 'reverse') { m.direction = m.direction === 1 ? -1 : 1; if (m.players.length === 2) steps = 2; }
  if (card.face === 'skip') steps = 2;
  if (card.face === 'draw2' || card.face === 'draw4') m.pending += card.face === 'draw2' ? 2 : 4;
  if (card.face === 'shield') {
    if (m.pending) { log(m, `Khiên chặn ${m.pending} lá phạt!`); m.pending = 0; } else player.shield = true;
  }
  if (card.face === 'swap') {
    const other = m.players[Number(target)]; [player.hand, other.hand] = [other.hand, player.hand]; player.declared = other.declared = false;
    other.expression = 'surprised'; other.line = 'Ơ, tay bài của tôi đâu rồi?'; log(m, `${player.name} đổi bài với ${other.name}.`);
  }
  if (card.face === 'everyone') { for (let i = 0; i < m.players.length; i++) draw(m, i, 1); log(m, 'Cả bàn cùng rút thêm 1 lá.'); }
  const previous = index; m.turn = next(m, index, steps);
  if (m.pending && m.players[m.turn].shield) { m.players[m.turn].shield = false; log(m, `Khiên của ${m.players[m.turn].name} chặn toàn bộ ${m.pending} lá phạt.`); m.pending = 0; }
  const winner = m.players.findIndex(p => p.hand.length === 0);
  if (winner >= 0) { if (m.pending) { draw(m, m.turn, m.pending); m.pending = 0; } win(g, m, winner, now); return; }
  armTurn(m, previous, now);
  if (player.hand.length === 1) {
    if (!player.human || declared) { player.declared = true; log(m, `${player.name}: ${m.rules.variant === 'basic' ? 'UNO' : 'Còn 1'}!`); }
    else if (m.rules.variant === 'basic') { m.unoVulnerable = index; log(m, `${player.name} còn 1 lá nhưng chưa hô UNO!`); }
    else { m.onePending = { player: index, deadline: now + 3500 }; m.handoff = false; m.deadline = null; }
  } else player.declared = false;
  // Swapping can leave another human with one card without a declaration.
  if (card.face === 'swap') m.players[Number(target)].declared = m.players[Number(target)].hand.length === 1;
}
function takeTurn(m: CardMatch, index: number, now: number) {
  ensure(m.turn === index && !m.handoff && !m.onePending && m.status === 'playing', 'Chưa đến lượt của bạn.');
  ensure(!m.didDraw, 'Bạn đã rút rồi. Đánh lá vừa rút hoặc bấm Bỏ lượt.');
  m.unoVulnerable = undefined;
  if (m.pending) {
    const count = m.pending; m.pending = 0; draw(m, index, count); log(m, `${m.players[index].name} nhận ${count} lá phạt và mất lượt.`);
    m.turn = next(m); armTurn(m, index, now); return;
  }
  const cards = draw(m, index, 1); m.didDraw = true; m.drawn = cards[0]?.id ?? null;
  log(m, `${m.players[index].name} rút ${cards.length} lá.`);
  if (!cards.length || !canPlayCard(m, index, cards[0])) { m.turn = next(m); armTurn(m, index, now); }
}
function bestColor(m: CardMatch, index: number): CardColor { return [...CARD_COLORS].sort((a, b) => m.players[index].hand.filter(c => c.color === b).length - m.players[index].hand.filter(c => c.color === a).length)[0]; }
function bot(g: LocalGame, m: CardMatch, now: number) {
  const index = m.turn, player = m.players[index];
  if (m.unoVulnerable !== undefined && m.unoVulnerable !== index) {
    const missed = m.unoVulnerable; draw(m, missed, 2); m.unoVulnerable = undefined;
    log(m, `${player.name} bắt lỗi ${m.players[missed].name} quên hô UNO: rút 2 lá.`);
  }
  let candidates = player.hand.filter(c => canPlayCard(m, index, c));
  if (m.difficulty === 'easy' && candidates.length && rng(m) < .2 && !m.didDraw && !m.pending) candidates = [];
  const style = cardPlayStyleIndex(player.character);
  if (candidates.length) {
    if (m.difficulty === 'easy') candidates = shuffle(candidates, m);
    else {
      const nextCount = m.players[next(m)].hand.length, color = bestColor(m, index);
      const value = (c: PlayingCard) => (c.color === color ? 4 : 0) + (c.color === null && player.hand.length > 3 ? -5 : 0)
        + (style === 0 ? cardPoints(c) / 10 : 0)
        + (style === 1 && c.color ? player.hand.filter(card => card.color === c.color).length * 2 : 0)
        + (style === 2 && ['draw2', 'draw4', 'skip', 'reverse'].includes(c.face) ? 5 : 0)
        + (['draw2', 'draw4', 'skip', 'reverse'].includes(c.face) ? (nextCount <= 2 && m.difficulty === 'hard' ? 25 : 3) : 0)
        + (c.face === 'swap' && player.hand.length > Math.min(...m.players.filter((_, i) => i !== index).map(p => p.hand.length)) ? 12 : 0)
        + (c.face === 'shield' && m.pending ? 30 : 0);
      candidates.sort((a, b) => value(b) - value(a));
    }
    const target = m.players.map((p, i) => ({ i, size: i === index ? Infinity : p.hand.length })).sort((a, b) => a.size - b.size)[0].i;
    play(g, m, index, candidates[0].id, bestColor(m, index), target, now);
  } else if (m.didDraw) { m.turn = next(m); armTurn(m, index, now); log(m, `${player.name} bỏ lượt.`); }
  else { takeTurn(m, index, now); m.nextBotAt = now + 650; }
}
function advance(g: LocalGame, m: CardMatch, now: number) {
  if (m.status !== 'playing' || m.handoff) return;
  if (m.onePending) { if (now >= m.onePending.deadline) settleOne(m, now, true); else return; }
  if (!m.players[m.turn].human) { if (now >= m.nextBotAt) bot(g, m, now); return; }
  if (m.deadline !== null && now >= m.deadline) {
    m.unoVulnerable = undefined;
    const previous = m.turn;
    if (!m.didDraw) { const count = m.pending || 1; m.pending = 0; draw(m, previous, count); }
    log(m, `${m.players[previous].name} hết thời gian, chuyển lượt.`); m.turn = next(m); armTurn(m, previous, now);
  }
}
function start(g: LocalGame, p: CardProgress, body: Record<string, unknown>, now: number) {
  ensure(!p.active || p.active.status !== 'playing', 'Kết thúc ván đang chơi trước khi mở bàn mới.');
  const mode = String(body.mode ?? 'quick') as CardMode;
  ensure(['quick', 'adventure', 'bots', 'friends', 'daily'].includes(mode), 'Chế độ không hợp lệ.');
  let difficulty = String(body.difficulty ?? 'medium') as CardDifficulty;
  ensure(['easy', 'medium', 'hard'].includes(difficulty), 'Độ khó không hợp lệ.');
  let opponents = Number(body.opponents ?? 2);
  const basic = body.variant === 'basic' && mode !== 'daily' && mode !== 'adventure';
  ensure(Number.isInteger(opponents) && opponents >= 1 && opponents <= (basic && mode === 'friends' ? 9 : 3), 'Chọn 2–10 người chuyền máy, hoặc 1–3 đối thủ máy.');
  let room = String(body.room ?? 'cafe') as CardRoom;
  ensure(p.unlockedRooms.includes(room), 'Địa điểm này chưa mở. Vượt các bàn phiêu lưu để khám phá.');
  const targetScore = Number(body.targetScore ?? 500);
  let rules: CardRules = { stack: Boolean(body.stack), turnSeconds: Number(body.turnSeconds ?? 0), initialCards: Number(body.initialCards ?? 7), targetScore };
  ensure([0, 15, 30, 60].includes(rules.turnSeconds) && Number.isInteger(rules.initialCards) && rules.initialCards >= 3 && rules.initialCards <= 12 && [100, 200, 300, 500].includes(targetScore), 'Luật riêng không hợp lệ.');
  const date = localCardDate(now);
  if (mode === 'quick') { opponents = 2; difficulty = 'medium'; rules = { stack: false, turnSeconds: 0, initialCards: 7 }; }
  if (mode === 'daily') { rules = dailyCardRules(date).rules; opponents = 2; difficulty = 'hard'; room = 'cafe'; }
  if (mode === 'adventure') {
    const stage = Math.min(7, p.adventureStage); opponents = Math.min(3, 1 + Math.floor(stage / 3)); difficulty = stage < 2 ? 'easy' : stage < 5 ? 'medium' : 'hard';
    rules = { stack: stage >= 3, turnSeconds: stage >= 4 ? 30 : 0, initialCards: stage >= 6 ? 9 : 7 };
    room = stage >= 4 ? 'roof' : stage >= 2 ? 'beach' : 'cafe';
  }
  rules.variant = basic ? 'basic' : 'expanded';
  const requestedSeconds = Number(body.turnSeconds ?? 0);
  if (basic) rules = { variant: 'basic', stack: false, turnSeconds: requestedSeconds, initialCards: Number(body.initialCards ?? 7), targetScore: Number(body.targetScore ?? 500) };
  const missionMode = body.missionMode === true;
  const requestedStake = Number(body.stake ?? 0);
  ensure([0, 5000, 10000, 20000, 50000].includes(requestedStake), 'Mức cược tiền ảo không hợp lệ.');
  const stake = missionMode ? 0 : requestedStake;
  ensure(missionMode || stake >= 5000, 'Trận UNO thường cần cược tối thiểu 5.000 xu. Làm nhiệm vụ để chơi miễn cược.');
  ensure(g.player.money >= stake, 'Bạn chưa đủ xu ảo để vào ván này. Chọn mức thấp hơn hoặc làm nhiệm vụ để kiếm thêm xu.');
  const seed = mode === 'daily' ? dateSeed(date) : (globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ?? ((now ^ g.nextId * 7919) >>> 0));
  const random = { seed }; const deck = shuffle(makeCardDeck(basic ? 'basic' : 'expanded'), random);
  const available = CARD_CAST.filter(c => p.unlockedCharacters.includes(c.id));
  const requested = String(body.character ?? available[0].id); ensure(p.unlockedCharacters.includes(requested), 'Nhân vật này chưa mở khóa.');
  const names = Array.isArray(body.names) ? body.names : [];
  const requestedCharacters = Array.isArray(body.opponentCharacters) ? body.opponentCharacters : [];
  ensure(requestedCharacters.length <= opponents && requestedCharacters.every(character =>
    typeof character === 'string' && /^[a-z0-9-]{1,48}$/i.test(character),
  ), 'Danh sách đối thủ không hợp lệ.');
  const botProfiles = [CARD_CAST.find(c => c.id === requested)!, ...CARD_CAST.filter(c => c.id !== requested)];
  const players = Array.from({ length: opponents + 1 }, (_, index) => {
    const profile = botProfiles[Math.max(0, index - 1) % botProfiles.length];
    const customCharacter = index > 0 ? requestedCharacters[index - 1] : undefined;
    const human = index === 0 || mode === 'friends';
    const name = String(names[index] ?? (human ? index === 0 ? 'Bạn' : `Bạn ${index + 1}` : profile.name)).trim().slice(0, 24) || profile.name;
    return { name, character: index === 0 ? 'player' : customCharacter ?? profile.id, human, hand: deck.splice(-rules.initialCards), shield: false, declared: false, expression: 'neutral' as const, line: 'Chúc cả bàn một ván thật vui!' };
  });
  const topIndex = deck.findIndex(c => c.color !== null && /^\d$/.test(c.face)); const top = deck.splice(topIndex, 1)[0];
  p.active = { id: g.nextId++, mode, difficulty, room, rules, stage: Math.min(7, p.adventureStage), dailyDate: mode === 'daily' ? date : null, missionMode, players, deck, discard: [top], color: top.color!, turn: 0, direction: 1, pending: 0, drawn: null, didDraw: false, status: 'playing', winner: null, handoff: mode === 'friends', onePending: null, deadline: rules.turnSeconds && mode !== 'friends' ? now + rules.turnSeconds * 1000 : null, nextBotAt: now + 950, seed: random.seed, moves: 0, revision: 1, log: [mode === 'daily' ? `${date}: ${dailyCardRules(date).title}.` : 'Bàn đã mở. Cùng màu hoặc cùng số/ký hiệu là đánh được!'] };
  if (basic) { p.active.totals = players.map(() => 0); p.active.round = 1; p.active.champion = null; }
  p.active.wager = { stake, pot: stake * players.length, settled: false, payout: 0 };
  g.player.money -= stake;
  if (stake) g.history.unshift({ id: g.nextId++, actionType: 'CardStake', summary: `Vào ván UNO với ${stake.toLocaleString('vi-VN')}đ tiền ảo.`, moneyChange: -stake, reputationChange: 0, viralChange: 0, createdAt: new Date(now).toISOString() });
}
function forfeit(g: LocalGame, m: CardMatch, now: number) {
  if (m.status !== 'playing') return;
  m.forfeitedBy = 0;
  const winner = m.players.map((player, index) => ({ index, count: index === 0 ? Infinity : player.hand.length })).sort((a, b) => a.count - b.count)[0].index;
  log(m, `${m.players[0].name} rời bàn: tính thua và mất tiền cược của ván.`);
  win(g, m, winner, now);
}
export function restoreCardClock(g: LocalGame, savedAt: string, now: number) {
  const m = g.cards?.active; if (!m || m.status !== 'playing') return;
  const offset = Math.max(0, now - Date.parse(savedAt));
  if (m.deadline !== null) m.deadline += offset;
  if (m.onePending) m.onePending.deadline += offset;
  m.nextBotAt += offset;
  if (m.players.filter(p => p.human).length > 1) { m.handoff = true; m.deadline = null; }
}
export function cardsApi(g: LocalGame, action: string, body: Record<string, unknown>, now: number) {
  const p = progress(g); let m = p.active;
  if (m?.status === 'playing' && action === 'open' && body.abandonId === m.id) forfeit(g, m, now);
  if (m && !['start', 'hide', 'open', 'quit'].includes(action)) advance(g, m, now);
  if (action === 'start') { start(g, p, body, now); m = p.active; }
  else if (action === 'next-round') {
    ensure(m?.status === 'finished' && m.rules.variant === 'basic' && m.champion == null && m.forfeitedBy === undefined, 'Trận đã kết thúc hoặc chưa thể chia ván mới.');
    const totals = [...m.totals!], round = (m.round ?? 1) + 1;
    start(g, p, { mode: m.mode, variant: 'basic', opponents: m.players.length - 1, difficulty: m.difficulty, room: m.room, character: 'co-ba', opponentCharacters: m.players.slice(1).map(player => player.character), names: m.players.map(player => player.name), turnSeconds: m.rules.turnSeconds, initialCards: m.rules.initialCards, targetScore: m.rules.targetScore, stake: m.wager?.stake ?? 0, missionMode: m.missionMode }, now);
    m = p.active!; m.totals = totals; m.round = round;
  }
  else if (action === 'state') { /* Clock and one bot move were processed above. */ }
  else if (action === 'open' || action === 'hide') {
    if (m?.status === 'playing' && m.players.filter(p => p.human).length > 1) { m.handoff = true; m.deadline = null; }
  } else {
    ensure(m, 'Mở bàn chơi trước nhé.');
    if (action === 'quit') {
      if (m.status === 'playing') forfeit(g, m, now);
      else { m.status = 'abandoned'; m.onePending = null; m.handoff = false; m.deadline = null; }
    }
    else {
      ensure(m.status === 'playing', 'Ván đã kết thúc.');
      const index = Number(body.player);
      if (action === 'ready') { ensure(m.handoff && m.players[m.onePending?.player ?? m.turn].human, 'Bàn đã sẵn sàng.'); m.handoff = false; m.deadline = m.rules.turnSeconds && !m.onePending ? now + m.rules.turnSeconds * 1000 : null; if (m.onePending) m.onePending.deadline = now + 3500; }
      else if (action === 'catch') {
        ensure(m.rules.variant === 'basic' && !m.handoff && m.players[index]?.human && m.unoVulnerable !== undefined && m.unoVulnerable !== index, 'Không còn ai có thể bị bắt lỗi UNO.');
        const missed = m.unoVulnerable; draw(m, missed, 2); m.unoVulnerable = undefined;
        log(m, `${m.players[index].name} bắt lỗi ${m.players[missed].name} quên UNO: rút 2 lá.`);
      }
      else if (action === 'one') {
        ensure((!m.handoff || m.rules.variant === 'basic' && m.unoVulnerable === index) && Number.isInteger(index) && m.players[index]?.human, 'Chưa thể hô lúc này.');
        if (m.rules.variant === 'basic' && m.unoVulnerable === index) { m.unoVulnerable = undefined; m.players[index].declared = true; log(m, `${m.players[index].name}: UNO!`); }
        else if (m.onePending?.player === index) settleOne(m, now, false);
        else { ensure(index === m.turn && m.players[index].hand.length <= 2, 'Hô khi còn 1 hoặc 2 lá, trước lúc đánh lá kế cuối.'); m.players[index].declared = true; log(m, `${m.players[index].name}: ${m.rules.variant === 'basic' ? 'UNO' : 'Còn 1'}!`); }
      } else {
        ensure(index === m.turn && m.players[index]?.human && !m.handoff && !m.onePending, 'Chưa đến lượt của bạn.');
        if (action === 'play') play(g, m, index, Number(body.cardId), body.color, body.target, now);
        else if (action === 'draw') takeTurn(m, index, now);
        else if (action === 'pass') { ensure(m.didDraw, 'Rút một lá trước khi bỏ lượt.'); log(m, `${m.players[index].name} bỏ lượt.`); m.turn = next(m); armTurn(m, index, now); }
        else if (action === 'sort') m.players[index].hand.sort((a, b) => String(a.color ?? 'z').localeCompare(String(b.color ?? 'z')) || a.face.localeCompare(b.face, undefined, { numeric: true }));
        else throw new Error('Thao tác bài không hợp lệ.');
      }
    }
  }
  if (m) m.revision++;
  return { progress: p, money: g.player.money, now, revision: g.journey.revision ?? 0, daily: { date: localCardDate(now), ...dailyCardRules(localCardDate(now)) } };
}

export function forfeitOnlinePlayer(g: LocalGame, index: number, now: number) {
 const m=g.cards?.active; if(!m || m.status!=='playing') return;
 ensure(m.players[index], 'Người chơi không hợp lệ.');m.forfeitedBy=index;
 const winner=m.players.map((p,i)=>({i,count:i===index?Infinity:p.hand.length})).sort((a,b)=>a.count-b.count)[0].i;
 log(m, m.players[index].name+' rời bàn: tính thua ván này.');win(g,m,winner,now);
}
