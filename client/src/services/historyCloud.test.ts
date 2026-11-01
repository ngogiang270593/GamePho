import { afterEach, describe, expect, it } from 'vitest';
import { freshHistoryProfile, HISTORY_PROFILE_KEY } from './historyProfile';
import { freshHistoryProgress, HISTORY_PROGRESS_KEY } from './historyProgress';
import {
  createHistoryCloudSave,
  hasLocalHistory,
  HISTORY_OFFLINE_SAVE_KEY,
  readHistoryCloudSave,
  writeOfflineHistorySave,
  type HistoryCloudSave,
} from './historyCloud';

afterEach(() => localStorage.clear());

describe('offline and online history storage', () => {
  it('keeps the offline journey separate from online local cache', () => {
    localStorage.setItem('xnl-last-saved-mode', 'online');
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({
      ...freshHistoryProfile(),
      displayName: 'Người chơi online',
    }));
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(freshHistoryProgress()));
    expect(hasLocalHistory()).toBe(false);

    const offlineSave: HistoryCloudSave = {
      ...createHistoryCloudSave(freshHistoryProgress(), {
        ...freshHistoryProfile(),
        displayName: 'Út Mận',
      }),
      savedAt: '2026-10-28T12:00:00.000Z',
    };
    writeOfflineHistorySave(offlineSave);

    expect(localStorage.getItem(HISTORY_OFFLINE_SAVE_KEY)).not.toBeNull();
    expect(hasLocalHistory()).toBe(true);
    expect(readHistoryCloudSave({
      id: 'account-1',
      username: 'nguoidung',
      displayName: 'Người chơi online',
      profile: { 'xnl-history-save-v1': JSON.stringify(offlineSave) },
    })?.profile.displayName).toBe('Út Mận');
  });
});
