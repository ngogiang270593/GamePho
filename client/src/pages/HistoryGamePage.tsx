import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HISTORY_HEROES, FAME_RANKS, fameRank, type HistoryHero } from '../game/suViet';
import { CARD_CAST, CARD_PLAY_STYLES, cardPlayStyleIndex, type CardDifficulty } from '../game/cards';
import { WorldMap } from '../components/WorldMap';
import { CharacterSprite } from '../components/CharacterSprite';
import { HeroSkillTree } from '../components/HeroSkillTree';
import { MelinRiverCampaign } from '../components/MelinRiverCampaign';
import { MelinCheckpointBattle } from '../components/MelinCheckpointBattle';
import { SystemPreferences } from '../components/SystemPreferences';
import { CharacterPage } from './CharacterPage';
import { HISTORY_MAPS, historyMapPositionKey } from '../game/suVietMap';
import { FINAL_CHALLENGE_PROMPT, historyMapScene } from '../game/historyMapScene';
import { historyMapMandatoryMissionIds, historyMapMissionStats, historyMapStory, historyMission, HISTORY_MISSIONS } from '../game/historyMissions';
import { historyMissionAvailable } from '../game/historyMissions';
import { MAP_ONE_CHAPTER_MAIN_REQUIREMENTS, MAP_ONE_CHARACTERS, MAP_ONE_CHAPTERS } from '../game/historyMapOne';
import { MAP_ONE_NPCS, type MapOneNpcDefinition } from '../game/mapOneNpcs';
import { freshHistoryProfile, readHistoryProfile, saveHistoryProfile, type HistoryProfile } from '../services/historyProfile';
import {
  createHistorySnapshot,
  deleteHistorySlot,
  HISTORY_POSITION_KEY,
  HISTORY_SAVE_SLOT_COUNT,
  readHistorySaveSlots,
  saveHistorySlot,
  type HistorySaveSlot,
} from '../services/historySaves';
import {
  awardEligibleHistoryMissions,
  canStartFinalHistoryChallenge,
  completeHistoryMission,
  freshHistoryProgress,
  readHistoryProgress,
  resolveFinalHistoryChallenge,
  saveHistoryProgress,
  startHistoryMission,
  UNO_BET_OPTIONS,
  uniqueCorrectCount,
  type HistoryBetOutcome,
  type HistoryProgress,
  type HistoryReward,
} from '../services/historyProgress';
import type { WorldLocation } from '../game/world';
import { CardRoomPage } from './CardRoomPage';
import { OnlineUnoPage } from './OnlineUnoPage';
import { onlineGame } from '../services/gameMode';
import { logoutAccount, useAccount, useAccountGateActions } from '../components/AccountGate';
import {
  createHistoryCloudSave,
  emptyHistoryCloudSave,
  hasLocalHistory,
  hasStoredHistory,
  historySavesMatch,
  readHistoryCloudSave,
  readOfflineHistorySave,
  saveHistoryCloudSave,
  writeOfflineHistorySave,
  type HistoryCloudSave,
} from '../services/historyCloud';
import type { CharacterCustomization, CharacterItem } from '../game/characterCustomization';
import '../styles/su-viet.css';
import '../styles/title-screen.css';
import { MapDialog } from '../components/MapDialog';
import { VillageShop } from '../components/VillageShop';
import { VillageActivities } from '../components/VillageActivities';
import { VILLAGE_LOCATIONS } from '../game/villageLocations';
import { VILLAGE_NPC_ACTIONS } from '../game/villageNpcs';
import type { PlayableCharacterId } from '../game/startingCharacters';
import { applyVillageCommand, saveVillageResult, type VillageCommand } from '../services/villageGame';
import { applyRiverCampaignAction, normalizeRiverCampaign, type RiverCampaignAction } from '../game/riverCampaign';
import { OPENING_MAP_REST_POINT } from '../game/openingMap';
import '../styles/village-game.css';

type Screen = 'title' | 'offline-home' | 'world' | 'sync-choice' | 'map' | 'skills' | 'river-campaign' | 'river-boss' | 'atlas' | 'missions' | 'entertainment' | 'training' | 'matchmaking' | 'final-challenge' | 'story' | 'question' | 'map-one-question' | 'collection' | 'achievements' | 'reward' | 'character' | 'backup' | 'settings' | 'help';

type TrainingNpc = Pick<MapOneNpcDefinition, 'id' | 'name' | 'activity' | 'appearance' | 'design' | 'icon'> & { style: string };

function loadedProgress() {
  try { return { progress: readHistoryProgress(), error: '' }; }
  catch (cause) {
    return {
      progress: freshHistoryProgress(),
      error: cause instanceof Error ? cause.message : 'Không đọc được bản lưu trên thiết bị.',
    };
  }
}

function loadedProfile() {
  try { return { profile: readHistoryProfile(), error: '' }; }
  catch (cause) {
    return {
      profile: freshHistoryProfile(),
      error: cause instanceof Error ? cause.message : 'Không đọc được hồ sơ nhân vật trên thiết bị.',
    };
  }
}

function finalChallengeFame(mapIndex: number) {
  const map = HISTORY_MAPS[mapIndex];
  return map?.finalChallengeFame ?? HISTORY_MAPS[mapIndex + 1]?.unlockAt ?? map?.unlockAt ?? 0;
}

function mapOneCharacter(id?: string) {
  return id ? MAP_ONE_CHARACTERS.find(character => character.id === id) : undefined;
}

export function HistoryGamePage() {
  const account = useAccount();
  const { openAccountScreen } = useAccountGateActions();
  const [activeMode, setActiveMode] = useState<'offline' | 'online'>(() =>
    onlineGame && localStorage.getItem('xnl-game-mode') === 'online' ? 'online' : 'offline');
  const location = useLocation();
  const navigate = useNavigate();
  const [initial] = useState(loadedProgress);
  const [progress, setProgress] = useState(initial.progress);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [initialCharacter] = useState(loadedProfile);
  const [profile, setProfile] = useState(initialCharacter.profile);
  const [saveSlots, setSaveSlots] = useState<HistorySaveSlot[]>([]);
  const [screen, setScreen] = useState<Screen>(() => ['/uno', '/map', '/chapter-1'].includes(location.pathname) ? 'map' : 'title');
  const [backupReturnScreen, setBackupReturnScreen] = useState<Screen>('map');
  const [settingsReturnScreen, setSettingsReturnScreen] = useState<Screen>('title');
  const [newJourneySetup, setNewJourneySetup] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState(initial.error || initialCharacter.error);
  const [titleNotice, setTitleNotice] = useState('');
  const [villagePlace, setVillagePlace] = useState<string|null>(null);
  const [villageNotice, setVillageNotice] = useState('');
  const [mapOneCharacterId, setMapOneCharacterId] = useState<string|null>(null);
  const [mapOneAnswer, setMapOneAnswer] = useState<number|null>(null);
  const [mapOneAnswerCorrect, setMapOneAnswerCorrect] = useState<boolean|null>(null);
  const [mapOneAnswerRewarded, setMapOneAnswerRewarded] = useState(false);
  const [missionNotice, setMissionNotice] = useState('');
  const [trainingOpponentCount, setTrainingOpponentCount] = useState(1);
  const [trainingDifficulty, setTrainingDifficulty] = useState<CardDifficulty>('easy');
  const [trainingTargetScore, setTrainingTargetScore] = useState(200);
  const [trainingInitialCards, setTrainingInitialCards] = useState(7);
  const [selectedTrainingNpcIds, setSelectedTrainingNpcIds] = useState<string[]>([]);
  const [finalChallengeReturnScreen, setFinalChallengeReturnScreen] = useState<Screen>('map');
  const [matchmakingNotice, setMatchmakingNotice] = useState('');
  const [onlineSaveChoice, setOnlineSaveChoice] = useState<HistoryCloudSave | null>(null);
  const [onlineSaveBusy, setOnlineSaveBusy] = useState(false);
  const [onlineSaveNotice, setOnlineSaveNotice] = useState('');
  const worldIntent = useRef(localStorage.getItem('xnl-world-login-pending') === 'yes');
  const handledAccount = useRef<string | null>(null);
  const applyingCloudSave = useRef(false);
  const villageCurrent = useRef({progress,profile});
  villageCurrent.current = {progress,profile};

  function villageCommand(command:VillageCommand):boolean {
    try {
      const result = applyVillageCommand(villageCurrent.current.progress,villageCurrent.current.profile,command);
      saveVillageResult(result);
      villageCurrent.current = result;
      progressRef.current=result.progress;
      setProgress(result.progress);setProfile(result.profile);setVillageNotice(result.message);
      return true;
    } catch(cause) {
      setVillageNotice(cause instanceof Error ? cause.message : 'Chưa lưu được thay đổi. Vui lòng thử lại.');
      return false;
    }
  }

  function openVillage(place:string) { setVillageNotice('');setVillagePlace(place); }
  const [installHintRequest, setInstallHintRequest] = useState(0);

  useEffect(() => {
    if (!installHintRequest) return;
    if (screen !== 'title') { setInstallHintRequest(0); return; }
    const timer = window.setTimeout(() => setInstallHintRequest(0), 8000);
    return () => window.clearTimeout(timer);
  }, [installHintRequest, screen]);

  useEffect(() => {
    if (exiting) setScreen('title');
  }, [exiting]);

  useEffect(() => {
    if (!onlineGame || !account || activeMode !== 'online' && !worldIntent.current) return;
    if (handledAccount.current === account.id) return;
    const openingWorld = worldIntent.current;
    handledAccount.current = account.id;
    worldIntent.current = false;
    localStorage.removeItem('xnl-world-login-pending');
    try {
      if (initial.error || initialCharacter.error) {
        setError(initial.error || initialCharacter.error);
        setScreen('title');
        return;
      }
      const cloudSave = readHistoryCloudSave(account);
      const localSave = hasStoredHistory() ? createHistoryCloudSave(progress, profile) : null;
      if (cloudSave && localSave && !historySavesMatch(cloudSave, localSave)) {
        setOnlineSaveChoice(cloudSave);
        setOnlineSaveNotice('');
        setScreen('sync-choice');
        return;
      }
      if (localSave && !cloudSave) {
        setOnlineSaveChoice(null);
        setOnlineSaveNotice('');
        setScreen('sync-choice');
        return;
      }
      if (cloudSave && localSave && historySavesMatch(cloudSave, localSave)) {
        localStorage.setItem('xnl-game-mode', 'online');
        setActiveMode('online');
        setScreen(openingWorld ? 'world' : 'map');
        return;
      }
      if (cloudSave) {
        applyOnlineSave(cloudSave);
        return;
      }
      localStorage.setItem('xnl-game-mode', 'online');
      setActiveMode('online');
      setNewJourneySetup(true);
      setScreen('character');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đọc hành trình online.');
      setScreen('title');
    }
  }, [account, activeMode, initial.error, initialCharacter.error, progress, profile]);

  useEffect(() => {
    if (activeMode !== 'offline' || localStorage.getItem('xnl-last-saved-mode') === 'online'
      || !profile.displayName || !hasLocalHistory()) return;
    const saveOffline = () => {
      try {
        writeOfflineHistorySave(createHistoryCloudSave(progress, profile));
        localStorage.setItem('xnl-last-saved-mode', 'offline');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Chưa lưu được hành trình offline.');
      }
    };
    saveOffline();
    const timer = window.setInterval(saveOffline, 30000);
    return () => window.clearInterval(timer);
  }, [activeMode, progress, profile]);

  useEffect(() => {
    if (!onlineGame || activeMode !== 'online' || !account) return;
    let writing = false;
    let pending = false;
    const sync = async () => {
      if (applyingCloudSave.current) return;
      pending = true;
      if (writing) return;
      writing = true;
      try {
        while (pending) {
          pending = false;
          await saveHistoryCloudSave(createHistoryCloudSave(progressRef.current, villageCurrent.current.profile));
        }
        setOnlineSaveNotice('');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Chưa lưu được hành trình online.');
      } finally {
        writing = false;
      }
    };
    const onLocalSave = () => { void sync(); };
    const timer = window.setInterval(onLocalSave, 30000);
    window.addEventListener('xnl-history-save', onLocalSave);
    window.addEventListener('pagehide', onLocalSave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('xnl-history-save', onLocalSave);
      window.removeEventListener('pagehide', onLocalSave);
    };
  }, [account, activeMode]);

  useEffect(() => {
    if (activeMode !== 'offline' || localStorage.getItem('xnl-game-mode') !== 'offline'
      || localStorage.getItem('xnl-last-saved-mode') !== 'online') return;
    try {
      const offlineSave = readOfflineHistorySave();
      if (offlineSave) loadOfflineHistorySave(offlineSave, 'map');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể khôi phục hành trình offline.');
    }
  }, []);

  const updateProgress = useCallback((update: (current: HistoryProgress) => HistoryProgress) => {
    try {
      const next = update(progressRef.current);
      saveHistoryProgress(next);
      progressRef.current = next;
      setProgress(next);
      setError('');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được tiến trình. Hãy kiểm tra bộ nhớ trình duyệt.');
      return false;
    }
  }, []);

  const requestedChapterEntry = (location.state as { riverCampaignEntry?: unknown } | null)?.riverCampaignEntry;
  const riverChapterEntry = location.pathname === '/chapter-1'
    ? requestedChapterEntry === 'righteous' || requestedChapterEntry === 'shadow'
      ? requestedChapterEntry
      : normalizeRiverCampaign(initial.progress.riverCampaign).worldMapEntry
    : null;
  useEffect(() => {
    if (location.pathname !== '/chapter-1') return;
    updateProgress(current => current.currentMapId === 'hai-ba-trung'
      ? current
      : { ...current, currentMapId: 'hai-ba-trung', activeHistoryMissionId: null });
    setScreen('map');
    setMissionNotice(riverChapterEntry === 'shadow'
      ? 'Chương 1 · Lối vào Tà đạo: dân làng dè chừng, hãy tìm cách khôi phục lòng tin.'
      : riverChapterEntry === 'righteous'
        ? 'Chương 1 · Lối vào Chính đạo: dân làng chào đón người đã bảo vệ xóm làng.'
        : 'Chương 1 · Mê Linh: bắt đầu hành trình qua các nhiệm vụ lịch sử.');
  }, [location.pathname, riverChapterEntry, updateProgress]);

  const applyRiverAction = useCallback((action: RiverCampaignAction) => {
    try {
      const campaign = applyRiverCampaignAction(
        progressRef.current.riverCampaign,
        action,
        profile.heroDevelopment.talent,
      );
      return updateProgress(current => ({ ...current, riverCampaign: campaign }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa thể cập nhật tiến trình Bến Nước.');
      return false;
    }
  }, [profile.heroDevelopment.talent, updateProgress]);

  const fameLevel = fameRank(progress.fame);
  const mapScene = useMemo(() => historyMapScene(progress), [progress]);
  const currentMap = mapScene.map;
  const currentMapIndex = HISTORY_MAPS.findIndex(map => map.id === currentMap.id);
  const currentMapHero = HISTORY_HEROES.find(hero => hero.id === currentMap.heroId);
  const nextMap = HISTORY_MAPS[(currentMapIndex + 1) % HISTORY_MAPS.length];
  const finalChallengeMap = HISTORY_MAPS.find(map => map.id === progress.finalChallengeMapId);
  const currentMapStory = historyMapStory(currentMap.id);
  const currentMapMissionStats = historyMapMissionStats(currentMap.id, progress.completedHistoryMissions, progress.discoveredHistoryMissions);
  const requiredChallengeFame = finalChallengeFame(currentMapIndex);
  const mandatoryChallengeMissions = historyMapMandatoryMissionIds(currentMap.id)
    .map(missionId => historyMission(currentMap.id, missionId))
    .filter((mission): mission is NonNullable<typeof mission> => Boolean(mission));
  const missingMandatoryChallengeMissions = mandatoryChallengeMissions
    .filter(mission => !progress.completedHistoryMissions.includes(mission.id));
  const mainMissionPercent = Math.floor(currentMapMissionStats.mainCompleted / Math.max(1, currentMapMissionStats.mainTotal) * 100);
  const missingMissionPercent = Math.max(0, 91 - mainMissionPercent);
  const trainingNpcs = useMemo<TrainingNpc[]>(() => currentMap.id === 'hai-ba-trung'
    ? MAP_ONE_NPCS
      .filter(npc => (npc.kind !== 'historical' || progress.completedHistoryMaps.includes(currentMap.id))
        && (npc.kind !== 'hidden' || progress.discoveredHistoryMissions.some(missionId =>
          HISTORY_MISSIONS.find(mission => mission.id === missionId)?.targetLocationId === npc.locationId,
        )))
      .map(npc => ({ ...npc, style: CARD_PLAY_STYLES[cardPlayStyleIndex(npc.id)] }))
    : CARD_CAST.map((npc, index) => ({
      id: npc.id,
      name: npc.name,
      activity: npc.style,
      style: CARD_PLAY_STYLES[cardPlayStyleIndex(npc.id)],
      icon: ['🧺', '🪁', '🌿', '🪵', '🍵'][index % 5],
      appearance: MAP_ONE_NPCS[index]?.appearance ?? MAP_ONE_NPCS[0].appearance,
      design: MAP_ONE_NPCS[index]?.design ?? MAP_ONE_NPCS[0].design,
    })),
  [currentMap.id, progress.completedHistoryMaps, progress.discoveredHistoryMissions]);
  const mapOneChapterProgress = useMemo(() => MAP_ONE_CHAPTERS.map(chapter => {
    const missions = HISTORY_MISSIONS.filter(mission => mission.mapId === 'hai-ba-trung' && mission.chapterId === chapter.id);
    const completed = missions.filter(mission => progress.completedHistoryMissions.includes(mission.id)).length;
    return { chapter, missions, completed, complete: missions.length > 0 && completed === missions.length };
  }), [progress.completedHistoryMissions]);
  const activeHistoryMission = progress.activeHistoryMissionId
    ? historyMission(currentMap.id, progress.activeHistoryMissionId)
    : undefined;
  const nextLevel = FAME_RANKS.find(rank => rank.score > progress.fame);
  const currentHero = progress.encounter
    ? HISTORY_HEROES.find(hero => hero.id === progress.encounter?.heroId)
    : undefined;
  const currentQuestion = currentHero?.questions.find(question => question.id === progress.encounter?.questionId);

  useEffect(() => {
    if (screen !== 'map' || currentMap.id !== 'hai-ba-trung'
      || progress.completedHistoryMaps.includes(currentMap.id)
      || !canStartFinalHistoryChallenge(progress, currentMap.id)) return;
    setMissionNotice(FINAL_CHALLENGE_PROMPT);
  }, [screen, currentMap.id, progress]);

  function returnToMapAfterEncounter() {
    const current = progressRef.current;
    const nextMission = current.activeHistoryMissionId
      ? historyMission(current.currentMapId, current.activeHistoryMissionId)
      : undefined;
    const targetName = nextMission
      ? [...currentMap.landmarks, ...VILLAGE_LOCATIONS].find(item => item.id === nextMission.targetLocationId)?.name
      : undefined;
    if (!updateProgress(value => ({ ...value, encounter: null, latestReward: null }))) return;
    setScreen('map');
    if (canStartFinalHistoryChallenge(current, currentMap.id)
      && !current.completedHistoryMaps.includes(currentMap.id)) {
      setMissionNotice(FINAL_CHALLENGE_PROMPT);
    } else if (nextMission) {
      setMissionNotice(`Nhiệm vụ tiếp theo: ${nextMission.title}${targetName ? ` · Mục tiêu: ${targetName}` : ''}`);
    } else {
      setMissionNotice('');
    }
  }

  function chooseRandomTrainingNpcs(count = trainingOpponentCount) {
    const shuffled = [...trainingNpcs].sort(() => Math.random() - 0.5);
    setSelectedTrainingNpcIds(shuffled.slice(0, count).map(npc => npc.id));
  }

  function openEntertainment() {
    setSelectedTrainingNpcIds([]);
    setTrainingOpponentCount(1);
    setTrainingDifficulty('easy');
    setTrainingTargetScore(200);
    setTrainingInitialCards(7);
    setScreen('entertainment');
  }

  function openFinalChallenge(returnScreen: Screen) {
    setFinalChallengeReturnScreen(returnScreen);
    setScreen('final-challenge');
  }

  function startSelectedPractice() {
    const selected = trainingNpcs.filter(npc => selectedTrainingNpcIds.includes(npc.id)).slice(0, trainingOpponentCount);
    if (selected.length !== trainingOpponentCount) {
      setError(`Hãy chọn đúng ${trainingOpponentCount} đối thủ luyện tập.`);
      return;
    }
    setError('');
    navigate('/uno', {
      state: {
        historyPractice: true,
        historyPracticeOpponentNames: selected.map(npc => npc.name),
        historyPracticeOpponentIds: selected.map(npc => npc.id),
        historyPracticeDifficulty: trainingDifficulty,
        historyPracticeTargetScore: trainingTargetScore,
        historyPracticeInitialCards: trainingInitialCards,
      },
    });
  }

  useEffect(() => {
    if (location.pathname === '/uno') return;
    if (progress.latestReward) setScreen('reward');
    else if (progress.encounter?.stage === 'story') setScreen('story');
    else if (progress.encounter?.stage === 'question' || progress.encounter?.stage === 'answered') setScreen('question');
  }, [location.pathname, progress.encounter?.stage, progress.latestReward]);

  function beginEncounter(hero: HistoryHero) {
    if (progress.fame < hero.unlockAt) return;
    const remaining = hero.questions.filter(question => !progress.correctQuestions.includes(question.id));
    const pool = remaining.length ? remaining : hero.questions;
    const question = pool[Math.floor(Math.random() * pool.length)];
    if (!updateProgress(current => ({
      ...current,
      encounter: { heroId: hero.id, questionId: question.id, stage: 'story' },
      latestReward: null,
    }))) return;
    setScreen('story');
  }

  function goToQuestion() {
    if (!updateProgress(current => current.encounter
      ? { ...current, encounter: { ...current.encounter, stage: 'question' } }
      : current)) return;
    setScreen('question');
  }

  function answerQuestion(index: number) {
    if (!currentHero || !currentQuestion || progress.encounter?.stage !== 'question') return;
    const correct = index === currentQuestion.correct;
    const previousAttempts = progress.attempts[currentQuestion.id] ?? 0;
    let quizGold = correct ? (previousAttempts === 0 ? 20 : 8) : 0;
    let quizFame = correct ? (previousAttempts === 0 ? 20 : 5) : 0;
    const newlyCorrect = correct && !progress.correctQuestions.includes(currentQuestion.id);
    const correctQuestions = newlyCorrect
      ? [...progress.correctQuestions, currentQuestion.id]
      : progress.correctQuestions;
    const justCompleted = newlyCorrect
      && !progress.completedHeroes.includes(currentHero.id)
      && currentHero.questions.every(question => correctQuestions.includes(question.id));
    let badges = progress.badges;
    let completedHeroes = progress.completedHeroes;
    if (justCompleted) {
      quizGold += currentHero.reward.gold;
      quizFame += currentHero.reward.fame;
      completedHeroes = [...completedHeroes, currentHero.id];
      if (!badges.includes(currentHero.badge)) badges = [...badges, currentHero.badge];
    }
    let encounter = {
      ...progress.encounter,
      stage: 'answered' as const,
      correct,
      selectedAnswer: index,
      quizGold,
      quizFame,
      quizTickets: 0,
    };
    const awarded = awardEligibleHistoryMissions({
      ...progress,
      gold: progress.gold + quizGold,
      fame: progress.fame + quizFame,
      attempts: { ...progress.attempts, [currentQuestion.id]: previousAttempts + 1 },
      correctQuestions,
      completedHeroes,
      badges,
      encounter,
    });
    quizGold += awarded.gold;
    quizFame += awarded.fame;
    encounter = {
      ...encounter,
      quizGold,
      quizFame,
      quizTickets: awarded.tickets,
      completedMissionRewards: awarded.completed,
    };
    const progressSaved = updateProgress(() => ({
      ...awarded.progress,
      attempts: { ...progress.attempts, [currentQuestion.id]: previousAttempts + 1 },
      correctQuestions,
      completedHeroes,
      badges,
      encounter,
      latestReward: awarded.completed.length ? {
        title: 'Hoàn thành nhiệm vụ lịch sử',
        gold: quizGold,
        fame: quizFame,
        wonUno: false,
        tickets: awarded.tickets,
        completedMissions: awarded.completed,
        missionOnly: true,
      } : null,
    }));
    if (!progressSaved) return;
  }

  const onMatchFinished = useCallback((result: { matchId: number; round: number; outcome: HistoryBetOutcome }) => {
    updateProgress(current => {
      const matchKey = `${result.matchId}-${result.round}`;
      if (current.handledMatches.includes(matchKey)
        || current.activeUnoMatch !== result.matchId && current.currentMatch?.matchId !== result.matchId) return current;
      if (current.finalChallengeMapId) {
        const challengeResult = resolveFinalHistoryChallenge(current, result.outcome);
        if (!challengeResult) return current;
        return {
          ...challengeResult,
          handledMatches: [...current.handledMatches, matchKey].slice(-50),
        };
      }
      const routeState = location.state as { historyPractice?: boolean } | null;
      if (routeState?.historyPractice) {
        const won = result.outcome === 'win';
        return {
          ...current,
          gold: current.gold + Number(won) * 5,
          totalWins: current.totalWins + Number(won),
          totalLosses: current.totalLosses + Number(result.outcome === 'loss'),
          totalDraws: current.totalDraws + Number(result.outcome === 'draw'),
          unoPlayed: current.unoPlayed + 1,
          unoWon: current.unoWon + Number(won),
          activeUnoMatch: null,
          currentMatch: null,
          handledMatches: [...current.handledMatches, matchKey].slice(-50),
          latestReward: {
            title: won ? 'Luyện tập hoàn thành' : result.outcome === 'draw' ? 'Ván luyện tập hòa' : 'Ván luyện tập hoàn thành',
            gold: Number(won) * 5,
            fame: 0,
            wonUno: won,
            outcome: result.outcome,
            practiceOnly: true,
          },
        };
      }
      const encounter = current.encounter?.stage === 'answered' ? current.encounter : null;
      const hero = encounter ? HISTORY_HEROES.find(item => item.id === encounter.heroId) : undefined;
      const quizGold = encounter?.quizGold ?? 0;
      const quizFame = encounter?.quizFame ?? 0;
      const won = result.outcome === 'win';
      const wonGold = won && encounter ? 60 : 0;
      const wonFame = won && encounter ? 35 : 0;
      const wager = current.currentMatch?.matchId === result.matchId ? current.currentMatch : null;
      const stakeReturn = wager && !wager.freeTicket && (won || result.outcome === 'draw') ? wager.stake : 0;
      const ticketReturn = wager?.freeTicket && result.outcome === 'draw' ? 1 : 0;
      const payout = wager && won ? wager.reward : 0;
      const coinDelta = result.outcome === 'loss'
        ? wager && !wager.freeTicket ? -wager.stake : 0
        : payout;
      const bettingEntry = {
        matchId: result.matchId,
        round: result.round,
        stake: wager?.stake ?? 0,
        reward: payout,
        outcome: result.outcome,
        freeTicket: wager?.freeTicket ?? true,
        coinDelta,
      };
      let badges = current.badges;
      let newBadge = false;
      let outfits = current.unlockedOutfits;
      let rewardBadge: string | undefined;
      if (won && encounter && !badges.includes('Cao thủ UNO xóm')) {
        rewardBadge = 'Cao thủ UNO xóm';
        badges = [...badges, rewardBadge];
        outfits = outfits.includes('Áo bà ba hoa nắng') ? outfits : [...outfits, 'Áo bà ba hoa nắng'];
        newBadge = true;
      }
      const nextFame = current.fame + wonFame;
      const unlocked = HISTORY_HEROES
        .filter(item => item.unlockAt > current.fame - quizFame && item.unlockAt <= nextFame)
        .map(item => item.name);
      const settled = {
        ...current,
        gold: current.gold + wonGold + stakeReturn + payout,
        freeUnoTickets: current.freeUnoTickets + ticketReturn,
        fame: nextFame,
        unoPlayed: current.unoPlayed + 1,
        unoWon: current.unoWon + Number(won),
        totalWins: current.totalWins + Number(result.outcome === 'win'),
        totalLosses: current.totalLosses + Number(result.outcome === 'loss'),
        totalDraws: current.totalDraws + Number(result.outcome === 'draw'),
        bettingHistory: [bettingEntry, ...current.bettingHistory].slice(0, 50),
        badges,
        unlockedOutfits: outfits,
        currentMatch: null,
        activeUnoMatch: null,
        handledMatches: [...current.handledMatches, matchKey].slice(-50),
      };
      const missionAwards = awardEligibleHistoryMissions(settled);
      const bettingMessage = result.outcome === 'draw'
        ? wager?.freeTicket ? 'Ván hòa, Vé UNO được hoàn lại.' : 'Ván hòa, tiền cược được hoàn lại.'
        : result.outcome === 'loss'
          ? wager && !wager.freeTicket ? `Bạn thua và mất ${wager.stake.toLocaleString('vi-VN')} xu.` : 'Bạn thua, Vé UNO miễn phí đã được sử dụng; không mất xu.'
          : wager?.freeTicket
            ? `Bạn thắng và nhận được ${payout.toLocaleString('vi-VN')} xu.`
            : wager
              ? `Bạn thắng và nhận được ${payout.toLocaleString('vi-VN')} xu; tiền cược đã được hoàn lại.`
              : 'Bạn thắng ván UNO!';
      const nextReward: HistoryReward = {
        title: hero ? `Chuyện gặp ${hero.name}` : result.outcome === 'draw' ? 'Ván hòa ở quán nước' : 'Ván UNO ở quán nước',
        gold: quizGold + wonGold + payout + missionAwards.gold,
        fame: quizFame + wonFame + missionAwards.fame,
        wonUno: won,
        badge: rewardBadge ?? (hero && current.completedHeroes.includes(hero.id) ? hero.badge : undefined),
        newBadge,
        unlocked,
        tickets: (encounter?.quizTickets ?? 0) + missionAwards.tickets,
        completedMissions: [...(encounter?.completedMissionRewards ?? []), ...missionAwards.completed],
        bettingMessage,
        outcome: result.outcome,
      };
      return {
        ...missionAwards.progress,
        latestReward: nextReward,
        encounter,
      };
    });
  }, [location.state, updateProgress]);

  function closeReward() {
    const returnToEntertainment = progress.latestReward?.practiceOnly === true;
    if (returnToEntertainment) {
      if (!updateProgress(current => ({ ...current, latestReward: null, encounter: null }))) return;
      setScreen('entertainment');
      return;
    }
    returnToMapAfterEncounter();
  }

  function startFreeTicketUno() {
    if (progress.freeUnoTickets < 1) return;
    if (!updateProgress(current => ({ ...current, activeUnoMatch: null }))) return;
    navigate('/uno', { state: { useFreeTicket: true } });
  }

  function openBackups() {
    try {
      setSaveSlots(readHistorySaveSlots());
      setError(initial.error);
      setBackupReturnScreen(screen);
      setScreen('backup');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không đọc được các ô sao lưu.');
    }
  }

  function applyOnlineSave(save: HistoryCloudSave): boolean {
    if (hasStoredHistory()) {
      try {
        if (activeMode === 'offline' && hasLocalHistory()) {
          writeOfflineHistorySave(createHistoryCloudSave(progressRef.current, profile));
        }
        const slots = readHistorySaveSlots();
        const freeSlot = Array.from({ length: HISTORY_SAVE_SLOT_COUNT }, (_, index) => index + 1)
          .find(slot => !slots.some(entry => entry.slot === slot));
        if (!freeSlot) {
          setError('Cả 5 ô lưu đều đã dùng. Hãy giải phóng một ô trước khi thay dữ liệu trên thiết bị.');
          return false;
        }
        setSaveSlots(saveHistorySlot(freeSlot, createHistorySnapshot(progressRef.current, profile)));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Không thể bảo toàn hành trình offline hiện tại.');
        return false;
      }
    }
    applyingCloudSave.current = true;
    try {
      saveHistoryProgress(save.progress);
      saveHistoryProfile(save.profile);
      for (const map of HISTORY_MAPS) {
        const point = save.positions[map.id];
        const key = historyMapPositionKey(map.id);
        if (point) localStorage.setItem(key, JSON.stringify(point));
        else localStorage.removeItem(key);
      }
      progressRef.current = save.progress;
      setProgress(save.progress);
      setProfile(save.profile);
      setNewJourneySetup(false);
      setOnlineSaveChoice(null);
      setActiveMode('online');
      localStorage.setItem('xnl-game-mode', 'online');
      localStorage.setItem('xnl-last-saved-mode', 'online');
      setExiting(false);
      setError('');
      setScreen('map');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể khôi phục hành trình online.');
      return false;
    } finally {
      applyingCloudSave.current = false;
    }
  }

  async function keepOfflineJourneyOnline() {
    if (onlineSaveBusy || !account) return;
    setOnlineSaveBusy(true);
    setOnlineSaveNotice('');
    try {
      const localSave = createHistoryCloudSave(progressRef.current, profile);
      if (activeMode === 'offline' && hasLocalHistory()) writeOfflineHistorySave(localSave);
      await saveHistoryCloudSave(localSave);
      setOnlineSaveChoice(null);
      setActiveMode('online');
      localStorage.setItem('xnl-game-mode', 'online');
      localStorage.setItem('xnl-last-saved-mode', 'online');
      setScreen('map');
    } catch (cause) {
      setOnlineSaveNotice(cause instanceof Error ? cause.message : 'Chưa thể lưu hành trình lên tài khoản.');
    } finally {
      setOnlineSaveBusy(false);
    }
  }

  function useOnlineJourney() {
    if (onlineSaveChoice) {
      applyOnlineSave(onlineSaveChoice);
      return;
    }
    if (hasStoredHistory()) {
      if (!window.confirm('Dữ liệu trên thiết bị sẽ được giữ trong một ô sao lưu trước khi bắt đầu hành trình online mới. Bạn có muốn tiếp tục không?')) return;
      if (applyOnlineSave(emptyHistoryCloudSave())) {
        setNewJourneySetup(true);
        setScreen('character');
      }
      return;
    }
    setNewJourneySetup(true);
    setActiveMode('online');
    localStorage.setItem('xnl-game-mode', 'online');
    setScreen('character');
  }

  function cancelOnlineSync() {
    setOnlineSaveChoice(null);
    setActiveMode('offline');
    localStorage.setItem('xnl-game-mode', 'offline');
    try {
      const offlineSave = readOfflineHistorySave();
      if (offlineSave && localStorage.getItem('xnl-last-saved-mode') === 'online') {
        loadOfflineHistorySave(offlineSave);
        return;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể khôi phục hành trình offline.');
      setScreen('title');
      return;
    }
    setScreen(hasLocalHistory() ? 'offline-home' : 'title');
  }

  function loadOfflineHistorySave(save: HistoryCloudSave, destination: Screen = 'offline-home') {
    applyingCloudSave.current = true;
    try {
      saveHistoryProgress(save.progress);
      saveHistoryProfile(save.profile);
      for (const map of HISTORY_MAPS) {
        const point = save.positions[map.id];
        const key = historyMapPositionKey(map.id);
        if (point) localStorage.setItem(key, JSON.stringify(point));
        else localStorage.removeItem(key);
      }
      progressRef.current = save.progress;
      setProgress(save.progress);
      setProfile(save.profile);
      setActiveMode('offline');
      localStorage.setItem('xnl-game-mode', 'offline');
      localStorage.setItem('xnl-last-saved-mode', 'offline');
      setError('');
      setScreen(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể khôi phục hành trình offline.');
    } finally {
      applyingCloudSave.current = false;
    }
  }

  function openOfflineHome() {
    let offlineSave: HistoryCloudSave | null;
    try {
      offlineSave = readOfflineHistorySave();
    } catch (cause) {
      setTitleNotice(cause instanceof Error ? cause.message : 'Không đọc được hành trình offline.');
      return;
    }
    if (localStorage.getItem('xnl-last-saved-mode') === 'online') {
      if (!offlineSave) {
        setTitleNotice('Chưa có hành trình offline. Hãy chọn Chơi mới để bắt đầu.');
        return;
      }
      loadOfflineHistorySave(offlineSave);
      return;
    }
    if (!hasLocalHistory() || !profile.displayName) {
      setTitleNotice('Chưa có hành trình offline. Hãy chọn Chơi mới để bắt đầu.');
      return;
    }
    setActiveMode('offline');
    localStorage.setItem('xnl-game-mode', 'offline');
    localStorage.setItem('xnl-last-saved-mode', 'offline');
    setTitleNotice('');
    setScreen('offline-home');
  }

  function continueOfflineJourney() {
    setActiveMode('offline');
    localStorage.setItem('xnl-game-mode', 'offline');
    localStorage.setItem('xnl-last-saved-mode', 'offline');
    setExiting(false);
    setScreen('map');
  }

  function openWorld() {
    if (!onlineGame) {
      setTitleNotice('Thế giới cần bản Online và kết nối Internet. Quê nhà offline vẫn sẵn sàng.');
      return;
    }
    worldIntent.current = true;
    setTitleNotice('');
    if (account) {
      handledAccount.current = null;
      setActiveMode('online');
      localStorage.setItem('xnl-game-mode', 'online');
      setScreen('world');
    } else {
      localStorage.setItem('xnl-world-login-pending', 'yes');
      openAccountScreen();
    }
  }

  function startNewJourney() {
    if (hasLocalHistory() && !window.confirm('Bạn có muốn tạo hành trình mới không? Dữ liệu offline hiện tại sẽ được thay thế.')) return;
    setTitleNotice('');
    setActiveMode('offline');
    localStorage.setItem('xnl-game-mode', 'offline');
    setNewJourneySetup(true);
    setScreen('character');
  }

  function openSettings() {
    setSettingsReturnScreen(screen);
    setScreen('settings');
  }

  function exitGame() {
    setExiting(true);
    setScreen('title');
  }

  function continueJourney() {
    setNewJourneySetup(false);
    setExiting(false);
    setScreen('map');
  }

  function acceptHistoryMission(missionId: string) {
    const next = startHistoryMission(progressRef.current, missionId);
    if (next === progressRef.current) return;
    if (updateProgress(() => next)) setScreen('map');
  }

  function answerMapOneQuestion(answerIndex: number) {
    const character = mapOneCharacter(mapOneCharacterId ?? undefined);
    if (!character || mapOneAnswer !== null) return;
    const correct = answerIndex === character.correctAnswer;
    setMapOneAnswer(answerIndex);
    setMapOneAnswerCorrect(correct);
    if (!correct) return;
    const questionId = `map-one:${character.id}`;
    if (progressRef.current.correctQuestions.includes(questionId)) return;
    const saved = updateProgress(current => ({
      ...current,
      fame: current.fame + 10,
      gold: current.gold + 10,
      correctQuestions: [...current.correctQuestions, questionId],
    }));
    setMapOneAnswerRewarded(saved);
  }

  function openMapOneCharacter(characterId: string) {
    setMapOneCharacterId(characterId);
    setMapOneAnswer(null);
    setMapOneAnswerCorrect(null);
    setMapOneAnswerRewarded(false);
    setScreen('map-one-question');
  }

  function beginFinalChallenge() {
    const mapId = progressRef.current.currentMapId;
    if (!canStartFinalHistoryChallenge(progressRef.current, mapId)) return;
    if (!updateProgress(current => ({
      ...current,
      finalChallengeMapId: mapId,
      finalChallengeAttempts: {
        ...current.finalChallengeAttempts,
        [mapId]: (current.finalChallengeAttempts[mapId] ?? 0) + 1,
      },
    }))) return;
    setScreen('map');
    navigate('/uno', { state: { historyFinalChallengeMapId: mapId } });
  }

  function saveSlot(slot: number) {
    try {
      setSaveSlots(saveHistorySlot(slot, createHistorySnapshot(progress, profile)));
      setError(initial.error);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được hành trình.');
    }
  }

  function restoreSlot(slot: HistorySaveSlot) {
    try {
      saveHistoryProgress(slot.snapshot.progress);
      saveHistoryProfile(slot.snapshot.profile);
      localStorage.setItem(historyMapPositionKey(slot.snapshot.progress.currentMapId), JSON.stringify(slot.snapshot.position));
      setProgress(slot.snapshot.progress);
      progressRef.current = slot.snapshot.progress;
      setProfile(slot.snapshot.profile);
      setExiting(false);
      setError('');
      setScreen('map');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa khôi phục được bản lưu.');
    }
  }

  function removeSlot(slotNumber: number) {
    try {
      setSaveSlots(deleteHistorySlot(slotNumber));
      setError(initial.error);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa xóa được ô sao lưu.');
    }
  }

  function interactWithMap(locationItem: WorldLocation) {
    const missionResult = completeHistoryMission(progressRef.current, locationItem.id);
    if (missionResult.completedMissionId) {
      const completedMission = historyMission(progressRef.current.currentMapId, missionResult.completedMissionId);
      const saved = updateProgress(() => missionResult.progress);
      if (saved && completedMission) {
        const specialRewards = [
          completedMission.badge ? `huy hiệu ${completedMission.badge}` : '',
          completedMission.outfit ? `trang phục ${completedMission.outfit}` : '',
          completedMission.talent ? `thiên phú ${completedMission.talent}` : '',
          completedMission.tickets ? `${completedMission.tickets} Vé UNO` : '',
        ].filter(Boolean);
        setMissionNotice(
          `Hoàn thành: ${completedMission.title} · +${completedMission.fame} danh vọng · +${completedMission.gold} xu`
          + (specialRewards.length ? ` · Nhận ${specialRewards.join(', ')}` : ''),
        );
      }
    }
    const villageTarget = VILLAGE_NPC_ACTIONS[locationItem.npcId ?? ''] ?? locationItem.id;
    if (locationItem.npcId === 'village-gatekeeper') { setScreen('atlas');return; }
    if (villageTarget === 'village-gate') { setScreen('atlas');return; }
    if (villageTarget === 'village-home') { setScreen('character');return; }
    if (villageTarget === 'village-culture') { setScreen('collection');return; }
    if (villageTarget.startsWith('village-')) { openVillage(villageTarget);return; }
    if (locationItem.destinationMapId) {
      setError('');
      if (canStartFinalHistoryChallenge(progressRef.current, progressRef.current.currentMapId)
        && !progressRef.current.completedHistoryMaps.includes(progressRef.current.currentMapId)) {
        setMissionNotice(FINAL_CHALLENGE_PROMPT);
        setScreen('map');
      } else {
        openFinalChallenge('map');
      }
      return;
    }
    if (locationItem.id === 'menu-atlas') { setScreen('atlas'); return; }
    if (locationItem.id === 'menu-collection') { setScreen('collection'); return; }
    if (locationItem.id === 'menu-achievements') { setScreen('achievements'); return; }
    if (locationItem.id === 'menu-backup') { openBackups(); return; }
    if (locationItem.id === 'menu-settings') { openSettings(); return; }
    if (locationItem.id === 'menu-character') { setScreen('character'); return; }
    if (locationItem.id === 'menu-exit') { exitGame(); return; }
    if (locationItem.feature === 'cards') { openEntertainment(); return; }
    const heroId = locationItem.id.startsWith('hero-') ? locationItem.id.slice('hero-'.length) : '';
    const hero = HISTORY_HEROES.find(item => item.id === heroId);
    if (hero) { beginEncounter(hero); return; }
    const mapOneNpc = currentMap.id === 'hai-ba-trung' ? mapOneCharacter(locationItem.npcId) : undefined;
    if (mapOneNpc) { openMapOneCharacter(mapOneNpc.id); return; }
    if (locationItem.id === 'wharf' || (locationItem.npcId === 'man' && locationItem.feature === 'character')) { setScreen('collection'); return; }
    if (locationItem.feature === 'backup' || locationItem.feature === 'upgrades') { openBackups(); return; }
    if (locationItem.feature === 'statistics' || locationItem.feature === 'achievements') { setScreen('achievements'); return; }
    setScreen('help');
  }

  function chooseHistoryMap(mapId: string) {
    const destination = HISTORY_MAPS.find(map => map.id === mapId);
    if (!destination || !progress.unlockedHistoryMaps.includes(destination.id)) return;
    updateProgress(current => ({ ...current, currentMapId: destination.id, activeHistoryMissionId: null }));
    setScreen('map');
  }

  function travelThroughGate() {
    if (!progress.unlockedHistoryMaps.includes(nextMap.id)) return;
    updateProgress(current => ({
      ...current,
      currentMapId: nextMap.id,
      activeHistoryMissionId: null,
    }));
    setScreen('map');
  }

  function completeCharacterSetup(nextProfile?: {
    displayName: string;
    appearance: HistoryProfile['appearance'];
    customization: CharacterCustomization;
    promoCodeRedeemed?: boolean;
    testGameCodeRedeemed?: boolean;
    startingCharacterId?: PlayableCharacterId;
    startingCharacterImage?: string;
    heroDevelopment?: HistoryProfile['heroDevelopment'];
  }, forceNewJourney = false) {
    if (!nextProfile) return;
    const startsNewJourney = newJourneySetup || forceNewJourney;
    const isNewCharacter = startsNewJourney || !profile.displayName;
    const redeemPromoCode = isNewCharacter && nextProfile.promoCodeRedeemed === true;
    const redeemTestCode = import.meta.env.DEV && isNewCharacter && nextProfile.testGameCodeRedeemed === true;
    const savedProfile = {
      ...(isNewCharacter ? freshHistoryProfile() : profile),
      displayName: nextProfile.displayName,
      appearance: nextProfile.appearance,
      customization: nextProfile.customization,
      ...(nextProfile.heroDevelopment ? { heroDevelopment: nextProfile.heroDevelopment } : {}),
      ...(nextProfile.startingCharacterId ? {
        startingCharacterId: nextProfile.startingCharacterId,
        startingCharacterImage: nextProfile.startingCharacterImage,
      } : {}),
    };
    const newProgress = freshHistoryProgress();
    const savedProgress = isNewCharacter
      ? {
          ...newProgress,
          riverCampaign: applyRiverCampaignAction(newProgress.riverCampaign, { type: 'rest-at-dock' }, nextProfile.heroDevelopment?.talent ?? null),
          gold: redeemPromoCode || redeemTestCode ? 10000 : 0,
          fame: redeemPromoCode || redeemTestCode ? 10000 : 0,
          completedHistoryMissions: redeemPromoCode ? ['promo-codex500'] : [],
        }
      : progress;
    try {
      saveHistoryProgress(savedProgress);
      saveHistoryProfile(savedProfile);
      if (isNewCharacter) {
        for (const map of HISTORY_MAPS) {
          const positionKey = historyMapPositionKey(map.id);
          localStorage.removeItem(positionKey);
          localStorage.removeItem(`${positionKey}:layout-v2`);
          localStorage.removeItem(`${positionKey}:discovered-zones`);
        }
        localStorage.setItem('opening-map-player-position-landscape-v2', JSON.stringify(OPENING_MAP_REST_POINT));
        localStorage.removeItem('opening-map-delivery-quest-v1');
      }
      localStorage.setItem('xnl-last-saved-mode', activeMode);
      progressRef.current = savedProgress;
      setProgress(savedProgress);
      setProfile(savedProfile);
      setNewJourneySetup(false);
      setExiting(false);
      setError(initial.error);
      if (isNewCharacter) setMissionNotice('Nhiệm vụ đầu tiên: Qua cổng làng Mê Linh · hãy mở Nhật ký sử để nhận nhiệm vụ và xem mục tiêu.');
      if (redeemTestCode || isNewCharacter) navigate('/map');
      else setScreen('map');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được nhân vật trên thiết bị.');
    }
  }

  function startDevelopmentTestJourney() {
    if (!import.meta.env.DEV) return;
    if (hasLocalHistory() && !window.confirm('Bắt đầu map test sẽ thay thế hành trình offline hiện tại. Bạn có muốn tiếp tục không?')) return;
    setActiveMode('offline');
    localStorage.setItem('xnl-game-mode', 'offline');
    localStorage.setItem('xnl-last-saved-mode', 'offline');
    localStorage.removeItem('opening-map-player-position-landscape-v2');
    localStorage.removeItem('opening-map-delivery-quest-v1');
    const newProfile = freshHistoryProfile();
    completeCharacterSetup({
      displayName: 'Tiểu Mông',
      appearance: newProfile.appearance,
      customization: newProfile.customization,
      promoCodeRedeemed: false,
      testGameCodeRedeemed: true,
      startingCharacterId: 'forest-keeper',
      startingCharacterImage: newProfile.startingCharacterImage,
      heroDevelopment: { talent: 'forest-and-tide', alignmentGoal: null },
    }, true);
  }

  function changeCharacterCustomization(customization: CharacterCustomization) {
    if (newJourneySetup) return;
    const nextProfile = { ...profile, customization };
    try {
      saveHistoryProfile(nextProfile);
      setProfile(nextProfile);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được tủ đồ nhân vật.');
    }
  }

  function purchaseCharacterItem(item: CharacterItem): boolean {
    if (progress.fame < item.fame || progress.gold < item.price) return false;
    return updateProgress(current => ({ ...current, gold: current.gold - item.price }));
  }

  const onMatchStarted = useCallback((matchId: number) => {
    updateProgress(current => ({
      ...current,
      activeUnoMatch: matchId,
      currentMatch: current.currentMatch ? { ...current.currentMatch, matchId } : null,
    }));
  }, [updateProgress]);

  const onReserveBet = useCallback((bet: number, useTicket: boolean, previousMatchId: number | null) => {
    const option = UNO_BET_OPTIONS.find(item => item.bet === bet);
    const currentProgress = progressRef.current;
    if (!option || currentProgress.currentMatch || useTicket && currentProgress.freeUnoTickets < 1 || !useTicket && currentProgress.gold < bet) return false;
    let reserved = false;
    const saved = updateProgress(current => {
      if (current.currentMatch || useTicket && current.freeUnoTickets < 1 || !useTicket && current.gold < bet) return current;
      reserved = true;
      return {
        ...current,
        gold: current.gold - (useTicket ? 0 : bet),
        freeUnoTickets: current.freeUnoTickets - Number(useTicket),
        selectedBet: bet,
        activeUnoMatch: null,
        currentMatch: { matchId: null, previousMatchId, stake: bet, reward: option.reward, freeTicket: useTicket },
      };
    });
    return saved && reserved;
  }, [updateProgress]);

  const onCancelBet = useCallback(() => {
    updateProgress(current => {
      const reserved = current.currentMatch;
      if (!reserved || reserved.matchId !== null) return current;
      return {
        ...current,
        gold: current.gold + (reserved.freeTicket ? 0 : reserved.stake),
        freeUnoTickets: current.freeUnoTickets + Number(reserved.freeTicket),
        currentMatch: null,
        activeUnoMatch: null,
      };
    });
  }, [updateProgress]);

  const onBetChange = useCallback((bet: number) => {
    if (!UNO_BET_OPTIONS.some(option => option.bet === bet)) return;
    updateProgress(current => ({ ...current, selectedBet: bet }));
  }, [updateProgress]);

  const collectedHeroes = useMemo(
    () => HISTORY_HEROES.map(hero => ({ hero, unlocked: progress.fame >= hero.unlockAt })),
    [progress.fame],
  );

  if (location.pathname === '/uno') {
    const routeState = location.state as {
      historyPractice?: boolean;
      historyPracticeOpponentNames?: string[];
      historyPracticeOpponentIds?: string[];
      historyPracticeDifficulty?: CardDifficulty;
      historyPracticeTargetScore?: number;
      historyPracticeInitialCards?: number;
    } | null;
    const historyPractice = routeState?.historyPractice === true;
    const challengeHero = finalChallengeMap
      ? HISTORY_HEROES.find(hero => hero.id === finalChallengeMap.heroId)
      : undefined;
    const challengeIndex = finalChallengeMap ? HISTORY_MAPS.findIndex(map => map.id === finalChallengeMap.id) : -1;
    const challengeNpc = challengeHero ? MAP_ONE_NPCS.find(npc => npc.name === challengeHero.name) : undefined;
    const opponentNames = finalChallengeMap
      ? [challengeHero?.name ?? finalChallengeMap.region]
      : routeState?.historyPracticeOpponentNames;
    const opponentCharacterIds = finalChallengeMap
      ? challengeNpc ? [challengeNpc.id] : undefined
      : routeState?.historyPracticeOpponentIds;
    return (
      <main className="sv-game sv-uno-page">
        <header className="sv-uno-heading">
          <div><span className="sv-kicker">HÀNH TRÌNH SỬ VIỆT</span><h1>{finalChallengeMap ? `Thử thách cuối · ${challengeHero?.name ?? finalChallengeMap.region}` : historyPractice ? 'Luyện tập · không cược' : 'UNO ở quán nước'}</h1></div>
        </header>
        <CardRoomPage
          campaignMode
          duelMode={Boolean(finalChallengeMap)}
          opponentName={finalChallengeMap ? challengeHero?.name : undefined}
          opponentNames={opponentNames}
          opponentCharacterIds={opponentCharacterIds}
          initialOpponents={historyPractice ? routeState?.historyPracticeOpponentIds?.length : undefined}
          initialDifficulty={historyPractice ? routeState?.historyPracticeDifficulty : challengeIndex <= 0 ? 'easy' : challengeIndex >= 3 ? 'hard' : 'medium'}
          initialTargetScore={historyPractice ? routeState?.historyPracticeTargetScore : undefined}
          initialCards={historyPractice ? routeState?.historyPracticeInitialCards : 7}
          initialTurnSeconds={historyPractice ? 0 : undefined}
          bettingMode={!finalChallengeMap && !historyPractice}
          rewardsEnabled={Boolean(finalChallengeMap) || historyPractice || progress.encounter?.stage === 'answered'}
          returnPath="/"
          expectedMatchId={progress.activeUnoMatch}
          playerAppearance={profile.appearance}
          playerCustomization={profile.customization}
          betBalance={progress.gold}
          freeUnoTickets={progress.freeUnoTickets}
          selectedBet={progress.selectedBet}
          bettingHistory={progress.bettingHistory}
          freeTicketOnEntry={Boolean((location.state as { useFreeTicket?: boolean } | null)?.useFreeTicket)}
          hasPendingBet={Boolean(progress.currentMatch)}
          pendingPreviousMatchId={progress.currentMatch?.previousMatchId}
          onBetChange={onBetChange}
          onReserveBet={onReserveBet}
          onCancelBet={onCancelBet}
          onMatchStarted={onMatchStarted}
          onMatchFinished={onMatchFinished}
        />
      </main>
    );
  }

  return (
    <main className={`sv-game${screen === 'map' ? ' sv-game-map' : ''}`}>
      {error && <p className="sv-error" role="alert">{error}</p>}

      {screen === 'title' && (
        <section className="sv-title-screen" aria-labelledby="sv-title">
          <h1 className="sv-visually-hidden" id="sv-title">Xóm Nhà Lá</h1>
          <div className="sv-title-frame">
          <div className="sv-title-scene" aria-hidden="true" />
          <nav className="sv-title-menu" aria-label="Menu chính">
            <button type="button" aria-label="Chơi mới" onClick={() => {
              startNewJourney();
            }}><span className="sv-title-mode-label">Offline</span>Chơi mới</button>
            <button type="button" aria-label="Quê nhà" onClick={openOfflineHome}><span className="sv-title-mode-label">Offline</span>Quê nhà</button>
            <button type="button" aria-label="Thế giới" onClick={openWorld}><span className="sv-title-mode-label">Online</span>Thế giới</button>
            <button type="button" onClick={openSettings}>Hệ thống</button>
            {import.meta.env.DEV && <button className="sv-dev-test-launch" type="button" onClick={startDevelopmentTestJourney}>
              🧪 TEST-MELINH · Vào map test
            </button>}
          </nav>
          <button className="sv-title-install" type="button" onClick={() => setInstallHintRequest(value => value + 1)} aria-describedby={installHintRequest ? 'sv-install-hint' : undefined}>Cài đặt trên Android và iOS</button>
          </div>
          {installHintRequest > 0 && <div className="sv-install-hint" id="sv-install-hint" role="status" aria-label="Hướng dẫn cài đặt">
            <strong>Thêm game vào màn hình chính</strong>
            <p><b>Android:</b> Mở bằng Chrome → menu ⋮ → Thêm vào màn hình chính / Cài đặt ứng dụng → xác nhận.</p>
            <p><b>iPhone / iPad:</b> Mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính → Thêm.</p>
          </div>}
          {titleNotice && <p className="sv-title-notice" role="status">{titleNotice}</p>}
        </section>
      )}

      {screen === 'offline-home' && (
        <section className="sv-dialog-screen">
          <div className="sv-dialog-card sv-mode-card">
            <button className="sv-back-button" type="button" onClick={() => setScreen('title')}>← Menu chính</button>
            <span className="sv-kicker">🏠 QUÊ NHÀ · OFFLINE</span>
            <h1>Chào mừng về nhà, {profile.displayName || 'người bạn'}!</h1>
            <p>Hành trình được lưu trên thiết bị này. Bạn có thể tiếp tục mà không cần đăng nhập hoặc kết nối Internet.</p>
            <div className="sv-offline-save-summary">
              <span>🗓 Lưu lần cuối</span>
              <strong>{localStorage.getItem('su-viet-hanh-trinh-saved-at')
                ? new Date(localStorage.getItem('su-viet-hanh-trinh-saved-at')!).toLocaleString('vi-VN')
                : 'Ngày lưu chưa được ghi lại'}</strong>
              <span>🧭 Tiến trình bản đồ</span>
              <strong>{Math.round(progress.completedHistoryMaps.length / HISTORY_MAPS.length * 100)}%</strong>
              <span>🪙 Xu · ⭐ Danh vọng</span>
              <strong>{progress.gold.toLocaleString('vi-VN')} · {progress.fame.toLocaleString('vi-VN')}</strong>
            </div>
            <div className="sv-mode-actions">
              <button className="sv-primary-button" type="button" onClick={continueOfflineJourney}>Tiếp tục hành trình →</button>
              <button className="sv-secondary-button" type="button" onClick={() => { openBackups(); }}>Các ô sao lưu</button>
            </div>
          </div>
        </section>
      )}

      {screen === 'world' && (
        <section className="sv-dialog-screen">
          <div className="sv-dialog-card sv-mode-card">
            <button className="sv-back-button" type="button" onClick={() => setScreen('title')}>← Menu chính</button>
            <span className="sv-kicker">🌐 THẾ GIỚI · ONLINE</span>
            <h1>Chào {account?.displayName || 'bạn'}!</h1>
            <p>Tài khoản: <strong>{account?.username}</strong>. Hành trình online được lưu riêng trên máy chủ; dữ liệu offline vẫn giữ nguyên cho tới khi bạn chọn đồng bộ.</p>
            {onlineSaveNotice && <p className="sv-sync-error" role="alert">{onlineSaveNotice}</p>}
            <div className="sv-mode-actions">
              <button className="sv-primary-button" type="button" onClick={() => {
                handledAccount.current = null;
                setActiveMode('online');
                localStorage.setItem('xnl-game-mode', 'online');
              }}>Mở hành trình online →</button>
              <button className="sv-secondary-button" type="button" onClick={() => {
                void logoutAccount().catch(cause => setError(cause instanceof Error ? cause.message : 'Chưa đăng xuất được.'));
              }}>Đăng xuất / đổi tài khoản</button>
              <button className="sv-secondary-button" type="button" onClick={() => setTitleNotice('Tài khoản hiện chưa có email khôi phục mật khẩu. Hãy liên hệ quản trị viên để được hỗ trợ.')}>Quên mật khẩu?</button>
            </div>
          </div>
        </section>
      )}

      {screen === 'sync-choice' && (
        <section className="sv-dialog-screen">
          <div className="sv-dialog-card sv-mode-card" aria-labelledby="sv-sync-title">
            <span className="sv-kicker">🔄 ĐỒNG BỘ HÀNH TRÌNH</span>
            <h1 id="sv-sync-title">Chọn dữ liệu muốn sử dụng</h1>
            <p>{onlineSaveChoice
              ? 'Hành trình offline trên thiết bị khác với hành trình trên tài khoản. Chưa có dữ liệu nào bị ghi đè.'
              : 'Tìm thấy hành trình offline trên thiết bị nhưng tài khoản chưa có bản lưu. Chọn rõ dữ liệu trước khi tiếp tục.'}</p>
            {onlineSaveChoice && <p className="sv-sync-cloud-date">Online lưu lần cuối: {new Date(onlineSaveChoice.savedAt).toLocaleString('vi-VN')} · {onlineSaveChoice.profile.displayName || 'Chưa tạo nhân vật'}</p>}
            {onlineSaveNotice && <p className="sv-sync-error" role="alert">{onlineSaveNotice}</p>}
            <div className="sv-mode-actions">
              {hasStoredHistory() && <button className="sv-secondary-button" type="button" disabled={onlineSaveBusy} onClick={() => void keepOfflineJourneyOnline()}>
                {onlineSaveBusy ? 'Đang lưu…' : hasLocalHistory() ? 'Giữ dữ liệu offline' : 'Giữ dữ liệu trên thiết bị'}
              </button>}
              <button className="sv-primary-button" type="button" disabled={onlineSaveBusy} onClick={useOnlineJourney}>
                {onlineSaveChoice ? 'Dùng dữ liệu online' : 'Bắt đầu hành trình online'}
              </button>
              <button className="sv-secondary-button" type="button" disabled={onlineSaveBusy} onClick={cancelOnlineSync}>Hủy và quay lại</button>
            </div>
            {hasLocalHistory() && onlineSaveChoice && <small className="sv-sync-preserve-note">Khi chọn dữ liệu online, bản offline hiện tại sẽ được giữ trong một ô sao lưu nếu còn chỗ.</small>}
          </div>
        </section>
      )}

      {screen === 'map' && (
        <section className="sv-map-screen sv-fullscreen-map">
          <header className="sv-map-hud">
            <div className="sv-map-brand"><Link className="sv-wordmark" to="/" onClick={event => { event.preventDefault(); setScreen('title'); }}>XÓM NHÀ LÁ <span>· SỬ VIỆT</span></Link><small>{location.pathname === '/chapter-1' ? `Chương 1 · ${riverChapterEntry === 'shadow' ? 'Lối vào Tà đạo' : riverChapterEntry === 'righteous' ? 'Lối vào Chính đạo' : 'Mê Linh'}` : `${currentMap.icon} Chặng ${currentMapIndex + 1}/${HISTORY_MAPS.length} · ${currentMap.region}`}</small></div>
            <div className="sv-map-wallet" aria-label={`Tiến trình của ${profile.displayName || 'người chơi'}`}><button className="sv-map-wardrobe" type="button" onClick={() => setScreen('character')} aria-label="Mở Nhân vật" title={profile.displayName || 'Khách xóm'}>🧑 Nhân vật</button><span>🪙 {progress.gold}</span><span>⭐ {progress.fame}</span></div>
          </header>
          {missionNotice && <p className="sv-map-mission-notice" role="status">{missionNotice}<button type="button" aria-label="Đóng thông báo nhiệm vụ" onClick={() => setMissionNotice('')}>×</button></p>}
          <div className="sv-village-map sv-2d-village-map">
            <WorldMap
              key={currentMap.id}
              appearance={profile.appearance}
              customization={profile.customization}
              startingCharacter={profile.startingCharacterId}
              playerName={profile.displayName || 'Người chơi'}
              locations={mapScene.locations}
              suspended={Boolean(villagePlace)}
              featureLabels={mapScene.featureLabels}
              mapName={currentMap.name}
              buildings={currentMap.buildings}
              landscape={currentMap.theme}
              spawn={mapScene.spawn}
              positionStorageKey={historyMapPositionKey(currentMap.id)}
              persist={!exiting}
              historyMode
              fame={progress.fame}
              activeQuestLocationId={mapScene.activeQuestLocationId}
              onInteract={interactWithMap}
            />
          </div>
          <nav className="village-map-nav" aria-label="Tiện ích làng quê">
            <button type="button" onClick={()=>openVillage('village-store')}>🛍️ <span>Cửa hàng</span></button>
            <button type="button" onClick={()=>openVillage('village-quests')}>📜 <span>Nhiệm vụ</span></button>
            <button type="button" onClick={()=>setScreen('missions')}>📖 <span>Nhật ký sử</span></button>
            <button type="button" onClick={()=>setScreen('character')}>🧑 <span>Nhân vật</span></button>
            <button type="button" onClick={()=>setScreen('skills')}>🌊 <span>Võ công</span></button>
            {currentMap.id === 'hai-ba-trung' && <button type="button" onClick={()=>setScreen('river-campaign')}>🛶 <span>Bến nước</span></button>}
            <button type="button" onClick={()=>openVillage('village-mounts')}>🐃 <span>Thú cưỡi</span></button>
          </nav>
          {villagePlace && <MapDialog title={VILLAGE_LOCATIONS.find(place=>place.id===villagePlace)?.name ?? 'Chuyện trong làng'} onClose={()=>setVillagePlace(null)} className="village-modal">
            {villageNotice&&<p className="village-notice" role="status" aria-label="Thông báo làng quê">{villageNotice}</p>}
            {villagePlace==='village-store'||villagePlace==='village-mounts'
              ? <VillageShop key={villagePlace} progress={progress} profile={profile} onCommand={villageCommand} initialCategory={villagePlace==='village-mounts'?'mount':'all'} />
              : <VillageActivities progress={progress} onCommand={villageCommand} questId={VILLAGE_LOCATIONS.find(place=>place.id===villagePlace)?.questId} giftId={villagePlace.startsWith('village-gift-')?villagePlace:undefined} />}
          </MapDialog>}
        </section>
      )}

      {screen === 'skills' && (
        <section className="sv-subscreen sv-utility-screen">
          <header className="sv-subscreen-heading">
            <button className="sv-back-button" type="button" onClick={() => setScreen('map')}>← Về bản đồ</button>
          </header>
          <HeroSkillTree />
        </section>
      )}

      {screen === 'river-campaign' && (
        <section className="sv-subscreen sv-utility-screen">
          <header className="sv-subscreen-heading">
            <button className="sv-back-button" type="button" onClick={() => setScreen('map')}>← Về bản đồ</button>
          </header>
          <MelinRiverCampaign
            progress={progress}
            talent={profile.heroDevelopment.talent}
            onAction={applyRiverAction}
            onStartBoss={() => setScreen('river-boss')}
            onWorldMap={() => setScreen('atlas')}
            onFastTravel={() => {
              const dock = mapScene.locations.find(location => location.id === 'me-linh-boat-yard');
              if (!dock) {
                setError('Không tìm thấy điểm Bến Thuyền trên bản đồ để đi nhanh.');
                return;
              }
              try {
                localStorage.setItem(historyMapPositionKey(currentMap.id), JSON.stringify(dock.point));
                setError('');
                setScreen('map');
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Chưa thể lưu điểm đi nhanh.');
              }
            }}
          />
        </section>
      )}

      {screen === 'river-boss' && (
        <section className="sv-subscreen sv-utility-screen">
          <MelinCheckpointBattle
            campaign={normalizeRiverCampaign(progress.riverCampaign)}
            talent={profile.heroDevelopment.talent}
            haBaEquipped={normalizeRiverCampaign(progress.riverCampaign).haBaEquipped}
            onStateChange={battle => applyRiverAction({ type: 'boss-progress', battle })}
            onVictory={(path, battle) => {
              const saved = applyRiverAction({
                type: 'boss-victory',
                path,
                hp: battle.hp,
                mp: battle.mp,
                bambooUsed: battle.bambooUsed,
              });
              if (saved) setScreen('river-campaign');
              return saved;
            }}
            onRetreat={battle => {
              if (applyRiverAction({ type: 'boss-retreat', ...battle })) setScreen('river-campaign');
            }}
          />
        </section>
      )}

      {screen === 'entertainment' && (
        <section className="sv-subscreen sv-entertainment-screen">
          <header className="sv-subscreen-heading">
            <button className="sv-back-button" onClick={() => setScreen('map')}>← Về bản đồ</button>
            <span className="sv-kicker">QUÁN NƯỚC · {currentMap.region}</span>
            <h1>Khu Giải trí</h1>
            <p>Chọn cách chơi bài phù hợp. Luyện tập offline không cược và không ảnh hưởng tiến trình mở bản đồ.</p>
          </header>
          <div className="sv-entertainment-grid">
            <article className="sv-entertainment-card">
              <span aria-hidden="true">🎴</span>
              <h2>Luyện tập với máy</h2>
              <p>Chọn NPC trên bản đồ, 1–3 đối thủ, độ khó và luật mục tiêu. Có thể chơi lại không giới hạn.</p>
              <button className="sv-primary-button" type="button" onClick={() => {
                chooseRandomTrainingNpcs(1);
                setScreen('training');
              }}>Thiết lập luyện tập →</button>
            </article>
            {progress.freeUnoTickets > 0 && <article className="sv-entertainment-card">
              <span aria-hidden="true">🎟️</span>
              <h2>Chơi bằng vé UNO miễn phí</h2>
              <p>Bạn đang có {progress.freeUnoTickets} vé. Chọn bàn chơi tại khu Giải trí, không cần dùng xu cược.</p>
              <button type="button" onClick={startFreeTicketUno}>Chọn bàn chơi →</button>
            </article>}
            {canStartFinalHistoryChallenge(progress, currentMap.id) && <article className="sv-entertainment-card">
              <span aria-hidden="true">{currentMapHero?.illustration ?? '🌺'}</span>
              <h2>Đấu NPC chính để mở map tiếp theo</h2>
              <p>Thử thách chỉ mở khi đã hoàn thành trên 90% nhiệm vụ chính, đủ danh vọng và các nhiệm vụ cốt truyện bắt buộc.</p>
              <button className="sv-primary-button" type="button" onClick={() => openFinalChallenge('entertainment')}>
                Xem thử thách cuối bản đồ →
              </button>
            </article>}
            <article className="sv-entertainment-card is-coming-soon">
              <span aria-hidden="true">👥</span>
              <h2>Tìm trận {!onlineGame && <small>Sắp ra mắt</small>}</h2>
              <p>{onlineGame ? 'Tạo phòng hoặc tham gia bằng mã để chơi UNO cùng bạn bè theo thời gian thực.' : 'Giao diện phòng và lời mời chơi cùng bạn bè đang được chuẩn bị. Phiên bản này chưa tạo phòng online.'}</p>
              <button type="button" onClick={() => {
                setMatchmakingNotice(onlineGame ? '' : 'Tính năng đấu cùng người chơi khác đang được phát triển.');
                setScreen('matchmaking');
              }}>{onlineGame ? 'Tìm bạn chơi →' : 'Xem giao diện mẫu'}</button>
            </article>
          </div>
          {currentMap.id === 'hai-ba-trung' && canStartFinalHistoryChallenge(progress, currentMap.id)
            && !progress.completedHistoryMaps.includes(currentMap.id)
            && <p className="sv-gate-reminder" role="status">{FINAL_CHALLENGE_PROMPT}</p>}
          <p className="sv-gate-reminder">UNO là hoạt động phụ: bạn có thể luyện tập với máy bất cứ lúc nào tại khu Giải trí.</p>
        </section>
      )}

      {screen === 'training' && (
        <section className="sv-subscreen sv-training-screen">
          <header className="sv-subscreen-heading">
            <button className="sv-back-button" onClick={() => setScreen('entertainment')}>← Khu Giải trí</button>
            <span className="sv-kicker">LUYỆN TẬP OFFLINE · KHÔNG CƯỢC</span>
            <h1>Chọn bạn cùng bàn</h1>
            <p>Chọn từ 1 đến 3 NPC của {currentMap.region}. NPC lịch sử chính chỉ xuất hiện ở đây sau khi hoàn thành thử thách bản đồ.</p>
          </header>
          <div className="sv-training-options">
            <label>Số đối thủ
              <select value={trainingOpponentCount} onChange={event => {
                const count = Number(event.target.value);
                setTrainingOpponentCount(count);
                setSelectedTrainingNpcIds(current => current.slice(0, count));
              }}>
                {[1, 2, 3].map(count => <option key={count} value={count}>{count} máy</option>)}
              </select>
            </label>
            <label>Độ khó
              <select value={trainingDifficulty} onChange={event => setTrainingDifficulty(event.target.value as CardDifficulty)}>
                <option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option>
              </select>
            </label>
            <label>Điểm kết thúc
              <select value={trainingTargetScore} onChange={event => setTrainingTargetScore(Number(event.target.value))}>
                {[100, 200, 300, 500].map(score => <option key={score} value={score}>{score} điểm</option>)}
              </select>
            </label>
            <label>Số lá ban đầu
              <select value={trainingInitialCards} onChange={event => setTrainingInitialCards(Number(event.target.value))}>
                {[5, 7, 9].map(cards => <option key={cards} value={cards}>{cards} lá mỗi người</option>)}
              </select>
            </label>
          </div>
          <div className="sv-training-roster-heading">
            <h2>NPC có mặt trên bản đồ · đã chọn {selectedTrainingNpcIds.length}/{trainingOpponentCount}</h2>
            <button type="button" onClick={() => chooseRandomTrainingNpcs()}>🎲 Chọn ngẫu nhiên</button>
          </div>
          <div className="sv-training-roster">
            {trainingNpcs.map(npc => {
              const selected = selectedTrainingNpcIds.includes(npc.id);
              return <button
                type="button"
                key={npc.id}
                className={`sv-training-npc${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => setSelectedTrainingNpcIds(current => selected
                  ? current.filter(id => id !== npc.id)
                  : current.length >= trainingOpponentCount
                    ? [...current.slice(1), npc.id]
                    : [...current, npc.id])}
              >
                <CharacterSprite className="sv-training-npc__portrait" appearance={npc.appearance} npcDesign={npc.design} portrait aria-hidden="true" />
                <strong>{npc.name}</strong>
                <small>{npc.activity}</small>
                <span>Phong cách: {npc.style}</span>
                <em>{trainingDifficulty === 'easy' ? 'Dễ' : trainingDifficulty === 'medium' ? 'Trung bình' : 'Khó'}</em>
              </button>;
            })}
          </div>
          {error && <p className="sv-error" role="alert">{error}</p>}
          <aside className="sv-training-rule-note">
            <strong>Luật nhanh</strong>
            <span>Đánh cùng màu, cùng số hoặc cùng biểu tượng. Không có lá phù hợp thì rút bài; còn một lá, bấm “Còn 1”.</span>
            <small>Thắng luyện tập nhận tối đa 5 xu ảo; không nhận danh vọng, không tiến triển nhiệm vụ cốt truyện và không mở bản đồ.</small>
          </aside>
          <button className="sv-primary-button sv-training-start" type="button" disabled={selectedTrainingNpcIds.length !== trainingOpponentCount} onClick={startSelectedPractice}>
            Bắt đầu luyện tập →
          </button>
        </section>
      )}

      {screen === 'matchmaking' && (
        onlineGame ? <OnlineUnoPage onBack={() => setScreen('entertainment')} /> :
        <section className="sv-subscreen sv-matchmaking-screen">
          <header className="sv-subscreen-heading">
            <button className="sv-back-button" onClick={() => setScreen('entertainment')}>← Khu Giải trí</button>
            <span className="sv-kicker">CHẾ ĐỘ ONLINE</span>
            <h1>Tìm trận <small>Sắp ra mắt</small></h1>
            <p>Đây chỉ là bản xem trước. Hệ thống hiện chưa kết nối người chơi thật và không tạo phòng trực tuyến.</p>
          </header>
          {matchmakingNotice && <p className="sv-matchmaking-notice" role="status">{matchmakingNotice}</p>}
          <section className="sv-matchmaking-preview" aria-label="Bản xem trước phòng chơi">
            <label>Mã phòng<input value="ME-LINH-UNO" readOnly /></label>
            <label>Số người chơi<select value="4" disabled><option value="4">4 người</option></select></label>
            <div><strong>Người đang chờ</strong><span>Người chơi · Chờ sẵn sàng</span><span>Bạn bè · Chưa kết nối</span></div>
            <button type="button" onClick={() => setMatchmakingNotice('Tính năng đấu cùng người chơi khác đang được phát triển.')}>Tạo phòng mẫu</button>
            <button type="button" onClick={() => setMatchmakingNotice('Tính năng đấu cùng người chơi khác đang được phát triển.')}>Nhập mã / mời bạn</button>
            <button type="button" disabled>Sẵn sàng</button>
            <button type="button" onClick={() => setScreen('entertainment')}>Rời phòng</button>
          </section>
        </section>
      )}

      {screen === 'atlas' && (
        <section className="sv-subscreen sv-atlas-screen">
          <header className="sv-subscreen-heading"><button className="sv-back-button" onClick={() => setScreen('map')}>← Về bản đồ</button><span className="sv-kicker">HÀNH TRÌNH THEO DẤU SỬ</span><h1>Các bản đồ lịch sử</h1><p>Mỗi vùng đất kể một câu chuyện. Lối đi mới chỉ mở khi bạn đạt đủ danh vọng.</p></header>
          <div className="sv-atlas-grid">{HISTORY_MAPS.map((map, index) => {
            const hero = HISTORY_HEROES.find(item => item.id === map.heroId)!;
            const unlocked = progress.unlockedHistoryMaps.includes(map.id);
            const active = map.id === currentMap.id;
            return <article className={`sv-atlas-card${unlocked ? '' : ' is-locked'}${active ? ' is-active' : ''}`} key={map.id}>
              <span className="sv-atlas-icon">{unlocked ? map.icon : '🔒'}</span>
              <div><small>CHẶNG {index + 1} · {map.region}</small><h2>{map.name}</h2><p>{map.description}</p><strong>{hero.name}</strong></div>
              {active ? <button type="button" disabled>Đang khám phá</button> : unlocked
                ? <button type="button" onClick={() => chooseHistoryMap(map.id)}>Đi tới bản đồ →</button>
                : <button type="button" disabled>🔒 Hoàn thành nhiệm vụ và thắng thử thách</button>}
            </article>;
          })}</div>
        </section>
      )}

      {screen === 'missions' && (
        <section className="sv-subscreen sv-missions-screen">
          <header className="sv-subscreen-heading">
            <button className="sv-back-button" onClick={() => setScreen('map')}>← Bản đồ</button>
            <span className="sv-kicker">NHẬT KÝ SỬ VIỆT · {currentMap.region}</span>
            <h1>Nhiệm vụ lịch sử</h1>
            <p>{currentMapStory.intro}</p>
          </header>
          <section className="sv-mission-progress" aria-label="Tiến trình bản đồ">
            <div className="sv-mission-progress__top">
              <strong>{progress.fame.toLocaleString('vi-VN')} danh vọng</strong>
              <span>Mốc thử thách: {finalChallengeFame(currentMapIndex)}</span>
            </div>
            <progress max={currentMapMissionStats.total} value={currentMapMissionStats.completed} aria-label={`Hoàn thành bản đồ ${currentMapMissionStats.percent}%`} />
            <div className="sv-mission-progress__stats">
              <span>{currentMapMissionStats.mainCompleted}/{currentMapMissionStats.mainTotal} nhiệm vụ chính · cần {currentMapMissionStats.mainRequired}</span>
              <span>{currentMapMissionStats.hiddenFound}/{currentMapMissionStats.hiddenTotal} nhiệm vụ ẩn đã tìm</span>
              <strong>{currentMapMissionStats.percent}% bản đồ</strong>
            </div>
          </section>
          {currentMap.id === 'hai-ba-trung' && <section className="sv-story-chapters" aria-label="Các chương câu chuyện">
            <h2>5 chương · Hành trình Mê Linh</h2>
            <div className="sv-story-chapters__grid">{mapOneChapterProgress.map(({ chapter, missions, completed, complete }) => {
              const requiredCount = MAP_ONE_CHAPTER_MAIN_REQUIREMENTS[chapter.id] ?? 0;
              const available = currentMapMissionStats.mainCompleted >= requiredCount;
              return <article className={`sv-story-chapter${complete ? ' is-complete' : ''}${!available ? ' is-locked' : ''}`} key={chapter.id}>
                <h3>{chapter.title}</h3>
                <p>{chapter.summary}</p>
                <small>{completed}/{missions.length} nhiệm vụ chính{!available ? ` · mở sau ${requiredCount} nhiệm vụ` : ''}</small>
                {complete && <p className="sv-story-chapter__lesson"><strong>Điều em học được:</strong> {chapter.lesson}</p>}
              </article>;
            })}</div>
            <details className="sv-map-one-roster">
              <summary>Hồ sơ NPC & kiểm tra ngoại hình · {MAP_ONE_NPCS.length}</summary>
              <div className="sv-map-one-appearance-list" aria-label="Bảng kiểm tra ngoại hình NPC Mê Linh">
                {MAP_ONE_NPCS.map(npc => {
                  const design = npc.design;
                  const missions = HISTORY_MISSIONS.filter(mission => mission.mapId === currentMap.id
                    && (mission.targetLocationId === npc.locationId || mission.npcId === npc.id || mission.npcId === npc.characterId));
                  return <article className="sv-map-one-appearance-card" key={npc.id}>
                    <CharacterSprite className="sv-map-one-appearance-card__portrait" appearance={npc.appearance} npcDesign={design} pose={npc.pose} />
                    <div className="sv-map-one-appearance-card__content">
                      <strong>{npc.name}</strong>
                      <small>{design.occupation} · {design.historicalRole}</small>
                      <dl>
                        <div><dt>Khuôn mặt</dt><dd>{design.faceShape} · mắt {design.eyeShape} · mũi {design.noseShape} · {design.facialMarks.join(', ') || 'không dấu riêng'}</dd></div>
                        <div><dt>Tóc / râu</dt><dd>{design.hairstyle} · {design.hairColor} · {design.beardStyle}</dd></div>
                        <div><dt>Vóc dáng / tư thế</dt><dd>{design.bodyType} · cao {Math.round(design.height * 100)}% · vai {Math.round(design.shoulderWidth * 100)}% · {design.posture}</dd></div>
                        <div><dt>Trang phục / màu</dt><dd>{design.outfit} · <i className="sv-npc-color-chip" style={{ background: design.outfitColor }} /> <i className="sv-npc-color-chip" style={{ background: design.accentColor }} /> <i className="sv-npc-color-chip" style={{ background: design.trouserColor }} /></dd></div>
                        <div><dt>Phụ kiện / vật dụng</dt><dd>{design.accessory} · {design.weapon}</dd></div>
                        <div><dt>Khu vực / nhiệm vụ</dt><dd>{npc.locationId} · {missions.map(mission => mission.title).join(' · ') || npc.activity}</dd></div>
                        <div><dt>Hoạt ảnh</dt><dd>{design.animationSet} · {npc.pose}</dd></div>
                      </dl>
                    </div>
                  </article>;
                })}
              </div>
              <section className="sv-map-one-story-roster" aria-label="Nhân vật lịch sử và câu hỏi">
                <h3>Nhân vật lịch sử & nội dung học tập</h3>
                {MAP_ONE_CHARACTERS.map(character => <article key={character.id}>
                  <strong>{character.name} · {character.historical ? 'Nhân vật lịch sử' : 'Nhân vật đại diện trong game'}</strong>
                  <p>{character.role}. {character.appearance}</p>
                  <blockquote>{character.dialogue}</blockquote>
                  <small>Câu hỏi gợi nhớ: {character.question}</small>
                </article>)}
              </section>
            </details>
          </section>}
          {activeHistoryMission && <section className="sv-active-mission" aria-label="Nhiệm vụ đang làm">
            <span>📍 NHIỆM VỤ ĐANG LÀM</span>
            <h2>{activeHistoryMission.title}</h2>
            <p>{activeHistoryMission.description}</p>
            {currentMap.id === 'hai-ba-trung' && mapOneCharacter(activeHistoryMission.npcId) && <p><strong>{mapOneCharacter(activeHistoryMission.npcId)?.name}:</strong> “{mapOneCharacter(activeHistoryMission.npcId)?.dialogue}”</p>}
            <strong>Mục tiêu: {[
              ...currentMap.landmarks,
              ...VILLAGE_LOCATIONS,
            ].find(item => item.id === activeHistoryMission.targetLocationId)?.name ?? 'Địa điểm trên bản đồ'}</strong>
            <button className="sv-primary-button" onClick={() => setScreen('map')}>Đi đến mục tiêu →</button>
          </section>}
          <div className="sv-mission-lists">
            {(['main', 'side', 'hidden'] as const).map(kind => <section className="sv-mission-section" key={kind}>
              <h2>{kind === 'main' ? '🌾 Nhiệm vụ chính' : kind === 'side' ? '🤝 Việc tốt bên đường' : '🔎 Dấu chân bí mật'}</h2>
              <div className="sv-mission-grid">
                {HISTORY_MISSIONS.filter(mission => mission.mapId === currentMap.id && mission.kind === kind).map(mission => {
                  const done = progress.completedHistoryMissions.includes(mission.id);
                  const found = mission.kind !== 'hidden' || progress.discoveredHistoryMissions.includes(mission.id);
                  const targetName = [...currentMap.landmarks, ...VILLAGE_LOCATIONS]
                    .find(item => item.id === mission.targetLocationId)?.name ?? 'Địa điểm trên bản đồ';
                  const guide = currentMap.id === 'hai-ba-trung' ? mapOneCharacter(mission.npcId) : undefined;
                  const available = historyMissionAvailable(
                    currentMap.id, mission, progress.completedHistoryMissions, progress.discoveredHistoryMissions,
                  );
                  return <article className={`sv-mission-card${done ? ' is-complete' : ''}${!found ? ' is-hidden' : ''}`} key={mission.id}>
                    <span>{done ? '✓' : !found ? '🔒' : kind === 'main' ? '📜' : kind === 'side' ? '🌱' : '✨'}</span>
                    <div><h3>{found ? mission.title : 'Manh mối chưa được tìm thấy'}</h3>
                      <p>{found ? mission.description : 'Hoàn thành thêm nhiệm vụ chính để hé lộ manh mối này.'}</p>
                      {found && <small>+{mission.fame} danh vọng · +{mission.gold} xu · {targetName}</small>}
                      {found && guide && <small> · Giao nhiệm vụ: {guide.name}</small>}
                      {found && (mission.badge || mission.outfit || mission.talent || mission.tickets) && <small>🎁 {[
                        mission.badge && `Huy hiệu ${mission.badge}`,
                        mission.outfit && `Trang phục ${mission.outfit}`,
                        mission.talent && `Thiên phú ${mission.talent}`,
                        mission.tickets && `${mission.tickets} Vé UNO`,
                      ].filter(Boolean).join(' · ')}</small>}
                    </div>
                    {found && !done && <button type="button" disabled={!available || Boolean(progress.activeHistoryMissionId && progress.activeHistoryMissionId !== mission.id)} onClick={() => acceptHistoryMission(mission.id)}>
                      {progress.activeHistoryMissionId === mission.id ? 'Đang làm' : !available ? 'Mở chương trước' : 'Nhận nhiệm vụ'}
                    </button>}
                    {done && <strong>Đã xong</strong>}
                  </article>;
                })}
              </div>
            </section>)}
          </div>
          <section className="sv-history-sources" aria-label="Nguồn tham khảo lịch sử">
            <h2>Nguồn tham khảo</h2>
            <p>{currentMapStory.lesson}</p>
            <ul>{currentMapStory.source.map(source => <li key={source.title}>
              {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : <strong>{source.title}</strong>}
              <span> · {source.publisher}</span>
            </li>)}</ul>
            <small>Nhiệm vụ sinh hoạt là hoạt động hư cấu trong game; không được mô tả như sự kiện lịch sử có thật.</small>
          </section>
        </section>
      )}

      {screen === 'final-challenge' && (
        <section className="sv-dialog-screen">
          <div className="sv-dialog-card sv-final-challenge-card">
            <button className="sv-back-button" onClick={() => setScreen(finalChallengeReturnScreen)}>
              {finalChallengeReturnScreen === 'entertainment' ? '← Khu Giải trí' : '← Về bản đồ'}
            </button>
            <div className="sv-character-art" aria-hidden="true">{currentMapHero?.illustration ?? currentMap.icon}</div>
            <span className="sv-kicker">CỔNG CHUYỂN BẢN ĐỒ · {currentMap.region}</span>
            <h1>{progress.completedHistoryMaps.includes(currentMap.id) ? 'Thử thách lại' : 'Thử thách NPC chính'}</h1>
            <div className="sv-gate-hero"><strong>{currentMapHero?.name ?? 'Người dẫn chuyện'}</strong><span>{currentMapHero?.title ?? currentMap.region}</span></div>
            <p>Trận UNO cốt truyện miễn phí, không cược xu và không dùng Vé UNO. Thua không mất nhiệm vụ hay danh vọng; bạn có thể luyện tập ở quán nước rồi quay lại cổng.</p>
            <section className={`sv-gate-requirements${canStartFinalHistoryChallenge(progress, currentMap.id) ? ' is-ready' : ''}`} aria-label="Điều kiện thử thách">
              <h2>{canStartFinalHistoryChallenge(progress, currentMap.id) ? 'Đã đủ điều kiện' : 'Bạn chưa đủ điều kiện để đấu với NPC chính.'}</h2>
              <ul>
                <li>{progress.fame >= requiredChallengeFame ? '✓' : '○'} Danh vọng: {progress.fame}/{requiredChallengeFame}
                  {progress.fame < requiredChallengeFame && <strong> · Còn thiếu {requiredChallengeFame - progress.fame} điểm</strong>}
                </li>
                <li>{currentMapMissionStats.mainCompleted >= currentMapMissionStats.mainRequired ? '✓' : '○'} Nhiệm vụ chính: {currentMapMissionStats.mainCompleted}/{currentMapMissionStats.mainTotal} ({mainMissionPercent}%) · yêu cầu trên 90%
                  {missingMissionPercent > 0 && <strong> · Còn thiếu khoảng {missingMissionPercent}%</strong>}
                  {currentMapMissionStats.mainCompleted < currentMapMissionStats.mainRequired && <strong> · Còn {currentMapMissionStats.mainRequired - currentMapMissionStats.mainCompleted} nhiệm vụ</strong>}
                </li>
                <li>{missingMandatoryChallengeMissions.length ? '○' : '✓'} Nhiệm vụ cốt truyện cuối chương: {mandatoryChallengeMissions.length - missingMandatoryChallengeMissions.length}/{mandatoryChallengeMissions.length} hoàn thành</li>
              </ul>
              {missingMandatoryChallengeMissions.length > 0 && <div className="sv-gate-missing-missions">
                <strong>Còn thiếu nhiệm vụ bắt buộc:</strong>
                <ul>{missingMandatoryChallengeMissions.map(mission => <li key={mission.id}>{mission.title}</li>)}</ul>
              </div>}
              {!canStartFinalHistoryChallenge(progress, currentMap.id) && <button type="button" onClick={() => setScreen('missions')}>Xem nhiệm vụ còn thiếu →</button>}
            </section>
            <section className="sv-gate-rewards">
              <strong>Thưởng khi thắng lần đầu</strong>
              <span>+100 xu · +100 danh vọng · huy hiệu hoàn thành bản đồ</span>
              {currentMap.id === 'hai-ba-trung' && <span>Trang phục nữ tướng Mê Linh · thiên phú Tinh thần Mê Linh · Vé UNO</span>}
              <small>Mở khóa {nextMap.name}, xem đoạn kết câu chuyện và mục “Điều em học được”. Thưởng lần đầu không bị nhận lặp lại khi chơi lại.</small>
            </section>
            <div className="sv-final-challenge-options">
              {canStartFinalHistoryChallenge(progress, currentMap.id) && <button className="sv-primary-button" type="button" onClick={beginFinalChallenge}>
                {progress.completedHistoryMaps.includes(currentMap.id) ? `Đấu lại với ${currentMapHero?.name ?? 'NPC chính'} →` : `Đấu chính thức với ${currentMapHero?.name ?? 'NPC chính'} →`}
              </button>}
              {progress.unlockedHistoryMaps.includes(nextMap.id) && <button type="button" onClick={travelThroughGate}>Sang {nextMap.name} →</button>}
              <small>Đã thử {progress.finalChallengeAttempts[currentMap.id] ?? 0} lần · trận chính thức chỉ mở sau khi đủ điều kiện.</small>
            </div>
          </div>
        </section>
      )}

      {screen === 'story' && currentHero && (
        <section className="sv-dialog-screen">
          <div className="sv-dialog-card">
            <button className="sv-back-button" onClick={returnToMapAfterEncounter}>← Bản đồ</button>
            <div className="sv-character-art" aria-hidden="true">{currentHero.illustration}</div>
            <span className="sv-kicker">GẶP GỠ NHÂN VẬT LỊCH SỬ</span>
            <h1>{currentHero.name}</h1><p className="sv-character-title">{currentHero.title}</p>
            <blockquote>“{currentHero.story}”</blockquote>
            <p className="sv-reward-hint">Trả lời đúng để nhận xu và danh vọng. Hoàn thành {currentHero.questions.length} câu hỏi để sưu tầm huy hiệu <strong>{currentHero.badge}</strong>.</p>
            <button className="sv-primary-button" onClick={goToQuestion}>Nghe chuyện rồi trả lời →</button>
          </div>
        </section>
      )}

      {screen === 'map-one-question' && mapOneCharacter(mapOneCharacterId ?? undefined) && (() => {
        const character = mapOneCharacter(mapOneCharacterId ?? undefined)!;
        const answered = mapOneAnswer !== null;
        return <section className="sv-dialog-screen">
          <div className="sv-dialog-card sv-map-one-question">
            <button className="sv-back-button" onClick={() => setScreen('map')}>← Bản đồ</button>
            <div className="sv-character-art" aria-hidden="true">{character.historical ? '🌺' : '🌾'}</div>
            <span className="sv-kicker">{character.historical ? 'NHÂN VẬT LỊCH SỬ' : 'NHÂN VẬT ĐẠI DIỆN TRONG GAME'}</span>
            <h1>{character.name}</h1>
            <p className="sv-character-title">{character.role}</p>
            <blockquote>“{character.dialogue}”</blockquote>
            <p><strong>{character.question}</strong></p>
            <div className="sv-answer-list">
              {character.answers.map((answer, index) => <button
                type="button"
                key={answer}
                disabled={answered}
                className={answered && index === character.correctAnswer ? 'is-correct' : answered && index === mapOneAnswer ? 'is-wrong' : ''}
                onClick={() => answerMapOneQuestion(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>{answer}
              </button>)}
            </div>
            {answered && <div className={`sv-answer-feedback${mapOneAnswerCorrect ? ' is-correct' : ' is-wrong'}`} role="status">
              <strong>{mapOneAnswerCorrect ? 'Chính xác!' : 'Chưa đúng, mình cùng nhớ lại nhé.'}</strong>
              <p>{character.explanation}</p>
              {mapOneAnswerCorrect && mapOneAnswerRewarded && <small>+10 danh vọng · +10 xu</small>}
              <button className="sv-primary-button" onClick={() => {
                setScreen('map');
                setMissionNotice('');
              }}>Tiếp tục khám phá →</button>
            </div>}
          </div>
        </section>;
      })()}

      {screen === 'question' && currentHero && currentQuestion && (
        <section className="sv-dialog-screen">
          <div className="sv-question-card">
            <button className="sv-back-button" onClick={returnToMapAfterEncounter}>← Bản đồ</button>
            <div className="sv-question-heading"><span className="sv-character-art small" aria-hidden="true">{currentHero.illustration}</span><div><span className="sv-kicker">{currentHero.name}</span><h1>Câu hỏi lịch sử</h1></div></div>
            <div className="sv-question-count">Câu {uniqueCorrectCount(progress, currentHero.id) + 1} / {currentHero.questions.length} · Trả lời đúng: +20 danh vọng, +20 vàng</div>
            <h2>{currentQuestion.question}</h2>
            <div className="sv-answer-list">
              {currentQuestion.answers.map((answer, index) => {
                const answered = progress.encounter?.stage === 'answered';
                const isCorrect = index === currentQuestion.correct;
                const selectedWrong = answered && progress.encounter?.selectedAnswer === index && !progress.encounter.correct;
                return <button key={answer} type="button" disabled={answered} className={`${answered && isCorrect ? 'is-correct' : ''}${selectedWrong ? ' is-wrong' : ''}`} onClick={() => answerQuestion(index)}>
                  <span>{String.fromCharCode(65 + index)}</span>{answer}{answered && isCorrect && <b>✓ Đáp án đúng</b>}
                </button>;
              })}
            </div>
            {progress.encounter?.stage === 'answered' && (
              <div className={`sv-answer-feedback${progress.encounter.correct ? ' is-correct' : ' is-wrong'}`} role="status">
                <strong>{progress.encounter.correct ? 'Chính xác! Giỏi quá!' : 'Chưa đúng, mình cùng nhớ lại nhé.'}</strong>
                <CharacterSprite className="sv-answer-avatar" appearance={profile.appearance} customization={profile.customization} emotion={progress.encounter.correct ? 'happy' : 'surprised'} pose={progress.encounter.correct ? 'cheer' : 'complain'} />
                <p>{currentQuestion.explanation}</p>
                {progress.encounter.quizGold ? <small>+{progress.encounter.quizGold} xu · +{progress.encounter.quizFame} danh vọng {progress.encounter.quizTickets ? `· +${progress.encounter.quizTickets} Vé UNO` : ''} {progress.completedHeroes.includes(currentHero.id) ? `· Đã nhận huy hiệu ${currentHero.badge}` : ''}</small> : <small>Câu trả lời chưa nhận thưởng lần này. Bạn có thể thử lại sau.</small>}
                {progress.encounter.completedMissionRewards?.length ? <p className="sv-mission-reward-note">Hoàn thành nhiệm vụ: {progress.encounter.completedMissionRewards.map(mission => mission === 'correct-5' ? 'Đúng 5 câu hỏi' : mission.startsWith('hero-') ? 'Hoàn thành chuyện nhân vật' : mission === 'fame-100' ? 'Đạt 100 danh vọng' : mission).join(' · ')}</p> : null}
                <button className="sv-primary-button" onClick={returnToMapAfterEncounter}>Tiếp tục khám phá →</button>
              </div>
            )}
          </div>
        </section>
      )}

      {screen === 'collection' && (
        <section className="sv-subscreen">
          <header className="sv-subscreen-heading"><button className="sv-back-button" onClick={() => setScreen('map')}>← Bản đồ</button><span className="sv-kicker">NHỮNG CÂU CHUYỆN ĐÃ GẶP</span><h1>Bộ sưu tập</h1><p>Nhân vật và huy hiệu bạn đã mở khóa.</p></header>
          <div className="sv-hero-grid">{collectedHeroes.map(({ hero, unlocked }) => <article className={`sv-hero-card${unlocked ? '' : ' is-locked'}`} key={hero.id}><span className="sv-hero-art">{unlocked ? hero.illustration : '🔒'}</span><div className="sv-hero-copy"><h3>{hero.name}</h3><p>{unlocked ? hero.title : `Mở ở ${hero.unlockAt} danh vọng`}</p><small>{uniqueCorrectCount(progress, hero.id)}/{hero.questions.length} câu · {progress.badges.includes(hero.badge) ? `🏅 ${hero.badge}` : 'Chưa có huy hiệu'}</small></div></article>)}</div>
          <section className="sv-badge-shelf"><h2>🏅 Huy hiệu đã sưu tầm · {progress.badges.length}</h2><div>{progress.badges.length ? progress.badges.map(badge => <span key={badge}>{badge}</span>) : <p>Trả lời đúng các câu hỏi hoặc thắng UNO để nhận huy hiệu đầu tiên.</p>}</div></section>
          <section className="sv-badge-shelf"><h2>👘 Trang phục</h2><div>{progress.unlockedOutfits.length ? progress.unlockedOutfits.map(outfit => <span key={outfit}>{outfit}</span>) : <p>Thắng ván UNO đầu tiên để mở khóa áo bà ba hoa nắng.</p>}</div></section>
        </section>
      )}

      {screen === 'achievements' && (
        <section className="sv-subscreen">
          <header className="sv-subscreen-heading"><button className="sv-back-button" onClick={() => setScreen('map')}>← Bản đồ</button><span className="sv-kicker">MỖI NGÀY THÊM MỘT ĐIỀU HAY</span><h1>Thành tích & danh vọng</h1><p>{fameLevel.title}</p></header>
          <div className="sv-stat-grid"><article><span>⭐</span><strong>{progress.fame}</strong><small>Điểm danh vọng</small></article><article><span>🪙</span><strong>{progress.gold}</strong><small>Xu ảo tích lũy</small></article><article><span>🎟️</span><strong>{progress.freeUnoTickets}</strong><small>Vé UNO miễn phí</small></article><article><span>🎴</span><strong>{progress.totalWins}/{progress.totalWins + progress.totalLosses + progress.totalDraws}</strong><small>Thắng · thua {progress.totalLosses} · hòa {progress.totalDraws}</small></article></div>
          <section className="sv-rank-list"><h2>Các cấp danh vọng</h2>{FAME_RANKS.map((rank, index) => <div className={progress.fame >= rank.score ? 'is-earned' : ''} key={rank.score}><span>{progress.fame >= rank.score ? '✓' : index + 1}</span><strong>{rank.title}</strong><small>{rank.score.toLocaleString('vi-VN')} điểm</small></div>)}</section>
        </section>
      )}

      {screen === 'character' && (
        <CharacterPage
          initialSetup={newJourneySetup || !profile.displayName}
          startingTemplateSetup={newJourneySetup || !profile.displayName}
          initialDisplayName={newJourneySetup ? '' : profile.displayName || 'Tiểu Mông'}
          initialAppearance={newJourneySetup ? freshHistoryProfile().appearance : profile.appearance}
          initialCustomization={newJourneySetup ? freshHistoryProfile().customization : profile.customization}
          startingCharacterId={newJourneySetup ? undefined : profile.startingCharacterId}
          gold={newJourneySetup ? 0 : progress.gold}
          fame={newJourneySetup ? 0 : progress.fame}
          onCustomizationChange={changeCharacterCustomization}
          onPurchaseItem={purchaseCharacterItem}
          localOnly
          heading={newJourneySetup || !profile.displayName ? 'Tạo nhân vật 2D' : 'Diện mạo hành trình'}
          submitLabel={newJourneySetup || !profile.displayName ? 'Tạo nhân vật & vào xóm' : 'Lưu diện mạo'}
          onStart={completeCharacterSetup}
          onBack={() => setScreen(newJourneySetup ? 'title' : 'map')}
        />
      )}

      {screen === 'settings' && (
        <section className="sv-subscreen sv-utility-screen">
          <header className="sv-subscreen-heading"><button className="sv-back-button" onClick={() => setScreen(settingsReturnScreen)}>← Quay lại</button><span className="sv-kicker">TÙY CHỈNH TRẢI NGHIỆM</span><h1>Cài đặt</h1><p>Âm thanh, giao diện, dữ liệu và các tùy chọn khác.</p></header>
          <SystemPreferences onOpenData={openBackups} />
        </section>
      )}

      {screen === 'backup' && (
        <section className="sv-subscreen sv-utility-screen">
          <header className="sv-subscreen-heading"><button className="sv-back-button" onClick={() => setScreen(backupReturnScreen)}>← {backupReturnScreen === 'title' ? 'Màn hình đầu' : backupReturnScreen === 'settings' ? 'Cài đặt' : 'Bản đồ'}</button><span className="sv-kicker">5 Ô LƯU TRÊN THIẾT BỊ</span><h1>Sao lưu hành trình</h1><p>Lưu hoặc khôi phục danh vọng, nhân vật 2D và vị trí đang đứng. Khi thoát, chỉ các ô lưu này được giữ lại.</p></header>
          {backupReturnScreen === 'title' && profile.displayName && <button className="sv-primary-button sv-home-resume" onClick={continueJourney}>Tiếp tục hành trình hiện tại →</button>}
          <div className="sv-save-slots">
            {Array.from({ length: HISTORY_SAVE_SLOT_COUNT }, (_, index) => {
              const slotNumber = index + 1;
              const slot = saveSlots.find(item => item.slot === slotNumber);
              return <article className={`sv-save-slot${slot ? ' is-filled' : ''}`} key={slotNumber}>
                <div className="sv-save-slot-heading"><span>Ô lưu {slotNumber}</span>{slot && <small>{new Date(slot.savedAt).toLocaleString('vi-VN')}</small>}</div>
                {slot ? <>
                  <strong>{slot.snapshot.profile.displayName || 'Người chơi'} · {slot.snapshot.progress.fame} danh vọng</strong>
                  <p>🪙 {slot.snapshot.progress.gold} vàng · 🏅 {slot.snapshot.progress.badges.length} huy hiệu · {slot.snapshot.progress.completedHeroes.length}/{HISTORY_HEROES.length} nhân vật</p>
                  <div className="sv-save-actions"><button type="button" onClick={() => restoreSlot(slot)}>Khôi phục ô {slotNumber}</button><button type="button" onClick={() => saveSlot(slotNumber)}>Ghi đè ô {slotNumber}</button><button type="button" onClick={() => removeSlot(slotNumber)}>Xóa ô {slotNumber}</button></div>
                </> : <>
                  <strong>Ô lưu đang trống</strong><p>Lưu tiến trình hiện tại vào đây để có thể tiếp tục sau.</p>
                  <button type="button" onClick={() => saveSlot(slotNumber)}>Lưu vào ô {slotNumber}</button>
                </>}
              </article>;
            })}
          </div>
        </section>
      )}

      {screen === 'help' && (
        <section className="sv-subscreen sv-utility-screen">
          <header className="sv-subscreen-heading"><button className="sv-back-button" onClick={() => setScreen('map')}>← Bản đồ</button><span className="sv-kicker">BÀ NĂM DẶN DÒ</span><h1>Đi một vòng xóm</h1><p>Khám phá chậm thôi, chuyện hay không chạy đi đâu cả.</p></header>
          <div className="sv-help-card"><p>⌨️ <strong>Máy tính:</strong> dùng WASD hoặc phím mũi tên để đi, giữ Shift để chạy, nhấn E để trò chuyện và M để mở sơ đồ.</p><p>📱 <strong>Điện thoại:</strong> giữ các nút mũi tên trên bản đồ để di chuyển, chạm biển hiệu để ghé địa điểm.</p><p>📜 Gặp nhân vật, nhận nhiệm vụ, trả lời câu hỏi và tiếp tục khám phá. UNO là hoạt động phụ tại khu Giải trí, hoặc thử thách cuối bản đồ khi đã đủ điều kiện. Muốn giữ tiến trình, hãy lưu vào một trong năm ô; dữ liệu chưa lưu sẽ bị xóa khi thoát game.</p></div>
        </section>
      )}

      {screen === 'reward' && progress.latestReward && (
        <section className="sv-dialog-screen">
          <div className="sv-reward-card">
            <div className="sv-chest" aria-hidden="true">{progress.latestReward.missionOnly ? '🧺' : progress.latestReward.outcome === 'draw' ? '🤝' : progress.latestReward.wonUno ? '🎁' : '🧺'}</div>
            <CharacterSprite className="sv-reward-avatar" appearance={profile.appearance} customization={profile.customization} emotion={progress.latestReward.wonUno ? 'happy' : 'neutral'} pose={progress.latestReward.wonUno ? 'cheer' : 'idle'} />
            <span className="sv-kicker">{progress.latestReward.practiceOnly ? 'PHẦN THƯỞNG LUYỆN TẬP' : 'PHẦN THƯỞNG HÀNH TRÌNH'}</span>
            <h1>{progress.latestReward.missionOnly ? 'Nhiệm vụ hoàn thành!' : progress.latestReward.outcome === 'draw' ? 'Ván hòa!' : progress.latestReward.wonUno ? 'Bạn thắng UNO!' : progress.latestReward.outcome === 'loss' ? 'Hẹn bạn ván sau!' : 'Mỗi câu chuyện đều đáng quý'}</h1>
            <p>{progress.latestReward.title}</p>
            <div className="sv-reward-values"><span>🪙 +{progress.latestReward.gold} xu</span><span>⭐ +{progress.latestReward.fame} danh vọng</span></div>
            {progress.latestReward.tickets ? <p className="sv-new-badge">🎟️ +{progress.latestReward.tickets} Vé UNO miễn phí · đang có {progress.freeUnoTickets}</p> : null}
            {progress.latestReward.completedMissions?.length ? <p className="sv-mission-reward-note">Nhiệm vụ hoàn thành: {progress.latestReward.completedMissions.map(mission => mission === 'correct-5' ? 'Đúng 5 câu hỏi' : mission.startsWith('hero-') ? 'Hoàn thành chuyện nhân vật' : mission === 'fame-100' ? 'Đạt 100 danh vọng' : mission).join(' · ')}</p> : null}
            {progress.latestReward.bettingMessage && <p className="sv-chest-note">{progress.latestReward.bettingMessage}</p>}
            {progress.latestReward.badge && <p className="sv-new-badge">🏅 {progress.latestReward.newBadge ? 'Huy hiệu mới: ' : 'Huy hiệu: '}{progress.latestReward.badge}</p>}
            {progress.latestReward.lesson && <p className="sv-history-lesson" aria-label="Điều em học được">{progress.latestReward.lesson}</p>}
            {progress.latestReward.wonUno && <p className="sv-chest-note">Rương thưởng đã mở! Vật phẩm được lưu trong bộ sưu tập.</p>}
            {progress.latestReward.unlocked?.length ? <p className="sv-unlocked-note">🔓 Vừa mở khóa: {progress.latestReward.unlocked.join(', ')}</p> : null}
            {progress.latestReward.practiceOnly
              ? <button className="sv-primary-button" onClick={closeReward}>Quay về khu Giải trí →</button>
              : <button className="sv-primary-button" onClick={closeReward}>Nhận phần thưởng · về bản đồ →</button>}
          </div>
        </section>
      )}

    </main>
  );
}
