import type { ComponentProps } from 'react';
import { VillagerSprite } from './VillagerSprite';
import { NEIGHBOR_DESIGNS } from '../game/villagers';

export function NeighborSprite({ npcId, ...props }: Omit<ComponentProps<typeof VillagerSprite>, 'design'> & { npcId: string }) {
  const base = ({'village-pho-npc':'co-ba','village-farmer':'chu-tu','village-child':'ti','village-gatekeeper':'bac-sau','village-market-npc':'man'} as Record<string,string>)[npcId] ?? npcId;
  return <VillagerSprite {...props} design={NEIGHBOR_DESIGNS[base] ?? NEIGHBOR_DESIGNS['co-ba']} />;
}
