export type RiverPath = 'righteous' | 'shadow';
export const OPENING_MAP_SIDE_NPC_IDS = [
  'herbalist-lang', 'inn-server', 'fruit-aunt-tu', 'smith-thiet-chuy', 'woodcutter',
  'toy-seller', 'beggar-hac-lao', 'singer-le-nuong', 'herdboy-a-sang', 'village-captain',
] as const;
export const OPENING_MAP_AFFINITY_IDS = [
  'memory-keeper', 'woman-general', 'fruit-aunt-tu', 'toy-seller', 'singer-le-nuong',
] as const;
export type OpeningMapSideNpcId = typeof OPENING_MAP_SIDE_NPC_IDS[number];
export type OpeningMapSideNpcAction =
  | 'accept'
  | 'gather-herb'
  | 'deliver-herb'
  | 'buy-meal'
  | 'buy-rumor'
  | 'buy-bun'
  | 'buy-wine'
  | 'buy-fruit'
  | 'eat-fruit'
  | 'give-fruit'
  | 'finish-forging-quest'
  | 'clear-wolves'
  | 'buy-toy'
  | 'give-offering'
  | 'buy-intel'
  | 'share-intel'
  | 'keep-intel'
  | 'reveal-shortcut'
  | 'clear-bandits';
export const RIVER_QUEST_FLAGS = {
  motherRing: 'MQ_01',
  motherWater: 'SQ_01',
  taoFishing: 'LQ_01',
  martialSpar: 'TQ_01',
  messenger: 'MQ_02',
  checkpoint: 'MQ_FINISH',
} as const;
export const RIVER_QUEST_ITEMS = {
  bronzeRing: 'ITEM_NHAN_DONG',
  riverWater: 'ITEM_GAO_NUOC',
  toadFish: 'ITEM_CA_COC_SONG_DAY',
  oldBamboo: 'ITEM_THAN_TRE_GIA',
  patrolMap: 'ITEM_BAN_DO_TUAN_TRA',
  hanLetter: 'ITEM_MAT_THU_DONG_HAN',
  skillBook: 'BOOK_LAC_THUY_DAO_PHAP',
  darkSword: 'WEAPON_DONG_HAN_SWORD',
  heroClothes: 'CLOTHES_ME_LINH_HIEP_SI',
} as const;
export interface RiverBattlePoint { x: number; y: number }
export interface RiverBattleSoldier {
  id: 'spear-1' | 'spear-2';
  position: RiverBattlePoint;
  hp: number;
}
export interface RiverBattleSnapshot {
  hero: RiverBattlePoint;
  boss: RiverBattlePoint;
  soldiers: RiverBattleSoldier[];
  hp: number;
  maxHp: number;
  bossHp: number;
  mp: number;
  maxMp: number;
  ap: number;
  armorTurns: number;
  armorBreakBonus: number;
  rootTurns: number;
  bossPoisonTurns: number;
  poisonUsed: boolean;
  evasionTurns: number;
  bleedTurns: number;
  trap: RiverBattlePoint | null;
  bambooUsed: number;
  nextCritical: boolean;
  status: 'playing' | 'won' | 'lost';
  log: string;
  turn: number;
}
export type RiverCampaignAction =
  | { type: 'activate-main-quest' }
  | { type: 'refresh-day' }
  | { type: 'rest-at-dock' }
  | { type: 'wait-hour' }
  | { type: 'mother-stove-help' }
  | { type: 'equip-ha-ba'; equipped: boolean }
  | { type: 'mother-main'; path: RiverPath }
  | { type: 'mother-water' }
  | { type: 'mother-water-return' }
  | { type: 'tao-fish'; path: RiverPath }
  | { type: 'tao-handoff'; villagerId: 'NPC_DAN_NONG_01' | 'NPC_DAN_NONG_02' | 'NPC_DAN_NONG_03' }
  | { type: 'martial-spar'; path: RiverPath }
  | { type: 'market-choice'; path: RiverPath }
  | { type: 'fish-again'; bait?: 'basic' | 'premium' }
  | { type: 'sell-fish' }
  | { type: 'collect-ore' }
  | { type: 'forge-dagger' }
  | { type: 'cook-river-meal' }
  | { type: 'buy-bait' }
  | { type: 'buy-premium-bait' }
  | { type: 'buy-poison-supplies' }
  | { type: 'buy-health-potion' }
  | { type: 'use-health-potion' }
  | { type: 'opening-npc-action'; npcId: OpeningMapSideNpcId; action: OpeningMapSideNpcAction; recipient?: string }
  | { type: 'coat-dagger' }
  | { type: 'start-boss' }
  | { type: 'boss-progress'; battle: RiverBattleSnapshot }
  | { type: 'boss-victory'; path: RiverPath; hp: number; mp: number; bambooUsed: number }
  | { type: 'boss-retreat'; hp: number; mp: number; bambooUsed: number };

export interface RiverCampaignState {
  day: string;
  timeMinutes: number;
  actionPoints: number;
  motherAffinity: number;
  motherStoveHelped: boolean;
  vanTien: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  morality: number;
  evil: number;
  fastTravel: boolean;
  mainQuestActivated: boolean;
  ringOwned: boolean;
  waterItemCarried: boolean;
  waterSkillUnlocked: boolean;
  taoHandoffs: string[];
  villageBetrayed: boolean;
  martialAffinity: number;
  forgeLockDays: number;
  cheapMedicineUnlocked: boolean;
  healthPotionCount: number;
  inventory: Record<string, number>;
  patrolMap: boolean;
  trapRecipe: boolean;
  oldBamboo: number;
  knowsDaoManual: boolean;
  fishChoice: RiverPath | null;
  motherChoice: RiverPath | null;
  marketChoice: RiverPath | null;
  waterQuestComplete: boolean;
  haBaEquipped: boolean;
  sparChoice: RiverPath | null;
  fishingXp: number;
  fishCaught: number;
  fishStock: number;
  crossbowUnlocked: boolean;
  baitCount: number;
  premiumBaitCount: number;
  ironOre: number;
  daggerForged: boolean;
  riverMealCooked: boolean;
  poisonSupplies: number;
  daggerPoisoned: boolean;
  bossDefeated: boolean;
  bossStarted: boolean;
  battle: RiverBattleSnapshot | null;
  worldMapUnlocked: boolean;
  worldMapEntry: RiverPath | null;
  outfitReward: string | null;
  title: string | null;
  npcQuestStages: Record<string, number>;
  npcAffinities: Record<string, number>;
  insightBonus: number;
  charismaBonus: number;
  luckBonus: number;
  weaponUpgradeLevel: number;
  poisonRecipeUnlocked: boolean;
  banditArmorUnlocked: boolean;
  shortcutHintUnlocked: boolean;
}

export function localDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function riverFishingLevel(state: Pick<RiverCampaignState, 'fishingXp'>): number {
  return Math.min(5, 1 + Math.floor(state.fishingXp / 3));
}

export function freshRiverCampaign(date = new Date()): RiverCampaignState {
  return {
    day: localDayKey(date),
    timeMinutes: 360,
    actionPoints: 3,
    motherAffinity: 50,
    motherStoveHelped: false,
    vanTien: 50,
    hp: 600,
    maxHp: 600,
    mp: 300,
    maxMp: 300,
    morality: 50,
    evil: 0,
    fastTravel: false,
    mainQuestActivated: false,
    ringOwned: false,
    waterItemCarried: false,
    waterSkillUnlocked: false,
    taoHandoffs: [],
    villageBetrayed: false,
    martialAffinity: 50,
    forgeLockDays: 0,
    cheapMedicineUnlocked: false,
    healthPotionCount: 0,
    inventory: {},
    patrolMap: false,
    trapRecipe: false,
    oldBamboo: 0,
    knowsDaoManual: false,
    fishChoice: null,
    motherChoice: null,
    marketChoice: null,
    waterQuestComplete: false,
    haBaEquipped: false,
    sparChoice: null,
    fishingXp: 0,
    fishCaught: 0,
    fishStock: 0,
    crossbowUnlocked: false,
    baitCount: 0,
    premiumBaitCount: 0,
    ironOre: 0,
    daggerForged: false,
    riverMealCooked: false,
    poisonSupplies: 0,
    daggerPoisoned: false,
    bossDefeated: false,
    bossStarted: false,
    battle: null,
    worldMapUnlocked: false,
    worldMapEntry: null,
    outfitReward: null,
    title: null,
    npcQuestStages: {},
    npcAffinities: {},
    insightBonus: 0,
    charismaBonus: 0,
    luckBonus: 0,
    weaponUpgradeLevel: 0,
    poisonRecipeUnlocked: false,
    banditArmorUnlocked: false,
    shortcutHintUnlocked: false,
  };
}

export function normalizeRiverCampaign(value: unknown, date = new Date()): RiverCampaignState {
  const fresh = freshRiverCampaign(date);
  if (!value || typeof value !== 'object') return fresh;
  const input = value as Partial<RiverCampaignState>;
  const integer = (number: unknown, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) =>
    typeof number === 'number' && Number.isSafeInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
  const path = (candidate: unknown): RiverPath | null =>
    candidate === 'righteous' || candidate === 'shadow' ? candidate : null;
  const battle = isRiverBattleSnapshot(input.battle)
    ? {
        ...input.battle,
        soldiers: input.battle.soldiers ?? freshRiverBattleSnapshot(fresh).soldiers,
        bossPoisonTurns: input.battle.bossPoisonTurns ?? 0,
        poisonUsed: input.battle.poisonUsed ?? false,
        evasionTurns: input.battle.evasionTurns ?? 0,
        bleedTurns: input.battle.bleedTurns ?? 0,
        armorBreakBonus: input.battle.armorBreakBonus ?? (input.battle.armorTurns > 0 ? 30 : 0),
      }
    : null;
  const storedDay = typeof input.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : fresh.day;
  const nextDay = storedDay === fresh.day ? storedDay : fresh.day;
  const ringOwned = input.ringOwned === true || path(input.motherChoice) !== null;
  const inventory = input.inventory !== null && typeof input.inventory === 'object'
    ? Object.fromEntries(Object.entries(input.inventory).filter((entry): entry is [string, number] =>
      typeof entry[0] === 'string' && Number.isSafeInteger(entry[1]) && entry[1] > 0))
    : {};
  const npcQuestStages = input.npcQuestStages && typeof input.npcQuestStages === 'object'
    ? Object.fromEntries(Object.entries(input.npcQuestStages).filter(([id, stage]) =>
      (OPENING_MAP_SIDE_NPC_IDS as readonly string[]).includes(id)
      && Number.isSafeInteger(stage) && Number(stage) >= 0 && Number(stage) <= 5))
    : {};
  const npcAffinities = input.npcAffinities && typeof input.npcAffinities === 'object'
    ? Object.fromEntries(Object.entries(input.npcAffinities).filter(([id, affinity]) =>
      (OPENING_MAP_AFFINITY_IDS as readonly string[]).includes(id)
      && Number.isSafeInteger(affinity) && Number(affinity) >= 0 && Number(affinity) <= 100))
    : {};
  const fishStock = integer(input.fishStock, integer(inventory[RIVER_QUEST_ITEMS.toadFish], 0, 0), 0);
  const oldBamboo = integer(input.oldBamboo, integer(inventory[RIVER_QUEST_ITEMS.oldBamboo], 0, 0), 0);
  const healthPotionCount = integer(input.healthPotionCount, integer(inventory.ITEM_THUOC_HOI_HP, 0, 0), 0);
  const waterItemCarried = input.waterItemCarried === true;
  const marketChoice = path(input.marketChoice);
  const sparChoice = path(input.sparChoice);
  const worldMapEntry = path(input.worldMapEntry);
  const itemKeys = [
    RIVER_QUEST_ITEMS.bronzeRing, RIVER_QUEST_ITEMS.riverWater, RIVER_QUEST_ITEMS.toadFish,
    RIVER_QUEST_ITEMS.oldBamboo, RIVER_QUEST_ITEMS.patrolMap, RIVER_QUEST_ITEMS.hanLetter,
    RIVER_QUEST_ITEMS.skillBook, RIVER_QUEST_ITEMS.darkSword, RIVER_QUEST_ITEMS.heroClothes,
    'SKILL_HA_BA_TUC_CONG', 'SKILL_U_LUOC_SAT_QUY_CONG', 'SKILL_RAI_CA_QUAN_THUY',
    'ITEM_THUOC_HOI_HP', 'ITEM_DAO_GAM_THEP_ME_LINH', 'ITEM_DAO_GAM_TAM_DOC',
  ];
  for (const id of itemKeys) delete inventory[id];
  if (ringOwned) inventory[RIVER_QUEST_ITEMS.bronzeRing] = 1;
  if (waterItemCarried) inventory[RIVER_QUEST_ITEMS.riverWater] = 1;
  if (fishStock) inventory[RIVER_QUEST_ITEMS.toadFish] = fishStock;
  else delete inventory[RIVER_QUEST_ITEMS.toadFish];
  if (oldBamboo) inventory[RIVER_QUEST_ITEMS.oldBamboo] = oldBamboo;
  else delete inventory[RIVER_QUEST_ITEMS.oldBamboo];
  if (healthPotionCount) inventory.ITEM_THUOC_HOI_HP = healthPotionCount;
  else delete inventory.ITEM_THUOC_HOI_HP;
  if (input.waterSkillUnlocked === true) inventory.SKILL_HA_BA_TUC_CONG = 1;
  if (input.waterSkillUnlocked === true) inventory.SKILL_HA_BA_TUC_CONG = 1;
  if (marketChoice === 'righteous' || input.patrolMap === true) inventory[RIVER_QUEST_ITEMS.patrolMap] = 1;
  if (marketChoice === 'shadow') {
    inventory[RIVER_QUEST_ITEMS.hanLetter] = 1;
    inventory.SKILL_U_LUOC_SAT_QUY_CONG = 1;
  }
  if (sparChoice === 'righteous') {
    inventory[RIVER_QUEST_ITEMS.skillBook] = 1;
    inventory.SKILL_RAI_CA_QUAN_THUY = 1;
  }
  if (input.daggerForged === true) inventory.ITEM_DAO_GAM_THEP_ME_LINH = 1;
  if (input.daggerPoisoned === true) inventory.ITEM_DAO_GAM_TAM_DOC = 1;
  if (input.bossDefeated === true && worldMapEntry === 'righteous') inventory[RIVER_QUEST_ITEMS.heroClothes] = 1;
  if (input.bossDefeated === true && worldMapEntry === 'shadow') inventory[RIVER_QUEST_ITEMS.darkSword] = 1;
  return {
    ...fresh,
    day: nextDay,
    timeMinutes: storedDay === nextDay ? integer(input.timeMinutes, 360, 0, 1439) : 360,
    actionPoints: storedDay === nextDay ? integer(input.actionPoints, 3, 0, 3) : 3,
    motherAffinity: integer(input.motherAffinity, 50, 0, 100),
    motherStoveHelped: storedDay === nextDay && input.motherStoveHelped === true,
    vanTien: integer(input.vanTien, 50, 0),
    hp: integer(input.hp, 600, 0, integer(input.maxHp, 600, 1)),
    maxHp: integer(input.maxHp, 600, 1),
    mp: integer(input.mp, 300, 0, integer(input.maxMp, 300, 1)),
    maxMp: integer(input.maxMp, 300, 1),
    morality: integer(input.morality, 50, 0, 100),
    evil: integer(input.evil, 0, 0, 100),
    fastTravel: input.fastTravel === true,
    mainQuestActivated: input.mainQuestActivated === true || path(input.motherChoice) !== null,
    ringOwned,
    waterItemCarried,
    waterSkillUnlocked: input.waterSkillUnlocked === true,
    taoHandoffs: Array.isArray(input.taoHandoffs)
      ? [...new Set(input.taoHandoffs.filter((id): id is string =>
        id === 'NPC_DAN_NONG_01' || id === 'NPC_DAN_NONG_02' || id === 'NPC_DAN_NONG_03'))]
      : [],
    villageBetrayed: input.villageBetrayed === true,
    martialAffinity: integer(input.martialAffinity, 50, 0, 100),
    forgeLockDays: integer(input.forgeLockDays, 0, 0, 2),
    cheapMedicineUnlocked: input.cheapMedicineUnlocked === true,
    healthPotionCount,
    inventory,
    patrolMap: input.patrolMap === true,
    trapRecipe: input.trapRecipe === true,
    oldBamboo,
    knowsDaoManual: input.knowsDaoManual === true,
    fishChoice: path(input.fishChoice),
    motherChoice: path(input.motherChoice),
    marketChoice,
    waterQuestComplete: input.waterQuestComplete === true,
    haBaEquipped: input.haBaEquipped === true && integer(input.morality, 50, 0, 100) >= 60,
    sparChoice,
    fishingXp: integer(input.fishingXp, path(input.fishChoice) ? 1 : 0, 0),
    fishCaught: integer(input.fishCaught, path(input.fishChoice) ? 1 : 0, 0),
    fishStock,
    crossbowUnlocked: input.crossbowUnlocked === true || path(input.fishChoice) !== null,
    baitCount: integer(input.baitCount, 0, 0),
    premiumBaitCount: integer(input.premiumBaitCount, 0, 0),
    ironOre: integer(input.ironOre, 0, 0),
    daggerForged: input.daggerForged === true,
    riverMealCooked: input.riverMealCooked === true,
    poisonSupplies: integer(input.poisonSupplies, 0, 0),
    daggerPoisoned: input.daggerPoisoned === true,
    bossDefeated: input.bossDefeated === true,
    bossStarted: input.bossStarted === true,
    battle,
    worldMapUnlocked: input.worldMapUnlocked === true,
    worldMapEntry,
    outfitReward: typeof input.outfitReward === 'string' ? input.outfitReward : null,
    title: typeof input.title === 'string' ? input.title : null,
    npcQuestStages,
    npcAffinities,
    insightBonus: integer(input.insightBonus, 0, 0, 100),
    charismaBonus: integer(input.charismaBonus, 0, 0, 100),
    luckBonus: integer(input.luckBonus, 0, 0, 100),
    weaponUpgradeLevel: integer(input.weaponUpgradeLevel, 0, 0, 3),
    poisonRecipeUnlocked: input.poisonRecipeUnlocked === true,
    banditArmorUnlocked: input.banditArmorUnlocked === true,
    shortcutHintUnlocked: input.shortcutHintUnlocked === true,
  };
}

export function isRiverBattleSnapshot(value: unknown): value is RiverBattleSnapshot {
  if (!value || typeof value !== 'object') return false;
  const battle = value as Partial<RiverBattleSnapshot>;
  const point = (candidate: unknown): candidate is RiverBattlePoint => {
    if (!candidate || typeof candidate !== 'object') return false;
    const position = candidate as Partial<RiverBattlePoint>;
    return Number.isSafeInteger(position.x) && (position.x ?? -1) >= 0 && (position.x ?? 6) < 6
      && Number.isSafeInteger(position.y) && (position.y ?? -1) >= 0 && (position.y ?? 6) < 6;
  };
  const soldiers = battle.soldiers === undefined || (Array.isArray(battle.soldiers)
    && battle.soldiers.length === 2
    && battle.soldiers.every(soldier => soldier !== null && typeof soldier === 'object'
      && (soldier.id === 'spear-1' || soldier.id === 'spear-2')
      && point(soldier.position)
      && Number.isSafeInteger(soldier.hp) && soldier.hp >= 0 && soldier.hp <= 200));
  return point(battle.hero) && point(battle.boss)
    && soldiers
    && (battle.hero.x !== battle.boss.x || battle.hero.y !== battle.boss.y)
    && typeof battle.hp === 'number' && Number.isSafeInteger(battle.hp) && battle.hp >= 0 && Number.isSafeInteger(battle.maxHp) && (battle.maxHp ?? 0) > 0 && battle.hp <= (battle.maxHp ?? 0)
    && typeof battle.bossHp === 'number' && Number.isSafeInteger(battle.bossHp) && battle.bossHp >= 0 && battle.bossHp <= 850
    && typeof battle.mp === 'number' && Number.isSafeInteger(battle.mp) && battle.mp >= 0 && Number.isSafeInteger(battle.maxMp) && (battle.maxMp ?? 0) > 0 && battle.mp <= (battle.maxMp ?? 0)
    && Number.isSafeInteger(battle.ap) && (battle.ap ?? -1) >= 0 && (battle.ap ?? 4) <= 3
    && Number.isSafeInteger(battle.armorTurns) && (battle.armorTurns ?? -1) >= 0
    && Number.isSafeInteger(battle.armorBreakBonus ?? 0) && (battle.armorBreakBonus ?? -1) >= 0 && (battle.armorBreakBonus ?? 51) <= 50
    && Number.isSafeInteger(battle.rootTurns) && (battle.rootTurns ?? -1) >= 0
    && Number.isSafeInteger(battle.bossPoisonTurns ?? 0) && (battle.bossPoisonTurns ?? -1) >= 0
    && (battle.poisonUsed === undefined || typeof battle.poisonUsed === 'boolean')
    && Number.isSafeInteger(battle.evasionTurns ?? 0) && (battle.evasionTurns ?? -1) >= 0
    && Number.isSafeInteger(battle.bleedTurns ?? 0) && (battle.bleedTurns ?? -1) >= 0
    && (battle.trap === null || point(battle.trap))
    && Number.isSafeInteger(battle.bambooUsed) && (battle.bambooUsed ?? -1) >= 0
    && typeof battle.nextCritical === 'boolean'
    && (battle.status === 'playing' || battle.status === 'won' || battle.status === 'lost')
    && (battle.status !== 'won' || battle.bossHp === 0)
    && (battle.status !== 'lost' || battle.hp === 0)
    && (battle.status !== 'playing' || (battle.hp > 0 && battle.bossHp > 0))
    && typeof battle.log === 'string' && battle.log.length <= 240
    && Number.isSafeInteger(battle.turn) && (battle.turn ?? 0) > 0;
}

export function freshRiverBattleSnapshot(campaign: RiverCampaignState): RiverBattleSnapshot {
  return {
    hero: { x: 0, y: 2 },
    boss: { x: 4, y: 2 },
    soldiers: [
      { id: 'spear-1', position: { x: 3, y: 1 }, hp: 200 },
      { id: 'spear-2', position: { x: 3, y: 3 }, hp: 200 },
    ],
    hp: Math.max(650, campaign.hp),
    maxHp: Math.max(650, campaign.maxHp),
    bossHp: 850,
    mp: Math.max(350, campaign.mp),
    maxMp: Math.max(350, campaign.maxMp),
    ap: 3,
    armorTurns: 0,
    armorBreakBonus: 0,
    rootTurns: 0,
    bossPoisonTurns: 0,
    poisonUsed: false,
    evasionTurns: 0,
    bleedTurns: 0,
    trap: null,
    bambooUsed: 0,
    nextCritical: false,
    status: 'playing',
    log: 'Thân pháp 75 giúp Tiểu Mông đi trước · Tiểu Mông có 3 AP.',
    turn: 1,
  };
}

export function isRiverCampaignState(value: unknown): value is RiverCampaignState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<RiverCampaignState>;
  return typeof state.day === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(state.day)
    && Number.isSafeInteger(state.actionPoints) && (state.actionPoints ?? -1) >= 0 && (state.actionPoints ?? 4) <= 3
    && Number.isSafeInteger(state.timeMinutes) && (state.timeMinutes ?? -1) >= 0 && (state.timeMinutes ?? 1440) < 1440
    && Number.isSafeInteger(state.motherAffinity) && (state.motherAffinity ?? -1) >= 0 && (state.motherAffinity ?? 101) <= 100
    && typeof state.motherStoveHelped === 'boolean'
    && Number.isSafeInteger(state.vanTien) && (state.vanTien ?? -1) >= 0
    && Number.isSafeInteger(state.hp) && Number.isSafeInteger(state.maxHp) && (state.maxHp ?? 0) > 0
    && (state.hp ?? Infinity) <= (state.maxHp ?? 0)
    && Number.isSafeInteger(state.mp) && Number.isSafeInteger(state.maxMp) && (state.maxMp ?? 0) > 0
    && (state.mp ?? Infinity) <= (state.maxMp ?? 0)
    && Number.isSafeInteger(state.morality) && (state.morality ?? -1) >= 0 && (state.morality ?? 101) <= 100
    && Number.isSafeInteger(state.evil) && (state.evil ?? -1) >= 0 && (state.evil ?? 101) <= 100
    && typeof state.fastTravel === 'boolean' && typeof state.patrolMap === 'boolean'
    && typeof state.mainQuestActivated === 'boolean'
    && typeof state.ringOwned === 'boolean'
    && typeof state.waterItemCarried === 'boolean'
    && typeof state.waterSkillUnlocked === 'boolean'
    && Array.isArray(state.taoHandoffs)
    && state.taoHandoffs.every(id => id === 'NPC_DAN_NONG_01' || id === 'NPC_DAN_NONG_02' || id === 'NPC_DAN_NONG_03')
    && typeof state.villageBetrayed === 'boolean'
    && Number.isSafeInteger(state.martialAffinity) && (state.martialAffinity ?? -1) >= 0 && (state.martialAffinity ?? 101) <= 100
    && Number.isSafeInteger(state.forgeLockDays) && (state.forgeLockDays ?? -1) >= 0 && (state.forgeLockDays ?? 3) <= 2
    && typeof state.cheapMedicineUnlocked === 'boolean'
    && Number.isSafeInteger(state.healthPotionCount) && (state.healthPotionCount ?? -1) >= 0
    && state.inventory !== null && typeof state.inventory === 'object'
    && Object.entries(state.inventory).every(([id, count]) => typeof id === 'string' && Number.isSafeInteger(count) && count > 0)
    && typeof state.trapRecipe === 'boolean' && Number.isSafeInteger(state.oldBamboo) && (state.oldBamboo ?? -1) >= 0
    && typeof state.knowsDaoManual === 'boolean'
    && (state.fishChoice === null || state.fishChoice === 'righteous' || state.fishChoice === 'shadow')
    && (state.motherChoice === null || state.motherChoice === 'righteous' || state.motherChoice === 'shadow')
    && (state.marketChoice === null || state.marketChoice === 'righteous' || state.marketChoice === 'shadow')
    && typeof state.waterQuestComplete === 'boolean'
    && typeof state.haBaEquipped === 'boolean'
    && (state.sparChoice === null || state.sparChoice === 'righteous' || state.sparChoice === 'shadow')
    && Number.isSafeInteger(state.fishingXp) && (state.fishingXp ?? -1) >= 0
    && Number.isSafeInteger(state.fishCaught) && (state.fishCaught ?? -1) >= 0
    && Number.isSafeInteger(state.fishStock) && (state.fishStock ?? -1) >= 0
    && typeof state.crossbowUnlocked === 'boolean'
    && Number.isSafeInteger(state.baitCount) && (state.baitCount ?? -1) >= 0
    && Number.isSafeInteger(state.premiumBaitCount) && (state.premiumBaitCount ?? -1) >= 0
    && Number.isSafeInteger(state.ironOre) && (state.ironOre ?? -1) >= 0
    && typeof state.daggerForged === 'boolean' && typeof state.riverMealCooked === 'boolean'
    && Number.isSafeInteger(state.poisonSupplies) && (state.poisonSupplies ?? -1) >= 0
    && typeof state.daggerPoisoned === 'boolean'
    && typeof state.bossDefeated === 'boolean' && typeof state.bossStarted === 'boolean' && typeof state.worldMapUnlocked === 'boolean'
    && (state.worldMapEntry === null || state.worldMapEntry === 'righteous' || state.worldMapEntry === 'shadow')
    && (state.battle === null || isRiverBattleSnapshot(state.battle))
    && (state.outfitReward === null || typeof state.outfitReward === 'string')
    && (state.title === null || typeof state.title === 'string')
    && state.npcQuestStages !== null && typeof state.npcQuestStages === 'object'
    && Object.entries(state.npcQuestStages).every(([id, stage]) =>
      (OPENING_MAP_SIDE_NPC_IDS as readonly string[]).includes(id)
      && Number.isSafeInteger(stage) && stage >= 0 && stage <= 5)
    && state.npcAffinities !== null && typeof state.npcAffinities === 'object'
    && Object.entries(state.npcAffinities).every(([id, affinity]) =>
      (OPENING_MAP_AFFINITY_IDS as readonly string[]).includes(id)
      && Number.isSafeInteger(affinity) && affinity >= 0 && affinity <= 100)
    && Number.isSafeInteger(state.insightBonus) && (state.insightBonus ?? -1) >= 0
    && Number.isSafeInteger(state.charismaBonus) && (state.charismaBonus ?? -1) >= 0
    && Number.isSafeInteger(state.luckBonus) && (state.luckBonus ?? -1) >= 0
    && Number.isSafeInteger(state.weaponUpgradeLevel) && (state.weaponUpgradeLevel ?? -1) >= 0 && (state.weaponUpgradeLevel ?? 4) <= 3
    && typeof state.poisonRecipeUnlocked === 'boolean'
    && typeof state.banditArmorUnlocked === 'boolean'
    && typeof state.shortcutHintUnlocked === 'boolean';
}

function bounded(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function applyRiverCampaignAction(
  current: RiverCampaignState,
  action: RiverCampaignAction,
  talent: string | null,
  date = new Date(),
): RiverCampaignState {
  const state = normalizeRiverCampaign(current, date);
  if (action.type === 'rest-at-dock') {
    if (state.battle?.status === 'playing') throw new Error('Không thể nghỉ khi đang trong trận chiến.');
    if (state.mainQuestActivated && state.actionPoints > 0) {
      throw new Error(`Vẫn còn ${state.actionPoints} điểm hoạt động. Hãy dùng hết trong ngày trước khi nghỉ qua đêm.`);
    }
    return {
      ...state, timeMinutes: 360, actionPoints: 3, hp: state.maxHp, mp: state.maxMp,
      battle: null, bossStarted: false, mainQuestActivated: true, forgeLockDays: Math.max(0, state.forgeLockDays - 1),
    };
  }
  if (action.type === 'wait-hour') {
    if (state.battle?.status === 'playing') throw new Error('Không thể chờ khi đang trong trận chiến.');
    return { ...state, timeMinutes: (state.timeMinutes + 60) % 1440 };
  }
  if (action.type === 'mother-stove-help') {
    if (state.timeMinutes < 660 || state.timeMinutes >= 840) throw new Error('Bà mẹ quê chỉ nhóm bếp vào buổi trưa (11:00–14:00).');
    if (state.motherStoveHelped) throw new Error('Hôm nay bạn đã giúp Bà mẹ quê quạt bếp rồi.');
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    return {
      ...state,
      actionPoints: state.actionPoints - 1,
      motherAffinity: bounded(state.motherAffinity + 10),
      motherStoveHelped: true,
    };
  }
  if (action.type === 'equip-ha-ba') {
    if (state.morality < 60) throw new Error('Cần Đạo Đức ít nhất 60 để nhận Hà Bá Tức Công.');
    return { ...state, haBaEquipped: action.equipped };
  }
  if (action.type === 'refresh-day') return state;
  if (action.type === 'activate-main-quest') {
    return state.mainQuestActivated ? state : { ...state, mainQuestActivated: true };
  }
  if (action.type === 'opening-npc-action') {
    const inventory = { ...state.inventory };
    const stages = { ...state.npcQuestStages };
    const stage = stages[action.npcId] ?? 0;
    const spendAp = () => {
      if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
      return state.actionPoints - 1;
    };
    const requireStage = (expected: number) => {
      if (stage !== expected) throw new Error('Nhiệm vụ của nhân vật chưa đến bước này.');
    };
    const addItem = (id: string, count = 1) => { inventory[id] = (inventory[id] ?? 0) + count; };
    const removeItem = (id: string) => {
      if ((inventory[id] ?? 0) < 1) throw new Error('Không có vật phẩm cần dùng trong hành trang.');
      if (inventory[id] === 1) delete inventory[id];
      else inventory[id]--;
    };
    const save = (changes: Partial<RiverCampaignState> = {}): RiverCampaignState => ({
      ...state, ...changes, inventory, npcQuestStages: stages,
    });
    if (action.npcId === 'herbalist-lang') {
      if (action.action === 'accept') {
        requireStage(0);
        stages[action.npcId] = 1;
        return save({ actionPoints: spendAp() });
      }
      if (action.action === 'gather-herb') {
        requireStage(1);
        addItem('ITEM_XUYEN_KHUNG');
        stages[action.npcId] = 2;
        return save({ actionPoints: spendAp() });
      }
      if (action.action === 'deliver-herb') {
        requireStage(2);
        removeItem('ITEM_XUYEN_KHUNG');
        stages[action.npcId] = 3;
        return save({
          actionPoints: spendAp(),
          hp: Math.min(state.maxHp + 50, state.hp + 50),
          maxHp: state.maxHp + 50,
          poisonRecipeUnlocked: true,
        });
      }
    }
    if (action.npcId === 'inn-server') {
      if (action.action === 'buy-meal') {
        if (state.vanTien < 10) throw new Error('Cần 10 Văn tiền để mua cháo nóng.');
        if (state.actionPoints >= 3) throw new Error('Thể lực đã đầy, chưa cần dùng bữa hồi phục.');
        return save({ actionPoints: state.actionPoints + 1, vanTien: state.vanTien - 10 });
      }
      if (action.action === 'buy-rumor') {
        if ((state.npcQuestStages[action.npcId] ?? 0) > 0) throw new Error('Bạn đã nghe tin đồn tuần tra hôm nay.');
        if (state.vanTien < 5) throw new Error('Cần 5 Văn tiền để nghe tin đồn.');
        stages[action.npcId] = 1;
        addItem(RIVER_QUEST_ITEMS.patrolMap);
        return save({ actionPoints: spendAp(), vanTien: state.vanTien - 5, patrolMap: true });
      }
      if (action.action === 'buy-bun' || action.action === 'buy-wine') {
        const price = action.action === 'buy-bun' ? 5 : 10;
        const item = action.action === 'buy-bun' ? 'ITEM_BANH_BAO' : 'ITEM_RUOU_NEP';
        if (state.vanTien < price) throw new Error(`Cần ${price} Văn tiền để mua ${action.action === 'buy-bun' ? 'bánh bao' : 'rượu nếp'}.`);
        addItem(item);
        return save({ actionPoints: spendAp(), vanTien: state.vanTien - price });
      }
    }
    if (action.npcId === 'fruit-aunt-tu') {
      if (action.action === 'buy-fruit') {
        if (state.vanTien < 8) throw new Error('Cần 8 Văn tiền để mua trái cây.');
        addItem('ITEM_TRAI_CAY');
        return save({ actionPoints: spendAp(), vanTien: state.vanTien - 8 });
      }
      if (action.action === 'eat-fruit') {
        if (state.mp >= state.maxMp) throw new Error('Nội lực đang đầy.');
        removeItem('ITEM_TRAI_CAY');
        return save({ mp: Math.min(state.maxMp, state.mp + 75) });
      }
      if (action.action === 'give-fruit') {
        if (!action.recipient || !(OPENING_MAP_AFFINITY_IDS as readonly string[]).includes(action.recipient)) {
          throw new Error('Chọn một nhân vật nữ để tặng trái cây.');
        }
        removeItem('ITEM_TRAI_CAY');
        const affinities = { ...state.npcAffinities };
        affinities[action.recipient] = bounded((affinities[action.recipient] ?? 50) + 10);
        return save({
          npcAffinities: affinities,
          motherAffinity: action.recipient === 'memory-keeper' ? bounded(state.motherAffinity + 10) : state.motherAffinity,
          martialAffinity: action.recipient === 'woman-general' ? bounded(state.martialAffinity + 10) : state.martialAffinity,
          actionPoints: spendAp(),
        });
      }
    }
    if (action.npcId === 'smith-thiet-chuy') {
      if (action.action === 'accept') {
        requireStage(0);
        stages[action.npcId] = 1;
        return save({ actionPoints: spendAp() });
      }
      if (action.action === 'finish-forging-quest') {
        requireStage(1);
        if (state.ironOre < 2) throw new Error('Cần tìm đủ 2 quặng sắt ở mỏm đá suối nguồn.');
        stages[action.npcId] = 3;
        return save({ actionPoints: spendAp(), ironOre: state.ironOre - 2, weaponUpgradeLevel: 1 });
      }
    }
    if (action.npcId === 'woodcutter') {
      if (action.action === 'accept') {
        requireStage(0);
        stages[action.npcId] = 1;
        return save({ actionPoints: spendAp() });
      }
      if (action.action === 'clear-wolves') {
        requireStage(1);
        stages[action.npcId] = 3;
        addItem('ITEM_GO_QUY', 3);
        return save({
          actionPoints: spendAp(),
          oldBamboo: state.oldBamboo + 3,
          trapRecipe: true,
        });
      }
    }
    if (action.npcId === 'toy-seller' && action.action === 'buy-toy') {
      requireStage(0);
      if (state.vanTien < 15) throw new Error('Cần 15 Văn tiền để mua tò he may mắn.');
      stages[action.npcId] = 3;
      addItem('ITEM_TO_HE');
      return save({
        actionPoints: spendAp(),
        vanTien: state.vanTien - 15,
        insightBonus: state.insightBonus + 5,
        luckBonus: state.luckBonus + 5,
      });
    }
    if (action.npcId === 'beggar-hac-lao' && action.action === 'give-offering') {
      requireStage(0);
      removeItem('ITEM_BANH_BAO');
      removeItem('ITEM_RUOU_NEP');
      stages[action.npcId] = 3;
      addItem('SKILL_DA_NGUU_BAI_TUONG');
      return save({ actionPoints: spendAp() });
    }
    if (action.npcId === 'singer-le-nuong' && action.action === 'buy-intel') {
      requireStage(0);
      if (state.vanTien < 15) throw new Error('Cần 15 Văn tiền để nhận tin tình báo.');
      stages[action.npcId] = 3;
      addItem('ITEM_TIN_BIEN_AI');
      return save({
        actionPoints: spendAp(),
        vanTien: state.vanTien - 15,
        charismaBonus: state.charismaBonus + 5,
      });
    }
    if (action.npcId === 'singer-le-nuong' && (action.action === 'share-intel' || action.action === 'keep-intel')) {
      requireStage(3);
      if (action.action === 'share-intel') {
        removeItem('ITEM_TIN_BIEN_AI');
        stages[action.npcId] = 4;
        addItem('ITEM_TIN_DA_CHIA_SE');
        return save({ actionPoints: spendAp(), morality: bounded(state.morality + 5) });
      }
      stages[action.npcId] = 5;
      return save({ actionPoints: spendAp(), evil: bounded(state.evil + 5) });
    }
    if (action.npcId === 'herdboy-a-sang' && action.action === 'reveal-shortcut') {
      requireStage(0);
      stages[action.npcId] = 3;
      addItem('ITEM_SO_DO_DUONG_TAT');
      return save({ shortcutHintUnlocked: true, fastTravel: true });
    }
    if (action.npcId === 'village-captain') {
      if (action.action === 'accept') {
        requireStage(0);
        stages[action.npcId] = 1;
        return save({ actionPoints: spendAp() });
      }
      if (action.action === 'clear-bandits') {
        requireStage(1);
        stages[action.npcId] = 3;
        addItem('CLOTHES_GIAP_DANH_BINH');
        return save({
          actionPoints: spendAp(),
          morality: bounded(state.morality + 10),
          banditArmorUnlocked: true,
        });
      }
    }
    throw new Error('Tương tác NPC không hợp lệ hoặc chưa sẵn sàng.');
  }

  if (action.type === 'boss-progress') {
    if (!state.bossStarted || !isRiverBattleSnapshot(action.battle)) throw new Error('Không có trận đánh hợp lệ để lưu.');
    return {
      ...state,
      battle: { ...action.battle, bossPoisonTurns: action.battle.bossPoisonTurns ?? 0 },
      hp: Math.min(state.maxHp, action.battle.hp),
      mp: Math.min(state.maxMp, action.battle.mp),
      daggerPoisoned: action.battle.poisonUsed ? false : state.daggerPoisoned,
    };
  }

  if (action.type === 'mother-main') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (!state.mainQuestActivated) throw new Error('Hãy thức dậy tại chõng tre nhà Bà mẹ quê để nhận nhiệm vụ.');
    const spendAction = { ...state, actionPoints: state.actionPoints - 1 };
    if (state.ringOwned || state.motherChoice) throw new Error('Bạn đã nhận chiếc nhẫn gia truyền rồi.');
    return action.path === 'righteous'
      ? {
          ...spendAction, motherChoice: action.path, ringOwned: true, morality: bounded(state.morality + 10),
          motherAffinity: bounded(state.motherAffinity + 20), fastTravel: true,
          inventory: { ...state.inventory, [RIVER_QUEST_ITEMS.bronzeRing]: 1 },
        }
      : {
          ...spendAction, motherChoice: action.path, ringOwned: true, morality: bounded(state.morality - 15),
          evil: bounded(state.evil + 10), motherAffinity: bounded(state.motherAffinity - 30),
          vanTien: state.vanTien + 100, inventory: { ...state.inventory, [RIVER_QUEST_ITEMS.bronzeRing]: 1 },
        };
  }
  if (action.type === 'mother-water') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.waterQuestComplete) throw new Error('Nhiệm vụ Gáo Nước Sông Đáy đã hoàn thành.');
    if (state.waterItemCarried) throw new Error('Đã có gáo nước sạch trong túi. Hãy mang về cho Bà mẹ quê.');
    if (state.motherAffinity < 50) throw new Error('Cần Hảo cảm Bà mẹ quê ít nhất 50 để nhận việc.');
    if (state.mp >= state.maxMp * .4) throw new Error('Cần Nội Lực dưới 40% để nhận Gáo Nước Sông Đáy.');
    return {
      ...state, actionPoints: state.actionPoints - 1, waterItemCarried: true,
      inventory: { ...state.inventory, [RIVER_QUEST_ITEMS.riverWater]: 1 },
    };
  }
  if (action.type === 'mother-water-return') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (!state.waterItemCarried || state.waterQuestComplete) throw new Error('Chưa có gáo nước để giao cho Bà mẹ quê.');
    const waterSkillUnlocked = state.morality >= 60;
    const inventory = { ...state.inventory };
    delete inventory[RIVER_QUEST_ITEMS.riverWater];
    if (waterSkillUnlocked) inventory.SKILL_HA_BA_TUC_CONG = 1;
    return {
      ...state, actionPoints: state.actionPoints - 1, waterItemCarried: false, waterQuestComplete: true,
      waterSkillUnlocked, hp: Math.min(state.maxHp + 50, state.hp + 50), maxHp: state.maxHp + 50, inventory,
    };
  }
  if (action.type === 'tao-fish') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.fishChoice) throw new Error('Bạn đã hoàn thành chuyến câu cá với Tảo.');
    const spendAction = { ...state, actionPoints: state.actionPoints - 1 };
    const itemCount = action.path === 'righteous' ? 3 : 0;
    const inventory = { ...state.inventory };
    if (itemCount) inventory[RIVER_QUEST_ITEMS.toadFish] = itemCount;
    else delete inventory[RIVER_QUEST_ITEMS.toadFish];
    const reward = {
      fishingXp: state.fishingXp + 1, fishCaught: state.fishCaught + 1,
      crossbowUnlocked: true, fishStock: itemCount,
    };
    return action.path === 'righteous'
      ? { ...spendAction, ...reward, inventory, taoHandoffs: [], fishChoice: null }
      : {
          ...spendAction, ...reward, inventory, fishChoice: action.path, trapRecipe: true,
          oldBamboo: state.oldBamboo + (talent === 'forest-and-tide' ? 6 : 3),
          evil: bounded(state.evil + 10), vanTien: state.vanTien + 80,
        };
  }
  if (action.type === 'tao-handoff') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.fishChoice) throw new Error('Bạn đã hoàn thành chuyến câu cá với Tảo.');
    if (state.taoHandoffs.includes(action.villagerId)) throw new Error('Bạn đã chia cá cho người dân này rồi.');
    if (state.fishStock < 1 || (state.inventory[RIVER_QUEST_ITEMS.toadFish] ?? 0) < 1) throw new Error('Cần có Cá Cóc Sông Đáy trong túi để chia cho dân làng.');
    const taoHandoffs = [...state.taoHandoffs, action.villagerId];
    const completed = taoHandoffs.length === 3;
    const inventory = { ...state.inventory };
    const remainingFish = Math.max(0, (inventory[RIVER_QUEST_ITEMS.toadFish] ?? 0) - 1);
    if (remainingFish) inventory[RIVER_QUEST_ITEMS.toadFish] = remainingFish;
    else delete inventory[RIVER_QUEST_ITEMS.toadFish];
    return {
      ...state, actionPoints: state.actionPoints - 1, taoHandoffs, inventory,
      fishStock: Math.max(0, state.fishStock - 1),
      ...(completed ? {
        fishChoice: 'righteous' as const, morality: bounded(state.morality + 15), trapRecipe: true,
        oldBamboo: state.oldBamboo + (talent === 'forest-and-tide' ? 6 : 3),
      } : {}),
    };
  }
  if (action.type === 'fish-again') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (!state.fishChoice) throw new Error('Hãy hoàn thành buổi câu cá đầu tiên với Tảo trước.');
    const bait = action.bait ?? 'basic';
    if (bait === 'premium' && riverFishingLevel(state) < 2) throw new Error('Cần đạt nghề Câu Cá cấp 2 để dùng mồi xịn.');
    if (bait === 'basic' && state.baitCount < 1) throw new Error('Cần mua mồi câu ở tiệm của Giao trước.');
    if (bait === 'premium' && state.premiumBaitCount < 1) throw new Error('Cần mua mồi xịn ở tiệm của Giao trước.');
    return {
      ...state,
      actionPoints: state.actionPoints - 1,
      baitCount: bait === 'basic' ? state.baitCount - 1 : state.baitCount,
      premiumBaitCount: bait === 'premium' ? state.premiumBaitCount - 1 : state.premiumBaitCount,
      fishingXp: state.fishingXp + 1,
      fishCaught: state.fishCaught + 1,
      fishStock: state.fishStock + 1,
    };
  }
  if (action.type === 'sell-fish') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.fishStock < 1) throw new Error('Không có cá trong túi để bán.');
    return { ...state, actionPoints: state.actionPoints - 1, fishStock: state.fishStock - 1, vanTien: state.vanTien + 20 };
  }
  if (action.type === 'collect-ore') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    return { ...state, actionPoints: state.actionPoints - 1, ironOre: state.ironOre + 1 };
  }
  if (action.type === 'forge-dagger') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.daggerForged) throw new Error('Dao Găm Thép Mê Linh đã được rèn.');
    if (state.forgeLockDays > 0) throw new Error(`Lò rèn tạm đóng · còn ${state.forgeLockDays} ngày.`);
    if (state.timeMinutes < 660 || state.timeMinutes >= 840) throw new Error('Chỉ có thể rèn tại sân Võ Sư Nương buổi trưa (11:00–14:00).');
    if (state.ironOre < 2 || state.vanTien < 20) throw new Error('Cần 2 quặng sắt và 20 Văn tiền để rèn dao.');
    return {
      ...state,
      actionPoints: state.actionPoints - 1,
      ironOre: state.ironOre - 2,
      vanTien: state.vanTien - 20,
      daggerForged: true,
    };
  }
  if (action.type === 'cook-river-meal') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.riverMealCooked) throw new Error('Món ăn bồi bổ đã dùng rồi.');
    if (riverFishingLevel(state) < 2 || state.fishStock < 1) throw new Error('Cần nghề Câu Cá cấp 2 và một con cá trong túi.');
    return {
      ...state,
      actionPoints: state.actionPoints - 1,
      fishStock: state.fishStock - 1,
      riverMealCooked: true,
      hp: state.hp + 25,
      maxHp: state.maxHp + 25,
    };
  }
  if (action.type === 'buy-bait') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.vanTien < 15) throw new Error('Cần 15 Văn tiền để mua 3 phần mồi câu.');
    return { ...state, actionPoints: state.actionPoints - 1, vanTien: state.vanTien - 15, baitCount: state.baitCount + 3 };
  }
  if (action.type === 'buy-premium-bait') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (riverFishingLevel(state) < 2) throw new Error('Cần đạt nghề Câu Cá cấp 2 để mua mồi xịn.');
    if (state.vanTien < 25) throw new Error('Cần 25 Văn tiền để mua 3 phần mồi xịn.');
    return { ...state, actionPoints: state.actionPoints - 1, vanTien: state.vanTien - 25, premiumBaitCount: state.premiumBaitCount + 3 };
  }
  if (action.type === 'buy-poison-supplies') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.evil < 50 && !state.poisonRecipeUnlocked) throw new Error('Cần ít nhất 50 Tà Khí hoặc công thức dược liệu của Lão Lang Trung.');
    if (state.vanTien < 25) throw new Error('Cần 25 Văn tiền để mua dược liệu pha độc.');
    return { ...state, actionPoints: state.actionPoints - 1, vanTien: state.vanTien - 25, poisonSupplies: state.poisonSupplies + 1 };
  }
  if (action.type === 'coat-dagger') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.evil < 50) throw new Error('Cần ít nhất 50 Tà Khí để học Sát Thủ Sổ Tay / Độc Thiểm Thư.');
    if (state.poisonSupplies < 1) throw new Error('Cần mua dược liệu pha độc tại tiệm của Giao.');
    if (state.daggerPoisoned) throw new Error('Dao găm đã được tẩm độc.');
    return {
      ...state,
      actionPoints: state.actionPoints - 1,
      poisonSupplies: state.poisonSupplies - 1,
      daggerPoisoned: true,
    };
  }
  if (action.type === 'martial-spar') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.sparChoice) throw new Error('Bạn đã hoàn thành buổi thử tập với Võ Sư Nương.');
    if (!(state.timeMinutes >= 840 || state.timeMinutes < 360)) throw new Error('Võ Sư Nương chỉ nhận tỷ thí buổi tối (14:00–06:00).');
    const agility = talent === 'keen-senses' ? 90 : 75;
    if (agility < 40) throw new Error('Cần Thân Pháp ít nhất 40 để bước vào tỷ thí.');
    if (action.path === 'righteous' && (agility < 60 || 65 < 50)) {
      throw new Error('Nhánh Khiêm Tốn cần Thân Pháp ≥60 và Ngộ Tính ≥50.');
    }
    const humbleBook = action.path === 'righteous';
    const inventory = { ...state.inventory };
    if (humbleBook) {
      inventory[RIVER_QUEST_ITEMS.skillBook] = 1;
      inventory.SKILL_RAI_CA_QUAN_THUY = 1;
    }
    return {
      ...state,
      actionPoints: state.actionPoints - 1,
      sparChoice: action.path,
      knowsDaoManual: humbleBook,
      inventory,
      morality: humbleBook ? bounded(state.morality + 5) : state.morality,
      evil: action.path === 'shadow' ? bounded(state.evil + 10) : state.evil,
      martialAffinity: action.path === 'shadow' ? bounded(state.martialAffinity - 20) : state.martialAffinity,
      forgeLockDays: action.path === 'shadow' ? 2 : state.forgeLockDays,
    };
  }
  if (action.type === 'market-choice') {
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.marketChoice) throw new Error('Bạn đã quyết định việc mật thư ở chợ.');
    if (!(state.timeMinutes >= 840 || state.timeMinutes < 360)) throw new Error('Giao chỉ trao mật thư vào buổi tối (14:00–06:00).');
    if (state.evil < 0) throw new Error('Chưa đủ điều kiện gặp Giao.');
    if (action.path === 'righteous' && state.vanTien < 30) throw new Error('Cần 30 Văn tiền để mua mật thư.');
    return action.path === 'righteous'
      ? {
          ...state, actionPoints: state.actionPoints - 1, marketChoice: action.path, vanTien: state.vanTien - 30,
          morality: bounded(state.morality + 20), patrolMap: true, cheapMedicineUnlocked: true,
          inventory: { ...state.inventory, [RIVER_QUEST_ITEMS.patrolMap]: 1 },
        }
      : {
          ...state, actionPoints: state.actionPoints - 1, marketChoice: action.path, vanTien: state.vanTien,
          morality: bounded(state.morality - 50), evil: bounded(state.evil + 40), villageBetrayed: true,
          patrolMap: false,
          inventory: { ...state.inventory, [RIVER_QUEST_ITEMS.hanLetter]: 1, SKILL_U_LUOC_SAT_QUY_CONG: 1 },
        };
  }
  if (action.type === 'buy-health-potion') {
    if (!state.cheapMedicineUnlocked) throw new Error('Cần Bản Đồ Tuần Tra Chính đạo để mở tiệm thuốc giá rẻ.');
    if (state.actionPoints < 1) throw new Error('Đã hết 3 điểm hoạt động hôm nay. Hãy quay lại vào ngày mai.');
    if (state.vanTien < 10) throw new Error('Cần 10 Văn tiền để mua thuốc hồi HP.');
    return { ...state, actionPoints: state.actionPoints - 1, vanTien: state.vanTien - 10, healthPotionCount: state.healthPotionCount + 1 };
  }
  if (action.type === 'use-health-potion') {
    if (state.healthPotionCount < 1) throw new Error('Không có thuốc hồi HP trong túi.');
    if (state.hp >= state.maxHp) throw new Error('Khí huyết đang đầy.');
    return { ...state, hp: Math.min(state.maxHp, state.hp + 150), healthPotionCount: state.healthPotionCount - 1 };
  }
  if (action.type === 'start-boss') {
    if (state.bossDefeated) throw new Error('Bạn đã vượt qua Chốt Chặn.');
    if (state.bossStarted) throw new Error('Trận đánh ở Chốt Chặn đã bắt đầu.');
    if (!state.trapRecipe || !state.knowsDaoManual) throw new Error('Cần chuẩn bị Bẫy Tre Gai và Lạc Thủy Đao Pháp trước khi vào Chốt Chặn.');
    const started = { ...state, bossStarted: true };
    return { ...started, battle: freshRiverBattleSnapshot(started) };
  }
  if (action.type === 'boss-retreat') {
    if (!state.bossStarted) throw new Error('Không có trận đánh nào để rút lui.');
    if (!Number.isSafeInteger(action.bambooUsed) || action.bambooUsed < 0 || action.bambooUsed > state.oldBamboo) throw new Error('Số bẫy đã dùng không hợp lệ.');
    if (!state.battle || state.battle.status === 'won'
      || action.hp !== state.battle.hp || action.mp !== state.battle.mp || action.bambooUsed !== state.battle.bambooUsed) {
      throw new Error('Trạng thái rút lui không khớp với trận đánh đã lưu.');
    }
    const defeated = state.battle.status === 'lost';
    return {
      ...state,
      bossStarted: false,
      battle: null,
      hp: defeated ? state.maxHp : Math.max(0, Math.min(state.maxHp, action.hp)),
      mp: defeated ? state.maxMp : Math.max(0, Math.min(state.maxMp, action.mp)),
      oldBamboo: state.oldBamboo - action.bambooUsed,
    };
  }
  if (!Number.isSafeInteger(action.bambooUsed) || action.bambooUsed < 0 || action.bambooUsed > state.oldBamboo) throw new Error('Số bẫy đã dùng không hợp lệ.');
  if (!state.bossStarted || state.bossDefeated) throw new Error('Chưa đến lúc quyết định kết cục Chốt Chặn.');
  if (!state.battle || state.battle.status !== 'won'
    || action.hp !== state.battle.hp || action.mp !== state.battle.mp || action.bambooUsed !== state.battle.bambooUsed) {
    throw new Error('Chưa thắng trận hoặc dữ liệu kết trận không khớp.');
  }
  const inventory = { ...state.inventory };
  if (action.path === 'righteous') inventory[RIVER_QUEST_ITEMS.heroClothes] = 1;
  else inventory[RIVER_QUEST_ITEMS.darkSword] = 1;
  return action.path === 'righteous'
    ? {
        ...state, bossStarted: false, battle: null, bossDefeated: true, worldMapUnlocked: true, worldMapEntry: 'righteous', outfitReward: 'Mê Linh Hiệp Sĩ', hp: Math.max(0, Math.min(state.maxHp, action.hp)),
        mp: Math.max(0, Math.min(state.maxMp, action.mp)), oldBamboo: state.oldBamboo - action.bambooUsed,
        morality: bounded(state.morality + 20),
        title: 'Mê Linh Hiệp Sĩ', inventory,
      }
    : {
        ...state, bossStarted: false, battle: null, bossDefeated: true, worldMapUnlocked: true, worldMapEntry: 'shadow', hp: Math.max(0, Math.min(state.maxHp, action.hp)),
        mp: Math.max(0, Math.min(state.maxMp, action.mp)), oldBamboo: state.oldBamboo - action.bambooUsed,
        evil: bounded(state.evil + 20), morality: state.morality,
        vanTien: state.vanTien + 200, title: 'U Minh Sát Thủ', inventory,
      };
}
