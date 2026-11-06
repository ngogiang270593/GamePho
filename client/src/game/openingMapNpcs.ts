import { useEffect, useState } from 'react';
import type { CharacterPose } from '../components/CharacterSprite';
import { DEFAULT_APPEARANCES, type CharacterAppearance, type Facing } from './character';
import { OPENING_MAP_ID } from './openingMap';
import { createMapOneNpcDesign, type MapOneNpcVisualDesign } from './mapOneNpcDesign';
import { MAP_CHARACTER_DRAFT_EVENT, MAP_CHARACTER_DRAFT_KEY, parseMapCharacterDraft, readMapCharacterDraft, type MapCharacterDraft, type OpeningMapNpcDayPeriod, type OpeningMapNpcKind, type OpeningMapNpcScheduleEntry } from './mapCharacterDraft';
import sourceNpcOverrides from './openingMapNpcs.json';

export { OPENING_MAP_ID } from './openingMap';

export interface OpeningMapNpc extends MapCharacterDraft {
  mapId: typeof OPENING_MAP_ID;
  alias: string;
  locationLabel: string;
  role: string;
  mission: string;
  dialogue: string;
  facing: Facing;
  pose: CharacterPose;
  scale: number;
  kind: OpeningMapNpcKind;
  design: MapOneNpcVisualDesign;
  hidden: boolean;
}

export const OPENING_MAP_NPC_IDS = [
  'memory-keeper', 'fisherman-tao', 'woman-general', 'messenger', 'gate-guard',
  'herbalist-lang', 'inn-server', 'fruit-aunt-tu', 'smith-thiet-chuy', 'woodcutter',
  'toy-seller', 'beggar-hac-lao', 'singer-le-nuong', 'herdboy-a-sang', 'village-captain',
  'black-wolf', 'poison-witch', 'double-agent-acau', 'blood-blade-phuong', 'tax-official-trieu',
] as const;
export const OPENING_MAP_VILLAGER_SPRITE_NPCS = [
  { id: 'NPC_DAN_NONG_01', name: 'Bé Thảo', artwork: 'thon-dan-tre', point: { x: 2160, y: 2200 } },
  { id: 'NPC_DAN_NONG_02', name: 'Cậu Tùng', artwork: 'nong-dan-tre', point: { x: 1800, y: 1760 } },
  { id: 'NPC_DAN_NONG_03', name: 'Bác Hòa', artwork: 'nong-dan', point: { x: 2530, y: 1760 } },
] as const;
export const openingMapNpcSpriteTarget = (id: string) => `opening-map-npc:${id}`;

export function createOpeningMapVillagers(template: OpeningMapNpc, carryingFish = false): OpeningMapNpc[] {
  return OPENING_MAP_VILLAGER_SPRITE_NPCS.map(({ id, name, artwork, point }) => ({
    ...template, id, name, point, alias: 'Dân làng', locationLabel: 'Thôn Mê Linh',
    role: 'Người dân trong thôn đang cố gắng cầm cự trước sự áp bức của quân Đông Hán.',
    mission: carryingFish ? 'Có thể nhận cá chia sẻ từ Tiểu Mông.' : 'Đang tìm cách giúp các hộ dân trong làng.',
    dialogue: carryingFish ? 'Cá này con mang đến chia cho bà con sao? Cảm ơn con, nhà ta đã lâu chưa có bữa tử tế.' : 'Mong sao dân làng sớm qua được những ngày khó khăn này.',
    kind: 'villager', schedule: undefined, artwork,
  }));
}
export const OPENING_MAP_MEMORY_KEEPER_HOME_POINT = { x: 2860, y: 1945 };
const LEGACY_MEMORY_KEEPER_POINT = { x: 3650, y: 1500 };
const PREVIOUS_MEMORY_KEEPER_DOCK_POINT = { x: 3488, y: 1665 };

export function openingMapDayPeriod(timeMinutes: number): OpeningMapNpcDayPeriod {
  const minute = ((timeMinutes % 1440) + 1440) % 1440;
  return minute < 360 || minute >= 840 ? 'evening' : minute < 660 ? 'morning' : 'noon';
}

export function openingMapPeriodLabel(period: OpeningMapNpcDayPeriod): string {
  return period === 'morning' ? 'Buổi sáng · 06:00–11:00'
    : period === 'noon' ? 'Buổi trưa · 11:00–14:00'
      : 'Buổi tối · 14:00–06:00';
}

function schedule(morning: OpeningMapNpcScheduleEntry, noon: OpeningMapNpcScheduleEntry, evening: OpeningMapNpcScheduleEntry) {
  return [morning, noon, evening];
}

function npc(id: string, visualIndex: number, overrides: Omit<Partial<OpeningMapNpc>, 'design' | 'appearance'> & { name: string; point: OpeningMapNpc['point']; design?: Partial<MapOneNpcVisualDesign>; appearance?: Partial<CharacterAppearance> }): OpeningMapNpc {
  const appearance = { ...DEFAULT_APPEARANCES[overrides.appearance?.gender ?? 'female'], ...overrides.appearance };
  return {
    mapId: OPENING_MAP_ID, id, alias: '', locationLabel: '', role: '', mission: '', dialogue: '',
    facing: 'down', pose: 'idle', scale: 1, kind: 'villager', hidden: false,
    ...overrides,
    point: { ...overrides.point },
    appearance,
    design: {
      ...createMapOneNpcDesign(visualIndex, overrides.role ?? 'Người dân', 'Nhân vật của map khởi đầu'),
      skinTone: appearance.skin, eyeShape: appearance.eyes, hairColor: appearance.hairColor,
      ...overrides.design,
    },
  };
}

export const DEFAULT_OPENING_MAP_NPCS: readonly OpeningMapNpc[] = [
  npc('memory-keeper', 0, {
    name: 'Bà mẹ quê', alias: 'Người giữ bến', locationLabel: 'Bến Thuyền', point: OPENING_MAP_MEMORY_KEEPER_HOME_POINT, kind: 'quest', pose: 'gossip',
    artwork: 'ba-me-que',
    schedule: schedule(
      { period: 'morning', activity: 'Ngồi trên chiếu rách ngoài hiên, gỡ từng nút rối trên tấm lưới và lo lắng nhìn ra sông.', dialogue: 'Dân làng còn lênh đênh ngoài kia… bà chỉ mong mọi người được bình an.', pose: 'gossip' },
      { period: 'noon', activity: 'Lom khom nhóm bếp củi ẩm, nấu cháo loãng với rau đắng ven bờ.', dialogue: 'Tiểu Mông, con quạt giúp bà một tay nhé. Bếp củi ẩm quá!', pose: 'stir' },
      { period: 'evening', activity: 'Thắp đèn dầu, ngồi khâu lại vành áo vá bên hiên nhà.', dialogue: 'Đêm xuống rồi, nếu mỏi chân con cứ nghỉ trên chõng tre nhé.', pose: 'idle' },
    ),
    role: 'Người mẹ già bám trụ bên bến sông trong mái tranh vách nứa. Hiên nhà có giàn phơi lưới, chum nước mưa, bàn thờ nhỏ và chiếc chõng tre để nghỉ qua đêm.',
    mission: 'GIAO HÀNG',
    dialogue: 'Nhà bà ở bờ sông phía làng, ngay trước Chốt Chặn. Khi mỏi chân, con có thể nghỉ trên chõng tre ngoài hiên. Chuyến hàng của làng đang bị chặn; mang giúp bà tới tiệm của Giao ở Chợ Nhỏ nhé.',
    appearance: { gender: 'female', hair: 'bun', accessory: 'none', skin: 'tan', eyes: 'smile' },
    design: { bodyType: 'elderly-bent', height: .84, shoulderWidth: .88, bodyWidth: .92, posture: 'stooped', hairstyle: 'silver-bun', faceShape: 'wrinkled', skinTone: 'tan', eyeShape: 'smile', facialMarks: ['wrinkle'], eyebrowShape: 'silver', beardStyle: 'none', outfit: 'elder-cloak', outfitColor: '#756a4c', accentColor: '#b7a78a', trouserColor: '#45413b', accessory: 'none', weapon: 'walking-staff', heldItem: 'none', animationSet: 'storytelling', occupation: 'Người giữ bến thuyền', historicalRole: 'Nhân vật hư cấu dẫn dắt đời sống dân làng' },
  }),
  npc('fisherman-tao', 1, {
    name: 'Tảo', alias: 'Ngư dân', locationLabel: 'Bến Cá Ngạnh', point: { x: 2970, y: 1320 }, pose: 'carry',
    artwork: 'tao',
    schedule: schedule(
      { period: 'morning', activity: 'Kiễng chân trên mỏm đá, vung cần tre câu cá rồi gỡ cá vào giỏ.', dialogue: 'Cá Cóc Sông Đáy cắn câu rồi! Để ta gỡ cho, con đứng tránh mép đá nhé.', pose: 'offer' },
      { period: 'noon', activity: 'Ngồi dưới bóng cây vối, lóc vảy cá và đan lại bẫy tre bên lều.', dialogue: 'Nhìn dòng nước mà đoán xoáy, đừng chỉ nhìn mặt sông. Ta chỉ con cách xem nhé.', pose: 'carry' },
      { period: 'evening', activity: 'Thu dọn ngư cụ, buộc thuyền vào cọc rồi nghỉ trong lều cọ.', dialogue: 'Khò… khò… sáng mai ta lại ra bến. Có việc gì thì đợi ta thức nhé.', pose: 'idle' },
    ),
    role: 'Ngư dân sống trong lều cọc tre sát mép nước, dưới bóng cây vối. Giỏ cá, đó lươn và thớt mổ cá luôn đặt quanh bãi cát đầy vỏ ốc.',
    mission: 'Câu cá, thu thập nguyên liệu và chế tạo Bẫy Tre Gai.',
    dialogue: 'Ta là Tảo. Lều dựng trên gò đất cao, ngay khúc nước xoáy. Cứ xem thớt gỗ và đống tre cạnh lều; ở đây ta chỉ cách câu cá, làm mồi và ghép bẫy.',
    appearance: { gender: 'male', hair: 'topknot', accessory: 'none', skin: 'bronze', outfit: 'baba' },
    design: { bodyType: 'strong-arms', height: .98, shoulderWidth: 1.1, bodyWidth: 1.03, posture: 'relaxed', hairstyle: 'wrapped-knot', faceShape: 'square', skinTone: 'bronze', eyebrowShape: 'strong', beardStyle: 'short', outfit: 'river-tunic', outfitColor: '#8a694f', accentColor: '#c8b587', trouserColor: '#4c4b40', accessory: 'headband', weapon: 'paddle', heldItem: 'rope', animationSet: 'paddling', occupation: 'Thợ chài', historicalRole: 'Nhân vật hư cấu hướng dẫn đường sông' },
  }),
  npc('woman-general', 2, {
    name: 'Võ Sư Nương', alias: 'Trưởng khu võ', locationLabel: 'Khu Luyện Võ', point: { x: 2160, y: 610 }, kind: 'quest', pose: 'cheer',
    artwork: 'vo-su-nuong',
    schedule: schedule(
      { period: 'morning', activity: 'Luyện mộc đao dưới gốc đa; vài đứa trẻ đứng xem bên sân đất.', dialogue: 'Đứng cho vững! Đường đao phải dứt khoát, đừng để bụi đất làm con mất tập trung.', pose: 'cheer' },
      { period: 'noon', activity: 'Kẹp thỏi quặng đỏ trên đe, dập búa rèn vũ khí ở sân luyện.', dialogue: 'Canh đúng nhịp rồi hãy dập búa. Gõ lệch là phải nung lại đấy!', pose: 'stir' },
      { period: 'evening', activity: 'Lau chùi đao kiếm dưới gốc đa, chờ người đến xin chỉ giáo.', dialogue: 'Muốn học Rái Cá Quần Thủy thì bước vào sân. Ta sẽ không nương tay đâu.', pose: 'idle' },
    ),
    role: 'Võ sư ở căn nhà sàn gỗ tạp dưới tán đa cổ thụ. Sân đất nện có cọc tre tập thân pháp, giá binh khí gỗ và bệ đá mài kiếm.',
    mission: 'Huấn luyện thân pháp, thử thách đấu tập và rèn vũ khí.',
    dialogue: 'Sân đất này được nện cho chắc chân. Cọc tre dùng tập né đòn, còn binh khí gỗ ở hiên chỉ để luyện. Muốn học cách đánh thật, trước hết hãy bước vào sân đấu tập.',
    appearance: { gender: 'female', hair: 'ponytail', skin: 'honey', accessory: 'none' },
    design: { bodyType: 'athletic', height: 1.03, shoulderWidth: 1.04, bodyWidth: .98, posture: 'ready', hairstyle: 'low-ponytail', faceShape: 'angular', skinTone: 'honey', beardStyle: 'none', outfit: 'light-armor', outfitColor: '#4b536b', accentColor: '#c4a26a', trouserColor: '#45404a', accessory: 'wrist-wrap', weapon: 'practice-sword', heldItem: 'none', animationSet: 'practice', occupation: 'Võ sư', historicalRole: 'Nhân vật hư cấu bí mật huấn luyện thanh niên' },
  }),
  npc('messenger', 3, {
    name: 'Giao', alias: 'Chủ tiệm kiêm giao liên', locationLabel: 'Chợ Nhỏ', point: { x: 2500, y: 1535 }, kind: 'quest', pose: 'complain',
    artwork: 'giao',
    schedule: schedule(
      { period: 'morning', activity: 'Trải cót bày khoai, rau muống và hũ muối; mắt liên tục ngó quanh xem lính tuần.', dialogue: 'Mua gì thì cứ xem hàng… nhưng nói nhỏ thôi, ngoài đường có lính tuần đấy.', pose: 'complain' },
      { period: 'noon', activity: 'Ngồi quạt mo cau đuổi ruồi, rao hàng và dò hỏi tin tức khách qua chợ.', dialogue: 'Khoai mới đây! Mà này, dạo gần đây con có thấy toán lính nào đi về phía cầu không?', pose: 'offer' },
      { period: 'evening', activity: 'Đóng sạp sớm, kéo bạt che kín rồi lén kiểm sổ trong căn kho sau.', dialogue: 'Cửa tiệm đóng rồi. Nếu có chuyện mật, gõ cửa kho sau ba tiếng nhé.', pose: 'gossip' },
    ),
    role: 'Chủ tiệm tạp hóa ở khúc quẹo ngã ba chợ. Sau sạp mái ngói cũ là căn buồng kín cất thuốc Nam, dây thừng và mật thư.',
    mission: 'NHẬN NHIỆM VỤ: ĐƯA THƯ',
    dialogue: 'Sạp ngoài này bán muối, cá khô và thuốc Nam. Chuyện kín thì vào buồng sau nói nhỏ; có những lá thư không thể để quan quân nhìn thấy.',
    appearance: { gender: 'male', hair: 'short', skin: 'tan', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'lean', height: 1.02, shoulderWidth: .86, bodyWidth: .88, posture: 'leaning', hairstyle: 'messy-short', skinTone: 'tan', facialMarks: ['cheek-mark'], beardStyle: 'none', outfit: 'messenger-vest', outfitColor: '#706144', accentColor: '#b7a78a', trouserColor: '#3e4342', accessory: 'shoulder-sash', weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'resting', occupation: 'Giao liên', historicalRole: 'Nhân vật hư cấu chuyển tin bí mật tới Mê Linh' },
  }),
  npc('gate-guard', 4, {
    name: 'Trưởng Đội Tuần Tra', alias: 'Mini-Boss', locationLabel: 'Chốt Chặn', point: { x: 3050, y: 1500 }, kind: 'guard', pose: 'order', facing: 'left',
    artwork: 'truong-doi-tuan-tra',
    schedule: [
      { period: 'morning', activity: 'Mặc giáp sắt đứng chặn đầu cầu, quát tháo dân làng và kiểm tra giấy qua đường.', dialogue: 'Đứng lại! Giấy thông hành đâu? Qua cầu phải nộp thuế!', pose: 'order' },
      { period: 'noon', activity: 'Tiếp tục canh gác giữa cầu, lục soát người qua lại và thu thuế.', dialogue: 'Không có giấy thì quay về. Đừng hòng lén qua mắt ta!', pose: 'order' },
      { period: 'evening', activity: 'Hai lính nhóm lửa trại ở đầu cầu; hắn uống rượu, cười lớn nhưng vẫn thủ thế.', dialogue: 'Ha! Muốn qua chốt thì cứ bước lên đây. Ta sẽ cho ngươi biết tay!', pose: 'order' },
    ],
    role: 'Trưởng đội đóng tại trạm canh đầu cầu gỗ. Rào cọc tre bịt sắt, bàn kiểm giấy và giá giáo mác khóa lối ra khỏi thung lũng.',
    mission: 'Cửa ải cuối: chuẩn bị bí kíp và Bẫy Tre Gai trước khi phá chốt.',
    dialogue: 'Dừng lại! Cầu gỗ đã bị chặn bằng cọc nhọn. Giấy thông hành để trên bàn; kẻ nào tự tiện qua sẽ phải đối mặt với đội tuần tra.',
    appearance: { gender: 'male', hair: 'topknot', skin: 'tan', accessory: 'none' },
    design: { bodyType: 'broad-shouldered', height: 1.02, shoulderWidth: 1.12, bodyWidth: 1.06, posture: 'alert', hairstyle: 'warrior-knot', faceShape: 'square', skinTone: 'tan', eyebrowShape: 'angled', mouthShape: 'stern', beardStyle: 'short', outfit: 'guard-armor', outfitColor: '#425b79', accentColor: '#d5a74e', trouserColor: '#393e49', accessory: 'shoulder-guard', weapon: 'spear', heldItem: 'none', animationSet: 'guarding', occupation: 'Trưởng đội tuần tra', historicalRole: 'Nhân vật phản diện hư cấu trong nhiệm vụ game' },
  }),
  npc('herbalist-lang', 5, {
    name: 'Lão Lang Trung', alias: 'Thầy thuốc Nam', locationLabel: 'Hiệu thuốc Nam', point: { x: 1650, y: 1500 }, kind: 'quest', pose: 'offer',
    artwork: 'lao-lang-trung',
    role: 'Thầy thuốc trong làng, bốc thuốc và chữa bệnh bằng dược liệu ven sông.',
    mission: 'Tìm Xuyên Khung ven bờ suối; mang về để nhận thuốc tăng Khí Huyết và mở công thức dược liệu.',
    dialogue: 'Này tiểu tử, qua đây ta bảo! Ta cần Xuyên Khung ven bờ suối. Tìm được mang về, ta sẽ bốc thuốc bồi bổ cho con.',
    appearance: { gender: 'male', hair: 'topknot', skin: 'tan', eyes: 'smile', outfit: 'baba', accessory: 'moqua' },
    design: { bodyType: 'elderly-bent', posture: 'stooped', hairstyle: 'gray-topknot', faceShape: 'wrinkled', skinTone: 'tan', eyebrowShape: 'silver', beardStyle: 'gray-long', outfit: 'healer-robe', outfitColor: '#647a58', accentColor: '#d5bf84', trouserColor: '#45463b', accessory: 'herb-pouch', weapon: 'medicine-bag', heldItem: 'herbs', animationSet: 'healing', occupation: 'Thầy thuốc Nam', historicalRole: 'Thầy thuốc dân gian của thôn Mê Linh' },
  }),
  npc('inn-server', 6, {
    name: 'Tiểu Nhị Quán Rạp', alias: 'Tiểu nhị', locationLabel: 'Quán Rạp', point: { x: 2350, y: 1810 }, kind: 'merchant', pose: 'cheer',
    artwork: 'tieu-nhi-quan-rap',
    role: 'Tiểu nhị quán cơm nước ven đường, bán cháo nóng và nghe ngóng chuyện trong vùng.',
    mission: 'Bán cháo hồi phục Thể lực và tin đồn về lịch tuần tra của lính Đông Hán.',
    dialogue: 'Đói bụng chưa đại hiệp? Vào làm bát cháo nóng, trà thơm rồi nghe ngóng tin tức thời cục!',
    appearance: { gender: 'male', hair: 'short', skin: 'honey', eyes: 'smile', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'soft-middle', posture: 'working', hairstyle: 'cropped', faceShape: 'round', skinTone: 'honey', eyebrowShape: 'soft', beardStyle: 'none', outfit: 'market-wrap', outfitColor: '#9a6242', accentColor: '#e0c58c', trouserColor: '#49423b', accessory: 'cloth-tie', weapon: 'none', heldItem: 'serving-tray', animationSet: 'trading', occupation: 'Tiểu nhị quán ăn', historicalRole: 'Người bán đồ ăn và tin đồn' },
  }),
  npc('fruit-aunt-tu', 7, {
    name: 'Thím Tư', alias: 'Người bán trái cây', locationLabel: 'Sạp Trái Cây', point: { x: 2140, y: 1420 }, kind: 'merchant', pose: 'offer',
    artwork: 'thim-tu',
    role: 'Tiểu thương miền sông nước, bán trái cây theo mùa bên đôi quang gánh.',
    mission: 'Mua trái cây để hồi phục Nội lực hoặc tặng nhân vật trong làng tăng Hảo cảm.',
    dialogue: 'Mới hái sáng nay ngọt lịm đây con ơi! Ghé làm ít quả mang theo đường đi xa đi.',
    appearance: { gender: 'female', hair: 'bun', skin: 'tan', eyes: 'smile', outfit: 'tuthan', accessory: 'quaithao' },
    design: { bodyType: 'soft-middle', posture: 'relaxed', hairstyle: 'low-bun', faceShape: 'round', skinTone: 'tan', eyebrowShape: 'arched', beardStyle: 'none', outfit: 'market-wrap', outfitColor: '#9b5b39', accentColor: '#d8b96d', trouserColor: '#4b4a3e', accessory: 'woven-basket', weapon: 'grain-basket', heldItem: 'woven-basket', animationSet: 'trading', occupation: 'Tiểu thương trái cây', historicalRole: 'Người buôn bán nông sản theo mùa' },
  }),
  npc('smith-thiet-chuy', 8, {
    name: 'Thiết Chủy', alias: 'Thợ rèn làng', locationLabel: 'Lò Rèn', point: { x: 2670, y: 1550 }, kind: 'quest', pose: 'stir',
    artwork: 'thiet-chuy',
    role: 'Thợ rèn chính của làng, sửa công cụ và đúc vũ khí cận chiến.',
    mission: 'Tìm quặng sắt ở mỏm đá suối nguồn để mở tính năng cường hóa trang bị.',
    dialogue: 'Vũ khí mẻ rồi à? Muốn đao kiếm bén ngọt thì mang quặng tới đây ta đúc lại cho!',
    appearance: { gender: 'male', hair: 'topknot', skin: 'bronze', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'strong-arms', posture: 'working', hairstyle: 'wrapped-knot', faceShape: 'square', skinTone: 'bronze', eyebrowShape: 'strong', beardStyle: 'short', outfit: 'smith-apron', outfitColor: '#665348', accentColor: '#d18b51', trouserColor: '#393b3b', accessory: 'wrist-wrap', weapon: 'hammer', heldItem: 'iron-bar', animationSet: 'hammering', occupation: 'Thợ rèn', historicalRole: 'Thợ thủ công rèn công cụ và vũ khí' },
  }),
  npc('woodcutter', 9, {
    name: 'Lão Tiều Phu', alias: 'Người đốn củi', locationLabel: 'Rìa Rừng Tre', point: { x: 1000, y: 1330 }, kind: 'quest', pose: 'carry',
    artwork: 'lao-tieu-phu',
    role: 'Tiều phu vùng ven rừng, am hiểu đường mòn, bẫy thú và gỗ quý.',
    mission: 'Giúp dọn bầy sói hoang hoặc tìm gỗ quý để học kỹ năng sinh tồn và chế tạo vật dụng.',
    dialogue: 'Đường mòn phía tây lính gác dữ lắm, muốn qua rừng cẩn thận kẻo sập bẫy thú đấy nhóc!',
    appearance: { gender: 'male', hair: 'topknot', skin: 'tan', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'strong-arms', posture: 'relaxed', hairstyle: 'gray-topknot', faceShape: 'long', skinTone: 'tan', eyebrowShape: 'silver', beardStyle: 'gray-short', outfit: 'field-tunic', outfitColor: '#5d6845', accentColor: '#c4aa74', trouserColor: '#44443a', accessory: 'reed-hat', weapon: 'walking-staff', heldItem: 'rope', animationSet: 'fieldwork', occupation: 'Tiều phu', historicalRole: 'Người dẫn đường và dạy kỹ năng sinh tồn trong rừng' },
  }),
  npc('toy-seller', 10, {
    name: 'Tiểu Muội Bán Đồ Chơi', alias: 'Nghệ nhân tò he', locationLabel: 'Gian Hàng Đồ Chơi', point: { x: 1900, y: 1810 }, kind: 'merchant', pose: 'cheer',
    artwork: 'tieu-muoi-ban-do-choi',
    role: 'Nghệ nhân dân gian nặn tò he và làm đồ chơi trẻ em.',
    mission: 'Bán vật phẩm sưu tầm giúp tăng Ngộ tính và vận may.',
    dialogue: 'Đại hiệp ơi, mua cái quạt giấy hoặc tò he lấy may mắn khi hành tẩu đi!',
    appearance: { gender: 'female', hair: 'braid', skin: 'peach', eyes: 'sparkle', outfit: 'aodai', accessory: 'flower' },
    design: { bodyType: 'petite', posture: 'relaxed', hairstyle: 'double-braid', faceShape: 'round', skinTone: 'peach', eyebrowShape: 'soft', beardStyle: 'none', outfit: 'market-wrap', outfitColor: '#9b5260', accentColor: '#e2c47e', trouserColor: '#51404b', accessory: 'hairpin', weapon: 'none', heldItem: 'toy-kite', animationSet: 'trading', occupation: 'Nghệ nhân đồ chơi', historicalRole: 'Người làm tò he và đồ chơi dân gian' },
  }),
  npc('beggar-hac-lao', 11, {
    name: 'Hạc Lão', alias: 'Ẩn sĩ cải trang', locationLabel: 'Góc Tường Cũ', point: { x: 1780, y: 1500 }, kind: 'quest', pose: 'gossip',
    artwork: 'hac-lao',
    role: 'Kẻ hành khất bí ẩn, thực chất là võ lâm ẩn sĩ đang che giấu thân phận.',
    mission: 'Tặng bánh bao hoặc rượu ngon để mở chuỗi nhiệm vụ ẩn và nhận tâm pháp.',
    dialogue: 'Lại đây... ta thấy xương cốt con cốt cách thanh kỳ. Có muốn học một chiêu đả ngưu bái tướng không?',
    appearance: { gender: 'male', hair: 'topknot', skin: 'deep', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'elderly-bent', posture: 'stooped', hairstyle: 'gray-topknot', faceShape: 'wrinkled', skinTone: 'deep', eyebrowShape: 'silver', beardStyle: 'gray-long', outfit: 'elder-cloak', outfitColor: '#565045', accentColor: '#9c8b67', trouserColor: '#373736', accessory: 'headscarf', weapon: 'walking-staff', heldItem: 'water-bowl', animationSet: 'storytelling', occupation: 'Kẻ hành khất', historicalRole: 'Võ lâm ẩn sĩ cải trang' },
  }),
  npc('singer-le-nuong', 12, {
    name: 'Lệ Nương', alias: 'Chủ tửu lâu', locationLabel: 'Tửu Lâu', point: { x: 2540, y: 1700 }, kind: 'quest', pose: 'offer',
    artwork: 'le-nuong',
    role: 'Chủ tửu lâu, cô nương gảy đàn tranh và thu thập tin tình báo vùng biên ải.',
    mission: 'Nhận nhiệm vụ thăm dò tình báo triều đình, tăng Mị lực và mở nhánh lựa chọn cốt truyện.',
    dialogue: 'Khách quan trông có vẻ ưu tư thế, lên lầu uống ly rượu giải khuây cùng thiếp đi...',
    appearance: { gender: 'female', hair: 'long', skin: 'honey', eyes: 'almond', outfit: 'aodai', accessory: 'flower' },
    design: { bodyType: 'stately', posture: 'calm', hairstyle: 'loose-wave', faceShape: 'oval', skinTone: 'honey', eyebrowShape: 'arched', beardStyle: 'none', outfit: 'noble-robe', outfitColor: '#71495e', accentColor: '#d6bd7e', trouserColor: '#47414a', accessory: 'hairpin', weapon: 'none', heldItem: 'none', animationSet: 'storytelling', occupation: 'Chủ tửu lâu, nghệ nhân đàn tranh', historicalRole: 'Người nắm tin tức vùng biên ải' },
  }),
  npc('herdboy-a-sang', 13, {
    name: 'A Sáng', alias: 'Thiếu niên chăn trâu', locationLabel: 'Đồng Cỏ Phía Bắc', point: { x: 2160, y: 810 }, kind: 'villager', pose: 'cheer',
    artwork: 'a-sang',
    role: 'Thiếu niên chăn trâu, thuộc mọi ngóc ngách và đường tắt quanh thôn.',
    mission: 'Nhận tin đường tắt miễn phí để né trạm kiểm soát của quân Đông Hán.',
    dialogue: 'Anh Tiểu Mông ơi! Tránh đường chính ra, mấy tên lính đồn trú đang lập chốt khám xét ở cầu gỗ đấy!',
    appearance: { gender: 'male', hair: 'short', skin: 'honey', eyes: 'smile', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'child', posture: 'relaxed', hairstyle: 'child-crop', faceShape: 'child', skinTone: 'honey', eyebrowShape: 'soft', beardStyle: 'none', outfit: 'child-tunic', outfitColor: '#53775b', accentColor: '#d6bc79', trouserColor: '#4a4940', accessory: 'cloth-tie', weapon: 'none', heldItem: 'horse-reins', animationSet: 'resting', occupation: 'Trẻ chăn trâu', historicalRole: 'Người dẫn đường tắt trong thôn' },
  }),
  npc('village-captain', 14, {
    name: 'Đội Trưởng Hộ Vệ Làng', alias: 'Đội trưởng dân binh', locationLabel: 'Cổng Làng', point: { x: 2840, y: 1650 }, kind: 'quest', pose: 'order',
    artwork: 'doi-truong-ho-vuong-lang',
    role: 'Võ quan địa phương cố giữ bình yên cho dân làng giữa áp lực của triều đình.',
    mission: 'Truy bắt băng cướp quấy rối dân làng để nhận điểm Chính đạo và trang phục phòng thủ.',
    dialogue: 'Dạo này trộm cắp và tà giáo lộng hành, thanh niên như cậu ra đường nhớ cẩn thận thân mình!',
    appearance: { gender: 'male', hair: 'topknot', skin: 'tan', outfit: 'nguthan', accessory: 'khandong' },
    design: { bodyType: 'broad-shouldered', posture: 'alert', hairstyle: 'warrior-knot', faceShape: 'square', skinTone: 'tan', eyebrowShape: 'angled', mouthShape: 'stern', beardStyle: 'short', outfit: 'guard-armor', outfitColor: '#576276', accentColor: '#c7a466', trouserColor: '#3e4348', accessory: 'shoulder-guard', weapon: 'spear', heldItem: 'none', animationSet: 'commanding', occupation: 'Đội trưởng hộ vệ làng', historicalRole: 'Người giữ trật tự địa phương' },
  }),
  npc('black-wolf', 15, {
    name: 'Hắc Lang', alias: 'Đầu đảng trộm cắp', locationLabel: 'Lều Rách Sau Kho', point: { x: 1360, y: 1810 }, kind: 'quest', pose: 'gossip',
    artwork: 'hac-lang',
    role: 'Kẻ cầm đầu băng trộm ẩn danh, nấp trong góc kho cũ phía tây làng.',
    mission: 'Manh mối về bản đồ nhà cửa, mật thư và những chuyến hàng bị đánh cắp.',
    dialogue: 'Chỗ này chẳng có gì đáng xem. Đừng động vào những tờ giấy trên bàn nếu ngươi còn muốn yên thân.',
    appearance: { gender: 'male', hair: 'short', skin: 'tan', eyes: 'almond', outfit: 'baba', accessory: 'moqua' },
    design: { bodyType: 'lean', posture: 'leaning', hairstyle: 'messy-short', faceShape: 'angular', skinTone: 'tan', eyebrowShape: 'angled', mouthShape: 'stern', facialMarks: ['scar'], beardStyle: 'sparse', outfit: 'crossed-wrap', outfitColor: '#343b3c', accentColor: '#874842', trouserColor: '#333436', accessory: 'headscarf', weapon: 'practice-sword', heldItem: 'bamboo-tablet', animationSet: 'guarding', occupation: 'Đầu đảng trộm cắp', historicalRole: 'Kẻ cầm đầu băng trộm ẩn danh' },
  }),
  npc('poison-witch', 16, {
    name: 'Mụ Độc Bà', alias: 'Thầy pháp luyện độc', locationLabel: 'Hang Đầm Lầy', point: { x: 520, y: 1710 }, kind: 'quest', pose: 'stir',
    artwork: 'mu-doc-ba',
    role: 'Ẩn cư trong hang đá giữa vùng đầm lầy, chuyên nhận biết cây thuốc và bào chế độc dược.',
    mission: 'Nhận diện dược liệu lạ và tìm hiểu các dấu vết quanh đầm lầy.',
    dialogue: 'Đừng giẫm lên bụi cỏ kia. Vạc thuốc còn đang sôi; muốn hỏi gì thì đứng ngoài vạch đá.',
    appearance: { gender: 'female', hair: 'bun', skin: 'deep', eyes: 'almond', outfit: 'baba', accessory: 'moqua' },
    design: { bodyType: 'elderly-bent', posture: 'stooped', hairstyle: 'elder-wrap', faceShape: 'wrinkled', skinTone: 'deep', eyebrowShape: 'silver', mouthShape: 'downturned', facialMarks: ['wrinkle'], beardStyle: 'none', outfit: 'elder-cloak', outfitColor: '#49464b', accentColor: '#766080', trouserColor: '#34363a', accessory: 'headscarf', weapon: 'medicine-bag', heldItem: 'medicine-bottle', animationSet: 'healing', occupation: 'Thầy pháp luyện độc', historicalRole: 'Người am hiểu dược liệu và cây độc vùng đầm lầy' },
  }),
  npc('double-agent-acau', 17, {
    name: 'A Cẩu', alias: 'Kẻ chỉ điểm hai mang', locationLabel: 'Gầm Cầu Gỗ', point: { x: 3010, y: 1830 }, kind: 'quest', pose: 'gossip',
    artwork: 'a-cau',
    role: 'Kẻ chỉ điểm sống quanh trạm gác, lén ghi chép tin tức người qua cầu.',
    mission: 'Lần theo những mẩu ghi chép đáng ngờ quanh chân cầu.',
    dialogue: 'Ta chỉ ngồi tránh mưa thôi. Cái túi kia? Đồ nhặt được, chẳng liên quan đến ai cả.',
    appearance: { gender: 'male', hair: 'short', skin: 'tan', eyes: 'almond', outfit: 'baba', accessory: 'none' },
    design: { bodyType: 'short-sturdy', posture: 'leaning', hairstyle: 'messy-short', faceShape: 'long', skinTone: 'tan', eyebrowShape: 'straight', mouthShape: 'downturned', facialMarks: ['cheek-mark'], beardStyle: 'sparse', outfit: 'crossed-wrap', outfitColor: '#554b3d', accentColor: '#8b7654', trouserColor: '#383b39', accessory: 'shoulder-sash', weapon: 'none', heldItem: 'bamboo-tablet', animationSet: 'resting', occupation: 'Kẻ chỉ điểm', historicalRole: 'Điệp viên hai mang trà trộn gần trạm gác' },
  }),
  npc('blood-blade-phuong', 18, {
    name: 'Huyết Đao Phượng', alias: 'Nữ sát thủ lưu vong', locationLabel: 'Vách Đá Biên Giới', point: { x: 1110, y: 865 }, kind: 'quest', pose: 'order',
    artwork: 'huyet-dao-phuong',
    role: 'Nữ võ khách lưu vong trú tạm dưới mái đá nơi rìa rừng.',
    mission: 'Tìm hiểu dấu vết giao đấu và thanh đao bị bỏ lại trên vách đá.',
    dialogue: 'Gió ở đây đủ lạnh để làm người ta tỉnh táo. Đừng chạm vào thanh đao của ta.',
    appearance: { gender: 'female', hair: 'ponytail', skin: 'honey', eyes: 'almond', outfit: 'forest', accessory: 'none' },
    design: { bodyType: 'athletic', posture: 'ready', hairstyle: 'low-ponytail', faceShape: 'angular', skinTone: 'honey', eyebrowShape: 'angled', mouthShape: 'stern', facialMarks: ['scar'], beardStyle: 'none', outfit: 'light-armor', outfitColor: '#593c43', accentColor: '#b64a43', trouserColor: '#34373e', accessory: 'headband', weapon: 'practice-sword', heldItem: 'none', animationSet: 'practice', occupation: 'Nữ sát thủ lưu vong', historicalRole: 'Võ khách bí ẩn ở ranh giới rừng sâu' },
  }),
  npc('tax-official-trieu', 19, {
    name: 'Quản Gia Triệu', alias: 'Tay sai quan huyện Đông Hán', locationLabel: 'Trạm Thu Thuế', point: { x: 2780, y: 1160 }, kind: 'quest', pose: 'order',
    artwork: 'quan-gia-trieu',
    role: 'Quan lại phụ trách sổ sách thu thuế tại trạm hành chính gần cổng làng.',
    mission: 'Gặp Quản Gia Triệu tại trạm thu thuế để dò xét sổ sách và lệnh thu.',
    dialogue: 'Sổ thuế phải đủ từng đồng. Muốn hỏi việc công, hãy trình giấy qua trạm.',
    appearance: { gender: 'male', hair: 'topknot', skin: 'tan', eyes: 'almond', outfit: 'aodai', accessory: 'khandong' },
    design: { bodyType: 'stately', posture: 'upright', hairstyle: 'topknot', faceShape: 'long', skinTone: 'tan', eyebrowShape: 'strong', mouthShape: 'stern', beardStyle: 'short', outfit: 'noble-robe', outfitColor: '#51434a', accentColor: '#c49a50', trouserColor: '#38373d', accessory: 'cloth-tie', weapon: 'scroll', heldItem: 'bamboo-tablet', animationSet: 'commanding', occupation: 'Quản gia trạm thu thuế', historicalRole: 'Tay sai của quan huyện Đông Hán' },
  }),
];
export const OPENING_MAP_NPCS = DEFAULT_OPENING_MAP_NPCS;

let sourceOverrides: unknown = sourceNpcOverrides;
function sourceCharacters(): MapCharacterDraft[] {
  const entries = sourceOverrides && typeof sourceOverrides === 'object' && !Array.isArray(sourceOverrides)
    ? Object.values(sourceOverrides) : sourceOverrides;
  return parseMapCharacterDraft(entries ?? []).filter(item => item.mapId === OPENING_MAP_ID);
}

/** Includes hidden records so the designer can restore NPCs hidden in source. */
export function resolveOpeningMapNpcRecords(drafts?: readonly MapCharacterDraft[]): OpeningMapNpc[] {
  let browserDrafts = drafts;
  if (!browserDrafts) {
    try { browserDrafts = readMapCharacterDraft(); } catch { browserDrafts = []; }
  }
  const records = new Map(DEFAULT_OPENING_MAP_NPCS.map(item => [item.id, item]));
  for (const entry of [...sourceCharacters(), ...browserDrafts]) {
    if (entry.mapId !== OPENING_MAP_ID || !OPENING_MAP_NPC_IDS.includes(entry.id as typeof OPENING_MAP_NPC_IDS[number])) continue;
    const base = records.get(entry.id);
    const design = entry.design ?? base?.design ?? createMapOneNpcDesign(0, entry.role ?? 'Người dân', 'Nhân vật được tạo trong tool');
    records.set(entry.id, {
      alias: '', locationLabel: '', role: '', mission: '', dialogue: '', facing: 'down', pose: 'idle', scale: 1, kind: 'villager', hidden: false,
      ...base, ...entry, mapId: OPENING_MAP_ID, appearance: { ...(base?.appearance ?? DEFAULT_APPEARANCES.female), ...entry.appearance }, design,
    });
  }
  return [...records.values()].map(record => {
    if (record.id !== 'memory-keeper') return record;
    const isLegacyLocation = (record.point.x === LEGACY_MEMORY_KEEPER_POINT.x && record.point.y === LEGACY_MEMORY_KEEPER_POINT.y)
      || (record.point.x === PREVIOUS_MEMORY_KEEPER_DOCK_POINT.x && record.point.y === PREVIOUS_MEMORY_KEEPER_DOCK_POINT.y);
    const point = isLegacyLocation ? OPENING_MAP_MEMORY_KEEPER_HOME_POINT : record.point;
    return {
      ...record,
      name: record.name === 'Ba Mẹ Quế' ? 'Bà mẹ quê' : record.name,
      point,
    };
  });
}

export function resolveOpeningMapNpcs(drafts?: readonly MapCharacterDraft[]): OpeningMapNpc[] {
  return resolveOpeningMapNpcRecords(drafts).filter(item => !item.hidden);
}

export function useOpeningMapNpcs(): OpeningMapNpc[] {
  const [characters, setCharacters] = useState(() => resolveOpeningMapNpcs());
  useEffect(() => {
    const refresh = () => setCharacters(resolveOpeningMapNpcs());
    const onStorage = (event: StorageEvent) => { if (!event.key || event.key === MAP_CHARACTER_DRAFT_KEY) refresh(); };
    window.addEventListener(MAP_CHARACTER_DRAFT_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(MAP_CHARACTER_DRAFT_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return characters;
}

if (import.meta.hot) import.meta.hot.accept('./openingMapNpcs.json', module => {
  if (!module) return;
  sourceOverrides = module.default;
  window.dispatchEvent(new Event(MAP_CHARACTER_DRAFT_EVENT));
});
