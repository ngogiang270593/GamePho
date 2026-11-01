import { describe, expect, it } from 'vitest';
import { customerAppearance, deliveryPath, orderReaction, pointOnPath, recipeIssue, shopLayout } from './shop';
import type { Customer, PhoMenuItem, PhoOrder } from '../services/gameTypes';

describe('shop scene rules', () => {
  it.each([[1200, 650], [390, 580], [320, 490], [812, 210], [700, 190]])('takes the carrier around the counter on a %spx viewport', (width, height) => {
    const layout = shopLayout(width, height);
    const route = deliveryPath(layout);
    expect(pointOnPath(route, 0)).toEqual(layout.home);
    expect(pointOnPath(route, 1)).toEqual(layout.delivery);
    for (let i = 0; i <= 100; i++) {
      const p = pointOnPath(route, i / 100);
      const insideCounter = p.x > layout.counter.x - 12 && p.x < layout.counter.x + layout.counter.width + 12 && p.y > layout.counter.y - 12 && p.y < layout.counter.y + 94;
      expect(insideCounter, JSON.stringify(p)).toBe(false);
    }
  });
  it('allows an order with no toppings, enforces the topping limit and unavailable dishes', () => {
    const pho = { isAvailable: true } as PhoMenuItem;
    expect(recipeIssue(pho, [])).toBeNull();
    expect(recipeIssue(pho, ['a', 'a', 'b'])).toBeNull();
    expect(recipeIssue(pho, ['a', 'b', 'c', 'd', 'e', 'f'])).toBeTruthy();
    expect(recipeIssue({ ...pho, isAvailable: false }, [])).toBeTruthy();
  });
  it('keeps customer appearances stable and reads the actual order outcome', () => {
    const customer = { id: 12, customerType: 4 } as Customer;
    expect(customerAppearance(customer)).toEqual(customerAppearance(customer));
    expect(customerAppearance(customer).gender).toBe('female');
    expect(orderReaction({ isCorrect: true, dramaTriggered: false } as PhoOrder)).toBe('happy');
    expect(orderReaction({ isCorrect: false, dramaTriggered: false } as PhoOrder)).toBe('unhappy');
    expect(orderReaction({ isCorrect: false, dramaTriggered: true } as PhoOrder)).toBe('drama');
  });
});
