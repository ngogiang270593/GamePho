import { localApi, newRoot, type LocalRoot } from '../src/services/offline/engine';
import { cardsApi } from '../src/services/offline/cardEngine';
import type { CardSnapshot } from '../src/game/cards';
interface Statement { bind(...args: unknown[]): Statement; first<T>(): Promise<T | null>; all<T>(): Promise<{ results: T[] }>; run(): Promise<{ meta: { changes: number } }> }
export interface Env {
 DB: { prepare(sql: string): Statement };
 ASSETS: { fetch(request: Request): Promise<Response> };
 FIREBASE_DATABASE_URL?: string;
 FIREBASE_CLIENT_EMAIL?: string;
 FIREBASE_PRIVATE_KEY?: string;
}
interface Account { id: string; username: string; display_name: string; password_hash: string; salt: string; profile: string; game: string; revision: number }
interface RoomMember { id: string; name: string; avatar: string; ready: boolean; connected: boolean; lastSeen: number }
type RoomPhase = 'waiting' | 'ready' | 'starting' | 'playing' | 'finished' | 'closed';
interface Room {
 members: RoomMember[];
 host: string;
 game: LocalRoot;
 phase: RoomPhase;
 seconds: number;
 publicRevision?: number;
 firebaseRevision?: number;
}
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const assert = (test: unknown, message: string, status = 400): void => { if (!test) throw new HttpError(status, message); };
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const digest = async (value: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export async function passwordHash(password: string, salt: string) {
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
 return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, key, 256));
}
function equal(a: string, b: string) { let mismatch = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return mismatch === 0; }
const publicAccount = (a: Account) => ({ id: a.id, username: a.username, displayName: a.display_name, profile: JSON.parse(a.profile) });
const cookie = (request: Request, token: string, age: number) => `xnl_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
async function auth(request: Request, env: Env) {
 const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)xnl_session=([a-f0-9]{64})(?:;|$)/)?.[1]; assert(token, 'Hãy đăng nhập để về xóm.', 401);
 const account = await env.DB.prepare('SELECT a.* FROM accounts a JOIN sessions s ON s.account_id=a.id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token!), Date.now()).first<Account>();
 assert(account, 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 401); return account!;
}
async function bodyOf(request: Request) {
 const text = await request.text(); assert(text.length <= 20000, 'Yêu cầu quá lớn.', 413);
 try { const value = JSON.parse(text || '{}'); assert(value && typeof value === 'object' && !Array.isArray(value), 'Dữ liệu không hợp lệ.'); return value as Record<string, unknown>; } catch { throw new HttpError(400, 'Dữ liệu không hợp lệ.'); }
}
async function throttle(request: Request, env: Env) {
 const now = Date.now(), key = await digest(`${request.headers.get('CF-Connecting-IP') ?? 'local'}:${Math.floor(now / 600000)}`);
 const row = await env.DB.prepare('INSERT INTO auth_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key, now + 600000).first<{ count: number }>();
 assert(row && row.count <= 30, 'Bạn thử quá nhiều lần. Chờ vài phút rồi thử lại nhé.', 429);
 await env.DB.prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(now).run(); await env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now).run();
}
function profileOf(body: Record<string, unknown>) {
 const result: Record<string, string> = {};
 for (const key of ['pho-xom-started','pho-xom-character-name','pho-xom-character-avatar','pho-xom-character-appearance','pho-xom-world-position']) if (typeof body[key] === 'string' && (body[key] as string).length <= 4000) result[key] = body[key] as string;
 if (body.historySave && typeof body.historySave === 'object' && !Array.isArray(body.historySave)) {
  const historySave = JSON.stringify(body.historySave);
  assert(historySave.length <= 8000, 'Hành trình online vượt giới hạn lưu trữ.', 413);
  result['xnl-history-save-v1'] = historySave;
 }
 return result;
}
async function accountApi(request: Request, env: Env, path: string, body: Record<string, unknown>) {
 if (path === '/auth/register' || path === '/auth/login') {
  assert(request.method === 'POST', 'Phương thức không hợp lệ.', 405); await throttle(request, env);
  const username = String(body.username ?? '').trim().toLowerCase(), password = String(body.password ?? '');
  assert(/^[a-z0-9_]{3,24}$/.test(username), 'Tên đăng nhập: 3–24 chữ không dấu, số hoặc dấu _.'); assert(password.length >= 10 && password.length <= 128, 'Mật khẩu cần từ 10 đến 128 ký tự.');
  let account: Account | null;
  if (path === '/auth/register') {
   const displayName = String(body.displayName ?? '').trim().slice(0, 24); assert(displayName.length >= 2, 'Tên trong xóm cần ít nhất 2 ký tự.');
   const salt = random(), id = crypto.randomUUID(), hash = await passwordHash(password, salt);
   const result = await env.DB.prepare('INSERT INTO accounts(id,username,display_name,password_hash,salt,game,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(username) DO NOTHING').bind(id, username, displayName, hash, salt, JSON.stringify(newRoot()), Date.now()).run();
   assert(result.meta.changes === 1, 'Tên đăng nhập này đã có người dùng.', 409); account = await env.DB.prepare('SELECT * FROM accounts WHERE id=?').bind(id).first<Account>();
  } else {
   account = await env.DB.prepare('SELECT * FROM accounts WHERE username=?').bind(username).first<Account>(); const hash = await passwordHash(password, account?.salt ?? 'missing-account-fixed-salt'); assert(account && equal(hash, account.password_hash), 'Tên đăng nhập hoặc mật khẩu chưa đúng.', 401);
  }
  const token = random(); await env.DB.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(await digest(token), account!.id, Date.now() + 30 * 86400000).run();
  return json(publicAccount(account!), 200, { 'Set-Cookie': cookie(request, token, 30 * 86400) });
 }
 const account = await auth(request, env);
 if (path === '/auth/me' && request.method === 'GET') return json(publicAccount(account));
 if (path === '/auth/logout' && request.method === 'POST') { const token = request.headers.get('Cookie')!.match(/xnl_session=([a-f0-9]{64})/)![1]; await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run(); return json(null, 200, { 'Set-Cookie': cookie(request, '', 0) }); }
 if (path === '/auth/profile' && request.method === 'PUT') {
  let currentProfile: unknown;
  try { currentProfile = JSON.parse(account.profile); }
  catch { throw new HttpError(500, 'Hồ sơ tài khoản trên máy chủ không hợp lệ.'); }
  assert(currentProfile && typeof currentProfile === 'object' && !Array.isArray(currentProfile), 'Hồ sơ tài khoản trên máy chủ không hợp lệ.', 500);
  const updatedProfile = { ...(currentProfile as Record<string, unknown>), ...profileOf(body) };
  await env.DB.prepare('UPDATE accounts SET profile=? WHERE id=?').bind(JSON.stringify(updatedProfile), account.id).run();
  return json(null);
 }
 throw new HttpError(404, 'Không tìm thấy chức năng tài khoản.');
}
const roomCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const validAvatars = new Set(['co-ba', 'ti', 'man', 'chu-tu']);
const roomLifetime = 30 * 60 * 1000;
const disconnectGrace = 45 * 1000;
let cachedFirebaseToken: { token: string; expiresAt: number } | null = null;

function playerProfile(body: Record<string, unknown>, fallbackName: string, fallbackAvatar = 'co-ba') {
 const name = (typeof body.name === 'string' ? body.name : fallbackName).trim().normalize('NFC');
 const avatar = typeof body.avatar === 'string' ? body.avatar : fallbackAvatar;
 assert(name.length >= 2 && name.length <= 24 && !/[\u0000-\u001f\u007f]/.test(name), 'Tên người chơi cần từ 2 đến 24 ký tự.');
 assert(validAvatars.has(avatar), 'Hãy chọn một avatar có sẵn.');
 return { name, avatar };
}
function roomCode() {
 return [...crypto.getRandomValues(new Uint8Array(6))].map(value => roomCodeAlphabet[value & 31]).join('');
}
function publicRoomView(room: Room, code: string) {
 const match = room.game.active.cards?.active;
 return {
  code, phase: room.phase, host: room.members.find(member => member.id === room.host)?.name ?? '',
  members: room.members.map(member => ({ name: member.name, avatar: member.avatar, ready: member.ready, connected: member.connected, isHost: member.id === room.host })),
  game: match ? {
   status: match.status, currentPlayer: match.turn, currentColor: match.color, direction: match.direction,
   topCard: match.discard[match.discard.length - 1] ?? null, deadline: match.deadline,
   lastAction: match.log[0] ?? '', winner: match.winner,
   players: match.players.map(player => ({ name: player.name, cardCount: player.hand.length, declared: player.declared })),
  } : null,
 };
}
function lobbyView(room: Room, code: string) {
 return room.phase === 'waiting' || room.phase === 'ready'
  ? { code, phase: room.phase, members: room.members.map(member => ({ name: member.name, avatar: member.avatar, ready: member.ready, connected: member.connected, isHost: member.id === room.host })), count: room.members.length, maxPlayers: 4 }
  : null;
}
function updateRoomPhase(room: Room) {
 const status = room.game.active.cards?.active?.status;
 if (status === 'playing') room.phase = 'playing';
 else if (status === 'finished' && room.phase !== 'waiting' && room.phase !== 'ready') room.phase = 'finished';
 else room.phase = room.members.length >= 2 && room.members.every(member => member.ready) ? 'ready' : 'waiting';
}
function ensureRoomSyncRevision(room: Room) {
 room.publicRevision ??= 0;
 room.firebaseRevision ??= 0;
}
function firebaseBase(env: Env) {
 const base = env.FIREBASE_DATABASE_URL?.replace(/\/+$/, '');
 assert(base && /^https:\/\/[a-z0-9.-]+$/i.test(base) && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY,
  'Máy chủ chưa được cấu hình Firebase Realtime Database. Hãy thêm các secrets Firebase theo hướng dẫn triển khai.', 503);
 return base;
}
function base64Url(bytes: Uint8Array) {
 let binary = '';
 for (const byte of bytes) binary += String.fromCharCode(byte);
 return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
async function firebaseAccessToken(env: Env) {
 firebaseBase(env);
 if (cachedFirebaseToken && cachedFirebaseToken.expiresAt > Date.now() + 60_000) return cachedFirebaseToken.token;
 const email = env.FIREBASE_CLIENT_EMAIL!;
 const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
 const issuedAt = Math.floor(Date.now() / 1000);
 const claim = base64Url(new TextEncoder().encode(JSON.stringify({
  iss: email, scope: 'https://www.googleapis.com/auth/firebase.database',
  aud: 'https://oauth2.googleapis.com/token', iat: issuedAt, exp: issuedAt + 3600,
 })));
 const unsigned = `${header}.${claim}`;
 const pem = env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
 let keyBytes: Uint8Array;
 try { keyBytes = Uint8Array.from(atob(pem), character => character.charCodeAt(0)); }
 catch { throw new HttpError(503, 'Khóa Firebase trên máy chủ chưa đúng định dạng.'); }
 let key: CryptoKey;
 const keyMaterial = new ArrayBuffer(keyBytes.byteLength);
 new Uint8Array(keyMaterial).set(keyBytes);
 try { key = await crypto.subtle.importKey('pkcs8', keyMaterial, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']); }
 catch { throw new HttpError(503, 'Khóa Firebase trên máy chủ chưa đúng định dạng.'); }
 const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
 const assertion = `${unsigned}.${base64Url(signature)}`;
 let response: Response;
 try {
 response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
 });
 } catch { throw new HttpError(503, 'Không thể kết nối máy chủ xác thực Firebase.'); }
 if (!response.ok) {
  console.error('Firebase service-account token request failed', { status: response.status });
  if (response.status === 400 || response.status === 401) {
   throw new HttpError(503, 'Firebase không xác thực được service account. Kiểm tra FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY trên Cloudflare.');
  }
  throw new HttpError(503, `Máy chủ xác thực Firebase trả lỗi HTTP ${response.status}. Thử lại sau hoặc kiểm tra cấu hình service account.`);
 }
 const result = await response.json() as { access_token?: string; expires_in?: number };
 if (typeof result.access_token !== 'string' || !result.access_token) throw new HttpError(503, 'Firebase không trả về access token hợp lệ.');
 const token = { token: result.access_token, expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000 };
 cachedFirebaseToken = token;
 return token.token;
}
async function publishFirebaseRoom(env: Env, code: string, room: Room | null) {
 const base = firebaseBase(env);
 const token = await firebaseAccessToken(env);
 const publicState = room ? publicRoomView(room, code) : null;
 const updates: Record<string, unknown> = {
  [`rooms/${code}/public`]: publicState,
  [`lobby/${code}`]: room ? lobbyView(room, code) : null,
 };
 let response: Response;
 try {
  response = await fetch(`${base}/.json`, {
   method: 'PATCH',
   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
   body: JSON.stringify(updates),
  });
 } catch { throw new HttpError(503, 'Không thể kết nối Firebase Realtime Database.'); }
 if (!response.ok) {
  console.error('Firebase Realtime Database room write failed', { status: response.status, roomCode: code });
  if (response.status === 401) {
   throw new HttpError(503, 'Firebase từ chối access token. Kiểm tra lại service account và FIREBASE_PRIVATE_KEY trên Cloudflare.');
  }
  if (response.status === 403) {
   throw new HttpError(503, 'Firebase từ chối quyền ghi. Cấp vai trò Firebase Realtime Database Admin cho service account trong đúng project.');
  }
  if (response.status === 404) {
   throw new HttpError(503, 'Không tìm thấy Realtime Database. Kiểm tra FIREBASE_DATABASE_URL và xác nhận database đã được tạo.');
  }
  if (response.status === 429 || response.status >= 500) {
   throw new HttpError(503, `Firebase đang giới hạn hoặc tạm thời không khả dụng (HTTP ${response.status}). Hãy thử lại sau.`);
  }
  throw new HttpError(503, `Firebase từ chối đồng bộ phòng (HTTP ${response.status}). Kiểm tra URL database và quyền của service account.`);
 }
}
function roomView(room: Room, id: string, code: string, revision: number) {
 const viewer = room.members.findIndex(member => member.id === id);
 assert(viewer >= 0, 'Bạn chưa ở trong nhóm này.', 403);
 const snapshot = cardsApi(structuredClone(room.game.active), 'hide', {}, Date.now()) as CardSnapshot;
 const match = snapshot.progress.active;
 if (match) {
  match.deadline = room.game.active.cards!.active!.deadline;
  match.handoff = false;
  match.seed = 0;
  const hidden = () => ({ id: -1, face: 'wild' as const, color: null });
  match.deck = match.deck.map(hidden);
  match.players.forEach((player, index) => {
   if (index !== viewer) player.hand = player.hand.map(hidden);
  });
  if (match.turn !== viewer) match.drawn = null;
 }
 snapshot.revision = revision;
 return {
  code, host: room.host === id, members: room.members.map(member => ({ name: member.name, avatar: member.avatar, ready: member.ready, connected: member.connected, isHost: member.id === room.host })),
  phase: room.phase, viewer, snapshot,
 };
}
async function roomsApi(request: Request, env: Env, account: Account, path: string, body: Record<string, unknown>) {
 const now = Date.now();
 if (path === '/rooms') {
  assert(request.method === 'GET', 'Phương thức không hợp lệ.', 405);
  const expired = await env.DB.prepare('SELECT code FROM rooms WHERE expires_at<=? LIMIT 20').bind(now).all<{ code: string }>();
  for (const row of expired.results) {
   await env.DB.prepare('DELETE FROM rooms WHERE code=?').bind(row.code).run();
   await publishFirebaseRoom(env, row.code, null);
  }
  const rows = await env.DB.prepare('SELECT code,data FROM rooms WHERE expires_at>? ORDER BY expires_at DESC LIMIT 50').bind(now).all<{ code: string; data: string }>();
  const rooms = rows.results.flatMap(row => {
   const room: Room = JSON.parse(row!.data);
   const summary = lobbyView(room, row.code);
   return summary ? [summary] : [];
  });
  return json(rooms);
 }
 if (path === '/rooms/create') {
  assert(request.method === 'POST', 'Phương thức không hợp lệ.', 405);
  const seconds = Number(body.turnSeconds ?? 30);
  assert([15,30,60].includes(seconds), 'Chọn thời gian 15, 30 hoặc 60 giây.');
  const profile = playerProfile(body, account.display_name, 'co-ba');
  const room: Room = {
   members: [{ id: account.id, ...profile, ready: true, connected: true, lastSeen: now }],
   host: account.id, game: newRoot(), phase: 'waiting', seconds, publicRevision: 1, firebaseRevision: 0,
  };
  for (let attempt = 0; attempt < 8; attempt++) {
   const code = roomCode();
   const inserted = await env.DB.prepare('INSERT INTO rooms(code,data,expires_at) VALUES(?,?,?) ON CONFLICT(code) DO NOTHING')
    .bind(code, JSON.stringify(room), now + roomLifetime).run();
   if (inserted.meta.changes) {
    try { await publishFirebaseRoom(env, code, room); }
    catch (error) {
     await env.DB.prepare('DELETE FROM rooms WHERE code=?').bind(code).run();
     throw error;
    }
    room.firebaseRevision = room.publicRevision;
    await env.DB.prepare('UPDATE rooms SET data=? WHERE code=? AND revision=0').bind(JSON.stringify(room), code).run();
    return json(roomView(room, account.id, code, 0));
   }
  }
  throw new HttpError(503, 'Chưa tạo được phòng. Thử lại nhé.');
 }
 const route = path.match(/^\/rooms\/([A-HJ-NP-Z2-9]{6})\/(join|state|start|ready|profile|heartbeat|lobby|leave|play|draw|pass|sort|one|catch)$/);
 assert(route, 'Mã phòng cần 6 ký tự hợp lệ.', 404);
 const [, code, action] = route!;
 assert(request.method === (action === 'state' ? 'GET' : 'POST'), 'Phương thức không hợp lệ.', 405);
 for (let retry = 0; retry < 8; retry++) {
  const row = await env.DB.prepare('SELECT data,revision FROM rooms WHERE code=? AND expires_at>?').bind(code, now).first<{ data: string; revision: number }>();
  assert(row, 'Phòng không tồn tại, đã đầy hoặc đã hết hạn.', 404);
  const room: Room = JSON.parse(row!.data);
  ensureRoomSyncRevision(room);
  const previousPublic = JSON.stringify(publicRoomView(room, code));
  let seat = room.members.findIndex(member => member.id === account.id);
  if (action === 'join') {
   if (seat < 0) {
    assert(room.phase === 'waiting' || room.phase === 'ready', 'Ván đã bắt đầu. Hãy vào lại bằng tài khoản đang chơi.');
    assert(room.members.length < 4, 'Phòng đã đủ 4 người.');
    const profile = playerProfile(body, account.display_name);
    assert(!room.members.some(member => member.name.toLocaleLowerCase() === profile.name.toLocaleLowerCase()), 'Tên này đã có người dùng trong phòng.');
    room.members.push({ id: account.id, ...profile, ready: false, connected: true, lastSeen: now });
    seat = room.members.length - 1;
   } else {
    room.members[seat].connected = true;
    room.members[seat].lastSeen = now;
    const match = room.game.active.cards?.active;
    if (match?.status === 'playing') match.players[seat].human = true;
   }
   updateRoomPhase(room);
  } else {
   assert(seat >= 0, 'Bạn chưa ở trong phòng này.', 403);
   const member = room.members[seat];
   if (action !== 'leave') {
    member.connected = true;
    member.lastSeen = now;
    if (room.host === '' && action !== 'heartbeat') room.host = member.id;
   }
   const activeMatch = room.game.active.cards?.active;
   for (let index = 0; index < room.members.length; index++) {
    const player = room.members[index];
    if (player.connected && now - player.lastSeen > disconnectGrace) {
     player.connected = false;
     if (activeMatch?.status === 'playing') activeMatch.players[index].human = false;
    }
   }
   if (room.host && !room.members.some(player => player.id === room.host && player.connected)) {
    room.host = room.members.find(player => player.connected)?.id ?? '';
   }
   if (activeMatch?.status === 'playing') {
    activeMatch.handoff = false;
    cardsApi(room.game.active, 'state', {}, now);
   }
   if (action === 'start') {
    assert(room.host === account.id, 'Chỉ chủ phòng được bắt đầu.', 403);
    assert(room.members.length >= 2 && room.members.length <= 4, 'Phòng cần từ 2 đến 4 người.');
    assert(room.members.every(player => player.ready && player.connected), 'Tất cả người chơi cần kết nối và sẵn sàng trước khi bắt đầu.');
    assert(room.phase === 'ready' || room.phase === 'finished', 'Phòng chưa sẵn sàng để bắt đầu.');
    room.phase = 'starting';
    cardsApi(room.game.active, 'start', {
     mode: 'friends', variant: 'basic', opponents: room.members.length - 1,
     names: room.members.map(player => player.name), turnSeconds: room.seconds, stake: 0, missionMode: true,
    }, now);
    room.phase = 'playing';
   } else if (action === 'ready') {
    const ready = body.ready;
    assert(typeof ready === 'boolean', 'Chọn trạng thái sẵn sàng hợp lệ.');
    assert(room.phase !== 'playing' && room.phase !== 'starting', 'Ván đang diễn ra.');
    member.ready = ready === true;
    updateRoomPhase(room);
   } else if (action === 'profile') {
    assert(!member.ready && room.phase !== 'playing' && room.phase !== 'starting', 'Bỏ trạng thái sẵn sàng trước khi đổi tên hoặc avatar.');
    const profile = playerProfile(body, member.name, member.avatar);
    assert(!room.members.some((other, index) => index !== seat && other.name.toLocaleLowerCase() === profile.name.toLocaleLowerCase()), 'Tên này đã có người dùng trong phòng.');
    Object.assign(member, profile);
    updateRoomPhase(room);
   } else if (action === 'lobby') {
    assert(activeMatch?.status === 'finished', 'Chỉ có thể về phòng chờ sau khi ván kết thúc.');
    room.phase = room.members.length >= 2 && room.members.every(player => player.ready && player.connected) ? 'ready' : 'waiting';
   } else if (action === 'leave') {
    if (room.phase === 'waiting' || room.phase === 'ready') {
     room.members.splice(seat, 1);
     if (room.host === account.id) room.host = room.members.find(player => player.connected)?.id ?? room.members[0]?.id ?? '';
     updateRoomPhase(room);
    } else {
     member.connected = false;
     member.lastSeen = 0;
     member.ready = false;
     if (activeMatch?.status === 'playing') activeMatch.players[seat].human = false;
     if (room.host === account.id) room.host = room.members.find(player => player.connected && player.id !== account.id)?.id ?? '';
    }
   } else if (action === 'heartbeat' || action === 'state') {
    if (room.host === '') room.host = room.members.find(player => player.connected)?.id ?? '';
   } else {
    assert(room.phase === 'playing' && activeMatch?.status === 'playing', 'Ván chưa bắt đầu hoặc đã kết thúc.');
    cardsApi(room.game.active, action, { ...body, player: seat }, now);
   }
  }
  const match = room.game.active.cards?.active;
  if (match?.status === 'playing') {
   match.handoff = false;
   if (match.deadline === null) match.deadline = now + room.seconds * 1000;
  }
  updateRoomPhase(room);
  if (JSON.stringify(publicRoomView(room, code)) !== previousPublic) room.publicRevision!++;
  if (room.phase === 'closed' || room.members.length === 0) {
   const removed = await env.DB.prepare('DELETE FROM rooms WHERE code=? AND revision=?').bind(code, row!.revision).run();
   if (removed.meta.changes) {
    await publishFirebaseRoom(env, code, null);
    return json(null);
   }
   continue;
  }
  const revision = row!.revision + 1;
  const result = await env.DB.prepare('UPDATE rooms SET data=?,revision=?,expires_at=? WHERE code=? AND revision=?')
   .bind(JSON.stringify(room), revision, now + roomLifetime, code, row!.revision).run();
  if (result.meta.changes) {
   if (room.publicRevision! > room.firebaseRevision!) {
    await publishFirebaseRoom(env, code, room);
    room.firebaseRevision = room.publicRevision;
    await env.DB.prepare('UPDATE rooms SET data=? WHERE code=? AND revision=?').bind(JSON.stringify(room), code, revision).run();
   }
   if (action === 'leave') return json(null);
   return json(roomView(room, account.id, code, revision));
  }
 }
 throw new HttpError(409, 'Phòng vừa thay đổi. Thử thao tác lại nhé.');
}
export default { async fetch(request: Request, env: Env): Promise<Response> {
 const url = new URL(request.url); if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
 try {
  assert(env.DB, 'Máy chủ chưa được kết nối cơ sở dữ liệu. Xem hướng dẫn triển khai Xóm Nhà Lá.', 503); const path = url.pathname.slice(4);
  assert(['GET','POST','PUT'].includes(request.method), 'Phương thức không hợp lệ.', 405);
  if (request.method !== 'GET') { assert(!request.headers.get('Origin') || request.headers.get('Origin') === url.origin, 'Yêu cầu khác nguồn không được phép.', 403); assert(request.headers.get('Sec-Fetch-Site') !== 'cross-site', 'Yêu cầu khác nguồn không được phép.', 403); assert(request.headers.get('Content-Type')?.includes('application/json'), 'Cần gửi dữ liệu JSON.', 415); }
  const body = request.method === 'GET' ? {} : await bodyOf(request);
  if (path === '/realtime-config') {
   assert(request.method === 'GET', 'Phương thức không hợp lệ.', 405);
   return json({ databaseUrl: firebaseBase(env) });
  }
  if (path.startsWith('/auth/')) return await accountApi(request, env, path, body);
  const account = await auth(request, env); if (path === '/rooms' || path.startsWith('/rooms/')) return await roomsApi(request, env, account, path, body);
  if (request.method === 'GET') assert(/^\/(game-state|toppings|upgrades|backup|backup\/slots|players\/\d+\/(statistics|achievements|history\/(orders|events|revenue)))$/.test(path), 'Phương thức không hợp lệ.', 405);
  for (let retry = 0; retry < 8; retry++) {
   const row = await env.DB.prepare('SELECT game,revision FROM accounts WHERE id=?').bind(account.id).first<{ game: string; revision: number }>(); assert(row, 'Không tìm thấy tài khoản.', 401); const root: LocalRoot = JSON.parse(row!.game);
   let result = localApi(root, request.method, path, body, Object.fromEntries(url.searchParams));
   const profile = path.endsWith('/load') ? JSON.stringify(profileOf({ ...(result as Record<string,string>), 'pho-xom-started': 'yes' })) : null;
   const saved = await env.DB.prepare('UPDATE accounts SET game=?,revision=revision+1,profile=COALESCE(?,profile) WHERE id=? AND revision=?').bind(JSON.stringify(root), profile, account.id, row!.revision).run();
   if (saved.meta.changes) { if (result instanceof Blob) return new Response(await result.text(), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); if (path.startsWith('/cards/')) result = { ...(result as CardSnapshot), revision: row!.revision + 1 }; return json(result); }
  }
  throw new HttpError(409, 'Tiến trình vừa được cập nhật trên thiết bị khác. Thử lại nhé.');
 } catch (error) { if (error instanceof HttpError) return json({ message: error.message }, error.status); if (error instanceof Error && !/D1_|SQLITE|database|constraint/i.test(error.message)) return json({ message: error.message }, 400); return json({ message: 'Máy chủ chưa sẵn sàng. Kiểm tra cấu hình D1 và bảng dữ liệu.' }, 503); }
} };
