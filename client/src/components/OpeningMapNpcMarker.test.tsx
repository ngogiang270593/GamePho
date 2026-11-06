import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeSpriteSheet } from '../game/characterSpriteSheet';
import { OPENING_MAP_SPAWN } from '../game/openingMap';
import { createOpeningMapVillagers, DEFAULT_OPENING_MAP_NPCS } from '../game/openingMapNpcs';
import { OpeningMapNpcMarker } from './OpeningMapNpcMarker';

const sprite = vi.hoisted(() => ({ sheet: null as ReturnType<typeof makeSpriteSheet> | null }));
vi.mock('../game/characterSpriteSheet', async importOriginal => ({
  ...await importOriginal<typeof import('../game/characterSpriteSheet')>(),
  useAppliedSpriteSheet: () => sprite.sheet,
}));

afterEach(() => {
  cleanup();
  sprite.sheet = null;
  vi.useRealTimers();
});

describe('opening map NPC action', () => {
  it('plays each new villager signature animation with exactly four frames', () => {
    const sheet = makeSpriteSheet('/villager.png', 1024, 256, 'Villager · động tác đặc trưng', 4, 1);
    sheet.clips['npc-morning'].directions.down = { start: 0, count: 4 };
    sprite.sheet = sheet;
    const template = DEFAULT_OPENING_MAP_NPCS.find(item => item.id === 'messenger') ?? DEFAULT_OPENING_MAP_NPCS[0];
    for (const npc of createOpeningMapVillagers(template)) {
      const { container, unmount } = render(<svg><OpeningMapNpcMarker
        npc={npc}
        selected={false}
        showLocationLabel={false}
        interactionLabel="Trò chuyện với "
        onInteract={vi.fn()}
        onPosition={vi.fn()}
      /></svg>);
      const marker = container.querySelector(`[data-npc-id="${npc.id}"]`);
      expect(marker?.getAttribute('data-npc-action')).toBe('npc-morning');
      expect(marker?.querySelector('svg[data-preview-action="npc-morning"][data-facing="down"]')).toBeTruthy();
      unmount();
    }
  });

  it('keeps the NPC in place and shows its front-facing signature animation', () => {
    const sheet = makeSpriteSheet('/npc.png', 2048, 256, 'NPC · động tác đặc trưng', 8, 1);
    sheet.clips['npc-morning'].directions.down = { start: 0, count: 8 };
    sprite.sheet = sheet;
    const npc = { ...DEFAULT_OPENING_MAP_NPCS[1], point: OPENING_MAP_SPAWN, facing: 'left' as const };
    const onPosition = vi.fn();
    render(<svg><OpeningMapNpcMarker
      npc={npc}
      selected={false}
      showLocationLabel
      interactionLabel="Trò chuyện với "
      onInteract={vi.fn()}
      onPosition={onPosition}
    /></svg>);
    const marker = screen.getByRole('button', { name: /Tảo/ });
    expect(marker.getAttribute('data-npc-x')).toBe(String(OPENING_MAP_SPAWN.x));
    expect(marker.getAttribute('data-npc-y')).toBe(String(OPENING_MAP_SPAWN.y));
    expect(marker.getAttribute('data-patrolling')).toBe('false');
    expect(marker.getAttribute('data-npc-action')).toBe('npc-morning');
    expect(marker.querySelector('svg[data-preview-action="npc-morning"][data-facing="down"]')).toBeTruthy();
    expect(onPosition).toHaveBeenCalled();
  });
});
