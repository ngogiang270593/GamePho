import { describe, expect, it } from 'vitest';
import {
  CHARACTER_CATEGORIES,
  CHARACTER_ITEMS,
  defaultCharacterCustomization,
  normalizeCharacterCustomization,
} from './characterCustomization';

describe('2D character customization catalog', () => {
  it('provides both base characters and the required starter item ranges', () => {
    const categories = new Map(CHARACTER_ITEMS.map(item => [item.category, CHARACTER_ITEMS.filter(value => value.category === item.category).length]));
    expect(CHARACTER_CATEGORIES).toHaveLength(10);
    expect(categories.get('hair')).toBeGreaterThanOrEqual(3);
    expect(categories.get('clothes')).toBeGreaterThanOrEqual(3);
    expect(categories.get('shoes')).toBeGreaterThanOrEqual(3);
    expect(categories.get('hat')).toBeGreaterThanOrEqual(3);
    expect(categories.get('wings')).toBeGreaterThanOrEqual(2);
    expect(categories.get('mount')).toBeGreaterThanOrEqual(3);
    expect(categories.get('effect')).toBeGreaterThanOrEqual(5);
    expect(new Set(CHARACTER_ITEMS.map(item => item.rarity))).toEqual(new Set(['Common', 'Rare', 'Epic', 'Legendary']));
    expect(CHARACTER_ITEMS.every(item => item.image.startsWith('/assets/icons/'))).toBe(true);
  });

  it('starts with only the default footwear and rejects invalid equipment from saved data', () => {
    const defaults = defaultCharacterCustomization();
    expect(defaults.unlockedItems).toEqual(['shoes-sandals']);
    expect(defaults.unlockedItems).not.toContain('clothes-baba');
    expect(defaults.unlockedItems).not.toContain('effect-flowers');
    const loaded = normalizeCharacterCustomization({
      unlockedItems: ['mount-dragon', 'unknown-item'],
      equipped: { mount: 'mount-dragon', hair: 'no-hair', effect: 'effect-halo' },
      facing: 'three-quarter',
    });
    expect(loaded.unlockedItems).toContain('mount-dragon');
    expect(loaded.unlockedItems).not.toContain('unknown-item');
    expect(loaded.equipped.mount).toBe('mount-dragon');
    expect(loaded.equipped.effect).toBeUndefined();
    expect(loaded.facing).toBe('three-quarter');
  });
});
