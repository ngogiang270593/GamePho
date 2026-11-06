import { describe, expect, it } from 'vitest';
import { isInPatrolVision } from './patrolVision';

describe('patrol vision', () => {
  it('detects only targets inside the facing cone and range', () => {
    const guard = { x: 100, y: 100 };
    expect(isInPatrolVision(guard, 'right', { x: 200, y: 100 }, 120)).toBe(true);
    expect(isInPatrolVision(guard, 'right', { x: 100, y: 200 }, 120)).toBe(false);
    expect(isInPatrolVision(guard, 'right', { x: 230, y: 100 }, 120)).toBe(false);
  });

  it('lets the patrol map cut nighttime detection range exactly in half', () => {
    const guard = { x: 100, y: 100 };
    const player = { x: 250, y: 100 };
    expect(isInPatrolVision(guard, 'right', player, 240)).toBe(true);
    expect(isInPatrolVision(guard, 'right', player, 120)).toBe(false);
  });
});
