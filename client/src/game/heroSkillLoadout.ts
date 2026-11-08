import { HERO_SKILL_TREE } from './heroSkills';

export const ULTIMATE_SKILL_ID = 'ha-ba-cuon-luu';
export const SKILL_LOADOUT_STORAGE_KEY = 'gamepho-skill-loadout-v1';

const meditationSkills = HERO_SKILL_TREE.filter(skill => skill.kind === 'Tâm pháp');
const selectableCombatSkills = HERO_SKILL_TREE.filter(skill => skill.kind === 'Chủ động' && skill.id !== ULTIMATE_SKILL_ID);

export const MEDITATION_SKILLS = meditationSkills;
export const SELECTABLE_COMBAT_SKILLS = selectableCombatSkills;

export type HeroSkillLoadout = {
  meditationId: string;
  combatSkillIds: [string, string, string];
};

export const DEFAULT_HERO_SKILL_LOADOUT: HeroSkillLoadout = {
  meditationId: meditationSkills[0].id,
  combatSkillIds: [
    'ca-coc-phon-thuy',
    'rai-ca-quan-thuy',
    'rua-dam-lay-thu',
  ],
};

function isValidLoadout(value: unknown): value is HeroSkillLoadout {
  if (!value || typeof value !== 'object') return false;
  const loadout = value as Partial<HeroSkillLoadout>;
  return typeof loadout.meditationId === 'string'
    && meditationSkills.some(skill => skill.id === loadout.meditationId)
    && Array.isArray(loadout.combatSkillIds)
    && loadout.combatSkillIds.length === 3
    && loadout.combatSkillIds.every(id => typeof id === 'string' && selectableCombatSkills.some(skill => skill.id === id))
    && new Set(loadout.combatSkillIds).size === 3;
}

export function loadHeroSkillLoadout(): HeroSkillLoadout {
  const stored = window.localStorage.getItem(SKILL_LOADOUT_STORAGE_KEY);
  if (stored === null) return DEFAULT_HERO_SKILL_LOADOUT;
  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Lỗi JSON không xác định';
    throw new Error(`Bộ võ công đã lưu bị lỗi định dạng: ${reason}`);
  }
  if (!isValidLoadout(value)) throw new Error('Bộ võ công đã lưu không hợp lệ.');
  return {
    meditationId: value.meditationId,
    combatSkillIds: [value.combatSkillIds[0], value.combatSkillIds[1], value.combatSkillIds[2]],
  };
}

export function saveHeroSkillLoadout(loadout: HeroSkillLoadout): void {
  if (!isValidLoadout(loadout)) throw new Error('Không thể lưu bộ võ công: cần 1 tâm pháp và 3 võ công chiến đấu khác nhau.');
  window.localStorage.setItem(SKILL_LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
}
