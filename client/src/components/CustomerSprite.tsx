import type { ComponentProps } from 'react';
import type { Customer } from '../services/gameTypes';
import { VillagerSprite } from './VillagerSprite';
import { customerDesign } from '../game/villagers';

export function CustomerSprite({ customer, ...props }: Omit<ComponentProps<typeof VillagerSprite>, 'design'> & { customer: Pick<Customer, 'id' | 'name' | 'personaKey' | 'customerType'> }) {
  return <VillagerSprite {...props} design={customerDesign(customer)} className={`customer-sprite ${props.className ?? ''}`} />;
}
