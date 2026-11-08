import { describe, expect, it } from 'vitest';
import { SkillTimeline, type SkillVfxSkill } from './skillVfx';

describe('2D skill effect timelines', () => {
  const skills: SkillVfxSkill[] = [
    'ha-ba-tuc-cong',
    'ca-coc-phon-thuy',
    'rai-ca-quan-thuy',
    'rua-dam-lay-thu',
    'ha-ba-cuon-luu',
    'bay-tre-gai',
  ];

  it('defines preparation, travel, and impact for all six skills', () => {
    for (const skill of skills) {
      const timeline = new SkillTimeline(skill, false);
      expect(timeline.duration('prepare')).toBeGreaterThan(0);
      expect(timeline.duration('travel')).toBeGreaterThan(0);
      expect(timeline.duration('impact')).toBeGreaterThan(0);
    }
  });

  it('gives the signature whirlpool a longer timeline and honors reduced motion', () => {
    const full = new SkillTimeline('ha-ba-cuon-luu', false);
    const reduced = new SkillTimeline('ha-ba-cuon-luu', true);
    const fullDuration = full.duration('prepare') + full.duration('travel') + full.duration('impact');
    const reducedDuration = reduced.duration('prepare') + reduced.duration('travel') + reduced.duration('impact');

    expect(fullDuration).toBe(1990);
    expect(reducedDuration).toBeLessThan(fullDuration);
  });
});
