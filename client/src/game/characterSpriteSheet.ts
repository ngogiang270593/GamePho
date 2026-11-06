import { useSyncExternalStore } from 'react';
import type { CharacterGender, Facing } from './character';
import type { OpeningMapNpcDayPeriod } from './mapCharacterDraft';
import type { PlayableCharacterId } from './startingCharacters';
import sourceSheets from './characterSpriteSheets.json';
import { OPENING_MAP_VILLAGER_SPRITE_SHEETS } from './openingMapVillagerSpriteSheets';

export const NPC_SCHEDULE_SPRITE_ACTIONS = ['npc-morning', 'npc-noon', 'npc-evening'] as const;
export const NPC_WORK_SPRITE_ACTION = 'npc-morning';
export const SPRITE_ACTIONS = ['idle', 'walk', 'run', 'turn', 'jump', ...NPC_SCHEDULE_SPRITE_ACTIONS] as const;
export type SpriteAction = typeof SPRITE_ACTIONS[number];
export const GAME_SPRITE_ACTIONS = ['idle', 'walk', 'run'] as const satisfies readonly SpriteAction[];
export const SPRITE_ACTION_LABELS: Record<SpriteAction, string> = {
  idle: 'Đứng', walk: 'Đi bộ', run: 'Chạy', turn: 'Xoay', jump: 'Nhảy',
  'npc-morning': 'NPC · Động tác đặc trưng', 'npc-noon': 'NPC · Buổi trưa (cũ)', 'npc-evening': 'NPC · Buổi tối (cũ)',
};
export const NPC_SCHEDULE_SPRITE_ACTION: Record<OpeningMapNpcDayPeriod, SpriteAction> = {
  morning: 'npc-morning',
  noon: 'npc-noon',
  evening: 'npc-evening',
};
export const SPRITE_DIRECTIONS: Facing[] = ['down', 'right', 'up', 'left'];
export interface SpriteClipRange { start: number; count: number }
export interface SpriteClip {
  fps: number;
  loop: boolean;
  directions: Record<Facing, SpriteClipRange>;
}
export interface CharacterSpriteSheet {
  version: 1;
  name: string;
  src: string;
  imageWidth: number;
  imageHeight: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  gapX: number;
  gapY: number;
  scale: number;
  anchorX: number;
  anchorY: number;
  singleFrameWalk?: boolean;
  movementFrameCount?: 8;
  clips: Record<SpriteAction, SpriteClip>;
}

export function spriteSheetTarget(template: PlayableCharacterId | string, gender: CharacterGender) {
  return `${template}:${gender}`;
}

export function makeSpriteSheet(src: string, imageWidth: number, imageHeight: number, name = 'Sprite của bạn', columns = 1, rows = 1): CharacterSpriteSheet {
  const clips = Object.fromEntries(SPRITE_ACTIONS.map(action => [action, {
    fps: action === 'run' ? 12 : 8,
    loop: action !== 'jump',
    directions: Object.fromEntries(SPRITE_DIRECTIONS.map((direction, row) => [direction, {
      start: Math.min(row, rows - 1) * columns,
      count: action === 'idle' || action.startsWith('npc-') ? 1 : columns,
    }])),
  }])) as CharacterSpriteSheet['clips'];
  return {
    version: 1, name, src, imageWidth, imageHeight,
    columns, rows, cellWidth: Math.floor(imageWidth / columns), cellHeight: Math.floor(imageHeight / rows),
    offsetX: 0, offsetY: 0, gapX: 0, gapY: 0, scale: 1, anchorX: .5, anchorY: .97,
    singleFrameWalk: columns === 1 && rows === 1, clips,
  };
}

export function spriteSheetError(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Cấu hình sprite không hợp lệ.';
  const sheet = value as CharacterSpriteSheet;
  if (sheet.version !== 1 || typeof sheet.name !== 'string' || typeof sheet.src !== 'string'
    || !(/^(data:image\/(png|jpeg|webp|svg\+xml)(;[^,]+)?,|\/(?!\/))/.test(sheet.src))) return 'Cần ảnh PNG, JPEG, WebP hoặc SVG và cấu hình phiên bản 1.';
  for (const key of ['imageWidth', 'imageHeight', 'cellWidth', 'cellHeight', 'columns', 'rows'] as const) {
    if (!Number.isInteger(sheet[key]) || sheet[key] < 1 || sheet[key] > (key === 'columns' || key === 'rows' ? 1024 : 16384)) return 'Kích thước ảnh, ô và số cột/hàng phải là số nguyên dương.';
  }
  for (const key of ['offsetX', 'offsetY', 'gapX', 'gapY'] as const) {
    if (!Number.isInteger(sheet[key]) || sheet[key] < 0) return 'Lề và khoảng cách ô phải là số nguyên không âm.';
  }
  if (sheet.offsetX + sheet.columns * sheet.cellWidth + (sheet.columns - 1) * sheet.gapX > sheet.imageWidth
    || sheet.offsetY + sheet.rows * sheet.cellHeight + (sheet.rows - 1) * sheet.gapY > sheet.imageHeight) return 'Lưới đang vượt khỏi ảnh. Giảm số cột/hàng, kích thước ô hoặc lề.';
  if (!Number.isFinite(sheet.scale) || sheet.scale < .1 || sheet.scale > 4
    || !Number.isFinite(sheet.anchorX) || sheet.anchorX < 0 || sheet.anchorX > 1
    || !Number.isFinite(sheet.anchorY) || sheet.anchorY < 0 || sheet.anchorY > 1) return 'Tỉ lệ phải từ 0,1 đến 4; tâm và chân neo phải từ 0 đến 1.';
  if (sheet.singleFrameWalk !== undefined && typeof sheet.singleFrameWalk !== 'boolean') return 'Chuyển động cho ảnh một frame phải là bật hoặc tắt.';
  if (sheet.movementFrameCount !== undefined && sheet.movementFrameCount !== 8) return 'Mỗi hướng di chuyển cần 8 frame.';
  for (const action of SPRITE_ACTIONS) {
    const clip = sheet.clips?.[action];
    if (!clip) {
      if (action === 'idle' || action === 'walk') return 'Sprite cần ít nhất hành động đứng và đi bộ.';
      continue;
    }
    if (!Number.isFinite(clip.fps) || clip.fps < 1 || clip.fps > 60 || typeof clip.loop !== 'boolean') return 'Mỗi hành động cần tốc độ từ 1 đến 60 FPS.';
    for (const direction of SPRITE_DIRECTIONS) {
      const range = clip.directions?.[direction];
      if (!range || !Number.isInteger(range.start) || !Number.isInteger(range.count)
        || range.start < 0 || range.count < 1 || range.start + range.count > sheet.columns * sheet.rows) return 'Dải frame của hành động đang vượt lưới. Frame đầu đánh số từ 1 trong tool.';
    }
  }
  return null;
}

export function spriteCell(sheet: CharacterSpriteSheet, index: number) {
  return {
    x: sheet.offsetX + (index % sheet.columns) * (sheet.cellWidth + sheet.gapX),
    y: sheet.offsetY + Math.floor(index / sheet.columns) * (sheet.cellHeight + sheet.gapY),
  };
}

type LegacySpriteSheet = Omit<CharacterSpriteSheet, 'clips'> & { clips: Partial<Record<SpriteAction, SpriteClip>> };
const source: Record<string, CharacterSpriteSheet> = Object.fromEntries([...Object.entries(sourceSheets), ...Object.entries(OPENING_MAP_VILLAGER_SPRITE_SHEETS)].map(([target, raw]) => {
  const legacy = raw as LegacySpriteSheet;
  const clips = Object.fromEntries(SPRITE_ACTIONS.map(action => [action, legacy.clips[action] ?? {
    fps: 8,
    loop: true,
    directions: Object.fromEntries(SPRITE_DIRECTIONS.map(direction => [
      direction,
      { start: legacy.clips.idle?.directions[direction].start ?? 0, count: 1 },
    ])),
  }])) as Record<SpriteAction, SpriteClip>;
  return [target, { ...legacy, clips }];
}));

const listeners = new Set<() => void>();
const overrides = new Map<string, CharacterSpriteSheet | null>();
let hydration: Promise<void> | undefined;
let revision = 0;
const LOCAL_PREFIX = 'xnl-character-sprites-v1:';
const CHANGE_KEY = `${LOCAL_PREFIX}changed`;

function changed() { revision++; listeners.forEach(listener => listener()); }

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Trình duyệt không hỗ trợ lưu sprite. Hãy tải cấu hình hoặc lưu vào source.')); return; }
    const request = indexedDB.open('xnl-character-sprites-v1', 1);
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error('Không mở được nơi lưu sprite trên thiết bị.'));
    };
    const timeout = setTimeout(fail, 2000);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('sheets')) request.result.createObjectStore('sheets');
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      clearTimeout(timeout);
      resolve(request.result);
    };
    request.onerror = fail;
    request.onblocked = fail;
  });
}

export async function storeSpriteSheet(key: string, sheet: CharacterSpriteSheet | null): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('sheets', 'readwrite');
      transaction.objectStore('sheets').put(sheet, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Chưa lưu được sprite trên máy. Hãy tải cấu hình để giữ bản sửa.'));
      transaction.onabort = () => reject(new Error('Lưu sprite bị gián đoạn.'));
    });
  } finally { db.close(); }
}

export async function loadSpriteSheet(key: string): Promise<CharacterSpriteSheet | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('sheets').objectStore('sheets').get(key);
      request.onsuccess = () => resolve(spriteSheetError(request.result) ? null : request.result as CharacterSpriteSheet);
      request.onerror = () => reject(new Error('Không đọc được sprite đã lưu.'));
    });
  } finally { db.close(); }
}

async function hydrate() {
  // Browser storage remains useful when IndexedDB is unavailable. Load this
  // first because it can contain a newer update whose IndexedDB write failed.
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const localKey = localStorage.key(index);
      if (!localKey?.startsWith(`${LOCAL_PREFIX}applied:`)) continue;
      try {
        const value: unknown = JSON.parse(localStorage.getItem(localKey) ?? 'null');
        const target = localKey.slice(`${LOCAL_PREFIX}applied:`.length);
        if (!overrides.has(target) && (value === null || !spriteSheetError(value))) overrides.set(target, value as CharacterSpriteSheet | null);
      } catch { /* Ignore an invalid entry and keep source rendering available. */ }
    }
    changed();
  } catch { /* Some browser privacy modes also block localStorage. */ }
  try {
    const db = await database();
    try {
      await new Promise<void>((resolve, reject) => {
        const request = db.transaction('sheets').objectStore('sheets').openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) { resolve(); return; }
          const key = String(cursor.key);
          if (key.startsWith('applied:') && !overrides.has(key.slice(8))
            && (cursor.value === null || !spriteSheetError(cursor.value))) overrides.set(key.slice(8), cursor.value);
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
    changed();
  } catch { /* Rendering still works with the source manifest when device storage is unavailable. */ }
}

function subscribe(listener: () => void) {
  if (!listeners.size && typeof window !== 'undefined') window.addEventListener('storage', storageChanged);
  listeners.add(listener);
  hydration ??= hydrate();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== 'undefined') window.removeEventListener('storage', storageChanged);
  };
}

function storageChanged(event: StorageEvent) {
  if (event.key !== CHANGE_KEY || !event.newValue) return;
  try {
    const { target } = JSON.parse(event.newValue) as { target?: string };
    if (!target) return;
    const localValue = localStorage.getItem(`${LOCAL_PREFIX}applied:${target}`);
    if (localValue !== null) {
      const value: unknown = JSON.parse(localValue);
      if (value === null || !spriteSheetError(value)) { overrides.set(target, value as CharacterSpriteSheet | null); changed(); }
    } else {
      void loadSpriteSheet(`applied:${target}`).then(sheet => { overrides.set(target, sheet); changed(); }).catch(() => {});
    }
  } catch { /* The same tab still receives immediate updates through the store. */ }
}

export function appliedSpriteSheet(target: string | null): CharacterSpriteSheet | null {
  if (!target) return null;
  if (overrides.has(target)) return overrides.get(target) ?? null;
  return source[target] && !spriteSheetError(source[target]) ? source[target] : null;
}

export function useAppliedSpriteSheet(target: string | null) {
  useSyncExternalStore(subscribe, () => revision, () => 0);
  return appliedSpriteSheet(target);
}

export async function applySpriteSheet(target: string, sheet: CharacterSpriteSheet | null) {
  if (sheet && spriteSheetError(sheet)) throw new Error(spriteSheetError(sheet)!);
  // Applying must not depend on browser persistence permissions. Components in
  // the game and creator observe this update immediately, including during a
  // blocked database open. Hydration never replaces an in-session update.
  overrides.set(target, sheet);
  changed();
  hydration ??= hydrate();
  await hydration;
  let warning: string | undefined;
  let persisted = false;
  try {
    await storeSpriteSheet(`applied:${target}`, sheet);
    persisted = true;
    try { localStorage.removeItem(`${LOCAL_PREFIX}applied:${target}`); } catch { /* IndexedDB saved successfully. */ }
  } catch {
    try {
      localStorage.setItem(`${LOCAL_PREFIX}applied:${target}`, JSON.stringify(sheet));
      persisted = true;
    } catch {
      warning = 'Đã áp dụng trong game hiện tại nhưng trình duyệt chưa lưu được. Ghi vào source hoặc tải JSON để giữ ảnh và hành động sau khi tải lại.';
    }
  }
  if (persisted) {
    try { localStorage.setItem(CHANGE_KEY, JSON.stringify({ target, revision, time: Date.now() })); } catch { /* Same-tab updates already applied. */ }
  }
  return { persisted, warning };
}
