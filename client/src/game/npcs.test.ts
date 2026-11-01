import { describe, expect, it } from 'vitest';
import { createNeighbors, NEIGHBORS, neighborLocations, stepNeighbors } from './npcs';
import { canStandAt, nearestLocation, WORLD_FEATURES, WORLD_LOCATIONS, type Point } from './world';

const away: Point = { x: 70, y: 80 };

describe('neighbors in the map', () => {
  it('walks every complete patrol without entering scenery or leaving the world', () => {
    let motions = createNeighbors();
    const visited = NEIGHBORS.map(() => new Set<number>());
    const moving = new Set<string>();
    for (let frame = 0; frame < 2400; frame++) {
      motions = stepNeighbors(motions, away, .05);
      motions.forEach((motion, index) => {
        expect(canStandAt(motion.point), `${motion.id} at frame ${frame}`).toBe(true);
        if (motion.rest > 0) visited[index].add(motion.next);
        if (motion.moving) moving.add(motion.id);
      });
    }
    expect(moving.size).toBe(NEIGHBORS.length);
    visited.forEach((stops, index) => expect(stops.size, NEIGHBORS[index].name).toBe(NEIGHBORS[index].route.length));
  });

  it('stops and faces a nearby player, then continues its route after they leave', () => {
    const initial = createNeighbors();
    const first = initial[0];
    const next = stepNeighbors(initial, { x: first.point.x + 30, y: first.point.y }, .05);
    expect(next[0].point).toEqual(first.point);
    expect(next[0].moving).toBe(false);
    expect(next[0].facing).toBe('right');
    expect(next[1].moving).toBe(true);
    const resumed = stepNeighbors(next, away, .05);
    expect(resumed[0].point.x).toBeGreaterThan(first.point.x);
    expect(resumed[0].moving).toBe(true);
  });

  it('freezes every patrol while an activity or dialogue is open and resumes without a jump', () => {
    const moving = stepNeighbors(createNeighbors(), away, .05);
    const paused = stepNeighbors(moving, away, 20, true);
    paused.forEach((npc, index) => {
      expect(npc.point).toEqual(moving[index].point);
      expect(npc.moving).toBe(false);
      expect(npc.next).toBe(moving[index].next);
    });
    expect(stepNeighbors(paused, away, 20, true)).toBe(paused);
    const resumed = stepNeighbors(paused, away, 20);
    resumed.forEach((npc, index) => expect(Math.hypot(npc.point.x - paused[index].point.x, npc.point.y - paused[index].point.y)).toBeLessThanOrEqual(NEIGHBORS[index].speed * .05 + .001));
  });

  it('moves interaction points with the actual characters', () => {
    let motions = createNeighbors();
    for (let i = 0; i < 100; i++) motions = stepNeighbors(motions, away, .05);
    const locations = neighborLocations(motions);
    locations.forEach((location, index) => {
      expect(location.point).toEqual(motions[index].point);
      expect(nearestLocation(location.point, locations)?.npcId).toBe(motions[index].id);
      expect(location.dialogue).toBeTruthy();
    });
  });

  it('gives every game activity a reachable physical location', () => {
    const features = WORLD_LOCATIONS.flatMap(location => location.feature ? [location.feature] : []);
    expect(new Set(features)).toEqual(new Set(Object.keys(WORLD_FEATURES)));
    WORLD_LOCATIONS.forEach(location => expect(canStandAt(location.point), location.name).toBe(true));
  });
  it('replaces the football activity with UNO at the former pitch', () => {
    expect(WORLD_LOCATIONS.find(location => location.feature === 'cards')?.point).toEqual({ x: 765, y: 679 });
    expect(Object.keys(WORLD_FEATURES)).not.toContain('football');
    expect(NEIGHBORS.find(npc => npc.id === 'ti')?.feature).toBe('cards');
  });
});
