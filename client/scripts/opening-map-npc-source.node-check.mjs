// Run with: node --test scripts/opening-map-npc-source.node-check.mjs
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { MAP_CHARACTER_DESIGNER_ENDPOINT, openingMapNpcSource, saveOpeningMapNpcSource, validateOpeningMapCharacters } from './opening-map-npc-source.mjs';
import { OPENING_MAP_WIDTH, OPENING_MAP_HEIGHT } from '../src/game/openingMapBounds.mjs';

function character(overrides = {}) {
  return {
    id: 'memory-keeper', mapId: 'opening-map', name: 'Bà lão bến sông', alias: 'Bà Mẹ Quê', locationLabel: 'Bến Thuyền',
    appearance: { gender: 'female', hair: 'bun', eyes: 'smile', face: 'oval', outfit: 'tuthan', accessory: 'none', skin: 'tan', hairColor: 'ink', pet: 'none' },
    point: { x: 236, y: 565 }, facing: 'down', pose: 'gossip', kind: 'quest', scale: 1, hidden: false,
    role: 'Người giữ bến', mission: 'Giao nhiệm vụ đầu tiên', dialogue: 'Con hãy hỏi thăm bà con.',
    ...overrides,
  };
}
function design() {
  return {
    faceShape: 'wrinkled', faceWidth: 95, faceHeight: 105, jawWidth: 70, foreheadWidth: 80, skinTone: 'tan', eyeShape: 'smile', eyeSpacing: 40,
    eyebrowShape: 'silver', noseShape: 'round', mouthShape: 'gentle', facialMarks: ['wrinkle'], hairstyle: 'silver-bun', hairColor: 'ink', beardStyle: 'none',
    bodyType: 'elderly-bent', height: .84, shoulderWidth: .88, bodyWidth: .92, outfit: 'elder-cloak', outfitColor: '#756a4c', accentColor: '#b7a78a', trouserColor: '#45413b',
    accessory: 'none', weapon: 'walking-staff', heldItem: 'none', posture: 'stooped', animationSet: 'storytelling', occupation: 'Người giữ bến', historicalRole: 'Nhân vật game',
  };
}
async function temporaryRoot(t) {
  const root = await mkdtemp(join(tmpdir(), 'opening-npc-check-'));
  t.after(async () => {
    const absolute = resolve(root);
    assert.ok(absolute.startsWith(resolve(tmpdir()) + sep) && absolute.includes('opening-npc-check-'));
    await rm(absolute, { recursive: true, force: true });
  });
  return root;
}

test('preserves rich records, merges previous source entries, and filters legacy map drafts', async t => {
  const root = await temporaryRoot(t);
  const elder = character({ design: design() });
  assert.deepEqual(await saveOpeningMapNpcSource(root, { characters: [elder, { mapId: 'old-map', id: 'legacy' }] }), [elder]);
  const fisherman = character({ id: 'fisherman-tao', name: 'Anh thợ chài', alias: 'Tào', point: { x: 3500, y: 1550 } });
  await saveOpeningMapNpcSource(root, { characters: [fisherman] });
  const hiddenElder = { ...elder, hidden: true, dialogue: 'Lời thoại mới' };
  const saved = await saveOpeningMapNpcSource(root, { characters: [hiddenElder] });
  assert.deepEqual(saved, [hiddenElder, fisherman]);
  const manifest = JSON.parse(await readFile(join(root, 'src/game/openingMapNpcs.json'), 'utf8'));
  assert.deepEqual(manifest, { 'memory-keeper': hiddenElder, 'fisherman-tao': fisherman });
});

test('rejects malformed records before overwriting the existing source', async t => {
  const root = await temporaryRoot(t);
  await saveOpeningMapNpcSource(root, { characters: [character()] });
  const path = join(root, 'src/game/openingMapNpcs.json');
  const before = await readFile(path, 'utf8');
  for (const entry of [character({ id: '../../outside' }), character({ point: { x: OPENING_MAP_WIDTH + 1, y: 1500 } }), character({ point: { x: 2160, y: OPENING_MAP_HEIGHT + 1 } }), character({ facing: 'north' }), character({ hidden: 'true' }), character({ design: {} })]) {
    await assert.rejects(saveOpeningMapNpcSource(root, { characters: [entry] }));
  }
  assert.throws(() => validateOpeningMapCharacters([character(), character()]), /Trùng mã/);
  assert.equal(await readFile(path, 'utf8'), before);
});

async function withServer(t, root) {
  let middleware;
  openingMapNpcSource().configureServer({ config: { root }, middlewares: { use: handler => { middleware = handler; } } });
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise(accept => server.listen(0, '127.0.0.1', accept));
  t.after(() => new Promise(accept => server.close(accept)));
  const port = server.address().port;
  return ({ method = 'POST', headers = {}, body = JSON.stringify({ characters: [character()] }) } = {}) => new Promise((accept, reject) => {
    const call = request({ hostname: '127.0.0.1', port, path: MAP_CHARACTER_DESIGNER_ENDPOINT, method, agent: false, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => accept({ status: response.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }));
    });
    call.on('error', error => reject(new Error(`${method} ${JSON.stringify(headers)} (${body.length} bytes): ${error.message}`)));
    call.end(body);
  });
}

test('local endpoint saves and rejects foreign origins, methods, content types, oversized and invalid requests', async t => {
  const root = await temporaryRoot(t);
  const send = await withServer(t, root);
  const success = await send();
  assert.equal(success.status, 200);
  assert.deepEqual(success.body, { characters: [character()] });
  assert.equal((await send({ headers: { Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await send({ headers: { Host: 'untrusted.example' } })).status, 403);
  assert.equal((await send({ method: 'GET' })).status, 405);
  assert.equal((await send({ headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await send({ body: '{bad json' })).status, 400);
  assert.equal((await send({ body: JSON.stringify({ characters: [character({ pose: 'bad' })] }) })).status, 400);
  assert.equal((await send({ body: ' '.repeat(2 * 1024 * 1024 + 1) })).status, 413);
});
