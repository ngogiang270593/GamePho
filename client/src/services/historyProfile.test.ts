import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCES } from '../game/character';
import { defaultCharacterCustomization } from '../game/characterCustomization';
import { changeEquipment, initialInventory, startingCharacterInventory } from '../game/characterInventory';
import { startingCharacterArtwork } from '../game/startingCharacterArtwork';
import { STARTING_CHARACTERS, startingCharacterAppearance, startingCharacterImageAsset } from '../game/startingCharacters';
import { freshHistoryProfile, HISTORY_PROFILE_KEY, normalizeHistoryProfile, readHistoryProfile, saveHistoryProfile } from './historyProfile';

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

  it('starts the main character with the forest appearance and starter equipment', () => {
    const profile = freshHistoryProfile();
    expect(profile).toMatchObject({
      displayName: '',
      startingCharacterId: 'forest-keeper',
      startingCharacterImage: 'forest-keeper/reference-base-female.png',
      appearance: startingCharacterAppearance('forest-keeper', 'female'),
      customization: {
        equipped: {
          clothes: 'clothes-forest-keeper', bottoms: 'bottoms-ranger',
          shoes: 'shoes-ranger-boots', hat: 'hat-forest-bandana',
          back: 'back-basket', front: 'front-herb-knife',
        },
      },
    });
    expect(readHistoryProfile()).toEqual(profile);
    expect(profile).not.toHaveProperty('startingSkills');
    expect(profile).not.toHaveProperty('developmentPath');
    expect(profile.heroDevelopment).toEqual({ talent: null, alignmentGoal: null });
  });

  it('persists and normalizes Tiểu Mông talent and alignment choices', () => {
    const profile = {
      ...freshHistoryProfile(),
      displayName: 'Tiểu Mông',
      heroDevelopment: { talent: 'forest-and-tide' as const, alignmentGoal: 'shadow' as const },
    };
    saveHistoryProfile(profile);
    expect(readHistoryProfile().heroDevelopment).toEqual(profile.heroDevelopment);

    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({
      ...profile,
      heroDevelopment: { talent: 'unknown', alignmentGoal: 'unknown' },
    }));
    const normalized = readHistoryProfile();
    expect(normalized.heroDevelopment).toEqual({ talent: null, alignmentGoal: null });
  });

  it.each(['field-worker', 'village-apprentice'] as const)('migrates an old %s profile without losing inventory purchases or unrelated saves', id => {
    const appearance = DEFAULT_APPEARANCES.male;
    const customization = initialInventory(appearance, 123);
    customization.inventory!.ownedItems.push('mount-dragon');
    customization.inventory!.purchasedItems.push('mount-dragon');
    customization.inventory!.receivedAt['mount-dragon'] = 456;
    customization.inventory!.equippedItems.mount = 'mount-dragon';
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({
      displayName: 'Anh Ba', appearance, customization, startingCharacterId: id,
      startingCharacterImage: 'obsolete/character.png',
      startingSkills: { herbalism: 72, hunting: 55, stamina: 65, intellect: 99 },
      developmentPath: 'Lựa chọn nhân vật cũ',
    }));
    localStorage.setItem('opening-map-player-position-watercolor', '{"x":700,"y":640}');
    localStorage.setItem('su-viet-hanh-trinh-progress-v1', '{"gold":500}');

    const restored = readHistoryProfile();
    expect(restored).toMatchObject({
      displayName: 'Anh Ba',
      appearance: startingCharacterAppearance('forest-keeper', 'male'),
      startingCharacterId: 'forest-keeper',
      startingCharacterImage: 'forest-keeper/reference-base-male.png',
      customization: {
        equipped: {
          clothes: 'clothes-forest-keeper', bottoms: 'bottoms-ranger',
          shoes: 'shoes-ranger-boots', hat: 'hat-forest-bandana',
          front: 'front-herb-knife', mount: 'mount-dragon',
        },
        inventory: { purchasedItems: ['mount-dragon'], receivedAt: { 'mount-dragon': 456 } },
      },
    });
    expect(restored).not.toHaveProperty('startingSkills');
    expect(restored).not.toHaveProperty('developmentPath');
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!)).toEqual(restored);
    expect(localStorage.getItem('opening-map-player-position-watercolor')).toBe('{"x":700,"y":640}');
    expect(localStorage.getItem('su-viet-hanh-trinh-progress-v1')).toBe('{"gold":500}');
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
