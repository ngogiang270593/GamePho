import { HISTORY_HEROES } from '../game/suViet';
import { HISTORY_MAPS } from '../game/suVietMap';
import { discoverEligibleHiddenMissions, historyMapMandatoryMissionIds, historyMapMissionStats, historyMapStory, historyMission, historyMissionAvailable } from '../game/historyMissions';
import type { VillageState } from '../game/villageQuests';

export const HISTORY_PROGRESS_KEY = 'su-viet-hanh-trinh-progress-v1';

export const UNO_BET_OPTIONS = [
  { bet: 100, reward: 180 },
  { bet: 500, reward: 900 },
  { bet: 1000, reward: 1800 },
  { bet: 5000, reward: 9000 },
  { bet: 10000, reward: 18000 },
] as const;

export type HistoryBetOutcome = 'win' | 'loss' | 'draw';
export interface HistoryBetHistoryEntry {
  matchId: number;
  round: number;
  stake: number;
  reward: number;
  outcome: HistoryBetOutcome;
  freeTicket: boolean;
  coinDelta: number;
}
export interface HistoryCurrentMatch {
  matchId: number | null;
  previousMatchId?: number | null;
  stake: number;
  reward: number;
  freeTicket: boolean;
}

export interface HistoryEncounter {
  heroId: string;
  questionId: string;
  stage: 'story' | 'question' | 'answered';
  correct?: boolean;
  selectedAnswer?: number;
  quizGold?: number;
  quizFame?: number;
  quizTickets?: number;
  completedMissionRewards?: string[];
}

export interface HistoryReward {
  title: string;
  gold: number;
  fame: number;
  wonUno: boolean;
  badge?: string;
  newBadge?: boolean;
  unlocked?: string[];
  tickets?: number;
  completedMissions?: string[];
  bettingMessage?: string;
  missionOnly?: boolean;
  outcome?: HistoryBetOutcome;
  lesson?: string;
  practiceOnly?: boolean;
}

export interface HistoryProgress {
  village?: VillageState;
  gold: number;
  fame: number;
  attempts: Record<string, number>;
  correctQuestions: string[];
  completedHeroes: string[];
  badges: string[];
  unoPlayed: number;
  unoWon: number;
  unlockedOutfits: string[];
  unlockedTalents: string[];
  encounter: HistoryEncounter | null;
  latestReward: HistoryReward | null;
  handledMatches: string[];
  activeUnoMatch: number | null;
  currentMapId: string;
  freeUnoTickets: number;
  selectedBet: number;
  currentMatch: HistoryCurrentMatch | null;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  bettingHistory: HistoryBetHistoryEntry[];
  completedHistoryMissions: string[];
  activeHistoryMissionId: string | null;
  discoveredHistoryMissions: string[];
  unlockedHistoryMaps: string[];
  completedHistoryMaps: string[];
  finalChallengeMapId: string | null;
  finalChallengeAttempts: Record<string, number>;
}

export function freshHistoryProgress(): HistoryProgress {
  return {
    gold: 0, fame: 0, attempts: {}, correctQuestions: [], completedHeroes: [], badges: [],
    unoPlayed: 0, unoWon: 0, unlockedOutfits: [], unlockedTalents: [], encounter: null, latestReward: null, handledMatches: [], activeUnoMatch: null, currentMapId: HISTORY_HEROES[0].id,
    freeUnoTickets: 0, selectedBet: UNO_BET_OPTIONS[0].bet, currentMatch: null,
    totalWins: 0, totalLosses: 0, totalDraws: 0, bettingHistory: [], completedHistoryMissions: [],
    activeHistoryMissionId: null, discoveredHistoryMissions: [],
    unlockedHistoryMaps: [HISTORY_MAPS[0].id], completedHistoryMaps: [], finalChallengeMapId: null, finalChallengeAttempts: {},
  };
}

function isHistoryProgressShape(value: unknown): value is Omit<HistoryProgress, 'activeUnoMatch' | 'currentMapId'> {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<HistoryProgress>;
  return typeof progress.gold === 'number' && Number.isFinite(progress.gold)
    && typeof progress.fame === 'number' && Number.isFinite(progress.fame)
    && Array.isArray(progress.correctQuestions) && Array.isArray(progress.completedHeroes)
    && Array.isArray(progress.badges) && Array.isArray(progress.handledMatches)
    && progress.attempts !== null && typeof progress.attempts === 'object'
    && typeof progress.unoPlayed === 'number' && typeof progress.unoWon === 'number'
    && Array.isArray(progress.unlockedOutfits)
    && (progress.encounter === null || (progress.encounter !== undefined && typeof progress.encounter === 'object'));
}

export function isHistoryProgress(value: unknown): value is HistoryProgress {
  if (!isHistoryProgressShape(value)) return false;
  const activeUnoMatch = (value as Record<string, unknown>).activeUnoMatch;
  const currentMapId = (value as Record<string, unknown>).currentMapId;
  const progress = value as Partial<HistoryProgress>;
  return Object.prototype.hasOwnProperty.call(value, 'activeUnoMatch')
    && (activeUnoMatch === null || typeof activeUnoMatch === 'number')
    && Object.prototype.hasOwnProperty.call(value, 'currentMapId')
    && typeof currentMapId === 'string'
    && HISTORY_MAPS.some(map => map.id === currentMapId)
    && Array.isArray(progress.unlockedHistoryMaps)
    && progress.unlockedHistoryMaps.includes(currentMapId)
    && validNonNegativeInteger(progress.freeUnoTickets)
    && isBetOption(progress.selectedBet)
    && (progress.currentMatch === null || isHistoryCurrentMatch(progress.currentMatch))
    && validNonNegativeInteger(progress.totalWins)
    && validNonNegativeInteger(progress.totalLosses)
    && validNonNegativeInteger(progress.totalDraws)
    && Array.isArray(progress.bettingHistory)
    && progress.bettingHistory.every(isHistoryBetHistoryEntry)
    && Array.isArray(progress.completedHistoryMissions)
    && progress.completedHistoryMissions.every(mission => typeof mission === 'string')
    && Array.isArray(progress.discoveredHistoryMissions)
    && progress.discoveredHistoryMissions.every(mission => typeof mission === 'string')
    && Array.isArray(progress.unlockedHistoryMaps)
    && progress.unlockedHistoryMaps.every(mapId => HISTORY_MAPS.some(map => map.id === mapId))
    && Array.isArray(progress.completedHistoryMaps)
    && progress.completedHistoryMaps.every(mapId => HISTORY_MAPS.some(map => map.id === mapId))
    && Array.isArray(progress.unlockedTalents)
    && progress.unlockedTalents.every(talent => typeof talent === 'string')
    && (progress.activeHistoryMissionId === null || typeof progress.activeHistoryMissionId === 'string')
    && (progress.finalChallengeMapId === null || HISTORY_MAPS.some(map => map.id === progress.finalChallengeMapId))
    && progress.finalChallengeAttempts !== null
    && typeof progress.finalChallengeAttempts === 'object'
    && Object.entries(progress.finalChallengeAttempts).every(([mapId, count]) =>
      HISTORY_MAPS.some(map => map.id === mapId) && validNonNegativeInteger(count));
}

export function migrateHistoryProgress(value: unknown): HistoryProgress | undefined {
  if (isHistoryProgress(value)) return value;
  if (!isHistoryProgressShape(value)) return undefined;
  const stored = value as Record<string, unknown>;
  const currentMapId = typeof stored.currentMapId === 'string'
    && HISTORY_MAPS.some(map => map.id === stored.currentMapId)
    ? stored.currentMapId
    : !Object.prototype.hasOwnProperty.call(stored, 'currentMapId')
      ? HISTORY_HEROES[0].id
      : HISTORY_MAPS[0].id;
  const currentMapIndex = HISTORY_MAPS.findIndex(map => map.id === currentMapId);
  const legacyUnlockedMaps = HISTORY_MAPS.slice(0, Math.max(1, currentMapIndex + 1)).map(map => map.id);
  const unlockedHistoryMaps = Array.isArray(stored.unlockedHistoryMaps)
    ? [...new Set([
      ...legacyUnlockedMaps,
      ...stored.unlockedHistoryMaps.filter((mapId): mapId is string =>
        typeof mapId === 'string' && HISTORY_MAPS.some(map => map.id === mapId)),
    ])]
    : legacyUnlockedMaps;
  return {
    ...value,
    activeUnoMatch: typeof stored.activeUnoMatch === 'number' ? stored.activeUnoMatch : null,
    currentMapId,
    freeUnoTickets: validNonNegativeInteger(stored.freeUnoTickets) ? stored.freeUnoTickets : 0,
    selectedBet: isBetOption(stored.selectedBet) ? stored.selectedBet : UNO_BET_OPTIONS[0].bet,
    currentMatch: isHistoryCurrentMatch(stored.currentMatch) ? stored.currentMatch : null,
    totalWins: validNonNegativeInteger(stored.totalWins)
      ? stored.totalWins
      : validNonNegativeInteger(stored.unoWon) ? stored.unoWon : 0,
    totalLosses: validNonNegativeInteger(stored.totalLosses) ? stored.totalLosses : 0,
    totalDraws: validNonNegativeInteger(stored.totalDraws) ? stored.totalDraws : 0,
    bettingHistory: Array.isArray(stored.bettingHistory) ? stored.bettingHistory.filter(isHistoryBetHistoryEntry).slice(-50) : [],
    completedHistoryMissions: Array.isArray(stored.completedHistoryMissions)
      ? [...new Set(stored.completedHistoryMissions.filter((mission): mission is string => typeof mission === 'string'))]
      : [],
    activeHistoryMissionId: typeof stored.activeHistoryMissionId === 'string' ? stored.activeHistoryMissionId : null,
    discoveredHistoryMissions: Array.isArray(stored.discoveredHistoryMissions)
      ? [...new Set(stored.discoveredHistoryMissions.filter((mission): mission is string => typeof mission === 'string'))]
      : [],
    unlockedHistoryMaps,
    unlockedTalents: Array.isArray(stored.unlockedTalents)
      ? [...new Set(stored.unlockedTalents.filter((talent): talent is string => typeof talent === 'string'))]
      : [],
    completedHistoryMaps: Array.isArray(stored.completedHistoryMaps)
      ? [...new Set(stored.completedHistoryMaps.filter((mapId): mapId is string =>
        typeof mapId === 'string' && HISTORY_MAPS.some(map => map.id === mapId)))]
      : HISTORY_MAPS.slice(0, Math.max(0, currentMapIndex)).map(map => map.id),
    finalChallengeMapId: typeof stored.finalChallengeMapId === 'string'
      && HISTORY_MAPS.some(map => map.id === stored.finalChallengeMapId)
      ? stored.finalChallengeMapId : null,
    finalChallengeAttempts: stored.finalChallengeAttempts !== null && typeof stored.finalChallengeAttempts === 'object'
      ? Object.fromEntries(Object.entries(stored.finalChallengeAttempts).filter(([mapId, count]) =>
        HISTORY_MAPS.some(map => map.id === mapId) && validNonNegativeInteger(count)))
      : {},
  };
}

export function startHistoryMission(progress: HistoryProgress, missionId: string): HistoryProgress {
  const mission = historyMission(progress.currentMapId, missionId);
  if (!mission || progress.completedHistoryMissions.includes(missionId)) return progress;
  if (progress.activeHistoryMissionId && progress.activeHistoryMissionId !== missionId) return progress;
  if (!historyMissionAvailable(
    progress.currentMapId, mission, progress.completedHistoryMissions, progress.discoveredHistoryMissions,
  )) return progress;
  return { ...progress, activeHistoryMissionId: missionId };
}

export function completeHistoryMission(progress: HistoryProgress, targetLocationId: string): {
  progress: HistoryProgress;
  completedMissionId?: string;
} {
  const missionId = progress.activeHistoryMissionId;
  if (!missionId) return { progress };
  const mission = historyMission(progress.currentMapId, missionId);
  if (!mission || mission.targetLocationId !== targetLocationId || progress.completedHistoryMissions.includes(missionId)) return { progress };
  const completedHistoryMissions = [...progress.completedHistoryMissions, missionId];
  return {
    progress: {
      ...progress,
      gold: progress.gold + mission.gold,
      fame: progress.fame + mission.fame,
      badges: mission.badge && !progress.badges.includes(mission.badge) ? [...progress.badges, mission.badge] : progress.badges,
      unlockedOutfits: mission.outfit && !progress.unlockedOutfits.includes(mission.outfit)
        ? [...progress.unlockedOutfits, mission.outfit]
        : progress.unlockedOutfits,
      unlockedTalents: mission.talent && !progress.unlockedTalents.includes(mission.talent)
        ? [...progress.unlockedTalents, mission.talent]
        : progress.unlockedTalents,
      freeUnoTickets: progress.freeUnoTickets + (mission.tickets ?? 0),
      completedHistoryMissions,
      discoveredHistoryMissions: discoverEligibleHiddenMissions(
        progress.currentMapId, completedHistoryMissions, progress.discoveredHistoryMissions,
      ),
      activeHistoryMissionId: null,
    },
    completedMissionId: missionId,
  };
}

export function canStartFinalHistoryChallenge(progress: HistoryProgress, mapId: string): boolean {
  const index = HISTORY_MAPS.findIndex(map => map.id === mapId);
  const map = HISTORY_MAPS[index];
  if (!map || map.id !== progress.currentMapId || !progress.unlockedHistoryMaps.includes(mapId)) return false;
  const requiredFame = map.finalChallengeFame ?? HISTORY_MAPS[index + 1]?.unlockAt ?? map.unlockAt;
  const stats = historyMapMissionStats(mapId, progress.completedHistoryMissions, progress.discoveredHistoryMissions);
  const mandatoryMissionsCompleted = historyMapMandatoryMissionIds(mapId)
    .every(missionId => progress.completedHistoryMissions.includes(missionId));
  return progress.fame >= requiredFame && stats.mainCompleted >= stats.mainRequired
    && mandatoryMissionsCompleted;
}

export function resolveFinalHistoryChallenge(
  progress: HistoryProgress,
  outcome: HistoryBetOutcome,
): HistoryProgress | undefined {
  const mapId = progress.finalChallengeMapId;
  const mapIndex = mapId ? HISTORY_MAPS.findIndex(map => map.id === mapId) : -1;
  if (!mapId || mapIndex < 0 || !canStartFinalHistoryChallenge(progress, mapId)) return undefined;
  const map = HISTORY_MAPS[mapIndex];
  const nextMap = HISTORY_MAPS[mapIndex + 1];
  const won = outcome === 'win';
  const firstCompletion = won && !progress.completedHistoryMaps.includes(mapId);
  const mapBadge = `Hoàn thành · ${map.region}`;
  const mapOneOutfit = mapId === 'hai-ba-trung' ? 'Trang phục nữ tướng Mê Linh' : undefined;
  const mapOneTalent = mapId === 'hai-ba-trung' ? 'Tinh thần Mê Linh' : undefined;
  const completedHistoryMissions = won && !progress.completedHistoryMissions.includes(`${mapId}:finale`)
    ? [...progress.completedHistoryMissions, `${mapId}:finale`]
    : progress.completedHistoryMissions;
  const unlockedHistoryMaps = won && nextMap && !progress.unlockedHistoryMaps.includes(nextMap.id)
    ? [...progress.unlockedHistoryMaps, nextMap.id]
    : progress.unlockedHistoryMaps;
  const completedHistoryMaps = won && !progress.completedHistoryMaps.includes(mapId)
    ? [...progress.completedHistoryMaps, mapId]
    : progress.completedHistoryMaps;
  const resolved: HistoryProgress = {
    ...progress,
    gold: progress.gold + Number(firstCompletion) * 100,
    fame: progress.fame + Number(firstCompletion) * 100,
    badges: firstCompletion && !progress.badges.includes(mapBadge) ? [...progress.badges, mapBadge] : progress.badges,
    unlockedOutfits: firstCompletion && mapOneOutfit && !progress.unlockedOutfits.includes(mapOneOutfit)
      ? [...progress.unlockedOutfits, mapOneOutfit]
      : progress.unlockedOutfits,
    unlockedTalents: firstCompletion && mapOneTalent && !progress.unlockedTalents.includes(mapOneTalent)
      ? [...progress.unlockedTalents, mapOneTalent]
      : progress.unlockedTalents,
    freeUnoTickets: progress.freeUnoTickets + Number(firstCompletion && mapId === 'hai-ba-trung'),
    completedHistoryMissions,
    completedHistoryMaps,
    unlockedHistoryMaps,
    finalChallengeMapId: null,
    activeUnoMatch: null,
    currentMatch: null,
    totalWins: progress.totalWins + Number(won),
    totalLosses: progress.totalLosses + Number(outcome === 'loss'),
    totalDraws: progress.totalDraws + Number(outcome === 'draw'),
    unoPlayed: progress.unoPlayed + 1,
    unoWon: progress.unoWon + Number(won),
    latestReward: null,
  };
  if (!won) return resolved;
  const missionAwards = awardEligibleHistoryMissions(resolved);
  return {
    ...missionAwards.progress,
    latestReward: {
      title: `Hoàn thành bản đồ · ${map.region}`,
      gold: Number(firstCompletion) * 100 + missionAwards.gold,
      fame: Number(firstCompletion) * 100 + missionAwards.fame,
      wonUno: true,
      badge: mapBadge,
      newBadge: firstCompletion && !progress.badges.includes(mapBadge),
      unlocked: [
        ...(nextMap ? [nextMap.name] : ['Đã hoàn thành hành trình Sử Việt']),
        ...(mapOneOutfit ? [mapOneOutfit] : []),
        ...(mapOneTalent ? [`Thiên phú: ${mapOneTalent}`] : []),
      ],
      lesson: mapId === 'hai-ba-trung' ? historyMapStory(mapId).lesson : undefined,
      tickets: missionAwards.tickets + Number(firstCompletion && mapId === 'hai-ba-trung'),
      completedMissions: [`${mapId}:finale`, ...missionAwards.completed],
      missionOnly: true,
      outcome: 'win',
    },
  };
}

function validNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isBetOption(value: unknown): value is number {
  return UNO_BET_OPTIONS.some(option => option.bet === value);
}

function isHistoryCurrentMatch(value: unknown): value is HistoryCurrentMatch {
  if (!value || typeof value !== 'object') return false;
  const match = value as Partial<HistoryCurrentMatch>;
  return (match.matchId === null || validNonNegativeInteger(match.matchId))
    && (match.previousMatchId === undefined || match.previousMatchId === null || validNonNegativeInteger(match.previousMatchId))
    && isBetOption(match.stake)
    && validNonNegativeInteger(match.reward)
    && typeof match.freeTicket === 'boolean';
}

function isHistoryBetHistoryEntry(value: unknown): value is HistoryBetHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<HistoryBetHistoryEntry>;
  return validNonNegativeInteger(entry.matchId)
    && validNonNegativeInteger(entry.round)
    && isBetOption(entry.stake)
    && validNonNegativeInteger(entry.reward)
    && (entry.outcome === 'win' || entry.outcome === 'loss' || entry.outcome === 'draw')
    && typeof entry.freeTicket === 'boolean'
    && typeof entry.coinDelta === 'number'
    && Number.isSafeInteger(entry.coinDelta);
}

export function awardEligibleHistoryMissions(progress: HistoryProgress): {
  progress: HistoryProgress;
  gold: number;
  fame: number;
  tickets: number;
  completed: string[];
} {
  const completed = new Set(progress.completedHistoryMissions);
  const newlyCompleted: string[] = [];
  let gold = 0;
  let fame = 0;
  let tickets = 0;
  const complete = (id: string, award: { gold?: number; fame?: number; tickets: number }) => {
    if (completed.has(id)) return;
    completed.add(id);
    newlyCompleted.push(id);
    gold += award.gold ?? 0;
    fame += award.fame ?? 0;
    tickets += award.tickets;
  };

  if (progress.correctQuestions.length >= 5) complete('correct-5', { gold: 500, fame: 20, tickets: 1 });
  for (const hero of HISTORY_HEROES) {
    if (progress.completedHeroes.includes(hero.id)) complete(`hero-${hero.id}`, { tickets: 2 });
  }
  if (progress.fame >= 100) complete('fame-100', { tickets: 1 });

  return {
    progress: {
      ...progress,
      gold: progress.gold + gold,
      fame: progress.fame + fame,
      freeUnoTickets: progress.freeUnoTickets + tickets,
      completedHistoryMissions: [...completed],
    },
    gold,
    fame,
    tickets,
    completed: newlyCompleted,
  };
}

export function readHistoryProgress(): HistoryProgress {
  const raw = localStorage.getItem(HISTORY_PROGRESS_KEY);
  if (!raw) return freshHistoryProgress();
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('Bản lưu hành trình không đọc được. Tiến trình mới sẽ được lưu sau lần chơi tiếp theo.'); }
  const migrated = migrateHistoryProgress(value);
  if (migrated) {
    if (!isHistoryProgress(value)) saveHistoryProgress(migrated);
    return migrated;
  }
  throw new Error('Bản lưu hành trình không hợp lệ. Tiến trình mới sẽ được lưu sau lần chơi tiếp theo.');
}

export function saveHistoryProgress(progress: HistoryProgress): void {
  localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
  localStorage.setItem('su-viet-hanh-trinh-saved-at', new Date().toISOString());
  window.setTimeout(() => window.dispatchEvent(new Event('xnl-history-save')), 0);
}

export function uniqueCorrectCount(progress: HistoryProgress, heroId: string): number {
  const hero = HISTORY_HEROES.find(item => item.id === heroId);
  if (!hero) return 0;
  return hero.questions.filter(item => progress.correctQuestions.includes(item.id)).length;
}
