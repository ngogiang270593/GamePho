import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { offlineGame, onlineGame } from '../services/gameMode';
import { CounterShop } from './CounterShop';
import { ShopScene } from '../components/ShopScene';
import { FoodIcon } from '../components/ShopArt';
import { CustomerSprite } from '../components/CustomerSprite';
import { useGameStore } from '../context/GameContext';
import { useJourney } from '../context/JourneyContext';
import { normalizeAppearance } from '../game/character';
import type { ShopMoment, ShopPhase } from '../game/shop';
import type { Customer } from '../services/gameTypes';
import { resolveGameEvent } from '../services/gameService';
import { kitchenAction, leaveKitchen, openKitchen, readKitchen, type KitchenAction, type KitchenSnapshot } from '../services/kitchenService';

const PHASES = { draft: 'Soạn tô', blanching: 'Đang nhúng', blanched: 'Chờ chan', ready: 'Sẵn sàng' };
const RHYTHMS = { preparation: 'Chuẩn bị ca', warmup: 'Đầu ca · làm quen tay', rush: 'Giờ đông · giữ nhịp nhé!', rest: 'Nghỉ tay · chuẩn bị đợt sau', steady: 'Quán đang vào nhịp' };
const FIRE = { low: 'Nhỏ', medium: 'Vừa', high: 'Lớn' };
type Panel = 'guests' | 'recipe' | 'pot' | 'book' | 'result' | null;

export function ShopPage() {
  return (offlineGame || onlineGame) ? <CounterShop /> : <LegacyShopPage />;
}
function LegacyShopPage() {
  const { gameState, character, applyJourneyUpdate, loadGame } = useGameStore();
  const { act: journeyAct, busy: journeyBusy } = useJourney();
  const [snapshot, setSnapshot] = useState<KitchenSnapshot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [panel, setPanel] = useState<Panel>(null);
  const [draftPho, setDraftPho] = useState<number | null>(null);
  const [draftToppings, setDraftToppings] = useState<string[]>([]);
  const [signatureName, setSignatureName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [reaction, setReaction] = useState<{ guest: Customer; phase: ShopPhase; startedAt: number } | null>(null);
  const session = useRef(crypto.randomUUID());
  const lifecycle = useRef(0);
  const live = useRef(false);
  const pending = useRef(false);
  const offset = useRef(0);
  const current = useRef(snapshot);
  current.current = snapshot;

  function accept(data: KitchenSnapshot) {
    if (!live.current) return;
    if ((current.current?.journey.revision ?? 0) > (data.journey.revision ?? 0)) return;
    offset.current = Date.parse(data.serverUtc) - Date.now();
    current.current = data; setSnapshot(data);
    applyJourneyUpdate({ player: data.player, journey: data.journey, waitingCustomers: data.waitingCustomers, randomEvents: data.randomEvents });
  }
  async function connect() {
    try { accept(await openKitchen(session.current)); setError(''); }
    catch (cause) { if (live.current) setError(cause instanceof Error ? cause.message : 'Chưa kết nối được bếp.'); }
  }
  useEffect(() => {
    const generation = ++lifecycle.current;
    live.current = true;
    void connect().then(() => { if (!live.current && lifecycle.current === generation) leaveKitchen(session.current); });
    let reading = false;
    const poll = window.setInterval(() => {
      if (!current.current || reading || pending.current) return;
      reading = true;
      void readKitchen(session.current).then(accept).catch(cause => { if (live.current) setError(cause instanceof Error ? cause.message : 'Bếp đang mất kết nối.'); }).finally(() => { reading = false; });
    }, 1000);
    const clock = window.setInterval(() => setNow(Date.now()), 100);
    const leave = () => leaveKitchen(session.current);
    window.addEventListener('pagehide', leave);
    return () => {
      live.current = false; window.clearInterval(poll); window.clearInterval(clock); window.removeEventListener('pagehide', leave);
      queueMicrotask(() => { if (lifecycle.current === generation) leave(); });
    };
  }, []);
  useEffect(() => { if (!reaction) return; const timer = window.setTimeout(() => setReaction(null), 1800); return () => window.clearTimeout(timer); }, [reaction]);

  async function act(action: KitchenAction): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError('');
    try { accept(await kitchenAction(session.current, { slot: selectedSlot, ...action })); return true; }
    catch (cause) { if (live.current) setError(cause instanceof Error ? cause.message : 'Chưa thực hiện được thao tác.'); return false; }
    finally { pending.current = false; if (live.current) setBusy(false); }
  }
  const k = snapshot?.kitchen;
  const bowl = k?.bowls.find(b => b.slot === selectedSlot);
  const guests = snapshot?.waitingCustomers ?? [];
  const guest = guests.find(c => c.id === bowl?.customerId);
  const menu = (gameState?.menu ?? []).filter(m => m.isAvailable).slice().sort((a, b) => a.id - b.id).filter((m, index, all) => all.findIndex(other => other.phoType === m.phoType) === index);
  const toppings = gameState?.toppings ?? [];
  const request = guest ? k?.requests[guest.id] : undefined;
  const serverNow = now + offset.current;
  const secondsLeft = (deadline: string) => Math.max(0, Math.ceil((Date.parse(deadline) - serverNow) / 1000));
  const cooked = bowl?.blanchStartedUtc ? Math.max(0, (serverNow - Date.parse(bowl.blanchStartedUtc)) / 1000) : 0;
  const stage: ShopPhase = bowl?.phase === 'blanching' ? 'blanching' : bowl?.phase === 'blanched' ? 'blanched' : bowl?.phase === 'ready' ? 'ready' : guest ? 'choosing' : 'idle';
  // Clock ticks and queue refreshes must not restart the actor's current route.
  const moment = useMemo<ShopMoment>(() => reaction
    ? { phase: reaction.phase, startedAt: reaction.startedAt }
    : { phase: stage, startedAt: stage === 'blanching' && bowl?.blanchStartedUtc ? Date.parse(bowl.blanchStartedUtc) : Date.now() },
  [reaction, stage, bowl?.slot, bowl?.customerId, bowl?.blanchStartedUtc]);
  const sceneGuest = reaction?.guest ?? guest ?? null;
  function editRecipe() { setDraftPho(bowl?.phoType ?? null); setDraftToppings(bowl?.toppings ?? []); setPanel('recipe'); }
  function toggleTopping(name: string) { setDraftToppings(current => current.includes(name) ? current.filter(t => t !== name) : current.length < 5 ? [...current, name] : current); }
  async function welcome(customer: Customer) {
    if (bowl || !snapshot?.journey.isOpen) { setPanel('guests'); return; }
    if (await act({ action: 'accept', customerId: customer.id })) { setDraftPho(null); setDraftToppings([]); setPanel('recipe'); }
  }
  async function serve() {
    if (!guest) return;
    if (await act({ action: 'serve' })) {
      const result = current.current?.kitchen.lastSale;
      setReaction({ guest, phase: result?.correct ? 'happy' : 'unhappy', startedAt: Date.now() }); setPanel(null);
    }
  }
  async function refreshAfterDay() {
    if (await journeyAct(snapshot?.journey.isOpen ? 'next-wave' : 'prepare', snapshot?.journey.isOpen ? {} : { mode: snapshot?.journey.mode ?? 'cozy', boon: snapshot?.journey.boon ?? 'tea' })) {
      if (!snapshot?.journey.isOpen) { await loadGame(); }
      accept(await readKitchen(session.current));
    }
  }
  if (!snapshot || !k) return <section className="shop-connection page-card"><h1>Đang nhóm bếp hai tô…</h1><p role={error ? 'alert' : 'status'}>{error || 'Chuẩn bị nồi nước dùng và chỗ đặt tô.'}</p><button type="button" onClick={() => void connect()}>Kết nối lại</button></section>;
  const phaseAction = !bowl ? 'Chọn khách' : bowl.phase === 'draft' ? bowl.confirmed ? 'Nhúng bánh' : 'Chọn nguyên liệu' : bowl.phase === 'blanching' ? 'Vớt bánh' : bowl.phase === 'blanched' ? 'Chan nước' : 'Phục vụ';
  const cookLow = snapshot.journey.mode === 'cozy' ? 2 : 3;
  const cookHigh = snapshot.journey.mode === 'cozy' ? 6 : 5;
  const canPour = k.heat >= (snapshot.journey.weather === 'rain' ? 75 : 65) && k.broth >= 1 && !k.refillAt;
  async function primary() {
    if (!bowl) { setPanel('guests'); return; }
    if (bowl.phase === 'draft' && !bowl.confirmed) { editRecipe(); return; }
    if (bowl.phase === 'ready') { await serve(); return; }
    await act({ action: bowl.phase === 'draft' ? 'blanch' : bowl.phase === 'blanching' ? 'lift' : 'pour' });
  }
  return <section className="shop-game kitchen-game" aria-label="Bếp phở hai tô">
    <header className="kitchen-toolbar">
      <button type="button" className="kitchen-pot-summary" onClick={() => setPanel(panel === 'pot' ? null : 'pot')} aria-label="Mở nồi nước dùng"><span>🔥 {Math.round(k.heat)}°C</span><span>🥣 {k.broth.toFixed(1)} phần · {k.noodles} bánh</span></button>
      <span className={`kitchen-rhythm rhythm-${snapshot.rhythm}`}>{RHYTHMS[snapshot.rhythm]} · Chuỗi {snapshot.journey.combo}</span>
      <nav aria-label="Thao tác bếp">{bowl && <button type="button" onClick={editRecipe}>Đơn</button>}<button type="button" onClick={() => setPanel(panel === 'guests' ? null : 'guests')}>Khách ({guests.length})</button><button type="button" onClick={() => setPanel(panel === 'book' ? null : 'book')}>Sổ quán</button></nav>
    </header>
    {error && <div className="kitchen-alert" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Đóng lỗi">×</button></div>}
    <div className="shop-stage">
      <ShopScene appearance={normalizeAppearance(character.appearance)} customers={guests} active={sceneGuest} moment={moment} order={null} toppings={bowl?.toppings ?? []} phoType={bowl?.phoType ?? undefined} canSelect={!busy} fire={k.fire} onSelect={c => void welcome(c)} onInspect={() => { if (bowl) editRecipe(); else setPanel('guests'); }} workBowls={k.bowls.map(b => ({ slot: b.slot, phoType: b.phoType ?? 0, toppings: b.toppings, broth: b.phase === 'ready' }))}>
        {() => !snapshot.journey.isOpen || guests.length === 0 && k.bowls.length === 0 ? <div className="kitchen-shift-card"><strong>{snapshot.journey.isOpen ? 'Nghỉ tay một nhịp' : 'Chuẩn bị mở quán'}</strong><p>{snapshot.journey.isOpen ? 'Châm nồi, chia bánh, rồi đón đợt khách tiếp.' : 'Chuẩn bị bếp rồi mở ngày mới trong nhật ký.'}</p>{snapshot.journey.isOpen && snapshot.journey.upcomingCustomers > 0 && <button type="button" disabled={journeyBusy} onClick={() => void refreshAfterDay()}>Đón đợt khách tiếp</button>}<Link to="/map/journal">{snapshot.journey.isOpen ? 'Nhật ký · tổng kết ca' : 'Nhật ký · mở cửa'}</Link></div> : null}
      </ShopScene>
      {panel && <aside className="shop-side-panel kitchen-panel" aria-label="Bảng thao tác bếp">
        <header><h2>{panel === 'guests' ? 'Khách đang chờ' : panel === 'recipe' ? `Soạn tô ${selectedSlot}` : panel === 'pot' ? 'Nồi nước dùng' : panel === 'book' ? 'Sổ quán' : 'Tô vừa phục vụ'}</h2><button type="button" onClick={() => setPanel(null)} aria-label="Đóng bảng">×</button></header>
        {panel === 'guests' && <>
          <p className="kitchen-help">Chọn tô trống ở dưới, rồi nhận khách. Hai đồng hồ chạy riêng.</p>
          {guests.map(c => { const assigned = k.bowls.find(b => b.customerId === c.id); const r = k.regulars[c.personaKey || c.name]; return <button className="kitchen-guest" type="button" key={c.id} disabled={busy || Boolean(bowl) && !assigned} onClick={() => { if (assigned) { setSelectedSlot(assigned.slot); setPanel(null); } else void welcome(c); }}><CustomerSprite customer={c} portrait /><span><strong>{c.name}</strong><small>{assigned ? `Đang làm ở tô ${assigned.slot}` : `${Math.ceil(c.secondsRemaining ?? c.patience)}s kiên nhẫn`}</small>{r?.goodOrders > 0 && <small>♥ Khách quen · {r.goodOrders} tô đúng</small>}<em>{c.dialogue}</em></span></button>; })}
          {!guests.length && <p>Chưa có khách chờ. Chuẩn bị bếp hoặc đón đợt tiếp.</p>}
        </>}
        {panel === 'recipe' && bowl && guest && <>
          <div className="kitchen-ticket"><strong>{guest.name} · còn {secondsLeft(bowl.deadlineUtc)}s</strong><p>{request?.kind === 'chef' ? request.text : `${menu.find(m => m.phoType === guest.preferredPhoType)?.name ?? 'Phở theo đơn'} · ${guest.requiredToppings || 'Không topping'}`}</p></div>
          {request && request.kind !== 'chef' && <div className="kitchen-request"><p>{request.text}</p>{request.decision ? <small>{request.decision === 'accept' ? 'Đã nhận lời giúp khách' : 'Phục vụ theo đơn thường'}</small> : <div><button type="button" disabled={busy} onClick={() => void act({ action: 'request', value: 'accept' })}>Nhận lời</button><button type="button" disabled={busy} onClick={() => void act({ action: 'request', value: 'decline' })}>Hẹn dịp khác</button></div>}</div>}
          <div className="kitchen-choice-grid" role="group" aria-label="Chọn loại phở">{menu.map(m => <button type="button" key={m.phoType} aria-pressed={draftPho === m.phoType} disabled={bowl.phase !== 'draft'} onClick={() => setDraftPho(m.phoType)}><FoodIcon type={m.phoType} />{m.name}</button>)}</div>
          <div className="kitchen-topping-grid" role="group" aria-label="Chọn topping">{toppings.map(t => <button type="button" key={t.id} aria-pressed={draftToppings.includes(t.name)} disabled={bowl.phase !== 'draft' || draftToppings.length >= 5 && !draftToppings.includes(t.name)} onClick={() => toggleTopping(t.name)}>{draftToppings.includes(t.name) ? '✓ ' : '+ '}{t.name}</button>)}</div>
          {request?.kind === 'chef' && Object.values(k.signatures).filter(s => s.likes >= 3).map(s => <button type="button" key={s.key} disabled={bowl.phase !== 'draft'} onClick={() => { setDraftPho(s.phoType); setDraftToppings(s.toppings); }}>Dùng món tủ: {s.name}</button>)}
          <footer><small>{draftToppings.length}/5 topping · Tự chọn theo lời khách</small><button type="button" disabled={busy || draftPho === null || bowl.phase !== 'draft'} onClick={async () => { if (await act({ action: 'recipe', phoType: draftPho ?? undefined, toppings: draftToppings })) setPanel(null); }}>Xác nhận tô phở</button></footer>
        </>}
        {panel === 'pot' && <>
          <div className="kitchen-pot-gauge"><strong>{Math.round(k.heat)}°C</strong><meter min={20} max={100} value={k.heat} low={65} high={95} optimum={82} /><p>Từ {snapshot.journey.weather === 'rain' ? 75 : 65}°C mới chan được. Lửa lớn nóng nhanh nhưng hao nước; châm nồi làm nhiệt giảm.</p></div>
          <div className="kitchen-fire" role="group" aria-label="Chỉnh lửa">{Object.entries(FIRE).map(([value, label]) => <button key={value} type="button" disabled={busy} aria-pressed={k.fire === value} onClick={() => void act({ action: 'fire', value })}>Lửa {label}</button>)}</div>
          <p>Nước dùng: {k.broth.toFixed(1)}/{k.largePot ? 10 : 6} phần · Bánh đã chia: {k.noodles}</p>
          <button type="button" disabled={busy || Boolean(k.refillAt) || k.broth >= (k.largePot ? 10 : 6) - .1} onClick={() => void act({ action: 'refill' })}>{k.refillAt ? `Đang châm · ${secondsLeft(k.refillAt)}s` : 'Châm nồi · 4s · 5.000đ'}</button>
          <button type="button" disabled={busy || Boolean(k.prepAt) || k.noodles >= (k.prepRack ? 12 : 8)} onClick={() => void act({ action: 'prep' })}>{k.prepAt ? `Đang chia bánh · ${secondsLeft(k.prepAt)}s` : `Chia ${k.prepRack ? 6 : 4} phần bánh · 3s · 2.000đ`}</button>
          <p className="kitchen-help">Trong lúc châm nồi hoặc chia bánh, bạn vẫn soạn và nhúng tô còn lại được.</p>
        </>}
        {panel === 'book' && <>
          <details open><summary>Chuyện của quán</summary><p>Ngày {snapshot.player.currentDay} · {snapshot.player.money.toLocaleString('vi-VN')}đ · {snapshot.player.reputation} uy tín</p><p>{k.notice}</p>{snapshot.journey.pendingEvents.length > 0 && <Link to="/map/journal">Có {snapshot.journey.pendingEvents.length} chuyện mới trong nhật ký · hoàn tất các tô trước khi rời bếp</Link>}<p>{snapshot.journey.weather === 'rain' ? 'Ngày mưa: nồi cần từ 75°C; chan ở 85°C được thêm 1.000đ khi đúng món.' : 'Trời dịu: giữ lửa vừa, dành nước dùng cho đợt đông.'}</p><p>3 tô đúng liên tiếp: +3.000đ. Đạt chuỗi 5: có khách được giới thiệu ở ngày sau.</p><p>Nhúng bánh {cookLow}–{cookHigh}s, phục vụ trong {k.insulated ? 35 : 20}s sau khi chan: +3.000đ nếu đúng món.</p></details>
          <details><summary>Khách quen · những lần giúp nhau</summary>{Object.entries(k.regulars).filter(([, r]) => r.visits > 0).map(([key, r]) => <article key={key}><strong>{r.name}</strong><p>{r.goodOrders} tô đúng · {r.helped} lần được giúp</p><p>{r.memory || 'Tô phở đúng món khiến khách muốn quay lại.'}</p>{r.favoritePho !== null && <small>Món lần trước: {menu.find(m => m.phoType === r.favoritePho)?.name} · {r.favoriteToppings || 'Không topping'}</small>}</article>)}</details>
          <details><summary>Món tủ của bạn</summary><p>Khách nhờ chủ quán chọn món sẽ đánh giá tô sáng tạo. Đạt 3 lượt thích để đặt tên và đưa vào món tủ.</p>{Object.values(k.signatures).map(s => <article key={s.key}><strong>{s.name} · ♥ {s.likes}/3</strong><p>{menu.find(m => m.phoType === s.phoType)?.name} · {s.toppings.join(', ') || 'Không topping'}</p>{s.likes >= 3 && <form onSubmit={async event => { event.preventDefault(); if (await act({ action: 'name', value: s.key, toppings: [signatureName] })) setSignatureName(''); }}><input aria-label={`Tên cho ${s.name}`} value={signatureName} maxLength={30} onChange={e => setSignatureName(e.target.value)} placeholder="Tên món tủ" required /><button type="submit" disabled={busy || !signatureName.trim()}>Đặt tên</button></form>}</article>)}</details>
          <details><summary>Nâng cấp cách chơi</summary>{[{ key: 'rack', owned: k.prepRack, label: 'Khay soạn rộng', detail: 'Chia 6 phần/lượt, trữ 12 phần bánh', cost: 30000 }, { key: 'pot', owned: k.largePot, label: 'Nồi lớn', detail: 'Châm được 10 phần thay vì 6', cost: 45000 }, { key: 'insulation', owned: k.insulated, label: 'Đế giữ nóng', detail: 'Tô giữ độ ngon 35s thay vì 20s', cost: 60000 }].map(u => <article key={u.key}><strong>{u.label}</strong><p>{u.detail}</p><button type="button" disabled={busy || u.owned || snapshot.player.money < u.cost} onClick={() => void act({ action: 'upgrade', value: u.key })}>{u.owned ? 'Đã trang bị' : `${u.cost.toLocaleString('vi-VN')}đ`}</button></article>)}</details>
        </>}
        {panel === 'result' && k.lastSale && <><h3>{k.lastSale.correct ? 'Khách ăn ngon rồi!' : 'Một tô chưa trọn vẹn'}</h3><p>{k.lastSale.message}</p><strong>+{k.lastSale.money.toLocaleString('vi-VN')}đ</strong>{k.lastSale.canRedo && <button type="button" disabled={busy} onClick={() => void act({ action: 'redo' })}>Xin làm lại · 3.000đ</button>}{snapshot.randomEvents.filter(e => e.title === 'Tô phở gây sóng gió').map(e => <div key={e.id}><p>{e.description}</p>{e.options.map(o => <button key={o.id} type="button" disabled={busy} onClick={async () => { try { await resolveGameEvent(e.id, o.id); accept(await readKitchen(session.current)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa xử lý được câu chuyện.'); } }}>{o.text}</button>)}</div>)}</>}
      </aside>}
    </div>
    <footer className="kitchen-console">
      <div className="kitchen-bowl-tabs" role="group" aria-label="Hai chỗ đặt tô">{[1, 2].map(slot => { const b = k.bowls.find(v => v.slot === slot); const c = guests.find(g => g.id === b?.customerId); return <button type="button" key={slot} aria-pressed={selectedSlot === slot} onClick={() => { setSelectedSlot(slot); setPanel(null); }}><strong>Tô {slot}{b ? ` · ${c?.name ?? 'Khách'}` : ' · Trống'}</strong><small>{b ? `${PHASES[b.phase]} · ${secondsLeft(b.deadlineUtc)}s` : 'Bấm chọn, rồi nhận khách'}</small></button>; })}</div>
      <div className="kitchen-main-action">
        {bowl?.phase === 'blanching' && <div className="kitchen-timing" aria-label="Canh bánh phở"><span>{cooked.toFixed(1)}s · ngon nhất {cookLow}–{cookHigh}s</span><div><i style={{ left: `${cookLow / 10 * 100}%`, width: `${(cookHigh - cookLow) / 10 * 100}%` }} /><b style={{ left: `${Math.min(99, cooked / 10 * 100)}%` }} /></div></div>}
        {bowl?.phase === 'draft' && bowl.confirmed && <button type="button" className="kitchen-edit" onClick={editRecipe}>Sửa tô</button>}
        <button type="button" className="kitchen-primary" disabled={busy || bowl?.phase === 'blanching' && cooked < 1 || bowl?.phase === 'blanched' && !canPour} onClick={() => void primary()}>{busy ? 'Đang làm…' : phaseAction}</button>
        {bowl?.phase === 'blanched' && !canPour && <button type="button" onClick={() => setPanel('pot')}>Kiểm tra nồi</button>}
      </div>
      {k.lastSale && <button type="button" className="kitchen-result-pill" onClick={() => setPanel(panel === 'result' ? null : 'result')}>{k.lastSale.correct ? '✓' : '↻'} {k.lastSale.customerName} · +{k.lastSale.money.toLocaleString('vi-VN')}đ</button>}
    </footer>
  </section>;
}
