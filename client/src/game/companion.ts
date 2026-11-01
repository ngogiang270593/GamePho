import type { Facing } from './character';
import { canStandAt, facingForInput, type Point } from './world';

export const COMPANION_DISTANCE = 62;
export interface CompanionMotion {
  point: Point;
  facing: Facing;
  moving: boolean;
  trail: Point[];
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function clearSegment(from: Point, to: Point): boolean {
  const count = Math.max(1, Math.ceil(distance(from, to) / 3));
  for (let i = 0; i <= count; i++) {
    if (!canStandAt({ x: from.x + (to.x - from.x) * i / count, y: from.y + (to.y - from.y) * i / count })) return false;
  }
  return true;
}

export function createCompanion(player: Point): CompanionMotion {
  const offsets = [{ x: 40, y: 27 }, { x: -40, y: 27 }, { x: 0, y: 42 }, { x: 42, y: 0 }, { x: -42, y: 0 }, { x: 0, y: -42 }];
  const point = offsets.map(offset => ({ x: player.x + offset.x, y: player.y + offset.y }))
    .find(candidate => clearSegment(player, candidate)) ?? { ...player };
  return { point, facing: 'down', moving: false, trail: [{ ...player }] };
}

// Keep a short trail of the player's actual route so a pet follows turns around
// buildings instead of chasing straight through them. Position saves need only
// the player: a companion safely reappears nearby after reload or fast travel.
export function followPlayer(old: CompanionMotion, player: Point, seconds: number, running = false): CompanionMotion {
  const last = old.trail[old.trail.length - 1] ?? old.point;
  const appended = distance(last, player) >= 2;
  const trail = appended ? [...old.trail, { ...player }] : [...old.trail];
  let total = 0;
  let previous = old.point;
  for (const waypoint of trail) { total += distance(previous, waypoint); previous = waypoint; }
  let remaining = Math.min(Math.max(0, total - COMPANION_DISTANCE), (running ? 300 : 205) * Math.min(Math.max(seconds, 0), .05));
  let point = old.point;
  const allowance = remaining;
  while (remaining > .01 && trail.length) {
    const target = trail[0];
    const length = distance(point, target);
    if (length < .1) { trail.shift(); continue; }
    const step = Math.min(remaining, length, 3);
    const candidate = { x: point.x + (target.x - point.x) / length * step, y: point.y + (target.y - point.y) / length * step };
    let next = candidate;
    if (!canStandAt(next)) {
      const horizontal = { x: candidate.x, y: point.y };
      const vertical = { x: point.x, y: candidate.y };
      if (distance(horizontal, point) > .01 && canStandAt(horizontal)) next = horizontal;
      else if (distance(vertical, point) > .01 && canStandAt(vertical)) next = vertical;
      else break;
    }
    remaining -= step;
    point = next;
    if (distance(point, target) < .1) trail.shift();
  }
  const moving = distance(old.point, point) > .01;
  if (!appended && !moving && old.moving === moving && allowance < .01) return old;
  return { point, trail, moving, facing: moving ? facingForInput({ x: point.x - old.point.x, y: point.y - old.point.y }, old.facing) : old.facing };
}
