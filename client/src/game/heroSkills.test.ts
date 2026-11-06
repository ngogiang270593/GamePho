import { describe, expect, it } from 'vitest';
import { HERO_SKILL_TREE } from './heroSkills';

describe('Tiểu Mông skill tree design', () => {
  it('defines one inner manual and four active techniques with complete combat values', () => {
    expect(HERO_SKILL_TREE).toHaveLength(6);
    expect(HERO_SKILL_TREE.filter(skill => skill.kind === 'Chủ động')).toHaveLength(5);
    for (const skill of HERO_SKILL_TREE) {
      expect(skill.name).toBeTruthy();
      expect(skill.action).toBeTruthy();
      expect(skill.effect).toBeTruthy();
      expect(skill.unlock).toBeTruthy();
      if (skill.kind === 'Chủ động') {
        expect(skill.innerForce).toBeGreaterThan(0);
        expect(skill.cooldown).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
