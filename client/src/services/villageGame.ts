import { SHOP_PRODUCTS } from '../game/villageShop';
import { TREASURE_COOLDOWN, VILLAGE_QUESTS, VILLAGE_TREASURES, type VillageState } from '../game/villageQuests';
import { HISTORY_PROGRESS_KEY, saveHistoryProgress, type HistoryProgress } from './historyProgress';
import { HISTORY_PROFILE_KEY, saveHistoryProfile, trainHistorySkill, type HistoryProfile } from './historyProfile';
import { normalizeCharacterCustomization } from '../game/characterCustomization';
import {migrateInventory,receiveInventoryItem,changeEquipment} from '../game/characterInventory';

export type VillageCommand =
  | {type:'buy'|'equip'|'unequip';id:string}
  | {type:'accept'|'claim'|'gather';id:string}
  | {type:'step';id:string;answer:string};
export interface VillageResult { progress:HistoryProgress;profile:HistoryProfile;message:string }

export function villageState(progress:HistoryProgress):VillageState {
  const input = progress.village;
  const state:VillageState={quests:{},gathered:{},inventory:{}};
  for(const quest of VILLAGE_QUESTS){
    const run=input?.quests?.[quest.id];
    if(run&&Number.isInteger(run.step)&&run.step>=0&&run.step<=quest.steps.length
      &&Number.isFinite(run.acceptedAt)&&Number.isFinite(run.updatedAt)
      &&(run.claimedAt===undefined||Number.isFinite(run.claimedAt)))state.quests[quest.id]={...run};
  }
  for(const gift of VILLAGE_TREASURES){const value=input?.gathered?.[gift.id];if(typeof value==='number'&&Number.isFinite(value))state.gathered[gift.id]=value;}
  for(const item of SHOP_PRODUCTS){const value=input?.inventory?.[item.id];if(typeof value==='number'&&Number.isSafeInteger(value)&&value>0)state.inventory[item.id]=value;}
  return state;
}

export function applyVillageCommand(progress:HistoryProgress,profile:HistoryProfile,command:VillageCommand,now=Date.now()):VillageResult {
  const state=villageState(progress);
  const nextProgress={...progress,village:state};
  let customization=migrateInventory(profile.customization,profile.appearance);
  let nextProfile={...profile,appearance:{...profile.appearance},customization};
  let message='';
  if (command.type==='buy' || command.type==='equip' || command.type==='unequip') {
    const product=SHOP_PRODUCTS.find(item=>item.id===command.id);
    if (!product || product.rewardOnly) throw Error('Vật phẩm này chỉ nhận được qua hoạt động trong làng.');
    const owned=product.equipment ? customization.unlockedItems.includes(product.id) : (state.inventory[product.id] ?? 0)>0;
    if (command.type==='buy') {
      if (owned) throw Error('Bạn đã sở hữu vật phẩm này.');
      if (progress.fame<product.fame) throw Error(`Chưa mở khóa: cần ${product.fame} danh vọng.`);
      if (progress.gold<product.price) throw Error(`Không đủ xu. Bạn còn thiếu ${product.price-progress.gold} xu.`);
      nextProgress.gold-=product.price;
      customization=receiveInventoryItem(customization,product.id,now,true);
      if (!product.equipment) state.inventory[product.id]=1;
      nextProgress.freeUnoTickets+=product.tickets ?? 0;
      message=`Đã mua ${product.name} với ${product.price} xu.${product.tickets ? ' Vé đã cộng vào lượt chơi UNO.' : ''}`;
    } else {
      if (!owned || !product.equipment) throw Error('Bạn chưa sở hữu trang bị này.');
      const category=product.equipment.category;
      if (command.type==='equip') {
        customization=changeEquipment(customization,{...customization.equipped,[category]:product.id});
        message=`Đã trang bị ${product.name}.`;
      } else {
        if (customization.equipped[category]!==product.id) throw Error('Vật phẩm này chưa được trang bị.');
        const equipped={...customization.equipped};delete equipped[category];
        customization=changeEquipment(customization,equipped);
        message=`Đã tháo ${product.name}.`;
      }
    }
  } else if (command.type==='gather') {
    const gift=VILLAGE_TREASURES.find(item=>item.id===command.id);
    if (!gift) throw Error('Không tìm thấy phần quà này.');
    const collectedAt=state.gathered[gift.id];
    if (collectedAt!==undefined && now-collectedAt<TREASURE_COOLDOWN) throw Error('Quà đã được nhặt. Hãy quay lại sau vài phút.');
    const gatheringBonus=profile.startingCharacterId==='forest-keeper'
      ? Math.ceil(gift.gold*(profile.startingSkills?.herbalism ?? 95)/500) : 0;
    state.gathered[gift.id]=now; nextProgress.gold+=gift.gold+gatheringBonus;nextProgress.fame+=gift.fame;
    nextProfile=trainHistorySkill(nextProfile,'herbalism');
    message=`Nhận ${gift.gold+gatheringBonus} xu và ${gift.fame} danh vọng!`;
  } else {
    const quest=VILLAGE_QUESTS.find(item=>item.id===command.id);
    if (!quest) throw Error('Không tìm thấy nhiệm vụ.');
    const run=state.quests[quest.id];
    if (command.type==='accept') {
      if (run && run.claimedAt===undefined) throw Error('Bạn đang thực hiện nhiệm vụ này.');
      if (run?.claimedAt!==undefined && now-run.claimedAt<quest.cooldownMs) throw Error('Nhiệm vụ sẽ xuất hiện lại sau ít phút.');
      state.quests[quest.id]={step:0,acceptedAt:now,updatedAt:now};
      message=`Đã nhận nhiệm vụ ${quest.title}.`;
    } else {
      if (!run || run.claimedAt!==undefined) throw Error('Hãy nhận nhiệm vụ trước.');
      if (command.type==='step') {
        const step=quest.steps[run.step];
        if (!step) throw Error('Nhiệm vụ đã hoàn thành, hãy nhận thưởng.');
        if (now-run.updatedAt<(step.waitMs ?? 0)) throw Error('Lúa chưa chín, hãy đợi thêm một chút.');
        if (command.answer!==step.answer) throw Error('Chưa đúng rồi! Hãy thử lựa chọn khác nhé.');
        state.quests[quest.id]={...run,step:run.step+1,updatedAt:now};
        message=run.step+1===quest.steps.length ? 'Hoàn thành! Bạn có thể nhận thưởng.' : 'Đúng rồi, tiếp tục nhé!';
      } else {
        if (run.step!==quest.steps.length) throw Error('Bạn chưa hoàn thành các bước của nhiệm vụ.');
        state.quests[quest.id]={...run,claimedAt:now};
        const laborBonus=profile.startingCharacterId==='field-worker'
          ? Math.ceil(quest.reward.gold*(profile.startingSkills?.stamina ?? 98)/500) : 0;
        nextProgress.gold+=quest.reward.gold+laborBonus;nextProgress.fame+=quest.reward.fame;
        nextProfile=trainHistorySkill(nextProfile,'stamina');
        nextProgress.freeUnoTickets+=quest.reward.tickets ?? 0;
        if (quest.reward.item) {state.inventory[quest.reward.item]=(state.inventory[quest.reward.item] ?? 0)+1;customization=receiveInventoryItem(customization,quest.reward.item,now);}
        message=`Nhận ${quest.reward.gold+laborBonus} xu, ${quest.reward.fame} danh vọng${quest.reward.tickets ? ` và ${quest.reward.tickets} vé UNO` : ''}${quest.reward.item ? ', cùng vật phẩm trong kho' : ''}!`;
      }
    }
  }
  nextProfile.customization=customization;
  return {progress:nextProgress,profile:nextProfile,message};
}

// Roll back both records if either storage write fails. State updates only occur
// after this function returns, so a failed purchase never grants free equipment.
export function saveVillageResult(result:VillageResult):void {
  const oldProgress=localStorage.getItem(HISTORY_PROGRESS_KEY);
  const oldProfile=localStorage.getItem(HISTORY_PROFILE_KEY);
  try { saveHistoryProgress(result.progress);saveHistoryProfile(result.profile); }
  catch (cause) {
    for (const [key,value] of [[HISTORY_PROGRESS_KEY,oldProgress],[HISTORY_PROFILE_KEY,oldProfile]]) {
      if (value===null) localStorage.removeItem(key!);else localStorage.setItem(key!,value!);
    }
    throw cause;
  }
}
