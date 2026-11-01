import { canStandAt } from '../game/world';
import { MAP_ONE_WORLD_SIZE } from '../game/mapOneMap';
import { HISTORY_MAPS, historyMapPosition, historyMapPositionKey } from '../game/suVietMap';
import { freshHistoryProfile, normalizeHistoryProfile, type HistoryProfile } from './historyProfile';
import { freshHistoryProgress, migrateHistoryProgress, type HistoryProgress } from './historyProgress';
import { onlineRequest, type Account } from './online/account';

export const HISTORY_CLOUD_PROFILE_KEY = 'xnl-history-save-v1';
export const HISTORY_CLOUD_SAVE_LIMIT = 8000;
export const HISTORY_OFFLINE_SAVE_KEY = 'xnl-offline-history-save-v1';

function isValidPosition(mapId: string, point: { x: number; y: number }) {
  if (mapId === 'hai-ba-trung') {
    return point.x >= 53 && point.y >= 73
      && point.x <= MAP_ONE_WORLD_SIZE.width - 53 && point.y <= MAP_ONE_WORLD_SIZE.height - 53;
  }
  return canStandAt(point);
}

export interface HistoryCloudSave {
  version: 1;
  savedAt: string;
  progress: HistoryProgress;
  profile: HistoryProfile;
  positions: Record<string, { x: number; y: number }>;
}

export function hasLocalHistory(): boolean {
  const offlineSnapshot = localStorage.getItem(HISTORY_OFFLINE_SAVE_KEY);
  if (offlineSnapshot) return true;
  if (localStorage.getItem('xnl-last-saved-mode') === 'online') return false;
  return hasStoredHistory();
}

export function hasStoredHistory(): boolean {
  try {
    const rawProfile = localStorage.getItem('su-viet-hanh-trinh-character-v1');
    const profile = rawProfile ? JSON.parse(rawProfile) as Partial<HistoryProfile> : null;
    return Boolean(profile?.displayName?.trim())
      || localStorage.getItem('su-viet-hanh-trinh-progress-v1') !== null;
  } catch {
    return localStorage.getItem('su-viet-hanh-trinh-progress-v1') !== null
      || localStorage.getItem('su-viet-hanh-trinh-character-v1') !== null;
  }
}

export function readOfflineHistorySave(): HistoryCloudSave | null {
  const raw = localStorage.getItem(HISTORY_OFFLINE_SAVE_KEY);
  return raw ? parseHistorySave(raw) : null;
}

export function writeOfflineHistorySave(save: HistoryCloudSave): void {
  localStorage.setItem(HISTORY_OFFLINE_SAVE_KEY, JSON.stringify(save));
}

export function createHistoryCloudSave(progress: HistoryProgress, profile: HistoryProfile): HistoryCloudSave {
  const positions: HistoryCloudSave['positions'] = {};
  for (const map of HISTORY_MAPS) {
    const raw = localStorage.getItem(historyMapPositionKey(map.id));
    if (!raw) continue;
    try {
      const point = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof point.x === 'number' && typeof point.y === 'number'
        && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        const candidate = { x: point.x, y: point.y };
        if (isValidPosition(map.id, candidate)) positions[map.id] = candidate;
      }
    } catch {
      continue;
    }
  }
  if (!positions[progress.currentMapId]) {
    positions[progress.currentMapId] = historyMapPosition(progress.currentMapId);
  }
  return { version: 1, savedAt: new Date().toISOString(), progress, profile, positions };
}

export function readHistoryCloudSave(account: Account): HistoryCloudSave | null {
  const raw = account.profile?.[HISTORY_CLOUD_PROFILE_KEY];
  if (!raw) return null;
  return parseHistorySave(raw);
}

function parseHistorySave(raw: string): HistoryCloudSave {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Dữ liệu hành trình online không đọc được.');
  }
  if (!value || typeof value !== 'object') throw new Error('Dữ liệu hành trình online không hợp lệ.');
  const data = value as Partial<HistoryCloudSave>;
  const progress = migrateHistoryProgress(data.progress);
  if (data.version !== 1 || typeof data.savedAt !== 'string' || !progress
    || !data.profile || typeof data.profile !== 'object'
    || typeof data.profile.displayName !== 'string') {
    throw new Error('Dữ liệu hành trình online không hợp lệ.');
  }
  const positions: HistoryCloudSave['positions'] = {};
  if (data.positions && typeof data.positions === 'object') {
    for (const [mapId, point] of Object.entries(data.positions)) {
      if (!HISTORY_MAPS.some(map => map.id === mapId) || !point
        || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
      const candidate = { x: point.x, y: point.y };
      if (isValidPosition(mapId, candidate)) positions[mapId] = candidate;
    }
  }
  return {
    version: 1,
    savedAt: data.savedAt,
    progress,
    profile: normalizeHistoryProfile(data.profile),
    positions,
  };
}

export async function saveHistoryCloudSave(save: HistoryCloudSave): Promise<void> {
  const serialized = JSON.stringify(save);
  if (serialized.length > HISTORY_CLOUD_SAVE_LIMIT) {
    throw new Error('Hành trình online vượt giới hạn lưu trữ. Hãy lưu một ô sao lưu offline và thử lại.');
  }
  await onlineRequest('/auth/profile', { historySave: save }, 'PUT');
}

export function emptyHistoryCloudSave(): HistoryCloudSave {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    progress: freshHistoryProgress(),
    profile: freshHistoryProfile(),
    positions: {},
  };
}

export function historySavesMatch(left: HistoryCloudSave, right: HistoryCloudSave): boolean {
  return JSON.stringify({
    progress: left.progress,
    profile: left.profile,
    positions: left.positions,
  }) === JSON.stringify({
    progress: right.progress,
    profile: right.profile,
    positions: right.positions,
  });
}
