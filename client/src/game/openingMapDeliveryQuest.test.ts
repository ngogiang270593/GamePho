import { afterEach, describe, expect, it } from 'vitest';
import {
  advanceOpeningMapDeliveryQuest,
  INITIAL_OPENING_MAP_DELIVERY_QUEST,
  OPENING_MAP_DELIVERY_QUEST_KEY,
  readOpeningMapDeliveryQuest,
  saveOpeningMapDeliveryQuest,
} from './openingMapDeliveryQuest';

afterEach(() => localStorage.clear());

describe('opening map delivery quest', () => {
  it('requires the correct sequential handoffs before revealing the next clue', () => {
    const carrying = advanceOpeningMapDeliveryQuest(INITIAL_OPENING_MAP_DELIVERY_QUEST, 'accept');
    const delivered = advanceOpeningMapDeliveryQuest(carrying, 'deliver');
    const completed = advanceOpeningMapDeliveryQuest(delivered, 'report');
    const clue = advanceOpeningMapDeliveryQuest(completed, 'reveal-clue');
    expect([carrying.stage, delivered.stage, completed.stage, clue.stage]).toEqual([
      'carrying', 'delivered', 'completed', 'clue-revealed',
    ]);
    expect(() => advanceOpeningMapDeliveryQuest(INITIAL_OPENING_MAP_DELIVERY_QUEST, 'deliver')).toThrow(/chưa sẵn sàng/);
    expect(() => advanceOpeningMapDeliveryQuest(carrying, 'report')).toThrow(/chưa sẵn sàng/);
  });

  it('persists delivery progress and reports corrupt saved state', () => {
    const carrying = advanceOpeningMapDeliveryQuest(INITIAL_OPENING_MAP_DELIVERY_QUEST, 'accept');
    saveOpeningMapDeliveryQuest(carrying);
    expect(readOpeningMapDeliveryQuest()).toEqual(carrying);
    localStorage.setItem(OPENING_MAP_DELIVERY_QUEST_KEY, '{bad json');
    expect(() => readOpeningMapDeliveryQuest()).toThrow(/Không đọc được tiến độ/);
    localStorage.setItem(OPENING_MAP_DELIVERY_QUEST_KEY, JSON.stringify({ stage: 'unknown' }));
    expect(() => readOpeningMapDeliveryQuest()).toThrow(/không hợp lệ/);
  });
});
