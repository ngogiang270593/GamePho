import catalog from '../../game/offlineCatalog.json';
import type { Journey } from '../../game/journey';
import { counterApi, restoreCounterClock } from './counter';
import { cardsApi, restoreCardClock } from './cardEngine';
import type { CardProgress } from '../../game/cards';
import type { CounterProgress } from '../../game/shift';
import type { Customer, EventHistory, GameState, OrderHistory, Player, RandomEvent } from '../gameTypes';
import type { KitchenAction, KitchenProgress, KitchenRegular } from '../kitchenService';

interface LocalGuest extends Customer { served: boolean; left: boolean; arrival: number }
interface LocalRegular extends KitchenRegular { lastHelpDay: number; giftsReceived: number }
interface LocalKitchen extends KitchenProgress { updated: number; referralPending: boolean; redone: number[] }
export interface LocalGame {
  counter?: CounterProgress;
  cards?: CardProgress;
  player: Player; journey: Journey; kitchen: LocalKitchen; guests: LocalGuest[];
  purchased: number[]; orders: OrderHistory[]; history: EventHistory[]; events: RandomEvent[];
  seenStories: string[]; nextId: number; dayStartMoney: number; totalServed: number; totalCorrect: number; goals: number;
}
export interface LocalRoot { schema: 1; active: LocalGame; slots: ({ savedAt: string; game: LocalGame; character: Record<string, string> } | null)[] }
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const check = (valid: unknown, message: string): void => { if (!valid) throw new Error(message); };
const iso = (now: number) => new Date(now).toISOString();
const random = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const menu = catalog.menu.filter((m, index, all) => m.isAvailable && all.findIndex(other => other.phoType === m.phoType) === index).map(m => ({ ...m, isDailySpecial: false }));
const regularKey = (c: Customer) => c.personaKey || c.name;
function regular(g: LocalGame, c: Customer): LocalRegular {
  const key = regularKey(c);
  return (g.kitchen.regulars[key] ??= { name: c.name, visits: 0, goodOrders: 0, helped: 0, memory: '', favoritePho: null, favoriteToppings: '', lastHelpDay: 0, giftsReceived: 0 } as LocalRegular) as LocalRegular;
}
function kitchen(now: number): LocalKitchen {
  return { session: null, heat: 82, fire: 'medium', broth: 6, noodles: 4, refillAt: null, prepAt: null, largePot: false, prepRack: false, insulated: false, bowls: [], regulars: {}, requests: {}, signatures: {}, lastSale: null, notice: 'Bếp offline đã sẵn sàng. Hai chỗ đặt tô, tự tay chọn nguyên liệu nhé!', updated: now, referralPending: false, redone: [] };
}
export function newGame(now = Date.now()): LocalGame {
  return { player: { id: 1, displayName: 'Chủ quán', money: 500000, reputation: 50, viralScore: 0, level: 1, currentDay: 1, customersServedToday: 0, viralProgress: 0, viralToNextLevel: 100 },
    journey: { revision: 1, season: 1, chapter: 1, completedDays: 0, isOpen: false, minute: 360, mode: 'cozy', boon: 'tea', weather: 'clear', theme: copy(catalog.days[0]), goalProgress: 0, dayServed: 0, dayCorrect: 0, dayLost: 0, combo: 0, bestCombo: 0, community: 0, craft: 0, fame: 0, mischief: 0, goalsWon: 0, upcomingCustomers: 0, nextArrivalMinute: null, pendingEvents: [], visitsToday: [], memories: [], report: null, ending: null, unlockedEndings: [], endings: copy(catalog.endings), decoration: 'none' },
    kitchen: kitchen(now), guests: [], purchased: [], orders: [], history: [], events: [], seenStories: [], nextId: 1, dayStartMoney: 500000, totalServed: 0, totalCorrect: 0, goals: 0 };
}
export function newRoot(now = Date.now()): LocalRoot { return { schema: 1, active: newGame(now), slots: Array(5).fill(null) }; }
function history(g: LocalGame, actionType: string, summary: string, moneyChange: number, reputationChange: number, viralChange: number, now: number) {
  g.history.unshift({ id: g.nextId++, actionType, summary, moneyChange, reputationChange, viralChange, createdAt: iso(now) }); g.history = g.history.slice(0, 1000);
}
function pay(g: LocalGame, amount: number) { check(g.player.money >= amount, 'Quán chưa đủ tiền.'); g.player.money -= amount; }
function refresh(g: LocalGame) {
  const j = g.journey; j.theme = copy(catalog.days[Math.min(6, j.completedDays)]); j.chapter = Math.min(7, j.completedDays + 1);
  j.goalProgress = j.theme.goalKind === 'visits' ? j.visitsToday.length : j.theme.goalKind === 'combo' ? j.bestCombo : j.theme.goalKind === 'choices' ? Number((g as LocalGame & { choicesToday?: number }).choicesToday ?? 0) : j.dayCorrect;
  j.upcomingCustomers = g.guests.filter(c => !c.served && !c.left && c.arrival > j.minute).length;
  j.nextArrivalMinute = g.guests.filter(c => !c.served && !c.left && c.arrival > j.minute).map(c => c.arrival).sort((a, b) => a - b)[0] ?? null;
  j.decoration = j.unlockedEndings.length ? 'lanterns' : j.completedDays >= 3 ? 'flowers' : 'none';
  g.player.level = 1 + Math.floor(g.player.viralScore / 100); g.player.viralProgress = g.player.viralScore % 100; g.player.viralToNextLevel = 100 - g.player.viralProgress;
}
function waiting(g: LocalGame) { return g.journey.isOpen ? g.guests.filter(c => !c.served && !c.left && c.arrival <= g.journey.minute).map(c => ({ ...c, secondsRemaining: Math.max(0, c.secondsRemaining ?? c.patience) })) : []; }
function update(g: LocalGame) { refresh(g); return { player: copy(g.player), journey: copy(g.journey), waitingCustomers: copy(waiting(g)), randomEvents: copy(g.events) }; }
function fail(g: LocalGame, customerId: number, reason: string, now: number) {
  const c = g.guests.find(c => c.id === customerId); g.kitchen.bowls = g.kitchen.bowls.filter(b => b.customerId !== customerId);
  if (!c || c.left || c.served) return;
  c.left = true; g.journey.dayLost++; g.journey.combo = 0; g.player.reputation = Math.max(0, g.player.reputation - 2);
  const message = `Tô của ${c.name} thất bại: ${reason}. Ca vẫn tiếp tục!`;
  g.kitchen.notice = message; g.kitchen.lastSale = { customerId, customerName: c.name, correct: false, message, money: 0, texture: '', drama: false, canRedo: false };
  history(g, 'PhoFailed', message, 0, -2, 0, now);
}
function advance(g: LocalGame, now: number) {
  const k = g.kitchen; const seconds = k.session ? Math.max(0, Math.min(90, (now - k.updated) / 1000)) : 0; k.updated = now;
  k.heat = Math.max(20, Math.min(100, k.heat + seconds * (k.fire === 'high' ? .8 : k.fire === 'low' ? -.18 : .08)));
  k.broth = Math.max(0, k.broth - seconds * (k.fire === 'high' ? .025 : k.fire === 'low' ? .001 : .004));
  if (k.refillAt && now >= Date.parse(k.refillAt)) { k.broth = k.largePot ? 10 : 6; k.heat = Math.max(20, k.heat - 22); k.refillAt = null; }
  if (k.prepAt && now >= Date.parse(k.prepAt)) { k.noodles = Math.min(k.prepRack ? 12 : 8, k.noodles + (k.prepRack ? 6 : 4)); k.prepAt = null; }
  for (const b of [...k.bowls]) if (now >= Date.parse(b.deadlineUtc)) fail(g, b.customerId, 'hết giờ', now);
}
function story(g: LocalGame) {
  if (g.events.length) return;
  if (g.seenStories.length >= catalog.stories.length) g.seenStories = g.seenStories.slice(-1);
  const card = random(catalog.stories.filter(s => !g.seenStories.includes(s.key))); const id = g.nextId++;
  g.seenStories.push(card.key); g.events.push({ id, title: card.title, description: card.description, actor: card.actor, eventType: 'Neighborhood', options: card.choices.map((o, index) => ({ id: id * 10 + index, text: o.text, moneyChange: o.money, reputationChange: o.reputation, viralChange: o.viral, path: o.path })) });
  g.journey.pendingEvents = g.events.map(e => e.id);
}
function startDay(g: LocalGame, now: number) {
  check(!g.journey.isOpen && g.journey.completedDays < 7, 'Tổng kết ngày hiện tại trước khi mở ngày mới.');
  const j = g.journey, k = g.kitchen;
  g.player.currentDay = (j.season - 1) * 7 + j.completedDays + 1; g.player.customersServedToday = 0; g.dayStartMoney = g.player.money;
  const cost = Math.min(g.player.money, 5000 + g.player.currentDay * 2500); g.player.money -= cost;
  j.isOpen = true; j.minute = 360; j.dayServed = j.dayCorrect = j.dayLost = j.combo = j.bestCombo = 0; j.report = null; j.weather = catalog.days[Math.min(6, j.completedDays)].weather as Journey['weather'];
  (g as LocalGame & { choicesToday?: number }).choicesToday = 0;
  (g as LocalGame & { storyDay?: number }).storyDay = 0;
  k.bowls = []; k.session = null; k.requests = {}; k.redone = []; k.lastSale = null; k.updated = now;
  let amount = Math.min(10, 3 + j.completedDays) + catalog.upgrades.filter(u => g.purchased.includes(u.id) && u.name === 'Nồi nước dùng lớn').reduce((max, u) => Math.max(max, u.effectValue), 0);
  if (k.referralPending) { amount++; k.referralPending = false; }
  const loyal = Object.entries(k.regulars).sort(([, a], [, b]) => b.helped - a.helped || b.goodOrders - a.goodOrders)[0]?.[0];
  g.guests = [];
  for (let i = 0; i < amount; i++) {
    const profile = i === 0 && loyal ? catalog.profiles.find(p => p.key === loyal) ?? random(catalog.profiles) : random(catalog.profiles);
    const dish = random(menu); const eligible = catalog.toppings.filter(t => profile.key !== 'bo' || !/hành|ớt|tiêu|sa tế/i.test(t.name));
    const ingredients = [...eligible].sort(() => Math.random() - .5).slice(0, 1 + Math.floor(Math.random() * 3));
    const patience = Math.max(j.mode === 'cozy' ? 100 : 55, (j.mode === 'cozy' ? 145 : 95) + profile.patienceBonus) + (j.boon === 'tea' ? 25 : 0);
    const guest: LocalGuest = { id: g.nextId++, name: profile.name, personaKey: profile.key, customerType: profile.type, hunger: 75, patience, secondsRemaining: patience, preferredPhoType: dish.phoType, requiredToppings: ingredients.map(t => t.name).join(','), arrivedAt: iso(now), dialogue: profile.greeting, served: false, left: false, arrival: 360 + Math.max(0, i - 1) * 130 };
    const r = regular(g, guest);
    if (r.helped > (r.giftsReceived ?? 0) && r.lastHelpDay < g.player.currentDay) { r.giftsReceived = r.helped; k.noodles = Math.min(k.prepRack ? 12 : 8, k.noodles + 2); guest.dialogue = r.memory + ' Hôm nay tôi mang bánh phở biếu quán!'; }
    else if (r.goodOrders) guest.dialogue = 'Tôi lại ghé đây, lần trước quán làm đúng món nên nhớ mãi! ' + guest.dialogue;
    g.guests.push(guest);
    if (i % 3 === 2) k.requests[guest.id] = { kind: 'chef', text: 'Hôm nay chủ quán chọn giúp một tô ngon nhất đi!', decision: null };
    else if (i === 0) k.requests[guest.id] = j.completedDays % 2 === 0 ? { kind: 'credit', text: 'Tôi thiếu tiền, quán cho mua chịu một tô được không?', decision: null } : { kind: 'rush', text: 'Tôi đang trễ hẹn. Làm trong 40 giây, tôi gửi thêm 5.000đ nhé?', decision: null };
  }
  refresh(g); return { currentDay: g.player.currentDay, operatingCost: cost, remainingMoney: g.player.money, customers: waiting(g), event: null, message: 'Đã mở ngày mới. Toàn bộ tiến trình lưu trên thiết bị này.' };
}
function kitchenView(g: LocalGame, now: number) { const v = update(g); return { ...v, kitchen: copy(g.kitchen), serverUtc: iso(now), rhythm: !g.journey.isOpen ? 'preparation' : !v.waitingCustomers.length ? 'rest' : g.journey.dayServed < 2 ? 'warmup' : v.waitingCustomers.length >= 3 ? 'rush' : 'steady' }; }
function kitchenAct(g: LocalGame, a: KitchenAction & { session: string }, now: number) {
  const k = g.kitchen, j = g.journey; const slot = a.slot ?? 1; const bowl = k.bowls.find(b => b.slot === slot);
  if (a.action === 'leave' && k.session !== a.session) return kitchenView(g, now);
  check(k.session && k.session === a.session, 'Phiên bếp đã đóng. Vào lại quán nhé.');
  const needBowl = () => { check(bowl, 'Chọn khách cho tô này trước nhé.'); return bowl!; };
  switch (a.action) {
    case 'accept': {
      const c = g.guests.find(c => c.id === a.customerId);
      check(slot >= 1 && slot <= 2 && !bowl && !k.bowls.some(b => b.customerId === a.customerId) && c && !c.left && !c.served && j.isOpen && c.arrival <= j.minute, 'Chỗ đặt tô đã có đơn hoặc khách không còn chờ.');
      const rush = k.requests[c!.id]?.kind === 'rush' && k.requests[c!.id]?.decision === 'accept';
      k.bowls.push({ slot, customerId: c!.id, deadlineUtc: iso(now + (rush ? 40000 : 60000)), startedUtc: iso(now), phoType: null, toppings: [], phase: 'draft', blanchStartedUtc: null, readyUtc: null, cookSeconds: 0, texture: 'chưa nhúng', confirmed: false }); break;
    }
    case 'recipe': {
      const b = needBowl(), selected = [...new Set(a.toppings ?? [])];
      check(b.phase === 'draft' && menu.some(m => m.phoType === a.phoType) && selected.length <= 5 && selected.every(t => catalog.toppings.some(v => v.name === t)), 'Loại phở hoặc topping không hợp lệ.');
      b.phoType = a.phoType!; b.toppings = selected; b.confirmed = true; break;
    }
    case 'blanch': { const b = needBowl(); check(b.phase === 'draft' && b.confirmed && k.noodles > 0, 'Xác nhận tô và chuẩn bị bánh trước khi nhúng.'); k.noodles--; b.phase = 'blanching'; b.blanchStartedUtc = iso(now); break; }
    case 'lift': { const b = needBowl(); check(b.phase === 'blanching' && b.blanchStartedUtc, 'Tô chưa nhúng bánh.'); const elapsed = (now - Date.parse(b.blanchStartedUtc!)) / 1000; check(elapsed >= 1, 'Chờ ít nhất một giây trước khi vớt.'); b.cookSeconds = elapsed; b.texture = elapsed >= (j.mode === 'cozy' ? 2 : 3) && elapsed <= (j.mode === 'cozy' ? 6 : 5) ? 'vừa chín' : elapsed < 3 ? 'hơi dai' : 'hơi mềm'; b.phase = 'blanched'; break; }
    case 'pour': { const b = needBowl(); check(b.phase === 'blanched' && !k.refillAt && k.broth >= 1 && k.heat >= (j.weather === 'rain' ? 75 : 65), 'Cần đủ nước dùng nóng và bánh đã vớt.'); k.broth--; b.phase = 'ready'; b.readyUtc = iso(now); (b as typeof b & { pourHeat?: number }).pourHeat = k.heat; break; }
    case 'fire': check(['low', 'medium', 'high'].includes(a.value ?? ''), 'Mức lửa không hợp lệ.'); k.fire = a.value as typeof k.fire; break;
    case 'refill': check(!k.refillAt && k.broth < (k.largePot ? 10 : 6) - .1, 'Nồi đang châm hoặc đã đầy.'); pay(g, 5000); k.refillAt = iso(now + 4000); break;
    case 'prep': check(!k.prepAt && k.noodles < (k.prepRack ? 12 : 8), 'Khay đã đầy hoặc đang chia bánh.'); pay(g, 2000); k.prepAt = iso(now + 3000); break;
    case 'request': {
      const b = needBowl(), r = k.requests[b.customerId]; check(r && !r.decision && r.kind !== 'chef' && ['accept', 'decline'].includes(a.value ?? ''), 'Câu chuyện đã được chọn.');
      r.decision = a.value!; if (r.kind === 'rush' && a.value === 'accept') b.deadlineUtc = iso(Math.min(Date.parse(b.deadlineUtc), Date.parse(b.startedUtc) + 40000));
      k.notice = a.value === 'accept' ? 'Đã nhận lời giúp khách. Phục vụ đúng món để giữ lời nhé!' : 'Khách hiểu, quán cứ phục vụ theo đơn thường.'; break;
    }
    case 'serve': {
      const b = needBowl(), c = g.guests.find(c => c.id === b.customerId)!;
      check(b.phase === 'ready' && b.phoType !== null && !c.served && !c.left && j.isOpen, 'Tô chưa sẵn sàng hoặc khách đã rời quán.');
      const r = k.requests[c.id], chef = r?.kind === 'chef', expected = c.requiredToppings.split(',').filter(Boolean).sort(), actual = [...b.toppings].sort();
      const correct = chef || (c.preferredPhoType === b.phoType && JSON.stringify(expected) === JSON.stringify(actual));
      const dish = menu.find(m => m.phoType === b.phoType)!; const price = dish.basePrice + b.toppings.reduce((sum, t) => sum + (catalog.toppings.find(v => v.name === t)?.price ?? 0), 0);
      const fresh = now - Date.parse(b.readyUtc!) <= (k.insulated ? 35000 : 20000); const good = correct && b.texture === 'vừa chín' && fresh;
      const memory = regular(g, c); memory.visits++;
      j.dayServed++; g.totalServed++; g.player.customersServedToday++;
      let earned = 0, message = correct ? catalog.profiles.find(p => p.key === c.personaKey)?.happy ?? 'Đúng món, ngon lắm!' : 'Tô này chưa đúng đơn.';
      if (correct) {
        j.dayCorrect++; g.totalCorrect++; j.craft++; j.combo++; j.bestCombo = Math.max(j.combo, j.bestCombo); memory.goodOrders++; memory.favoritePho = b.phoType; memory.favoriteToppings = b.toppings.join(',');
        earned = price + (good ? 3000 : 0) + (j.combo % 3 === 0 ? 3000 : 0) + (b.phoType === (g.player.currentDay - 1) % 4 ? 5000 : 0);
        if (j.weather === 'rain' && ((b as typeof b & { pourHeat?: number }).pourHeat ?? 0) >= 85) earned += 1000;
        if (r?.decision === 'accept' && r.kind === 'credit') { earned = 0; memory.helped++; memory.lastHelpDay = g.player.currentDay; memory.memory = 'Lần trước quán cho tôi ăn chịu, tôi vẫn nhớ.'; j.community += 2; message += ' Đã ghi món mua chịu.'; }
        if (r?.decision === 'accept' && r.kind === 'rush') { earned += 5000; memory.helped++; memory.lastHelpDay = g.player.currentDay; memory.memory = 'Lần trước quán cứu đơn gấp cho tôi.'; }
        if (chef) { const key = b.phoType + ':' + actual.join('|'); const sig = k.signatures[key] ??= { key, name: 'Món tủ chưa đặt tên', phoType: b.phoType!, toppings: [...b.toppings], likes: 0 }; sig.likes++; message += ` Công thức được thích ${sig.likes}/3 lần.`; }
        if (j.combo >= 5) k.referralPending = true;
      } else {
        j.combo = 0; j.mischief += 2;
        if (c.preferredPhoType !== b.phoType) message += ' Loại phở chưa đúng.';
        const missing = expected.filter(t => !actual.includes(t)), extra = actual.filter(t => !expected.includes(t));
        if (missing.length) message += ' Thiếu: ' + missing.join(', ') + '.'; if (extra.length) message += ' Thừa: ' + extra.join(', ') + '.';
      }
      c.served = true; g.player.money += earned; g.player.reputation = Math.max(0, Math.min(100, g.player.reputation + (correct ? 2 : -3))); g.player.viralScore += correct ? (j.boon === 'sign' ? 2 : 1) : 0;
      message += ` Bánh ${b.texture}.`;
      g.orders.unshift({ id: g.nextId++, customerName: c.name, phoType: dish.name, toppings: b.toppings.join(','), price: earned, isCorrect: correct, serviceTimeSeconds: Math.ceil((now - Date.parse(b.startedUtc)) / 1000), createdAt: iso(now) }); g.orders = g.orders.slice(0, 1000);
      k.bowls = k.bowls.filter(v => v.slot !== slot); k.lastSale = { customerId: c.id, customerName: c.name, correct, message, money: earned, texture: b.texture, drama: false, canRedo: !correct && !k.redone.includes(c.id) }; k.notice = message;
      history(g, 'KitchenSale', message, earned, correct ? 2 : -3, correct ? 1 : 0, now);
      if (j.dayServed % 3 === 0) story(g);
      break;
    }
    case 'redo': { const last = k.lastSale; check(last && last.canRedo && !k.redone.includes(last.customerId), 'Đơn này không thể làm lại.'); pay(g, 3000); const c = g.guests.find(c => c.id === last!.customerId)!; c.served = false; c.left = false; c.arrival = j.minute; c.secondsRemaining = 70; k.redone.push(c.id); last!.canRedo = false; break; }
    case 'upgrade': { const key = a.value === 'pot' ? 'largePot' : a.value === 'rack' ? 'prepRack' : a.value === 'insulation' ? 'insulated' : null; check(key && !k[key], 'Nâng cấp đã có hoặc không hợp lệ.'); pay(g, key === 'largePot' ? 45000 : key === 'prepRack' ? 30000 : 60000); k[key!] = true; break; }
    case 'name': { const sig = k.signatures[a.value ?? ''], name = a.toppings?.[0]?.trim(); check(sig && sig.likes >= 3 && name && name.length <= 30, 'Cần 3 lượt thích và tên món từ 1–30 ký tự.'); sig.name = name!; break; }
    case 'leave': for (const b of [...k.bowls]) fail(g, b.customerId, 'đã thoát quán', now); k.session = null; break;
    default: throw new Error('Thao tác bếp không hợp lệ.');
  }
  return kitchenView(g, now);
}
function journeyAct(g: LocalGame, action: string, body: Record<string, unknown>, now: number) {
  const j = g.journey;
  if (action === 'prepare') { check(!j.isOpen && ['cozy', 'story'].includes(String(body.mode)) && ['tea', 'stove', 'sign'].includes(String(body.boon)), 'Không thể đổi chuẩn bị trong ca bán.'); j.mode = body.mode as Journey['mode']; j.boon = body.boon as Journey['boon']; }
  else if (action === 'tick' && j.isOpen) {
    const elapsed = Math.max(0, Math.min(3, Number(body.seconds) || 0)), old = j.minute; j.minute = Math.min(1320, j.minute + elapsed * 6);
    for (const c of g.guests.filter(c => !c.left && !c.served && c.arrival <= j.minute)) { c.secondsRemaining = Math.max(0, (c.secondsRemaining ?? c.patience) - Math.min(elapsed, Math.max(0, (j.minute - Math.max(old, c.arrival)) / 6))); if (c.secondsRemaining <= 0 || j.minute >= 1320) fail(g, c.id, 'khách chờ quá lâu', now); }
    if (j.minute >= 600 && !g.events.length && !(g as LocalGame & { storyDay?: number }).storyDay) { story(g); (g as LocalGame & { storyDay?: number }).storyDay = 1; }
  } else if (action === 'next-wave') { check(j.isOpen && waiting(g).length === 0, 'Phục vụ khách đang chờ trước nhé.'); const next = g.guests.filter(c => !c.left && !c.served && c.arrival > j.minute).sort((a, b) => a.arrival - b.arrival)[0]; check(next, 'Hôm nay không còn đợt khách mới.'); j.minute = next.arrival; }
  else if (action === 'visit') { check(['co-ba', 'ba-nam', 'ti', 'man', 'chu-tu', 'bac-sau'].includes(String(body.npcId)), 'Người hàng xóm không hợp lệ.'); if (!j.visitsToday.includes(String(body.npcId))) { j.visitsToday.push(String(body.npcId)); j.community++; } }
  else if (action === 'close') {
    check(j.isOpen && !g.events.length, 'Ngày đã đóng hoặc còn câu chuyện cần xử lý.'); check(Boolean(body.forfeit) || !g.guests.some(c => !c.left && !c.served), 'Còn khách trong ngày, chọn đóng cửa sớm nếu muốn dừng.');
    for (const c of g.guests.filter(c => !c.served && !c.left)) fail(g, c.id, 'quán đóng cửa', now);
    refresh(g); const goalMet = j.goalProgress >= j.theme.target, reward = goalMet ? 15000 + j.completedDays * 2500 : 0;
    g.player.money += reward; if (goalMet) j.goalsWon++;
    j.report = { day: j.completedDays + 1, served: j.dayServed, correct: j.dayCorrect, lost: j.dayLost, bestCombo: j.bestCombo, netMoney: g.player.money - g.dayStartMoney, goalMet, reward, quip: 'Nồi đã nghỉ, câu chuyện của xóm vẫn còn. Mai mình mở cửa tiếp nhé!' };
    j.completedDays++; j.isOpen = false; j.minute = 1260; j.visitsToday = []; g.kitchen.session = null; g.kitchen.bowls = [];
    if (j.completedDays >= 7) { const ending = j.mischief >= 10 && j.fame >= 8 ? 'meme' : j.community >= 14 && j.community * 2 >= j.craft ? 'community' : j.craft >= 18 && g.totalCorrect / Math.max(1, g.totalServed) >= .85 ? 'craft' : j.fame >= 12 ? 'fame' : j.goalsWon >= 4 ? 'comeback' : 'cozy'; j.ending = ending; if (!j.unlockedEndings.includes(ending)) j.unlockedEndings.push(ending); }
  } else if (action === 'continue') { check(!j.isOpen && j.completedDays >= 7, 'Hoàn thành bảy ngày trước khi chơi mùa mới.'); j.season++; j.completedDays = j.goalsWon = j.community = j.craft = j.fame = j.mischief = 0; g.totalServed = g.totalCorrect = 0; j.report = null; j.ending = null; j.minute = 360; }
  return update(g);
}
function achievements(g: LocalGame) {
  return catalog.achievements.map(a => {
    const currentValue = a.code.includes('BOWL') ? g.orders.length
      : a.code.includes('ACCURATE') ? g.orders.filter(o => o.isCorrect).length
      : a.code.includes('DRAMA') ? g.history.filter(h => h.actionType === 'Drama').length
      : a.code.includes('GOAL') ? g.goals
      : a.code.includes('VIRAL') ? g.player.viralScore
      : a.code.includes('MONEY') ? g.player.money : 0;
    return { ...a, currentValue, isUnlocked: currentValue >= a.targetValue, unlockedAt: currentValue >= a.targetValue ? g.history[0]?.createdAt ?? null : null };
  });
}
export function localApi(root: LocalRoot, method: string, path: string, body: Record<string, unknown> = {}, params: Record<string, unknown> = {}, now = Date.now()): unknown {
  check(root.schema === 1, 'Bản lưu offline cần phiên bản game mới hơn.');
  const g = root.active; advance(g, now); g.journey.revision = (g.journey.revision ?? 0) + 1; refresh(g);
  if (path.startsWith('/counter/')) return counterApi(g, path.slice('/counter/'.length), body, now);
  if (path.startsWith('/cards/')) return cardsApi(g, path.slice('/cards/'.length), body, now);
  if (path === '/toppings') return copy(catalog.toppings);
  if (path === '/game-state') return { ...update(g), menu: copy(menu), toppings: copy(catalog.toppings), upgrades: catalog.upgrades.map(u => ({ ...u, isPurchased: g.purchased.includes(u.id) })), purchasedUpgrades: catalog.upgrades.filter(u => g.purchased.includes(u.id)), achievements: achievements(g), unlockedFeatures: [] } satisfies GameState;
  if (path.endsWith('/game/reset')) { root.active = newGame(now); return null; }
  if (path === '/game/start-day' || path.endsWith('/game/new-day')) return startDay(g, now);
  if (path.startsWith('/journey/')) return journeyAct(g, path.split('/').pop()!, body, now);
  if (path === '/kitchen/open') { const session = String(body.session ?? ''); check(session && session.length <= 80, 'Phiên bếp không hợp lệ.'); if (g.kitchen.session !== session) { for (const b of [...g.kitchen.bowls]) fail(g, b.customerId, 'đã thoát quán', now); g.kitchen.session = session; g.kitchen.updated = now; } return kitchenView(g, now); }
  if (path === '/kitchen/state') { check(g.kitchen.session === params.session, 'Phiên bếp đã đóng.'); return kitchenView(g, now); }
  if (path === '/kitchen/action') return kitchenAct(g, body as unknown as KitchenAction & { session: string }, now);
  if (path === '/backup/slots') return root.slots.map((s, index) => ({ id: index + 1, savedAt: s?.savedAt ?? null }));
  const slotMatch = path.match(/^\/backup\/slots\/(\d+)(\/load)?$/);
  if (slotMatch) {
    const index = Number(slotMatch[1]) - 1;
    check(index >= 0 && index < 5, 'Ô lưu không hợp lệ.');
    if (method === 'PUT') {
      root.slots[index] = { savedAt: iso(now), game: copy(g), character: copy(body) as Record<string, string> }; return null;
    }
    check(root.slots[index], 'Ô này chưa có bản lưu.');
    const saved = root.slots[index]!;
    root.active = copy(saved.game);
    restoreCounterClock(root.active, saved.savedAt, now);
    restoreCardClock(root.active, saved.savedAt, now);
    root.active.journey.revision = (g.journey.revision ?? 0) + 1;
    return copy(saved.character);
  }
  if (path === '/backup') return new Blob([JSON.stringify({ format: 'pho-xom-offline-v1', ...root })], { type: 'application/json' });
  if (path === '/upgrades') return catalog.upgrades.map(u => ({ ...u, isPurchased: g.purchased.includes(u.id) }));
  if (path === '/upgrades/buy') { const u = catalog.upgrades.find(u => u.id === body.upgradeId); check(u && !g.purchased.includes(u.id) && (u.level === 1 || catalog.upgrades.some(v => v.name === u.name && v.level === u.level - 1 && g.purchased.includes(v.id))), 'Nâng cấp đã mua hoặc cần mua cấp trước.'); pay(g, u!.cost); g.purchased.push(u!.id); return { ...u, isPurchased: true }; }
  if (path.endsWith('/achievements')) return achievements(g);
  if (path.endsWith('/statistics')) return { totalOrders: g.orders.length, correctOrders: g.orders.filter(o => o.isCorrect).length, totalRevenue: g.orders.reduce((sum, o) => sum + o.price, 0), totalGoals: g.goals, currentStreak: g.journey.combo, shopLevel: g.player.level };
  if (path.endsWith('/history/orders')) return copy(g.orders);
  if (path.endsWith('/history/events')) return copy(g.history);
  if (path.endsWith('/history/revenue')) { const grouped: Record<string, number> = {}; for (const o of g.orders) grouped[o.createdAt.slice(0, 10)] = (grouped[o.createdAt.slice(0, 10)] ?? 0) + o.price; return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue })); }
  if (path === '/football/play') { const power = Number(body.shotPower), angle = Number(body.shotAngle), timing = Number(body.timingScore); check(Number.isFinite(power) && power >= 0 && power <= 100 && Math.abs(angle) <= 90 && timing >= 0 && timing <= 100, 'Thông số cú sút không hợp lệ.'); const score = Math.round((power + Math.max(0, 100 - Math.abs(angle) * 2) + timing) / 3), isGoal = Math.random() < Math.max(.02, Math.min(.9, score / 130)); const moneyReward = isGoal ? 5000 + score * 100 : 0, viralReward = isGoal ? 1 + Math.floor(score / 25) : 0; g.player.money += moneyReward; g.player.viralScore += viralReward; if (isGoal) g.goals++; const commentary = isGoal ? 'Vào rồi! Cả hẻm reo vui, quán thêm khách!' : 'Bóng chưa vào, lượt sau mình canh lại nhé!'; history(g, isGoal ? 'FootballGoal' : 'FootballShot', commentary, moneyReward, 0, viralReward, now); return { isGoal, score, moneyReward, viralReward, commentary }; }
  if (path === '/events/resolve') { const event = g.events.find(e => e.id === body.eventId), option = event?.options.find(o => o.id === body.optionId); check(event && option, 'Câu chuyện đã xử lý hoặc lựa chọn không hợp lệ.'); const card = catalog.stories.find(s => s.title === event!.title), choice = card?.choices.find(c => c.text === option!.text); check(choice, 'Không tìm thấy nội dung câu chuyện.'); g.player.money = Math.max(0, g.player.money + choice!.money); g.player.reputation = Math.max(0, Math.min(100, g.player.reputation + choice!.reputation)); g.player.viralScore += choice!.viral; const key = choice!.path as 'community' | 'craft' | 'fame' | 'mischief'; g.journey[key]++; (g as LocalGame & { choicesToday?: number }).choicesToday = Number((g as LocalGame & { choicesToday?: number }).choicesToday ?? 0) + 1; g.journey.memories.unshift({ day: g.player.currentDay, title: event!.title, choice: choice!.text, result: choice!.result, path: choice!.path }); g.events = g.events.filter(e => e.id !== event!.id); g.journey.pendingEvents = g.events.map(e => e.id); history(g, 'StoryChoice', choice!.result, choice!.money, choice!.reputation, choice!.viral, now); return { resultText: choice!.result, money: g.player.money, reputation: g.player.reputation, viralScore: g.player.viralScore }; }
  throw new Error('Chức năng offline chưa được nhận diện: ' + path);
}
