import { describe, expect, it } from 'vitest';
import { FAME_RANKS, HISTORY_HEROES, HISTORY_ZONES, fameRank } from './suViet';
import { HISTORY_MAPS, HISTORY_MENU_PLACES, historyMapPosition } from './suVietMap';
import { HISTORY_MISSIONS } from './historyMissions';
import { VILLAGE_LOCATIONS } from './villageLocations';
import { canStandAt, WORLD_SIZE } from './world';
import { MAP_ONE_WORLD_SIZE, mapOnePoint } from './mapOneMap';

const mapSize = (mapId: string) => mapId === 'hai-ba-trung' ? MAP_ONE_WORLD_SIZE : WORLD_SIZE;

describe('Hành Trình Sử Việt content', () => {
  it('expands Map 1 to four times the original walkable area', () => {
    expect(MAP_ONE_WORLD_SIZE.width * MAP_ONE_WORLD_SIZE.height).toBe(WORLD_SIZE.width * WORLD_SIZE.height * 4);
  });

  it('provides five unique, four-choice history questions for each initial hero', () => {
    expect(HISTORY_HEROES).toHaveLength(5);
    for (const hero of HISTORY_HEROES) {
      expect(hero.questions).toHaveLength(5);
      expect(new Set(hero.questions.map(item => item.id)).size).toBe(5);
      for (const item of hero.questions) {
        expect(item.answers).toHaveLength(4);
        expect(new Set(item.answers).size).toBe(4);
        expect(item.correct).toBeGreaterThanOrEqual(0);
        expect(item.correct).toBeLessThan(4);
        expect(item.explanation.length).toBeGreaterThan(10);
      }
    }
    expect(new Set(HISTORY_HEROES.map(hero => hero.questions[0].correct)).size).toBeGreaterThan(1);
    expect(HISTORY_HEROES[0].questions.find(item => item.id === 'hbt-1')?.answers[HISTORY_HEROES[0].questions.find(item => item.id === 'hbt-1')!.correct]).toBe('Năm 40');
    expect(HISTORY_HEROES[1].questions.find(item => item.id === 'thd-1')?.answers[HISTORY_HEROES[1].questions.find(item => item.id === 'thd-1')!.correct]).toBe('Trần Quốc Tuấn');
    expect(HISTORY_HEROES[2].questions.find(item => item.id === 'll-1')?.answers[HISTORY_HEROES[2].questions.find(item => item.id === 'll-1')!.correct]).toBe('Khởi nghĩa Lam Sơn');
    expect(HISTORY_HEROES[3].questions.find(item => item.id === 'qt-1')?.answers[HISTORY_HEROES[3].questions.find(item => item.id === 'qt-1')!.correct]).toBe('Nguyễn Huệ');
    expect(HISTORY_HEROES[4].questions.find(item => item.id === 'vng-1')?.answers[HISTORY_HEROES[4].questions.find(item => item.id === 'vng-1')!.correct]).toBe('Điện Biên Phủ');
  });

  it('opens the requested village landmarks and fame ranks at the configured thresholds', () => {
    expect(HISTORY_ZONES.map(zone => zone.name)).toEqual(['Cổng xóm', 'Đình làng', 'Quán nước', 'Bến nước', 'Ruộng lúa', 'Khu sử Việt']);
    expect(FAME_RANKS.map(rank => rank.score)).toEqual([0, 100, 300, 600, 1000]);
    expect(fameRank(0).title).toBe('Người mới tìm hiểu lịch sử');
    expect(fameRank(300).title).toBe('Học giả xóm làng');
    expect(fameRank(1000).title).toBe('Đại sứ văn hóa Việt Nam');
  });

  it('creates five distinct historical maps with reachable fame-gated gateways', () => {
    expect(HISTORY_MAPS.map(map => map.heroId)).toEqual(HISTORY_HEROES.map(hero => hero.id));
    expect(new Set(HISTORY_MAPS.map(map => map.theme)).size).toBe(5);
    HISTORY_MAPS.forEach((map, index) => {
      const next = HISTORY_MAPS[(index + 1) % HISTORY_MAPS.length];
      const gate = map.landmarks.find(location => location.destinationMapId);
      expect(gate?.destinationMapId).toBe(next.id);
      expect(gate?.unlockAt).toBe(next.unlockAt);
      expect(canStandAt(gate!.point, mapSize(map.id))).toBe(true);
      expect(canStandAt(historyMapPosition(map.id), mapSize(map.id))).toBe(true);
      expect(map.landmarks.some(location => location.id === `hero-${map.heroId}`)).toBe(true);
    });
  });

  it('places each game menu at its own reachable map location', () => {
    expect(HISTORY_MENU_PLACES.map(place => place.id)).toEqual([
      'menu-atlas', 'menu-collection', 'menu-achievements', 'menu-backup', 'menu-settings', 'menu-character', 'menu-exit',
    ]);
    for (const map of HISTORY_MAPS) {
      for (const place of HISTORY_MENU_PLACES) {
        const mapPlace = map.landmarks.find(location => location.id === place.id);
        expect(mapPlace?.point).toEqual(map.id === 'hai-ba-trung' ? mapOnePoint(place.point) : place.point);
        expect(canStandAt(mapPlace!.point, mapSize(map.id)), place.name).toBe(true);
      }
    }
  });

  it('connects each quest objective to a reachable historical or village location', () => {
    for (const map of HISTORY_MAPS) {
      const locationIds = new Set([...map.landmarks, ...VILLAGE_LOCATIONS].map(location => location.id));
      for (const mission of HISTORY_MISSIONS.filter(item => item.mapId === map.id)) {
        expect(locationIds.has(mission.targetLocationId), mission.id).toBe(true);
      }
    }
  });
});
