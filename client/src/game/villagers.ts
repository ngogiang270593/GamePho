import type { VillagerDesign } from '../components/VillagerSprite';
import { characterOptions } from './character';
import { customerProfile } from './customerCast';
import type { Customer } from '../services/gameTypes';

export const NEIGHBOR_DESIGNS: Record<string, VillagerDesign> = {
  'co-ba': { age:48, female:true, skin:'#d8a276', hair:'#39362e', hairStyle:'bun', shirt:'#8e9c6c', pants:'#565b49', accent:'#d2bd8b', build:'round', outfit:'baba', prop:'scarf', pattern:true },
  'ba-nam': { age:73, female:true, skin:'#d2a478', hair:'#b1ada0', hairStyle:'bun', shirt:'#a99d80', pants:'#5c584b', accent:'#a78ca1', build:'sturdy', outfit:'baba', prop:'nonla' },
  ti: { age:17, female:false, skin:'#e1b28a', hair:'#32352e', hairStyle:'crop', shirt:'#768f85', pants:'#4e655e', accent:'#d9c885', build:'slim', outfit:'jersey', prop:'none' },
  man: { age:26, female:true, skin:'#efc49f', hair:'#40372f', hairStyle:'braid', shirt:'#8c806c', pants:'#565b4c', accent:'#cdb980', build:'slim', outfit:'tuthan', prop:'flower' },
  'chu-tu': { age:55, female:false, skin:'#bd8a62', hair:'#514a3c', hairStyle:'sidepart', shirt:'#7b8b7a', pants:'#5c5c50', accent:'#c2b486', build:'sturdy', outfit:'shirt', prop:'none', facialHair:true, pattern:true },
  'bac-sau': { age:66, female:false, skin:'#d7a579', hair:'#a6a396', hairStyle:'sidepart', shirt:'#a19272', pants:'#5b5d50', accent:'#d8c99b', build:'slim', outfit:'nguthan', prop:'glasses', facialHair:true },
};
const AGES: Record<string, number> = { bay:62,'ba-gia':47,'nam-dep':71,teo:29,'ship-lac':28,'bin-pin':24,sau:61,'hung-var':34,'dat-khung':25,'ti-top':23,'phuc-review':28,'mi-filter':24,tam:59,'tu-wifi':63,'lan-hong':42,'linh-deadline':21,'khoi-hoc':20,'vy-cuoi':22,'chu-binh':64,'co-hanh':45,'anh-chuan':38,bo:7,'me-min':35,'ong-tam':72,'co-sen':52,'chu-an':58,'hai-hat':41 };
export function customerDesign(customer: Pick<Customer, 'id' | 'name' | 'personaKey' | 'customerType'>): VillagerDesign {
  const profile = customerProfile(customer);
  if (profile) {
    const a = profile.appearance;
    const paletteIndex = [...profile.key].reduce((total, ch) => total+ch.charCodeAt(0), 0) % 4;
    return { age:AGES[profile.key] ?? 30, female:a.gender === 'female', skin:characterOptions.skin.find(s => s.value === a.skin)?.color ?? '#dca174',
      hair:characterOptions.hairColor.find(h => h.value === a.hairColor)?.color ?? '#29282e',
      hairStyle:a.hair === 'bun' || a.hair === 'braid' || a.hair === 'crop' ? a.hair : a.gender === 'female' ? 'bob' : ['ti-top','phuc-review'].includes(profile.key) ? 'quiff' : 'sidepart',
      shirt:profile.color, pants:profile.key === 'bo' ? '#78856b' : '#5b6053', accent:profile.prop === 'helmet' ? profile.color : ['#d6bb7c','#9ca982','#ca9e82','#b3aaa0'][paletteIndex],
      build:profile.child || profile.key.includes('deadline') || profile.key.includes('cuoi') || profile.role.includes('Tik') ? 'slim' : ['bay','tam','me-min','ba-gia'].includes(profile.key) ? 'round' : 'sturdy',
      outfit:profile.prop === 'helmet' ? 'jacket' : ['sau','hung-var','dat-khung'].includes(profile.key) ? 'jersey' : profile.prop === 'backpack' ? 'shirt' : 'baba',
      prop:profile.prop, facialHair:['bay','sau','ong-tam','chu-an'].includes(profile.key), pattern:['ba-gia','tam','tu-wifi','nam-dep','me-min'].includes(profile.key) };
  }
  // Old saves also gain age-appropriate drawings without changing customer ids.
  const index = Math.abs(customer.id);
  const female = customer.customerType === 4 || customer.customerType === 0 && index%2 === 1;
  return { age:customer.customerType === 4 ? 62 : customer.customerType === 5 ? 21 : customer.customerType === 7 ? 38 : 30+index%23, female,
    skin:['#efc39e','#d8a276','#bc855c','#a97149'][index%4], hair:'#39362e', hairStyle:female ? index%2 ? 'bun' : 'bob' : index%3 ? 'sidepart' : 'crop',
    shirt:['#899b78','#a48d74','#7e9693','#b08a75','#a095ab'][index%5], pants:'#5b6053', accent:'#d6bc8a', build:index%3 ? 'sturdy' : 'round',
    outfit:customer.customerType === 1 ? 'jacket' : customer.customerType === 2 ? 'jersey' : 'baba',
    prop:customer.customerType === 1 ? 'helmet' : customer.customerType === 3 ? 'phone' : customer.customerType === 5 ? 'backpack' : index%3 ? 'none' : 'glasses', pattern:index%4===0 };
}
