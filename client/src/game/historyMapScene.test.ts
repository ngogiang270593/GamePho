import { describe, expect, it } from 'vitest';
import { freshHistoryProgress } from '../services/historyProgress';
import { HISTORY_MISSIONS } from './historyMissions';
import { FINAL_CHALLENGE_PROMPT, historyMapScene } from './historyMapScene';
import { HISTORY_MAPS, historyMapPosition, SUVIET_FEATURE_LABELS } from './suVietMap';
import { VILLAGE_LOCATIONS } from './villageLocations';

describe('shared live-game map scene', () => {
  it('uses the current map definition and native scene settings', () => {
    const progress = freshHistoryProgress();
    progress.currentMapId = HISTORY_MAPS[1].id;
    const scene = historyMapScene(progress);
    expect(scene.map).toBe(HISTORY_MAPS[1]);
    expect(scene.spawn).toEqual(historyMapPosition(HISTORY_MAPS[1].id));
    expect(scene.featureLabels).toBe(SUVIET_FEATURE_LABELS);
    expect(scene.locations).toEqual(expect.arrayContaining(VILLAGE_LOCATIONS));
  });

  it('shows Mê Linh hidden locations only after their mission is discovered', () => {
    const progress = freshHistoryProgress();
    const hidden = HISTORY_MISSIONS.find(mission => mission.mapId === progress.currentMapId
      && mission.kind === 'hidden' && mission.targetLocationId?.startsWith('me-linh-hidden-'))!;
    expect(hidden).toBeDefined();
    expect(historyMapScene(progress).locations.some(item => item.id === hidden.targetLocationId)).toBe(false);
    progress.discoveredHistoryMissions.push(hidden.id);
    expect(historyMapScene(progress).locations.some(item => item.id === hidden.targetLocationId)).toBe(true);
    expect(historyMapScene(progress).locations.some(item => VILLAGE_LOCATIONS.includes(item))).toBe(false);
  });

  it('keeps the next portal locked until live-game challenge requirements are met', () => {
    const progress = freshHistoryProgress();
    const portal = historyMapScene(progress).locations.find(item => item.destinationMapId)!;
    expect(portal.locked).toBe(true);
    expect(portal.action).toContain('Cần 500 danh vọng');
    progress.fame = 10000;
    expect(historyMapScene(progress).locations.find(item => item.destinationMapId)?.locked).toBe(true);
    progress.completedHistoryMissions = HISTORY_MISSIONS
      .filter(mission => mission.mapId === progress.currentMapId)
      .map(mission => mission.id);
    const ready = historyMapScene(progress).locations.find(item => item.destinationMapId)!;
    expect(ready.locked).toBe(false);
    expect(ready.dialogue).toBe(FINAL_CHALLENGE_PROMPT);
  });

  it('keeps portal behavior for an unlocked destination and replay', () => {
    const progress = freshHistoryProgress();
    progress.unlockedHistoryMaps.push(HISTORY_MAPS[1].id);
    const opened = historyMapScene(progress).locations.find(item => item.destinationMapId)!;
    expect(opened.locked).toBe(false);
    expect(opened.action).toContain('Đi qua cổng');
    progress.completedHistoryMaps.push(progress.currentMapId);
    const replay = historyMapScene(progress).locations.find(item => item.destinationMapId)!;
    expect(replay.action).toContain('hoặc đấu lại');
    expect(replay.dialogue).toContain(HISTORY_MAPS[1].name);
  });

  it('marks only an active mission belonging to the displayed map', () => {
    const progress = freshHistoryProgress();
    const mission = HISTORY_MISSIONS.find(item => item.mapId === progress.currentMapId)!;
    progress.activeHistoryMissionId = mission.id;
    expect(historyMapScene(progress).activeQuestLocationId).toBe(mission.targetLocationId);
    progress.currentMapId = HISTORY_MAPS[1].id;
    expect(historyMapScene(progress).activeQuestLocationId).toBeUndefined();
  });

  it('does not change progress or the shared map catalog', () => {
    const progress = freshHistoryProgress();
    const beforeProgress = structuredClone(progress);
    const beforeMap = structuredClone(HISTORY_MAPS[0]);
    historyMapScene(progress);
    expect(progress).toEqual(beforeProgress);
    expect(HISTORY_MAPS[0]).toEqual(beforeMap);
  });
});
