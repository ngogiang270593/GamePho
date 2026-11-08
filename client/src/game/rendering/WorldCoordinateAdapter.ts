import type { Point } from '../world';

export type World3Point = { x: number; y: number; z: number };

/** Stable bridge between the existing map coordinates and Three's X/Y/Z space. */
export class WorldCoordinateAdapter {
  constructor(public readonly worldWidth: number, public readonly worldHeight: number, public readonly scale = 0.018) {}
  mapToWorld(point: Point, height = 0): World3Point {
    return { x: (point.x - this.worldWidth / 2) * this.scale, y: height, z: (point.y - this.worldHeight / 2) * this.scale };
  }
  size(value: number) { return Math.max(.02, value * this.scale); }
}
