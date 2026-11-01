import { HISTORY_HEROES } from './suViet';
import type { HistoricalLandscape, WorldFeature, WorldFeatureInfo, WorldLocation } from './world';
import { MAP_ONE_LAYOUT_SCALE, mapOnePoint } from './mapOneMap';

export type HistoryMapTheme = HistoricalLandscape;

export interface HistoryMapDefinition {
  id: string;
  name: string;
  region: string;
  description: string;
  heroId: string;
  unlockAt: number;
  finalChallengeFame?: number;
  requiredMainCompletionRatio?: number;
  icon: string;
  theme: HistoryMapTheme;
  buildings: readonly {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    subtitle: string;
    color: string;
    roof: string;
  }[];
  landmarks: readonly WorldLocation[];
  portalPoint: { x: number; y: number };
}

export const HISTORY_MENU_PLACES = [
  { id: 'menu-atlas', name: 'Nhà bản đồ', action: 'Các bản đồ lịch sử', feature: 'help', point: { x: 425, y: 765 }, icon: '🧭' },
  { id: 'menu-collection', name: 'Nhà sưu tầm', action: 'Bộ sưu tập', feature: 'character', point: { x: 430, y: 890 }, icon: '📖' },
  { id: 'menu-achievements', name: 'Đình danh vọng', action: 'Danh vọng & thành tích', feature: 'achievements', point: { x: 625, y: 925 }, icon: '🏆' },
  { id: 'menu-backup', name: 'Nhà lưu niệm', action: 'Lưu hành trình', feature: 'backup', point: { x: 850, y: 855 }, icon: '💾' },
  { id: 'menu-settings', name: 'Góc nghỉ chân', action: 'Cài đặt', feature: 'help', point: { x: 1000, y: 690 }, icon: '⚙️' },
  { id: 'menu-character', name: 'Tiệm may xóm', action: 'Nhân vật & trang phục', feature: 'character', point: { x: 1225, y: 925 }, icon: '🧑' },
  { id: 'menu-exit', name: 'Cổng về nhà', action: 'Thoát game', feature: 'help', point: { x: 420, y: 940 }, icon: '🚪' },
] as const;

export const SUVIET_FEATURE_LABELS: Partial<Record<WorldFeature, WorldFeatureInfo>> = {
  help: { title: 'Cổng xóm', activity: 'Gặp gỡ xóm làng', icon: '🚪', hint: 'Làm quen với các địa điểm và cách khám phá.' },
  achievements: { title: 'Đình làng', activity: 'Danh vọng', icon: '🏛️', hint: 'Xem cấp bậc và thành tích học sử.' },
  cards: { title: 'Quán nước', activity: 'Chơi UNO', icon: '🫖', hint: 'Nghỉ chân và đấu UNO vui cùng máy.' },
  character: { title: 'Nhà sưu tầm', activity: 'Bộ sưu tập', icon: '🪷', hint: 'Xem nhân vật, huy hiệu và trang phục.' },
  backup: { title: 'Ruộng lúa', activity: 'Sao lưu', icon: '💾', hint: 'Lưu hoặc khôi phục hành trình trong 5 ô.' },
  upgrades: { title: 'Hòm lưu niệm', activity: 'Sao lưu', icon: '💾', hint: 'Lưu hoặc khôi phục hành trình trong 5 ô.' },
  statistics: { title: 'Đình làng', activity: 'Danh vọng', icon: '🏛️', hint: 'Xem cấp bậc và thành tích học sử.' },
};

const maps: Omit<HistoryMapDefinition, 'landmarks' | 'portalPoint'>[] = [
  {
    id: 'hai-ba-trung', name: 'Mê Linh · Khởi nghĩa Hai Bà Trưng', region: 'Mê Linh · năm 40',
    description: 'Làng quê Mê Linh với sân đình, ruộng lúa, vườn rau, bến nước và lối vào khu tưởng niệm.',
    heroId: 'hai-ba-trung', unlockAt: 0, finalChallengeFame: 500, requiredMainCompletionRatio: 0.9, icon: '🌺', theme: 'me-linh',
    buildings: [
      { id: 'me-linh-den', x: 88, y: 125, width: 220, height: 165, title: 'ĐỀN TƯỞNG NIỆM', subtitle: 'Dấu ấn Hai Bà Trưng', color: '#e8c486', roof: '#9d4c38' },
      { id: 'me-linh-dinh', x: 385, y: 105, width: 210, height: 160, title: 'SÂN ĐÌNH', subtitle: 'Người kể chuyện', color: '#c4ce9c', roof: '#536f5d' },
      { id: 'me-linh-gate', x: 1120, y: 125, width: 220, height: 165, title: 'CỔNG LŨY TRE', subtitle: 'Lối vào Mê Linh', color: '#e2b87d', roof: '#a6523c' },
      { id: 'me-linh-house', x: 665, y: 120, width: 175, height: 140, title: 'NHÀ DÂN', subtitle: 'Mái tranh bên đường', color: '#dec996', roof: '#986449' },
      { id: 'me-linh-market', x: 900, y: 365, width: 190, height: 145, title: 'CHỢ QUÊ', subtitle: 'Sạp hàng của bà con', color: '#dfc795', roof: '#875545' },
      { id: 'me-linh-forge', x: 1180, y: 525, width: 170, height: 135, title: 'LÒ RÈN', subtitle: 'Sửa nông cụ', color: '#c8b08a', roof: '#665849' },
      { id: 'me-linh-granary', x: 855, y: 640, width: 190, height: 110, title: 'KHO LƯƠNG THỰC', subtitle: 'Khu chuẩn bị việc chung', color: '#dfc38d', roof: '#875541' },
      { id: 'me-linh-camp', x: 470, y: 765, width: 205, height: 145, title: 'KHU NGHĨA QUÂN', subtitle: 'Điểm sinh hoạt trong game', color: '#c4ce9c', roof: '#536f5d' },
      { id: 'me-linh-boatyard', x: 1180, y: 760, width: 170, height: 140, title: 'BẾN THUYỀN', subtitle: 'Bến nước làng quê', color: '#d8bd8c', roof: '#4d756e' },
    ],
  },
  {
    id: 'tran-hung-dao', name: 'Bạch Đằng · Thời Trần', region: 'Sông Bạch Đằng · năm 1288',
    description: 'Dòng sông uốn quanh bãi lau và bến thuyền xưa.',
    heroId: 'tran-hung-dao', unlockAt: 100, icon: '🌊', theme: 'bach-dang',
    buildings: [
      { id: 'bach-dang-den', x: 175, y: 100, width: 315, height: 220, title: 'ĐỀN TRẦN HƯNG ĐẠO', subtitle: 'Tưởng nhớ Quốc công Tiết chế', color: '#d8bd8c', roof: '#69584a' },
      { id: 'bach-dang-ben', x: 640, y: 115, width: 250, height: 205, title: 'BẾN BẠCH ĐẰNG', subtitle: 'Sông xưa kể chuyện', color: '#d7c8a2', roof: '#4d756e' },
      { id: 'bach-dang-dinh', x: 1030, y: 100, width: 255, height: 220, title: 'NHÀ THỦY ĐÌNH', subtitle: 'Hội làng bên sông', color: '#c5c99c', roof: '#526b68' },
    ],
  },
  {
    id: 'le-loi', name: 'Lam Sơn · Nghĩa quân áo vải', region: 'Lam Sơn · năm 1418',
    description: 'Đường rừng, mái nhà sàn và những triền núi xanh.',
    heroId: 'le-loi', unlockAt: 250, icon: '🏮', theme: 'lam-son',
    buildings: [
      { id: 'lam-son-nha', x: 170, y: 105, width: 320, height: 220, title: 'NHÀ LAM SƠN', subtitle: 'Đất khởi nghĩa xứ Thanh', color: '#d9bc82', roof: '#85543a' },
      { id: 'lam-son-dinh', x: 635, y: 100, width: 255, height: 220, title: 'ĐÌNH LAM KINH', subtitle: 'Dấu xưa triều Hậu Lê', color: '#c4c89d', roof: '#4f6858' },
      { id: 'lam-son-cua', x: 1030, y: 105, width: 255, height: 220, title: 'CỔNG ĐƯỜNG RỪNG', subtitle: 'Lối về bản làng', color: '#d8ba88', roof: '#8f5640' },
    ],
  },
  {
    id: 'quang-trung', name: 'Đống Đa · Mùa xuân Kỷ Dậu', region: 'Ngọc Hồi – Đống Đa · năm 1789',
    description: 'Sắc đào ngày xuân và sân đình rộn ràng hội làng.',
    heroId: 'quang-trung', unlockAt: 450, icon: '🌟', theme: 'dong-da',
    buildings: [
      { id: 'dong-da-den', x: 175, y: 100, width: 315, height: 220, title: 'GÒ ĐỐNG ĐA', subtitle: 'Địa danh lịch sử Thăng Long', color: '#e2c29a', roof: '#96503f' },
      { id: 'dong-da-dinh', x: 640, y: 100, width: 250, height: 220, title: 'ĐÌNH HỘI XUÂN', subtitle: 'Đào nở bên mái đình', color: '#e8c2a0', roof: '#a24f49' },
      { id: 'dong-da-cua', x: 1030, y: 105, width: 255, height: 220, title: 'CỔNG THĂNG LONG', subtitle: 'Lối vào kinh thành xưa', color: '#d7bb8e', roof: '#795644' },
    ],
  },
  {
    id: 'vo-nguyen-giap', name: 'Điện Biên · Hành trình tri ân', region: 'Điện Biên Phủ · năm 1954',
    description: 'Ruộng bậc thang, núi xa và không gian tưởng niệm thanh bình.',
    heroId: 'vo-nguyen-giap', unlockAt: 700, icon: '📚', theme: 'dien-bien',
    buildings: [
      { id: 'dien-bien-nha', x: 175, y: 100, width: 315, height: 220, title: 'NHÀ SÀN ĐIỆN BIÊN', subtitle: 'Nếp nhà vùng Tây Bắc', color: '#d8bb87', roof: '#76533d' },
      { id: 'dien-bien-dinh', x: 640, y: 100, width: 250, height: 220, title: 'NHÀ TƯỞNG NIỆM', subtitle: 'Tìm hiểu lịch sử, tri ân', color: '#d0c59d', roof: '#55695e' },
      { id: 'dien-bien-cong', x: 1030, y: 105, width: 255, height: 220, title: 'CỔNG BẢN MƯỜNG', subtitle: 'Đường lên miền Tây Bắc', color: '#c4c89e', roof: '#66764e' },
    ],
  },
];

export const HISTORY_MAPS: readonly HistoryMapDefinition[] = maps.map((map, index) => {
  const hero = HISTORY_HEROES.find(item => item.id === map.heroId)!;
  const next = maps[(index + 1) % maps.length];
  const historyLocation: WorldLocation = {
    id: `hero-${hero.id}`,
    name: hero.name,
    point: { x: 570, y: 550 },
    action: hero.id === 'hai-ba-trung' ? 'Gặp Hai Bà Trưng' : `Gặp ${hero.name}`,
    feature: 'help',
    dialogue: `🌿 ${hero.name}: ${hero.story}`,
  };
  const landmarks: WorldLocation[] = [
    { id: `gate-${map.id}`, name: map.buildings[0].title, point: { x: 520, y: 400 }, action: 'Nghe giới thiệu vùng đất', feature: 'help', dialogue: map.description },
    historyLocation,
    { id: `uno-${map.id}`, name: 'Quán nước', point: { x: 765, y: 679 }, action: 'Chơi UNO', feature: 'cards' },
    { id: `guide-${map.id}`, name: 'Góc hướng dẫn', point: { x: 445, y: 655 }, action: 'Xem hướng dẫn', feature: 'help' },
    ...HISTORY_MENU_PLACES.map(place => ({
      id: place.id,
      name: place.name,
      point: place.point,
      action: place.action,
      feature: place.feature,
    })),
    {
      id: `portal-${map.id}`,
      name: index === maps.length - 1 ? 'Cổng trở về Mê Linh' : `Lối sang ${next.region.split(' · ')[0]}`,
      point: { x: 1320, y: 720 },
      action: index === maps.length - 1 ? 'Trở về bản đồ đầu tiên' : `Mở lối sang ${next.region.split(' · ')[0]}`,
      feature: 'help',
      dialogue: `Lối đi tới ${next.name}.`,
      destinationMapId: next.id,
      unlockAt: next.unlockAt,
    },
    ...(map.id === 'hai-ba-trung' ? [
      { id: 'me-linh-trung-nhi', name: 'Trưng Nhị', point: { x: 680, y: 480 }, action: 'Gặp Trưng Nhị', dialogue: 'Trưng Nhị cùng Trưng Trắc gắn với cuộc khởi nghĩa năm 40. Hình ảnh nhân vật trong game là minh họa chibi.' },
      { id: 'me-linh-garden', name: 'Vườn rau', point: { x: 210, y: 520 }, action: 'Giúp chăm luống rau', dialogue: 'Người dân nhờ bạn góp tay chuẩn bị rau củ. Đây là hoạt động đời sống mô phỏng.' },
      { id: 'me-linh-well', name: 'Giếng làng', point: { x: 405, y: 745 }, action: 'Gánh nước tới sân đình', dialogue: 'Một việc nhỏ trong làng quê: giúp chuyển nước tới sân đình.' },
      { id: 'me-linh-farm', name: 'Ruộng lúa', point: { x: 420, y: 875 }, action: 'Góp sức ngoài đồng', dialogue: 'Giúp người dân chuẩn bị lương thực trong nhiệm vụ mô phỏng.' },
      { id: 'me-linh-market', name: 'Chợ quê', point: { x: 975, y: 545 }, action: 'Sắp xếp hàng ở chợ', dialogue: 'Cô bán hàng nhờ bạn sắp xếp vật dụng cho bà con.' },
      { id: 'me-linh-memory', name: 'Lều kể chuyện', point: { x: 605, y: 340 }, action: 'Nghe câu chuyện Thi Sách', dialogue: 'Người kể nhắc tới Thi Sách qua hồi ức. Đoạn hội thoại này là diễn giải trong game, không phải lời trích dẫn.' },
      { id: 'me-linh-family', name: 'Nhà dân', point: { x: 765, y: 625 }, action: 'Thăm hỏi gia đình', dialogue: 'Giúp gia đình đại diện trong tình tiết kết nối hư cấu.' },
      { id: 'me-linh-history-board', name: 'Bảng tư liệu', point: { x: 420, y: 420 }, action: 'Tìm hiểu bối cảnh cai trị', dialogue: 'Đọc phần tóm lược về bối cảnh nhà Hán; lời thoại nhân vật không thay cho sử liệu.' },
      { id: 'me-linh-granary', name: 'Kho lương thực', point: { x: 1090, y: 700 }, action: 'Chuyển gạo tới kho chung', dialogue: 'Đưa lương thực mô phỏng tới khu vực chuẩn bị việc chung.' },
      { id: 'me-linh-forge', name: 'Lò rèn', point: { x: 1255, y: 685 }, action: 'Nhận công cụ đã sửa', dialogue: 'Bác thợ rèn sửa nông cụ cho dân làng; game không mô phỏng chế tạo vũ khí.' },
      { id: 'me-linh-wharf', name: 'Bến nước', point: { x: 990, y: 835 }, action: 'Chuyển lời nhắn qua bến nước', dialogue: 'Người chèo đò hướng dẫn bạn chuyển lời nhắn trong tình tiết hư cấu.' },
      { id: 'me-linh-training', name: 'Sân luyện tập', point: { x: 785, y: 820 }, action: 'Tập hợp tại sân luyện tập', dialogue: 'Tham gia hoạt động di chuyển và hỗ trợ cộng đồng, không có mô phỏng bạo lực.' },
      { id: 'me-linh-le-chan', name: 'Nữ tướng Lê Chân', point: { x: 870, y: 850 }, action: 'Gặp nữ tướng Lê Chân', dialogue: 'Lê Chân gắn với truyền thống thờ Hai Bà Trưng. Hình ảnh và hội thoại trong game là minh họa, không phải lời trích dẫn.' },
      { id: 'me-linh-camp', name: 'Khu nghĩa quân', point: { x: 565, y: 900 }, action: 'Hỗ trợ khu nghĩa quân', dialogue: 'Đưa vật dụng cứu trợ tới khu sinh hoạt được dựng cho gameplay.' },
      { id: 'me-linh-boat-yard', name: 'Bến thuyền', point: { x: 1035, y: 915 }, action: 'Góp việc ở bến thuyền', dialogue: 'Giúp người dân chuẩn bị bến nước an toàn trong tình tiết mô phỏng.' },
      { id: 'me-linh-story-tent', name: 'Nhà kể chuyện', point: { x: 455, y: 600 }, action: 'Nghe kể về năm 40', dialogue: 'Người kể chuyện giúp bạn ôn lại mốc khởi nghĩa năm 40.' },
      { id: 'me-linh-memorial', name: 'Đền tưởng niệm', point: { x: 195, y: 365 }, action: 'Ôn lại dấu ấn Mê Linh', dialogue: 'Cùng Trưng Trắc nhìn lại vai trò lịch sử, diễn biến và ý nghĩa của cuộc khởi nghĩa.' },
      { id: 'me-linh-council', name: 'Sân đình', point: { x: 620, y: 400 }, action: 'Họp mặt ở sân đình', dialogue: 'Trưởng làng nhắc lại các chương chuyện và hướng dẫn thử thách cuối.' },
      { id: 'me-linh-hidden-drum', name: 'Bụi tre khuất', point: { x: 1340, y: 425 }, action: 'Tìm tiếng trống sau lũy tre', dialogue: 'Bạn phát hiện chiếc trống đạo cụ được cất trong góc khuất.' },
      { id: 'me-linh-hidden-flag', name: 'Lối mòn sau vườn', point: { x: 315, y: 590 }, action: 'Tìm những mảnh cờ nghĩa', dialogue: 'Một vài mảnh cờ trang trí bị gió thổi vào lối mòn.' },
      { id: 'me-linh-hidden-elder', name: 'Gốc đa cũ', point: { x: 135, y: 700 }, action: 'Nghe chuyện bà cụ bên vườn', dialogue: 'Bà cụ kể một câu chuyện gia đình hư cấu được truyền lại trong game.' },
      { id: 'me-linh-hidden-letter', name: 'Hốc đá cạnh bến', point: { x: 1260, y: 965 }, action: 'Tìm lá thư chưa gửi', dialogue: 'Bạn tìm thấy một lá thư đạo cụ; đây không phải văn thư lịch sử có thật.' },
      { id: 'me-linh-hidden-path', name: 'Lối nhỏ sau đình', point: { x: 560, y: 485 }, action: 'Tìm lối nhỏ của người đưa tin', dialogue: 'Bạn khám phá lối tắt bí mật dẫn quanh sân đình.' },
      { id: 'me-linh-hidden-memory', name: 'Góc lưu giữ vật dụng', point: { x: 880, y: 590 }, action: 'Gặp người giữ ký ức Mê Linh', dialogue: 'Bạn tìm đủ vật dụng truyền thống trong làng và mở một câu chuyện mở rộng.' },
      { id: 'me-linh-hidden-raider', name: 'Lối rừng an toàn', point: { x: 1370, y: 570 }, action: 'Giúp một gia đình tìm đường an toàn', dialogue: 'Một tình tiết hư cấu nhắc người chơi tìm lối đi an toàn, không mô tả giao tranh.' },
      { id: 'me-linh-kitchen', name: 'Bếp chung', point: { x: 1115, y: 460 }, action: 'Giúp chuẩn bị bữa ăn', dialogue: 'Người nấu bếp nhờ bạn chuẩn bị phần ăn trong một nhiệm vụ mô phỏng.' },
      { id: 'me-linh-horse-pen', name: 'Bãi ngựa', point: { x: 720, y: 910 }, action: 'Giúp chăm sóc ngựa', dialogue: 'Người chăm ngựa hướng dẫn chuẩn bị nước và vật dụng.' },
      { id: 'me-linh-gate-watch', name: 'Chòi canh lũy tre', point: { x: 1240, y: 370 }, action: 'Tìm hiểu lối đi an toàn quanh làng', dialogue: 'Người canh gác hướng dẫn đường đi trong tình tiết gameplay.' },
      { id: 'me-linh-care', name: 'Nhà chăm sóc', point: { x: 590, y: 715 }, action: 'Giúp người chăm sóc', dialogue: 'Giúp một nhân vật hư cấu nghỉ ngơi và nhận nước.' },
      { id: 'me-linh-child', name: 'Ngõ dân cư', point: { x: 350, y: 650 }, action: 'Nhận lời nhắn trong làng', dialogue: 'Một em nhỏ nhờ chuyển lời nhắn trong tình tiết game.' },
    ].map((location, index) => ({
      ...location,
      feature: 'help' as const,
      icon: location.id.startsWith('me-linh-hidden-') ? undefined : ['🌱', '💧', '🌾', '🧺', '📜', '🏡', '📚', '🌾', '🔨', '📨', '🏹', '🚩', '🛶', '📖', '🪷', '🏛️', '🍲', '🐎', '🛡️', '🩹', '📨'][index % 21],
      npcId: ({
        'me-linh-trung-nhi': 'trung-nhi',
        'hero-hai-ba-trung': 'trung-trac',
        'gate-hai-ba-trung': 'village-elder',
        'uno-hai-ba-trung': 'village-elder',
        'me-linh-market': 'market-vendor',
        'me-linh-memory': 'thi-sach-memory',
        'me-linh-history-board': 'han-official',
        'me-linh-farm': 'farmer',
        'me-linh-garden': 'farmer',
        'me-linh-well': 'village-elder',
        'me-linh-family': 'village-elder',
        'me-linh-forge': 'blacksmith',
        'me-linh-wharf': 'boat-person',
        'me-linh-boat-yard': 'messenger',
        'me-linh-training': 'woman-general',
        'me-linh-le-chan': 'lady-le-chan',
        'me-linh-story-tent': 'village-elder',
        'me-linh-council': 'village-elder',
        'me-linh-granary': 'farmer',
        'me-linh-kitchen': 'market-vendor',
        'me-linh-horse-pen': 'farmer',
        'me-linh-gate-watch': 'woman-general',
        'me-linh-care': 'village-elder',
        'me-linh-child': 'messenger',
        'me-linh-hidden-elder': 'village-elder',
        'me-linh-hidden-memory': 'village-elder',
      } as Record<string, string>)[location.id],
    })) : []),
  ];
  if (map.id === 'hai-ba-trung') {
    return {
      ...map,
      buildings: map.buildings.map(building => ({ ...building, x: building.x * MAP_ONE_LAYOUT_SCALE, y: building.y * MAP_ONE_LAYOUT_SCALE })),
      landmarks: landmarks.map(location => ({ ...location, point: mapOnePoint(location.point) })),
      portalPoint: mapOnePoint({ x: 1320, y: 720 }),
    };
  }
  return { ...map, landmarks, portalPoint: { x: 1320, y: 720 } };
});

export function historyMap(mapId: string): HistoryMapDefinition {
  return HISTORY_MAPS.find(map => map.id === mapId) ?? HISTORY_MAPS[0];
}

export function historyMapPositionKey(mapId: string): string {
  return `su-viet-hanh-trinh-world-position-${mapId}`;
}

export function historyMapPosition(mapId: string): { x: number; y: number } {
  const index = HISTORY_MAPS.findIndex(map => map.id === mapId);
  const spawns = [{ x: 480, y: 475 }, { x: 740, y: 500 }, { x: 500, y: 500 }, { x: 740, y: 500 }, { x: 740, y: 500 }] as const;
  const spawn = index < 0 ? spawns[0] : spawns[index];
  return mapId === 'hai-ba-trung' ? mapOnePoint(spawn) : spawn;
}
