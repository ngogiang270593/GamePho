import { afterEach, describe, expect, it } from 'vitest';
import { defaultCharacterCustomization } from '../game/characterCustomization';
import { changeEquipment, initialInventory, startingCharacterInventory } from '../game/characterInventory';
import { startingCharacterArtwork } from '../game/startingCharacterArtwork';
import { STARTING_CHARACTERS, startingCharacterAppearance, startingCharacterImageAsset } from '../game/startingCharacters';
import { freshHistoryProfile, HISTORY_PROFILE_KEY, normalizeHistoryProfile, readHistoryProfile, saveHistoryProfile, trainHistorySkill } from './historyProfile';

afterEach(() => localStorage.clear());

describe('Sử Việt local character profile', () => {
  it('saves and restores equipped items, unlocked collectibles and facing', () => {
    const customization = defaultCharacterCustomization();
    customization.unlockedItems.push('mount-dragon');
    customization.equipped.mount = 'mount-dragon';
    customization.facing = 'three-quarter';
    saveHistoryProfile({ ...freshHistoryProfile(), displayName: 'Út Mận', customization });

    expect(readHistoryProfile()).toMatchObject({
      displayName: 'Út Mận',
      customization: {
        unlockedItems: expect.arrayContaining(['mount-dragon']),
        equipped: expect.objectContaining({ mount: 'mount-dragon' }),
        facing: 'three-quarter',
      },
    });
  });

  it('loads older saved profiles and supplies the starter wardrobe', () => {
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({
      displayName: 'Bảy',
      appearance: freshHistoryProfile().appearance,
    }));

    const profile = readHistoryProfile();
    expect(profile.displayName).toBe('Bảy');
    expect(profile.customization.inventory?.ownedItems).toEqual(profile.customization.inventory?.defaultItems);
    expect(profile.customization.inventory?.ownedItems).toContain(profile.customization.equipped.hair);
    expect(profile.customization.inventory?.ownedItems).not.toContain('wings-light');
  });

  it('trains a chosen character skill up to, but never beyond, 100', () => {
    const profile = {
      ...freshHistoryProfile(),
      startingCharacterId: 'village-apprentice' as const,
      startingSkills: { herbalism: 72, hunting: 55, stamina: 65, intellect: 99 },
    };

    const trained = trainHistorySkill(profile, 'herbalism');
    const capped = trainHistorySkill(profile, 'intellect');
    expect(trained.startingSkills?.herbalism).toBe(73);
    expect(capped.startingSkills?.intellect).toBe(100);
    expect(trainHistorySkill(capped, 'intellect')).toBe(capped);
  });

  it('persists only the expected artwork for the selected character and gender', () => {
    expect(startingCharacterImageAsset('forest-keeper', 'male')).toBe('forest-keeper/reference-base-male.png');
    expect(startingCharacterImageAsset('forest-keeper', 'female')).toBe('forest-keeper/reference-base-female.png');
    expect(startingCharacterImageAsset('field-worker', 'male')).toBe('farmer/male.png');
    expect(startingCharacterImageAsset('village-apprentice', 'male')).toBe('village-scholar/male.png');
    expect(startingCharacterArtwork('forest-keeper', 'male')).not.toBe(startingCharacterArtwork('forest-keeper', 'female'));
    const profile = {
      ...freshHistoryProfile(),
      appearance: { ...freshHistoryProfile().appearance, gender: 'male' as const },
      startingCharacterId: 'forest-keeper' as const,
      startingCharacterImage: startingCharacterImageAsset('forest-keeper', 'male'),
    };
    saveHistoryProfile(profile);
    expect(readHistoryProfile().startingCharacterImage).toBe('forest-keeper/reference-base-male.png');

    saveHistoryProfile({ ...profile, startingCharacterImage: 'untrusted/character.png' });
    expect(readHistoryProfile().startingCharacterImage).toBe('forest-keeper/reference-base-male.png');
  });

  it('upgrades an untouched old forest-keeper loadout while preserving later equipment choices', () => {
    const oldAppearance = { ...startingCharacterAppearance('forest-keeper', 'male'), outfit: 'baba' as const };
    const legacy = normalizeHistoryProfile({
      displayName: 'Bảy',
      appearance: oldAppearance,
      customization: initialInventory(oldAppearance),
      startingCharacterId: 'forest-keeper',
    });

    expect(legacy.appearance.outfit).toBe('forest');
    expect(legacy.customization.equipped).toMatchObject({
      clothes: 'clothes-forest-keeper',
      bottoms: 'bottoms-ranger',
      shoes: 'shoes-ranger-boots',
      hat: 'hat-forest-bandana',
    });
    expect(legacy.customization.inventory?.ownedItems).toEqual(expect.arrayContaining(STARTING_CHARACTERS[0].gear));

    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    const currentAppearance = startingCharacterAppearance(template.id, 'male');
    const customized = changeEquipment(
      startingCharacterInventory(currentAppearance, template),
      { ...startingCharacterInventory(currentAppearance, template).equipped, bottoms: 'bottoms-cotton' },
    );
    const restored = normalizeHistoryProfile({
      displayName: 'Bảy',
      appearance: currentAppearance,
      customization: customized,
      startingCharacterId: 'forest-keeper',
    });
    expect(restored.customization.equipped.bottoms).toBe('bottoms-cotton');
  });
});
