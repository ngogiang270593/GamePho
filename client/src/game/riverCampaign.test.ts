import { describe, expect, it } from 'vitest';
import {
  applyRiverCampaignAction,
  freshRiverBattleSnapshot,
  freshRiverCampaign,
  isRiverCampaignState,
  normalizeRiverCampaign,
} from './riverCampaign';

describe('Mê Linh river campaign', () => {
  const day = new Date(2026, 10, 4, 12);

  it('starts with the designed attributes, currency, and three daily action points', () => {
    expect(freshRiverCampaign(day)).toMatchObject({
      actionPoints: 3, vanTien: 50, hp: 600, maxHp: 600, mp: 300, maxMp: 300,
      morality: 50, evil: 0, timeMinutes: 360, motherAffinity: 50, motherStoveHelped: false, mainQuestActivated: false,
    });
  });

  it('advances the in-game clock and resets to morning after resting', () => {
    const evening = applyRiverCampaignAction({ ...freshRiverCampaign(day), timeMinutes: 1380 }, { type: 'wait-hour' }, null, day);
    expect(evening.timeMinutes).toBe(0);
    const rested = applyRiverCampaignAction({ ...evening, actionPoints: 0 }, { type: 'rest-at-dock' }, null, day);
    expect(rested).toMatchObject({ timeMinutes: 360, actionPoints: 3 });
  });

  it('limits stove help to noon and rewards affinity once per day', () => {
    const noon = { ...freshRiverCampaign(day), timeMinutes: 660 };
    const helped = applyRiverCampaignAction(noon, { type: 'mother-stove-help' }, null, day);
    expect(helped).toMatchObject({ actionPoints: 2, motherAffinity: 60, motherStoveHelped: true });
    expect(() => applyRiverCampaignAction(helped, { type: 'mother-stove-help' }, null, day)).toThrow('đã giúp');
    expect(() => applyRiverCampaignAction({ ...noon, timeMinutes: 840 }, { type: 'mother-stove-help' }, null, day)).toThrow('buổi trưa');
  });

  it('migrates completed legacy choices into the awakened quest and fishing unlocks', () => {
    expect(normalizeRiverCampaign({ motherChoice: 'shadow', fishChoice: 'righteous' }, day))
      .toMatchObject({ mainQuestActivated: true, crossbowUnlocked: true, fishingXp: 1, fishCaught: 1 });
  });

  it('persists and rewards the herbalist quest through gathering and hand-in', () => {
    let state = freshRiverCampaign(day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'herbalist-lang', action: 'accept' }, null, day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'herbalist-lang', action: 'gather-herb' }, null, day);
    expect(state).toMatchObject({ actionPoints: 1, npcQuestStages: { 'herbalist-lang': 2 }, inventory: { ITEM_XUYEN_KHUNG: 1 } });
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'herbalist-lang', action: 'deliver-herb' }, null, day);
    expect(state).toMatchObject({ actionPoints: 0, npcQuestStages: { 'herbalist-lang': 3 }, maxHp: 650, hp: 650, poisonRecipeUnlocked: true });
    expect(state.inventory.ITEM_XUYEN_KHUNG).toBeUndefined();
    expect(isRiverCampaignState(normalizeRiverCampaign(state, day))).toBe(true);
    expect(() => applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'herbalist-lang', action: 'deliver-herb' }, null, day)).toThrow('chưa đến bước');
    const poisonSupplies = applyRiverCampaignAction({ ...state, actionPoints: 1 }, { type: 'buy-poison-supplies' }, null, day);
    expect(poisonSupplies).toMatchObject({ evil: 0, poisonSupplies: 1, vanTien: 25 });
  });

  it('applies merchant prices, restores AP, and persists the purchased patrol rumor', () => {
    let state = { ...freshRiverCampaign(day), actionPoints: 1 };
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'inn-server', action: 'buy-meal' }, null, day);
    expect(state).toMatchObject({ actionPoints: 2, vanTien: 40 });
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'inn-server', action: 'buy-rumor' }, null, day);
    expect(state).toMatchObject({ actionPoints: 1, vanTien: 35, patrolMap: true, npcQuestStages: { 'inn-server': 1 } });
    expect(state.inventory.ITEM_BAN_DO_TUAN_TRA).toBe(1);
    expect(() => applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'inn-server', action: 'buy-rumor' }, null, day)).toThrow('đã nghe tin đồn');
  });

  it('lets fruit restore inner force or raise a female villager affinity', () => {
    let state = applyRiverCampaignAction({ ...freshRiverCampaign(day), mp: 100 }, {
      type: 'opening-npc-action', npcId: 'fruit-aunt-tu', action: 'buy-fruit',
    }, null, day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'fruit-aunt-tu', action: 'eat-fruit' }, null, day);
    expect(state).toMatchObject({ mp: 175, actionPoints: 2, inventory: {} });

    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'fruit-aunt-tu', action: 'buy-fruit' }, null, day);
    state = applyRiverCampaignAction(state, {
      type: 'opening-npc-action', npcId: 'fruit-aunt-tu', action: 'give-fruit', recipient: 'woman-general',
    }, null, day);
    expect(state).toMatchObject({ npcAffinities: { 'woman-general': 60 }, martialAffinity: 60, actionPoints: 0 });
    expect(state.inventory.ITEM_TRAI_CAY).toBeUndefined();
  });

  it('unlocks Lệ Nương’s story choice and saves either intel branch', () => {
    let shared = applyRiverCampaignAction(freshRiverCampaign(day), {
      type: 'opening-npc-action', npcId: 'singer-le-nuong', action: 'buy-intel',
    }, null, day);
    expect(shared).toMatchObject({ charismaBonus: 5, vanTien: 35, npcQuestStages: { 'singer-le-nuong': 3 } });
    shared = applyRiverCampaignAction(shared, {
      type: 'opening-npc-action', npcId: 'singer-le-nuong', action: 'share-intel',
    }, null, day);
    expect(shared).toMatchObject({ morality: 55, npcQuestStages: { 'singer-le-nuong': 4 }, inventory: { ITEM_TIN_DA_CHIA_SE: 1 } });
    expect(shared.inventory.ITEM_TIN_BIEN_AI).toBeUndefined();

    let kept = applyRiverCampaignAction(freshRiverCampaign(day), {
      type: 'opening-npc-action', npcId: 'singer-le-nuong', action: 'buy-intel',
    }, null, day);
    kept = applyRiverCampaignAction(kept, {
      type: 'opening-npc-action', npcId: 'singer-le-nuong', action: 'keep-intel',
    }, null, day);
    expect(kept).toMatchObject({ evil: 5, npcQuestStages: { 'singer-le-nuong': 5 }, inventory: { ITEM_TIN_BIEN_AI: 1 } });
  });

  it('rewards side-quest completion while validating required items and stage', () => {
    const fresh = freshRiverCampaign(day);
    expect(() => applyRiverCampaignAction(fresh, { type: 'opening-npc-action', npcId: 'beggar-hac-lao', action: 'give-offering' }, null, day)).toThrow('Không có vật phẩm');
    let state = applyRiverCampaignAction({ ...fresh, ironOre: 2 }, { type: 'opening-npc-action', npcId: 'smith-thiet-chuy', action: 'accept' }, null, day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'smith-thiet-chuy', action: 'finish-forging-quest' }, null, day);
    expect(state).toMatchObject({ ironOre: 0, weaponUpgradeLevel: 1, npcQuestStages: { 'smith-thiet-chuy': 3 } });
    state = applyRiverCampaignAction(fresh, { type: 'opening-npc-action', npcId: 'village-captain', action: 'accept' }, null, day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'village-captain', action: 'clear-bandits' }, null, day);
    expect(state).toMatchObject({ morality: 60, banditArmorUnlocked: true, inventory: { CLOTHES_GIAP_DANH_BINH: 1 } });
  });

  it('completes the remaining side quests and updates their rewards', () => {
    let state = freshRiverCampaign(day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'woodcutter', action: 'accept' }, null, day);
    state = applyRiverCampaignAction(state, { type: 'opening-npc-action', npcId: 'woodcutter', action: 'clear-wolves' }, null, day);
    expect(state).toMatchObject({
      actionPoints: 1,
      npcQuestStages: { woodcutter: 3 },
      inventory: { ITEM_GO_QUY: 3 },
      oldBamboo: 3,
      trapRecipe: true,
    });

    state = applyRiverCampaignAction(freshRiverCampaign(day), {
      type: 'opening-npc-action', npcId: 'toy-seller', action: 'buy-toy',
    }, null, day);
    expect(state).toMatchObject({
      actionPoints: 2,
      vanTien: 35,
      insightBonus: 5,
      luckBonus: 5,
      npcQuestStages: { 'toy-seller': 3 },
      inventory: { ITEM_TO_HE: 1 },
    });

    state = applyRiverCampaignAction({
      ...freshRiverCampaign(day),
      inventory: { ITEM_BANH_BAO: 1, ITEM_RUOU_NEP: 1 },
    }, { type: 'opening-npc-action', npcId: 'beggar-hac-lao', action: 'give-offering' }, null, day);
    expect(state).toMatchObject({
      actionPoints: 2,
      npcQuestStages: { 'beggar-hac-lao': 3 },
      inventory: { SKILL_DA_NGUU_BAI_TUONG: 1 },
    });
    expect(state.inventory.ITEM_BANH_BAO).toBeUndefined();
    expect(state.inventory.ITEM_RUOU_NEP).toBeUndefined();

    state = applyRiverCampaignAction(freshRiverCampaign(day), {
      type: 'opening-npc-action', npcId: 'herdboy-a-sang', action: 'reveal-shortcut',
    }, null, day);
    expect(state).toMatchObject({
      shortcutHintUnlocked: true,
      fastTravel: true,
      npcQuestStages: { 'herdboy-a-sang': 3 },
      inventory: { ITEM_SO_DO_DUONG_TAT: 1 },
    });
  });

  it('buys both inn offerings with their listed prices and action costs', () => {
    let state = freshRiverCampaign(day);
    state = applyRiverCampaignAction(state, {
      type: 'opening-npc-action', npcId: 'inn-server', action: 'buy-bun',
    }, null, day);
    state = applyRiverCampaignAction(state, {
      type: 'opening-npc-action', npcId: 'inn-server', action: 'buy-wine',
    }, null, day);
    expect(state).toMatchObject({
      actionPoints: 1,
      vanTien: 35,
      inventory: { ITEM_BANH_BAO: 1, ITEM_RUOU_NEP: 1 },
    });
  });

  it('only equips Hà Bá Tức Công after reaching the virtue threshold', () => {
    const righteous = applyRiverCampaignAction(
      { ...freshRiverCampaign(day), morality: 60 },
      { type: 'equip-ha-ba', equipped: true },
      null,
      day,
    );
    expect(righteous.haBaEquipped).toBe(true);
    expect(() => applyRiverCampaignAction(freshRiverCampaign(day), { type: 'equip-ha-ba', equipped: true }, null, day))
      .toThrow('Đạo Đức ít nhất 60');
  });

  it('creates the combatants and 650/350 combat resources at the specified 6x6 coordinates', () => {
    expect(freshRiverBattleSnapshot(freshRiverCampaign(day))).toMatchObject({
      hero: { x: .45, y: 2.5 },
      soldiers: [
        { id: 'spear-1', position: { x: 3.3, y: 2.35 }, hp: 200 },
        { id: 'spear-2', position: { x: 3.3, y: 2.65 }, hp: 200 },
      ],
      boss: { x: 4.7, y: 2.5 },
      hp: 650, maxHp: 650, mp: 350, maxMp: 350, bossHp: 850,
    });
  });

  it('applies the mother quest choice on first map load and unlocks fast travel only on the righteous path', () => {
    const asleep = freshRiverCampaign(day);
    expect(() => applyRiverCampaignAction(asleep, { type: 'mother-main', path: 'righteous' }, null, day)).toThrow('thức dậy');
    const awake = applyRiverCampaignAction(asleep, { type: 'activate-main-quest' }, null, day);
    expect(awake.mainQuestActivated).toBe(true);
    const righteous = applyRiverCampaignAction(awake, { type: 'mother-main', path: 'righteous' }, null, day);
    expect(righteous).toMatchObject({ actionPoints: 2, morality: 60, vanTien: 50, fastTravel: true });
    expect(() => applyRiverCampaignAction(righteous, { type: 'mother-main', path: 'shadow' }, null, day)).toThrow('đã nhận chiếc nhẫn');
    const shadow = applyRiverCampaignAction(awake, { type: 'mother-main', path: 'shadow' }, null, day);
    expect(shadow).toMatchObject({ morality: 35, evil: 10, vanTien: 150, fastTravel: false, motherAffinity: 20 });
  });

  it('requires low inner force to collect water, then awards max health when returning it', () => {
    const tired = { ...freshRiverCampaign(day), mp: 100, hp: 240 };
    expect(() => applyRiverCampaignAction(tired, { type: 'mother-water' }, null, day)).not.toThrow();
    const carrying = applyRiverCampaignAction(tired, { type: 'mother-water' }, null, day);
    expect(carrying).toMatchObject({ actionPoints: 2, hp: 240, mp: 100, waterItemCarried: true, waterQuestComplete: false });
    expect(() => applyRiverCampaignAction(freshRiverCampaign(day), { type: 'mother-water' }, null, day)).toThrow('Nội Lực dưới 40%');
    const healed = applyRiverCampaignAction(carrying, { type: 'mother-water-return' }, null, day);
    expect(healed).toMatchObject({ actionPoints: 1, hp: 290, maxHp: 650, waterQuestComplete: true, waterItemCarried: false });
    expect(() => applyRiverCampaignAction(healed, { type: 'mother-water' }, null, day)).toThrow('đã hoàn thành');
    const outOfPoints = { ...healed, actionPoints: 0 };
    expect(() => applyRiverCampaignAction(outOfPoints, { type: 'tao-fish', path: 'righteous' }, null, day)).toThrow('hết 3 điểm hoạt động');
  });

  it('awards Tảo materials, including the hunter talent bonus', () => {
    const normal = applyRiverCampaignAction(freshRiverCampaign(day), { type: 'tao-fish', path: 'righteous' }, null, day);
    const hunter = applyRiverCampaignAction(freshRiverCampaign(day), { type: 'tao-fish', path: 'shadow' }, 'forest-and-tide', day);
    expect(normal).toMatchObject({ actionPoints: 2, morality: 50, trapRecipe: false, oldBamboo: 0 });
    expect(normal).toMatchObject({ fishingXp: 1, fishCaught: 1, fishStock: 3, crossbowUnlocked: true, fishChoice: null });
    expect(normal.inventory.ITEM_CA_COC_SONG_DAY).toBe(3);
    expect(() => applyRiverCampaignAction(freshRiverCampaign(day), {
      type: 'tao-handoff', villagerId: 'NPC_DAN_NONG_01',
    }, null, day)).toThrow('Cần có Cá Cóc');
    expect(hunter).toMatchObject({ evil: 10, vanTien: 130, trapRecipe: true, oldBamboo: 6 });
  });

  it('levels fishing, consumes purchased bait, and unlocks a permanent meal at level two', () => {
    let state = applyRiverCampaignAction(freshRiverCampaign(day), { type: 'tao-fish', path: 'righteous' }, null, day);
    for (const villagerId of ['NPC_DAN_NONG_01', 'NPC_DAN_NONG_02', 'NPC_DAN_NONG_03'] as const) {
      state = applyRiverCampaignAction({ ...state, actionPoints: 3 }, { type: 'tao-handoff', villagerId }, null, day);
    }
    expect(state).toMatchObject({ fishChoice: 'righteous', morality: 65, trapRecipe: true, fishStock: 0 });
    state = applyRiverCampaignAction(state, { type: 'buy-bait' }, null, day);
    state = applyRiverCampaignAction({ ...state, actionPoints: 3 }, { type: 'fish-again' }, null, day);
    expect(state).toMatchObject({ fishingXp: 2, fishCaught: 2, baitCount: 2, fishStock: 1 });
    state = applyRiverCampaignAction({ ...state, actionPoints: 3 }, { type: 'fish-again' }, null, day);
    expect(state).toMatchObject({ fishingXp: 3, fishStock: 2 });
    expect(applyRiverCampaignAction({ ...state, actionPoints: 1 }, { type: 'cook-river-meal' }, null, day))
      .toMatchObject({ riverMealCooked: true, fishStock: 1, maxHp: 625, hp: 625, actionPoints: 0 });
  });

  it('unlocks premium bait at fishing level two and sells spare fish to Giao', () => {
    const levelTwo = { ...freshRiverCampaign(day), fishChoice: 'righteous' as const, fishingXp: 3, fishCaught: 3, vanTien: 50 };
    const supplied = applyRiverCampaignAction(levelTwo, { type: 'buy-premium-bait' }, null, day);
    expect(supplied).toMatchObject({ premiumBaitCount: 3, vanTien: 25, actionPoints: 2 });
    const caught = applyRiverCampaignAction(supplied, { type: 'fish-again', bait: 'premium' }, null, day);
    expect(caught).toMatchObject({ premiumBaitCount: 2, fishStock: 1, fishCaught: 4, fishingXp: 4 });
    expect(applyRiverCampaignAction(caught, { type: 'sell-fish' }, null, day)).toMatchObject({ fishStock: 0, vanTien: 45 });
    expect(() => applyRiverCampaignAction({ ...levelTwo, fishingXp: 0 }, { type: 'buy-premium-bait' }, null, day)).toThrow('cấp 2');
  });

  it('requires alignment and supplies before buying poison and coating the dagger', () => {
    const state = { ...freshRiverCampaign(day), evil: 50 };
    const supplies = applyRiverCampaignAction(state, { type: 'buy-poison-supplies' }, null, day);
    expect(supplies).toMatchObject({ vanTien: 25, poisonSupplies: 1 });
    const coated = applyRiverCampaignAction(supplies, { type: 'coat-dagger' }, null, day);
    expect(coated).toMatchObject({ poisonSupplies: 0, daggerPoisoned: true });
    expect(() => applyRiverCampaignAction(freshRiverCampaign(day), { type: 'buy-poison-supplies' }, null, day)).toThrow('Tà Khí');
  });

  it('requires ore and coin before upgrading the dagger and persists a fishing-battle poison charge', () => {
    const ready = { ...freshRiverCampaign(day), ironOre: 2, timeMinutes: 720 };
    const forged = applyRiverCampaignAction(ready, { type: 'forge-dagger' }, null, day);
    expect(forged).toMatchObject({ ironOre: 0, vanTien: 30, daggerForged: true, actionPoints: 2 });
    const poisonReady = { ...forged, bossStarted: true, daggerPoisoned: true };
    const battle = { ...freshRiverBattleSnapshot(poisonReady), poisonUsed: true, bossPoisonTurns: 3 };
    expect(applyRiverCampaignAction(poisonReady, { type: 'boss-progress', battle }, null, day).daggerPoisoned).toBe(false);
  });

  it('lets Tiểu Mông rest at the riverside homestead to recover for another day', () => {
    const tired = {
      ...freshRiverCampaign(day),
      actionPoints: 0,
      hp: 240,
      mp: 80,
    };
    const rested = applyRiverCampaignAction(tired, { type: 'rest-at-dock' }, null, day);
    expect(rested).toMatchObject({ actionPoints: 3, hp: 600, maxHp: 600, mp: 300, maxMp: 300 });
    expect(() => applyRiverCampaignAction({
      ...tired,
      battle: { ...freshRiverBattleSnapshot(tired), status: 'playing' },
    }, { type: 'rest-at-dock' }, null, day)).toThrow('Không thể nghỉ khi đang trong trận chiến.');
  });

  it('applies market prices and enforces the boss preparation and alignment requirements', () => {
    const start = { ...freshRiverCampaign(day), timeMinutes: 840 };
    expect(() => applyRiverCampaignAction(start, { type: 'market-choice', path: 'righteous' }, null, day)).not.toThrow();
    expect(applyRiverCampaignAction(start, { type: 'market-choice', path: 'righteous' }, null, day))
      .toMatchObject({ vanTien: 20, morality: 70, patrolMap: true });
    expect(applyRiverCampaignAction(start, { type: 'market-choice', path: 'shadow' }, null, day))
      .toMatchObject({ vanTien: 50, morality: 0, evil: 40 });
    const ready = {
      ...start, actionPoints: 1, trapRecipe: true, knowsDaoManual: true,
      morality: 60, evil: 50,
    };
    const begun = applyRiverCampaignAction(ready, { type: 'start-boss' }, null, day);
    expect(begun).toMatchObject({ actionPoints: 1, bossStarted: true });
    expect(() => applyRiverCampaignAction({ ...begun, morality: 59 }, {
      type: 'boss-victory', path: 'righteous', hp: 500, mp: 200, bambooUsed: 0,
    }, null, day)).toThrow('Chưa thắng trận');
  });

  it('only allows smithing at noon and sparring in the evening', () => {
    const start = freshRiverCampaign(day);
    const readyToForge = { ...start, ironOre: 2, timeMinutes: 660 };
    expect(() => applyRiverCampaignAction(readyToForge, { type: 'forge-dagger' }, null, day)).not.toThrow();
    expect(() => applyRiverCampaignAction({ ...readyToForge, timeMinutes: 840 }, { type: 'forge-dagger' }, null, day))
      .toThrow('buổi trưa');
    expect(() => applyRiverCampaignAction(start, { type: 'martial-spar', path: 'righteous' }, null, day))
      .toThrow('buổi tối');
    expect(() => applyRiverCampaignAction({ ...start, timeMinutes: 840 }, { type: 'martial-spar', path: 'righteous' }, null, day))
      .not.toThrow();
  });

  it('stores the chosen map ending and safely refreshes action points on the next local day', () => {
    const ready = {
      ...freshRiverCampaign(day), actionPoints: 0, bossStarted: true,
      trapRecipe: true, knowsDaoManual: true, morality: 60, oldBamboo: 3,
    };
    const battle = {
      ...freshRiverBattleSnapshot(ready),
      status: 'won' as const,
      bossHp: 0,
      hp: 480,
      mp: 210,
      bambooUsed: 1,
    };
    const prepared = { ...ready, battle };
    const ending = applyRiverCampaignAction(prepared, {
      type: 'boss-victory', path: 'righteous', hp: 480, mp: 210, bambooUsed: 1,
    }, null, day);
    expect(ending).toMatchObject({
      actionPoints: 0, bossDefeated: true, bossStarted: false, worldMapUnlocked: true, worldMapEntry: 'righteous',
      outfitReward: 'Mê Linh Hiệp Sĩ', title: 'Mê Linh Hiệp Sĩ',
      hp: 480, mp: 210, oldBamboo: 2, morality: 80,
    });
    const tomorrow = new Date(2026, 10, 5, 0, 1);
    expect(normalizeRiverCampaign({ ...ending, timeMinutes: 900, motherStoveHelped: true }, tomorrow))
      .toMatchObject({ actionPoints: 3, timeMinutes: 360, motherStoveHelped: false, bossDefeated: true, vanTien: 50 });
  });

  it('records the dark ending and unlocks its own World Map entry without an alignment gate', () => {
    const state = { ...freshRiverCampaign(day), bossStarted: true, battle: {
      ...freshRiverBattleSnapshot(freshRiverCampaign(day)), status: 'won' as const, bossHp: 0,
    } };
    const ending = applyRiverCampaignAction(state, {
      type: 'boss-victory', path: 'shadow', hp: state.battle.hp, mp: state.battle.mp, bambooUsed: 0,
    }, null, day);
    expect(ending).toMatchObject({
      bossDefeated: true, worldMapUnlocked: true, worldMapEntry: 'shadow',
      title: 'U Minh Sát Thủ', vanTien: 250, evil: 20,
      inventory: { WEAPON_DONG_HAN_SWORD: 1 },
    });
  });
});
