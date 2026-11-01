import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CustomerSprite } from '../components/CustomerSprite';
import { Link } from 'react-router-dom';
import { FoodIcon, PhoBowl } from '../components/ShopArt';
import { useGameStore } from '../context/GameContext';
import { useJourneyPause } from '../context/JourneyContext';
import { SHIFT_DISHES, SHIFT_LENGTH, SHIFT_TOPPINGS, SHOP_BUYS, type CounterSnapshot, type ShiftGuest } from '../game/shift';
import apiClient from '../services/apiClient';
import { playKitchenSound, playUiSound } from '../services/audioService';
import '../styles/counter.css';

const cash = (value: number) => value.toLocaleString('vi-VN') + 'đ';
const seconds = (value: number) => Math.max(0, Math.ceil(value / 1000));
const clock = (value: number) => `${Math.floor(seconds(value) / 60)}:${String(seconds(value) % 60).padStart(2, '0')}`;

export function CounterShop() {
  const { loadGame, soundEnabled } = useGameStore();
  useJourneyPause(true);
  const [snapshot, setSnapshot] = useState<CounterSnapshot | null>(null);
  const [slot, setSlot] = useState(1);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState<number | null>(null);
  const [receiptId, setReceiptId] = useState(0);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const session = useRef(crypto.randomUUID());
  const live = useRef(false), pending = useRef(false), generation = useRef(0);
  const hold = useRef<{ at: number; slot: number } | null>(null);
  const current = useRef(snapshot); current.current = snapshot;
  const offset = useRef(0);
  const request = async (action: string, body: Record<string, unknown> = {}) => (await apiClient.post<CounterSnapshot>('/counter/' + action, { session: session.current, ...body })).data;
  function receive(data: CounterSnapshot) {
    if (!live.current) return;
    if ((current.current?.revision ?? 0) > data.revision) return;
    current.current = data; offset.current = data.now - Date.now(); setSnapshot(data);
  }
  async function act(action: string, fields: Record<string, unknown> = {}) {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError('');
    try {
      const before = current.current?.progress.current?.receipt?.id;
      const wasGolden = current.current?.progress.current?.goldenTriggered;
      const data = await request(action, { slot, ...fields }); receive(data);
      if (soundEnabled) {
        if (action === 'blanch' || action === 'lift' || action === 'pour') playKitchenSound(action);
        else if (!wasGolden && data.progress.current?.goldenTriggered) playKitchenSound('golden');
        else if (data.progress.current?.receipt && before !== data.progress.current.receipt.id) {
          if (data.progress.current.receipt.perfect) playKitchenSound('perfect');
          else playUiSound(data.progress.current.receipt.correct ? 'success' : 'warning');
        }
      }
      if (action === 'serve' || action === 'buy' || action === 'finish') void loadGame();
      return true;
    } catch (cause) { if (live.current) setError(cause instanceof Error ? cause.message : 'Chưa lưu được thao tác. Thử lại nhé.'); return false; }
    finally { pending.current = false; if (live.current) setBusy(false); }
  }
  useEffect(() => {
    const id = ++generation.current; live.current = true;
    const leave = () => { void request('leave').catch(() => {}); };
    void request('open').then(data => { receive(data); if (!live.current && generation.current === id) leave(); }).catch(cause => { if (live.current) setError(cause.message); });
    let reading = false;
    const timer = window.setInterval(() => {
      if (!current.current || reading || pending.current) return;
      reading = true;
      void request('state').then(receive).catch(cause => { if (live.current) setError(cause.message); }).finally(() => { reading = false; });
    }, 500);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 80);
    window.addEventListener('pagehide', leave);
    return () => {
      live.current = false; window.clearInterval(timer); window.clearInterval(clockTimer); window.removeEventListener('pagehide', leave);
      queueMicrotask(() => { if (generation.current === id) leave(); });
    };
  }, []);
  const p = snapshot?.progress, shift = p?.current;
  const running = Boolean(shift && shift.ended === null);
  const serverNow = now + offset.current;
  const bowl = shift?.bowls.find(b => b.slot === slot);
  const guest = shift?.guests.find(c => c.id === bowl?.guestId);
  const guests = shift?.guests.filter(c => c.status === 'waiting') ?? [];
  const cooking = bowl?.phase === 'cooking' ? Math.max(0, (serverNow - bowl.cookAt) / 1000) : bowl?.cooked ?? 0;
  const golden = running && (shift?.goldenUntil ?? 0) > serverNow;
  const nextBuy = SHOP_BUYS.find(buy => !p?.upgrades.includes(buy.id));
  const receipt = shift?.receipt;
  useEffect(() => {
    if (!receipt) return;
    setReceiptId(receipt.id);
    const timer = window.setTimeout(() => setReceiptId(0), 3300);
    return () => window.clearTimeout(timer);
  }, [receipt?.id]);
  useEffect(() => { hold.current = null; setHolding(null); }, [slot, running]);
  function startPour() { if (busy || bowl?.phase !== 'lifted' || bowl.pho === null || hold.current) return; hold.current = { at: Date.now(), slot }; setHolding(Date.now()); }
  function stopPour(cancel = false) {
    const active = hold.current; hold.current = null; setHolding(null);
    if (!active || cancel) return;
    const duration = Math.min(4000, Date.now() - active.at);
    if (duration < 500) { setError('Giữ vá ít nhất nửa giây. Canh vạch xanh để nước vừa đẹp.'); return; }
    void act('pour', { duration, slot: active.slot });
  }
  const actRef = useRef(act); actRef.current = act;
  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => setDrag({ x: event.clientX, y: event.clientY });
    const up = (event: PointerEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-guest]');
      setDrag(null);
      if (target) void actRef.current('serve', { guestId: Number(target.dataset.guest) });
    };
    const cancel = () => setDrag(null);
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
  }, [Boolean(drag)]);
  async function chooseGuest(c: ShiftGuest) {
    if (bowl?.phase === 'ready') { await act('serve', { guestId: c.id }); return; }
    const existing = shift?.bowls.find(b => b.guestId === c.id);
    if (existing) { setSlot(existing.slot); return; }
    const free = [slot, slot === 1 ? 2 : 1].find(n => !shift?.bowls.some(b => b.slot === n));
    if (!free) { setError('Hai tô đều đang làm. Vớt bánh hoặc giao một tô trước nhé.'); return; }
    setSlot(free); await act('take', { guestId: c.id, slot: free });
  }
  function beginDrag(event: ReactPointerEvent) { if (bowl?.phase !== 'ready' || busy) return; event.preventDefault(); setDrag({ x: event.clientX, y: event.clientY }); }
  const idealMin = p?.upgrades.includes('stove') ? 2 : 2.5, idealMax = p?.upgrades.includes('stove') ? 6 : 5;
  const ideal = cooking >= idealMin && cooking <= idealMax;
  const pourTime = holding ? Math.min(4000, now - holding) : 0;

  return <section className={`counter-game${running ? ' is-running' : ''}${golden ? ' is-golden' : ''}${p?.upgrades.includes('cart') ? ' has-cart' : ''}${p?.upgrades.includes('awning') ? ' has-awning' : ''}`} aria-label="Ca bán phở ba phút">
    <header className="counter-heading"><div><span className="counter-eyebrow">XÓM NHÀ LÁ · BẾP NHỎ, MƠ LỚN</span><h1>{running ? 'Giữ nhịp. Giữ khách.' : shift ? 'Nồi nghỉ, quán lớn lên.' : 'Một tô ngon. Một người nhớ.'}</h1></div><div className="counter-wallet"><small>TIỀN DÀNH SẮM QUÁN</small><strong>{cash(p?.balance ?? 0)}</strong></div></header>
    {error && <div className="counter-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Đóng thông báo">×</button></div>}
    {!snapshot ? <div className="counter-loading"><p>Đang nhóm bếp…</p>{error && <button onClick={() => { void request('open').then(receive).catch(cause => setError(cause.message)); }}>Thử mở lại</button>}</div> : !running ? <>
      <section className="counter-lobby">
        <div className="counter-hero-bowl"><svg viewBox="-65 -65 130 115" aria-hidden="true"><PhoBowl phoType={0} toppings={['Hành lá', 'Ớt tươi']} /></svg><span className="counter-stamp">NÓNG HỔI<br />VỪA LÊN!</span></div>
        <div className="counter-lobby-copy"><span className="counter-eyebrow">{shift ? `TỔNG KẾT CA ${shift.number}` : 'CA ĐẦU TIÊN · BẠN LÀ CHỦ BẾP'}</span><h2>{shift ? shift.perfects >= 4 ? 'Quán nhỏ mà có võ!' : 'Thêm một ca, thêm khéo tay.' : 'Sáu vị khách đang chờ tài nấu của bạn.'}</h2>
          {shift ? <div className="counter-report"><div><strong>{cash(shift.earned)}</strong><small>tiền bán & tip</small></div><div><strong>{shift.perfects}/6</strong><small>tô tuyệt đỉnh</small></div><div><strong>{shift.bestCombo}</strong><small>chuỗi cao nhất</small></div><div><strong>{Object.keys(p!.regulars).length}</strong><small>khách nhớ quán</small></div></div> : <p>Ba phút, hai chỗ đặt tô. Chạm khách nhận đơn, tự tay nhúng bánh, chọn thịt rồi giữ vá chan nước. Làm đúng năm tô liên tiếp để mở Giờ vàng.</p>}
          <button className="counter-primary" disabled={busy} onClick={() => { setSlot(1); setConfirmEnd(false); void act('start'); }}>{busy ? 'Đang mở cửa…' : shift ? 'Chơi ca nữa →' : 'Mở cửa · bắt đầu ca 3 phút →'}</button>
          <Link className="counter-cards-link" to="/map/cards">✦ Nghỉ tay · chơi bài cùng xóm →</Link>
          <p className="counter-next-story">{shift ? 'Ca tới: một khách nhớ món cũ sẽ quay lại. Bạn còn nhớ gu của họ chứ?' : 'Mẹo đầu bếp: vớt bánh khi vạch chuyển xanh. Topping chọn nhầm? Chạm lại để gắp ra.'}</p>
        </div>
      </section>
      <section className="counter-upgrades" aria-label="Sắm đồ cho quán"><div className="counter-section-title"><h2>Tiền mình kiếm. Quán mình xây.</h2><span>Đồ mua xuất hiện ngay trong bếp</span></div><div className="counter-buy-grid">{SHOP_BUYS.map(buy => { const owned = p!.upgrades.includes(buy.id); return <article key={buy.id} className={owned ? 'is-owned' : ''}><span className="counter-buy-art" aria-hidden="true">{buy.icon}</span><div><h3>{buy.name}</h3><p>{buy.detail}</p></div><button disabled={busy || owned || p!.balance < buy.cost || snapshot.money < buy.cost} onClick={() => void act('buy', { upgrade: buy.id })}>{owned ? '✓ Đã có trong quán' : p!.balance < buy.cost ? `Còn ${cash(buy.cost - p!.balance)}` : `Sắm ngay · ${cash(buy.cost)}`}</button></article>; })}</div></section>
    </> : <>
      <div className="counter-scorebar"><div className={`counter-time${seconds(SHIFT_LENGTH - (serverNow - shift!.started)) < 30 ? ' is-urgent' : ''}`}><small>CA {shift!.number}</small><strong>{clock(SHIFT_LENGTH - (serverNow - shift!.started))}</strong></div><div className="counter-chain"><strong>{golden ? `GIỜ VÀNG · ${seconds(shift!.goldenUntil - serverNow)}s` : `CHUỖI ${shift!.combo}`}</strong><div className="counter-chain-dots" aria-label={`${Math.min(5, shift!.combo)} trên 5 tô để mở Giờ vàng`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={shift!.combo >= i ? 'is-lit' : ''} />)}</div><small>{golden ? '+6.000đ mỗi tô đúng · tranh thủ nào!' : shift!.goldenTriggered ? 'Giữ món ngon, khách còn nhớ!' : '5 tô đúng liên tiếp → 20 giây tip lớn'}</small></div><div className="counter-earned"><small>ĐÃ BÁN {shift!.served}/6</small><strong>+{cash(shift!.earned)}</strong></div></div>
      <section className="counter-room" aria-label="Bàn bếp trực tiếp">
        {receipt?.perfect && receiptId === receipt.id && <div key={receipt.id} className="counter-photo-flash" aria-hidden="true"><span>✦ ĐÚNG GU!</span><strong>+{cash(receipt.money)}</strong><small>Khách đã lưu hương vị này ♥</small></div>}
        <div className="counter-canopy"><span>XÓM NHÀ LÁ</span><small>{p!.upgrades.includes('awning') ? 'MÁI HIÊN MỚI · MƯA CŨNG ẤM' : 'NƯỚC DÙNG THƠM · KHÁCH GHÉ LÀ NHỚ'}</small></div>
        <div className="counter-customers" aria-label="Khách đang chờ">{guests.map(c => { const assigned = shift!.bowls.find(b => b.guestId === c.id); return <button key={c.id} data-guest={c.id} className={`counter-customer${c.id === guest?.id ? ' is-selected' : ''}${bowl?.phase === 'ready' ? ' can-deliver' : ''}`} disabled={busy} onClick={() => void chooseGuest(c)}><span className="counter-order"><b>{SHIFT_DISHES[c.pho]}</b><span>{c.toppings.join(' · ')}</span>{c.familiar > 0 && <em>♥ Như mọi bữa · ghé lần {c.familiar + 1}</em>}{c.special && <em>⚡ Đơn cuối ca · thưởng thêm</em>}</span><CustomerSprite customer={c} emotion={golden ? 'happy' : 'neutral'} pose="order" /><strong className="counter-guest-name">{c.name}</strong><span className="counter-patience"><i style={{ width: `${Math.max(0, Math.min(100, (c.deadline - serverNow) / 800))}%` }} /></span><small>{assigned ? `Tô ${assigned.slot} · ${seconds(c.deadline - serverNow)}s` : 'Chạm để nhận đơn'}</small></button>; })}{guests.length === 0 && <div className="counter-quiet"><strong>Hít hà… thơm cả hẻm!</strong><p>Khách tiếp theo sắp ghé. Hai chỗ đặt tô đã sẵn sàng.</p></div>}</div>
        <div className="counter-worktop">
          <div className="counter-slot-tabs" role="group" aria-label="Hai chỗ làm tô">{[1, 2].map(n => { const b = shift!.bowls.find(b => b.slot === n); return <button key={n} aria-pressed={n === slot} onClick={() => setSlot(n)}><span>TÔ {n}</span><strong>{!b ? 'Trống · nhận khách' : b.phase === 'cooking' ? '♨ Đang nhúng!' : b.phase === 'ready' ? '✓ Giao ngay' : b.phase === 'lifted' ? 'Chờ chan nước' : 'Đang xếp thịt'}</strong>{b && <small>{seconds(b.deadline - serverNow)}s</small>}</button>; })}</div>
          <div className="counter-bench">
            <div className={`counter-pot${p!.upgrades.includes('stove') ? ' is-copper' : ''}${bowl?.phase === 'cooking' ? ' is-boiling' : ''}`}><div className="counter-pot-steam" aria-hidden="true">〰 〰 〰</div><div className="counter-pot-body"><span>{bowl?.phase === 'cooking' ? '♨' : '≈'}</span></div><small>{p!.upgrades.includes('stove') ? 'BẾP ĐỒNG' : 'NỒI NƯỚC DÙNG'}</small></div>
            <div className="counter-bowl-zone"><span className="counter-bowl-label">{guest ? `TÔ CỦA ${guest.name.toUpperCase()}` : 'CHẠM MỘT KHÁCH ĐỂ BẮT ĐẦU'}</span><div className={`counter-bowl${bowl?.phase === 'ready' ? ' is-ready' : ''}`} onPointerDown={beginDrag} style={{ touchAction: bowl?.phase === 'ready' ? 'none' : 'auto' }}><svg viewBox="-65 -60 130 105" aria-hidden="true"><PhoBowl phoType={bowl?.pho ?? 0} toppings={bowl?.toppings ?? []} broth={bowl?.phase === 'ready'} />{bowl?.pho === null && <ellipse cx="0" cy="-3" rx="35" ry="12" fill="#f4e7cb" />}</svg>{!bowl && <span className="counter-empty-bowl">+ NHẬN ĐƠN</span>}</div><small>{bowl?.phase === 'ready' ? 'Kéo tô tới khách hoặc chạm ghế để giao' : bowl ? `${bowl.pho === null ? 'Chưa chọn thịt' : SHIFT_DISHES[bowl.pho]} · ${bowl.toppings.join(', ') || 'chưa topping'}` : 'Hai tô có thể làm song song'}</small></div>
          </div>
          <div className="counter-cook-actions">{!bowl ? <p>① Chọn khách phía trên → ② Nhúng bánh, chọn thịt → ③ Chan và giao</p> : <>
            <div className={`counter-cook-meter${ideal ? ' is-ideal' : ''}`}><span>{bowl.phase === 'draft' ? 'Nhúng trước, xếp thịt trong lúc chờ' : bowl.phase === 'cooking' ? `${cooking.toFixed(1)}s · ${ideal ? 'VỚT NGAY! Vừa chín' : cooking > idealMax ? 'Bánh mềm rồi! Vớt để thay' : 'Chờ vạch xanh…'}` : bowl.phase === 'ready' ? `Giao nóng trong ${seconds(15000 - (serverNow - bowl.readyAt))}s để có tip` : `Bánh ${ideal ? 'vừa chín ✓' : cooking < idealMin ? 'hơi dai' : 'hơi mềm'}`}</span><div><i className="counter-ideal-zone" style={{ left: `${idealMin / 8 * 100}%`, width: `${(idealMax - idealMin) / 8 * 100}%` }} /><b style={{ left: `${Math.min(98, cooking / 8 * 100)}%` }} /></div></div>
            <div className="counter-action-buttons"><button disabled={busy || bowl.phase !== 'draft'} onClick={() => void act('blanch')}>♨ Nhúng bánh</button><button className={bowl.phase === 'cooking' && ideal ? 'is-go' : ''} disabled={busy || bowl.phase !== 'cooking' || cooking < .7} onClick={() => void act('lift')}>↥ Vớt bánh</button><button className={`counter-pour${holding ? ' is-pouring' : ''}`} disabled={busy || bowl.phase !== 'lifted' || bowl.pho === null} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startPour(); }} onPointerUp={() => stopPour()} onPointerCancel={() => stopPour(true)} onLostPointerCapture={() => stopPour(true)} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) startPour(); } }} onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); stopPour(); } }} onBlur={() => stopPour(true)}><span>{holding ? (pourTime / 1000).toFixed(1) + 's · Thả để chan' : 'Giữ vá · chan nước'}</span><i style={{ width: `${Math.min(100, pourTime / 3000 * 100)}%` }} /></button></div>
            {(bowl.phase === 'lifted' || bowl.phase === 'ready') && <div className="counter-rescue"><button disabled={busy} onClick={() => void act('replace')}>Thay bánh · cứu tô này</button><small>{bowl.phase === 'lifted' ? 'Giữ vá 1–2,2 giây. Topping nhầm? Chạm lại để gắp ra.' : 'Chạm đúng khách phía trên để giao tô.'}</small></div>}
          </>}</div>
          <div className="counter-ingredients" aria-label="Khay nguyên liệu"><div className="counter-meats">{SHIFT_DISHES.map((dish, pho) => <button key={pho} disabled={busy || !bowl || bowl.phase === 'ready'} aria-pressed={bowl?.pho === pho} onClick={() => void act('meat', { pho })}><FoodIcon type={pho} /><span>{dish.replace('Phở ', '')}</span></button>)}</div><div className="counter-toppings">{SHIFT_TOPPINGS.map(name => <button key={name} disabled={busy || !bowl} aria-pressed={Boolean(bowl?.toppings.includes(name))} onClick={() => void act('topping', { name })}><FoodIcon name={name} /><span>{name}</span><b>{bowl?.toppings.includes(name) ? '✓' : '+'}</b></button>)}</div></div>
        </div>
      </section>
      <footer className="counter-footer"><div>{nextBuy ? <><strong>{nextBuy.name}</strong><span>{p!.balance >= nextBuy.cost ? 'Đủ tiền rồi! Kết ca là sắm được.' : `Còn ${cash(nextBuy.cost - p!.balance)} là sắm được`}</span><progress max={nextBuy.cost} value={p!.balance} /></> : <strong>Quán đã có đủ bộ đồ nghề. Giờ chinh phục 6 tô tuyệt đỉnh!</strong>}</div><button onClick={() => setShowBook(!showBook)} aria-expanded={showBook}>♥ Sổ khách</button><button onClick={() => setConfirmEnd(!confirmEnd)}>Kết ca</button></footer>
      {confirmEnd && <div className="counter-end-confirm" role="group" aria-label="Kết ca sớm"><span>Khách chưa phục vụ sẽ rời quán. Kết ca sớm?</span><button disabled={busy} onClick={() => { void act('finish'); setConfirmEnd(false); }}>Kết ca và xem tiền</button><button onClick={() => setConfirmEnd(false)}>Bán tiếp</button></div>}
    </>}
    {showBook && <section className="counter-regular-book"><div className="counter-section-title"><h2>Người nhớ hương phở</h2><button onClick={() => setShowBook(false)}>Đóng sổ</button></div>{Object.entries(p?.regulars ?? {}).length === 0 ? <p>Phục vụ đúng món, khách sẽ nhớ và quay lại gọi như mọi bữa.</p> : Object.entries(p!.regulars).map(([key, r]) => <p key={key}><strong>{shift?.guests.find(c => c.personaKey === key)?.name ?? r.name ?? key}</strong> · {r.visits} tô đúng gu<br /><span>{SHIFT_DISHES[r.pho]} · {r.toppings.join(', ')}</span></p>)}</section>}
    {running && receipt && receiptId === receipt.id && <aside key={receipt.id} className={`counter-receipt${receipt.perfect ? ' is-perfect' : ''}${!receipt.correct ? ' is-miss' : ''}`} role="status"><strong>{receipt.perfect ? '✦ ' : ''}{receipt.title}</strong><span>{receipt.guest}</span>{receipt.money > 0 && <b>+{cash(receipt.money)}</b>}<p>{receipt.detail}</p><div>{receipt.tips.map(t => <span key={t.label}>{t.label} +{cash(t.amount)}</span>)}</div><button aria-label="Đóng phản hồi khách" onClick={() => setReceiptId(0)}>×</button></aside>}
    {drag && <div className="counter-drag-bowl" style={{ left: drag.x, top: drag.y }}><FoodIcon type={bowl?.pho ?? 0} /></div>}
  </section>;
}
