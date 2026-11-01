import type { WorldLocation } from './world';
import { VILLAGE_TREASURES } from './villageQuests';
export const VILLAGE_LOCATIONS:WorldLocation[] = [
  {id:'village-gate',name:'Cổng làng',point:{x:1280,y:700},action:'Xem khu vực đã mở khóa',feature:'help',icon:'🚪'},
  {id:'village-home',name:'Nhà của bạn',point:{x:220,y:640},action:'Về nhà · thay diện mạo',feature:'character',icon:'🏡'},
  {id:'village-store',name:'Cửa hàng chú Tư',point:{x:1110,y:635},action:'Mua bán bằng xu ảo',feature:'upgrades',icon:'🛍️'},
  {id:'village-pho',name:'Quán phở cô Bảy',point:{x:330,y:385},action:'Nhiệm vụ nấu phở',feature:'journal',icon:'🍜',questId:'pho'},
  {id:'village-farm',name:'Ruộng lúa',point:{x:390,y:805},action:'Gieo mạ và thu hoạch',feature:'journal',icon:'🌾',questId:'farm'},
  {id:'village-lotus',name:'Ao sen',point:{x:1160,y:925},action:'Ngắm sen và tìm quà',feature:'journal',icon:'🪷'},
  {id:'village-market',name:'Chợ quê',point:{x:960,y:635},action:'Giúp người dân mua bán',feature:'journal',icon:'🧺',questId:'market'},
  {id:'village-banyan',name:'Cây đa đầu làng',point:{x:140,y:585},action:'Đố vui cùng bé Tí',feature:'journal',icon:'🌳',questId:'children'},
  {id:'village-culture',name:'Nhà văn hóa',point:{x:620,y:380},action:'Gặp gỡ và học lịch sử',feature:'achievements',icon:'🏛️'},
  {id:'village-quests',name:'Bảng nhiệm vụ',point:{x:540,y:650},action:'Nhiệm vụ và phần thưởng',feature:'journal',icon:'📜'},
  {id:'village-mounts',name:'Bãi thú cưỡi',point:{x:1010,y:925},action:'Chọn bạn đồng hành',feature:'upgrades',icon:'🐃'},
  ...VILLAGE_TREASURES.map(gift=>({...gift,action:'Nhặt quà làng quê',feature:'journal' as const,icon:'🎁'})),
];
