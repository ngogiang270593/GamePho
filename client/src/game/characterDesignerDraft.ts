import type { Facing } from './character';
import { ACTION_FRAME_COUNT, type FrameImage } from './characterActionFrames';
import { SPRITE_ACTIONS, SPRITE_DIRECTIONS, spriteSheetError, type CharacterSpriteSheet, type SpriteAction } from './characterSpriteSheet';
import { STARTING_CHARACTERS } from './startingCharacters';
import { OPENING_MAP_NPC_IDS, OPENING_MAP_VILLAGER_SPRITE_NPCS, openingMapNpcSpriteTarget } from './openingMapNpcs';

export type DesignerSlots = (FrameImage | null)[];
export interface DesignerDraft {
  sheet?: CharacterSpriteSheet | null;
  pending: Record<string, DesignerSlots>;
  uncompiled?: Record<string, boolean>;
}
export interface DesignerWorkspace {
  version: 1;
  target: string;
  draft: DesignerDraft;
  atlas?: CharacterSpriteSheet | null;
  atlasStart: number;
  action: SpriteAction;
  facing: Facing;
}

const DATABASE = 'xnl-character-sprites-v1';
const LOCAL_PREFIX = `${DATABASE}:draft:`;
const TIMEOUT = 2000;
const pendingSaves = new Map<string, Promise<void>>();
const clipKeys = new Set(SPRITE_ACTIONS.flatMap(action => SPRITE_DIRECTIONS.map(facing => `${action}:${facing}`)));
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

function validTarget(target: unknown): target is string {
  if (typeof target !== 'string') return false;
  const [id, gender, extra] = target.split(':');
  if (extra !== undefined) return false;
  if ((gender === 'male' || gender === 'female') && STARTING_CHARACTERS.some(character => character.id === id)) return true;
  return [...OPENING_MAP_NPC_IDS, ...OPENING_MAP_VILLAGER_SPRITE_NPCS.map(npc => npc.id)]
    .some(npcId => target === openingMapNpcSpriteTarget(npcId));
}

function frameCountForTarget(target: string): number {
  return OPENING_MAP_VILLAGER_SPRITE_NPCS.some(npc => target === openingMapNpcSpriteTarget(npc.id))
    ? 4
    : ACTION_FRAME_COUNT;
}

function validFrame(frame: unknown): frame is FrameImage {
  return object(frame) && typeof frame.name === 'string' && typeof frame.src === 'string'
    && /^(?:data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}|\/assets\/[^\s?#]+)$/.test(frame.src)
    && [frame.width, frame.height].every(value => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 16384);
}

/** A workspace may contain just one imported frame; completing an animation is a separate operation. */
export function designerWorkspaceError(value: unknown): string | null {
  if (!object(value) || value.version !== 1 || !validTarget(value.target)
    || !SPRITE_ACTIONS.includes(value.action as SpriteAction) || !SPRITE_DIRECTIONS.includes(value.facing as Facing)
    || !Number.isInteger(value.atlasStart) || (value.atlasStart as number) < 0) return 'Bản nháp nhân vật không đúng phiên bản, nhân vật, hành động hoặc hướng.';
  if (!object(value.draft) || !object(value.draft.pending)) return 'Bản nháp thiếu danh sách frame.';
  const frameCount = frameCountForTarget(value.target);
  for (const [key, slots] of Object.entries(value.draft.pending)) {
    if (!clipKeys.has(key) || !Array.isArray(slots) || slots.length !== frameCount
      || !slots.every(frame => frame === null || validFrame(frame))) return `Frame trong bản nháp không hợp lệ. Mỗi hành động và hướng có ${frameCount} ô, ô chưa nhập được để trống.`;
  }
  if (value.draft.uncompiled !== undefined && (!object(value.draft.uncompiled)
    || Object.entries(value.draft.uncompiled).some(([key, flag]) => !clipKeys.has(key) || typeof flag !== 'boolean'))) return 'Trạng thái ghép frame trong bản nháp không hợp lệ.';
  for (const sheet of [value.draft.sheet, value.atlas]) {
    if (sheet !== undefined && sheet !== null) {
      const error = spriteSheetError(sheet);
      if (error) return error;
    }
  }
  return null;
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB không khả dụng.')); return; }
    const request = indexedDB.open(DATABASE, 1);
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error('Không mở được nơi lưu bản nháp.'));
    };
    const timeout = setTimeout(fail, TIMEOUT);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('sheets')) request.result.createObjectStore('sheets');
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      clearTimeout(timeout);
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = fail;
    request.onblocked = fail;
  });
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('sheets', mode);
      let settled = false;
      const fail = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(new Error('Không hoàn tất được thao tác lưu bản nháp.'));
      };
      const timeout = setTimeout(() => { fail(); try { tx.abort(); } catch { /* Already closed. */ } }, TIMEOUT);
      let request: IDBRequest<T>;
      try { request = run(tx.objectStore('sheets')); }
      catch { fail(); return; }
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(request.result);
      };
      tx.onerror = fail;
      tx.onabort = fail;
    });
  } finally { db.close(); }
}

async function persistWorkspace(snapshot: DesignerWorkspace, serialized: string): Promise<void> {
  try {
    await transaction('readwrite', store => store.put(snapshot, `draft:${snapshot.target}`));
    try { localStorage.removeItem(`${LOCAL_PREFIX}${snapshot.target}`); } catch { /* IndexedDB saved successfully. */ }
    return;
  } catch { /* Privacy settings or quotas can disable IndexedDB; try browser storage. */ }
  try { localStorage.setItem(`${LOCAL_PREFIX}${snapshot.target}`, serialized); }
  catch { throw new Error('Chưa lưu được bản nháp vì trình duyệt chặn lưu trữ hoặc đã hết dung lượng. Tải JSON bản nháp để giữ toàn bộ ảnh và ô frame đang sửa.'); }
}

export async function saveDesignerWorkspace(workspace: DesignerWorkspace): Promise<void> {
  const error = designerWorkspaceError(workspace);
  if (error) throw new Error(error);
  // Capture before awaiting IndexedDB, so later editor changes do not alter the saved revision.
  const serialized = JSON.stringify(workspace);
  const snapshot: DesignerWorkspace = JSON.parse(serialized);
  const previous = pendingSaves.get(snapshot.target) ?? Promise.resolve();
  // A slow autosave must finish before a newer explicit save can write this target.
  const saving = previous.catch(() => {}).then(() => persistWorkspace(snapshot, serialized));
  pendingSaves.set(snapshot.target, saving);
  try { await saving; }
  finally { if (pendingSaves.get(snapshot.target) === saving) pendingSaves.delete(snapshot.target); }
}

export async function loadDesignerWorkspace(target: string): Promise<DesignerWorkspace | null> {
  if (!validTarget(target)) throw new Error('Nhân vật cần mở bản nháp không hợp lệ.');
  await pendingSaves.get(target)?.catch(() => {});
  let localReadable = false;
  try {
    const serialized = localStorage.getItem(`${LOCAL_PREFIX}${target}`);
    localReadable = true;
    if (serialized !== null) {
      try {
        const saved: unknown = JSON.parse(serialized);
        if (!designerWorkspaceError(saved) && (saved as DesignerWorkspace).target === target) return saved as DesignerWorkspace;
      } catch { /* A damaged fallback must not prevent reading a valid IndexedDB copy. */ }
    }
  } catch { /* IndexedDB may still be available. */ }
  try {
    const saved: unknown = await transaction('readonly', store => store.get(`draft:${target}`));
    return !designerWorkspaceError(saved) && (saved as DesignerWorkspace).target === target ? saved as DesignerWorkspace : null;
  } catch {
    if (localReadable) return null;
    throw new Error('Trình duyệt chặn đọc bản nháp đã lưu. Có thể nhập lại JSON bản nháp đã tải xuống.');
  }
}

export async function deleteDesignerWorkspace(target: string): Promise<void> {
  if (!validTarget(target)) throw new Error('Nhân vật cần xóa bản nháp không hợp lệ.');
  await pendingSaves.get(target)?.catch(() => {});
  await transaction('readwrite', store => store.delete(`draft:${target}`));
  try { localStorage.removeItem(`${LOCAL_PREFIX}${target}`); }
  catch { throw new Error('Đã xóa bản nháp trong cơ sở dữ liệu nhưng không xóa được bản sao dự phòng trên trình duyệt.'); }
}
