import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../context/GameContext';
import { useJourney, useJourneyPause } from '../context/JourneyContext';
import { BOONS, formatClock, PATH_LABEL } from '../game/journey';
import { NEIGHBORS } from '../game/npcs';
import { CUSTOMER_CAST } from '../game/customerCast';
import { CharacterSprite } from '../components/CharacterSprite';
import { CustomerSprite } from '../components/CustomerSprite';
import { NeighborSprite } from '../components/NeighborSprite';
import { VillageIllustration } from '../components/VillageIllustration';
import { WorldAtmosphere } from '../components/WorldAtmosphere';
import { FoodIcon } from '../components/ShopArt';
import { resolveGameEvent } from '../services/gameService';

export function JourneyPage() {
  const { gameState, loadGame, startDay, isLoading, character } = useGameStore();
  const { journey, act, busy, error } = useJourney();
  const [tab, setTab] = useState<'today' | 'memories' | 'endings' | 'cast'>('today');
  const [result, setResult] = useState('');
  const [resolving, setResolving] = useState(false);
  const [failure, setFailure] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  useJourneyPause(true);
  const story = gameState?.randomEvents[0];
  const speaker = NEIGHBORS.find(n => n.id === story?.actor) ?? NEIGHBORS[1];
  async function choose(option: number) {
    if (!story || resolving) return;
    setResolving(true); setFailure('');
    try { const response = await resolveGameEvent(story.id, option); setResult(response.resultText); await loadGame(); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Chưa gửi được lựa chọn. Thử lại nhé.'); }
    finally { setResolving(false); }
  }
  if (!journey) return <section className="village-page"><VillageIllustration kind="journal" title="Nhật ký hẻm 28" /><p>Đang mở sổ hành trình…</p><button onClick={() => void loadGame()}>Cập nhật nhật ký</button></section>;
  const ending = journey.endings.find(e => e.id === journey.ending);
  const hasCustomers = Boolean(gameState?.waitingCustomers.length || journey.upcomingCustomers);
  return <section className="village-page journey-page" aria-label="Nhật ký bảy ngày trong xóm">
    <VillageIllustration kind="journal" title="Chuyện xóm mình" subtitle={`MÙA ${journey.season} · NGÀY ${journey.chapter}/7 · ${formatClock(journey.minute)}`} />
    <nav className="journal-tabs" aria-label="Các trang nhật ký">{([['today', 'Hôm nay'], ['memories', 'Kỷ niệm'], ['endings', 'Kết thúc'], ['cast', 'Khách quen']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}{id === 'today' && story ? <b className="new-story-dot" /> : null}</button>)}</nav>
    {(error || failure) && <p className="journey-error" role="alert">{failure || error}</p>}
    {tab === 'today' && <>
      <div className="journey-day-title"><div><small>CHƯƠNG {journey.chapter} · BẢY NGÀY ĐẦU HẺM</small><h1>{journey.theme.title}</h1><p>{journey.theme.hint}</p></div><div className="day-goal-stamp"><strong>{Math.min(journey.goalProgress, journey.theme.target)}/{journey.theme.target}</strong><span>{journey.theme.goal}</span></div></div>
      {result && <div className="story-resolution" role="status"><b>Chuyện đã êm!</b><p>{result}</p><button type="button" onClick={() => setResult('')}>Gấp mẩu chuyện lại</button></div>}
      {story && !result && <article className="story-stage" key={story.id}>
        <div className="story-cast-stage"><div className="story-string-lights" /><NeighborSprite className="story-speaker" npcId={speaker.id} emotion={resolving ? 'happy' : 'surprised'} pose={resolving ? 'cheer' : 'gossip'} /><CharacterSprite className="story-listener" appearance={character.appearance} pose="order" /><div className="story-scene-sign">TIN VỪA TỚI · {speaker.name.toUpperCase()}</div><WorldAtmosphere /></div>
        <div className="story-paper"><small>CHỌN CÁCH VIẾT CÂU CHUYỆN</small><h2>{story.title}</h2><p>{story.description}</p><div className="story-choices">{story.options.map(option => <button type="button" key={option.id} disabled={resolving} onClick={() => void choose(option.id)}><strong>{option.text}</strong><span>{option.path && `${PATH_LABEL[option.path] ?? ''} · `}{(option.moneyChange ?? 0).toLocaleString('vi-VN')}đ · Uy tín {(option.reputationChange ?? 0) > 0 ? '+' : ''}{option.reputationChange ?? 0} · Viral +{option.viralChange ?? 0}</span></button>)}</div></div>
      </article>}
      {journey.report && <article className="day-report"><div className="report-ribbon">{journey.report.goalMet ? 'HOÀN THÀNH MỤC TIÊU' : 'MỘT NGÀY THÊM KINH NGHIỆM'}</div><h2>Đóng sổ ngày {journey.report.day}</h2><p>{journey.report.quip}</p><dl><div><dt>Tô đã bán</dt><dd>{journey.report.served}</dd></div><div><dt>Đúng món</dt><dd>{journey.report.correct}</dd></div><div><dt>Khách rời quán</dt><dd>{journey.report.lost}</dd></div><div><dt>Chuỗi tốt nhất</dt><dd>{journey.report.bestCombo}</dd></div><div><dt>Thu chi cả ngày</dt><dd>{journey.report.netMoney.toLocaleString('vi-VN')}đ</dd></div><div><dt>Thưởng mục tiêu</dt><dd>{journey.report.reward.toLocaleString('vi-VN')}đ</dd></div></dl>{ending && <button className="primary-village-button" onClick={() => setTab('endings')}>Mở đoạn kết của bạn →</button>}</article>}
      {!journey.isOpen && !ending && <section className="morning-preparation"><h2>Chuẩn bị cho ngày {journey.report ? Math.min(7, journey.chapter) : journey.chapter}</h2><p>Mỗi ngày chọn một cách chuẩn bị miễn phí. Chốt lựa chọn khi mở cửa.</p><div className="boon-choices">{BOONS.map(boon => <button type="button" key={boon.id} aria-pressed={journey.boon === boon.id} disabled={busy} onClick={() => void act('prepare', { mode: journey.mode, boon: boon.id })}><FoodIcon name={boon.id === 'tea' ? 'Rau thơm' : boon.id === 'stove' ? 'Thịt bò' : 'Ớt'} /><strong>{boon.title}</strong><small>{boon.detail}</small></button>)}</div><div className="journey-mode-choice" role="group" aria-label="Nhịp chơi"><button aria-pressed={journey.mode === 'cozy'} disabled={busy} onClick={() => void act('prepare', { mode: 'cozy', boon: journey.boon })}>Thong thả · khách chờ ít nhất 100s</button><button aria-pressed={journey.mode === 'story'} disabled={busy} onClick={() => void act('prepare', { mode: 'story', boon: journey.boon })}>Nhộn nhịp · khách chờ ít nhất 55s</button></div><button className="primary-village-button" disabled={busy || isLoading} onClick={() => void startDay()}>Nhóm bếp · mở ngày mới</button></section>}
      {journey.isOpen && <div className="journal-day-actions"><Link className="primary-village-button" to="/map/shop">Vào bếp nấu phở →</Link>{!gameState?.waitingCustomers.length && journey.upcomingCustomers > 0 && <button disabled={busy} onClick={() => void act('next-wave')}>Đón đợt khách tiếp · {journey.upcomingCustomers} người</button>}<button disabled={busy || Boolean(story)} onClick={() => { if (hasCustomers && !confirmClose) setConfirmClose(true); else void act('close', { forfeit: hasCustomers }).then(ok => { if (ok) setConfirmClose(false); }); }}>{confirmClose && hasCustomers ? 'Đóng sớm · cho khách đang chờ rời quán' : 'Tổng kết · lên đèn cuối ngày'}</button>{confirmClose && hasCustomers && <button onClick={() => setConfirmClose(false)}>Bán tiếp, chưa đóng</button>}</div>}
    </>}
    {tab === 'memories' && <><div className="journey-paths">{(['community','craft','fame','mischief'] as const).map(path => <div key={path}><span>{PATH_LABEL[path]}</span><strong>{journey[path]}</strong></div>)}</div><div className="memory-scrapbook">{journey.memories.length ? journey.memories.map((memory, i) => <article key={`${i}-${memory.title}`}><span className="memory-pin" /><small>NGÀY {memory.day} · {PATH_LABEL[memory.path]}</small><h2>{memory.title}</h2><p><strong>{memory.choice}</strong></p><p>{memory.result}</p></article>) : <p>Chưa có mẩu chuyện nào. Khi ngày mở cửa trôi qua, thư mới sẽ đến nhật ký.</p>}</div></>}
    {tab === 'endings' && <>{ending && <div className="ending-epilogue" style={{ borderColor: ending.color }}><span className="ending-seal">MÙA {journey.season} · ĐOẠN KẾT CỦA BẠN</span><h1>{ending.title}</h1><p>{ending.description}</p><div className="ending-parade">{NEIGHBORS.slice(0,5).map(npc => <NeighborSprite key={npc.id} npcId={npc.id} emotion="happy" pose="cheer" />)}</div><button className="primary-village-button" disabled={busy} onClick={() => { void act('continue').then(ok => { if (ok) setTab('today'); }); }}>Chơi tiếp mùa mới · giữ quán, tiền và bộ sưu tập</button></div>}<p>Mỗi mùa có một kết thúc sau bảy ngày. Chơi tiếp để khám phá nhánh khác; không cần xóa quán.</p><div className="ending-gallery">{journey.endings.map(card => <article key={card.id} className={journey.unlockedEndings.includes(card.id) ? 'is-unlocked' : ''}><div className="ending-medallion" style={{ background: card.color }}><FoodIcon /></div><small>{journey.unlockedEndings.includes(card.id) ? 'ĐÃ LƯU VÀO BỘ SƯU TẬP' : 'CHƯA KHÁM PHÁ'}</small><h2>{card.title}</h2><p>{card.hint}</p></article>)}</div></>}
    {tab === 'cast' && <><p className="cast-note">Những người khách hư cấu của xóm: ăn mặc mộc mạc, mỗi người một nết vui. Tên và tình huống không mô phỏng người thật.</p><div className="customer-cast-gallery">{CUSTOMER_CAST.map((profile, i) => <article className={`cast-card cast-${profile.prop}`} key={profile.key}><div className="cast-portrait-stage"><CustomerSprite customer={{ id: i, name: profile.name, personaKey: profile.key } as import('../services/gameTypes').Customer} pose={profile.prop === 'phone' ? 'gossip' : 'order'} emotion="happy" /><span className="cast-number">{String(i+1).padStart(2,'0')}</span></div><small>{profile.role}</small><h2>{profile.name}</h2><p>{profile.quirk}</p></article>)}</div></>}
  </section>;
}
