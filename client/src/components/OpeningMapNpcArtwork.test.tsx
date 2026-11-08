import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPENING_MAP_NPCS } from '../game/openingMapNpcs';
import { makeSpriteSheet } from '../game/characterSpriteSheet';
import { OpeningMapNpcArtwork } from './OpeningMapNpcArtwork';

vi.mock('./CharacterSprite', () => ({
  CharacterSprite: ({ className, spriteAction }: { className?: string; spriteAction?: string }) => <svg className={className} data-testid="sprite-sheet-art" data-sprite-action={spriteAction} />,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('OpeningMapNpcArtwork', () => {
  it('uses the combat walk clip when configured and falls back to the NPC idle clip when missing', () => {
    const npc = DEFAULT_OPENING_MAP_NPCS.find(character => character.id === 'patrol-archer')!;
    const { rerender } = render(<OpeningMapNpcArtwork
      npcId={npc.id}
      appearance={npc.appearance}
      design={npc.design}
      artwork={npc.artwork}
      pose={npc.pose}
      facing="left"
      action="walk"
      className="battle-sprite"
      spriteSheet={makeSpriteSheet('/patrol-walk.png', 2048, 256, 'Patrol walk', 8, 1)}
    />);
    expect(screen.getByTestId('sprite-sheet-art').getAttribute('data-sprite-action')).toBe('walk');

    rerender(<OpeningMapNpcArtwork
      npcId={npc.id}
      appearance={npc.appearance}
      design={npc.design}
      artwork={npc.artwork}
      pose={npc.pose}
      facing="left"
      action="walk"
      className="battle-sprite"
      spriteSheet={makeSpriteSheet('/patrol-idle.png', 256, 256, 'Patrol idle')}
    />);
    expect(screen.getByTestId('sprite-sheet-art').getAttribute('data-sprite-action')).toBe('npc-morning');
  });

  it('uses the matching source character image for dialogue portraits despite an applied sprite sheet', () => {
    const npc = DEFAULT_OPENING_MAP_NPCS.find(character => character.id === 'memory-keeper')!;
    render(<OpeningMapNpcArtwork
      npcId={npc.id}
      appearance={npc.appearance}
      design={npc.design}
      artwork={npc.artwork}
      pose={npc.pose}
      facing={npc.facing}
      className="dialogue-portrait"
      portrait
      spriteSheet={makeSpriteSheet('/custom-npc.png', 2048, 1024, 'Walking', 8, 4)}
    />);

    expect(document.querySelector('.dialogue-portrait')?.getAttribute('data-npc-artwork')).toBe('ba-me-que');
    expect(document.querySelector('.dialogue-portrait image')?.getAttribute('href')).toContain('ba-me-que');
    expect(screen.queryByTestId('sprite-sheet-art')).toBeNull();
  });
});
