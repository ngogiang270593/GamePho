import { DEFAULT_APPEARANCES, type CharacterAppearance } from './character';
import type { CharacterPose } from '../components/CharacterSprite';
import { createMapOneNpcDesign, resolveMapOneNpcVisualCollisions, type MapOneNpcVisualDesign } from './mapOneNpcDesign';
import { mapOnePoint } from './mapOneMap';

export type MapOneNpcKind = 'historical' | 'story' | 'community' | 'hidden' | 'opposition';

export interface MapOneNpcDefinition {
  id: string;
  name: string;
  characterId: string;
  locationId: string;
  point: { x: number; y: number };
  appearance: CharacterAppearance;
  design: MapOneNpcVisualDesign;
  pose: CharacterPose;
  kind: MapOneNpcKind;
  icon: string;
  activity: string;
}

const female = (overrides: Partial<CharacterAppearance> = {}): CharacterAppearance => ({
  ...DEFAULT_APPEARANCES.female,
  outfit: 'tuthan',
  accessory: 'moqua',
  ...overrides,
});
const male = (overrides: Partial<CharacterAppearance> = {}): CharacterAppearance => ({
  ...DEFAULT_APPEARANCES.male,
  outfit: 'nguthan',
  accessory: 'khandong',
  ...overrides,
});

const npcDefinitions: Omit<MapOneNpcDefinition, 'design'>[] = [
  { id: 'trung-trac', name: 'Trưng Trắc', characterId: 'trung-trac', locationId: 'hero-hai-ba-trung', point: { x: 570, y: 550 }, appearance: female({ outfit: 'nhatbinh', hair: 'bun', accessory: 'khandong' }), pose: 'cheer', kind: 'historical', icon: '🌺', activity: 'Dẫn dắt mạch truyện · câu hỏi lịch sử' },
  { id: 'trung-nhi', name: 'Trưng Nhị', characterId: 'trung-nhi', locationId: 'me-linh-trung-nhi', point: { x: 680, y: 480 }, appearance: female({ outfit: 'tuthan', hair: 'bun', accessory: 'khandong', skin: 'honey' }), pose: 'offer', kind: 'historical', icon: '🛡️', activity: 'Hỗ trợ nghĩa quân · giao việc chuẩn bị' },
  { id: 'thi-sach-memory', name: 'Ký ức Thi Sách', characterId: 'thi-sach-memory', locationId: 'me-linh-memory', point: { x: 605, y: 340 }, appearance: male({ outfit: 'nguthan', hair: 'topknot', accessory: 'none' }), pose: 'gossip', kind: 'story', icon: '📜', activity: 'Hồi tưởng có ghi chú sử liệu' },
  { id: 'lady-le-chan', name: 'Lê Chân', characterId: 'lady-le-chan', locationId: 'me-linh-le-chan', point: { x: 870, y: 850 }, appearance: female({ outfit: 'nguthan', hair: 'ponytail', accessory: 'khandong', skin: 'tan' }), pose: 'cheer', kind: 'historical', icon: '⚔️', activity: 'Thủ lĩnh nữ · câu chuyện và câu hỏi' },
  { id: 'village-elder', name: 'Trưởng làng', characterId: 'village-elder', locationId: 'gate-hai-ba-trung', point: { x: 520, y: 400 }, appearance: male({ outfit: 'nguthan', hair: 'sidepart', accessory: 'khandong', skin: 'tan', eyes: 'smile' }), pose: 'gossip', kind: 'story', icon: '📖', activity: 'Nhận nhiệm vụ chính · hướng dẫn chương' },
  { id: 'council-elder', name: 'Người giữ sân đình', characterId: 'village-elder', locationId: 'me-linh-council', point: { x: 620, y: 400 }, appearance: male({ outfit: 'nguthan', hair: 'sidepart', accessory: 'khandong', skin: 'honey', eyes: 'smile' }), pose: 'gossip', kind: 'story', icon: '📖', activity: 'Tóm lược các chặng chuyện' },
  { id: 'storyteller', name: 'Người kể chuyện', characterId: 'village-elder', locationId: 'me-linh-story-tent', point: { x: 455, y: 600 }, appearance: female({ outfit: 'tuthan', hair: 'bun', accessory: 'none', skin: 'honey' }), pose: 'gossip', kind: 'story', icon: '📚', activity: 'Kể chuyện năm 40 · ôn lại sự kiện' },
  { id: 'farmer', name: 'Người giữ ruộng', characterId: 'farmer', locationId: 'me-linh-farm', point: { x: 420, y: 875 }, appearance: male({ outfit: 'baba', hair: 'crop', accessory: 'nonla', skin: 'tan' }), pose: 'carry', kind: 'community', icon: '🌾', activity: 'Chăm ruộng · góp lương thực' },
  { id: 'vegetable-gatherer', name: 'Người hái rau', characterId: 'farmer', locationId: 'me-linh-garden', point: { x: 210, y: 520 }, appearance: female({ outfit: 'baba', hair: 'braid', accessory: 'nonla', skin: 'honey' }), pose: 'carry', kind: 'community', icon: '🥬', activity: 'Thu gom rau cho bếp chung' },
  { id: 'market-vendor', name: 'Người bán hàng', characterId: 'market-vendor', locationId: 'me-linh-market', point: { x: 975, y: 545 }, appearance: female({ outfit: 'tuthan', hair: 'braid', accessory: 'moqua' }), pose: 'offer', kind: 'community', icon: '🧺', activity: 'Sắp xếp hàng · giao vật dụng' },
  { id: 'cook', name: 'Người nấu bếp', characterId: 'market-vendor', locationId: 'me-linh-kitchen', point: { x: 1115, y: 460 }, appearance: female({ outfit: 'baba', hair: 'bun', accessory: 'none', skin: 'tan' }), pose: 'stir', kind: 'community', icon: '🍲', activity: 'Chuẩn bị bữa ăn cho bà con' },
  { id: 'boat-person', name: 'Người chèo đò', characterId: 'boat-person', locationId: 'me-linh-wharf', point: { x: 990, y: 835 }, appearance: male({ outfit: 'baba', hair: 'crop', accessory: 'none', skin: 'tan' }), pose: 'offer', kind: 'community', icon: '🛶', activity: 'Đưa tin an toàn qua bến nước' },
  { id: 'messenger', name: 'Người đưa tin', characterId: 'messenger', locationId: 'me-linh-boat-yard', point: { x: 1020, y: 920 }, appearance: male({ outfit: 'baba', hair: 'short', accessory: 'none' }), pose: 'carry', kind: 'community', icon: '✉️', activity: 'Chuyển thư đạo cụ trong nhiệm vụ' },
  { id: 'blacksmith', name: 'Thợ rèn nông cụ', characterId: 'blacksmith', locationId: 'me-linh-forge', point: { x: 1255, y: 685 }, appearance: male({ outfit: 'baba', hair: 'crop', accessory: 'none', skin: 'bronze' }), pose: 'order', kind: 'community', icon: '🔨', activity: 'Sửa công cụ lao động' },
  { id: 'quartermaster', name: 'Người giữ kho', characterId: 'farmer', locationId: 'me-linh-granary', point: { x: 1090, y: 700 }, appearance: female({ outfit: 'baba', hair: 'bun', accessory: 'none', skin: 'tan' }), pose: 'carry', kind: 'community', icon: '🌾', activity: 'Tiếp nhận và sắp xếp lương thực' },
  { id: 'woman-general', name: 'Nữ chỉ huy luyện tập', characterId: 'woman-general', locationId: 'me-linh-training', point: { x: 785, y: 820 }, appearance: female({ outfit: 'nguthan', hair: 'ponytail', accessory: 'khandong', skin: 'bronze' }), pose: 'cheer', kind: 'historical', icon: '🏹', activity: 'Luyện đội hình an toàn · hỗ trợ dân làng' },
  { id: 'horse-keeper', name: 'Người chăm ngựa', characterId: 'farmer', locationId: 'me-linh-horse-pen', point: { x: 720, y: 910 }, appearance: male({ outfit: 'baba', hair: 'sidepart', accessory: 'none', skin: 'honey' }), pose: 'offer', kind: 'community', icon: '🐎', activity: 'Chăm sóc ngựa · chuẩn bị vật dụng' },
  { id: 'gate-guard', name: 'Lính canh cổng', characterId: 'woman-general', locationId: 'me-linh-gate-watch', point: { x: 1240, y: 370 }, appearance: male({ outfit: 'nguthan', hair: 'topknot', accessory: 'none', skin: 'tan' }), pose: 'order', kind: 'community', icon: '🛡️', activity: 'Canh đường làng · báo tin an toàn' },
  { id: 'memory-keeper', name: 'Bà cụ giữ ký ức', characterId: 'village-elder', locationId: 'me-linh-hidden-elder', point: { x: 135, y: 700 }, appearance: female({ outfit: 'tuthan', hair: 'bun', accessory: 'nonla', skin: 'tan', eyes: 'smile' }), pose: 'gossip', kind: 'hidden', icon: '✨', activity: 'Kể chuyện gia đình hư cấu trong game' },
  { id: 'child-runner', name: 'Em nhỏ đưa tin', characterId: 'messenger', locationId: 'me-linh-child', point: { x: 350, y: 650 }, appearance: male({ outfit: 'baba', hair: 'crop', accessory: 'none', skin: 'peach' }), pose: 'cheer', kind: 'community', icon: '📨', activity: 'Giúp chuyển lời nhắn ở khu dân cư' },
  { id: 'village-healer', name: 'Người chăm sóc', characterId: 'village-elder', locationId: 'me-linh-care', point: { x: 590, y: 715 }, appearance: female({ outfit: 'baba', hair: 'bun', accessory: 'none' }), pose: 'offer', kind: 'community', icon: '🩹', activity: 'Chăm sóc người mệt trong tình tiết game' },
  { id: 'raider-lookout', name: 'Người canh lối rừng', characterId: 'messenger', locationId: 'me-linh-hidden-raider', point: { x: 1370, y: 570 }, appearance: male({ outfit: 'baba', hair: 'crop', accessory: 'none', skin: 'bronze' }), pose: 'order', kind: 'opposition', icon: '⚠️', activity: 'Giúp gia đình tìm đường an toàn, không mô tả bạo lực' },
  { id: 'history-guide', name: 'Người hướng dẫn sử liệu', characterId: 'village-elder', locationId: 'me-linh-history-board', point: { x: 420, y: 420 }, appearance: male({ outfit: 'nguthan', hair: 'sidepart', accessory: 'khandong' }), pose: 'gossip', kind: 'story', icon: '📚', activity: 'Giải thích bối cảnh và nguồn tham khảo' },
  { id: 'family-helper', name: 'Người mẹ trong làng', characterId: 'farmer', locationId: 'me-linh-family', point: { x: 765, y: 625 }, appearance: female({ outfit: 'baba', hair: 'braid', accessory: 'none', skin: 'honey' }), pose: 'offer', kind: 'community', icon: '🏡', activity: 'Nhờ giúp đỡ gia đình trong tình tiết game' },
  { id: 'historian', name: 'Người hướng dẫn ở đền', characterId: 'village-elder', locationId: 'guide-hai-ba-trung', point: { x: 445, y: 655 }, appearance: male({ outfit: 'nguthan', hair: 'sidepart', accessory: 'khandong', skin: 'honey' }), pose: 'gossip', kind: 'story', icon: '📚', activity: 'Giải đáp thông tin lịch sử và nhiệm vụ học tập' },
  { id: 'uno-host', name: 'Người giữ quán nước', characterId: 'farmer', locationId: 'uno-hai-ba-trung', point: { x: 765, y: 679 }, appearance: male({ outfit: 'baba', hair: 'topknot', accessory: 'none', skin: 'tan' }), pose: 'offer', kind: 'community', icon: '🎴', activity: 'Mở hoạt động luyện tập UNO với máy' },
  { id: 'hidden-archivist', name: 'Người giữ ký ức Mê Linh', characterId: 'village-elder', locationId: 'me-linh-hidden-memory', point: { x: 880, y: 590 }, appearance: female({ outfit: 'tuthan', hair: 'bun', accessory: 'none', skin: 'tan' }), pose: 'gossip', kind: 'hidden', icon: '✨', activity: 'Kể chuyện mở rộng sau khi tìm được manh mối' },
];

const occupations: Record<string, string> = {
  'trung-trac': 'Nữ lãnh đạo',
  'trung-nhi': 'Nữ thủ lĩnh',
  'thi-sach-memory': 'Thủ lĩnh địa phương trong hồi tưởng',
  'lady-le-chan': 'Nữ tướng trong truyền thống kể chuyện',
  'village-elder': 'Trưởng làng',
  'council-elder': 'Người giữ sân đình',
  storyteller: 'Người kể chuyện',
  farmer: 'Nông dân',
  'vegetable-gatherer': 'Người hái rau',
  'market-vendor': 'Người bán hàng',
  cook: 'Người nấu bếp',
  'boat-person': 'Người chèo đò',
  messenger: 'Người đưa tin',
  blacksmith: 'Thợ rèn nông cụ',
  quartermaster: 'Người giữ kho',
  'woman-general': 'Nữ chỉ huy luyện tập',
  'horse-keeper': 'Người chăm ngựa',
  'gate-guard': 'Lính canh',
  'memory-keeper': 'Người lưu giữ ký ức',
  'child-runner': 'Trẻ đưa tin',
  'village-healer': 'Người chăm sóc',
  'raider-lookout': 'Người canh lối rừng trong tình tiết game',
  'history-guide': 'Người hướng dẫn sử liệu',
  'family-helper': 'Người dân trong tình tiết game',
  historian: 'Người hướng dẫn ở đền',
  'uno-host': 'Người giữ quán nước',
  'hidden-archivist': 'Người giữ ký ức',
};

const historicalRoles: Record<string, string> = {
  'trung-trac': 'Nhân vật lịch sử · nữ lãnh đạo cuộc khởi nghĩa',
  'trung-nhi': 'Nhân vật lịch sử · em gái và người cùng lãnh đạo',
  'thi-sach-memory': 'Nhân vật lịch sử · chỉ xuất hiện trong hồi tưởng diễn giải',
  'lady-le-chan': 'Nhân vật trong truyền thống kể chuyện · nguồn có khác biệt',
  'woman-general': 'Nhân vật đại diện hư cấu, không gán tiểu sử lịch sử',
};

const identityOverrides: Record<string, Partial<MapOneNpcVisualDesign>> = {
  'trung-trac': { outfit: 'light-armor', weapon: 'flag', animationSet: 'commanding', posture: 'upright' },
  'trung-nhi': { outfit: 'light-armor', weapon: 'practice-sword', animationSet: 'practice', posture: 'ready' },
  'thi-sach-memory': { weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'storytelling', posture: 'calm' },
  'lady-le-chan': { outfit: 'guard-armor', weapon: 'shield', animationSet: 'commanding', posture: 'ready' },
  'woman-general': { outfit: 'light-armor', weapon: 'practice-sword', animationSet: 'commanding', posture: 'ready' },
  'village-elder': { hairstyle: 'gray-topknot', faceShape: 'wrinkled', facialMarks: ['wrinkle'], eyebrowShape: 'silver', beardStyle: 'gray-long', weapon: 'walking-staff', animationSet: 'storytelling', posture: 'stooped' },
  'history-guide': { hairstyle: 'braided-crown', weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'storytelling' },
  'raider-lookout': { hairstyle: 'scarf-tie', weapon: 'spear', animationSet: 'guarding', posture: 'alert' },
  'memory-keeper': { hairstyle: 'silver-bun', faceShape: 'wrinkled', facialMarks: ['wrinkle'], eyebrowShape: 'silver', weapon: 'walking-staff', animationSet: 'resting', posture: 'stooped' },
  farmer: { hairstyle: 'curled-bun', outfit: 'field-tunic', weapon: 'none', heldItem: 'sickle', animationSet: 'fieldwork', posture: 'working' },
  'vegetable-gatherer': { outfit: 'field-tunic', weapon: 'none', heldItem: 'woven-basket', animationSet: 'fieldwork', posture: 'working' },
  'market-vendor': { outfit: 'market-wrap', weapon: 'none', heldItem: 'trade-scale', animationSet: 'trading', posture: 'relaxed' },
  cook: { outfit: 'market-wrap', weapon: 'none', heldItem: 'cooking-pot', animationSet: 'fieldwork', posture: 'working' },
  'boat-person': { outfit: 'river-tunic', weapon: 'paddle', animationSet: 'paddling', posture: 'working' },
  messenger: { outfit: 'messenger-vest', weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'running', posture: 'running' },
  blacksmith: { outfit: 'smith-apron', weapon: 'none', heldItem: 'tongs', animationSet: 'hammering', posture: 'working' },
  quartermaster: { outfit: 'field-tunic', weapon: 'none', heldItem: 'grain-basket', animationSet: 'trading', posture: 'working' },
  'horse-keeper': { outfit: 'field-tunic', weapon: 'none', heldItem: 'horse-reins', animationSet: 'fieldwork', posture: 'relaxed' },
  'gate-guard': { outfit: 'guard-armor', weapon: 'spear', animationSet: 'guarding', posture: 'alert' },
  'child-runner': { hairstyle: 'half-tied', outfit: 'child-tunic', weapon: 'none', heldItem: 'toy-kite', animationSet: 'running', posture: 'running' },
  'village-healer': { outfit: 'healer-robe', weapon: 'none', heldItem: 'herbs', animationSet: 'healing', posture: 'calm' },
  storyteller: { weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'storytelling', posture: 'calm' },
  'council-elder': { weapon: 'walking-staff', animationSet: 'resting', posture: 'stooped' },
  historian: { hairstyle: 'elder-wrap', faceShape: 'wrinkled', facialMarks: ['wrinkle'], eyebrowShape: 'silver', beardStyle: 'gray-short', weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'storytelling', posture: 'calm' },
  'hidden-archivist': { hairstyle: 'loose-wave', weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'resting', posture: 'calm' },
  'uno-host': { outfit: 'field-tunic', weapon: 'none', animationSet: 'trading', posture: 'relaxed' },
  'family-helper': { hairstyle: 'braided', weapon: 'none', heldItem: 'water-bowl', animationSet: 'healing', posture: 'calm' },
};

const hairOptions: Record<string, CharacterAppearance['hair']> = {
  'high-bun': 'bun', 'low-bun': 'bun', 'tied-back': 'ponytail', 'loose-long': 'long',
  braided: 'braid', 'cloth-wrap': 'topknot', cropped: 'crop', 'silver-bun': 'bun',
  'messy-short': 'short', topknot: 'topknot', 'side-part': 'sidepart', 'double-braid': 'braid',
  'ribbon-tie': 'ponytail', 'warrior-knot': 'topknot', 'short-fringe': 'bangs',
  'long-braid': 'braid', 'wrapped-knot': 'bun', 'low-ponytail': 'ponytail',
  'curled-bun': 'bun', 'half-tied': 'long', 'shaved-side': 'crop',
  'braided-crown': 'braid', 'scarf-tie': 'topknot', 'gray-topknot': 'topknot',
  'loose-wave': 'long', 'child-crop': 'crop', 'elder-wrap': 'bun',
};

const accessoryOptions: Record<string, CharacterAppearance['accessory']> = {
  'headband': 'khandong', 'cloth-tie': 'none', hairpin: 'flower', headscarf: 'moqua',
  'wrist-wrap': 'none', 'herb-pouch': 'none', 'woven-basket': 'none',
  'shoulder-sash': 'none', 'shoulder-guard': 'khandong', 'bead-cord': 'none',
  none: 'none', 'reed-hat': 'nonla',
};

function appearanceForDesign(appearance: CharacterAppearance, design: MapOneNpcVisualDesign): CharacterAppearance {
  const armor = design.outfit === 'light-armor' || design.outfit === 'guard-armor';
  return {
    ...appearance,
    hair: hairOptions[design.hairstyle],
    hairColor: design.hairColor,
    skin: design.skinTone,
    eyes: design.eyeShape,
    face: design.faceShape === 'round' || design.faceShape === 'child' ? 'round' : design.faceShape === 'high-cheek' ? 'freckles' : 'oval',
    outfit: armor ? 'nguthan' : design.outfit === 'noble-robe' || design.outfit === 'healer-robe' || design.outfit === 'elder-cloak' ? 'tuthan' : 'baba',
    accessory: accessoryOptions[design.accessory],
  };
}

const mapOneNpcs = npcDefinitions.map((npc, index): MapOneNpcDefinition => {
  const design = {
    ...createMapOneNpcDesign(index, occupations[npc.id] ?? 'Người dân Mê Linh', historicalRoles[npc.id] ?? 'Nhân vật gameplay · không phải chân dung lịch sử'),
    ...identityOverrides[npc.id],
    ...(npc.appearance.gender === 'female' ? { beardStyle: 'none' as const } : {}),
  };
  return { ...npc, point: mapOnePoint(npc.point), design, appearance: appearanceForDesign(npc.appearance, design) };
});

export const MAP_ONE_NPCS: readonly MapOneNpcDefinition[] = resolveMapOneNpcVisualCollisions(mapOneNpcs).map(npc => ({
  ...npc,
  appearance: appearanceForDesign(npc.appearance, npc.design),
}));
