import { onlineGame } from '../services/gameMode';
import { OnlineUnoPage } from './OnlineUnoPage';
﻿import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NeighborSprite } from '../components/NeighborSprite';
import { CharacterSprite } from '../components/CharacterSprite';
import { MAP_ONE_NPCS } from '../game/mapOneNpcs';
import { useGameStore } from '../context/GameContext';
import { useJourneyPause } from '../context/JourneyContext';
import {
  CARD_COLORS,
  COLOR_NAMES,
  COLOR_SHAPES,
  FACE_MARKS,
  FACE_NAMES,
  canPlayCard,
  cardName,
  type CardMatch,
  type CardColor,
  type CardDifficulty,
  type CardMode,
  type CardSnapshot,
  type PlayingCard,
} from '../game/cards';
import { DEFAULT_APPEARANCE, type CharacterAppearance } from '../game/character';
import type { CharacterCustomization } from '../game/characterCustomization';
import { UNO_BET_OPTIONS, type HistoryBetHistoryEntry } from '../services/historyProgress';
import { runLocalRequest, runOfflineRequest } from '../services/offline/storage';
import { playUiSound } from '../services/audioService';
import { CARD_EXIT_MARKER, useCardExitGuard } from '../game/useCardExitGuard';
import '../styles/cards.css';
import '../styles/cards-compact.css';
import '../styles/cards-polished.css';
import '../styles/cards-friendly.css';
import '../styles/cards-2d.css';
import '../styles/cards-room.css';

const MODES: { id: CardMode; name: string; mark: string; detail: string }[] = [
  { id: 'bots', name: 'Đấu với máy', mark: '🤖', detail: '1–3 máy · chọn độ khó' },
  { id: 'friends', name: 'Lập nhóm', mark: '😄', detail: '2–10 người · cùng thiết bị' },
];
const CARD_STAKES = [5000, 10000, 20000, 50000] as const;

function CardTurnClock({ match, hidden, myTurn, timeOffset, soundEnabled }: {
  match: CardMatch;
  hidden: boolean;
  myTurn: boolean;
  timeOffset: number;
  soundEnabled: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  const warnedTurn = useRef('');
  const secondsLeft = match.deadline == null ? 0 : Math.max(0, Math.ceil((match.deadline - (now + timeOffset)) / 1000));
  const clockProgress = match.deadline == null || !match.rules.turnSeconds
    ? 100
    : Math.max(0, Math.min(100, (match.deadline - (now + timeOffset)) / (match.rules.turnSeconds * 1000) * 100));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const key = `${match.id}:${match.turn}:${match.deadline}`;
    if (myTurn && match.deadline != null && secondsLeft <= 5 && secondsLeft > 0 && warnedTurn.current !== key) {
      warnedTurn.current = key;
      if (soundEnabled) playUiSound('warning');
    }
  }, [match.id, match.turn, match.deadline, myTurn, secondsLeft, soundEnabled]);

  return (
    <div className={`cards-turn-clock${secondsLeft <= 5 && match.deadline !== null && !hidden ? ' is-urgent' : ''}`} role="timer" aria-label={hidden ? 'Đồng hồ chờ nhận máy' : `Còn ${secondsLeft} giây trong lượt`}>
      <span>{hidden ? '◷ Chờ sẵn sàng' : match.deadline === null ? 'Không giới hạn' : `◷ ${secondsLeft}s`}</span>
      <div><i style={{ width: `${clockProgress}%` }} /></div>
      <small>{hidden ? 'Thời gian đang dừng' : 'Hết giờ: rút bài và chuyển lượt'}</small>
    </div>
  );
}

function UnoDeadlineText({ deadline, timeOffset }: { deadline: number; timeOffset: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);
  return <>Còn 1! · {Math.max(0, (deadline - (now + timeOffset)) / 1000).toFixed(1)}s</>;
}

interface CardRoomPageProps {
  campaignMode?: boolean;
  duelMode?: boolean;
  opponentName?: string;
  opponentNames?: readonly string[];
  opponentCharacterIds?: readonly string[];
  initialOpponents?: number;
  initialDifficulty?: CardDifficulty;
  initialTargetScore?: number;
  initialCards?: number;
  initialTurnSeconds?: number;
  rewardsEnabled?: boolean;
  returnPath?: string;
  expectedMatchId?: number | null;
  playerAppearance?: CharacterAppearance;
  playerCustomization?: CharacterCustomization;
  onMatchStarted?: (matchId: number) => void;
  onMatchFinished?: (result: { matchId: number; round: number; outcome: 'win' | 'loss' | 'draw' }) => void;
  bettingMode?: boolean;
  betBalance?: number;
  freeUnoTickets?: number;
  selectedBet?: number;
  bettingHistory?: HistoryBetHistoryEntry[];
  freeTicketOnEntry?: boolean;
  hasPendingBet?: boolean;
  pendingPreviousMatchId?: number | null;
  onBetChange?: (bet: number) => void;
  onReserveBet?: (bet: number, useTicket: boolean, previousMatchId: number | null) => boolean;
  onCancelBet?: () => void;
}

export function CardFace({ card }: { card?: PlayingCard }) {
  if (!card) {
    return (
      <span className="color-card card-back" aria-hidden="true">
        <strong>UNO</strong>
        <small>XÓM MÌNH</small>
      </span>
    );
  }

  return (
    <span className={`color-card card-${card.color ?? 'wild'}`}>
      <span className="card-corner">
        {FACE_MARKS[card.face] ?? card.face}
        <small>{card.color ? COLOR_SHAPES[card.color] : '✦'}</small>
      </span>
      <strong>{FACE_MARKS[card.face] ?? card.face}</strong>
      <small className="card-caption">{FACE_NAMES[card.face] ?? COLOR_NAMES[card.color!]}</small>
      <span className="card-bottom" aria-hidden="true">{FACE_MARKS[card.face] ?? card.face}</span>
    </span>
  );
}

export function CardRoomPage({
  campaignMode = false, duelMode = false, opponentName, opponentNames, opponentCharacterIds, initialOpponents, initialDifficulty = 'medium',
  initialTargetScore = 500, initialCards = 7, initialTurnSeconds,
  rewardsEnabled = true, returnPath = '/map', expectedMatchId = null,
  playerAppearance = DEFAULT_APPEARANCE, playerCustomization, onMatchStarted, onMatchFinished,
  bettingMode = false, betBalance = 0, freeUnoTickets = 0, selectedBet = UNO_BET_OPTIONS[0].bet,
  bettingHistory = [], freeTicketOnEntry = false, hasPendingBet = false, pendingPreviousMatchId, onBetChange, onReserveBet, onCancelBet,
}: CardRoomPageProps) {
  const { character, soundEnabled, setSoundEnabled, loadGame } = useGameStore();
  useJourneyPause(true);

  const [snapshot, setSnapshot] = useState<CardSnapshot | null>(null);
  const [mode, setMode] = useState<CardMode>(() => !campaignMode && onlineGame && localStorage.getItem('xnl-online-room') ? 'friends' : 'bots');
  const [opponents, setOpponents] = useState(initialOpponents ?? (duelMode ? 1 : 2)), [difficulty, setDifficulty] = useState<CardDifficulty>(initialDifficulty);
  const [turnSeconds, setTurnSeconds] = useState(initialTurnSeconds ?? 30), [stake, setStake] = useState<number>(bettingMode ? selectedBet : CARD_STAKES[0]);
  const [useFreeTicket, setUseFreeTicket] = useState(freeTicketOnEntry);
  const [confirmBet, setConfirmBet] = useState(false);
  const [names, setNames] = useState(() => Array.from({ length: 10 }, (_, i) => i === 0 ? '' : i === 1 ? opponentName ?? `Bạn ${i + 1}` : `Bạn ${i + 1}`));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [selected, setSelected] = useState<PlayingCard | null>(null), [chosenColor, setChosenColor] = useState<CardColor>('red'), [target, setTarget] = useState(1);
  const [showRules, setShowRules] = useState(false), [showLog, setShowLog] = useState(false), [showSettings, setShowSettings] = useState(false), [privateScreen, setPrivateScreen] = useState(false);

  const live = useRef(false), pending = useRef(false), offset = useRef(0), current = useRef(snapshot);
  const campaignMatchId = useRef(expectedMatchId);
  current.current = snapshot;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const request = async (action: string, body: Record<string, unknown> = {}) =>
    (await (campaignMode ? runOfflineRequest : runLocalRequest)('POST', '/cards/' + action, body, {})) as CardSnapshot;

  function receive(data: CardSnapshot) {
    if (!live.current || (current.current?.revision ?? 0) > data.revision) return;
    offset.current = data.now - Date.now();
    current.current = data;
    setSnapshot(data);
  }

  async function act(action: string, body: Record<string, unknown> = {}) {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError('');

    try {
      receive(await request(action, body));
      if (!campaignMode && ['start', 'next-round', 'quit'].includes(action)) void loadGame?.();
      if (soundEnabled && ['play', 'one', 'start'].includes(action)) playUiSound('success');
      return true;
    } catch (cause) {
      if (live.current) setError(cause instanceof Error ? cause.message : 'Không lưu được bàn chơi.');
      return false;
    } finally {
      pending.current = false;
      if (live.current) setBusy(false);
    }
  }

  useEffect(() => {
    if (onlineGame && mode === 'friends') return;
    live.current = true;
    const abandoned = localStorage.getItem(CARD_EXIT_MARKER);
    void request('open', { abandonId: abandoned === null ? null : Number(abandoned) }).then(data => {
      receive(data);
      const active = data.progress.active;
      const isReservedMatch = active && hasPendingBet
        && pendingPreviousMatchId !== undefined
        && active.id !== pendingPreviousMatchId;
      if (campaignMode && active
        && (expectedMatchId === active.id || active.status === 'playing' && active.id !== pendingPreviousMatchId || isReservedMatch)) {
        campaignMatchId.current = active.id;
        onMatchStarted?.(active.id);
      } else if (campaignMode && hasPendingBet) {
        onCancelBet?.();
      }
      if (localStorage.getItem(CARD_EXIT_MARKER) === abandoned) localStorage.removeItem(CARD_EXIT_MARKER);
    }).catch(cause => { if (live.current) setError(cause.message); });

    let reading = false;
    const timer = window.setInterval(() => {
      if (!current.current || pending.current || reading || document.hidden) return;
      reading = true;
      void request('state').then(receive).catch(cause => { if (live.current) setError(cause.message); }).finally(() => { reading = false; });
    }, 450);

    const hide = () => {
      if ((current.current?.progress.active?.players.filter(p => p.human).length ?? 0) > 1) {
        setPrivateScreen(true);
        setSelected(null);
        void request('hide').then(receive).catch(() => {});
      }
    };
    const visibility = () => { if (document.hidden) hide(); };

    window.addEventListener('pagehide', hide);
    document.addEventListener('visibilitychange', visibility);

    return () => {
      live.current = false;
      window.clearInterval(timer);
      window.removeEventListener('pagehide', hide);
      document.removeEventListener('visibilitychange', visibility);
      void request('hide').catch(() => {});
    };
  }, [mode]);

  const p = snapshot?.progress, m = p?.active, playing = m?.status === 'playing';
  const basic = m?.status === 'playing' || m?.status === 'finished' ? m.rules.variant === 'basic' : true;
  const viewer = m ? m.onePending?.player ?? (m.mode === 'friends' ? m.turn : 0) : 0;
  const person = m?.players[viewer], hidden = Boolean(m?.handoff || privateScreen);
  const myTurn = Boolean(playing && m!.turn === viewer && person?.human && !hidden && !m!.onePending);
  const hand = !hidden ? person?.hand ?? [] : [];
  const specialReaction = Boolean(m?.log[0] && (m.log[0].includes('nhận') || /Rút [24]|Đổi màu|Đổi chiều|Mất lượt/.test(m.log[0])));
  const { confirmQuit, askExit, confirmExit, stay } = useCardExitGuard(playing ? m!.id : null, () => act('quit'));
  const quitDialog = useRef<HTMLDivElement>(null);
  useEffect(() => { if (confirmQuit) { setSelected(null); quitDialog.current?.querySelector<HTMLButtonElement>('button')?.focus(); } }, [confirmQuit]);
  const money = (value: number) => value.toLocaleString('vi-VN') + ' xu';
  const handledFinish = useRef('');
  useEffect(() => {
    if (!campaignMode || !m || m.status !== 'finished' || !onMatchFinished) return;
    const key = `${m.id}-${m.round ?? 1}`;
    if (handledFinish.current === key) return;
    if (campaignMatchId.current !== m.id) return;
    handledFinish.current = key;
    onMatchFinished({
      matchId: m.id,
      round: m.round ?? 1,
      outcome: m.winner === null ? 'draw' : m.winner === 0 && m.forfeitedBy !== 0 ? 'win' : 'loss',
    });
  }, [campaignMode, expectedMatchId, m?.id, m?.round, m?.status, m?.winner, m?.forfeitedBy, onMatchFinished]);
  useEffect(() => { setSelected(null); }, [m?.turn, m?.id, hidden]);

  async function start() {
    setSelected(null);
    setPrivateScreen(false);
    if (bettingMode && !onReserveBet?.(stake, useFreeTicket, snapshot?.progress.active?.id ?? null)) {
      setError(useFreeTicket && freeUnoTickets === 0
        ? 'Bạn chưa có Vé UNO miễn phí. Hoàn thành nhiệm vụ lịch sử để nhận vé.'
        : 'Không đủ xu để cược mức này. Chọn mức thấp hơn hoặc làm nhiệm vụ lịch sử.');
      setConfirmBet(false);
      return;
    }
    const started = await act('start', {
      mode,
      variant: 'basic',
      opponents: duelMode ? 1 : initialOpponents ?? opponents,
      difficulty,
      room: 'cafe',
      initialCards,
      targetScore: initialTargetScore,
      turnSeconds,
      stake: campaignMode ? 0 : stake,
      missionMode: campaignMode,
      stack: false,
      names: mode === 'friends'
        ? names.map((name, i) => name || (i === 0 ? character.displayName || 'Bạn' : `Bạn ${i + 1}`))
        : opponentNames?.length
          ? [character.displayName || 'Bạn', ...opponentNames]
          : undefined,
      opponentCharacters: opponentCharacterIds,
    });
    const matchId = started ? current.current?.progress.active?.id : undefined;
    if (matchId !== undefined && matchId !== null) {
      campaignMatchId.current = matchId;
      if (campaignMode) onMatchStarted?.(matchId);
    } else if (bettingMode) {
      onCancelBet?.();
    }
    if (!started && bettingMode) onCancelBet?.();
    setConfirmBet(false);
  }

  function requestStart() {
    if (bettingMode) setConfirmBet(true);
    else void start();
  }

  async function startAnotherCampaignGame() {
    if (busy) return;
    await start();
  }

  async function playCard(card: PlayingCard) {
    if (!m || !canPlayCard(m, viewer, card)) return;
    if (card.color === null && card.face !== 'random') {
      setSelected(card);
      setTarget(m.players.findIndex((_, i) => i !== viewer));
      return;
    }
    await act('play', { player: viewer, cardId: card.id });
  }


  if (onlineGame && mode === 'friends') return <OnlineUnoPage onBack={() => setMode('bots')} />;

  return (
    <section className={`cards-game cards-2d cards-compact cards-polished cards-friendly cards-room-screen${playing ? ' is-playing' : ''} room-${playing ? m!.room : 'cafe'}`} aria-label="Sắc màu xóm mình">
      <header className="cards-header">
        <button className="cards-back-button" disabled={busy} onClick={() => askExit(returnPath)}>{campaignMode ? '← Về bản đồ' : '← Về xóm'}</button>
        <div>
          <h1><span>UNO</span> Xóm<span className="uno-brand-smile" aria-hidden="true">☺</span></h1>
        </div>
        <div className="cards-header-tools">
          {playing && <div className="cards-header-stats" aria-label="Thông tin ván chơi">
            <span><small>LƯỢT</small><strong>{m!.moves + 1}</strong></span>
            {!campaignMode && <span><small>CƯỢC</small><strong>{money(m!.wager?.stake ?? 0)}</strong></span>}
          </div>}
          {bettingMode && <span className="cards-ticket-pill" aria-label={`${freeUnoTickets} Vé UNO miễn phí`}>🎟️ <strong>{freeUnoTickets}</strong></span>}
          <button className="cards-settings-trigger" aria-label="Cài đặt bàn chơi" aria-expanded={showSettings} onClick={() => setShowSettings(value => !value)}>⚙</button>
          {showSettings && <div className="cards-settings-menu" role="group" aria-label="Cài đặt bàn chơi">
            <label><input type="checkbox" checked={soundEnabled} onChange={event => setSoundEnabled(event.target.checked)} /> Âm thanh</label>
            <button type="button" onClick={() => { setShowRules(true); setShowSettings(false); }}>? Luật chơi</button>
          </div>}
        </div>
      </header>

      {error && (
        <div role="alert" className="cards-error">
          {error}
          <button onClick={() => setError('')} aria-label="Đóng lỗi">×</button>
        </div>
      )}

      {confirmBet && bettingMode && !playing && (
        <div className="cards-exit-backdrop">
          <section className="cards-exit-dialog cards-bet-confirm" role="alertdialog" aria-modal="true" aria-labelledby="cards-bet-title">
            <span aria-hidden="true">{useFreeTicket ? '🎟️' : '🪙'}</span>
            <h2 id="cards-bet-title">{useFreeTicket ? 'Xác nhận dùng Vé UNO' : 'Xác nhận cược xu ảo'}</h2>
            <p>{useFreeTicket
              ? `Ván này được miễn phí nhờ Vé UNO. Nếu thắng, bạn nhận ${money(UNO_BET_OPTIONS.find(option => option.bet === stake)?.reward ?? 0)} tiền thưởng. Vé sẽ được dùng khi ván bắt đầu.`
              : `Bạn đang chọn cược ${money(stake)} cho ván này. Nếu thắng, bạn nhận ${money(UNO_BET_OPTIONS.find(option => option.bet === stake)?.reward ?? 0)} tiền thưởng và được hoàn lại tiền cược. Nếu thua, bạn mất ${money(stake)}. Bạn có muốn tiếp tục không?`}
            </p>
            <button className="cards-primary" disabled={busy || useFreeTicket && freeUnoTickets < 1 || !useFreeTicket && betBalance < stake} onClick={() => void start()}>
              {useFreeTicket ? 'Chơi miễn phí' : 'Xác nhận cược'}
            </button>
            <button className="cards-forfeit-button" disabled={busy} onClick={() => setConfirmBet(false)}>Hủy</button>
          </section>
        </div>
      )}

      {showRules && (
        <section className="cards-rules">
          <h2>{basic ? `UNO cơ bản · 108 lá · đua tới ${initialTargetScore} điểm` : 'Sắc màu mở rộng · 116 lá'}</h2>
          <p>Mỗi lượt đánh cùng màu hoặc cùng số/ký hiệu. Rút một lá thì chỉ được đánh lá vừa rút, hoặc bỏ lượt. Wild chỉ đánh khi tới lượt, không được chen ngang.</p>
          {basic ? (
            <>
              <p>Mỗi người nhận {m?.rules.initialCards ?? initialCards} lá. Skip bỏ qua người sau. Reverse đảo chiều (ván hai người cho bạn lượt tiếp). +2 và +4 bắt người sau rút rồi mất lượt, không cộng dồn. +4 chỉ đánh được khi không còn lá cùng màu trên tay; game tự chặn nước đi sai nên không cần khiếu nại.</p>
              <p>Hô UNO khi xuống một lá. Nếu quên, người sau có thể bấm Bắt lỗi UNO trước khi đánh hoặc rút bài, phạt bạn thêm 2 lá. Không bị bắt thì không tự phạt. Có thể hô trước khi đánh lá kế cuối.</p>
              <p>Hết bài trước thắng ván và nhận điểm từ bài còn lại của mỗi đối thủ: số 0–9 theo số, Skip/Reverse/+2 là 20, Wild/+4 là 50. Lá +2/+4 cuối ván vẫn buộc người sau rút rồi mới tính. Bấm Chia ván tiếp để giữ tổng điểm, đạt {m?.rules.targetScore ?? initialTargetScore} điểm thắng trận.</p>
              <p>Bản số hóa chọn lá số mở bàn để người mới dễ bắt đầu. Bài được phát và lượt đầu chạy theo thứ tự chỗ ngồi.</p>
            </>
          ) : (
            <>
              <p>Luật riêng cho phép cộng dồn +2/+4. Khiên chặn một lần, hoặc chặn cả chuỗi đang bị phạt. Hoán đổi đổi tay bài còn lại; Tất cả rút 1 áp dụng cả người đánh. Màu ngẫu nhiên tự chọn màu. Trong bản mở rộng, +4 không có điều kiện phụ.</p>
              <p>Hô Còn 1 trước lá kế cuối hoặc trong 3,5 giây sau đó; quên hô tự rút thêm hai lá. Phiêu lưu và thử thách ngày dùng bộ mở rộng.</p>
            </>
          )}
          <button onClick={() => setShowRules(false)}>Đã hiểu</button>
        </section>
      )}

      {!snapshot ? (
        <div className="cards-loading">
          Đang xếp bàn…
          {error && <button onClick={() => void act('open')}>Thử lại</button>}
        </div>
      ) : !m || m.status === 'abandoned' ? (
        <>
          <div className="cards-lobby-intro"><div className="uno-mini-deck" aria-hidden="true"><span>2</span><span>↔</span><span>+2</span><span>☺</span></div><h2>{bettingMode ? 'Chọn mức cược' : duelMode ? `Thử thách với ${opponentName ?? 'nhân vật lịch sử'}` : campaignMode ? 'Nhiệm vụ UNO' : 'Sẵn sàng vào bàn?'}</h2><p>Cùng màu hoặc số để đánh · Còn một lá thì hô UNO!</p></div>
          {!campaignMode && <div className="cards-mode-grid" role="group" aria-label="Chế độ chơi">
            {MODES.map(item => <button key={item.id} aria-pressed={mode === item.id} onClick={() => { setMode(item.id); if (item.id === 'bots') setOpponents(value => Math.min(3, value)); }}>
              <b>{item.mark}</b><strong>{item.name}</strong><small>{onlineGame && item.id === 'friends' ? 'Mã mời · mỗi người một thiết bị' : item.detail}</small>
            </button>)}
          </div>}
          <section className="cards-setup" aria-label="Thiết lập bàn UNO">
            {!campaignMode && <div className="cards-wallet-bar"><span>Ví tiền ảo của bạn</span><strong>{money(snapshot.money ?? 0)}</strong></div>}
            <div className="cards-options">
              {!duelMode && !opponentCharacterIds?.length && <label>{mode === 'friends' ? 'Số người trong nhóm' : 'Số máy'}
                <select value={opponents} onChange={e => setOpponents(Number(e.target.value))}>
                  {Array.from({ length: mode === 'friends' ? 9 : 3 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{mode === 'friends' ? n + 1 + ' người' : n + ' máy'}</option>)}
                </select>
              </label>}
              {mode === 'bots' && !opponentCharacterIds?.length && <label>Độ khó<select value={difficulty} onChange={e => setDifficulty(e.target.value as CardDifficulty)}><option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option></select></label>}
              {opponentCharacterIds?.length ? <div className="cards-practice-opponents"><strong>Đối thủ luyện tập</strong><span>{opponentNames?.join(' · ')}</span><small>{difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Trung bình' : 'Khó'} · {initialCards} lá ban đầu · mục tiêu {initialTargetScore} điểm</small></div> : null}
              <label>Thời gian mỗi lượt<select value={turnSeconds} onChange={e => setTurnSeconds(Number(e.target.value))}>{[0, 15, 30, 60].map(seconds => <option key={seconds} value={seconds}>{seconds ? `${seconds} giây` : 'Không giới hạn'}</option>)}</select></label>
            </div>
            {bettingMode && <section className="cards-history-betting" aria-label="Cược UNO bằng xu ảo">
              <div className="cards-history-wallet"><span>🪙 Xu hiện có</span><strong>{money(betBalance)}</strong><span>🎟️ Vé UNO miễn phí</span><strong>{freeUnoTickets}</strong></div>
              <div className="cards-bet-methods" role="group" aria-label="Cách vào ván">
                <button type="button" aria-pressed={!useFreeTicket} onClick={() => setUseFreeTicket(false)}>Cược bằng xu</button>
                <button type="button" aria-pressed={useFreeTicket} disabled={freeUnoTickets < 1} onClick={() => setUseFreeTicket(true)}>Dùng Vé UNO miễn phí · {freeUnoTickets}</button>
              </div>
              {useFreeTicket ? <div className="cards-free-ticket-note" role="status">
                <strong>Ván này được miễn phí nhờ Vé UNO</strong>
                <span>Vé chỉ miễn tiền cược; thắng vẫn nhận {money(UNO_BET_OPTIONS.find(option => option.bet === stake)?.reward ?? 0)} tiền thưởng theo mức đã chọn.</span>
              </div> : <fieldset className="cards-stake-picks cards-history-stake-picks">
                <legend>Chọn mức cược · xu ảo, không có giá trị quy đổi</legend>
                {UNO_BET_OPTIONS.map(option => <button key={option.bet} type="button" aria-pressed={stake === option.bet} disabled={option.bet > betBalance} onClick={() => { setStake(option.bet); onBetChange?.(option.bet); }}>{money(option.bet)}</button>)}
              </fieldset>}
              <div className="cards-history-bet-summary">
                <strong>Mức cược: {money(stake)}</strong>
                <span>Thắng: nhận thêm {money(UNO_BET_OPTIONS.find(option => option.bet === stake)?.reward ?? 0)}{!useFreeTicket ? ` · hoàn lại ${money(stake)} tiền cược` : ''}</span>
                <span>{useFreeTicket ? 'Thua: không mất xu · vé được sử dụng khi ván bắt đầu' : `Thua: mất ${money(stake)}`}</span>
              </div>
              {!useFreeTicket && stake > betBalance && <p className="cards-stake-warning" role="alert">Bạn chưa đủ xu cho mức cược này. Chọn mức thấp hơn hoặc làm nhiệm vụ lịch sử.</p>}
              {freeUnoTickets < 1 && <p className="cards-history-ticket-hint">Bạn chưa có Vé UNO miễn phí. Trả lời đúng 5 câu hỏi, hoàn thành chuyện nhân vật hoặc đạt 100 danh vọng để nhận vé.</p>}
              <p className="cards-virtual-money-disclaimer">Xu và vé chỉ dùng giải trí trong game, không nạp, rút hay quy đổi thành tiền thật.</p>
              <section className="cards-betting-history" aria-label="Lịch sử cược gần đây">
                <h3>Lịch sử thắng/thua gần đây</h3>
                {bettingHistory.length ? <ul>{bettingHistory.slice(0, 5).map((entry, index) => <li key={`${entry.matchId}-${entry.round}-${index}`}>
                  <strong>{entry.outcome === 'win' ? 'Thắng' : entry.outcome === 'loss' ? 'Thua' : 'Hòa'}</strong>
                  <span>{entry.freeTicket ? 'Vé miễn phí' : `Cược ${money(entry.stake)}`}</span>
                  <span>{entry.coinDelta > 0 ? `+${money(entry.coinDelta)}` : entry.coinDelta < 0 ? `−${money(Math.abs(entry.coinDelta))}` : 'Hoàn cược'}</span>
                </li>)}</ul> : <p>Chưa có ván nào được ghi nhận.</p>}
              </section>
            </section>}
            {!campaignMode && <><fieldset className="cards-stake-picks"><legend>Chọn cược bắt buộc · xu ảo</legend>{CARD_STAKES.map(value => <button key={value} type="button" aria-pressed={stake === value} disabled={value > (snapshot.money ?? 0)} onClick={() => setStake(value)}>{money(value)}</button>)}</fieldset>
            <p className="cards-stake-preview">Vào bàn: −<strong>{money(stake)}</strong> · Thắng: nhận quỹ <strong>{money(stake * (opponents + 1))}</strong></p>
            <p className="cards-stake-rule">Thua hoặc rời bàn sẽ mất cược. Muốn chơi không cược, quay về bản đồ và làm nhiệm vụ lịch sử.</p>
            {stake > (snapshot.money ?? 0) && <p className="cards-stake-warning" role="alert">Chưa đủ xu cho mức cược này. Chọn mức thấp hơn hoặc làm nhiệm vụ để kiếm thêm xu.</p>}</>}
            {mode === 'friends' && !campaignMode && <p className="cards-stake-note">Tiền cược chỉ là xu ảo trong game; ghế thắng nhận quỹ thưởng.</p>}
            {mode === 'friends' && <details className="cards-group-details"><summary>Đặt tên thành viên · {opponents + 1} người</summary><div className="cards-friend-names">
              {names.slice(0, opponents + 1).map((name, i) => <label key={i}>Người {i + 1}<input maxLength={24} value={name} placeholder={i === 0 ? character.displayName || 'Bạn' : 'Bạn ' + (i + 1)} onChange={e => setNames(old => old.map((v, n) => n === i ? e.target.value : v))} /></label>)}
            </div><p>Chuyền máy từng lượt. Tay bài sẽ được che khi đổi người.</p></details>}
            <button className="cards-primary" disabled={busy || bettingMode && (useFreeTicket ? freeUnoTickets < 1 : stake > betBalance) || !bettingMode && stake > (snapshot.money ?? 0)} onClick={requestStart}>{busy ? 'Đang chia bài…' : bettingMode ? useFreeTicket ? 'Chơi miễn phí' : 'Xác nhận cược' : mode === 'friends' ? 'Lập nhóm · chia bài →' : 'Bắt đầu đấu máy →'}</button>
            <p className="cards-offline-note">{duelMode ? 'Thử thách miễn phí · không đặt cược xu hoặc vé UNO' : bettingMode ? 'Cược xu ảo trong game · chọn máy và thời gian mỗi lượt trước khi xác nhận' : campaignMode ? 'Nhiệm vụ miễn cược · chơi lại không giới hạn' : 'Mỗi trận thường cần cược từ 5.000 xu ảo'}</p>
          </section>
        </>
      ) : m.status === 'finished' ? (
        <section className="cards-finish">
          <span className="cards-finish-medal">{m.winner === null ? '↔' : m.players[m.winner].human ? '✦' : '♣'}</span>
          <h2>{m.winner === null ? 'Ván hòa!' : m.forfeitedBy === 0 ? 'Bạn đã rời bàn · tính thua' : `${m.players[m.winner].name} thắng rồi!`}</h2>
          {m.wager && m.wager.stake > 0 && <div className="cards-wager-result"><span>{m.forfeitedBy === 0 ? 'Mất cược' : m.winner === 0 ? 'Bạn nhận quỹ thưởng' : 'Bạn thua cược'}</span><strong>{m.winner === 0 && m.forfeitedBy === undefined ? '+' + money(m.wager.payout) : '−' + money(m.wager.stake)}</strong><small>Ví hiện tại: {money(snapshot.money ?? 0)} · tiền ảo</small></div>}
          {bettingMode && (() => {
            const result = bettingHistory.find(entry => entry.matchId === m.id && entry.round === (m.round ?? 1));
            if (!result) return null;
            const message = result.outcome === 'draw'
              ? 'Ván hòa, tiền cược được hoàn lại.'
              : result.outcome === 'loss'
                ? `Bạn thua và mất ${money(result.stake)}${result.freeTicket ? ' · vé UNO đã dùng, không mất xu' : ''}.`
                : result.freeTicket
                  ? `Bạn thắng và nhận được ${money(result.reward)} xu nhờ vé miễn phí.`
                  : `Bạn thắng và nhận được ${money(result.reward)} xu; ${money(result.stake)} xu cược đã được hoàn lại.`;
            return <div className={`cards-bet-settlement is-${result.outcome}`} role="status">
              <strong>{message}</strong>
              <span>Số dư hiện tại: {money(betBalance)} · Vé UNO còn: {freeUnoTickets}</span>
            </div>;
          })()}
          <p>
            {m.moves} lá đã đánh · {m.winner === null ? 'Một ván vui vẻ, mình thử lại nhé?' : m.players[m.winner].human ? 'Lá cuối đặt xuống, cả bàn bật cười. Ván nữa chứ?' : 'Hàng xóm khéo quá. Lần sau canh màu lật kèo nhé!'}
          </p>
          {campaignMode && rewardsEnabled && <p className="cards-offline-note">Phần thưởng hành trình sẽ hiện khi bạn trở về bản đồ xóm làng.</p>}
          {m.mode === 'adventure' && m.winner === 0 && <p className="cards-unlock">Phiêu lưu {p!.adventureStage}/8 · {p!.unlockedCharacters.length} nhân vật · {p!.unlockedRooms.length} phòng đã mở</p>}
          {m.mode === 'daily' && m.winner === 0 && <p className="cards-unlock">✓ Đã lưu thử thách {m.dailyDate}</p>}
          <div className="cards-score-summary">
            {basic && <p>Ván {m.round ?? 1}: +{m.roundPoints ?? 0} điểm cho {m.players[m.winner!].name}{m.champion != null ? ` · ĐÃ ĐẠT ${m.rules.targetScore ?? 500} ĐIỂM, THẮNG TRẬN!` : ` · Mục tiêu ${m.rules.targetScore ?? 500} điểm`}</p>}
          </div>
          <div className="cards-final-scores">
            {m.players.map((person, i) => (
              <div key={i}>
                <strong>{i === m.winner ? '✦ ' : ''}{person.name}</strong>
                <span>{person.hand.length} lá{basic ? ` · Tổng ${m.totals?.[i] ?? 0} điểm` : ''}</span>
              </div>
            ))}
          </div>

          {!campaignMode && basic && m.champion == null && m.forfeitedBy === undefined && (
            <button className="cards-primary" disabled={busy} onClick={() => void act('next-round')}>
              Chia ván tiếp · giữ điểm →
            </button>
          )}
          {m.wager && m.forfeitedBy === undefined && <p className="cards-stake-note">Ván tiếp góp lại {money(m.wager.stake)} tiền ảo.</p>}

          {!campaignMode && <button className="cards-primary" disabled={busy} onClick={() => { setMode(m.mode === 'friends' ? 'friends' : 'bots'); void act('quit'); }}>
            Chọn bàn tiếp theo →
          </button>}
          {campaignMode && !rewardsEnabled && <button className="cards-primary" disabled={busy} onClick={() => void startAnotherCampaignGame()}>
            Chơi ván UNO mới · không giới hạn →
          </button>}
          <Link to={returnPath}>{campaignMode ? 'Về bản đồ xóm làng' : 'Về xóm, nghỉ một chút'}</Link>
        </section>
      ) : (
        <>
          <div className="cards-match-bar">
            <span>{MODES.find(item => item.id === m.mode)?.name ?? 'Ván đã lưu'}</span>
            <span>
              {basic ? `UNO · Ván ${m.round ?? 1} · ${m.rules.targetScore ?? 500} điểm` : m.rules.stack ? 'Cộng dồn' : 'Không cộng dồn'} · {m.rules.turnSeconds ? m.rules.turnSeconds + 's/lượt' : 'Thong thả'}
            </span>
            <button onClick={() => askExit()}>Rời bàn</button>
          </div>

          <div className={`cards-round-hud${myTurn ? ' is-your-turn' : ''}`}><div><span>{hidden ? 'CHỜ NHẬN MÁY' : myTurn ? 'ĐẾN LƯỢT BẠN' : `LƯỢT CỦA ${m.players[m.turn].name.toUpperCase()}`}</span><strong>{hidden ? 'Bài đang được che · sẵn sàng khi đã nhận máy' : myTurn ? 'Chạm lá được viền sáng để đánh' : 'Chờ người chơi hiện tại ra bài'}</strong></div>{!campaignMode && <div className="cards-pot-pill"><small>QUỸ THƯỞNG</small><b>{money(m.wager?.pot ?? 0)}</b></div>}</div>
          <CardTurnClock match={m} hidden={hidden} myTurn={myTurn} timeOffset={offset.current} soundEnabled={soundEnabled} />

          <div className="cards-table-scene">
            <div className="cards-room-decor" aria-hidden="true"><i /><i /><i /></div>

            <div className="cards-opponents">
              {m.players.map((other, i) => i === viewer ? null : (
                <article key={i} className={`cards-opponent${m.turn === i ? ' is-turn' : ''}`}>
                  {MAP_ONE_NPCS.find(npc => npc.id === other.character)
                    ? <CharacterSprite
                      appearance={MAP_ONE_NPCS.find(npc => npc.id === other.character)!.appearance}
                      npcDesign={MAP_ONE_NPCS.find(npc => npc.id === other.character)!.design}
                      emotion={other.expression}
                      pose={other.expression === 'happy' ? 'cheer' : 'order'}
                      portrait
                    />
                    : <NeighborSprite npcId={other.character === 'player' ? 'ti' : other.character} emotion={other.expression} pose={other.expression === 'happy' ? 'cheer' : 'order'} portrait />}
                  <div>
                    <strong>{other.name}{other.shield ? ' ☼' : ''}</strong>
                    <span>{other.hand.length === 1 ? (basic ? 'UNO!' : 'CÒN 1!') : `${other.hand.length} lá`}</span>
                    <small>{m.turn === i ? '◉ Đang suy nghĩ' : other.line}</small>
                  </div>
                  <div className="cards-opponent-backs" aria-hidden="true">
                    {Array.from({ length: Math.min(5, other.hand.length) }, (_, n) => <CardFace key={n} />)}
                  </div>
                </article>
              ))}
            </div>

            <div className="cards-center">
              <button className="cards-deck" disabled={busy || !myTurn || m.didDraw} onClick={() => void act('draw', { player: viewer })} aria-label={m.pending ? `Rút ${m.pending} lá phạt` : 'Rút bài từ chồng'}>
                <CardFace />
                <small>{m.deck.length} lá</small>
              </button>

              <div className="cards-discard" aria-label={`Lá trên bàn: ${cardName(m.discard[m.discard.length - 1])}`}>
                <CardFace card={m.discard[m.discard.length - 1]} />
              </div>

              <div className="cards-table-info">
                <span className={`cards-active-color color-${m.color}`}>{COLOR_SHAPES[m.color]} {COLOR_NAMES[m.color]}</span>
                <strong>{m.direction === 1 ? '→' : '←'}</strong>
                {m.pending > 0 && <b>+{m.pending} lá phạt!</b>}
                <small>{m.onePending ? 'Chờ hô Còn 1…' : `${m.players[m.turn].name} tới lượt`}</small>
              </div>
            </div>

            <p className="cards-live-log" role="status">{m.log[0]}</p>

            {hidden && (
              <div className="cards-handoff">
                <span>✦</span>
                <h2>Chuyền máy cho {m.players[m.onePending?.player ?? m.turn].name}</h2>
                <p>Tay bài đã che. Mỗi người nhìn sang chỗ khác một chút nhé.</p>
                <button
                  className="cards-primary"
                  disabled={busy}
                  onClick={() => { void act('ready').then(ok => { if (ok) setPrivateScreen(false); }); }}
                >
                  Tôi là {m.players[m.onePending?.player ?? m.turn].name} · sẵn sàng
                </button>
              </div>
            )}
          </div>

          {basic && m.unoVulnerable !== undefined && (
            <div className="cards-uno-alert" role="status">
              <span>{m.players[m.unoVulnerable].name} chưa hô UNO!</span>
              {m.players[m.unoVulnerable].human && (
                <button disabled={busy} onClick={() => void act('one', { player: m.unoVulnerable })}>UNO! · {m.players[m.unoVulnerable].name}</button>
              )}
              {myTurn && m.unoVulnerable !== viewer && (
                <button disabled={busy} onClick={() => void act('catch', { player: viewer })}>Bắt lỗi UNO · phạt 2 lá</button>
              )}
            </div>
          )}

          <section className="cards-my-hand" aria-label="Tay bài của bạn">
            <div className="cards-hand-title">
              <div>
                {campaignMode && <CharacterSprite className="cards-player-avatar" appearance={playerAppearance} customization={playerCustomization} emotion={specialReaction ? 'surprised' : myTurn ? 'happy' : 'neutral'} pose={specialReaction ? 'complain' : myTurn ? 'cheer' : 'idle'} />}
                <strong>
                  {hidden ? 'Bài đang được che' : `${person!.name} · ${hand.length} lá`}{person?.shield ? ' · ☼ Có khiên' : ''}
                </strong>
                <small>
                  {hidden
                    ? 'Chỉ mở khi đúng người cầm máy'
                    : m.onePending?.player === viewer
                      ? 'Bấm Còn 1 trước khi hết giờ!'
                      : myTurn
                        ? m.pending
                          ? 'Đỡ bằng khiên, nối phạt hoặc rút bài'
                          : m.didDraw
                            ? 'Đánh lá vừa rút hoặc bỏ lượt'
                            : 'Chạm lá viền sáng để đánh'
                        : 'Đợi hàng xóm đánh nhé'}
                  {!hidden && myTurn && !m.pending && !m.didDraw && <span className="cards-play-hint"> · Lá sáng viền là nước đi hợp lệ</span>}
                </small>
              </div>
              <button onClick={() => setShowLog(!showLog)} aria-expanded={showLog}>Nhật ký</button>
            </div>

            {!hidden && (
              <div className="cards-hand-fan">
                {hand.map(card => (
                  <button
                    key={card.id}
                    className={`cards-hand-card${canPlayCard(m, viewer, card) ? ' is-playable' : ''}`}
                    disabled={busy || !canPlayCard(m, viewer, card)}
                    aria-label={`Đánh ${cardName(card)}`}
                    onClick={() => void playCard(card)}
                  >
                    <CardFace card={card} />
                  </button>
                ))}
              </div>
            )}

            <div className="cards-controls">
              <button disabled={busy || !myTurn || m.didDraw} onClick={() => void act('draw', { player: viewer })}>
                {m.pending ? `Rút ${m.pending} lá phạt` : '✥ Rút bài'}
              </button>
              <button disabled={busy || !myTurn || !m.didDraw} onClick={() => void act('pass', { player: viewer })}>Bỏ lượt</button>
              <button disabled={busy || !myTurn} onClick={() => void act('sort', { player: viewer })}>Sắp xếp bài</button>
              <button
                className={`cards-call-one${m.onePending?.player === viewer ? ' is-urgent' : ''}`}
                disabled={busy || hidden || !person?.human || !((myTurn && hand.length <= 2) || m.onePending?.player === viewer)}
                onClick={() => void act('one', { player: viewer })}
              >
                {person?.declared ? '✓ Đã hô' : m.onePending?.player === viewer ? <UnoDeadlineText deadline={m.onePending.deadline} timeOffset={offset.current} /> : basic ? 'UNO!' : 'Còn 1!'}
              </button>
            </div>
          </section>

          {selected && !hidden && myTurn && (
            <section className="cards-color-picker" aria-label="Chọn màu và đối thủ">
              <div>
                <strong>{FACE_NAMES[selected.face]}</strong>
                <button onClick={() => setSelected(null)} aria-label="Hủy chọn bài">×</button>
              </div>
              <p>Chọn màu lượt tiếp theo</p>
              <div className="cards-color-buttons">
                {CARD_COLORS.map(color => (
                  <button key={color} className={`color-${color}`} aria-pressed={chosenColor === color} onClick={() => setChosenColor(color)}>
                    {COLOR_SHAPES[color]} {COLOR_NAMES[color]}
                  </button>
                ))}
              </div>

              {selected.face === 'swap' && (
                <label>
                  Đổi bài với
                  <select value={target} onChange={e => setTarget(Number(e.target.value))}>
                    {m.players.map((other, i) => i === viewer ? null : <option key={i} value={i}>{other.name} · {other.hand.length} lá</option>)}
                  </select>
                </label>
              )}

              <button
                className="cards-primary"
                disabled={busy}
                onClick={() => { void act('play', { player: viewer, cardId: selected.id, color: chosenColor, target }).then(ok => { if (ok) setSelected(null); }); }}
              >
                Đánh lá này →
              </button>
            </section>
          )}

          {showLog && (
            <section className="cards-history">
              <h2>Chuyển trên bàn</h2>
              <ol>{m.log.map((line, i) => <li key={i}>{line}</li>)}</ol>
            </section>
          )}
        </>
      )}
      {confirmQuit && playing && <div className="cards-exit-backdrop"><div ref={quitDialog} className="cards-exit-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cards-exit-title" aria-describedby="cards-exit-description" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); stay(); } if (event.key === 'Tab') { const buttons = quitDialog.current?.querySelectorAll('button'); if (buttons?.length) { const first = buttons[0], last = buttons[buttons.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } } }}><span aria-hidden="true">↗</span><h2 id="cards-exit-title">Rời bàn là thua ván này</h2><p id="cards-exit-description">Bạn sẽ bị tính một ván thua{m?.wager?.stake ? ` và mất ${money(m.wager.stake)} tiền cược ảo` : ''}. Đồng hồ vẫn chạy khi đang xác nhận.</p><button className="cards-primary" onClick={stay}>Ở lại chơi</button><button className="cards-forfeit-button" disabled={busy} onClick={() => void confirmExit()}>Chấp nhận thua · thoát</button></div></div>}
    </section>
  );
}
