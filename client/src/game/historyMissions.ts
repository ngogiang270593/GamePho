import { HISTORY_MAPS } from './suVietMap';
import { MAP_ONE_CHAPTER_MAIN_REQUIREMENTS, MAP_ONE_HIDDEN_MISSIONS, MAP_ONE_MAIN_MISSIONS, MAP_ONE_SIDE_MISSIONS } from './historyMapOne';

export type HistoryMissionKind = 'main' | 'side' | 'hidden';

export interface HistorySource {
  title: string;
  publisher: string;
  url?: string;
}

export interface HistoryMission {
  id: string;
  mapId: string;
  kind: HistoryMissionKind;
  title: string;
  description: string;
  targetLocationId: string;
  fame: number;
  gold: number;
  hiddenAfterMainCount?: number;
  npcId?: string;
  chapterId?: string;
  requiredMainCount?: number;
  badge?: string;
  outfit?: string;
  talent?: string;
  tickets?: number;
}

const targetIds = (mapId: string, heroId: string) => [
  `gate-${mapId}`, `hero-${heroId}`, `guide-${mapId}`, 'village-farm', 'village-market',
  'village-pho', 'village-banyan', 'village-culture', 'menu-collection', 'village-lotus',
  `uno-${mapId}`, 'village-quests', 'village-gate', 'village-store', 'menu-achievements',
];

const mainTemplates = [
  ['Khám phá cổng làng xưa', 'Đọc phần giới thiệu vùng đất và để ý mốc thời gian.'],
  ['Gặp người kể chuyện', 'Chào nhân vật chính và lắng nghe câu chuyện lịch sử.'],
  ['Tìm hiểu dấu tích', 'Đến góc hướng dẫn để đọc thông tin về địa danh.'],
  ['Chăm ruộng quê', 'Ghé ruộng lúa và giúp người dân chuẩn bị mùa vụ.'],
  ['Thăm chợ làng', 'Quan sát sinh hoạt mua bán và giúp một người dân.'],
  ['Chuẩn bị bữa ăn', 'Ghé quán phở, chọn việc phù hợp để giúp bà con.'],
  ['Nghe chuyện dưới gốc đa', 'Trò chuyện với các bạn nhỏ về ký ức quê nhà.'],
  ['Ghé nhà văn hóa', 'Cùng người dân gìn giữ câu chuyện và phong tục địa phương.'],
  ['Sưu tầm tư liệu', 'Mở bộ sưu tập và xem hiện vật gắn với chặng đường này.'],
  ['Tìm dấu bên ao sen', 'Khám phá cảnh vật và những câu chuyện được lưu truyền.'],
  ['Nghỉ chân ở quán nước', 'Ghé khu Giải trí để xem các hoạt động tùy chọn bên quán nước.'],
  ['Xem bảng việc chung', 'Đọc bảng nhiệm vụ và chọn một việc có ích cho xóm.'],
  ['Thăm cổng bản đồ', 'Kiểm tra đường đi và các vùng đất đã mở.'],
  ['Ghé cửa hàng làng', 'Tìm hiểu cách trao đổi vật phẩm bằng xu ảo trong game.'],
  ['Ôn lại điều đã học', 'Đến đình danh vọng để xem tiến trình học sử.'],
] as const;

const sideTemplates = [
  ['Giúp chuẩn bị ngày hội', 'Thăm nhà văn hóa và tìm hiểu sinh hoạt cộng đồng.'],
  ['Góp một tay ngoài đồng', 'Ghé ruộng lúa để làm một việc nhỏ cùng người dân.'],
  ['Mua bán có trách nhiệm', 'Quan sát cách trao đổi hàng hóa ở chợ quê.'],
  ['Chia sẻ bữa cơm', 'Ghé quán phở và giúp chuẩn bị bữa ăn cho khách.'],
  ['Kể chuyện cho em nhỏ', 'Đến gốc đa, nghe câu hỏi và cùng ôn lại chuyện xưa.'],
  ['Giữ gìn cảnh quan', 'Thăm ao sen, không làm xáo trộn môi trường quanh làng.'],
  ['Tìm hiểu nếp sống', 'Ghé bảng nhiệm vụ để xem người dân đang cần giúp gì.'],
  ['Ghi lại một điều hay', 'Đến bộ sưu tập và lưu điều bạn nhớ nhất về chặng này.'],
] as const;

interface MapStory {
  intro: string;
  lesson: string;
  source: HistorySource[];
  hiddenTitles: readonly string[];
}

const mapStories: Record<string, MapStory> = {
  'hai-ba-trung': {
    intro: 'Mê Linh, năm 40: theo dấu cuộc khởi nghĩa do Trưng Trắc và Trưng Nhị lãnh đạo. Những chi tiết truyền thuyết được ghi rõ là truyền thuyết, không xem như chứng cứ khảo cổ.',
    lesson: 'Điều em học được: Trưng Trắc và Trưng Nhị là những nữ lãnh đạo tiêu biểu; cuộc khởi nghĩa nổ ra năm 40 trong bối cảnh chống lại sự cai trị của nhà Hán. Sau thắng lợi ban đầu, Trưng Trắc xây dựng chính quyền trong thời gian ngắn. Cuộc khởi nghĩa bị dập tắt năm 43 nhưng để lại dấu ấn lớn về tinh thần độc lập. Các nhiệm vụ sinh hoạt và lời thoại dân làng trong game là tình tiết hư cấu, không phải sự kiện hay lời nói được ghi lại.',
    source: [
      { title: 'Đại Việt sử ký toàn thư, Ngoại kỷ, quyển III', publisher: 'Ngô Sĩ Liên và các sử thần triều Lê; Viện Khoa học Xã hội Việt Nam, NXB Khoa học xã hội, 1998' },
      { title: 'Hai Bà Trưng', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/biography/Trung-Sisters' },
    ],
    hiddenTitles: MAP_ONE_HIDDEN_MISSIONS.map(mission => mission.title),
  },
  'tran-hung-dao': {
    intro: 'Bạch Đằng, năm 1288: tìm hiểu cuộc kháng chiến đời Trần và chiến thắng trên sông Bạch Đằng. Trận đánh được đặt trong bối cảnh cuộc kháng chiến, không biến truyền thuyết thành sự kiện kiểm chứng.',
    lesson: 'Nhận biết vai trò của Trần Quốc Tuấn trong kháng chiến chống Nguyên và ý nghĩa của chiến thắng Bạch Đằng năm 1288.',
    source: [
      { title: 'Đại Việt sử ký toàn thư, Bản kỷ toàn thư, quyển V', publisher: 'Ngô Sĩ Liên và các sử thần triều Lê; Viện Khoa học Xã hội Việt Nam, NXB Khoa học xã hội, 1998' },
      { title: 'Battle of Bach Dang River (1288)', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/event/Battle-of-Bach-Dang-River-1288' },
    ],
    hiddenTitles: ['Dấu tích bên bến sông', 'Lời nhắn của người chèo đò', 'Ký ức dưới mái thủy đình'],
  },
  'le-loi': {
    intro: 'Lam Sơn, từ năm 1418: tìm hiểu cuộc khởi nghĩa do Lê Lợi lãnh đạo và vai trò của những người cùng tham gia, trong đó có Nguyễn Trãi.',
    lesson: 'Nêu được Lam Sơn ở Thanh Hóa, cuộc khởi nghĩa bắt đầu năm 1418 và Bình Ngô đại cáo gắn với thắng lợi của nghĩa quân.',
    source: [
      { title: 'Đại Việt sử ký toàn thư, Bản kỷ thực lục, quyển X–XI', publisher: 'Ngô Sĩ Liên và các sử thần triều Lê; Viện Khoa học Xã hội Việt Nam, NXB Khoa học xã hội, 1998' },
      { title: 'Bình Ngô đại cáo', publisher: 'Nguyễn Trãi; văn bản được lưu trong Ức Trai tập' },
      { title: 'Lê Lợi', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/biography/Le-Loi' },
    ],
    hiddenTitles: ['Lá thư bên đường núi', 'Mảnh ghi chép ở Lam Sơn', 'Lời hẹn dưới mái nhà sàn'],
  },
  'quang-trung': {
    intro: 'Ngọc Hồi – Đống Đa, mùa xuân năm 1789: tìm hiểu chiến thắng của quân Tây Sơn dưới sự chỉ huy của Quang Trung. Các con số và chi tiết gây tranh luận không được trình bày như sự thật chắc chắn.',
    lesson: 'Biết Quang Trung là niên hiệu của Nguyễn Huệ và chiến thắng Ngọc Hồi – Đống Đa diễn ra vào mùa xuân năm 1789.',
    source: [
      { title: 'Hoàng Lê nhất thống chí, hồi thứ 14', publisher: 'Ngô gia văn phái; bản dịch và khảo đính của Viện Văn học' },
      { title: 'Quang Trung', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/biography/Quang-Trung' },
    ],
    hiddenTitles: ['Dấu xuân trên gò Đống Đa', 'Lời nhắn ở cổng thành', 'Chuyện kể sau hội xuân'],
  },
  'vo-nguyen-giap': {
    intro: 'Điện Biên Phủ, năm 1954: tìm hiểu chiến dịch và sự đóng góp của nhiều lực lượng, dân công, chiến sĩ cùng người dân. Nội dung hướng tới tưởng niệm và học tập, không mô phỏng bạo lực.',
    lesson: 'Nhớ chiến dịch Điện Biên Phủ năm 1954 và vai trò của Đại tướng Võ Nguyên Giáp trong cuộc kháng chiến.',
    source: [
      { title: 'Điện Biên Phủ – điểm hẹn lịch sử', publisher: 'Đại tướng Võ Nguyên Giáp, NXB Quân đội nhân dân, 2004' },
      { title: 'Battle of Dien Bien Phu', publisher: 'Encyclopaedia Britannica', url: 'https://www.britannica.com/event/Battle-of-Dien-Bien-Phu' },
    ],
    hiddenTitles: ['Lá thư từ hậu phương', 'Dấu chân trên đường kéo pháo', 'Người kể chuyện ở nhà tưởng niệm'],
  },
};

const sideTargets = ['village-culture', 'village-farm', 'village-market', 'village-pho', 'village-banyan', 'village-lotus', 'village-quests', 'menu-collection'];
const hiddenTargets = ['menu-backup', 'village-gate', 'village-culture'];

export const HISTORY_MISSIONS: readonly HistoryMission[] = HISTORY_MAPS.flatMap(map => {
  const story = mapStories[map.id];
  if (!story) throw new Error(`Chưa có nội dung nhiệm vụ và nguồn tham khảo cho bản đồ ${map.id}.`);
  const main = map.id === 'hai-ba-trung'
    ? MAP_ONE_MAIN_MISSIONS.map(mission => ({
      id: `${map.id}:main:${MAP_ONE_MAIN_MISSIONS.indexOf(mission) + 1}`,
      mapId: map.id,
      kind: 'main' as const,
      ...mission,
      requiredMainCount: MAP_ONE_CHAPTER_MAIN_REQUIREMENTS[mission.chapterId] ?? 0,
    }))
    : mainTemplates.map(([title, description], index) => ({
    id: `${map.id}:main:${index + 1}`,
    mapId: map.id,
    kind: 'main' as const,
    title: title.replace('làng', map.id === 'hai-ba-trung' ? 'Mê Linh' : map.region.split(' · ')[0]),
    description: `${description} · ${map.region}`,
    targetLocationId: targetIds(map.id, map.heroId)[index],
    fame: 8,
    gold: 12,
  }));
  const side = map.id === 'hai-ba-trung'
    ? MAP_ONE_SIDE_MISSIONS.map(mission => ({
      id: `${map.id}:side:${MAP_ONE_SIDE_MISSIONS.indexOf(mission) + 1}`,
      mapId: map.id,
      kind: 'side' as const,
      ...mission,
      description: `${mission.description} · ${mission.locationHint}`,
    }))
    : sideTemplates.map(([title, description], index) => ({
    id: `${map.id}:side:${index + 1}`,
    mapId: map.id,
    kind: 'side' as const,
    title,
    description: `${description} · ${map.region}`,
    targetLocationId: sideTargets[index],
    fame: 15,
    gold: 20,
  }));
  const hidden = map.id === 'hai-ba-trung'
    ? MAP_ONE_HIDDEN_MISSIONS.map((mission, index) => ({
      id: `${map.id}:hidden:${index + 1}`,
      mapId: map.id,
      kind: 'hidden' as const,
      ...mission,
    }))
    : story.hiddenTitles.map((title, index) => ({
    id: `${map.id}:hidden:${index + 1}`,
    mapId: map.id,
    kind: 'hidden' as const,
    title,
    description: `Manh mối kín nằm ở một nơi quen thuộc của ${map.region}. Hãy nhận nhiệm vụ sau khi khám phá đủ dấu mốc chính.`,
    targetLocationId: hiddenTargets[index],
    fame: 45,
    gold: 50,
    hiddenAfterMainCount: (index + 1) * 4,
  }));
  return [...main, ...side, ...hidden];
});

export function historyMapStory(mapId: string): MapStory {
  const story = mapStories[mapId];
  if (!story) throw new Error(`Không tìm thấy câu chuyện lịch sử cho bản đồ ${mapId}.`);
  return story;
}

export function historyMission(mapId: string, missionId: string): HistoryMission | undefined {
  return HISTORY_MISSIONS.find(mission => mission.mapId === mapId && mission.id === missionId);
}

export function historyMissionAvailable(
  mapId: string,
  mission: HistoryMission,
  completed: readonly string[],
  discovered: readonly string[],
): boolean {
  if (mission.kind === 'hidden' && !discovered.includes(mission.id)) return false;
  if (mission.mapId !== mapId || mission.kind !== 'main' || mission.requiredMainCount === undefined) return true;
  const completedMain = HISTORY_MISSIONS.filter(item =>
    item.mapId === mapId && item.kind === 'main' && completed.includes(item.id),
  ).length;
  return completedMain >= mission.requiredMainCount;
}

export function historyMapMissionStats(mapId: string, completed: readonly string[], discovered: readonly string[]) {
  const map = HISTORY_MAPS.find(item => item.id === mapId);
  const missions = HISTORY_MISSIONS.filter(mission => mission.mapId === mapId);
  const main = missions.filter(mission => mission.kind === 'main');
  const doneMain = main.filter(mission => completed.includes(mission.id)).length;
  const availableHidden = missions.filter(mission => mission.kind === 'hidden' && discovered.includes(mission.id)).length;
  const done = missions.filter(mission => completed.includes(mission.id)).length;
  return {
    mainTotal: main.length,
    mainCompleted: doneMain,
    mainRequired: map?.finalChallengeFame !== undefined
      ? Math.floor(main.length * (map.requiredMainCompletionRatio ?? 0.7)) + 1
      : Math.ceil(main.length * (map?.requiredMainCompletionRatio ?? 0.7)),
    hiddenFound: availableHidden,
    hiddenTotal: missions.filter(mission => mission.kind === 'hidden').length,
    total: missions.length + 1,
    completed: done + Number(completed.includes(`${mapId}:finale`)),
    percent: Math.floor((done + Number(completed.includes(`${mapId}:finale`))) / (missions.length + 1) * 100),
  };
}

export function historyMapMandatoryMissionIds(mapId: string): string[] {
  const mainMissions = HISTORY_MISSIONS.filter(mission => mission.mapId === mapId && mission.kind === 'main');
  const finalChapter = mainMissions[mainMissions.length - 1]?.chapterId;
  return mainMissions
    .filter(mission => !finalChapter || mission.chapterId === finalChapter)
    .map(mission => mission.id);
}

export function discoverEligibleHiddenMissions(mapId: string, completed: readonly string[], discovered: readonly string[]) {
  const mainCount = historyMapMissionStats(mapId, completed, discovered).mainCompleted;
  const newlyFound = HISTORY_MISSIONS.filter(mission =>
    mission.mapId === mapId
      && mission.kind === 'hidden'
      && (mission.hiddenAfterMainCount ?? Number.MAX_SAFE_INTEGER) <= mainCount
      && !discovered.includes(mission.id),
  ).map(mission => mission.id);
  return [...discovered, ...newlyFound];
}
