export interface HistoryQuestion {
  id: string;
  question: string;
  answers: [string, string, string, string];
  correct: number;
  explanation: string;
}

export interface HistoryHero {
  id: string;
  name: string;
  title: string;
  illustration: string;
  story: string;
  unlockAt: number;
  reward: { gold: number; fame: number };
  badge: string;
  questions: HistoryQuestion[];
}

const question = (
  id: string,
  questionText: string,
  answers: [string, string, string, string],
  correct: number,
  explanation: string,
): HistoryQuestion => {
  const shift = [...id].reduce((total, char) => total + char.charCodeAt(0), 0) % answers.length;
  return {
    id,
    question: questionText,
    answers: [...answers.slice(shift), ...answers.slice(0, shift)] as HistoryQuestion['answers'],
    correct: (correct - shift + answers.length) % answers.length,
    explanation,
  };
};

export const HISTORY_HEROES: HistoryHero[] = [
  {
    id: 'hai-ba-trung',
    name: 'Hai Bà Trưng',
    title: 'Hai nữ anh hùng khởi nghĩa năm 40',
    illustration: '🌺',
    story: 'Mùa xuân năm 40, Trưng Trắc và Trưng Nhị phất cờ khởi nghĩa ở Mê Linh. Cuộc khởi nghĩa giành được quyền tự chủ trong một thời gian và trở thành câu chuyện đẹp về lòng yêu nước.',
    unlockAt: 0,
    reward: { gold: 40, fame: 25 },
    badge: 'Hoa lau Mê Linh',
    questions: [
      question('hbt-1', 'Hai Bà Trưng khởi nghĩa vào năm nào?', ['Năm 40', 'Năm 248', 'Năm 938', 'Năm 1010'], 0, 'Cuộc khởi nghĩa của Trưng Trắc và Trưng Nhị bùng nổ vào năm 40.'),
      question('hbt-2', 'Hai Bà Trưng là hai chị em có tên là gì?', ['Trưng Trắc và Trưng Nhị', 'Lê Ngọc và Lê Hoa', 'Ngọc Hân và Ngọc Tú', 'Bùi Thị và Phạm Thị'], 0, 'Hai chị em Trưng Trắc và Trưng Nhị lãnh đạo cuộc khởi nghĩa.'),
      question('hbt-3', 'Cuộc khởi nghĩa của Hai Bà Trưng bắt đầu ở đâu?', ['Mê Linh', 'Cổ Loa', 'Hoa Lư', 'Lam Sơn'], 0, 'Mê Linh, vùng đất thuộc khu vực Hà Nội ngày nay, là nơi khởi nghĩa bắt đầu.'),
      question('hbt-4', 'Hai Bà Trưng khởi nghĩa chống lại ách cai trị của triều đại nào?', ['Nhà Hán', 'Nhà Tống', 'Nhà Minh', 'Nhà Thanh'], 0, 'Cuộc khởi nghĩa diễn ra trong thời kỳ nước ta bị nhà Hán đô hộ.'),
      question('hbt-5', 'Sau khởi nghĩa, Trưng Trắc được tôn làm gì?', ['Nữ vương', 'Thái úy', 'Quốc sư', 'Hoàng hậu nhà Hán'], 0, 'Trưng Trắc được suy tôn làm vua, thường được gọi là Trưng Nữ Vương.'),
    ],
  },
  {
    id: 'tran-hung-dao',
    name: 'Trần Hưng Đạo',
    title: 'Vị Quốc công Tiết chế đời Trần',
    illustration: '🪷',
    story: 'Trần Hưng Đạo, tên thật là Trần Quốc Tuấn, là vị tướng đời Trần. Ông góp công lớn trong các cuộc kháng chiến chống quân Nguyên và để lại áng văn nổi tiếng “Hịch tướng sĩ”.',
    unlockAt: 100,
    reward: { gold: 55, fame: 35 },
    badge: 'Sóng Bạch Đằng',
    questions: [
      question('thd-1', 'Tên thật của Trần Hưng Đạo là gì?', ['Trần Quốc Tuấn', 'Trần Thủ Độ', 'Trần Nhân Tông', 'Trần Quang Khải'], 0, 'Trần Hưng Đạo là tước hiệu của Trần Quốc Tuấn.'),
      question('thd-2', 'Trần Hưng Đạo lãnh đạo quân dân Đại Việt chống lại quân nào?', ['Quân Nguyên', 'Quân Chiêm Thành', 'Quân Xiêm', 'Quân Thanh'], 0, 'Ông là vị tướng chủ chốt trong các cuộc kháng chiến chống quân Nguyên.'),
      question('thd-3', 'Trận thủy chiến nổi tiếng năm 1288 diễn ra trên sông nào?', ['Sông Bạch Đằng', 'Sông Hồng', 'Sông Mã', 'Sông Cả'], 0, 'Năm 1288, quân dân nhà Trần giành chiến thắng lớn trên sông Bạch Đằng.'),
      question('thd-4', 'Tác phẩm nổi tiếng do Trần Hưng Đạo viết để khích lệ tướng sĩ là gì?', ['Hịch tướng sĩ', 'Bình Ngô đại cáo', 'Chiếu dời đô', 'Nam quốc sơn hà'], 0, '“Hịch tướng sĩ” khơi dậy tinh thần yêu nước và trách nhiệm của quân sĩ.'),
      question('thd-5', 'Trần Hưng Đạo sống vào triều đại nào?', ['Nhà Trần', 'Nhà Lý', 'Nhà Lê sơ', 'Nhà Nguyễn'], 0, 'Trần Hưng Đạo là danh tướng tiêu biểu của triều Trần.'),
    ],
  },
  {
    id: 'le-loi',
    name: 'Lê Lợi',
    title: 'Lãnh tụ khởi nghĩa Lam Sơn',
    illustration: '🏮',
    story: 'Từ căn cứ Lam Sơn ở Thanh Hóa, Lê Lợi cùng nghĩa quân và nhiều người tài mở cuộc khởi nghĩa năm 1418. Cuộc khởi nghĩa thắng lợi, mở ra triều Hậu Lê.',
    unlockAt: 250,
    reward: { gold: 70, fame: 45 },
    badge: 'Lá cờ Lam Sơn',
    questions: [
      question('ll-1', 'Lê Lợi lãnh đạo cuộc khởi nghĩa nào?', ['Khởi nghĩa Lam Sơn', 'Khởi nghĩa Yên Thế', 'Khởi nghĩa Tây Sơn', 'Khởi nghĩa Bãi Sậy'], 0, 'Lê Lợi là người lãnh đạo cuộc khởi nghĩa Lam Sơn.'),
      question('ll-2', 'Khởi nghĩa Lam Sơn bắt đầu vào năm nào?', ['Năm 1418', 'Năm 1288', 'Năm 1428', 'Năm 1789'], 0, 'Cuộc khởi nghĩa Lam Sơn bắt đầu năm 1418 tại Thanh Hóa.'),
      question('ll-3', 'Lam Sơn thuộc vùng đất nào ngày nay?', ['Thanh Hóa', 'Nghệ An', 'Bắc Ninh', 'Quảng Nam'], 0, 'Lam Sơn là địa danh lịch sử ở tỉnh Thanh Hóa.'),
      question('ll-4', 'Ai là tác giả của “Bình Ngô đại cáo”, văn kiện gắn với thắng lợi Lam Sơn?', ['Nguyễn Trãi', 'Lê Thánh Tông', 'Ngô Sĩ Liên', 'Chu Văn An'], 0, 'Nguyễn Trãi soạn “Bình Ngô đại cáo” theo lời Lê Lợi sau thắng lợi.'),
      question('ll-5', 'Triều đại nào được thành lập sau thắng lợi của khởi nghĩa Lam Sơn?', ['Hậu Lê', 'Nhà Trần', 'Nhà Mạc', 'Nhà Nguyễn'], 0, 'Thắng lợi của khởi nghĩa mở đầu triều Hậu Lê, với Lê Lợi lên ngôi năm 1428.'),
    ],
  },
  {
    id: 'quang-trung',
    name: 'Quang Trung',
    title: 'Hoàng đế, người anh hùng áo vải',
    illustration: '🌟',
    story: 'Quang Trung là niên hiệu của Nguyễn Huệ, một lãnh tụ phong trào Tây Sơn. Mùa xuân năm 1789, ông chỉ huy quân Tây Sơn giành chiến thắng Ngọc Hồi – Đống Đa.',
    unlockAt: 450,
    reward: { gold: 85, fame: 55 },
    badge: 'Đào xuân Đống Đa',
    questions: [
      question('qt-1', 'Quang Trung là niên hiệu của ai?', ['Nguyễn Huệ', 'Nguyễn Ánh', 'Nguyễn Trãi', 'Nguyễn Hoàng'], 0, 'Nguyễn Huệ lên ngôi hoàng đế và lấy niên hiệu Quang Trung.'),
      question('qt-2', 'Quang Trung gắn liền với phong trào nào?', ['Tây Sơn', 'Lam Sơn', 'Cần Vương', 'Đông Du'], 0, 'Nguyễn Huệ là một trong những lãnh tụ tiêu biểu của phong trào Tây Sơn.'),
      question('qt-3', 'Chiến thắng Ngọc Hồi – Đống Đa diễn ra vào năm nào?', ['Năm 1789', 'Năm 1757', 'Năm 1802', 'Năm 1858'], 0, 'Chiến thắng diễn ra vào mùa xuân năm Kỷ Dậu 1789.'),
      question('qt-4', 'Đối thủ trong chiến thắng Ngọc Hồi – Đống Đa là quân đội nào?', ['Quân Thanh', 'Quân Minh', 'Quân Nguyên', 'Quân Pháp'], 0, 'Quân Tây Sơn đánh bại quân Thanh vào dịp Tết Kỷ Dậu.'),
      question('qt-5', 'Ngọc Hồi – Đống Đa thường được nhắc đến vào dịp nào?', ['Mùa xuân, gần Tết', 'Giữa mùa hè', 'Đầu mùa thu', 'Cuối mùa đông'], 0, 'Chiến thắng diễn ra trong những ngày đầu xuân năm 1789.'),
    ],
  },
  {
    id: 'vo-nguyen-giap',
    name: 'Võ Nguyên Giáp',
    title: 'Đại tướng, Tổng Tư lệnh đầu tiên',
    illustration: '📚',
    story: 'Đại tướng Võ Nguyên Giáp là một trong những người chỉ huy của Quân đội nhân dân Việt Nam. Ông gắn liền với chiến thắng Điện Biên Phủ năm 1954 và là Đại tướng đầu tiên của Việt Nam.',
    unlockAt: 700,
    reward: { gold: 100, fame: 65 },
    badge: 'Hoa ban Điện Biên',
    questions: [
      question('vng-1', 'Đại tướng Võ Nguyên Giáp gắn liền với chiến thắng lịch sử nào năm 1954?', ['Điện Biên Phủ', 'Bạch Đằng', 'Chi Lăng', 'Ngọc Hồi'], 0, 'Chiến thắng Điện Biên Phủ năm 1954 là dấu mốc lịch sử gắn liền với Đại tướng Võ Nguyên Giáp.'),
      question('vng-2', 'Võ Nguyên Giáp là Đại tướng thứ mấy của Quân đội nhân dân Việt Nam?', ['Đại tướng đầu tiên', 'Đại tướng thứ hai', 'Đại tướng thứ năm', 'Không từng giữ quân hàm Đại tướng'], 0, 'Ông được phong quân hàm Đại tướng đầu tiên của Quân đội nhân dân Việt Nam.'),
      question('vng-3', 'Chiến dịch Điện Biên Phủ kết thúc vào năm nào?', ['Năm 1954', 'Năm 1945', 'Năm 1968', 'Năm 1975'], 0, 'Chiến dịch Điện Biên Phủ kết thúc năm 1954.'),
      question('vng-4', 'Điện Biên Phủ thuộc tỉnh nào của Việt Nam?', ['Điện Biên', 'Lai Châu', 'Sơn La', 'Lào Cai'], 0, 'Thành phố Điện Biên Phủ ngày nay thuộc tỉnh Điện Biên.'),
      question('vng-5', 'Võ Nguyên Giáp từng giữ vai trò nào trong Quân đội nhân dân Việt Nam?', ['Tổng Tư lệnh', 'Chủ tịch Quốc hội', 'Thống đốc', 'Đại sứ tại Pháp'], 0, 'Ông từng là Tổng Tư lệnh Quân đội nhân dân Việt Nam.'),
    ],
  },
];

export const HISTORY_ZONES = [
  { id: 'gate', name: 'Cổng xóm', icon: '🚪', unlockAt: 0, description: 'Bắt đầu hành trình' },
  { id: 'communal-house', name: 'Đình làng', icon: '🏛️', unlockAt: 0, description: 'Nghe chuyện người xưa' },
  { id: 'tea-house', name: 'Quán nước', icon: '🫖', unlockAt: 0, description: 'Nghỉ chân, đấu UNO' },
  { id: 'wharf', name: 'Bến nước', icon: '🪷', unlockAt: 100, description: 'Bến sông mở hội' },
  { id: 'rice-field', name: 'Ruộng lúa', icon: '🌾', unlockAt: 300, description: 'Đường làng lúa chín' },
  { id: 'history-quarter', name: 'Khu sử Việt', icon: '📜', unlockAt: 0, description: 'Gặp các nhân vật lịch sử' },
] as const;

export const FAME_RANKS = [
  { score: 0, title: 'Người mới tìm hiểu lịch sử' },
  { score: 100, title: 'Người kể chuyện làng quê' },
  { score: 300, title: 'Học giả xóm làng' },
  { score: 600, title: 'Anh hùng sử Việt' },
  { score: 1000, title: 'Đại sứ văn hóa Việt Nam' },
] as const;

export function fameRank(fame: number) {
  return [...FAME_RANKS].reverse().find(rank => fame >= rank.score) ?? FAME_RANKS[0];
}
