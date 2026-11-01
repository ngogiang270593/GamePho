import { describe, expect, it } from 'vitest';
import { MAP_ONE_NPCS } from './mapOneNpcs';
import { findMapOneNpcVisualCollisions, resolveMapOneNpcVisualCollisions } from './mapOneNpcDesign';

describe('Map One NPC visual identities', () => {
  it('gives every NPC a distinct visual profile and hairstyle', () => {
    expect(MAP_ONE_NPCS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(MAP_ONE_NPCS.map(npc => npc.design.hairstyle)).size).toBe(MAP_ONE_NPCS.length);
    expect(findMapOneNpcVisualCollisions(MAP_ONE_NPCS)).toEqual([]);
    const expectedTools: Record<string, { heldItem?: string; weapon?: string }> = {
      farmer: { heldItem: 'sickle' },
      'vegetable-gatherer': { heldItem: 'woven-basket' },
      'market-vendor': { heldItem: 'trade-scale' },
      cook: { heldItem: 'cooking-pot' },
      'boat-person': { weapon: 'paddle' },
      messenger: { heldItem: 'bamboo-tablet' },
      blacksmith: { heldItem: 'tongs' },
      quartermaster: { heldItem: 'grain-basket' },
      'horse-keeper': { heldItem: 'horse-reins' },
      'child-runner': { heldItem: 'toy-kite' },
      'village-healer': { heldItem: 'herbs' },
      storyteller: { heldItem: 'bamboo-tablet' },
      historian: { heldItem: 'bamboo-tablet' },
    };
    for (const npc of MAP_ONE_NPCS) {
      expect(npc.design.occupation).toBeTruthy();
      expect(npc.design.historicalRole).toBeTruthy();
      expect(npc.design.faceShape).toBeTruthy();
      expect(npc.design.bodyType).toBeTruthy();
      expect(npc.design.outfitColor).toMatch(/^#[\da-f]{6}$/i);
      expect(npc.design.accessory).toBeTruthy();
      expect(npc.design.animationSet).toBeTruthy();
      if (npc.appearance.gender === 'female') expect(npc.design.beardStyle).toBe('none');
      const expectedTool = expectedTools[npc.id];
      if (expectedTool?.heldItem) expect(npc.design.heldItem, npc.id).toBe(expectedTool.heldItem);
      if (expectedTool?.weapon) expect(npc.design.weapon, npc.id).toBe(expectedTool.weapon);
    }
  });

  it('repairs cloned profiles by changing multiple identity traits', () => {
    const original = MAP_ONE_NPCS[0].design;
    const repaired = resolveMapOneNpcVisualCollisions([
      { id: 'first', design: original },
      { id: 'duplicate', design: { ...original } },
    ]);
    const first = repaired[0].design;
    const duplicate = repaired[1].design;
    const changed = [
      first.faceShape !== duplicate.faceShape || first.faceWidth !== duplicate.faceWidth || first.jawWidth !== duplicate.jawWidth,
      first.hairstyle !== duplicate.hairstyle,
      first.bodyType !== duplicate.bodyType || first.height !== duplicate.height,
      first.outfitColor !== duplicate.outfitColor || first.accentColor !== duplicate.accentColor || first.trouserColor !== duplicate.trouserColor,
    ].filter(Boolean);
    expect(changed.length).toBeGreaterThanOrEqual(3);
    expect(findMapOneNpcVisualCollisions(repaired)).toEqual([]);
  });
});
