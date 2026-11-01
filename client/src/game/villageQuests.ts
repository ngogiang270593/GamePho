export interface VillageQuest {
  id: string; title: string; npc: string; description: string;
  steps: { prompt: string; answer: string; options: { id: string; label: string }[]; waitMs?: number }[];
  reward: { gold: number; fame: number; tickets?: number; item?: string };
  cooldownMs: number;
}
export const VILLAGE_QUESTS: VillageQuest[] = [
  { id: 'pho', title: 'Bát phở đầu ngày', npc: 'Cô Bảy · Người bán phở', description: 'Giúp cô chuẩn bị một bát phở theo đúng thứ tự.', cooldownMs: 180000,
    steps: [
      { prompt: 'Đầu tiên, cho gì vào bát?', answer: 'noodle', options: [{ id:'noodle',label:'Bánh phở' },{id:'herbs',label:'Rau thơm'},{id:'broth',label:'Nước dùng'}] },
      { prompt: 'Bánh phở đã sẵn sàng. Chan gì cho nóng?', answer: 'broth', options:[{id:'tea',label:'Trà sen'},{id:'broth',label:'Nước dùng'},{id:'water',label:'Nước lạnh'}] },
      { prompt: 'Thêm gì để bát phở thơm hơn?', answer: 'herbs', options:[{id:'herbs',label:'Hành và rau thơm'},{id:'rice',label:'Thóc giống'},{id:'salt',label:'Một bát muối'}] },
    ], reward:{gold:80,fame:10} },
  { id:'farm',title:'Chăm ruộng lúa',npc:'Bác Năm · Người nông dân',description:'Gieo mạ, tưới nước rồi chờ lúa lớn để thu hoạch.',cooldownMs:240000,
    steps:[{prompt:'Ruộng đã sẵn sàng. Bắt đầu bằng việc gì?',answer:'sow',options:[{id:'sow',label:'Gieo mạ'},{id:'harvest',label:'Gặt lúa ngay'}]},
      {prompt:'Mạ cần được chăm sóc. Bạn làm gì?',answer:'water',options:[{id:'water',label:'Tưới nước'},{id:'leave',label:'Để khô ruộng'}]},
      {prompt:'Chờ 20 giây cho lúa chín rồi thu hoạch.',answer:'harvest',waitMs:20000,options:[{id:'harvest',label:'Thu hoạch lúa'}]}],reward:{gold:60,fame:8,item:'supply-rice'} },
  {id:'children',title:'Đố vui dưới cây đa',npc:'Bé Tí · Trò chơi làng',description:'Một câu đố nhỏ, một niềm vui to!',cooldownMs:180000,
    steps:[{prompt:'Cây gì có buồng, có nải, quả chín màu vàng?',answer:'banana',options:[{id:'bamboo',label:'Cây tre'},{id:'banana',label:'Cây chuối'},{id:'lotus',label:'Cây sen'}]}],reward:{gold:30,fame:5,tickets:1}},
  {id:'market',title:'Phiên chợ quê',npc:'Cô Lan · Chủ sạp',description:'Giúp cô bán một bó rau cho người dân trong làng.',cooldownMs:180000,
    steps:[{prompt:'Khách muốn mua rau tươi. Bạn chọn món nào?',answer:'vegetables',options:[{id:'vegetables',label:'Bó rau vừa hái'},{id:'hat',label:'Chiếc nón lá'},{id:'stone',label:'Viên đá'}]},
      {prompt:'Khách đã trả tiền. Bạn làm gì?',answer:'thank',options:[{id:'thank',label:'Trao rau và cảm ơn khách'},{id:'keep',label:'Giữ cả rau lẫn tiền'}]}],reward:{gold:45,fame:6}},
];

export interface VillageQuestState { step:number; updatedAt:number; acceptedAt:number; claimedAt?:number }
export interface VillageState { quests:Record<string,VillageQuestState>; gathered:Record<string,number>; inventory:Record<string,number> }

export const VILLAGE_TREASURES = [
  {id:'village-gift-lotus',name:'Quà bên ao sen',point:{x:1240,y:924},gold:25,fame:3},
  {id:'village-gift-banyan',name:'Túi xu dưới cây đa',point:{x:90,y:590},gold:20,fame:2},
  {id:'village-gift-well',name:'Quà cạnh giếng làng',point:{x:880,y:930},gold:30,fame:3},
] as const;
export const TREASURE_COOLDOWN = 300000;
