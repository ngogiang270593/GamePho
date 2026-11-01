import { describe, expect, it } from 'vitest';
import { createCompanion, followPlayer, COMPANION_DISTANCE } from './companion';
import { canStandAt, movePlayer, SPAWN } from './world';

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('pet following', () => {
  it.each([SPAWN, { x: 350, y: 348 }, { x: 544, y: 250 }, { x: 53, y: 73 }])('spawns at a safe place beside the player at $x, $y', player => {
    const companion = createCompanion(player);
    expect(canStandAt(companion.point)).toBe(true);
    expect(distance(companion.point, player)).toBeLessThan(51);
  });

  it.each([false, true])('follows turns around buildings without walking through walls (running: %s)', running => {
    let player = { x: 350, y: 380 };
    let companion = createCompanion(player);
    for (const leg of [{ input: { x: 1, y: 0 }, count: 90 }, { input: { x: 0, y: -1 }, count: 140 }, { input: { x: -1, y: 0 }, count: 170 }, { input: { x: 0, y: 1 }, count: 160 }]) {
      for (let frame = 0; frame < leg.count; frame++) {
        player = movePlayer(player, leg.input, .016, running);
        companion = followPlayer(companion, player, .016, running);
        expect(canStandAt(companion.point)).toBe(true);
        expect(distance(companion.point, player)).toBeLessThan(85);
      }
    }
    for (let frame = 0; frame < 120; frame++) companion = followPlayer(companion, player, .016);
    expect(companion.moving).toBe(false);
    expect(companion.trail.length).toBeLessThan(40);
    expect(distance(companion.point, player)).toBeLessThanOrEqual(COMPANION_DISTANCE + 2);
  });

  it('stops at a comfortable distance, leaves old state unchanged and resumes with the player', () => {
    let companion = createCompanion(SPAWN);
    const original = JSON.stringify(companion);
    const next = followPlayer(companion, { x: SPAWN.x + 100, y: SPAWN.y }, .016);
    expect(JSON.stringify(companion)).toBe(original);
    companion = next;
    for (let frame = 0; frame < 120; frame++) companion = followPlayer(companion, { x: SPAWN.x + 100, y: SPAWN.y }, .016);
    expect(companion.moving).toBe(false);
    expect(distance(companion.point, { x: SPAWN.x + 100, y: SPAWN.y })).toBeCloseTo(COMPANION_DISTANCE, 0);
    expect(followPlayer(companion, { x: SPAWN.x + 120, y: SPAWN.y }, .016).moving).toBe(true);
  });

  it('caps long frame intervals instead of jumping across the map', () => {
    const companion = createCompanion(SPAWN);
    const next = followPlayer(companion, { x: SPAWN.x + 200, y: SPAWN.y }, 20, true);
    expect(distance(companion.point, next.point)).toBeLessThanOrEqual(15.01);
  });
});
