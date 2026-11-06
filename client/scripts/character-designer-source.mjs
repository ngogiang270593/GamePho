import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

export const CHARACTER_DESIGNER_ENDPOINT = '/__character-designer/save';
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_BODY_BYTES = 29 * 1024 * 1024;
const TARGETS = new Set([
  ...['male', 'female'].map(gender => `forest-keeper:${gender}`),
  ...['memory-keeper', 'fisherman-tao', 'woman-general', 'messenger', 'gate-guard', 'NPC_DAN_NONG_01', 'NPC_DAN_NONG_02', 'NPC_DAN_NONG_03'].map(id => `opening-map-npc:${id}`),
]);
const ACTIONS = ['idle', 'walk', 'run', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening'];
const DIRECTIONS = ['down', 'right', 'up', 'left'];
const ASSET_URL = /^\/assets\/character-designer\/[a-z0-9-]+\.(png|jpg|webp)$/;

class SourceSaveError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function invalid(message) { throw new SourceSaveError(message); }
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${label} phải là một object.`);
  return value;
}
function number(value, min, max, label, integer = true) {
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    invalid(`${label} phải ${integer ? 'là số nguyên' : 'là số'} từ ${min} đến ${max}.`);
  }
  return value;
}

// Keep the written manifest small and predictable, even when a request has extra fields.
export function validateCharacterSpriteSheet(input) {
  const sheet = object(input, 'Sprite');
  if (sheet.version !== 1) invalid('Phiên bản sprite không được hỗ trợ.');
  if (typeof sheet.name !== 'string' || !sheet.name.trim() || sheet.name.length > 160) invalid('Tên sprite phải có từ 1 đến 160 ký tự.');
  if (typeof sheet.src !== 'string') invalid('Thiếu ảnh sprite.');
  const result = { version: 1, name: sheet.name.trim(), src: sheet.src };
  for (const key of ['imageWidth', 'imageHeight', 'cellWidth', 'cellHeight']) result[key] = number(sheet[key], 1, 16384, key);
  for (const key of ['columns', 'rows']) result[key] = number(sheet[key], 1, 1024, key);
  for (const key of ['offsetX', 'offsetY', 'gapX', 'gapY']) result[key] = number(sheet[key], 0, 16384, key);
  result.scale = number(sheet.scale, .1, 4, 'scale', false);
  for (const key of ['anchorX', 'anchorY']) result[key] = number(sheet[key], 0, 1, key, false);
  if (sheet.singleFrameWalk !== undefined) {
    if (typeof sheet.singleFrameWalk !== 'boolean') invalid('singleFrameWalk phải là boolean.');
    result.singleFrameWalk = sheet.singleFrameWalk;
  }
  if (sheet.movementFrameCount !== undefined) {
    if (sheet.movementFrameCount !== 8) invalid('Mỗi hướng di chuyển cần 8 frame.');
    result.movementFrameCount = 8;
  }
  const width = result.offsetX + result.columns * result.cellWidth + (result.columns - 1) * result.gapX;
  const height = result.offsetY + result.rows * result.cellHeight + (result.rows - 1) * result.gapY;
  if (width > result.imageWidth || height > result.imageHeight) invalid('Lưới khung hình vượt ra ngoài ảnh sprite.');
  const total = result.columns * result.rows;
  const clips = object(sheet.clips, 'Danh sách hành động');
  result.clips = {};
  for (const action of ACTIONS) {
    if (clips[action] === undefined && action !== 'idle' && action !== 'walk') continue;
    const clip = object(clips[action], `Hành động ${action}`);
    const fps = number(clip.fps, 1, 60, `${action}.fps`, false);
    if (typeof clip.loop !== 'boolean') invalid(`${action}.loop phải là boolean.`);
    const directions = object(clip.directions, `${action}.directions`);
    result.clips[action] = { fps, loop: clip.loop, directions: {} };
    for (const direction of DIRECTIONS) {
      const range = object(directions[direction], `${action}.${direction}`);
      const start = number(range.start, 0, total - 1, `${action}.${direction}.start`);
      const count = number(range.count, 1, total, `${action}.${direction}.count`);
      if (start + count > total) invalid(`${action}.${direction}: chuỗi khung hình vượt ra ngoài ảnh.`);
      result.clips[action].directions[direction] = { start, count };
    }
  }
  // The runtime manifest uses a complete action map. Optional actions inherit a
  // stable base clip so a designer can begin with only idle + walk ranges.
  for (const action of ['run', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening']) {
    if (result.clips[action]) continue;
    const fallback = action === 'jump' || action.startsWith('npc-') ? result.clips.idle : result.clips.walk;
    result.clips[action] = {
      fps: fallback.fps,
      loop: action === 'jump' ? false : fallback.loop,
      directions: Object.fromEntries(DIRECTIONS.map(direction => [direction, { ...fallback.directions[direction] }])),
    };
  }
  result.clips = Object.fromEntries(ACTIONS.map(action => [action, result.clips[action]]));
  return result;
}

async function readImage(root, src) {
  let bytes;
  let expectedFormat;
  const data = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (data) {
    if (data[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new SourceSaveError('Ảnh sprite vượt quá 20 MB.', 413);
    bytes = Buffer.from(data[2], 'base64');
    expectedFormat = data[1];
    if (bytes.toString('base64') !== data[2]) invalid('Dữ liệu ảnh base64 không hợp lệ.');
  } else if (ASSET_URL.test(src)) {
    try { bytes = await readFile(resolve(root, 'public', src.slice(1))); }
    catch { invalid('Không tìm thấy ảnh sprite đã lưu trong source.'); }
    expectedFormat = src.endsWith('.jpg') ? 'jpeg' : src.split('.').at(-1);
  } else {
    invalid('Chỉ lưu ảnh PNG, JPEG, WebP được nhập vào tool hoặc ảnh đã lưu trong source.');
  }
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new SourceSaveError('Ảnh sprite phải có dung lượng từ 1 byte đến 20 MB.', 413);
  let metadata;
  try { metadata = await sharp(bytes, { limitInputPixels: 16384 * 16384 }).metadata(); }
  catch { invalid('Không đọc được ảnh sprite. Hãy nhập ảnh PNG, JPEG hoặc WebP hợp lệ.'); }
  if (metadata.format !== expectedFormat) invalid('Định dạng ảnh không khớp với dữ liệu đã nhập.');
  if ((metadata.pages ?? 1) > 1) invalid('Hãy dùng sprite sheet tĩnh, không dùng ảnh động.');
  return { bytes, metadata };
}

// Calls are serialized by the middleware so two saves cannot overwrite each other's entries.
export async function saveCharacterDesignerSource(root, payload) {
  object(payload, 'Yêu cầu');
  if (!TARGETS.has(payload.target)) invalid('Mẫu nhân vật hoặc giới tính không hợp lệ.');
  const sheet = validateCharacterSpriteSheet(payload.sheet);
  const { bytes, metadata } = await readImage(root, sheet.src);
  if (metadata.width !== sheet.imageWidth || metadata.height !== sheet.imageHeight) invalid('Kích thước khai báo không khớp với ảnh sprite.');
  const manifestPath = resolve(root, 'src/game/characterSpriteSheets.json');
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new SourceSaveError('Không đọc được characterSpriteSheets.json; hãy kiểm tra file source.', 500);
    manifest = {};
  }
  object(manifest, 'Danh sách sprite trong source');
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
  const filename = `${payload.target.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}-${hash}.${extension}`;
  const assetsPath = resolve(root, 'public/assets/character-designer');
  await mkdir(assetsPath, { recursive: true });
  await writeFile(resolve(assetsPath, filename), bytes);
  sheet.src = `/assets/character-designer/${filename}`;
  manifest[payload.target] = sheet;
  await mkdir(resolve(root, 'src/game'), { recursive: true });
  const temporaryPath = `${manifestPath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, manifestPath);
  return sheet;
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}
function localRequest(request) {
  if (!isLoopback(request.socket.remoteAddress)) return false;
  let address;
  try { address = new URL(`http://${request.headers.host}`); } catch { return false; }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(address.hostname)) return false;
  if (request.headers.origin) {
    let origin;
    try { origin = new URL(request.headers.origin); } catch { return false; }
    if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== address.host) return false;
  }
  return true;
}
function readBody(request) {
  return new Promise((accept, reject) => {
    let size = 0;
    let oversized = false;
    let chunks = [];
    request.on('data', chunk => {
      size += chunk.length;
      if (oversized) return;
      if (size > MAX_BODY_BYTES) {
        oversized = true;
        chunks = [];
        reject(new SourceSaveError('Yêu cầu vượt quá giới hạn 29 MB.', 413));
      } else chunks.push(chunk);
    });
    request.on('end', () => {
      if (oversized) return;
      try { accept(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new SourceSaveError('Nội dung JSON không hợp lệ.')); }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new SourceSaveError('Yêu cầu đã bị ngắt.')));
  });
}
function respond(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export function characterDesignerSource() {
  return {
    name: 'character-designer-source',
    apply: 'serve',
    configureServer(server) {
      let pendingSave = Promise.resolve();
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== CHARACTER_DESIGNER_ENDPOINT) return next();
        if (!localRequest(request)) return respond(response, 403, { error: 'Chỉ lưu source từ tool chạy trên máy này.' });
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST');
          return respond(response, 405, { error: 'Hãy dùng POST để lưu sprite.' });
        }
        if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) return respond(response, 415, { error: 'Yêu cầu phải có Content-Type application/json.' });
        if (Number(request.headers['content-length']) > MAX_BODY_BYTES) {
          request.resume();
          return respond(response, 413, { error: 'Yêu cầu vượt quá giới hạn 29 MB.' });
        }
        void readBody(request).then(payload => {
          const save = pendingSave.then(async () => ({
            target: payload.target,
            sheet: await saveCharacterDesignerSource(server.config.root, payload),
          }));
          pendingSave = save.catch(() => {});
          return save;
        }).then(result => respond(response, 200, result), error => respond(response, error.status ?? 500, {
          error: error instanceof SourceSaveError ? error.message : `Không ghi được source: ${error.message}`,
        }));
      });
    },
  };
}
