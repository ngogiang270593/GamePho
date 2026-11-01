import { beforeEach, describe, expect, it } from 'vitest';
import { APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE, DEFAULT_APPEARANCES, getAppearanceOptions, normalizeAppearance, randomAppearance, readAppearance } from './character';
import { canStandAt, facingForInput, movePlayer, nearestLocation, POSITION_STORAGE_KEY, readPosition, SPAWN, WORLD_LOCATIONS } from './world';

beforeEach(() => localStorage.clear());

describe('world movement', () => {
  it('moves at the same speed diagonally and straight, and Shift runs faster', () => {
    const straight = movePlayer(SPAWN, { x: 1, y: 0 }, .05);
    const diagonal = movePlayer(SPAWN, { x: 1, y: 1 }, .05);
    const running = movePlayer(SPAWN, { x: 1, y: 0 }, .05, true);
    const distance = (p: { x: number; y: number }) => Math.hypot(p.x - SPAWN.x, p.y - SPAWN.y);
    expect(distance(straight)).toBeCloseTo(8);
    expect(distance(diagonal)).toBeCloseTo(8);
    expect(distance(running)).toBeCloseTo(12.5);
  });

  it.each([
    { label: 'shop wall', start: { x: 350, y: 400 }, input: { x: 0, y: -1 }, axis: 'y' as const, minimum: 348, maximum: 356 },
    { label: 'tree trunk', start: { x: 95, y: 530 }, input: { x: 0, y: -1 }, axis: 'y' as const, minimum: 494, maximum: 502 },
    { label: 'pond', start: { x: 1100, y: 700 }, input: { x: 0, y: 1 }, axis: 'y' as const, minimum: 714, maximum: 722 },
    { label: 'world edge', start: { x: 70, y: 600 }, input: { x: -1, y: 0 }, axis: 'x' as const, minimum: 53, maximum: 61 },
  ])('stops at the $label', ({ start, input, axis, minimum, maximum }) => {
    let point = start;
    for (let i = 0; i < 240; i++) point = movePlayer(point, input, .016, true);
    expect(point[axis]).toBeGreaterThanOrEqual(minimum);
    expect(point[axis]).toBeLessThanOrEqual(maximum);
    expect(canStandAt(point)).toBe(true);
  });

  it('slides along a wall instead of getting stuck on diagonal movement', () => {
    const start = { x: 350, y: 349 };
    const result = movePlayer(start, { x: 1, y: -1 }, .05);
    expect(result.x).toBeGreaterThan(start.x);
    expect(result.y).toBeGreaterThanOrEqual(348);
  });

  it('caps long frame intervals and preserves the last facing while idle', () => {
    expect(movePlayer(SPAWN, { x: 1, y: 0 }, 20)).toEqual(movePlayer(SPAWN, { x: 1, y: 0 }, .05));
    expect(facingForInput({ x: 0, y: 0 }, 'up')).toBe('up');
    expect(facingForInput({ x: -1, y: 0 }, 'up')).toBe('left');
  });

  it('makes every interaction reachable and restricts activation to nearby points', () => {
    for (const location of WORLD_LOCATIONS) {
      expect(canStandAt(location.point), location.name).toBe(true);
      expect(nearestLocation(location.point)?.id).toBe(location.id);
    }
    expect(nearestLocation(SPAWN)).toBeUndefined();
  });
});

describe('local character and position saves', () => {
  it('restores valid positions and recovers saves inside walls or with invalid numbers', () => {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ x: 600, y: 500 }));
    expect(readPosition()).toEqual({ x: 600, y: 500 });
    for (const bad of ['{broken', '{"x":350,"y":250}', '{"x":"480","y":475}', 'null']) {
      localStorage.setItem(POSITION_STORAGE_KEY, bad);
      expect(readPosition()).toEqual(SPAWN);
    }
  });

  it('migrates emoji-only characters and preserves valid appearance fields in partial saves', () => {
    expect(readAppearance()).toEqual(DEFAULT_APPEARANCE);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, '{broken');
    expect(readAppearance()).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance({ hair: 'short', eyes: 'invalid' })).toEqual({ ...DEFAULT_APPEARANCE, hair: 'short' });
  });

  it('restores male saves and migrates old saves without losing their selected parts', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ ...DEFAULT_APPEARANCES.male, hair: 'crop' }));
    expect(readAppearance()).toEqual({ ...DEFAULT_APPEARANCES.male, hair: 'crop' });
    expect(normalizeAppearance({ hair: 'bun', outfit: 'lotus' })).toEqual({ ...DEFAULT_APPEARANCE, hair: 'bun', outfit: 'lotus' });
    expect(normalizeAppearance({ gender: 'invalid' }).gender).toBe('female');
    expect(normalizeAppearance({ gender: 'male' })).toEqual(DEFAULT_APPEARANCES.male);
    expect(normalizeAppearance({ gender: 'male', pet: 'unknown', skin: 'invalid' })).toEqual(DEFAULT_APPEARANCES.male);
    expect(normalizeAppearance({ skin: 'deep', pet: 'rabbit' })).toEqual({ ...DEFAULT_APPEARANCE, skin: 'deep', pet: 'rabbit' });
  });

  it.each(['male', 'female'] as const)('keeps %s random outfits within the chosen character options', gender => {
    for (let i = 0; i < 12; i++) {
      const appearance = randomAppearance(gender);
      expect(appearance.gender).toBe(gender);
      expect(getAppearanceOptions('hair', gender).some(option => option.value === appearance.hair)).toBe(true);
      expect(getAppearanceOptions('outfit', gender).some(option => option.value === appearance.outfit)).toBe(true);
    }
  });

  it('offers five traditional outfit families for women and five-panel clothing for both genders', () => {
    const femaleOutfits = getAppearanceOptions('outfit', 'female').map(option => option.value);
    expect(femaleOutfits).toEqual(expect.arrayContaining(['aodai', 'tuthan', 'baba', 'nhatbinh', 'nguthan']));
    const maleOutfits = getAppearanceOptions('outfit', 'male').map(option => option.value);
    expect(maleOutfits).toContain('nguthan');
    expect(maleOutfits).not.toContain('nhatbinh');
    expect(maleOutfits).not.toContain('tuthan');
  });
});
