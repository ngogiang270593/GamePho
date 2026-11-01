import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import worker from '../dist-online/_worker.js';

const db = new DatabaseSync(':memory:');
db.exec(fs.readFileSync(new URL('../cloudflare/schema.sql', import.meta.url), 'utf8'));
const keyPair = await webcrypto.subtle.generateKey({
  name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
}, true, ['sign', 'verify']);
const privateDer = new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', keyPair.privateKey));
const privateKey = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(privateDer).toString('base64')}\n-----END PRIVATE KEY-----`;
const firebaseData = new Map();
let failNextFirebaseWrite = false;
let nextFirebaseWriteStatus = 503;
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url === 'https://oauth2.googleapis.com/token') {
    return Response.json({ access_token: 'test-firebase-access-token', expires_in: 3600 });
  }
  if (url.endsWith('/.json') && init.method === 'PATCH') {
    if (failNextFirebaseWrite) {
      failNextFirebaseWrite = false;
      return new Response('temporary Firebase failure', { status: nextFirebaseWriteStatus });
    }
    for (const [path, value] of Object.entries(JSON.parse(init.body))) firebaseData.set(path, value);
    return new Response('null', { status: 200 });
  }
  return nativeFetch(input, init);
};

const env = {
  DB: {
    prepare(sql) {
      const query = db.prepare(sql);
      let args = [];
      const statement = {
        bind(...values) { args = values; return statement; },
        async first() { return query.get(...args) ?? null; },
        async all() { return { results: query.all(...args) }; },
        async run() { const result = query.run(...args); return { meta: { changes: Number(result.changes) } }; },
      };
      return statement;
    },
  },
  ASSETS: { fetch: async () => new Response('asset') },
  FIREBASE_DATABASE_URL: 'https://xnl-test-default-rtdb.firebaseio.com',
  FIREBASE_CLIENT_EMAIL: 'test-account@xnl-test.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: privateKey,
};
const jars = {};
let count = 0;
async function api(user, path, body, method = body === undefined ? 'GET' : 'POST', extra = {}) {
  const request = new Request(`http://localhost/api${path}`, {
    method,
    headers: {
      ...(jars[user] ? { Cookie: jars[user] } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...extra,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = await worker.fetch(request, env);
  const cookie = response.headers.get('Set-Cookie');
  if (cookie) jars[user] = cookie.split(';')[0];
  return { status: response.status, data: await response.json(), cookie };
}
const ok = response => {
  assert.equal(response.status, 200, JSON.stringify(response));
  count++;
  return response.data;
};

assert.equal((await api('guest', '/game-state')).status, 401);
assert.deepEqual(ok(await api('guest', '/realtime-config')), {
  databaseUrl: 'https://xnl-test-default-rtdb.firebaseio.com',
});
const configuredDatabaseUrl = env.FIREBASE_DATABASE_URL;
delete env.FIREBASE_DATABASE_URL;
assert.equal((await api('guest', '/realtime-config')).status, 503);
env.FIREBASE_DATABASE_URL = configuredDatabaseUrl;
const account = ok(await api('a', '/auth/register', { username: 'alice', password: 'a-strong-password', displayName: 'Mận' }));
assert(!('password_hash' in account));
assert.match(jars.a, /^xnl_session=/);
assert.equal((await api('bad', '/auth/register', { username: 'alice', password: 'a-strong-password', displayName: 'Khác' })).status, 409);
assert.equal((await api('bad', '/auth/login', { username: 'alice', password: 'wrong-password' })).status, 401);
ok(await api('b', '/auth/register', { username: 'bob', password: 'another-strong-pass', displayName: 'Tí' }));
ok(await api('c', '/auth/register', { username: 'carol', password: 'third-strong-pass', displayName: 'Cô Ba' }));
ok(await api('d', '/auth/register', { username: 'dung', password: 'fourth-strong-pass', displayName: 'Chú Tư' }));
ok(await api('e', '/auth/register', { username: 'embe', password: 'fifth-strong-pass', displayName: 'Em Bé' }));
assert.equal(db.prepare('SELECT password_hash FROM accounts WHERE username=?').get('alice').password_hash.length, 64);

const profile = { 'pho-xom-started': 'yes', 'pho-xom-character-name': 'Mận Đồng Lúa' };
ok(await api('a', '/auth/profile', profile, 'PUT'));
const historySave = { version: 1, progress: { gold: 900, fame: 25 }, profile: { displayName: 'Mận Đồng Lúa' } };
ok(await api('a', '/auth/profile', { historySave }, 'PUT'));
ok(await api('a', '/auth/profile', profile, 'PUT'));
ok(await api('a2', '/auth/login', { username: 'alice', password: 'a-strong-password' }));
const accountProfile = ok(await api('a2', '/auth/me')).profile;
assert.equal(accountProfile['pho-xom-character-name'], 'Mận Đồng Lúa');
assert.deepEqual(JSON.parse(accountProfile['xnl-history-save-v1']), historySave);
await Promise.all([
  api('a', '/backup/slots/1', profile, 'PUT'),
  api('a2', '/backup/slots/2', profile, 'PUT'),
]).then(results => results.forEach(ok));
assert(ok(await api('a', '/backup/slots')).slice(0, 2).every(slot => slot.savedAt));
assert(ok(await api('b', '/backup/slots')).every(slot => slot.savedAt === null));

const group = ok(await api('a', '/rooms/create', { name: 'Mận', avatar: 'man', turnSeconds: 15 }));
const code = group.code;
assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
assert.equal(group.members[0].name, 'Mận');
assert.equal(group.host, true);
assert.ok(firebaseData.get(`rooms/${code}/public`));
assert.equal(firebaseData.get(`lobby/${code}`).count, 1);
assert.equal((await api('c', `/rooms/${code}/state`)).status, 403);

const joinBody = { name: 'Tí', avatar: 'ti' };
const joined = ok(await api('b', `/rooms/${code}/join`, joinBody));
assert.equal(joined.phase, 'waiting');
assert.equal((await api('a', `/rooms/${code}/start`, {})).status, 400);
assert.equal((await api('c', `/rooms/${code}/join`, { name: 'tí', avatar: 'co-ba' })).status, 400);
ok(await api('c', `/rooms/${code}/join`, { name: 'Cô Ba', avatar: 'co-ba' }));
ok(await api('d', `/rooms/${code}/join`, { name: 'Chú Tư', avatar: 'chu-tu' }));
assert.equal((await api('e', `/rooms/${code}/join`, { name: 'Em Bé', avatar: 'ti' })).status, 400);
const listed = ok(await api('a', '/rooms'));
assert.equal(listed.find(room => room.code === code).count, 4);
assert.equal(firebaseData.get(`lobby/${code}`).members.length, 4);
assert.equal((await api('b', `/rooms/${code}/start`, {})).status, 403);
for (const user of ['b', 'c', 'd']) ok(await api(user, `/rooms/${code}/ready`, { ready: true }));
assert.equal(ok(await api('a', `/rooms/${code}/state`)).phase, 'ready');

const start = ok(await api('a', `/rooms/${code}/start`, {}));
const match = start.snapshot.progress.active;
assert.equal(start.phase, 'playing');
assert.equal(match.players.length, 4);
assert.equal(match.players[0].hand.length, 7);
assert(match.players.slice(1).every(player => player.hand.every(card => card.id === -1)));
assert(match.deck.every(card => card.id === -1));
assert.equal(match.seed, 0);
assert(match.deadline > Date.now());
const publicState = firebaseData.get(`rooms/${code}/public`);
assert.equal(publicState.phase, 'playing');
assert.equal(publicState.game.players.length, 4);
assert.equal(publicState.game.players[0].cardCount, 7);
assert.equal(JSON.stringify(publicState).includes('"hand"'), false);
assert.equal(JSON.stringify(publicState).includes('"deck"'), false);
assert.equal(firebaseData.get(`lobby/${code}`), null);
const rules = JSON.parse(fs.readFileSync(new URL('../firebase.database.rules.json', import.meta.url), 'utf8')).rules;
assert.equal(rules['.write'], false);
assert.equal(rules.lobby['.read'], true);
assert.equal(rules.rooms.$roomId.public['.read'], true);

const other = ok(await api('b', `/rooms/${code}/state`));
assert.equal(other.viewer, 1);
assert(other.snapshot.progress.active.players[0].hand.every(card => card.id === -1));
assert.equal((await api('b', `/rooms/${code}/draw`, { player: 0 })).status, 400);
const draw = ok(await api('a', `/rooms/${code}/draw`, {}));
if (draw.snapshot.progress.active.turn === 0) ok(await api('a', `/rooms/${code}/pass`, {}));
assert.equal(firebaseData.get(`rooms/${code}/public`).game.currentPlayer, 1);
assert.equal(ok(await api('b', `/rooms/${code}/state`)).snapshot.progress.active.turn, 1);

const row = db.prepare('SELECT data FROM rooms WHERE code=?').get(code);
const room = JSON.parse(row.data);
room.game.active.cards.active.deadline = Date.now() - 10;
db.prepare('UPDATE rooms SET data=? WHERE code=?').run(JSON.stringify(room), code);
const timeout = ok(await api('a', `/rooms/${code}/state`));
assert.equal(timeout.snapshot.progress.active.turn, 2);
assert(timeout.snapshot.progress.active.players[1].hand.length >= 8);
assert.equal(firebaseData.get(`rooms/${code}/public`).game.currentPlayer, 2);
assert.equal((await api('a', '/auth/profile', profile, 'PUT', { Origin: 'https://evil.test' })).status, 403);

ok(await api('b', `/rooms/${code}/leave`, {}));
const disconnected = ok(await api('a', `/rooms/${code}/state`));
assert.equal(disconnected.phase, 'playing');
assert.equal(disconnected.members[1].connected, false);
assert.equal(firebaseData.get(`rooms/${code}/public`).members[1].connected, false);
const rejoined = ok(await api('b', `/rooms/${code}/join`, joinBody));
assert.equal(rejoined.members[1].connected, true);

const twoPlayerRoom = ok(await api('a', '/rooms/create', { name: 'Mận', avatar: 'man', turnSeconds: 15 }));
const twoPlayerCode = twoPlayerRoom.code;
ok(await api('b', `/rooms/${twoPlayerCode}/join`, joinBody));
failNextFirebaseWrite = true;
nextFirebaseWriteStatus = 403;
const firebasePermissionError = await api('b', `/rooms/${twoPlayerCode}/ready`, { ready: true });
assert.equal(firebasePermissionError.status, 503);
assert.match(firebasePermissionError.data.message, /Firebase Realtime Database Admin/);
nextFirebaseWriteStatus = 503;
assert.equal(ok(await api('a', `/rooms/${twoPlayerCode}/state`)).phase, 'ready');
const twoPlayerStart = ok(await api('a', `/rooms/${twoPlayerCode}/start`, {}));
assert.equal(twoPlayerStart.snapshot.progress.active.players.length, 2);
assert.equal(ok(await api('b', `/rooms/${twoPlayerCode}/state`)).viewer, 1);
ok(await api('a', `/rooms/${twoPlayerCode}/leave`, {}));
assert.equal(ok(await api('b', `/rooms/${twoPlayerCode}/state`)).host, true);

assert.equal((await api('a', '/auth/profile', profile, 'PUT', { Origin: 'https://evil.test' })).status, 403);
ok(await api('a2', '/auth/logout', {}));
assert.equal((await api('a2', '/auth/me')).status, 401);
ok(await api('a', '/auth/me'));
console.log(`PASS ${count} online checks: auth, isolated saves, 6-character rooms, duplicate names, 2–4 seats, ready/start, private hands, Firebase public sync, timed turns, reconnect, CSRF, logout.`);
