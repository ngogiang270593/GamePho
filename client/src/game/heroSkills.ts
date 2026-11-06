export interface HeroSkillNode {
  id: string;
  name: string;
  kind: 'Tâm pháp' | 'Chủ động';
  branch: string;
  unlock: string;
  innerForce: number;
  cooldown: number | null;
  action: string;
  effect: string;
  icon: string;
}

export const HERO_SKILL_TREE: readonly HeroSkillNode[] = [
  {
    id: 'ha-ba-tuc-cong',
    name: 'Hà Bá Tức Công',
    kind: 'Tâm pháp',
    branch: 'Nội công sông nước',
    unlock: 'Đạo Đức ≥60 · nhận Tàn Quyển từ Bà Mẹ Quê',
    innerForce: 0,
    cooldown: null,
    action: 'Điều hòa hơi thở theo nhịp nước, hạ thấp trọng tâm và giữ thân pháp mềm dẻo.',
    effect: 'Nội công sơ cấp tự hồi 3% HP và 3% MP mỗi lượt khi đứng gần sông nước.',
    icon: '🌊',
  },
  {
    id: 'ca-coc-phon-thuy',
    name: 'Cá Cóc Phún Thủy',
    kind: 'Chủ động',
    branch: 'Ám khí · Tầm trung',
    unlock: 'Chiêu nhập môn',
    innerForce: 40,
    cooldown: 2,
    action: 'Nép vai, bật cổ tay phóng một mũi ám khí theo đường nước xoáy.',
    effect: 'Tầm 4 ô; gây sát thương Thủy và giảm 30% giáp mục tiêu trong 3 lượt.',
    icon: '🐟',
  },
  {
    id: 'rai-ca-quan-thuy',
    name: 'Rái Cá Quần Thủy',
    kind: 'Chủ động',
    branch: 'Thân pháp · Áp sát',
    unlock: 'Cấp 3 · Học Cá Cóc Phún Thủy',
    innerForce: 50,
    cooldown: 3,
    action: 'Lách thấp người qua đòn cận chiến, lướt vòng ra sau lưng rồi đánh trả.',
    effect: 'Lướt qua lưng địch, né 100% đòn đánh trong lúc lướt; nếu đánh từ sau lưng, đòn kế tiếp chắc chắn chí mạng.',
    icon: '🦦',
  },
  {
    id: 'rua-dam-lay-thu',
    name: 'Rùa Đầm Lầy Thủ',
    kind: 'Chủ động',
    branch: 'Phòng thủ · Phản đòn',
    unlock: 'Cấp 5 · Học Cá Cóc Phún Thủy',
    innerForce: 16,
    cooldown: 4,
    action: 'Thu mình thủ thế trong một lượt, chờ đối phương áp sát rồi bật móc câu phản kích.',
    effect: 'Chặn đòn cận chiến và phản lại 50% sát thương nhận vào; phản đòn làm choáng 1 lượt. Thủ lĩnh miễn choáng nhưng vẫn chịu sát thương.',
    icon: '🐢',
  },
  {
    id: 'ha-ba-cuon-luu',
    name: 'Hà Bá Cuốn Lưu',
    kind: 'Chủ động',
    branch: 'Tuyệt kỹ · Khống chế diện rộng',
    unlock: 'Cấp 8 · Học Rái Cá Quần Thủy và Rùa Đầm Lầy Thủ',
    innerForce: 30,
    cooldown: 5,
    action: 'Xoay người vung móc câu thành vòng cung, kéo dòng nước cuộn quanh Tiểu Mông.',
    effect: 'Ảnh hưởng vùng bán kính 2 ô; gây sát thương Thủy bằng 110% công kích vũ khí, kéo kẻ địch thường lại 2 ô và khiến chúng nghẹt nước, mất lượt kế tiếp. Thủ lĩnh chỉ bị giảm tốc.',
    icon: '🪝',
  },
  {
    id: 'bay-tre-gai',
    name: 'Bẫy Tre Gai',
    kind: 'Chủ động',
    branch: 'Bẫy · Khống chế',
    unlock: 'Công thức của Tảo · cần Thân Tre Già',
    innerForce: 50,
    cooldown: 0,
    action: 'Lắp bẫy tre gai và đặt xuống ô liền kề phía trước.',
    effect: 'Kẻ địch dẫm phải bị định thân 1 lượt và chịu 120 sát thương xuyên giáp.',
    icon: '🎋',
  },
] as const;
