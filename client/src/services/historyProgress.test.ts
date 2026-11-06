import { afterEach, describe, expect, it } from 'vitest';
import { awardEligibleHistoryMissions, canStartFinalHistoryChallenge, completeHistoryMission, HISTORY_PROGRESS_KEY, freshHistoryProgress, migrateHistoryProgress, readHistoryProgress, resolveFinalHistoryChallenge, saveHistoryProgress, startHistoryMission, uniqueCorrectCount, UNO_BET_OPTIONS } from './historyProgress';
import { HISTORY_HEROES } from '../game/suViet';
import { discoverEligibleHiddenMissions, historyMapMandatoryMissionIds, HISTORY_MISSIONS, historyMapMissionStats, historyMissionAvailable } from '../game/historyMissions';
import { MAP_ONE_CHARACTERS } from '../game/historyMapOne';
import { HISTORY_MAPS } from '../game/suVietMap';

afterEach(() => localStorage.clear());

describe('Sử Việt local progress', () => {
  it('saves and restores gold, fame, unlocked badges and question progress', () => {
    const progress = { ...freshHistoryProgress(), gold: 70, fame: 100, badges: ['Hoa lau Mê Linh'], correctQuestions: ['hbt-1'] };
    saveHistoryProgress(progress);
    expect(readHistoryProgress()).toEqual(progress);
    expect(uniqueCorrectCount(readHistoryProgress(), 'hai-ba-trung')).toBe(1);
  });

  it('reports damaged local progress instead of silently replacing it', () => {
    localStorage.setItem(HISTORY_PROGRESS_KEY, '{not json');
    expect(() => readHistoryProgress()).toThrow();
  });

  it('migrates progress from before UNO match tracking and multiple history maps', () => {
    const legacy = { ...freshHistoryProgress(), gold: 80, fame: 100, correctQuestions: ['hbt-1'] };
    delete (legacy as Partial<typeof legacy>).activeUnoMatch;
    delete (legacy as Partial<typeof legacy>).currentMapId;
    delete (legacy as Partial<typeof legacy>).riverCampaign;
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(legacy));
    expect(readHistoryProgress()).toMatchObject({
      gold: 80, fame: 100, correctQuestions: ['hbt-1'],
      activeUnoMatch: null, currentMapId: HISTORY_HEROES[0].id,
      riverCampaign: { actionPoints: 3, vanTien: 50, hp: 600, maxHp: 600 },
    });
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).currentMapId).toBe(HISTORY_HEROES[0].id);
  });

  it('uses the same five-question content for each initial character', () => {
    expect(HISTORY_HEROES.every(hero => hero.questions.length === 5)).toBe(true);
  });

  it('migrates older saves with safe default betting state', () => {
    const legacy = { ...freshHistoryProgress() } as Record<string, unknown>;
    delete legacy.freeUnoTickets;
    delete legacy.selectedBet;
    delete legacy.currentMatch;
    delete legacy.totalWins;
    delete legacy.totalLosses;
    delete legacy.totalDraws;
    delete legacy.bettingHistory;
    delete legacy.completedHistoryMissions;
    delete legacy.unlockedTalents;

    expect(migrateHistoryProgress(legacy)).toMatchObject({
      freeUnoTickets: 0,
      selectedBet: UNO_BET_OPTIONS[0].bet,
      currentMatch: null,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      bettingHistory: [],
      completedHistoryMissions: [],
      unlockedTalents: [],
    });
  });

  it('awards history mission tickets once and records completed mission ids', () => {
    const fiveCorrect = { ...freshHistoryProgress(), correctQuestions: ['hbt-1', 'hbt-2', 'hbt-3', 'hbt-4', 'hbt-5'] };
    const first = awardEligibleHistoryMissions(fiveCorrect);
    expect(first).toMatchObject({ gold: 500, fame: 20, tickets: 1, completed: ['correct-5'] });
    expect(first.progress).toMatchObject({ gold: 500, fame: 20, freeUnoTickets: 1 });

    const repeated = awardEligibleHistoryMissions(first.progress);
    expect(repeated).toMatchObject({ gold: 0, fame: 0, tickets: 0, completed: [] });
    expect(repeated.progress).toMatchObject({ gold: 500, fame: 20, freeUnoTickets: 1 });
  });

  it('awards character completion and fame milestone tickets independently', () => {
    const progress = {
      ...freshHistoryProgress(),
      fame: 100,
      completedHeroes: ['hai-ba-trung'],
    };
    const awarded = awardEligibleHistoryMissions(progress);
    expect(awarded.tickets).toBe(3);
    expect(awarded.completed).toEqual(['hero-hai-ba-trung', 'fame-100']);
    expect(awarded.progress.freeUnoTickets).toBe(3);
  });

  it('provides a sourced, complete mission catalogue for every shipped map', () => {
    for (const map of HISTORY_MAPS) {
      const missions = HISTORY_MISSIONS.filter(mission => mission.mapId === map.id);
      expect(missions.filter(mission => mission.kind === 'main')).toHaveLength(map.id === 'hai-ba-trung' ? 18 : 15);
      expect(missions.filter(mission => mission.kind === 'side')).toHaveLength(8);
      expect(missions.filter(mission => mission.kind === 'hidden')).toHaveLength(map.id === 'hai-ba-trung' ? 7 : 3);
    }
    expect(new Set(HISTORY_MISSIONS.map(mission => mission.id)).size).toBe(HISTORY_MISSIONS.length);
  });

  it('only awards an accepted mission at its map target and discovers hidden clues gradually', () => {
    const mapId = HISTORY_MAPS[0].id;
    const mission = HISTORY_MISSIONS.find(item => item.mapId === mapId && item.kind === 'main')!;
    let progress = startHistoryMission(freshHistoryProgress(), mission.id);
    expect(completeHistoryMission(progress, 'wrong-location').completedMissionId).toBeUndefined();
    const result = completeHistoryMission(progress, mission.targetLocationId);
    expect(result.completedMissionId).toBe(mission.id);
    expect(result.progress).toMatchObject({ fame: mission.fame, gold: mission.gold, activeHistoryMissionId: null });
    progress = result.progress;
    expect(completeHistoryMission(progress, mission.targetLocationId).completedMissionId).toBeUndefined();

    const firstFour = HISTORY_MISSIONS.filter(item => item.mapId === mapId && item.kind === 'main').slice(0, 4);
    const discovered = discoverEligibleHiddenMissions(mapId, firstFour.map(item => item.id), []);
    expect(discovered).toHaveLength(1);
    expect(historyMapMissionStats(mapId, firstFour.map(item => item.id), discovered)).toMatchObject({
      mainCompleted: 4, mainRequired: 17, hiddenFound: 1,
    });
  });

  it('requires 500 fame, over 90 percent of main quests, and final chapter missions before the final duel', () => {
    const mapId = HISTORY_MAPS[0].id;
    const mainIds = HISTORY_MISSIONS.filter(item => item.mapId === mapId && item.kind === 'main').map(item => item.id);
    const base = freshHistoryProgress();
    expect(canStartFinalHistoryChallenge({ ...base, fame: 500 }, mapId)).toBe(false);
    expect(canStartFinalHistoryChallenge({ ...base, fame: 500, completedHistoryMissions: mainIds.slice(0, 16) }, mapId)).toBe(false);
    expect(canStartFinalHistoryChallenge({ ...base, fame: 499, completedHistoryMissions: mainIds.slice(0, 17) }, mapId)).toBe(false);
    expect(canStartFinalHistoryChallenge({ ...base, fame: 500, completedHistoryMissions: mainIds.slice(0, 17) }, mapId)).toBe(false);
    expect(historyMapMandatoryMissionIds(mapId).every(id => mainIds.includes(id))).toBe(true);
    expect(canStartFinalHistoryChallenge({ ...base, fame: 500, completedHistoryMissions: mainIds }, mapId)).toBe(true);
  });

  it('provides five chapters, twelve character profiles, and chapter-gated Map 1 missions', () => {
    const mapId = HISTORY_MAPS[0].id;
    const map = HISTORY_MAPS.find(item => item.id === mapId)!;
    const main = HISTORY_MISSIONS.filter(mission => mission.mapId === mapId && mission.kind === 'main');
    const chapterTwo = main.find(mission => mission.chapterId === 'injustice')!;
    expect(MAP_ONE_CHARACTERS).toHaveLength(12);
    expect(new Set(main.map(mission => mission.targetLocationId)).size).toBe(18);
    expect(historyMissionAvailable(mapId, chapterTwo, main.slice(0, 3).map(mission => mission.id), [])).toBe(false);
    expect(historyMissionAvailable(mapId, chapterTwo, main.slice(0, 4).map(mission => mission.id), [])).toBe(true);
    expect(discoverEligibleHiddenMissions(mapId, main.map(mission => mission.id), [])).toHaveLength(7);
    expect(HISTORY_MISSIONS.filter(mission => mission.mapId === mapId).every(mission =>
      map.landmarks.some(location => location.id === mission.targetLocationId),
    )).toBe(true);
  });

  it('grants hidden-map collectibles and talents only when the discovered mission is finished', () => {
    const mission = HISTORY_MISSIONS.find(item => item.mapId === HISTORY_MAPS[0].id && item.kind === 'hidden')!;
    const undiscovered = freshHistoryProgress();
    expect(startHistoryMission(undiscovered, mission.id)).toBe(undiscovered);

    const discovered = { ...undiscovered, discoveredHistoryMissions: [mission.id] };
    const active = startHistoryMission(discovered, mission.id);
    const result = completeHistoryMission(active, mission.targetLocationId);
    expect(result.progress).toMatchObject({
      badges: ['Dấu trống Mê Linh'],
      fame: 60,
      gold: 60,
      completedHistoryMissions: [mission.id],
    });
  });

  it('unlocks the next map and awards a badge only after winning the free final duel', () => {
    const mapId = HISTORY_MAPS[0].id;
    const mainIds = HISTORY_MISSIONS.filter(item => item.mapId === mapId && item.kind === 'main').map(item => item.id);
    const ready = {
      ...freshHistoryProgress(),
      fame: 500,
      completedHistoryMissions: mainIds,
      finalChallengeMapId: mapId,
    };
    const loss = resolveFinalHistoryChallenge(ready, 'loss')!;
    expect(loss).toMatchObject({ fame: 500, gold: 0, unlockedHistoryMaps: [mapId], finalChallengeMapId: null });
    expect(canStartFinalHistoryChallenge(loss, mapId)).toBe(true);

    const win = resolveFinalHistoryChallenge(ready, 'win')!;
    expect(win).toMatchObject({
      fame: 600,
      gold: 100,
      unlockedHistoryMaps: [mapId, HISTORY_MAPS[1].id],
      completedHistoryMaps: [mapId],
      totalWins: 1,
      freeUnoTickets: 2,
      unlockedOutfits: ['Trang phục nữ tướng Mê Linh'],
      unlockedTalents: ['Tinh thần Mê Linh'],
      latestReward: { badge: expect.any(String), fame: 100, gold: 100, tickets: 2 },
    });
    expect(win.badges).toContain(win.latestReward?.badge);
    const replay = resolveFinalHistoryChallenge({ ...win, finalChallengeMapId: mapId }, 'win')!;
    expect(replay).toMatchObject({
      fame: 600,
      gold: 100,
      freeUnoTickets: 2,
      completedHistoryMaps: [mapId],
      totalWins: 2,
      latestReward: { fame: 0, gold: 0, tickets: 0, newBadge: false },
    });
  });

  it('migrates older progress to unlocked maps and preserves the current map', () => {
    const old = { ...freshHistoryProgress(), currentMapId: HISTORY_MAPS[1].id, fame: 100 } as Record<string, unknown>;
    delete old.unlockedHistoryMaps;
    delete old.completedHistoryMaps;
    delete old.activeHistoryMissionId;
    delete old.discoveredHistoryMissions;
    delete old.finalChallengeMapId;
    delete old.finalChallengeAttempts;
    const migrated = migrateHistoryProgress(old)!;
    expect(migrated.currentMapId).toBe(HISTORY_MAPS[1].id);
    expect(migrated.unlockedHistoryMaps).toContain(HISTORY_MAPS[1].id);
    expect(migrated.completedHistoryMaps).toContain(HISTORY_MAPS[0].id);
  });
});
