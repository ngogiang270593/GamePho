// Run with: node --test scripts/character-designer-source.node-check.mjs
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import { characterDesignerSource, saveCharacterDesignerSource, validateCharacterSpriteSheet } from './character-designer-source.mjs';

const bytes = await sharp({ create: { width: 4, height: 4, channels: 4, background: '#559944' } }).png().toBuffer();
function sheet() {
  const directions = Object.fromEntries(['down', 'right', 'up', 'left'].map((direction, start) => [direction, { start, count: 1 }]));
  const clips = Object.fromEntries(['idle', 'walk', 'run', 'attack', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening'].map(action => [action, { fps: 8, loop: action !== 'attack', directions }]));
  return {
    version: 1, name: 'Sprite test', src: `data:image/png;base64,${bytes.toString('base64')}`,
    imageWidth: 4, imageHeight: 4, cellWidth: 2, cellHeight: 2, columns: 2, rows: 2,
    offsetX: 0, offsetY: 0, gapX: 0, gapY: 0, scale: 1, anchorX: .5, anchorY: 1, clips,
  };
}
async function temporaryRoot(t) {
  const root = await mkdtemp(join(tmpdir(), 'character-designer-check-'));
  t.after(async () => {
    const absolute = resolve(root);
    assert.ok(absolute.startsWith(resolve(tmpdir()) + sep) && absolute.includes('character-designer-check-'));
    await rm(absolute, { recursive: true, force: true });
  });
  return root;
}

test('validates all frame ranges and grid bounds; optional actions may be omitted', () => {
  const optional = sheet();
  delete optional.clips.run; delete optional.clips.turn; delete optional.clips.jump;
  const normalized = validateCharacterSpriteSheet(optional);
  assert.deepEqual(Object.keys(normalized.clips), ['idle', 'walk', 'run', 'attack', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening']);
  assert.deepEqual(normalized.clips.run.directions, normalized.clips.walk.directions);
  assert.equal(normalized.clips.jump.loop, false);
  assert.equal(normalized.clips.attack.loop, false);
  assert.deepEqual(normalized.clips['npc-morning'].directions, normalized.clips.idle.directions);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), gapX: 1 }), /vượt ra ngoài ảnh/);
  const outOfBounds = sheet();
  outOfBounds.clips.walk.directions.down = { start: 3, count: 2 };
  assert.throws(() => validateCharacterSpriteSheet(outOfBounds), /chuỗi khung hình/);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), anchorX: NaN }), /anchorX/);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), columns: 0 }), /columns/);
  assert.equal(validateCharacterSpriteSheet({ ...sheet(), singleFrameWalk: true }).singleFrameWalk, true);
  assert.equal(validateCharacterSpriteSheet({ ...sheet(), singleFrameWalk: false }).singleFrameWalk, false);
  assert.equal(Object.hasOwn(validateCharacterSpriteSheet(sheet()), 'singleFrameWalk'), false);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), singleFrameWalk: 'true' }), /singleFrameWalk/);
});

test('writes reusable assets and preserves the other forest-keeper gender', async t => {
  const root = await temporaryRoot(t);
  const first = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: sheet() });
  assert.match(first.src, /^\/assets\/character-designer\/forest-keeper-male-[a-f0-9]{16}\.png$/);
  assert.deepEqual(await readFile(join(root, 'public', first.src)), bytes);
  const female = await saveCharacterDesignerSource(root, { target: 'forest-keeper:female', sheet: sheet() });
  const second = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...first, scale: 1.4 } });
  assert.equal(second.src, first.src);
  const manifest = JSON.parse(await readFile(join(root, 'src/game/characterSpriteSheets.json'), 'utf8'));
  assert.equal(manifest['forest-keeper:male'].scale, 1.4);
  assert.equal(manifest['forest-keeper:female'].name, 'Sprite test');
  assert.equal(manifest['forest-keeper:female'].src, female.src);
  await assert.rejects(saveCharacterDesignerSource(root, { target: 'field-worker:female', sheet: sheet() }), /Mẫu nhân vật hoặc giới tính không hợp lệ/);
});

test('writes sheets for the current NPC roster and rejects retired NPC targets', async t => {
  const root = await temporaryRoot(t);
  const forest = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: sheet() });
  const saved = await saveCharacterDesignerSource(root, { target: 'opening-map-npc:fisherman-tao', sheet: sheet() });
  const patrolTargets = ['gate-guard', 'patrol-archer', 'patrol-swordsman'];
  const patrolSheets = [];
  for (const id of patrolTargets) {
    patrolSheets.push(await saveCharacterDesignerSource(root, { target: `opening-map-npc:${id}`, sheet: sheet() }));
  }
  const villager = await saveCharacterDesignerSource(root, { target: 'opening-map-npc:NPC_DAN_NONG_01', sheet: sheet() });
  assert.match(saved.src, /^\/assets\/character-designer\/opening-map-npc-fisherman-tao-[a-f0-9]{16}\.png$/);
  assert.match(villager.src, /^\/assets\/character-designer\/opening-map-npc-npc-dan-nong-01-[a-f0-9]{16}\.png$/);
  const manifest = JSON.parse(await readFile(join(root, 'src/game/characterSpriteSheets.json'), 'utf8'));
  assert.deepEqual(manifest['forest-keeper:male'], forest);
  assert.deepEqual(manifest['opening-map-npc:fisherman-tao'], saved);
  for (const [index, id] of patrolTargets.entries()) {
    assert.deepEqual(manifest[`opening-map-npc:${id}`], patrolSheets[index]);
  }
  assert.deepEqual(manifest['opening-map-npc:NPC_DAN_NONG_01'], villager);
  await assert.rejects(
    saveCharacterDesignerSource(root, { target: 'opening-map-npc:market-vendor', sheet: sheet() }),
    /Mẫu nhân vật hoặc giới tính không hợp lệ/,
  );
});

test('saves a full-size single frame and every configured action without losing motion settings', async t => {
  const root = await temporaryRoot(t);
  const singleFrameBytes = await sharp({ create: { width: 256, height: 256, channels: 4, background: '#559944' } }).png().toBuffer();
  const input = {
    ...sheet(), src: `data:image/png;base64,${singleFrameBytes.toString('base64')}`,
    imageWidth: 256, imageHeight: 256, cellWidth: 256, cellHeight: 256, columns: 1, rows: 1,
    anchorX: .48, anchorY: .95, scale: .8, singleFrameWalk: true,
    clips: Object.fromEntries(['idle', 'walk', 'run', 'attack', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening'].map((action, index) => [action, {
      fps: 6 + index * 2, loop: action !== 'jump' && action !== 'attack',
      directions: Object.fromEntries(['down', 'right', 'up', 'left'].map(direction => [direction, { start: 0, count: 1 }])),
    }])),
  };
  const saved = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: input });
  const manifest = JSON.parse(await readFile(join(root, 'src/game/characterSpriteSheets.json'), 'utf8'));
  assert.deepEqual(manifest['forest-keeper:male'], { ...input, src: saved.src });
  assert.deepEqual(saved.clips['npc-morning'], input.clips['npc-morning']);
  assert.deepEqual(await readFile(join(root, 'public', saved.src)), singleFrameBytes);
  const updated = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...saved, singleFrameWalk: false } });
  assert.equal(updated.singleFrameWalk, false);
  assert.deepEqual(updated.clips, input.clips);
});

test('preserves eight real frames per direction and action when writing and reopening source', async t => {
  const root = await temporaryRoot(t);
  const frames = await Promise.all(Array.from({ length: 32 }, async (_, index) => ({
    input: await sharp({ create: {
      width: 256, height: 256, channels: 4,
      background: { r: index * 7, g: 255 - index * 5, b: index * 3, alpha: 1 },
    } }).png().toBuffer(),
    left: (index % 8) * 256, top: Math.floor(index / 8) * 256,
  })));
  const atlasBytes = await sharp({ create: {
    width: 2048, height: 1024, channels: 4, background: '#00000000',
  } }).composite(frames).png().toBuffer();
  const input = {
    ...sheet(), src: `data:image/png;base64,${atlasBytes.toString('base64')}`,
    imageWidth: 2048, imageHeight: 1024, cellWidth: 256, cellHeight: 256, columns: 8, rows: 4, movementFrameCount: 8,
    clips: Object.fromEntries(['idle', 'walk', 'run', 'attack', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening'].map((action, index) => [action, {
      fps: 6 + index * 2, loop: action !== 'jump' && action !== 'attack',
      directions: Object.fromEntries(['down', 'right', 'up', 'left'].map((direction, row) => [direction, { start: row * 8, count: 8 }])),
    }])),
  };
  const saved = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: input });
  const manifest = JSON.parse(await readFile(join(root, 'src/game/characterSpriteSheets.json'), 'utf8'));
  assert.deepEqual(manifest['forest-keeper:male'], { ...input, src: saved.src });
  assert.deepEqual(await readFile(join(root, 'public', saved.src)), atlasBytes);
  assert.deepEqual(saved.clips.walk.directions.up, { start: 16, count: 8 });
  assert.equal(saved.clips.walk.fps, 8);
  const reopened = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: saved });
  assert.deepEqual(reopened, saved);
});

test('rejects path traversal, non-image data and forged image dimensions', async t => {
  const root = await temporaryRoot(t);
  await assert.rejects(saveCharacterDesignerSource(root, { target: '../../outside:male', sheet: sheet() }), /giới tính/);
  await assert.rejects(saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...sheet(), src: '/assets/character-designer/../../outside.png' } }), /Chỉ lưu ảnh/);
  await assert.rejects(saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...sheet(), src: 'data:image/png;base64,bm90LWFuLWltYWdl' } }), /Không đọc được ảnh/);
  await assert.rejects(saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...sheet(), imageWidth: 8 } }), /không khớp/);
  await assert.rejects(saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...sheet(), src: `data:image/webp;base64,${bytes.toString('base64')}` } }), /Định dạng ảnh/);
});

test('dev endpoint accepts only same-origin local JSON POST requests', async t => {
  const root = await temporaryRoot(t);
  let middleware;
  characterDesignerSource().configureServer({ config: { root }, middlewares: { use(handler) { middleware = handler; } } });
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise(accept => server.listen(0, '127.0.0.1', accept));
  t.after(() => new Promise(accept => server.close(accept)));
  const port = server.address().port;
  function send({ method = 'POST', path = '/__character-designer/save', headers = {}, body = JSON.stringify({ target: 'forest-keeper:male', sheet: sheet() }) } = {}) {
    return new Promise((accept, reject) => {
      const req = request({ host: '127.0.0.1', port, path, method, headers: { 'content-type': 'application/json', ...headers } }, res => {
        let response = '';
        res.setEncoding('utf8'); res.on('data', chunk => { response += chunk; });
        res.on('end', () => accept({ status: res.statusCode, body: response ? JSON.parse(response) : null }));
      });
      req.on('error', reject); req.end(body);
    });
  }
  assert.equal((await send({ headers: { origin: 'https://other.example' } })).status, 403);
  assert.equal((await send({ headers: { host: 'other.example' } })).status, 403);
  assert.equal((await send({ method: 'GET', body: '' })).status, 405);
  assert.equal((await send({ headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await send({ body: '{invalid' })).status, 400);
  assert.equal((await send({ path: '/other', body: '' })).status, 404);
  const saved = await send({ headers: { origin: `http://127.0.0.1:${port}` } });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.target, 'forest-keeper:male');
  assert.match(saved.body.sheet.src, /^\/assets\/character-designer\//);
});
