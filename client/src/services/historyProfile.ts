import { DEFAULT_APPEARANCE, normalizeAppearance, type CharacterAppearance } from '../game/character';
import { normalizeCharacterCustomization, type CharacterCustomization } from '../game/characterCustomization';
import { migrateInventory, startingCharacterInventory } from '../game/characterInventory';
import { STARTING_CHARACTERS, startingCharacterAppearance, startingCharacterImageAsset, type PlayableCharacterId } from '../game/startingCharacters';
import { normalizeHeroDevelopment, type HeroDevelopment } from '../game/heroDevelopment';

export const HISTORY_PROFILE_KEY = 'su-viet-hanh-trinh-character-v1';

export interface HistoryProfile {
  displayName: string;
  appearance: CharacterAppearance;
  customization: CharacterCustomization;
  startingCharacterId?: PlayableCharacterId;
  startingCharacterImage?: string;
  heroDevelopment: HeroDevelopment;
}

export function freshHistoryProfile(): HistoryProfile {
  const appearance = startingCharacterAppearance('forest-keeper', DEFAULT_APPEARANCE.gender);
  return {
    displayName: '',
    appearance,
    customization: startingCharacterInventory(appearance, STARTING_CHARACTERS[0], 0),
    startingCharacterId: 'forest-keeper',
    startingCharacterImage: startingCharacterImageAsset('forest-keeper', appearance.gender),
    heroDevelopment: { talent: null, alignmentGoal: null },
  };
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
  const normalized = normalizeHistoryProfile(profile);
  const normalizedRaw = JSON.stringify(normalized);
  if (normalizedRaw !== raw) localStorage.setItem(HISTORY_PROFILE_KEY, normalizedRaw);
  return normalized;
}

export function normalizeHistoryProfile(profile:Partial<HistoryProfile>):HistoryProfile {
  const previousAppearance = normalizeAppearance(profile.appearance);
  const appearance = startingCharacterAppearance('forest-keeper', previousAppearance.gender);
  const starter = startingCharacterInventory(appearance, STARTING_CHARACTERS[0], 0);
  const previous = migrateInventory(profile.customization, previousAppearance);
  const inventory = previous.inventory!;
  const replaceLegacyLook = profile.startingCharacterId !== 'forest-keeper'
    || previousAppearance.outfit !== 'forest'
    || !inventory.defaultItems.includes('bottoms-ranger');
  const equippedItems = replaceLegacyLook
    ? { ...previous.equipped, ...starter.equipped }
    : { ...previous.equipped };
  const ownedItems = [...new Set([...inventory.ownedItems, ...starter.inventory!.ownedItems])];
  const receivedAt = { ...inventory.receivedAt };
  for (const id of ownedItems) receivedAt[id] ??= 0;
  const customization = normalizeCharacterCustomization({
    facing: previous.facing,
    inventory: {
      ...inventory,
      ownedItems,
      defaultItems: [...new Set([...inventory.defaultItems, ...starter.inventory!.defaultItems])],
      equippedItems,
      receivedAt,
    },
  });
  return {
    displayName: typeof profile.displayName==='string'?profile.displayName.trim().slice(0,24):'',
    appearance,
    customization,
    startingCharacterId: 'forest-keeper',
    startingCharacterImage: startingCharacterImageAsset('forest-keeper', appearance.gender),
    heroDevelopment: normalizeHeroDevelopment(profile.heroDevelopment),
  };
}

export function saveHistoryProfile(profile: HistoryProfile): void {
  localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify(normalizeHistoryProfile(profile)));
  localStorage.setItem('su-viet-hanh-trinh-saved-at', new Date().toISOString());
  window.setTimeout(() => window.dispatchEvent(new Event('xnl-history-save')), 0);
}
