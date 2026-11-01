import catalog from '../../game/offlineCatalog.json';
import { SHOP_BUYS, SHIFT_LENGTH, SHIFT_TOPPINGS, SHIFT_DISHES, type CounterProgress, type CounterShift, type ShiftBowl, type ShiftGuest } from '../../game/shift';
import type { LocalGame } from './engine';

function requireThat(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const random = (limit: number) => Math.floor(Math.random() * limit);
function progress(g: LocalGame): CounterProgress {
  return g.counter ??= { balance: 0, upgrades: [], shifts: 0, regulars: {}, current: null };
}
export function restoreCounterClock(g: LocalGame, savedAt: string, now: number) {
  const s = g.counter?.current;
  if (!s || s.ended !== null) return;
  const offset = Math.max(0, now - Date.parse(savedAt));
  s.started += offset;
  if (s.goldenUntil) s.goldenUntil += offset;
  for (const guest of s.guests) guest.deadline += offset;
  for (const bowl of s.bowls) {
    bowl.started += offset; bowl.deadline += offset;
    if (bowl.cookAt) bowl.cookAt += offset;
    if (bowl.readyAt) bowl.readyAt += offset;
  }
  // A restored save starts a new kitchen session; unfinished bowls still fail on entry.
  s.session = null;
}
function lose(g: LocalGame, s: CounterShift, guest: ShiftGuest, reason: string, now: number) {
  if (guest.status === 'served' || guest.status === 'lost') return;
  guest.status = 'lost'; s.lost++; s.combo = Math.max(0, s.combo - 1); s.bowls = s.bowls.filter(b => b.guestId !== guest.id);
  s.receipt = { id: g.nextId++, guest: guest.name, correct: false, perfect: false, title: 'Còn cứu được ca!', detail: reason + ' Chuỗi chỉ giảm một bậc.', money: 0, tips: [] };
  g.history.unshift({ id: g.nextId++, actionType: 'CounterLost', summary: `${guest.name}: ${reason}`, moneyChange: 0, reputationChange: 0, viralChange: 0, createdAt: new Date(now).toISOString() });
}
function finish(g: LocalGame, s: CounterShift, now: number) {
  if (s.ended !== null) return;
  for (const guest of s.guests) if (guest.status !== 'served' && guest.status !== 'lost') lose(g, s, guest, 'Ca bán đã kết thúc.', now);
  s.ended = now; s.session = null; s.bowls = [];
}
function advance(g: LocalGame, s: CounterShift, now: number) {
  if (s.ended !== null) return;
  const elapsed = now - s.started;
  for (const guest of s.guests) {
    if (guest.status === 'coming' && elapsed >= guest.arrival) guest.status = 'waiting';
    if (guest.status === 'waiting' && now >= guest.deadline) lose(g, s, guest, 'Khách đã chờ quá lâu.', now);
  }
  for (const bowl of [...s.bowls]) if (now >= bowl.deadline) lose(g, s, s.guests.find(c => c.id === bowl.guestId)!, 'Tô đang làm đã hết 60 giây.', now);
  if (elapsed >= SHIFT_LENGTH || s.guests.every(c => c.status === 'served' || c.status === 'lost')) finish(g, s, now);
}
function start(g: LocalGame, p: CounterProgress, session: string, now: number) {
  requireThat(!p.current || p.current.ended !== null, 'Ca hiện tại chưa kết thúc.');
  const profiles = [...catalog.profiles].sort(() => Math.random() - .5).slice(0, 6);
  const familiar = Object.keys(p.regulars).find(key => p.regulars[key].visits > 0);
  if (familiar) {
    const previous = profiles[0];
    const duplicate = profiles.findIndex((c, index) => index > 0 && c.key === familiar);
    profiles[0] = catalog.profiles.find(c => c.key === familiar) ?? profiles[0];
    if (duplicate > 0) profiles[duplicate] = previous;
  }
  const arrivals = [0, 0, 18000, 42000, 70000, 100000];
  const guests: ShiftGuest[] = profiles.map((profile, index) => {
    const known = p.regulars[profile.key], pho = known?.pho ?? random(3);
    const toppings = known?.toppings ?? [SHIFT_TOPPINGS[random(6)]];
    const special = index === 5;
    return { id: g.nextId++, name: profile.name, personaKey: profile.key, customerType: profile.type, pho, toppings: [...toppings], familiar: known?.visits ?? 0, special, arrival: arrivals[index], deadline: now + Math.min(SHIFT_LENGTH, arrivals[index] + (special ? 65000 : 80000) + (p.upgrades.includes('awning') ? 20000 : 0)), status: index < 2 ? 'waiting' : 'coming' };
  });
  p.shifts++;
  p.current = { number: p.shifts, started: now, ended: null, session, guests, bowls: [], combo: 0, bestCombo: 0, goldenUntil: 0, goldenTriggered: false, earned: 0, perfects: 0, served: 0, lost: 0, receipt: null };
}
export function counterApi(g: LocalGame, action: string, body: Record<string, unknown>, now: number) {
  const p = progress(g), session = String(body.session ?? '');
  if (p.current) advance(g, p.current, now);
  if (action === 'state') return { progress: p, money: g.player.money, now, revision: g.journey.revision ?? 0 };
  if (action === 'open') {
    requireThat(session.length > 0 && session.length < 100, 'Phiên bếp không hợp lệ.');
    const s = p.current;
    if (s && s.ended === null && s.session !== session) {
      for (const b of [...s.bowls]) lose(g, s, s.guests.find(c => c.id === b.guestId)!, 'Bạn đã rời bếp khi tô chưa xong.', now);
      s.session = session; advance(g, s, now);
    }
  } else if (action === 'start') {
    requireThat(session.length > 0 && session.length < 100, 'Phiên bếp không hợp lệ.'); start(g, p, session, now);
  } else if (action === 'buy') {
    const buy = SHOP_BUYS.find(b => b.id === body.upgrade);
    requireThat(buy && !p.upgrades.includes(buy.id), 'Món nâng cấp này đã có hoặc không hợp lệ.');
    requireThat(!p.current || p.current.ended !== null, 'Hoàn thành ca rồi sắm đồ nhé.');
    requireThat(p.balance >= buy.cost && g.player.money >= buy.cost, 'Bán thêm vài tô nữa là đủ tiền!');
    p.balance -= buy.cost; g.player.money -= buy.cost; p.upgrades.push(buy.id);
    g.history.unshift({ id: g.nextId++, actionType: 'CounterUpgrade', summary: `Đã sắm ${buy.name}.`, moneyChange: -buy.cost, reputationChange: 0, viralChange: 0, createdAt: new Date(now).toISOString() });
  } else {
    const s = p.current;
    requireThat(s, 'Mở ca bán trước nhé.');
    if (action === 'leave' && (s.session !== session || s.ended !== null)) return { progress: p, money: g.player.money, now, revision: g.journey.revision ?? 0 };
    requireThat(s.session === session && s.ended === null, 'Ca đã đóng hoặc đang mở ở cửa sổ khác.');
    const slot = Number(body.slot ?? 1), b = s.bowls.find(b => b.slot === slot);
    const bowl = (): ShiftBowl => { requireThat(b, 'Chạm một khách để nhận đơn trước.'); return b; };
    if (action === 'take') {
      const guest = s.guests.find(c => c.id === body.guestId);
      requireThat((slot === 1 || slot === 2) && !b && guest?.status === 'waiting' && !s.bowls.some(b => b.guestId === guest.id), 'Khách hoặc chỗ đặt tô đang bận.');
      s.bowls.push({ slot, guestId: guest.id, pho: null, toppings: [], phase: 'draft', started: now, deadline: Math.min(now + 60000, guest.deadline), cookAt: 0, cooked: 0, poured: 0, readyAt: 0 });
    } else if (action === 'meat') {
      const b = bowl(), pho = Number(body.pho); requireThat(b.phase !== 'ready' && [0, 1, 2].includes(pho), 'Chọn thịt trước khi chan nước.'); b.pho = pho;
    } else if (action === 'topping') {
      const b = bowl(), name = String(body.name); requireThat(SHIFT_TOPPINGS.includes(name), 'Topping không hợp lệ.');
      b.toppings = b.toppings.includes(name) ? b.toppings.filter(t => t !== name) : [...b.toppings, name];
    } else if (action === 'blanch') {
      const b = bowl(); requireThat(b.phase === 'draft', 'Bánh đang nhúng hoặc đã vớt.'); b.phase = 'cooking'; b.cookAt = now;
    } else if (action === 'lift') {
      const b = bowl(); requireThat(b.phase === 'cooking' && now - b.cookAt >= 700, 'Nhúng bánh ít nhất một nhịp rồi vớt.'); b.cooked = (now - b.cookAt) / 1000; b.phase = 'lifted';
    } else if (action === 'replace') {
      const b = bowl(); requireThat(b.phase === 'lifted' || b.phase === 'ready', 'Vớt bánh trước khi thay.'); b.phase = 'draft'; b.cooked = b.poured = b.readyAt = 0;
    } else if (action === 'pour') {
      const b = bowl(); requireThat(b.phase === 'lifted' && b.pho !== null, 'Cần bánh đã vớt và loại thịt trước khi chan.');
      const duration = Number(body.duration); requireThat(Number.isFinite(duration) && duration >= 500 && duration <= 4000, 'Giữ vá ít nhất nửa giây rồi thả.');
      b.poured = duration; b.phase = 'ready'; b.readyAt = now;
    } else if (action === 'serve') {
      const b = bowl(), guest = s.guests.find(c => c.id === body.guestId);
      requireThat(b.phase === 'ready' && guest?.status === 'waiting', 'Tô chưa sẵn sàng hoặc khách đã rời quán.');
      requireThat(guest.id === b.guestId, 'Nhầm ghế rồi! Tô vẫn còn, giao cho đúng khách nhé.');
      const correct = b.pho === guest.pho && JSON.stringify([...b.toppings].sort()) === JSON.stringify([...guest.toppings].sort());
      const ideal = b.cooked >= (p.upgrades.includes('stove') ? 2 : 2.5) && b.cooked <= (p.upgrades.includes('stove') ? 6 : 5);
      const hot = now - b.readyAt <= 15000, poured = b.poured >= 1000 && b.poured <= 2200;
      const perfect = correct && ideal && hot && poured;
      guest.status = 'served'; s.served++; s.bowls = s.bowls.filter(v => v.slot !== slot);
      if (correct) { s.combo++; s.bestCombo = Math.max(s.bestCombo, s.combo); } else s.combo = Math.max(0, s.combo - 1);
      if (s.combo >= 5 && !s.goldenTriggered) { s.goldenTriggered = true; s.goldenUntil = now + 20000; }
      const tips: { label: string; amount: number }[] = [];
      if (correct) {
        if (ideal) tips.push({ label: 'Bánh vừa chín', amount: 2000 });
        if (hot && poured) tips.push({ label: 'Nóng hổi, vừa nước', amount: 2000 });
        if (guest.familiar) tips.push({ label: 'Đúng gu khách quen', amount: 2000 });
        if (guest.special) tips.push({ label: 'Cứu đơn cuối ca', amount: 4000 });
        if (s.goldenUntil > now) tips.push({ label: 'Giờ vàng', amount: 6000 });
        if (p.upgrades.includes('cart')) tips.push({ label: 'Xe đẩy mới', amount: 2000 });
        const known = p.regulars[guest.personaKey] ?? { name: guest.name, visits: 0, pho: guest.pho, toppings: [...guest.toppings] }; known.name = guest.name; known.visits++; p.regulars[guest.personaKey] = known;
      }
      const money = correct ? 18000 + tips.reduce((sum, t) => sum + t.amount, 0) : 0;
      s.earned += money; p.balance += money; g.player.money += money; if (perfect) s.perfects++;
      g.totalServed++; if (correct) g.totalCorrect++;
      g.player.customersServedToday++; g.player.viralScore += correct ? (perfect ? 3 : 1) : 0; g.player.reputation = Math.max(0, Math.min(100, g.player.reputation + (correct ? 1 : -1)));
      const title = perfect ? 'ĐÚNG GU! Tuyệt đỉnh.' : correct ? 'Đúng món! Khách hài lòng.' : 'Chưa đúng món. Ca vẫn còn!';
      const detail = !correct ? `Khách muốn ${SHIFT_DISHES[guest.pho]}, ${guest.toppings.join(', ')}.` : perfect ? 'Khách chụp lại tô phở. Lần sau lại ghé!' : !ideal ? 'Canh bánh 2,5–5 giây để được tip thêm.' : !poured ? 'Giữ vá 1–2,2 giây để nước vừa đẹp.' : 'Giao trong 15 giây sau khi chan để tô còn nóng.';
      s.receipt = { id: g.nextId++, guest: guest.name, correct, perfect, title, detail, money, tips };
      g.orders.unshift({ id: g.nextId++, customerName: guest.name, phoType: SHIFT_DISHES[b.pho!], toppings: b.toppings.join(','), price: money, isCorrect: correct, serviceTimeSeconds: Math.ceil((now - b.started) / 1000), createdAt: new Date(now).toISOString() });
      g.history.unshift({ id: g.nextId++, actionType: 'CounterSale', summary: title + ' ' + guest.name, moneyChange: money, reputationChange: correct ? 1 : -1, viralChange: correct ? (perfect ? 3 : 1) : 0, createdAt: new Date(now).toISOString() });
      const coming = s.guests.find(c => c.status === 'coming');
      if (coming && s.guests.filter(c => c.status === 'waiting').length < 2) {
        const patience = coming.deadline - (s.started + coming.arrival);
        coming.arrival = now - s.started; coming.deadline = Math.min(s.started + SHIFT_LENGTH, now + patience); coming.status = 'waiting';
      }
      advance(g, s, now);
    } else if (action === 'leave') {
      for (const b of [...s.bowls]) lose(g, s, s.guests.find(c => c.id === b.guestId)!, 'Bạn rời bếp khi tô chưa hoàn thành.', now);
      s.session = null;
    } else if (action === 'finish') finish(g, s, now);
    else throw new Error('Thao tác ca bán không hợp lệ.');
  }
  return { progress: p, money: g.player.money, now, revision: g.journey.revision ?? 0 };
}
