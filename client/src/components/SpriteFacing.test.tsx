import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CharacterSprite } from './CharacterSprite';
import { NeighborSprite } from './NeighborSprite';
import { CustomerSprite } from './CustomerSprite';
import { characterOptions, DEFAULT_APPEARANCES, type Facing } from '../game/character';
import { NEIGHBOR_DESIGNS } from '../game/villagers';
import { CUSTOMER_CAST } from '../game/customerCast';
import { defaultCharacterCustomization } from '../game/characterCustomization';

afterEach(cleanup);

describe('faces while turning and walking', () => {
  it('uses a seated pose and enough SVG space when a mount is equipped', () => {
    const customization = defaultCharacterCustomization();
    customization.equipped.mount = 'mount-buffalo';
    const view = render(<CharacterSprite customization={customization} />);
    const sprite = view.container.querySelector('svg');
    expect(sprite?.getAttribute('viewBox')).toBe('0 0 160 252');
    expect(sprite?.querySelector('.character-riding-pose')?.getAttribute('transform')).toBe('translate(0 22)');
    expect(sprite?.classList.contains('is-riding')).toBe(true);
  });

  it.each(['male', 'female'] as const)('keeps both eyes when the %s player walks left or right with each hairstyle', gender => {
    for (const { value: hair } of characterOptions.hair) {
      for (const facing of ['left', 'right', 'down'] as Facing[]) {
        const view = render(<CharacterSprite appearance={{ ...DEFAULT_APPEARANCES[gender], hair }} facing={facing} walking />);
        expect(view.container.querySelectorAll('[data-eye]').length, `${gender}/${hair}/${facing}`).toBe(2);
        view.unmount();
      }
    }
  });

  it('keeps two eyes on every neighbor and diner when facing either side', () => {
    for (const facing of ['left', 'right'] as const) {
      for (const npcId of Object.keys(NEIGHBOR_DESIGNS)) {
        const view = render(<NeighborSprite npcId={npcId} facing={facing} walking />);
        expect(view.container.querySelectorAll('[data-eye]').length, `${npcId}/${facing}`).toBe(2);
        view.unmount();
      }
      for (const profile of CUSTOMER_CAST) {
        const view = render(<CustomerSprite customer={{ id:1, name:profile.name, personaKey:profile.key, customerType:0 }} facing={facing} walking />);
        expect(view.container.querySelectorAll('[data-eye]').length, `${profile.name}/${facing}`).toBe(2);
        view.unmount();
      }
    }
  });

  it('draws the back of the head when walking away', () => {
    const view = render(<><CharacterSprite facing="up" walking /><NeighborSprite npcId="co-ba" facing="up" walking /></>);
    expect(view.container.querySelector('[data-eye]')).toBeNull();
  });
});
