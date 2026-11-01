import { describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from './character';
import { CHARACTER_ITEMS } from './characterCustomization';
import { changeEquipment, initialInventory, migrateInventory, receiveInventoryItem } from './characterInventory';

describe('owned character inventory', () => {
  it('creates only the appearance defaults selected during character creation', () => {
    const customization = initialInventory(undefined, 1234);
    const inventory = customization.inventory!;
    const selectedHair = CHARACTER_ITEMS.find(item => item.id === customization.equipped.hair);

    expect(inventory.ownedItems).toEqual(inventory.defaultItems);
    expect(inventory.purchasedItems).toEqual([]);
    expect(inventory.ownedItems).toContain('shoes-sandals');
    expect(selectedHair).toBeTruthy();
    expect(inventory.receivedAt).toEqual(Object.fromEntries(inventory.defaultItems.map(id => [id, 1234])));
    expect(inventory.ownedItems).not.toContain('wings-light');
  });

  it('adds a purchased item only once and keeps its receipt metadata', () => {
    const started = initialInventory(undefined, 100);
    const purchased = receiveInventoryItem(started, 'wings-light', 456, true);
    const boughtAgain = receiveInventoryItem(purchased, 'wings-light', 789, true);

    expect(boughtAgain.inventory?.ownedItems.filter(id => id === 'wings-light')).toHaveLength(1);
    expect(boughtAgain.inventory?.purchasedItems.filter(id => id === 'wings-light')).toHaveLength(1);
    expect(boughtAgain.inventory?.receivedAt['wings-light']).toBe(456);
  });

  it('keeps equipped items owned and restores inventory state after serialization', () => {
    const received = receiveInventoryItem(initialInventory(), 'wings-light', 456, true);
    const equipped = changeEquipment(received, { ...received.equipped, wings: 'wings-light' });
    const restored = migrateInventory(JSON.parse(JSON.stringify(equipped)), DEFAULT_APPEARANCE);

    expect(restored.inventory?.ownedItems).toContain('wings-light');
    expect(restored.inventory?.purchasedItems).toContain('wings-light');
    expect(restored.inventory?.equippedItems.wings).toBe('wings-light');
    expect(restored.equipped.wings).toBe('wings-light');
  });

  it('removes equipment without removing the item from the bag', () => {
    const received = receiveInventoryItem(initialInventory(), 'wings-light', 456, true);
    const equipped = changeEquipment(received, { ...received.equipped, wings: 'wings-light' });
    const removed = changeEquipment(equipped, { ...equipped.equipped, wings: undefined });

    expect(removed.inventory?.ownedItems).toContain('wings-light');
    expect(removed.inventory?.equippedItems.wings).toBeUndefined();
  });
});
