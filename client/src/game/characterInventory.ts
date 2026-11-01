import {DEFAULT_APPEARANCE,type CharacterAppearance} from './character';
import {CHARACTER_ITEMS,normalizeCharacterCustomization,type CharacterCustomization,type CharacterInventory,type EquippedCharacterItems} from './characterCustomization';
import type { StartingCharacterTemplate } from './startingCharacters';

export function initialInventory(appearance:CharacterAppearance=DEFAULT_APPEARANCE,now=Date.now()):CharacterCustomization {
  const equippedItems:EquippedCharacterItems={shoes:'shoes-sandals',bottoms:'bottoms-cotton'};
  for(const [slot,key] of [['hair','hair'],['clothes','outfit'],['hat','accessory']] as const){
    const item=CHARACTER_ITEMS.find(item=>item.category===slot&&item.appearanceValue===appearance[key]);
    if(item)equippedItems[slot]=item.id;
  }
  const defaultItems=Object.values(equippedItems);
  const inventory:CharacterInventory={version:1,defaultItems:[...defaultItems],ownedItems:[...defaultItems],purchasedItems:[],equippedItems,receivedAt:Object.fromEntries(defaultItems.map(id=>[id,now]))};
  return normalizeCharacterCustomization({inventory,facing:'front'});
}

export function startingCharacterInventory(appearance:CharacterAppearance,template:StartingCharacterTemplate,now=Date.now()):CharacterCustomization {
  const base=initialInventory(appearance,now);
  if(!base.inventory)throw Error('Không thể tạo túi đồ khởi đầu.');
  const inventory={...base.inventory,defaultItems:[...base.inventory.defaultItems],ownedItems:[...base.inventory.ownedItems],equippedItems:{...base.inventory.equippedItems},receivedAt:{...base.inventory.receivedAt}};
  for(const id of template.gear){
    const item=CHARACTER_ITEMS.find(entry=>entry.id===id);
    if(!item)throw Error(`Không tìm thấy trang bị khởi đầu "${id}".`);
    if(!inventory.ownedItems.includes(id)){
      inventory.ownedItems.push(id);
      inventory.defaultItems.push(id);
      inventory.receivedAt[id]=now;
    }
    inventory.equippedItems[item.category]=id;
  }
  return normalizeCharacterCustomization({inventory,facing:base.facing});
}

export function migrateInventory(value:unknown,appearance:CharacterAppearance):CharacterCustomization {
  if(value&&typeof value==='object'&&(value as CharacterCustomization).inventory)return normalizeCharacterCustomization(value);
  const defaults=initialInventory(appearance,0),legacy=normalizeCharacterCustomization(value);
  const paid=legacy.unlockedItems.filter(id=>CHARACTER_ITEMS.some(item=>item.id===id&&item.price>0));
  // Legacy versions granted every zero-price item automatically. Preserve the
  // selected look, equipped items and paid unlocks, not those bulk grants.
  const ownedItems=[...new Set([...defaults.inventory!.ownedItems,...paid,...Object.values(legacy.equipped)])];
  return normalizeCharacterCustomization({facing:legacy.facing,inventory:{...defaults.inventory,ownedItems,purchasedItems:paid.filter(id=>!defaults.inventory!.defaultItems.includes(id)),equippedItems:{...defaults.equipped,...legacy.equipped},receivedAt:Object.fromEntries(ownedItems.map(id=>[id,0]))}});
}

export function receiveInventoryItem(customization:CharacterCustomization,id:string,now:number,purchased=false):CharacterCustomization {
  const next=normalizeCharacterCustomization(customization);
  if(!next.inventory)throw Error('Túi đồ chưa được đồng bộ.');
  const inventory=next.inventory;
  if(!inventory.ownedItems.includes(id)){inventory.ownedItems.push(id);inventory.receivedAt[id]=now;}
  if(purchased&&!inventory.purchasedItems.includes(id))inventory.purchasedItems.push(id);
  return normalizeCharacterCustomization(next);
}

export function changeEquipment(customization:CharacterCustomization,equipped:EquippedCharacterItems):CharacterCustomization {
  const next=normalizeCharacterCustomization(customization);
  return normalizeCharacterCustomization(next.inventory?{...next,inventory:{...next.inventory,equippedItems:{...equipped}}}:{...next,equipped:{...equipped}});
}
