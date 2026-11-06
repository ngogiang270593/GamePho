import { canStartFinalHistoryChallenge, type HistoryProgress } from '../services/historyProgress';
import { HISTORY_MISSIONS, historyMapMissionStats, historyMission } from './historyMissions';
import { HISTORY_HEROES } from './suViet';
import { HISTORY_MAPS, historyMap, historyMapPosition, SUVIET_FEATURE_LABELS } from './suVietMap';
import { VILLAGE_LOCATIONS } from './villageLocations';

export const FINAL_CHALLENGE_PROMPT = 'Bạn đã hoàn thành hành trình tại Mê Linh. Hãy đến khu vực Giải trí để tham gia thử thách cuối bản đồ.';

/** The live game and character tool share map data, quest markers and portal rules. */
export function historyMapScene(progress: HistoryProgress) {
  const map = historyMap(progress.currentMapId);
  const mapIndex = HISTORY_MAPS.findIndex(item => item.id === map.id);
  const nextMap = HISTORY_MAPS[(mapIndex + 1) % HISTORY_MAPS.length];
  const locations = map.landmarks
    .filter(item => !item.id.startsWith('me-linh-hidden-') || HISTORY_MISSIONS.some(mission =>
      mission.mapId === map.id
        && mission.kind === 'hidden'
        && mission.targetLocationId === item.id
        && progress.discoveredHistoryMissions.includes(mission.id),
    ))
    .map(item => {
      if (!item.destinationMapId) return item;
      const unlocked = progress.unlockedHistoryMaps.includes(item.destinationMapId)
        || canStartFinalHistoryChallenge(progress, map.id);
      const stats = historyMapMissionStats(map.id, progress.completedHistoryMissions, progress.discoveredHistoryMissions);
      const requiredFame = map.finalChallengeFame ?? HISTORY_MAPS[mapIndex + 1]?.unlockAt ?? map.unlockAt;
      return {
        ...item,
        locked: !unlocked,
        action: progress.unlockedHistoryMaps.includes(item.destinationMapId)
          ? progress.completedHistoryMaps.includes(map.id)
            ? `Cổng mở · sang ${nextMap.region.split(' · ')[0]} hoặc đấu lại`
            : `Đi qua cổng sang ${nextMap.region.split(' · ')[0]}`
          : unlocked ? 'Đủ điều kiện · đến khu Giải trí' : `Cần ${requiredFame} danh vọng · thử thách cuối (${stats.mainCompleted}/${stats.mainRequired} nhiệm vụ chính)`,
        dialogue: unlocked
          ? progress.unlockedHistoryMaps.includes(item.destinationMapId)
            ? `Cổng đã mở. Bạn có thể sang ${nextMap.name} hoặc đấu lại ${HISTORY_HEROES.find(hero => hero.id === map.heroId)?.name ?? 'nhân vật dẫn chuyện'}.`
            : FINAL_CHALLENGE_PROMPT
          : `Cổng tới ${nextMap.name} chỉ mở khi bạn có ${requiredFame} danh vọng, hoàn thành ít nhất ${stats.mainRequired}/${stats.mainTotal} nhiệm vụ chính và thắng UNO thử thách cuối.`,
      };
    });
  const activeMission = progress.activeHistoryMissionId
    ? historyMission(map.id, progress.activeHistoryMissionId)
    : undefined;

  return {
    map,
    locations: map.id === 'hai-ba-trung' ? locations : [...locations, ...VILLAGE_LOCATIONS],
    spawn: historyMapPosition(map.id),
    featureLabels: SUVIET_FEATURE_LABELS,
    activeQuestLocationId: activeMission?.targetLocationId,
  };
}
