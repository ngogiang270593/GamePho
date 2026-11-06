export type HeroTalentId = 'keen-senses' | 'forest-and-tide' | 'ingenious-trapper';
export type HeroAlignmentPath = 'righteous' | 'shadow';

export interface HeroDevelopment {
  talent: HeroTalentId | null;
  alignmentGoal: HeroAlignmentPath | null;
}

export const HERO_BIOGRAPHY = {
  title: 'Tiểu Mông',
  epithet: 'Thiếu niên Lạc tướng xứ Mê Linh',
  age: 'Mười bảy tuổi',
  home: 'Thôn Mê Linh, bên dòng sông vùng Lạc Việt',
  story: [
    'Cậu lớn lên trong một gia đình Lạc tướng ở Mê Linh. Cha thường dẫn cậu men theo những lối mòn trong rừng và dạy cách nhìn con nước; mẹ thì rành chèo thuyền, băng bó vết thương và nhận ra dấu chân người lạ. Tuổi thơ của cậu bình dị, quẩn quanh bến sông và những câu chuyện bên bếp lửa.',
    'Rồi quan quân Đông Hán siết chặt việc kiểm soát thôn xóm. Gia đình cậu bị vu cho tội che giấu người đưa tin. Nhà bị lục soát, cha mẹ bị bắt đi; giữa đêm hỗn loạn, cậu chỉ kịp trốn xuống bến theo một lối nhỏ sau nhà. Từ đó, cậu không biết cha mẹ còn sống hay đang ở nơi nào. Điều cậu nhớ nhất là lời mẹ dặn: đừng để nỗi đau biến mình thành người gây ra nó.',
    'Dân chài trong thôn cưu mang cậu. Cậu học cách dẫn đường, hái thuốc và chuyển tin, mang theo con dao cũ của cha cùng chiếc nỏ tre tự tay làm. Khi gặp nguy hiểm, cậu chọn đường bờ lau, lợi dụng màn sương và rút lui đúng lúc thay vì đối đầu trực diện.',
  ],
  personality: 'Cậu ít nói nhưng tinh ý, thường để ý những điều người khác bỏ qua. Dù nóng lòng tìm cha mẹ, cậu vẫn sẵn sàng dừng lại giúp người gặp nạn. Cậu quý lời hứa và không muốn dân làng phải chịu thêm mất mát.',
  motivation: 'Tìm tin tức về cha mẹ, giữ cho đường liên lạc của dân Mê Linh được an toàn và giúp những người đang bị chèn ép.',
  arc: 'Trên đường đi, cậu sẽ phải học cách tin người khác và gánh vác nhiều hơn nỗi đau của riêng mình. Những lựa chọn ấy sẽ quyết định cậu đứng lên bảo vệ mọi người hay để lòng căm giận dẫn lối.',
} as const;

export const HERO_BASE_ATTRIBUTES = [
  { id: 'health', label: 'Khí Huyết', value: 600, unit: 'HP', description: 'Sức bền và khả năng chịu đòn.' },
  { id: 'inner-force', label: 'Nội Lực', value: 300, unit: 'MP', description: 'Nguồn lực thi triển võ công.' },
  { id: 'insight', label: 'Ngộ Tính', value: 65, unit: 'điểm', description: 'Quyết định tốc độ lĩnh hội bí kíp.' },
  { id: 'agility', label: 'Thân Pháp', value: 75, unit: 'điểm', description: 'Quyết định né tránh, chí mạng và điểm hành động.' },
  { id: 'virtue', label: 'Đạo Đức', value: 50, unit: 'điểm', description: 'Thang điểm 0–100, đại diện cho Chính phái.' },
  { id: 'corruption', label: 'Tà Khí', value: 0, unit: 'điểm', description: 'Mức độ nghiêng về Tà Đạo.' },
] as const;

export const HERO_STARTING_TALENTS = [
  {
    id: 'keen-senses',
    name: 'Linh Mẫn Tinh Anh',
    description: '+20% Thân Pháp; giảm 15% hồi chiêu ám khí và lướt.',
  },
  {
    id: 'forest-and-tide',
    name: 'Sơn Lâm Thợ Săn',
    description: '+25% sát thương ở địa hình hẹp hoặc sông nước; nhận gấp đôi nguyên liệu khi thu thập cùng Tảo.',
  },
  {
    id: 'ingenious-trapper',
    name: 'Cơ Biến Vô Song',
    description: 'Đánh lén hoặc đặt bẫy thành công hồi 10% Nội Lực và bảo đảm chí mạng đòn kế tiếp.',
  },
] as const satisfies readonly { id: HeroTalentId; name: string; description: string }[];

export const HERO_ALIGNMENT_PATHS = [
  {
    id: 'righteous',
    name: 'Mê Linh Hiệp Khách',
    alignment: 'Chính Đạo',
    alignmentThreshold: 60,
    requiredTalent: 'Hiệp Cốt Đan Tâm',
    requiredManual: 'Chính Khí Lạc Hồng',
    style: 'Đối đầu trực diện, bảo vệ và hỗ trợ đồng đội.',
  },
  {
    id: 'shadow',
    name: 'U Minh Quỷ Sứ',
    alignment: 'Tà Đạo',
    alignmentThreshold: 60,
    requiredTalent: 'U Minh Quỷ Mị',
    requiredManual: 'U Lược Sát Quỷ Công',
    style: 'Ẩn kích, chí mạng và hút sinh lực đối thủ.',
  },
] as const satisfies readonly {
  id: HeroAlignmentPath;
  name: string;
  alignment: string;
  alignmentThreshold: number;
  requiredTalent: string;
  requiredManual: string;
  style: string;
}[];

export function normalizeHeroDevelopment(value: unknown): HeroDevelopment {
  if (!value || typeof value !== 'object') return { talent: null, alignmentGoal: null };
  const selection = value as Record<string, unknown>;
  const talent = HERO_STARTING_TALENTS.some(option => option.id === selection.talent)
    ? selection.talent as HeroTalentId
    : null;
  const alignmentGoal = HERO_ALIGNMENT_PATHS.some(option => option.id === selection.alignmentGoal)
    ? selection.alignmentGoal as HeroAlignmentPath
    : null;
  return { talent, alignmentGoal };
}
