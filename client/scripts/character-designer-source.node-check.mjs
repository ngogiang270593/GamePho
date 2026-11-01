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
  const clips = Object.fromEntries(['idle', 'walk', 'run', 'turn', 'jump'].map(action => [action, { fps: 8, loop: true, directions }]));
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
  assert.deepEqual(Object.keys(normalized.clips), ['idle', 'walk', 'run', 'turn', 'jump']);
  assert.deepEqual(normalized.clips.run.directions, normalized.clips.walk.directions);
  assert.equal(normalized.clips.jump.loop, false);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), gapX: 1 }), /vượt ra ngoài ảnh/);
  const outOfBounds = sheet();
  outOfBounds.clips.walk.directions.down = { start: 3, count: 2 };
  assert.throws(() => validateCharacterSpriteSheet(outOfBounds), /chuỗi khung hình/);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), anchorX: NaN }), /anchorX/);
  assert.throws(() => validateCharacterSpriteSheet({ ...sheet(), columns: 0 }), /columns/);
});

test('writes reusable asset and manifest and preserves other character targets', async t => {
  const root = await temporaryRoot(t);
  const first = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: sheet() });
  assert.match(first.src, /^\/assets\/character-designer\/forest-keeper-male-[a-f0-9]{16}\.png$/);
  assert.deepEqual(await readFile(join(root, 'public', first.src)), bytes);
  await saveCharacterDesignerSource(root, { target: 'field-worker:female', sheet: sheet() });
  const second = await saveCharacterDesignerSource(root, { target: 'forest-keeper:male', sheet: { ...first, scale: 1.4 } });
  assert.equal(second.src, first.src);
  const manifest = JSON.parse(await readFile(join(root, 'src/game/characterSpriteSheets.json'), 'utf8'));
  assert.equal(manifest['forest-keeper:male'].scale, 1.4);
  assert.equal(manifest['field-worker:female'].name, 'Sprite test');
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
  assert.match(saved.body.sheet.src, /^\/assets\/character-designer\//);
});
