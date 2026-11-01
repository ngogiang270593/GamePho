import { freshHistoryProgress, isHistoryProgress, migrateHistoryProgress, type HistoryProgress } from './historyProgress';
import { freshHistoryProfile, normalizeHistoryProfile, type HistoryProfile } from './historyProfile';
import { canStandAt, type Point } from '../game/world';
import { HISTORY_MAPS, historyMapPosition, historyMapPositionKey } from '../game/suVietMap';
import { MAP_ONE_WORLD_SIZE } from '../game/mapOneMap';

export const HISTORY_SAVES_KEY = 'su-viet-hanh-trinh-save-slots-v1';
export const HISTORY_POSITION_KEY = historyMapPositionKey(HISTORY_MAPS[0].id);
export const HISTORY_SAVE_SLOT_COUNT = 5;

export interface HistorySaveSnapshot {
  progress: HistoryProgress;
  profile: HistoryProfile;
  position: Point;
}

export interface HistorySaveSlot {
  slot: number;
  savedAt: string;
  snapshot: HistorySaveSnapshot;
}

function isSnapshot(value: unknown): value is HistorySaveSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<HistorySaveSnapshot>;
  const profile = snapshot.profile;
  const point = snapshot.position;
  const validPosition = point && snapshot.progress?.currentMapId === 'hai-ba-trung'
    ? point.x >= 53 && point.y >= 73
      && point.x <= MAP_ONE_WORLD_SIZE.width - 53 && point.y <= MAP_ONE_WORLD_SIZE.height - 53
    : Boolean(point && canStandAt(point));
  return isHistoryProgress(snapshot.progress)
    && Boolean(profile && typeof profile.displayName === 'string' && profile.appearance && typeof profile.appearance === 'object')
    && Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && validPosition);
}

export function readHistorySaveSlots(): HistorySaveSlot[] {
  const raw = localStorage.getItem(HISTORY_SAVES_KEY);
  if (!raw) return [];
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('Không đọc được các ô sao lưu Sử Việt.'); }
  if (!Array.isArray(value)) throw new Error('Dữ liệu các ô sao lưu Sử Việt không hợp lệ.');
  const slots = value.map(slot => {
    if (!slot || typeof slot !== 'object') return slot;
    const entry = slot as Record<string, unknown>;
    const snapshot = entry.snapshot;
    if (!snapshot || typeof snapshot !== 'object') return slot;
    const snapshotValue = snapshot as Record<string, unknown>;
    const progress = migrateHistoryProgress(snapshotValue.progress);
    return progress ? { ...entry, snapshot: { ...snapshotValue, progress, profile: snapshotValue.profile&&typeof snapshotValue.profile==='object'?normalizeHistoryProfile(snapshotValue.profile):snapshotValue.profile } } : slot;
  });
  if (slots.some(slot => !slot || typeof slot !== 'object'
    || !Number.isInteger(slot.slot) || slot.slot < 1 || slot.slot > HISTORY_SAVE_SLOT_COUNT
    || typeof slot.savedAt !== 'string' || !isSnapshot(slot.snapshot))) {
    throw new Error('Dữ liệu các ô sao lưu Sử Việt không hợp lệ.');
  }
  if (JSON.stringify(value) !== JSON.stringify(slots)) localStorage.setItem(HISTORY_SAVES_KEY, JSON.stringify(slots));
  return slots as HistorySaveSlot[];
}

export function saveHistorySlot(slot: number, snapshot: HistorySaveSnapshot, savedAt = new Date().toISOString()): HistorySaveSlot[] {
  if (!Number.isInteger(slot) || slot < 1 || slot > HISTORY_SAVE_SLOT_COUNT || !isSnapshot(snapshot)) {
    throw new Error('Không thể lưu vào ô sao lưu đã chọn.');
  }
  const slots = readHistorySaveSlots().filter(item => item.slot !== slot);
  slots.push({ slot, savedAt, snapshot });
  slots.sort((a, b) => a.slot - b.slot);
  localStorage.setItem(HISTORY_SAVES_KEY, JSON.stringify(slots));
  return slots;
}

export function deleteHistorySlot(slot: number): HistorySaveSlot[] {
  const slots = readHistorySaveSlots().filter(item => item.slot !== slot);
  localStorage.setItem(HISTORY_SAVES_KEY, JSON.stringify(slots));
  return slots;
}

export function createHistorySnapshot(progress: HistoryProgress, profile: HistoryProfile): HistorySaveSnapshot {
  const positionKey = historyMapPositionKey(progress.currentMapId);
  const position = localStorage.getItem(positionKey) ?? (progress.currentMapId === HISTORY_MAPS[0].id
    ? localStorage.getItem('su-viet-hanh-trinh-world-position')
    : null);
  const fallback = historyMapPosition(progress.currentMapId);
  if (!position) return { progress, profile, position: fallback };
  let point: unknown;
  try { point = JSON.parse(position); }
  catch { return { progress, profile, position: fallback }; }
  return point && typeof point === 'object' && Number.isFinite((point as Point).x)
    && Number.isFinite((point as Point).y)
    && (progress.currentMapId === 'hai-ba-trung'
      ? (point as Point).x >= 53 && (point as Point).y >= 73
        && (point as Point).x <= MAP_ONE_WORLD_SIZE.width - 53
        && (point as Point).y <= MAP_ONE_WORLD_SIZE.height - 53
      : canStandAt(point as Point))
    ? { progress, profile, position: point as Point }
    : { progress, profile, position: fallback };
}

export function emptyHistorySnapshot(): HistorySaveSnapshot {
  const progress = freshHistoryProgress();
  return { progress, profile: freshHistoryProfile(), position: historyMapPosition(progress.currentMapId) };
}
