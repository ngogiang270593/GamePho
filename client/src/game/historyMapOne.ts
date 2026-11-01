export interface HistoryChapter {
  id: string;
  title: string;
  summary: string;
  lesson: string;
}

export interface MapOneCharacter {
  id: string;
  name: string;
  role: string;
  historical: boolean;
  appearance: string;
  dialogue: string;
  question: string;
  answers: readonly [string, string, string, string];
  correctAnswer: number;
  explanation: string;
}

export interface MapOneMission {
  title: string;
  description: string;
  targetLocationId: string;
  npcId: string;
  chapterId: string;
  fame: number;
  gold: number;
  badge?: string;
  outfit?: string;
  talent?: string;
  tickets?: number;
}

export interface MapOneSideMission extends MapOneMission {
  locationHint: string;
}

export const MAP_ONE_CHAPTERS: readonly HistoryChapter[] = [
  {
    id: 'village-life',
    title: 'Chương 1 · Cuộc sống ở Mê Linh',
    summary: 'Khám phá làng quê, giúp người dân và làm quen với Trưng Trắc, Trưng Nhị.',
    lesson: 'Mê Linh là vùng đất gắn với câu chuyện Hai Bà Trưng. Các hoạt động làng quê trong game được xây dựng để người chơi khám phá đời sống, không phải tư liệu khẳng định chính xác mọi phong tục của thế kỷ I.',
  },
  {
    id: 'injustice',
    title: 'Chương 2 · Nỗi đau và sự bất công',
    summary: 'Lắng nghe những hồi ức về bối cảnh cai trị và câu chuyện gia đình của Trưng Trắc.',
    lesson: 'Các sử liệu cổ ghi cuộc khởi nghĩa trong bối cảnh sự cai trị của nhà Hán. Tình tiết hội thoại của dân làng là hư cấu phục vụ gameplay; không phải lời chứng hay lời nói được ghi lại của người xưa.',
  },
  {
    id: 'preparation',
    title: 'Chương 3 · Chuẩn bị khởi nghĩa',
    summary: 'Hỗ trợ lương thực, chuyển tin và chuẩn bị việc chung cùng cộng đồng.',
    lesson: 'Cuộc khởi nghĩa gắn với Trưng Trắc và Trưng Nhị cùng sự tham gia của nhiều thủ lĩnh, cộng đồng. Các nhiệm vụ hậu cần trong game là tình tiết mô phỏng.',
  },
  {
    id: 'uprising',
    title: 'Chương 4 · Khởi nghĩa Mê Linh',
    summary: 'Đóng vai người hỗ trợ dân làng và nghĩa quân, không thay thế vai trò của Hai Bà.',
    lesson: 'Theo sử liệu, cuộc khởi nghĩa bùng nổ năm 40 và giành được thắng lợi ban đầu. Game tóm lược diễn biến, không tái hiện chiến trận hoặc khẳng định chi tiết chưa có đủ căn cứ.',
  },
  {
    id: 'legacy',
    title: 'Chương 5 · Dấu ấn Hai Bà Trưng',
    summary: 'Ôn lại kết quả, ý nghĩa và chuẩn bị thử thách cuối bản đồ.',
    lesson: 'Hai Bà Trưng là những nữ lãnh đạo tiêu biểu. Cuộc khởi nghĩa nổ ra năm 40; chính quyền của Trưng Trắc tồn tại trong thời gian ngắn và cuộc khởi nghĩa bị dập tắt năm 43. Sự kiện để lại dấu ấn lớn về tinh thần độc lập.',
  },
];

export const MAP_ONE_CHAPTER_MAIN_REQUIREMENTS: Readonly<Record<string, number>> = {
  'village-life': 0,
  injustice: 4,
  preparation: 7,
  uprising: 11,
  legacy: 15,
};

export const MAP_ONE_CHARACTERS: readonly MapOneCharacter[] = [
  {
    id: 'trung-trac',
    name: 'Trưng Trắc',
    role: 'Nữ lãnh đạo cuộc khởi nghĩa, nhân vật chính của bản đồ',
    historical: true,
    appearance: 'Trang phục nữ tướng cách điệu, áo màu son và khăn vấn; minh họa chibi, không phải phục dựng khảo cổ.',
    dialogue: 'Ta là Trưng Trắc. Hãy cùng bà con tìm hiểu câu chuyện Mê Linh và những người đã góp sức cho cuộc khởi nghĩa.',
    question: 'Cuộc khởi nghĩa Hai Bà Trưng bùng nổ vào năm nào?',
    answers: ['Năm 39', 'Năm 40', 'Năm 41', 'Năm 43'],
    correctAnswer: 1,
    explanation: 'Cuộc khởi nghĩa bùng nổ năm 40. Cuộc khởi nghĩa bị dập tắt năm 43.',
  },
  {
    id: 'trung-nhi',
    name: 'Trưng Nhị',
    role: 'Em gái và người cùng lãnh đạo cuộc khởi nghĩa',
    historical: true,
    appearance: 'Trang phục nữ tướng chibi với áo xanh ngọc và khăn đội đầu.',
    dialogue: 'Chị em ta cùng đứng lên. Trong hành trình này, em sẽ gặp nhiều người dân và thủ lĩnh cùng góp sức.',
    question: 'Ai cùng Trưng Trắc lãnh đạo cuộc khởi nghĩa?',
    answers: ['Trưng Nhị', 'Lê Lợi', 'Ngô Quyền', 'Lý Thường Kiệt'],
    correctAnswer: 0,
    explanation: 'Trưng Nhị là em gái và là người cùng Trưng Trắc lãnh đạo cuộc khởi nghĩa.',
  },
  {
    id: 'thi-sach-memory',
    name: 'Ký ức về Thi Sách',
    role: 'Nhân vật lịch sử được nhắc trong câu chuyện về Trưng Trắc',
    historical: true,
    appearance: 'Chỉ xuất hiện qua tranh hồi ức và lời người kể; không dựng thành nhân vật gặp trực tiếp.',
    dialogue: 'Người kể chuyện: Sử sách gắn câu chuyện Trưng Trắc với Thi Sách. Phần hồi ức trong game không phải lời thoại lịch sử được ghi chép.',
    question: 'Nhân vật nào thường được sử sách nhắc cùng câu chuyện Trưng Trắc?',
    answers: ['Thi Sách', 'Trần Hưng Đạo', 'Nguyễn Trãi', 'Quang Trung'],
    correctAnswer: 0,
    explanation: 'Thi Sách được nhắc trong câu chuyện về Trưng Trắc; lời hồi ức trong game là diễn giải, không phải trích dẫn.',
  },
  {
    id: 'lady-le-chan',
    name: 'Lê Chân',
    role: 'Nữ tướng gắn với truyền thống thờ Hai Bà Trưng',
    historical: true,
    appearance: 'Áo giáp vải chibi màu nâu đỏ, khăn buộc gọn.',
    dialogue: 'Hãy nhớ rằng phong trào có sự góp sức của nhiều thủ lĩnh. Tư liệu về từng nhân vật có thể khác nhau giữa các nguồn.',
    question: 'Cuộc khởi nghĩa chỉ có hai người tham gia hay có nhiều thủ lĩnh, cộng đồng cùng hưởng ứng?',
    answers: ['Chỉ có hai người', 'Có nhiều thủ lĩnh và cộng đồng hưởng ứng', 'Chỉ có quan lại', 'Không có người dân tham gia'],
    correctAnswer: 1,
    explanation: 'Nhiều thủ lĩnh và cộng đồng cùng tham gia phong trào; tư liệu cụ thể về từng nhân vật cần được đối chiếu.',
  },
  {
    id: 'woman-general',
    name: 'Nữ thủ lĩnh nghĩa quân',
    role: 'Nhân vật đại diện được hư cấu để kết nối nhiệm vụ cộng đồng',
    historical: false,
    appearance: 'Nữ tướng chibi áo giáp vải, không gán tên hoặc tiểu sử cho nhân vật lịch sử cụ thể.',
    dialogue: 'Từng người góp một việc nhỏ để bảo vệ xóm làng. Câu chuyện của tôi là tình tiết hư cấu trong game.',
    question: 'Nhiệm vụ hậu cần có thể giúp cộng đồng như thế nào?',
    answers: ['Giúp chuẩn bị vật dụng và hỗ trợ người dân', 'Thay thế vai trò của Hai Bà', 'Xóa bỏ mọi khó khăn ngay lập tức', 'Biến tình tiết game thành sử liệu'],
    correctAnswer: 0,
    explanation: 'Trong game, nhiệm vụ hậu cần giúp người chơi hỗ trợ cộng đồng; đây là mô phỏng gameplay.',
  },
  {
    id: 'village-elder',
    name: 'Trưởng làng',
    role: 'Người kể chuyện và hướng dẫn hành trình',
    historical: false,
    appearance: 'Cụ già áo nâu, khăn đóng giản lược theo phong cách minh họa.',
    dialogue: 'Ta kể lại chuyện xưa theo sử liệu và sẽ nói rõ đâu là tình tiết do trò chơi sáng tác.',
    question: 'Năm nào đánh dấu cuộc khởi nghĩa Hai Bà Trưng?',
    answers: ['Năm 40', 'Năm 1288', 'Năm 1418', 'Năm 1789'],
    correctAnswer: 0,
    explanation: 'Cuộc khởi nghĩa Hai Bà Trưng bùng nổ năm 40.',
  },
  {
    id: 'farmer',
    name: 'Bác nông dân',
    role: 'Người dân đại diện, giao việc chăm ruộng',
    historical: false,
    appearance: 'Áo nâu, nón lá và giỏ tre; tạo hình chibi.',
    dialogue: 'Giúp bác chuyển ít lương thực tới sân đình nhé. Đây là nhiệm vụ mô phỏng đời sống trong game.',
    question: 'Lương thực giúp ích gì cho một cộng đồng đang chuẩn bị việc lớn?',
    answers: ['Duy trì sinh hoạt và hỗ trợ hậu cần', 'Thay thế mọi công cụ', 'Làm thay đổi mốc lịch sử', 'Không có ích gì'],
    correctAnswer: 0,
    explanation: 'Lương thực giúp duy trì sinh hoạt và hỗ trợ hậu cần trong nhiệm vụ mô phỏng.',
  },
  {
    id: 'market-vendor',
    name: 'Cô bán hàng',
    role: 'Người dân đại diện ở chợ quê',
    historical: false,
    appearance: 'Áo tứ thân cách điệu, khăn mỏ quạ và quang gánh chibi.',
    dialogue: 'Chợ là nơi bà con trao đổi vật dụng. Em hãy giúp sắp xếp hàng hóa cho gọn nhé.',
    question: 'Chợ giúp người dân trao đổi những gì?',
    answers: ['Hàng hóa và vật dụng', 'Chỉ các câu chuyện truyền thuyết', 'Chỉ thư mật', 'Không trao đổi gì'],
    correctAnswer: 0,
    explanation: 'Chợ là nơi cộng đồng trao đổi hàng hóa và vật dụng.',
  },
  {
    id: 'blacksmith',
    name: 'Bác thợ rèn',
    role: 'Người thợ đại diện, hỗ trợ chuẩn bị công cụ',
    historical: false,
    appearance: 'Áo vải sẫm, tạp dề da và búa rèn minh họa.',
    dialogue: 'Bác đang sửa nông cụ. Trò chơi không mô phỏng chế tạo vũ khí hay giao tranh.',
    question: 'Công cụ lao động giúp ích gì cho sinh hoạt làng quê?',
    answers: ['Hỗ trợ công việc sản xuất', 'Thay thế lương thực', 'Tự mở khóa bản đồ', 'Biến truyện kể thành chứng cứ'],
    correctAnswer: 0,
    explanation: 'Công cụ lao động hỗ trợ các công việc sản xuất và sinh hoạt.',
  },
  {
    id: 'boat-person',
    name: 'Người chèo đò',
    role: 'Người dân đại diện ở bến nước',
    historical: false,
    appearance: 'Áo chàm, khăn buộc đầu và mái chèo gỗ chibi.',
    dialogue: 'Bến nước là điểm hẹn của bà con trong câu chuyện game. Hãy chuyển lời nhắn tới sân đình.',
    question: 'Vì sao người đưa tin cần chọn đường đi an toàn?',
    answers: ['Để chuyển lời nhắn thuận lợi', 'Để thay đổi sự kiện lịch sử', 'Để bỏ qua mọi nhân vật', 'Để làm nhiệm vụ ẩn hiện ra ngay'],
    correctAnswer: 0,
    explanation: 'Chọn đường đi an toàn giúp người đưa tin hoàn thành nhiệm vụ game.',
  },
  {
    id: 'messenger',
    name: 'Người đưa tin',
    role: 'Nhân vật đại diện hư cấu cho nhiệm vụ chuyển thư',
    historical: false,
    appearance: 'Áo vải gọn nhẹ, túi thư đeo chéo.',
    dialogue: 'Thư này là đạo cụ hư cấu của trò chơi, không phải văn thư lịch sử có thật.',
    question: 'Trong nhiệm vụ game, thư giúp kết nối những ai?',
    answers: ['Những người giao và nhận tin trong nhiệm vụ', 'Các nhân vật ở thời hiện đại', 'Người chơi với cửa hàng online', 'Không kết nối ai'],
    correctAnswer: 0,
    explanation: 'Lá thư là đạo cụ gameplay để kết nối người giao và người nhận tin.',
  },
  {
    id: 'han-official',
    name: 'Viên quan Đông Hán',
    role: 'Nhân vật đối đầu đại diện cho bối cảnh cai trị nhà Hán',
    historical: false,
    appearance: 'Trang phục quan lại cổ đại cách điệu; không gán tên nhân vật lịch sử.',
    dialogue: 'Nhân vật này đại diện bối cảnh chính quyền nhà Hán trong gameplay, không phải chân dung hay lời nói của một cá nhân có thật.',
    question: 'Khởi nghĩa diễn ra trong bối cảnh cai trị của triều đại nào?',
    answers: ['Nhà Hán', 'Nhà Trần', 'Nhà Lê sơ', 'Nhà Tây Sơn'],
    correctAnswer: 0,
    explanation: 'Cuộc khởi nghĩa diễn ra trong bối cảnh cai trị của nhà Hán.',
  },
];

export const MAP_ONE_MAIN_MISSIONS: readonly MapOneMission[] = [
  { title: 'Qua cổng làng Mê Linh', description: 'Làm quen đường làng và nghe giới thiệu bối cảnh bản đồ.', targetLocationId: 'gate-hai-ba-trung', npcId: 'village-elder', chapterId: 'village-life', fame: 20, gold: 15 },
  { title: 'Gặp Trưng Trắc', description: 'Gặp nhân vật chính và nghe lời dẫn nhập có phân biệt sử liệu với tình tiết game.', targetLocationId: 'hero-hai-ba-trung', npcId: 'trung-trac', chapterId: 'village-life', fame: 20, gold: 15 },
  { title: 'Thăm Trưng Nhị', description: 'Tìm hiểu vai trò của Trưng Nhị trong câu chuyện khởi nghĩa.', targetLocationId: 'me-linh-trung-nhi', npcId: 'trung-nhi', chapterId: 'village-life', fame: 25, gold: 18 },
  { title: 'Chăm luống rau', description: 'Giúp người dân thu xếp rau củ cho sinh hoạt trong làng.', targetLocationId: 'me-linh-garden', npcId: 'farmer', chapterId: 'village-life', fame: 25, gold: 18 },
  { title: 'Gánh nước bên giếng', description: 'Mang nước tới sân đình trong nhiệm vụ đời sống hư cấu.', targetLocationId: 'me-linh-well', npcId: 'village-elder', chapterId: 'village-life', fame: 25, gold: 18 },
  { title: 'Góp sức ngoài đồng', description: 'Ghé ruộng và giúp chuẩn bị lương thực cho bà con.', targetLocationId: 'me-linh-farm', npcId: 'farmer', chapterId: 'village-life', fame: 25, gold: 18 },
  { title: 'Sắp xếp hàng ở chợ', description: 'Giúp cô bán hàng chuẩn bị vật dụng cho cộng đồng.', targetLocationId: 'me-linh-market', npcId: 'market-vendor', chapterId: 'injustice', fame: 25, gold: 18 },
  { title: 'Nghe câu chuyện Thi Sách', description: 'Nghe người kể nhắc tới Thi Sách; đối thoại là tình tiết game, không phải trích dẫn sử liệu.', targetLocationId: 'me-linh-memory', npcId: 'thi-sach-memory', chapterId: 'injustice', fame: 30, gold: 20 },
  { title: 'Thăm hỏi gia đình trong làng', description: 'Giúp một gia đình đại diện trong tình tiết hư cấu về những khó khăn thời cuộc.', targetLocationId: 'me-linh-family', npcId: 'village-elder', chapterId: 'injustice', fame: 30, gold: 20 },
  { title: 'Tìm hiểu bối cảnh cai trị', description: 'Đọc bảng tư liệu và phân biệt bối cảnh lịch sử với lời thoại sáng tác.', targetLocationId: 'me-linh-history-board', npcId: 'han-official', chapterId: 'injustice', fame: 30, gold: 20 },
  { title: 'Chuyển gạo tới kho chung', description: 'Đưa lương thực mô phỏng tới khu chuẩn bị của dân làng.', targetLocationId: 'me-linh-granary', npcId: 'farmer', chapterId: 'preparation', fame: 30, gold: 20 },
  { title: 'Nhận công cụ đã sửa', description: 'Ghé lò rèn để nhận nông cụ đã sửa cho công việc cộng đồng.', targetLocationId: 'me-linh-forge', npcId: 'blacksmith', chapterId: 'preparation', fame: 30, gold: 20 },
  { title: 'Chuyển lời nhắn qua bến nước', description: 'Giúp người đưa tin tìm đường an toàn giữa các địa điểm.', targetLocationId: 'me-linh-wharf', npcId: 'boat-person', chapterId: 'preparation', fame: 30, gold: 20 },
  { title: 'Tập hợp tại sân luyện tập', description: 'Tham gia hoạt động di chuyển và bảo vệ dân làng, không mô phỏng bạo lực.', targetLocationId: 'me-linh-training', npcId: 'woman-general', chapterId: 'preparation', fame: 30, gold: 20 },
  { title: 'Hỗ trợ khu nghĩa quân', description: 'Mang vật dụng cứu trợ tới khu sinh hoạt của nghĩa quân trong game.', targetLocationId: 'me-linh-camp', npcId: 'messenger', chapterId: 'uprising', fame: 30, gold: 20 },
  { title: 'Góp việc ở bến thuyền', description: 'Giúp người dân chuẩn bị bến nước an toàn trong tình tiết mô phỏng.', targetLocationId: 'me-linh-boat-yard', npcId: 'boat-person', chapterId: 'uprising', fame: 35, gold: 22 },
  { title: 'Nghe kể về năm 40', description: 'Đến lều kể chuyện, sắp xếp thông tin về cuộc khởi nghĩa năm 40.', targetLocationId: 'me-linh-story-tent', npcId: 'village-elder', chapterId: 'legacy', fame: 35, gold: 22 },
  { title: 'Ôn lại dấu ấn Mê Linh', description: 'Gặp Trưng Trắc, ôn lại ý nghĩa sự kiện và chuẩn bị thử thách cuối.', targetLocationId: 'me-linh-memorial', npcId: 'trung-trac', chapterId: 'legacy', fame: 35, gold: 22 },
];

export const MAP_ONE_SIDE_MISSIONS: readonly MapOneSideMission[] = [
  { title: 'Chia sẻ bữa cơm chung', description: 'Giúp người nấu bếp chuẩn bị phần ăn trong tình tiết gameplay.', targetLocationId: 'me-linh-kitchen', npcId: 'market-vendor', chapterId: 'village-life', fame: 15, gold: 20, locationHint: 'Khu chợ quê' },
  { title: 'Chăm sóc ngựa', description: 'Giúp người chăm ngựa chuẩn bị nước và vật dụng cần thiết.', targetLocationId: 'me-linh-horse-pen', npcId: 'farmer', chapterId: 'preparation', fame: 15, gold: 20, locationHint: 'Bãi ngựa' },
  { title: 'Canh lối làng', description: 'Cùng người canh gác tìm hiểu đường đi an toàn quanh làng.', targetLocationId: 'me-linh-gate-watch', npcId: 'woman-general', chapterId: 'preparation', fame: 15, gold: 20, locationHint: 'Cổng lũy tre' },
  { title: 'Chăm người mệt', description: 'Mang nước và giúp người chăm sóc trong tình tiết game hư cấu.', targetLocationId: 'me-linh-care', npcId: 'village-elder', chapterId: 'injustice', fame: 15, gold: 20, locationHint: 'Nhà dân' },
  { title: 'Góp sức ở bến thuyền', description: 'Giúp người đưa tin sắp xếp lối chuyển vật dụng qua bến nước.', targetLocationId: 'me-linh-boat-yard', npcId: 'messenger', chapterId: 'preparation', fame: 15, gold: 20, locationHint: 'Bến sông' },
  { title: 'Đưa lời nhắn trong làng', description: 'Chuyển một lời nhắn trong nhiệm vụ mô phỏng tới khu dân cư.', targetLocationId: 'me-linh-child', npcId: 'messenger', chapterId: 'village-life', fame: 15, gold: 20, locationHint: 'Khu dân cư' },
  { title: 'Đến bến theo lối an toàn', description: 'Lắng nghe người chèo đò hướng dẫn đường đi trong tình tiết game.', targetLocationId: 'me-linh-wharf', npcId: 'boat-person', chapterId: 'uprising', fame: 15, gold: 20, locationHint: 'Bến nước' },
  { title: 'Luyện một ván UNO', description: 'Thử luật chơi cùng máy tại quán nước; đây là hoạt động giải trí, không cược.', targetLocationId: 'uno-hai-ba-trung', npcId: 'village-elder', chapterId: 'legacy', fame: 15, gold: 20, locationHint: 'Quán nước' },
];

export const MAP_ONE_HIDDEN_MISSIONS = [
  { title: 'Tiếng trống sau lũy tre', description: 'Tìm chiếc trống đạo cụ được cất trong một góc khuất của làng.', targetLocationId: 'me-linh-hidden-drum', fame: 60, gold: 60, hiddenAfterMainCount: 3, badge: 'Dấu trống Mê Linh' },
  { title: 'Những mảnh cờ nghĩa', description: 'Tìm các mảnh cờ trang trí trong khu vực bí mật.', targetLocationId: 'me-linh-hidden-flag', fame: 60, gold: 60, hiddenAfterMainCount: 6, outfit: 'Nón cờ nghĩa quân' },
  { title: 'Chuyện bà cụ bên vườn', description: 'Nghe một câu chuyện gia đình hư cấu được truyền lại trong game.', targetLocationId: 'me-linh-hidden-elder', fame: 60, gold: 60, hiddenAfterMainCount: 9, talent: 'Tinh thần Mê Linh' },
  { title: 'Lá thư chưa gửi', description: 'Tìm đạo cụ lá thư và đọc lời nhắc rằng đây không phải văn thư lịch sử có thật.', targetLocationId: 'me-linh-hidden-letter', fame: 60, gold: 60, hiddenAfterMainCount: 12, tickets: 1 },
  { title: 'Lối nhỏ của người đưa tin', description: 'Khám phá đường tắt bí mật và nhận thiên phú Người đưa tin.', targetLocationId: 'me-linh-hidden-path', fame: 60, gold: 60, hiddenAfterMainCount: 15, talent: 'Người đưa tin' },
  { title: 'Người giữ ký ức Mê Linh', description: 'Tìm đủ các vật dụng truyền thống trong làng để mở câu chuyện mở rộng.', targetLocationId: 'me-linh-hidden-memory', fame: 80, gold: 80, hiddenAfterMainCount: 18, badge: 'Người giữ ký ức Mê Linh', outfit: 'Trang phục nữ tướng Mê Linh', talent: 'Nhà sử học' },
  { title: 'Con đường an toàn trong rừng', description: 'Khám phá lối đi giúp một gia đình hư cấu rời khỏi khu vực nguy hiểm.', targetLocationId: 'me-linh-hidden-raider', fame: 60, gold: 60, hiddenAfterMainCount: 12, badge: 'Người dẫn đường' },
] as const;
