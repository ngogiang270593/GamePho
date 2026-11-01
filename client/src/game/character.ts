export const characterGenders = [
  { value: 'male', label: 'Nam', description: 'Áo ngũ thân · Áo dài nam' },
  { value: 'female', label: 'Nữ', description: 'Áo dài · Tứ thân · Nhật Bình' },
] as const;
export type CharacterGender = (typeof characterGenders)[number]['value'];

export const characterOptions = {
  hair: [
    { value: 'bangs', label: 'Mái bằng' },
    { value: 'bun', label: 'Búi sau gáy' },
    { value: 'braid', label: 'Hai bím tóc' },
    { value: 'short', label: 'Tóc ngắn' },
    { value: 'long', label: 'Tóc dài' },
    { value: 'ponytail', label: 'Tóc đuôi ngựa' },
    { value: 'sidepart', label: 'Tóc rẽ ngôi' },
    { value: 'crop', label: 'Tóc húi gọn' },
    { value: 'topknot', label: 'Tóc búi cao' },
  ],
  eyes: [
    { value: 'sparkle', label: 'Long lanh' },
    { value: 'almond', label: 'Mắt hạnh' },
    { value: 'smile', label: 'Mắt cười' },
  ],
  face: [
    { value: 'round', label: 'Tròn phúc hậu' },
    { value: 'oval', label: 'Trái xoan' },
    { value: 'freckles', label: 'Má tàn nhang' },
  ],
  outfit: [
    { value: 'aodai', label: 'Áo dài gấm' },
    { value: 'tuthan', label: 'Áo tứ thân' },
    { value: 'baba', label: 'Áo bà ba' },
    { value: 'forest', label: 'Đồng phục người giữ rừng' },
    { value: 'nhatbinh', label: 'Áo Nhật Bình' },
    { value: 'nguthan', label: 'Áo ngũ thân' },
    { value: 'lotus', label: 'Áo dài hoa sen' },
    { value: 'apron', label: 'Tạp dề quán' },
  ],
  accessory: [
    { value: 'flower', label: 'Hoa sứ cài tóc' },
    { value: 'nonla', label: 'Nón lá' },
    { value: 'khandong', label: 'Khăn đóng' },
    { value: 'none', label: 'Không phụ kiện' },
    { value: 'quaithao', label: 'Nón quai thao' },
    { value: 'moqua', label: 'Khăn mỏ quạ' },
  ],
  skin: [
    { value: 'porcelain', label: 'Da sáng', color: '#f9d8bf' },
    { value: 'peach', label: 'Da hồng ấm', color: '#f4c39f' },
    { value: 'honey', label: 'Da mật ong', color: '#dca174' },
    { value: 'tan', label: 'Da nâu', color: '#b87a52' },
    { value: 'bronze', label: 'Da nâu đồng', color: '#995f3e' },
    { value: 'deep', label: 'Da nâu sẫm', color: '#754631' },
  ],
  hairColor: [
    { value: 'ink', label: 'Tóc đen', color: '#29282e' },
    { value: 'brown', label: 'Tóc nâu hạt dẻ', color: '#633d31' },
    { value: 'chestnut', label: 'Tóc nâu đồng', color: '#8b5135' },
  ],
  pet: [
    { value: 'none', label: 'Không nuôi' },
    { value: 'cat', label: 'Mèo mướp' },
    { value: 'dog', label: 'Chó vàng' },
    { value: 'rabbit', label: 'Thỏ trắng' },
  ],
} as const;

export type PetKind = (typeof characterOptions.pet)[number]['value'];

export type AppearanceOptionKey = keyof typeof characterOptions;
export type CharacterAppearance = { gender: CharacterGender } & {
  [K in keyof typeof characterOptions]: (typeof characterOptions)[K][number]['value'];
};
export type Facing = 'down' | 'up' | 'left' | 'right';

export const DEFAULT_APPEARANCES: Record<CharacterGender, CharacterAppearance> = {
  female: {
    gender: 'female', hair: 'braid', eyes: 'sparkle', face: 'round', outfit: 'aodai',
    accessory: 'flower', skin: 'peach', hairColor: 'ink', pet: 'none',
  },
  male: {
    gender: 'male', hair: 'sidepart', eyes: 'almond', face: 'oval', outfit: 'nguthan',
    accessory: 'khandong', skin: 'honey', hairColor: 'ink', pet: 'none',
  },
};
export const DEFAULT_APPEARANCE = DEFAULT_APPEARANCES.female;

export function getAppearanceOptions(key: AppearanceOptionKey, gender: CharacterGender) {
  const options: readonly { value: CharacterAppearance[AppearanceOptionKey]; label: string }[] = characterOptions[key];
  return options.filter(option => {
    if (key === 'hair') return (gender === 'male'
      ? ['short', 'sidepart', 'crop', 'topknot', 'long', 'ponytail']
      : ['bangs', 'bun', 'braid', 'short', 'long', 'ponytail']).includes(option.value);
    if (key === 'outfit' && gender === 'male') return !['lotus', 'tuthan', 'nhatbinh'].includes(option.value);
    return true;
  }).map(option => ({
    ...option,
    label: gender === 'male' && key === 'outfit' && option.value === 'aodai' ? 'Áo dài nam' : option.label,
  }));
}

export const APPEARANCE_STORAGE_KEY = 'pho-xom-character-appearance';

export function normalizeAppearance(value: unknown): CharacterAppearance {
  if (!value || typeof value !== 'object') return { ...DEFAULT_APPEARANCE };
  const input = value as Record<string, unknown>;
  const gender: CharacterGender = input.gender === 'male' ? 'male' : 'female';
  const result = { ...DEFAULT_APPEARANCES[gender] };
  for (const key of Object.keys(characterOptions) as AppearanceOptionKey[]) {
    if (characterOptions[key].some(option => option.value === input[key])) {
      Object.assign(result, { [key]: input[key] });
    }
  }
  return result;
}

export function readAppearance(): CharacterAppearance {
  try {
    return normalizeAppearance(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? 'null'));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function randomAppearance(gender: CharacterGender = DEFAULT_APPEARANCE.gender, pet: PetKind = 'none'): CharacterAppearance {
  const result = { ...DEFAULT_APPEARANCES[gender], pet };
  for (const key of Object.keys(characterOptions) as AppearanceOptionKey[]) {
    if (key === 'pet') continue;
    const options = getAppearanceOptions(key, gender);
    Object.assign(result, { [key]: options[Math.floor(Math.random() * options.length)].value });
  }
  return result;
}
