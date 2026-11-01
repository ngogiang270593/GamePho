import { DEFAULT_APPEARANCES, type CharacterAppearance, type CharacterGender } from './character';

export type StartingCharacterId = 'forest-keeper' | 'field-worker' | 'village-apprentice';
export type StartingSkillId = 'herbalism' | 'hunting' | 'stamina' | 'intellect';
export type StartingSkills = Record<StartingSkillId, number>;

export const STARTING_CHARACTER_IMAGE_ASSETS = {
  'forest-keeper': { male: 'forest-keeper/reference-base-male.png', female: 'forest-keeper/reference-base-female.png' },
  'field-worker': { male: 'farmer/male.png', female: 'farmer/female.png' },
  'village-apprentice': { male: 'village-scholar/male.png', female: 'village-scholar/female.png' },
} as const satisfies Record<StartingCharacterId, Record<CharacterGender, string>>;

export function startingCharacterImageAsset(id: StartingCharacterId, gender: CharacterGender): string {
  return STARTING_CHARACTER_IMAGE_ASSETS[id][gender];
}

export interface StartingCharacterTemplate {
  id: StartingCharacterId;
  name: string;
  role: string;
  description: string;
  baseSkills: StartingSkills;
  gear: string[];
  gearNames: string[];
  suitableMissions: string[];
  traits: string[];
  developmentPath: string;
}

export const STARTING_SKILLS: { id: StartingSkillId; label: string }[] = [
  { id: 'herbalism', label: 'Hái thuốc' },
  { id: 'hunting', label: 'Săn bắn' },
  { id: 'stamina', label: 'Thể lực' },
  { id: 'intellect', label: 'Trí lực' },
];

export const STARTING_CHARACTERS: StartingCharacterTemplate[] = [
  {
    id: 'forest-keeper',
    name: 'Người giữ rừng',
    role: 'Khám phá · Thu thập',
    description: 'Nhanh mắt tìm dấu vết, nhận biết thảo dược và khám phá những góc khuất của bản đồ.',
    baseSkills: { herbalism: 95, hunting: 88, stamina: 72, intellect: 65 },
    gear: ['clothes-forest-keeper', 'bottoms-ranger', 'shoes-ranger-boots', 'hat-forest-bandana', 'back-basket', 'front-herb-knife'],
    gearNames: ['Áo kiểm lâm xanh rêu', 'Quần short túi hộp', 'Bốt da đi rừng', 'Khăn quấn đầu in lá', 'Giỏ thuốc tre', 'Dao nhỏ'],
    suitableMissions: ['Tìm thảo dược', 'Theo dấu con vật', 'Giúp người bị thương', 'Khám phá rừng và tìm vật phẩm ẩn'],
    traits: ['Tăng cơ hội tìm thảo dược hiếm', 'Dễ phát hiện vật phẩm ẩn', 'Thưởng thêm khi hoàn thành nhiệm vụ khám phá'],
    developmentPath: 'Nhà thám hiểm · thảo dược · dấu vết',
  },
  {
    id: 'field-worker',
    name: 'Người con của đồng ruộng',
    role: 'Lao động · Bền bỉ',
    description: 'Khỏe khoắn, bền sức và luôn sẵn lòng giúp bà con trong những việc thường ngày.',
    baseSkills: { herbalism: 68, hunting: 62, stamina: 98, intellect: 75 },
    gear: ['back-basket', 'front-small-hoe'],
    gearNames: ['Nón lá hoặc khăn đội đầu', 'Gánh tre', 'Cuốc nhỏ', 'Áo bà ba', 'Giỏ nông sản'],
    suitableMissions: ['Trồng và thu hoạch lúa', 'Hái rau, câu cá', 'Vận chuyển lương thực', 'Sửa nhà và cầu tre', 'Giúp người dân'],
    traits: ['Tăng sức chứa túi đồ', 'Hoạt động lâu hơn', 'Rút ngắn thời gian trồng, thu hoạch và vận chuyển', 'Thưởng thêm từ nhiệm vụ lao động'],
    developmentPath: 'Người làm ruộng · vận chuyển · giúp làng',
  },
  {
    id: 'village-apprentice',
    name: 'Người học việc của làng',
    role: 'Lịch sử · Giải đố',
    description: 'Tò mò với chuyện xưa, giỏi xâu chuỗi manh mối và tìm hiểu những câu chuyện của làng.',
    baseSkills: { herbalism: 72, hunting: 55, stamina: 65, intellect: 100 },
    gear: ['back-fabric', 'front-bamboo-book'],
    gearNames: ['Sách hoặc thẻ tre', 'Bút tre', 'Túi đựng tài liệu', 'Trang phục học việc'],
    suitableMissions: ['Trả lời câu hỏi lịch sử', 'Giải câu đố và ghép sự kiện', 'Tìm manh mối', 'Trò chuyện với nhân vật lịch sử', 'Mở nhiệm vụ ẩn'],
    traits: ['Nhận thêm danh vọng khi trả lời đúng', 'Có thêm gợi ý trong câu hỏi', 'Dễ phát hiện nhiệm vụ ẩn', 'Thưởng thêm từ nhiệm vụ lịch sử'],
    developmentPath: 'Người kể chuyện · sử liệu · giải đố',
  },
];

export function startingCharacterAppearance(id: StartingCharacterId, gender: CharacterGender): CharacterAppearance {
  const base = { ...DEFAULT_APPEARANCES[gender] };
  if (id === 'forest-keeper') {
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
  if (id === 'field-worker') {
    return {
      ...base,
      hair: gender === 'male' ? 'short' : 'bun',
      eyes: 'smile',
      face: 'round',
      outfit: gender === 'male' ? 'nguthan' : 'baba',
      accessory: gender === 'male' ? 'khandong' : 'nonla',
      skin: 'honey',
      hairColor: 'ink',
    };
  }
  return {
    ...base,
    hair: gender === 'male' ? 'sidepart' : 'braid',
    eyes: 'sparkle',
    face: 'oval',
    outfit: gender === 'male' ? 'nguthan' : 'aodai',
    accessory: gender === 'male' ? 'khandong' : 'flower',
    skin: 'peach',
    hairColor: 'ink',
  };
}

export function rollStartingSkills(template: StartingCharacterTemplate): StartingSkills {
  return Object.fromEntries(STARTING_SKILLS.map(({ id }) => [
    id,
    Math.max(50, Math.min(100, template.baseSkills[id] + Math.floor(Math.random() * 7) - 3)),
  ])) as StartingSkills;
}
