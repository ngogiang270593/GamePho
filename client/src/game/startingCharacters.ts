import { DEFAULT_APPEARANCES, type CharacterAppearance, type CharacterGender } from './character';

export const MAIN_CHARACTER_ID = 'forest-keeper' as const;
export type PlayableCharacterId = typeof MAIN_CHARACTER_ID;
export type ReferenceCharacterId = 'field-worker' | 'village-apprentice';
export type StartingCharacterId = PlayableCharacterId | ReferenceCharacterId;

export const STARTING_CHARACTER_IMAGE_ASSETS = {
  'forest-keeper': { male: 'forest-keeper/reference-base-male.png', female: 'forest-keeper/reference-base-female.png' },
  'field-worker': { male: 'farmer/male.png', female: 'farmer/female.png' },
  'village-apprentice': { male: 'village-scholar/male.png', female: 'village-scholar/female.png' },
} as const satisfies Record<StartingCharacterId, Record<CharacterGender, string>>;

export function startingCharacterImageAsset(id: StartingCharacterId, gender: CharacterGender): string {
  return STARTING_CHARACTER_IMAGE_ASSETS[id][gender];
}

export interface StartingCharacterTemplate {
  id: PlayableCharacterId;
  name: string;
  gear: string[];
}

export const STARTING_CHARACTERS: StartingCharacterTemplate[] = [
  {
    id: MAIN_CHARACTER_ID,
    name: 'Người đi rừng',
    gear: ['clothes-forest-keeper', 'bottoms-ranger', 'shoes-ranger-boots', 'hat-forest-bandana', 'back-basket', 'front-herb-knife'],
  },
];

export const CHARACTER_REFERENCES = [
  { id: 'field-worker', name: 'Mẫu tham khảo 1' },
  { id: 'village-apprentice', name: 'Mẫu tham khảo 2' },
] as const;

export function startingCharacterAppearance(id: PlayableCharacterId, gender: CharacterGender): CharacterAppearance {
  const base = { ...DEFAULT_APPEARANCES[gender] };
  return {
    ...base,
    hair: gender === 'male' ? 'crop' : 'bun',
    eyes: 'almond',
    face: gender === 'male' ? 'freckles' : 'oval',
    outfit: 'forest',
    accessory: 'none',
    skin: 'tan',
    hairColor: 'brown',
  };
}
