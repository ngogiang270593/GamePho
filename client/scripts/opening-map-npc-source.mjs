import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateMapCharacterDrafts } from '../src/game/mapCharacterDraftValidation.mjs';

export const MAP_CHARACTER_DESIGNER_ENDPOINT = '/__character-designer/save-map-characters';
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAP_ID = 'opening-map';
class SourceSaveError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function validateOpeningMapCharacters(input) {
  if (!Array.isArray(input) || input.length > 300) throw new SourceSaveError('Danh sách nhân vật phải là mảng tối đa 300 nhân vật.');
  // Old map drafts remain in browser storage. Only the latest map is written here.
  const opening = input.filter(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.mapId !== 'string') {
      throw new SourceSaveError('Nhân vật thiếu mã bản đồ hợp lệ.');
    }
    return item.mapId === MAP_ID;
  });
  try { return validateMapCharacterDrafts(opening, [MAP_ID]); }
  catch (error) { throw new SourceSaveError(error.message); }
}

export async function saveOpeningMapNpcSource(root, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new SourceSaveError('Yêu cầu lưu không hợp lệ.');
  const updates = validateOpeningMapCharacters(payload.characters);
  const folder = resolve(root, 'src/game');
  const path = resolve(folder, 'openingMapNpcs.json');
  let existing = {};
  try { existing = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new SourceSaveError('Không đọc được openingMapNpcs.json. Hãy kiểm tra file source trước khi lưu.', 500);
  }
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) throw new SourceSaveError('openingMapNpcs.json phải là danh sách theo mã nhân vật.', 500);
  let previous;
  try { previous = validateOpeningMapCharacters(Object.values(existing)); }
  catch { throw new SourceSaveError('openingMapNpcs.json chứa nhân vật không hợp lệ. Hãy kiểm tra file source trước khi lưu.', 500); }
  const merged = new Map(previous.map(item => [item.id, item]));
  for (const item of updates) merged.set(item.id, item);
  const characters = [...merged.values()];
  const manifest = Object.fromEntries(characters.map(item => [item.id, item]));
  await mkdir(folder, { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  return characters;
}

function isLoopback(address) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);
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
        reject(new SourceSaveError('Danh sách nhân vật vượt quá 2 MB.', 413));
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

export function openingMapNpcSource() {
  return {
    name: 'opening-map-npc-source',
    apply: 'serve',
    configureServer(server) {
      let pendingSave = Promise.resolve();
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== MAP_CHARACTER_DESIGNER_ENDPOINT) return next();
        if (!localRequest(request)) return respond(response, 403, { error: 'Chỉ lưu source từ tool chạy trên máy này.' });
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST');
          return respond(response, 405, { error: 'Hãy dùng POST để lưu nhân vật.' });
        }
        if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) return respond(response, 415, { error: 'Yêu cầu phải có Content-Type application/json.' });
        if (Number(request.headers['content-length']) > MAX_BODY_BYTES) {
          request.resume();
          return respond(response, 413, { error: 'Danh sách nhân vật vượt quá 2 MB.' });
        }
        void readBody(request).then(payload => {
          const save = pendingSave.then(() => saveOpeningMapNpcSource(server.config.root, payload));
          pendingSave = save.catch(() => {});
          return save;
        }).then(characters => respond(response, 200, { characters }), error => respond(response, error.status ?? 500, {
          error: error instanceof SourceSaveError ? error.message : `Không ghi được source: ${error.message}`,
        }));
      });
    },
  };
}
