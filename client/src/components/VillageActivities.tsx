import { useEffect, useState } from 'react';
import { VILLAGE_QUESTS, VILLAGE_TREASURES, TREASURE_COOLDOWN } from '../game/villageQuests';
import { villageState, type VillageCommand } from '../services/villageGame';
import type { HistoryProgress } from '../services/historyProgress';

export function VillageActivities({progress,onCommand,questId,giftId}:{progress:HistoryProgress;onCommand:(command:VillageCommand)=>boolean;questId?:string;giftId?:string}) {
  const [tick,setNow]=useState(Date.now);
  const now=Math.max(tick,Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const state=villageState(progress);
  const gifts=giftId ? VILLAGE_TREASURES.filter(item=>item.id===giftId) : VILLAGE_TREASURES;
  return <div className="village-activities">
    {VILLAGE_QUESTS.filter(quest=>(!questId&&!giftId) || quest.id===questId).map(quest=>{
      const run=state.quests[quest.id];
      const step=run&&quest.steps[run.step];
      const cooldown=run?.claimedAt!==undefined ? Math.max(0,Math.ceil((quest.cooldownMs-(now-run.claimedAt))/1000)) : 0;
      const wait=step?.waitMs&&run ? Math.max(0,Math.ceil((step.waitMs-(now-run.updatedAt))/1000)) : 0;
      return <article className="village-quest" key={quest.id}><small>{quest.npc}</small><h3>{quest.title}</h3><p>{quest.description}</p>
        <p>Thưởng: 🪙 {quest.reward.gold} · ⭐ {quest.reward.fame}{quest.reward.tickets ? ` · 🎟️ ${quest.reward.tickets}`:''}{quest.reward.item?' · 🌾 Thóc quê':''}</p>
        {!run||run.claimedAt!==undefined ? <button type="button" disabled={cooldown>0} onClick={()=>onCommand({type:'accept',id:quest.id})}>{cooldown>0?`Xuất hiện lại sau ${cooldown}s`:'Nhận nhiệm vụ'}</button>
        : step ? <div><p><b>Bước {run.step+1}/{quest.steps.length}:</b> {step.prompt}</p>{wait>0&&<p role="status">Đang lớn… còn {wait}s</p>}<div className="village-row">{step.options.map(option=><button type="button" key={option.id} disabled={wait>0} onClick={()=>onCommand({type:'step',id:quest.id,answer:option.id})}>{option.label}</button>)}</div></div>
        : <button type="button" onClick={()=>onCommand({type:'claim',id:quest.id})}>Nhận thưởng · {quest.title}</button>}
      </article>;
    })}
    {!questId&&gifts.map(gift=>{
      const last=state.gathered[gift.id];
      const wait=last!==undefined?Math.max(0,Math.ceil((TREASURE_COOLDOWN-(now-last))/1000)):0;
      return <article key={gift.id} className="village-quest"><h3>🎁 {gift.name}</h3><p>{gift.gold} xu · {gift.fame} danh vọng</p><button type="button" disabled={wait>0} onClick={()=>onCommand({type:'gather',id:gift.id})}>{wait?`Quay lại sau ${wait}s`:'Nhặt quà'}</button></article>;
    })}
  </div>;
}
