import { CHARACTER_CATEGORIES, CHARACTER_ITEMS, type CharacterItem, type CharacterRarity } from './characterCustomization';
export const RARITY_NAMES: Record<CharacterRarity,string> = {Common:'Thường',Rare:'Hiếm',Epic:'Sử thi',Legendary:'Huyền thoại'};
export const SHOP_CATEGORIES = [
  ...CHARACTER_CATEGORIES.map(category=>({...category,label:category.id === 'clothes' ? 'Quần áo' : category.label})),
  {id:'accessories',label:'Phụ kiện'},
  {id:'supplies',label:'Vật phẩm'}, {id:'coins',label:'Tiền xu'}, {id:'special',label:'Vật phẩm đặc biệt'},
];
export interface ShopProduct { id:string;name:string;description:string;price:number;fame:number;rarity:CharacterRarity;category:string;icon:string;equipment?:CharacterItem;rewardOnly?:boolean;tickets?:number }
const marks:Record<string,string>={hair:'✂️',clothes:'👘',bottoms:'👖',shoes:'👞',hat:'👒',wings:'🦋',back:'🎒',front:'🏮',mount:'🐃',effect:'✨'};
export const SHOP_PRODUCTS:ShopProduct[] = [
  ...CHARACTER_ITEMS.map(item=>({...item,icon:marks[item.category],equipment:item})),
  {id:'supply-rice',name:'Thóc quê',description:'Thành quả mùa gặt, cất trong kho vật phẩm.',price:20,fame:0,rarity:'Common',category:'supplies',icon:'🌾'},
  {id:'supply-lotus',name:'Hoa sen đầu mùa',description:'Một món quà làng quê để sưu tầm.',price:35,fame:0,rarity:'Rare',category:'supplies',icon:'🪷'},
  {id:'special-ticket',name:'Vé chơi bài miễn phí',description:'Nhận ngay một vé miễn phí cho ván UNO tiếp theo.',price:100,fame:0,rarity:'Epic',category:'special',icon:'🎟️',tickets:1},
  {id:'village-coins',name:'Xu làng quê',description:'Kiếm xu qua nhiệm vụ, câu hỏi lịch sử và quà trên bản đồ.',price:0,fame:0,rarity:'Common',category:'coins',icon:'🪙',rewardOnly:true},
];
