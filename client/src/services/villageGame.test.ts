import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyVillageCommand, saveVillageResult, villageState } from './villageGame';
import { freshHistoryProgress, HISTORY_PROGRESS_KEY, readHistoryProgress } from './historyProgress';
import { freshHistoryProfile, HISTORY_PROFILE_KEY, readHistoryProfile } from './historyProfile';
import { VILLAGE_QUESTS } from '../game/villageQuests';
import { VILLAGE_LOCATIONS } from '../game/villageLocations';
import { canStandAt } from '../game/world';

afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
describe('village economy and activities',()=>{
  const player=()=>({progress:{...freshHistoryProgress(),gold:500,fame:500},profile:freshHistoryProfile()});
  it('checks balance, locks and duplicate ownership without mutating input',()=>{
    const {progress,profile}=player();
    expect(()=>applyVillageCommand({...progress,gold:0},profile,{type:'buy',id:'hair-ponytail'})).toThrow('Không đủ xu');
    expect(()=>applyVillageCommand({...progress,fame:0},profile,{type:'buy',id:'hair-ponytail'})).toThrow('Chưa mở khóa');
    const bought=applyVillageCommand(progress,profile,{type:'buy',id:'hair-ponytail'});
    expect(bought.progress.gold).toBe(475);
    expect(progress.gold).toBe(500);
    expect(profile.customization.unlockedItems).not.toContain('hair-ponytail');
    expect(()=>applyVillageCommand(bought.progress,bought.profile,{type:'buy',id:'hair-ponytail'})).toThrow('đã sở hữu');
    const equipped=applyVillageCommand(bought.progress,bought.profile,{type:'equip',id:'hair-ponytail'});
    expect(equipped.profile.customization.equipped.hair).toBe('hair-ponytail');
    expect(()=>applyVillageCommand(progress,profile,{type:'equip',id:'hair-ponytail'})).toThrow('chưa sở hữu');
  });
  it('keeps unequipped starter shoes removed after saving and loading',()=>{
    const {progress,profile}=player();
    const result=applyVillageCommand(progress,profile,{type:'unequip',id:'shoes-ranger-boots'});
    saveVillageResult(result);
    expect(readHistoryProfile().customization.equipped.shoes).toBeUndefined();
  });
  it('rolls back the coin debit when saving inventory fails',()=>{
    const {progress,profile}=player();
    localStorage.setItem(HISTORY_PROGRESS_KEY,JSON.stringify(progress));
    localStorage.setItem(HISTORY_PROFILE_KEY,JSON.stringify(profile));
    const original=Storage.prototype.setItem;
    let fail=true;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key,value){
      if(key===HISTORY_PROFILE_KEY&&fail){fail=false;throw Error('Storage full');}
      original.call(this,key,value);
    });
    const result = applyVillageCommand(progress,profile,{type:'buy',id:'hair-ponytail'});
    expect(()=>saveVillageResult(result)).toThrow('Storage full');
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(500);
    expect(readHistoryProfile().customization.unlockedItems).not.toContain('hair-ponytail');
  });
  it('requires task actions, respects growth time and cannot award twice',()=>{
    const quest=VILLAGE_QUESTS.find(item=>item.id==='farm')!;
    let {progress,profile}=player();
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'accept',id:'farm'},1000));
    expect(()=>applyVillageCommand(progress,profile,{type:'claim',id:'farm'},1000)).toThrow('chưa hoàn thành');
    expect(()=>applyVillageCommand(progress,profile,{type:'step',id:'farm',answer:'harvest'},1000)).toThrow('Chưa đúng');
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'step',id:'farm',answer:'sow'},1000));
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'step',id:'farm',answer:'water'},1000));
    saveVillageResult({progress,profile,message:''});
    progress=readHistoryProgress();profile=readHistoryProfile();
    expect(()=>applyVillageCommand(progress,profile,{type:'step',id:'farm',answer:'harvest'},5000)).toThrow('chưa chín');
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'step',id:'farm',answer:'harvest'},21000));
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'claim',id:'farm'},21000));
    expect(progress.gold).toBe(560);
    expect(villageState(progress).inventory['supply-rice']).toBe(1);
    expect(()=>applyVillageCommand(progress,profile,{type:'claim',id:'farm'},21000)).toThrow();
    expect(()=>applyVillageCommand(progress,profile,{type:'accept',id:'farm'},22000)).toThrow('xuất hiện lại');
    expect(applyVillageCommand(progress,profile,{type:'accept',id:'farm'},21000+quest.cooldownMs).progress.village?.quests.farm.step).toBe(0);
  });
  it('awards UNO tickets and prevents collecting the same treasure during cooldown',()=>{
    let {progress,profile}=player();
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'buy',id:'special-ticket'},1000));
    expect(progress.freeUnoTickets).toBe(1);
    ({progress,profile}=applyVillageCommand(progress,profile,{type:'gather',id:'village-gift-lotus'},1000));
    expect(progress.gold).toBe(425);
    expect(()=>applyVillageCommand(progress,profile,{type:'gather',id:'village-gift-lotus'},2000)).toThrow('đã được nhặt');
    expect(applyVillageCommand(progress,profile,{type:'gather',id:'village-gift-lotus'},301000).progress.gold).toBe(450);
  });
  it('does not apply bonuses from legacy character creation skills',()=>{
    const {progress,profile}=player();
    const forestProfile={
      ...profile,
      startingCharacterId:'forest-keeper' as const,
      startingSkills:{herbalism:99,hunting:88,stamina:72,intellect:65},
    };
    const result=applyVillageCommand(progress,forestProfile,{type:'gather',id:'village-gift-lotus'},1000);
    expect(result.progress.gold).toBe(progress.gold+25);
    expect(result.profile).not.toHaveProperty('startingSkills');
    expect(result.message).toContain('xu');
  });
  it('puts every new location on reachable ground',()=>{
    for(const location of VILLAGE_LOCATIONS)expect(canStandAt(location.point),location.name).toBe(true);
  });
});
