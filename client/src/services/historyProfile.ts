import { DEFAULT_APPEARANCE, normalizeAppearance, type CharacterAppearance } from '../game/character';
import { CHARACTER_ITEMS, defaultCharacterCustomization, normalizeCharacterCustomization, type CharacterCustomization } from '../game/characterCustomization';
import {initialInventory,migrateInventory} from '../game/characterInventory';
import { STARTING_CHARACTERS, startingCharacterImageAsset, type StartingCharacterId, type StartingSkillId, type StartingSkills } from '../game/startingCharacters';

export const HISTORY_PROFILE_KEY = 'su-viet-hanh-trinh-character-v1';

export interface HistoryProfile {
  displayName: string;
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: StartingCharacterId;
  startingCharacterImage?: string;
  startingSkills?: StartingSkills;
  developmentPath?: string;
}

export function freshHistoryProfile(): HistoryProfile {
  return { displayName: '', appearance: { ...DEFAULT_APPEARANCE }, customization: initialInventory() };
}

export function readHistoryProfile(): HistoryProfile {
  const raw = localStorage.getItem(HISTORY_PROFILE_KEY);
  if (!raw) return freshHistoryProfile();
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('Không đọc được hồ sơ nhân vật Sử Việt trên thiết bị.'); }
  if (!value || typeof value !== 'object') {
    throw new Error('Hồ sơ nhân vật Sử Việt không hợp lệ.');
  }
  const profile = value as Record<string, unknown>;
  if (typeof profile.displayName !== 'string') throw new Error('Hồ sơ nhân vật Sử Việt không hợp lệ.');
  return normalizeHistoryProfile(profile);
}

export function normalizeHistoryProfile(profile:Partial<HistoryProfile>):HistoryProfile {
  let appearance=normalizeAppearance(profile.appearance);
  let startingCharacterId = profile.startingCharacterId === 'forest-keeper'
    || profile.startingCharacterId === 'field-worker'
    || profile.startingCharacterId === 'village-apprentice'
    ? profile.startingCharacterId : undefined;
  let customization=migrateInventory(profile.customization,appearance);
  // Older saves stored only the appearance. Recover the forest-keeper identity
  // from its distinctive starter outfit so the map can select the matching
  // directional action atlas without requiring the player to recreate a save.
  if (!startingCharacterId && appearance.outfit === 'forest') startingCharacterId = 'forest-keeper';
  if(startingCharacterId==='forest-keeper'&&customization.inventory){
    const template=STARTING_CHARACTERS.find(item=>item.id===startingCharacterId)!;
    const upgradeLegacyLook=!customization.inventory.defaultItems.includes('bottoms-ranger');
    const equipment={...customization.equipped};
    const inventory={...customization.inventory,ownedItems:[...customization.inventory.ownedItems],defaultItems:[...customization.inventory.defaultItems],receivedAt:{...customization.inventory.receivedAt}};
    for(const id of template.gear){
      if(!inventory.ownedItems.includes(id))inventory.ownedItems.push(id);
      if(!inventory.defaultItems.includes(id))inventory.defaultItems.push(id);
      inventory.receivedAt[id]??=0;
    }
    if(upgradeLegacyLook){
      if(appearance.outfit==='baba'&&equipment.clothes==='clothes-baba'){
        appearance={...appearance,outfit:'forest'};
        equipment.clothes='clothes-forest-keeper';
      }
      if(equipment.bottoms==='bottoms-cotton')equipment.bottoms='bottoms-ranger';
      if(equipment.shoes==='shoes-sandals')equipment.shoes='shoes-ranger-boots';
      const wornHat=CHARACTER_ITEMS.find(item=>item.id===equipment.hat);
      if(!equipment.hat||wornHat?.appearanceValue==='khandong'){
        equipment.hat='hat-forest-bandana';
        appearance={...appearance,accessory:'none'};
      }
    }
    inventory.equippedItems={...equipment};
    customization=normalizeCharacterCustomization({...customization,equipped:equipment,inventory});
  }
  const skills = profile.startingSkills;
  return {
    displayName: typeof profile.displayName==='string'?profile.displayName.trim().slice(0,24):'',
    appearance,
    customization,
    ...(startingCharacterId ? { startingCharacterId } : {}),
    ...(startingCharacterId
      ? { startingCharacterImage: startingCharacterImageAsset(startingCharacterId, appearance.gender) } : {}),
    ...(startingCharacterId && skills
      && Number.isInteger(skills.herbalism) && skills.herbalism >= 50 && skills.herbalism <= 100
      && Number.isInteger(skills.hunting) && skills.hunting >= 50 && skills.hunting <= 100
      && Number.isInteger(skills.stamina) && skills.stamina >= 50 && skills.stamina <= 100
      && Number.isInteger(skills.intellect) && skills.intellect >= 50 && skills.intellect <= 100
      ? { startingSkills: { ...skills } } : {}),
    ...(startingCharacterId && typeof profile.developmentPath === 'string'
      ? { developmentPath: profile.developmentPath.slice(0, 100) } : {}),
  };
}

export function trainHistorySkill(profile: HistoryProfile, skill: StartingSkillId): HistoryProfile {
  const skills = profile.startingSkills;
  if (!profile.startingCharacterId || !skills || skills[skill] >= 100) return profile;
  return {
    ...profile,
    startingSkills: { ...skills, [skill]: skills[skill] + 1 },
  };
}

export function saveHistoryProfile(profile: HistoryProfile): void {
  localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify(normalizeHistoryProfile(profile)));
  localStorage.setItem('su-viet-hanh-trinh-saved-at', new Date().toISOString());
  window.setTimeout(() => window.dispatchEvent(new Event('xnl-history-save')), 0);
}
