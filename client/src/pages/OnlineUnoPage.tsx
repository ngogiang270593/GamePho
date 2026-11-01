import { useEffect, useRef, useState } from 'react';
import { useAccount } from '../components/AccountGate';
import { onlineRequest } from '../services/online/account';
import { watchLobby, watchRoom, type LobbyRoom, type RealtimeStatus } from '../services/online/firebaseRealtime';
import { CARD_COLORS, COLOR_NAMES, canPlayCard, type CardColor, type CardSnapshot, type PlayingCard } from '../game/cards';
import { CardFace } from './CardRoomPage';
import '../styles/uno-online.css';

interface RoomMember {
  name: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
}

interface RoomView {
  code: string;
  host: boolean;
  members: RoomMember[];
  phase: 'waiting' | 'ready' | 'starting' | 'playing' | 'finished' | 'closed';
  viewer: number;
  snapshot: CardSnapshot;
}

const avatars = [
  { id: 'co-ba', name: 'Cô Ba', face: '👩🏻‍🌾' },
  { id: 'ti', name: 'Tí', face: '🧒🏻' },
  { id: 'man', name: 'Mận', face: '👧🏻' },
  { id: 'chu-tu', name: 'Chú Tư', face: '👨🏻‍🌾' },
];
const avatarFace = (id: string) => avatars.find(avatar => avatar.id === id)?.face ?? '🙂';
const validRoomCode = /^[A-HJ-NP-Z2-9]{6}$/;

export function OnlineUnoPage({ onBack }: { onBack: () => void }) {
  const account = useAccount();
  const inviteCode = new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? '';
  const [code, setCode] = useState(() => localStorage.getItem('xnl-online-room') ?? '');
  const [entry, setEntry] = useState(inviteCode);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('xnl-online-name') ?? account?.displayName ?? '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('xnl-online-avatar') ?? 'co-ba');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [lobby, setLobby] = useState<LobbyRoom[]>([]);
  const [error, setError] = useState('');
  const [copyNotice, setCopyNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<RealtimeStatus>('reconnecting');
  const [seconds, setSeconds] = useState(30);
  const [now, setNow] = useState(Date.now());
  const [wild, setWild] = useState<PlayingCard | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const live = useRef(true);
  const offset = useRef(0);
  const latest = useRef<RoomView | null>(null);
  latest.current = room;

  function receive(next: RoomView) {
    if (!live.current || (latest.current?.code === next.code
      && (latest.current.snapshot.revision ?? -1) > next.snapshot.revision)) return;
    offset.current = next.snapshot.now - Date.now();
    latest.current = next;
    setRoom(next);
    setCode(next.code);
    setEntry(next.code);
    localStorage.setItem('xnl-online-room', next.code);
  }

  async function act(action: string, body: Record<string, unknown> = {}, joinCode = entry.trim().toUpperCase()) {
    if (busy) return false;
    setBusy(true);
    setError('');
    try {
      const path = action === 'create'
        ? '/rooms/create'
        : `/rooms/${action === 'join' ? joinCode : code}/${action}`;
      const next = await onlineRequest<RoomView | null>(path, body);
      if (action === 'leave') {
        localStorage.removeItem('xnl-online-room');
        setCode('');
        setRoom(null);
        latest.current = null;
      } else if (next) {
        receive(next);
      }
      if (action === 'create' || action === 'join' || action === 'profile') {
        localStorage.setItem('xnl-online-name', playerName.trim());
        localStorage.setItem('xnl-online-avatar', avatar);
      }
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa kết nối được phòng.');
      return false;
    } finally {
      if (live.current) setBusy(false);
    }
  }

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    let reading = false;
    const refresh = async () => {
      if (reading || document.hidden) return;
      reading = true;
      try {
        const rooms = await onlineRequest<LobbyRoom[]>('/rooms');
        if (active) setLobby(rooms);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Không tải được danh sách phòng.');
      } finally {
        reading = false;
      }
    };
    const stop = watchLobby(rooms => { if (active) setLobby(rooms); }, connected => {
      if (active) setConnection(connected);
    });
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => { active = false; stop(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!code) return;
    let active = true;
    let reading = false;
    const refresh = async (heartbeat = false) => {
      if (reading || document.hidden && !heartbeat) return;
      reading = true;
      try {
        const next = await onlineRequest<RoomView>(`/rooms/${code}/${heartbeat ? 'heartbeat' : 'state'}`, heartbeat ? {} : undefined);
        if (active) {
          receive(next);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Mất kết nối với phòng.');
      } finally {
        reading = false;
      }
    };
    const stop = watchRoom(code, () => void refresh(), connected => {
      if (active) setConnection(connected);
    });
    void refresh();
    const syncTimer = window.setInterval(() => void refresh(), 5000);
    const heartbeatTimer = window.setInterval(() => void refresh(true), 20000);
    return () => {
      active = false;
      stop();
      window.clearInterval(syncTimer);
      window.clearInterval(heartbeatTimer);
    };
  }, [code]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const match = room?.snapshot.progress.active;
  const playing = match?.status === 'playing';
  const viewer = room?.viewer ?? 0;
  const hand = match?.players[viewer]?.hand ?? [];
  const myTurn = Boolean(playing && match?.turn === viewer);
  const myMember = room?.members[viewer];
  const left = match?.deadline ? Math.max(0, Math.ceil((match.deadline - now - offset.current) / 1000)) : 0;

  async function back() {
    if (code && playing) {
      setConfirmQuit(true);
      return;
    }
    if (code && !await act('leave')) return;
    onBack();
  }

  async function confirmLeaveAndBack() {
    if (await act('leave')) {
      setConfirmQuit(false);
      onBack();
    }
  }

  async function play(card: PlayingCard, color?: CardColor) {
    if (!match || !canPlayCard(match, viewer, card)) return;
    if (card.color === null && !color) {
      setWild(card);
      return;
    }
    if (await act('play', { cardId: card.id, ...(color ? { color } : {}) })) setWild(null);
  }

  async function copyInvite(includeLink: boolean) {
    const invite = includeLink
      ? `${window.location.origin}${window.location.pathname}?room=${code}`
      : code;
    try {
      await navigator.clipboard.writeText(invite);
      setCopyNotice(includeLink ? 'Đã sao chép liên kết mời.' : 'Đã sao chép mã phòng.');
    } catch {
      setError('Không sao chép tự động được. Hãy chọn và chép mã phòng đang hiển thị.');
    }
  }

  const connectionLabel = connection === 'connected'
    ? 'Realtime đang kết nối'
    : connection === 'missing' ? 'Chưa cấu hình Firebase' : 'Đang kết nối lại…';

  return (
    <section className="cards-game cards-compact cards-polished cards-friendly uno-network" aria-label="UNO cùng bạn bè qua mạng">
      <header className="cards-header">
        <button className="cards-back-button" onClick={() => void back()}>← Quay lại</button>
        <h1><span>UNO</span> Xóm <span className="uno-brand-smile">☺</span></h1>
        <span className={`uno-online-badge is-${connection}`}>{connectionLabel}</span>
      </header>
      {connection === 'missing' && (
        <p className="uno-config-warning" role="status">
          Realtime chưa sẵn sàng: kiểm tra Firebase Realtime Database URL và secrets Firebase trên Cloudflare.
        </p>
      )}
      {error && <p role="alert" className="cards-error">{error}</p>}
      {copyNotice && <p role="status" className="uno-copy-notice">{copyNotice}</p>}

      {!code ? (
        <div className="uno-lobby-layout">
          <section className="uno-group-lobby">
            <h2>Rủ cả xóm vào chơi!</h2>
            <p>Mỗi người một thiết bị. Tạo phòng hoặc tham gia bằng mã 6 ký tự.</p>
            <label>Tên người chơi
              <input value={playerName} onChange={event => setPlayerName(event.target.value)} minLength={2} maxLength={24} required placeholder="Tên trong phòng" />
            </label>
            <label>Nhân vật
              <select value={avatar} onChange={event => setAvatar(event.target.value)}>
                {avatars.map(item => <option key={item.id} value={item.id}>{item.face} {item.name}</option>)}
              </select>
            </label>
            <label>Thời gian mỗi lượt
              <select value={seconds} onChange={event => setSeconds(Number(event.target.value))}>
                {[15, 30, 60].map(value => <option key={value} value={value}>{value} giây</option>)}
              </select>
            </label>
            <button className="cards-primary" disabled={busy || playerName.trim().length < 2} onClick={() => void act('create', { name: playerName, avatar, turnSeconds: seconds })}>
              Tạo phòng mới
            </button>
            <span className="uno-group-or">hoặc nhập mã phòng</span>
            <form onSubmit={event => { event.preventDefault(); void act('join', { name: playerName, avatar }); }}>
              <label>Mã phòng
                <input value={entry} onChange={event => setEntry(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} minLength={6} maxLength={6} pattern="[A-HJ-NP-Z2-9]{6}" autoCapitalize="characters" required placeholder="6 ký tự" />
              </label>
              <button disabled={busy || playerName.trim().length < 2 || !validRoomCode.test(entry.trim().toUpperCase())}>Tham gia phòng →</button>
            </form>
            <small>Chơi miễn phí · 2–4 người · Không cược tiền thật</small>
          </section>

          <section className="uno-room-list" aria-label="Phòng đang chờ">
            <div className="uno-room-list-heading"><div><span>PHÒNG ĐANG CHỜ</span><h2>Cùng vào bàn nhé</h2></div><b>{lobby.length}</b></div>
            {lobby.length === 0
              ? <p className="uno-empty-rooms">Chưa có phòng chờ. Bạn có thể tạo phòng mới.</p>
              : <ul>{lobby.map(item => (
                <li key={item.code}>
                  <div><strong>{item.code}</strong><span>{item.count}/{item.maxPlayers} người · {item.phase === 'ready' ? 'Sẵn sàng' : 'Đang chờ'}</span></div>
                  <p>{item.members.map(member => `${avatarFace(member.avatar)} ${member.name}`).join(' · ')}</p>
                  <button disabled={busy || playerName.trim().length < 2 || item.count >= item.maxPlayers} onClick={() => void act('join', { name: playerName, avatar }, item.code)}>Vào phòng</button>
                </li>
              ))}</ul>}
          </section>
        </div>
      ) : !room ? (
        <div className="uno-group-lobby"><p role="status">Đang khôi phục phòng {code}…</p><button onClick={() => { localStorage.removeItem('xnl-online-room'); setCode(''); setRoom(null); }}>Về sảnh</button></div>
      ) : room.phase === 'waiting' || room.phase === 'ready' ? (
        <section className="uno-group-lobby uno-waiting-room">
          <p>MÃ PHÒNG · MỜI BẠN BÈ</p>
          <strong className="uno-invite-code">{code}</strong>
          <div className="uno-invite-actions">
            <button onClick={() => void copyInvite(false)}>Sao chép mã</button>
            <button onClick={() => void copyInvite(true)}>Sao chép liên kết mời</button>
          </div>
          <h2>{room.phase === 'ready' ? 'Đủ mặt, sẵn sàng chia bài!' : 'Đang chờ bạn vào bàn'}</h2>
          <ul className="uno-members-list">
            {room.members.map((member, index) => (
              <li key={`${member.name}-${index}`}>
                <span className="uno-member-avatar" aria-hidden="true">{avatarFace(member.avatar)}</span>
                <span className="uno-member-name">{member.name}{index === viewer ? ' · Bạn' : ''}{member.isHost ? ' · Chủ phòng' : ''}</span>
                <span className={`uno-member-state${member.connected ? '' : ' is-disconnected'}`}>{member.connected ? member.ready ? 'Đã sẵn sàng' : 'Đang chờ' : 'Đã ngắt kết nối'}</span>
              </li>
            ))}
          </ul>
          <p>{room.members.length}/4 người · {room.host ? 'Bạn là chủ phòng' : 'Chờ chủ phòng bắt đầu'}</p>
          <div className="uno-profile-edit">
            <label>Tên trong phòng<input value={playerName} onChange={event => setPlayerName(event.target.value)} maxLength={24} /></label>
            <label>Avatar<select value={avatar} onChange={event => setAvatar(event.target.value)}>{avatars.map(item => <option key={item.id} value={item.id}>{item.face} {item.name}</option>)}</select></label>
            <button disabled={busy || Boolean(myMember?.ready) || playerName.trim().length < 2} onClick={() => void act('profile', { name: playerName, avatar })}>Lưu thông tin</button>
          </div>
          <div className="uno-room-controls">
            <button className="cards-primary" disabled={busy} onClick={() => void act('ready', { ready: !myMember?.ready })}>
              {myMember?.ready ? 'Bỏ sẵn sàng' : 'Sẵn sàng'}
            </button>
            {room.host && <button className="uno-start-button" disabled={busy || room.members.length < 2 || room.members.length > 4 || room.members.some(member => !member.ready || !member.connected)} onClick={() => void act('start')}>Bắt đầu ván</button>}
            <button onClick={() => void back()}>Rời phòng</button>
          </div>
        </section>
      ) : room.phase === 'starting' ? (
        <div className="uno-group-lobby"><p role="status">Đang chia bài…</p></div>
      ) : match && (
        <>
          <div className="cards-match-bar">
            <span>Phòng {code}</span>
            <span>{room.members.length} người</span>
            <button onClick={() => setConfirmQuit(true)}>Rời bàn</button>
          </div>
          {playing ? (
            <>
              <div className="cards-round-hud">
                <div><span>{myTurn ? 'ĐẾN LƯỢT BẠN' : `${match.players[match.turn].name} đang nghĩ…`}</span><strong>Cùng màu hoặc cùng số</strong></div>
                <b>{left}s</b>
              </div>
              <div className={`cards-turn-clock${left <= 5 ? ' is-urgent' : ''}`} role="timer" aria-label={`Còn ${left} giây`}>
                <span>◷ {left}s</span><div><i style={{ width: `${Math.min(100, left / match.rules.turnSeconds * 100)}%` }} /></div>
              </div>
              <div className="cards-table-scene">
                <div className="cards-opponents">
                  {match.players.map((player, index) => index !== viewer && (
                    <div className={`cards-opponent${match.turn === index ? ' is-turn' : ''}`} key={index}>
                      <span className="uno-neighbor-face" aria-hidden="true">{avatarFace(room.members[index]?.avatar ?? player.character)}</span>
                      <div>
                        <strong>{player.name}</strong>
                        <span>{room.members[index]?.connected === false ? 'Đã ngắt kết nối · máy tạm chơi' : `${player.hand.length} lá${player.declared ? ' · UNO!' : ''}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cards-center">
                  <button className="cards-deck" aria-label="Rút bài từ chồng" disabled={busy || !myTurn || match.didDraw} onClick={() => void act('draw')}>
                    <CardFace /><small>{match.deck.length} lá</small>
                  </button>
                  <div className="cards-discard"><CardFace card={match.discard[match.discard.length - 1]} /></div>
                  <div className="cards-table-info"><span className={`cards-active-color color-${match.color}`}>{COLOR_NAMES[match.color]}</span><strong>{match.direction === 1 ? '→' : '←'}</strong></div>
                </div>
                <p className="cards-live-log" role="status">{match.log[0]}</p>
              </div>
              <div className="cards-my-hand">
                <div className="cards-hand-title"><strong>Bài của bạn · {hand.length} lá</strong><small>Chỉ bạn thấy bài của mình</small></div>
                <div className="cards-hand-fan">{hand.map(card => (
                  <button key={card.id} className={`cards-hand-card${canPlayCard(match, viewer, card) ? ' is-playable' : ''}`} disabled={busy || !myTurn || !canPlayCard(match, viewer, card)} onClick={() => void play(card)}>
                    <CardFace card={card} />
                  </button>
                ))}</div>
                <div className="cards-controls">
                  <button disabled={busy || !myTurn || match.didDraw} onClick={() => void act('draw')}>Rút bài</button>
                  <button disabled={busy || !myTurn || !match.didDraw} onClick={() => void act('pass')}>Bỏ lượt</button>
                  <button disabled={busy || !myTurn} onClick={() => void act('sort')}>Sắp bài</button>
                  <button className="cards-call-one" disabled={busy || !(match.unoVulnerable === viewer || myTurn && hand.length <= 2)} onClick={() => void act('one')}>UNO!</button>
                </div>
                {match.unoVulnerable !== undefined && match.unoVulnerable !== viewer && (
                  <button disabled={busy} onClick={() => void act('catch')}>Bắt lỗi quên UNO! +2</button>
                )}
              </div>
            </>
          ) : (
            <section className="cards-finish">
              <span className="cards-finish-medal">🎉</span>
              <h2>{match.winner === viewer ? 'Bạn thắng rồi!' : `${match.players[match.winner ?? 0].name} thắng!`}</h2>
              <p>Kết quả ván đấu</p>
              <ol className="uno-results">{match.players.map((player, index) => ({ player, index })).sort((a, b) => a.player.hand.length - b.player.hand.length).map(({ player, index }, rank) => (
                <li key={player.name}><strong>#{rank + 1} · {player.name}</strong><span>{player.hand.length} lá còn lại{index === viewer ? ' · Bạn' : ''}</span></li>
              ))}</ol>
              {room.host ? <button className="cards-primary" disabled={busy || room.members.some(member => !member.connected)} onClick={() => void act('start')}>Chơi lại</button> : <p>Chờ chủ phòng bắt đầu ván mới.</p>}
              <button onClick={() => void act('lobby')}>Về phòng chờ</button>
              <button onClick={() => void back()}>Rời phòng</button>
            </section>
          )}
        </>
      )}

      {wild && (
        <div className="cards-color-picker" role="dialog" aria-modal="true" aria-label="Chọn màu">
          <h2>Chọn màu tiếp theo</h2>
          <div className="cards-color-buttons">{CARD_COLORS.map(color => <button key={color} className={`color-${color}`} disabled={busy} onClick={() => void play(wild, color)}>{COLOR_NAMES[color]}</button>)}</div>
          <button onClick={() => setWild(null)}>Quay lại</button>
        </div>
      )}
      {confirmQuit && (
        <div className="cards-exit-backdrop">
          <div className="cards-exit-dialog" role="alertdialog" aria-modal="true" aria-labelledby="online-exit-title">
            <h2 id="online-exit-title">Rời bàn chơi?</h2>
            <p>Ghế của bạn sẽ được máy tiếp quản; bạn có thể vào lại phòng bằng tài khoản này.</p>
            <button className="cards-primary" autoFocus onClick={() => setConfirmQuit(false)}>Ở lại chơi</button>
            <button disabled={busy} onClick={() => void confirmLeaveAndBack()}>Rời bàn</button>
          </div>
        </div>
      )}
    </section>
  );
}
