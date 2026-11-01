import { DEFAULT_APPEARANCES } from './character';
import type { NpcDefinition } from './npcs';
export const VILLAGE_NPCS:NpcDefinition[] = [
  {id:'village-pho-npc',name:'Cô Bảy',role:'Người bán phở',speed:30,rest:3,appearance:{...DEFAULT_APPEARANCES.female,outfit:'baba'},route:[{x:300,y:390},{x:400,y:390},{x:400,y:440},{x:300,y:440}],dialogue:'Con giúp cô chuẩn bị bát phở nóng nhé! Bánh phở trước, nước dùng sau, thêm rau cho thơm.',feature:'journal'},
  {id:'village-farmer',name:'Bác Năm',role:'Người nông dân',speed:28,rest:3,appearance:{...DEFAULT_APPEARANCES.male,outfit:'baba',accessory:'nonla'},route:[{x:180,y:650},{x:300,y:650},{x:300,y:610},{x:180,y:610}],dialogue:'Mạ cần nước và chút kiên nhẫn. Cùng bác gieo mạ, tưới nước rồi chờ thu hoạch nhé.',feature:'journal'},
  {id:'village-child',name:'Bé Lan',role:'Đố vui làng quê',speed:50,rest:1,appearance:{...DEFAULT_APPEARANCES.female,outfit:'baba'},route:[{x:110,y:560},{x:240,y:560},{x:240,y:600},{x:110,y:600}],dialogue:'Mình có câu đố về cây trong làng. Đáp đúng là có quà đó!',feature:'journal'},
  {id:'village-gatekeeper',name:'Ông Cổng',role:'Người giữ cổng làng',speed:24,rest:4,appearance:{...DEFAULT_APPEARANCES.male,outfit:'nguthan'},route:[{x:1120,y:400},{x:1240,y:400}],dialogue:'Chăm học sử để tích lũy danh vọng. Đủ danh vọng thì cổng sang vùng đất mới sẽ mở.',feature:'help'},
  {id:'village-market-npc',name:'Cô Lan',role:'Người bán hàng chợ',speed:32,rest:3,appearance:{...DEFAULT_APPEARANCES.female,outfit:'baba'},route:[{x:1040,y:645},{x:1150,y:645},{x:1150,y:690},{x:1040,y:690}],dialogue:'Phiên chợ hôm nay đông vui lắm. Giúp cô trao rau tươi cho khách nhé.',feature:'journal'},
];
export const VILLAGE_NPC_ACTIONS:Record<string,string> = {
  'chu-tu':'village-store',
  'village-pho-npc':'village-pho',
  'village-farmer':'village-farm',
  'village-child':'village-banyan',
  'village-market-npc':'village-market',
};
