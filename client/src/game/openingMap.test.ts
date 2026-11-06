import { describe, expect, it } from 'vitest';
import type { Point } from './world';
import {
  findOpeningMapPath,
  isOpeningMapSegmentWalkable,
  isOpeningMapWalkable,
  nearestOpeningMapWalkablePoint,
  OPENING_MAP_AREAS,
  OPENING_MAP_BUILDINGS,
  OPENING_MAP_DOCK,
  OPENING_MAP_GATES,
  OPENING_MAP_HEIGHT,
  OPENING_MAP_MEMORY_KEEPER_CLEARING,
  OPENING_MAP_PONDS,
  OPENING_MAP_RIVER,
  OPENING_MAP_REST_POINT,
  OPENING_MAP_SPAWN,
  OPENING_MAP_TREES,
  OPENING_MAP_WIDTH,
} from './openingMap';

function expectSafeRoute(start: Point, target: Point): Point[] {
  const route = findOpeningMapPath(start, target);
  expect(route.length, `No route from ${JSON.stringify(start)} to ${JSON.stringify(target)}`).toBeGreaterThan(0);
  expect(route[route.length - 1]).toEqual(target);
  let previous = start;
  for (const waypoint of route) {
    expect(isOpeningMapSegmentWalkable(previous, waypoint), `Blocked segment ${JSON.stringify(previous)} → ${JSON.stringify(waypoint)}`).toBe(true);
    previous = waypoint;
  }
  return route;
}

describe('expanded opening map', () => {
  it('has exactly ten times the previous map area and a clear central spawn', () => {
    expect(OPENING_MAP_WIDTH * OPENING_MAP_HEIGHT).toBe(1440 * 900 * 10);
    expect(OPENING_MAP_SPAWN).toEqual({ x: 2160, y: 1620 });
    expect(isOpeningMapWalkable(OPENING_MAP_SPAWN)).toBe(true);
    expect(OPENING_MAP_AREAS.map(area => area.type)).toEqual(['market', 'north', 'east', 'south', 'west']);
  });

  it('connects the market, four gates and all four distinct landscapes', () => {
    for (const destination of [...OPENING_MAP_GATES, ...OPENING_MAP_AREAS]) {
      expect(isOpeningMapWalkable(destination.point), destination.name).toBe(true);
      expectSafeRoute(OPENING_MAP_SPAWN, destination.point);
    }
  });

  it('routes a river crossing over the actual bridge instead of cutting through water', () => {
    const start = { x: 2860, y: 1000 };
    const target = { x: 3510, y: 1000 };
    expect(isOpeningMapWalkable(start)).toBe(true);
    expect(isOpeningMapWalkable(target)).toBe(true);
    expect(isOpeningMapSegmentWalkable(start, target)).toBe(false);
    const route = expectSafeRoute(start, target);
    expect(route.some(point => point.y >= 1429 && point.y <= 1571)).toBe(true);
    expect(isOpeningMapWalkable({ x: 3135, y: 1500 })).toBe(true);
    expect(isOpeningMapWalkable(OPENING_MAP_RIVER.points[3])).toBe(false);
  });

  it('keeps the riverside home and rest area reachable from the village side', () => {
    const homeApproach = { x: 2860, y: 1945 };
    expect(OPENING_MAP_REST_POINT).toEqual({ x: 2912, y: 2006 });
    expect(isOpeningMapWalkable({ x: OPENING_MAP_DOCK.x + 90, y: OPENING_MAP_DOCK.y + 90 })).toBe(true);
    expect(isOpeningMapWalkable(homeApproach)).toBe(true);
    expect(isOpeningMapWalkable({ x: 3420, y: 1620 })).toBe(false);
    expectSafeRoute(OPENING_MAP_SPAWN, homeApproach);
    expectSafeRoute(OPENING_MAP_SPAWN, { x: 2912, y: 2006 });
  });

  it('keeps trees clear of the memory keeper home and wake-up area', () => {
    const clearingRight = OPENING_MAP_MEMORY_KEEPER_CLEARING.x + OPENING_MAP_MEMORY_KEEPER_CLEARING.width;
    const clearingBottom = OPENING_MAP_MEMORY_KEEPER_CLEARING.y + OPENING_MAP_MEMORY_KEEPER_CLEARING.height;
    expect(OPENING_MAP_TREES.some(tree =>
      tree.x >= OPENING_MAP_MEMORY_KEEPER_CLEARING.x && tree.x <= clearingRight
      && tree.y >= OPENING_MAP_MEMORY_KEEPER_CLEARING.y && tree.y <= clearingBottom,
    )).toBe(false);
  });

  it('keeps the eastern bridge closed until the checkpoint boss is defeated', () => {
    const villageSide = { x: 3070, y: 1500 };
    const farBank = { x: 3500, y: 1500 };
    expect(isOpeningMapWalkable({ x: 3135, y: 1500 }, undefined, false)).toBe(false);
    expect(isOpeningMapWalkable({ x: 3135, y: 1500 }, undefined, true)).toBe(true);
    expect(findOpeningMapPath(OPENING_MAP_SPAWN, villageSide, false).length).toBeGreaterThan(0);
    expect(findOpeningMapPath(OPENING_MAP_SPAWN, farBank, false)).toEqual([]);
    expect(findOpeningMapPath(OPENING_MAP_SPAWN, farBank, true).length).toBeGreaterThan(0);
  });

  it('uses the rendered house footprint and finds a safe path around it', () => {
    const home = OPENING_MAP_BUILDINGS.find(building => building.id === 'home-nw-1')!;
    expect(isOpeningMapWalkable({ x: home.x + home.width / 2, y: home.y + 20 })).toBe(true);
    expect(isOpeningMapWalkable({ x: 1600, y: 1240 })).toBe(false);
    const start = { x: 1500, y: 1240 };
    const target = { x: 1710, y: 1240 };
    expect(isOpeningMapSegmentWalkable(start, target)).toBe(false);
    expect(expectSafeRoute(start, target).length).toBeGreaterThan(1);
  });

  it('blocks solid tree trunks and world edges while allowing canopy ground', () => {
    const tree = OPENING_MAP_TREES.find(candidate => candidate.kind === 'banyan')!;
    expect(isOpeningMapWalkable(tree)).toBe(false);
    // A roof-like tree canopy is scenery: only its ground-level trunk is solid.
    const openCanopyPoint = OPENING_MAP_TREES.map(candidate => ({ x: candidate.x, y: candidate.y - 65 * candidate.scale }))
      .find(point => isOpeningMapWalkable(point));
    expect(openCanopyPoint).toBeDefined();
    for (const point of [{ x: 0, y: 1500 }, { x: 4320, y: 1500 }, { x: 2160, y: 0 }, { x: 2160, y: 3000 }, { x: NaN, y: 500 }]) {
      expect(isOpeningMapWalkable(point)).toBe(false);
    }
  });

  it('keeps navigation on the bank of the scenic lotus lake', () => {
    const pond = OPENING_MAP_PONDS[0];
    expect(isOpeningMapWalkable(pond)).toBe(false);
    const start = { x: 800, y: 560 };
    const target = { x: 1300, y: 560 };
    expect(isOpeningMapSegmentWalkable(start, target)).toBe(false);
    expect(expectSafeRoute(start, target).length).toBeGreaterThan(1);
  });

  it('snaps blocked or outside clicks to valid nearby ground and rejects corrupt destinations', () => {
    const requested = { x: 1600, y: 1240 };
    const snapped = nearestOpeningMapWalkablePoint(requested)!;
    expect(isOpeningMapWalkable(snapped)).toBe(true);
    expect(Math.hypot(snapped.x - requested.x, snapped.y - requested.y)).toBeLessThan(65);
    const route = findOpeningMapPath(OPENING_MAP_SPAWN, requested);
    expect(route[route.length - 1]).toEqual(snapped);
    expect(nearestOpeningMapWalkablePoint({ x: -1000, y: 1500 })?.x).toBeGreaterThanOrEqual(38);
    expect(nearestOpeningMapWalkablePoint({ x: Infinity, y: 0 })).toBeNull();
    expect(findOpeningMapPath(OPENING_MAP_SPAWN, { x: NaN, y: 0 })).toEqual([]);
    expect(findOpeningMapPath({ x: 1600, y: 1240 }, OPENING_MAP_SPAWN)).toEqual([]);
  });
});
