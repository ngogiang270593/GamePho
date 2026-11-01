import catalog from './characterItems.json';
import { characterOptions } from './character';

export const CHARACTER_CATEGORIES = [
  { id: 'hair', label: 'Tóc' },
  { id: 'clothes', label: 'Trang phục' },
  { id: 'bottoms', label: 'Quần / váy' },
  { id: 'shoes', label: 'Giày dép' },
  { id: 'hat', label: 'Nón' },
  { id: 'wings', label: 'Cánh' },
  { id: 'back', label: 'Phụ kiện sau lưng' },
  { id: 'front', label: 'Phụ kiện trước' },
  { id: 'mount', label: 'Thú cưỡi' },
  { id: 'effect', label: 'Hiệu ứng' },
] as const;

export type CharacterItemCategory = (typeof CHARACTER_CATEGORIES)[number]['id'];
export type CharacterRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export interface CharacterItem {
  id: string;
  name: string;
  category: CharacterItemCategory;
  rarity: CharacterRarity;
  image: string;
  description: string;
  unlockCondition: string;
  price: number;
  fame: number;
  animation: string;
  equipped: boolean;
  appearanceValue?: string;
}
export type EquippedCharacterItems = Partial<Record<CharacterItemCategory, string>>;
export interface CharacterCustomization {
  inventory?: CharacterInventory;
  unlockedItems: string[];
  equipped: EquippedCharacterItems;
  facing: 'front' | 'three-quarter';
}
export interface CharacterInventory {
  version: 1;
  defaultItems: string[];
  ownedItems: string[];
  equippedItems: EquippedCharacterItems;
  purchasedItems: string[];
  receivedAt: Record<string, number>;
}

const baseItems = catalog as CharacterItem[];
const creationItems:CharacterItem[] = (['hair','outfit','accessory'] as const).flatMap(key=>{
  const category=key==='outfit'?'clothes':key==='accessory'?'hat':'hair';
  return characterOptions[key].filter(option=>option.value!=='none'&&!baseItems.some(item=>item.category===category&&item.appearanceValue===option.value)).map(option=>({
    id:`creation-${category}-${option.value}`,name:option.label,category,appearanceValue:option.value,
    rarity:'Common' as const,image:`/assets/icons/${category}.svg`,description:'Diện mạo truyền thống của xóm mình.',unlockCondition:'Lựa chọn khi tạo nhân vật',price:0,fame:0,animation:'idle',equipped:false,
  }));
});
const starterItems:CharacterItem[]=[
  {id:'front-herb-knife',name:'Dao hái thuốc nhỏ',category:'front',rarity:'Common',image:'/assets/icons/front.svg',description:'Dụng cụ nhỏ để thu hái thảo dược.',unlockCondition:'Trang bị khởi đầu · Người giữ rừng',price:0,fame:0,animation:'idle',equipped:false},
  {id:'front-small-hoe',name:'Cuốc nhỏ',category:'front',rarity:'Common',image:'/assets/icons/front.svg',description:'Dụng cụ làm vườn gọn nhẹ.',unlockCondition:'Trang bị khởi đầu · Người con của đồng ruộng',price:0,fame:0,animation:'idle',equipped:false},
  {id:'front-bamboo-book',name:'Thẻ tre và bút tre',category:'front',rarity:'Common',image:'/assets/icons/front.svg',description:'Bộ dụng cụ ghi chép của người học việc.',unlockCondition:'Trang bị khởi đầu · Người học việc của làng',price:0,fame:0,animation:'idle',equipped:false},
];
export const CHARACTER_ITEMS:CharacterItem[] = [...baseItems,...creationItems,...starterItems,
  {id:'bottoms-cotton',name:'Quần vải nâu',category:'bottoms',rarity:'Common',image:'/assets/icons/clothes.svg',description:'Quần vải thoải mái để dạo làng.',unlockCondition:'Đồ cơ bản',price:15,fame:0,animation:'walk',equipped:false,appearanceValue:'#6f5845'},
  {id:'bottoms-ranger',name:'Quần short kiểm lâm',category:'bottoms',rarity:'Common',image:'/assets/icons/clothes.svg',description:'Quần short nâu có túi hộp và gấu xắn để đi rừng.',unlockCondition:'Trang bị khởi đầu · Người giữ rừng',price:0,fame:0,animation:'walk',equipped:false,appearanceValue:'#806148'},
  {id:'bottoms-skirt',name:'Váy vải quê',category:'bottoms',rarity:'Rare',image:'/assets/icons/clothes.svg',description:'Váy vải màu kem dịu nhẹ.',unlockCondition:'Cần 10 danh vọng',price:25,fame:10,animation:'walk',equipped:false,appearanceValue:'#d4c59c'},
];
export function defaultCharacterCustomization(): CharacterCustomization {
  return {
    unlockedItems: ['shoes-sandals'],
    equipped: { shoes: 'shoes-sandals' },
    facing: 'front',
  };
}

export function normalizeCharacterCustomization(value: unknown): CharacterCustomization {
  const defaults = defaultCharacterCustomization();
  if (!value || typeof value !== 'object') return defaults;
  const saved = value as Record<string, unknown>;
  const validIds = new Set(CHARACTER_ITEMS.map(item => item.id));
  if(saved.inventory&&typeof saved.inventory==='object'){
    const data=saved.inventory as Partial<CharacterInventory>;
    const known=new Set([...validIds,'supply-rice','supply-lotus','special-ticket']);
    const ids=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'&&known.has(id)))]:[];
    const ownedItems=ids(data.ownedItems);
    const equippedItems:EquippedCharacterItems={};
    for(const [slot,id] of Object.entries(data.equippedItems??{})){
      const item=CHARACTER_ITEMS.find(item=>item.id===id&&item.category===slot);
      if(item&&ownedItems.includes(item.id))equippedItems[item.category]=item.id;
    }
    const receivedAt:Record<string,number>={};
    for(const id of ownedItems){const timestamp=data.receivedAt?.[id];receivedAt[id]=typeof timestamp==='number'&&Number.isFinite(timestamp)&&timestamp>=0?timestamp:0;}
    const inventory:CharacterInventory={version:1,ownedItems,equippedItems,defaultItems:ids(data.defaultItems).filter(id=>ownedItems.includes(id)),purchasedItems:ids(data.purchasedItems).filter(id=>ownedItems.includes(id)),receivedAt};
    return {inventory,unlockedItems:ownedItems.filter(id=>validIds.has(id)),equipped:{...equippedItems},facing:saved.facing==='three-quarter'?'three-quarter':'front'};
  }
  const unlocked = Array.isArray(saved.unlockedItems)
    ? saved.unlockedItems.filter((id): id is string => typeof id === 'string' && validIds.has(id))
    : [];
  const equipped: EquippedCharacterItems = {};
  if (saved.equipped && typeof saved.equipped === 'object') {
    for (const [category, id] of Object.entries(saved.equipped)) {
      const item = typeof id === 'string' ? CHARACTER_ITEMS.find(entry => entry.id === id) : undefined;
      if (item && item.category === category && unlocked.includes(item.id)) {
        equipped[item.category] = item.id;
      }
    }
  }
  return {
    unlockedItems: [...new Set(unlocked)],
    equipped: saved.equipped && typeof saved.equipped === 'object' ? equipped : { ...defaults.equipped },
    facing: saved.facing === 'three-quarter' ? 'three-quarter' : 'front',
  };
}

export function itemById(id: string | undefined): CharacterItem | undefined {
  return id ? CHARACTER_ITEMS.find(item => item.id === id) : undefined;
}
