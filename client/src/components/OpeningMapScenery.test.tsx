import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OPENING_MAP_TREES } from '../game/openingMap';
import { OpeningMapScenery } from './OpeningMapScenery';

describe('OpeningMapScenery', () => {
  it('uses eight distinct tree silhouettes across the existing tree placements', () => {
    const { container } = render(<svg><OpeningMapScenery idPrefix="tree-variants-test" /></svg>);
    const trees = Array.from(container.querySelectorAll('use[data-tree-variant]'));
    const variants = new Set(trees.map(tree => tree.getAttribute('data-tree-variant')));

    expect(trees).toHaveLength(OPENING_MAP_TREES.length);
    expect(trees.length).toBeLessThan(150);
    expect(variants).toEqual(new Set([
      'bamboo', 'bambooGrove', 'fruitTree', 'blossomTree',
      'palm', 'palmFruit', 'banyan', 'willow',
    ]));
  });

  it('does not draw decorative roads outside the walkable map routes', () => {
    const { container } = render(<svg><OpeningMapScenery idPrefix="route-alignment-test" /></svg>);

    expect(container.querySelector('.scenery-reference-lanes')).toBeNull();
  });
});
