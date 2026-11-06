import type { Facing } from './character';
import type { Point } from './world';

const HALF_FIELD_OF_VIEW_RADIANS = Math.PI / 3;

export function isInPatrolVision(
  observer: Point,
  facing: Facing,
  target: Point,
  range: number,
): boolean {
  const dx = target.x - observer.x;
  const dy = target.y - observer.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance > range || range <= 0) return false;

  const forward = facing === 'up' ? { x: 0, y: -1 }
    : facing === 'down' ? { x: 0, y: 1 }
      : facing === 'left' ? { x: -1, y: 0 }
        : { x: 1, y: 0 };
  const dot = (dx * forward.x + dy * forward.y) / distance;
  return dot >= Math.cos(HALF_FIELD_OF_VIEW_RADIANS);
}
