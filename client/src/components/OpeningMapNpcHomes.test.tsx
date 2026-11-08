import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpeningMapNpcHomes } from './OpeningMapNpcHomes';

describe('opening map landmarks', () => {
  it('renders the themed landscape clusters and their signature locations', () => {
    const { container } = render(<svg><OpeningMapNpcHomes /></svg>);

    expect(container.querySelectorAll('[data-scenery-cluster]')).toHaveLength(10);
    for (const landmark of [
      'herbalist-shop', 'toy-stall', 'road-lanterns', 'inn-stall', 'wine-house',
      'fruit-baskets', 'river-reeds', 'water-hyacinth', 'buffalo-pasture',
      'forge', 'training-yard', 'woodcutter-hut', 'ruined-wall', 'poison-cave',
      'outer-watchtower', 'roadside-hideout',
      'black-wolf-lair', 'swamp-pools', 'witch-cave-details', 'phuong-cliff',
      'tax-office',
    ]) {
      expect(container.querySelector(`[data-landmark="${landmark}"]`), landmark).not.toBeNull();
    }
    expect(container.querySelector('[data-landmark="buffalo-pasture"][data-nearby-npc="herdboy-a-sang"]')).not.toBeNull();
    expect(container.querySelector('[data-landmark="ruined-wall"][data-nearby-npc="beggar-hac-lao"]')).not.toBeNull();
    expect(container.querySelector('[data-landmark="bounty-stone"]')).toBeNull();
    expect(container.querySelector('[data-detail="acau-broken-cot"]')).not.toBeNull();
    expect(container.querySelector('[data-detail="acau-bowls-and-note"]')).not.toBeNull();
  });

  it('keeps scenery separate from NPC markers and gameplay controls', () => {
    const { container } = render(<svg><OpeningMapNpcHomes /></svg>);

    expect(container.querySelectorAll('[data-npc-homestead]')).toHaveLength(5);
    expect(container.querySelector('[data-rest-point]')).toBeNull();
    expect(container.querySelector('[role="button"]')).toBeNull();
  });

  it('can pause decorative motion while the player is moving', () => {
    const { container } = render(<svg><OpeningMapNpcHomes simplified /></svg>);

    expect(container.querySelector('.opening-map-npc-homes')?.classList.contains('is-simplified')).toBe(true);
  });
});
