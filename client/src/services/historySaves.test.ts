import { afterEach, describe, expect, it } from 'vitest';
import { HISTORY_MAPS, historyMapPosition, historyMapPositionKey } from '../game/suVietMap';
import { canStandAt, SPAWN } from '../game/world';
import { walkable } from '../game/movement/navigation';
import { MAP_ONE_NPCS } from '../game/mapOneNpcs';
import { freshHistoryProgress } from './historyProgress';
import { freshHistoryProfile } from './historyProfile';
import { receiveInventoryItem } from '../game/characterInventory';
import { createHistorySnapshot, deleteHistorySlot, HISTORY_POSITION_KEY, HISTORY_SAVES_KEY, readHistorySaveSlots, saveHistorySlot } from './historySaves';

afterEach(() => localStorage.clear());

describe('Sử Việt local save slots', () => {
  it('stores and restores the campaign, local character and map position in a numbered slot', () => {
    const progress = { ...freshHistoryProgress(), gold: 80, fame: 100, badges: ['Hoa lau Mê Linh'] };
    const customization = receiveInventoryItem(freshHistoryProfile().customization, 'mount-dragon', Date.now(), true);
    customization.equipped.mount = 'mount-dragon';
    customization.inventory!.equippedItems = { ...customization.equipped };
    const profile = { ...freshHistoryProfile(), displayName: 'Út Mận', customization: {
      ...customization,
      facing: 'three-quarter' as const,
    } };
    localStorage.setItem(HISTORY_POSITION_KEY, JSON.stringify({ x: 600, y: 500 }));
    saveHistorySlot(2, createHistorySnapshot(progress, profile), '2025-01-02T03:04:05.000Z');

    expect(readHistorySaveSlots()).toEqual([{
      slot: 2,
      savedAt: '2025-01-02T03:04:05.000Z',
      snapshot: { progress, profile, position: { x: 600, y: 500 } },
    }]);
    expect(readHistorySaveSlots()[0].snapshot.profile.customization.equipped.mount).toBe('mount-dragon');
    expect(deleteHistorySlot(2)).toEqual([]);
    expect(localStorage.getItem(HISTORY_SAVES_KEY)).toBe('[]');
  });

  it('backs up the position belonging to the currently selected historical map', () => {
    const map = HISTORY_MAPS[1];
    const progress = {
      ...freshHistoryProgress(),
      fame: map.unlockAt,
      currentMapId: map.id,
      unlockedHistoryMaps: [HISTORY_MAPS[0].id, map.id],
      completedHistoryMaps: [HISTORY_MAPS[0].id],
    };
    const position = historyMapPosition(map.id);
    localStorage.setItem(historyMapPositionKey(map.id), JSON.stringify(position));

    const snapshot = createHistorySnapshot(progress, freshHistoryProfile());
    expect(snapshot.position).toEqual(position);
    saveHistorySlot(1, snapshot);
    expect(readHistorySaveSlots()[0].snapshot).toEqual(snapshot);
  });

  it('rejects invalid slots and corrupted save data instead of hiding the error', () => {
    expect(() => saveHistorySlot(6, createHistorySnapshot(freshHistoryProgress(), freshHistoryProfile()))).toThrow();
    localStorage.setItem(HISTORY_SAVES_KEY, '{broken');
    expect(() => readHistorySaveSlots()).toThrow();
  });

  it('places every Sử Việt landmark and character encounter on reachable ground', () => {
    const unreachable = HISTORY_MAPS.flatMap(map => map.landmarks
      .filter(location => !canStandAt(location.point))
      .map(location => `${map.id}:${location.id}`));
    expect(unreachable).toEqual([]);
    expect(HISTORY_MAPS.every(map => canStandAt(map.portalPoint))).toBe(true);
    expect(SPAWN).toEqual({ x: 480, y: 475 });
  });

  it('keeps Map 1 NPCs tied to its period-specific locations and reachable ground', () => {
    const map = HISTORY_MAPS.find(item => item.id === 'hai-ba-trung')!;
    expect(new Set(MAP_ONE_NPCS.map(npc => npc.id)).size).toBe(MAP_ONE_NPCS.length);
    expect(MAP_ONE_NPCS.every(npc => map.landmarks.some(location => location.id === npc.locationId))).toBe(true);
    expect(MAP_ONE_NPCS.filter(npc => !walkable(npc.point, map.buildings, [], map.theme)).map(npc => `${npc.id} (${npc.point.x},${npc.point.y})`)).toEqual([]);
    expect(map.buildings.some(building => building.id.startsWith('menu-'))).toBe(false);
  });
});
