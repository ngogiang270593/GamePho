import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CharacterItemPreview } from './CharacterItemPreview';
import { CharacterSprite } from './CharacterSprite';
import { CHARACTER_ITEMS } from '../game/characterCustomization';
import { startingCharacterInventory } from '../game/characterInventory';
import { startingCharacterAppearance, STARTING_CHARACTERS } from '../game/startingCharacters';

afterEach(cleanup);

describe('CharacterItemPreview', () => {
  it('changes the selected shirt without replacing identity, hair, headwear, or bottoms', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    const appearance = startingCharacterAppearance(template.id, 'male');
    const customization = startingCharacterInventory(appearance, template);
    const shirt = CHARACTER_ITEMS.find(item => item.id === 'clothes-scholar')!;
    const { container, rerender } = render(
      <CharacterItemPreview
        item={CHARACTER_ITEMS.find(item => item.id === 'clothes-baba')!}
        appearance={appearance}
        customization={customization}
        startingCharacterId={template.id}
      />,
    );
    const original = container.querySelector('.player-sprite')!;
    const originalBase = original.querySelector('.reference-character-base')?.getAttribute('href');
    const originalBody = original.querySelector('.sprite-body')?.getAttribute('transform');
    const originalBottoms = original.querySelector('.character-bottoms')?.innerHTML;

    rerender(
      <CharacterItemPreview
        item={shirt}
        appearance={appearance}
        customization={customization}
        startingCharacterId={template.id}
      />,
    );

    const changed = container.querySelector('.player-sprite')!;
    expect(changed.getAttribute('data-starting-character')).toBe(template.id);
    expect(changed.querySelector('.reference-character-base')?.getAttribute('href')).toBe(originalBase);
    expect(changed.querySelector('.sprite-body')?.getAttribute('transform')).toBe(originalBody);
    expect(changed.querySelector('.character-bottoms')?.innerHTML).toBe(originalBottoms);
    expect(changed.querySelector('.reference-outfit-fallback .sprite-torso')?.getAttribute('data-outfit')).toBe('nguthan');
    expect(changed.querySelector('.reference-outfit-fallback .sprite-torso')?.getAttribute('data-item-id')).toBe(shirt.id);
  });

  it('renders selected bottoms separately while keeping the selected top and shoes', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    const appearance = startingCharacterAppearance(template.id, 'female');
    const customization = startingCharacterInventory(appearance, template);
    const bottoms = CHARACTER_ITEMS.find(item => item.id === 'bottoms-skirt')!;
    const { container } = render(
      <CharacterItemPreview
        item={bottoms}
        appearance={appearance}
        customization={customization}
        startingCharacterId={template.id}
      />,
    );
    const sprite = container.querySelector('.player-sprite')!;
    expect(sprite.getAttribute('data-starting-character')).toBe(template.id);
    expect(sprite.querySelector('.reference-character-bottoms')?.getAttribute('data-item-id')).toBe(bottoms.id);
    expect(sprite.querySelector('.reference-outfit-shirt')).toBeTruthy();
    expect(sprite.querySelector('.reference-outfit-boots')).toBeTruthy();
    expect(sprite.querySelector('.reference-character-base')).toBeTruthy();
  });

  it('equips the complete reference-inspired forest keeper uniform for both genders', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    for (const gender of ['male', 'female'] as const) {
      const appearance = startingCharacterAppearance(template.id, gender);
      const customization = startingCharacterInventory(appearance, template);
      const { container, unmount } = render(
        <CharacterSprite
          debugOutfitAlignment
          appearance={appearance}
          customization={customization}
          startingCharacter={template.id}
        />,
      );
      const sprite = container.querySelector('.player-sprite')!;

      expect(appearance.outfit).toBe('forest');
      expect(customization.equipped.bottoms).toBe('bottoms-ranger');
      expect(customization.equipped.shoes).toBe('shoes-ranger-boots');
      expect(customization.equipped.hat).toBe('hat-forest-bandana');
      expect(sprite.getAttribute('data-character-artwork')).toBe('forest-keeper-v2');
      expect(sprite.querySelector('.forest-turnaround-artwork')?.getAttribute('href')).toBeTruthy();
      // The completed uniform must never include the old body or pasted gear.
      expect(sprite.querySelector('.reference-character-base')).toBeNull();
      expect(sprite.querySelector('.reference-outfit-layer')).toBeNull();
      expect(sprite.querySelector('mask')).toBeNull();
      unmount();
    }
  });

  it('keeps the original male and female map artwork and size while moving in all four directions', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    for (const gender of ['male', 'female'] as const) {
      const appearance = startingCharacterAppearance(template.id, gender);
      const customization = startingCharacterInventory(appearance, template);
      const { container, rerender } = render(<CharacterSprite appearance={appearance} customization={customization} startingCharacter={template.id} />);
      const standingSprite = container.querySelector('.forest-turnaround-sprite')!;
      const mapViewBox = standingSprite.getAttribute('viewBox');
      const artworkHref = standingSprite.querySelector('.forest-turnaround-artwork')?.getAttribute('href');
      const width = standingSprite.getAttribute('width');
      const height = standingSprite.getAttribute('height');
      expect(mapViewBox).toBe('0 0 768 1024');

      for (const [facing, row] of [['down', 0], ['up', 1], ['left', 2], ['right', 3]] as const) {
        rerender(<CharacterSprite appearance={appearance} customization={customization} startingCharacter={template.id} facing={facing} />);
        const idleArtwork = container.querySelector('.forest-turnaround-artwork')!;
        rerender(<CharacterSprite appearance={appearance} customization={customization} startingCharacter={template.id} facing={facing} walking />);
        const walkingSprite = container.querySelector(gender === 'male' ? '.forest-map-action-sprite' : '.forest-turnaround-sprite')!;
        const walkingArtwork = walkingSprite.querySelector(gender === 'male' ? '.forest-map-action-artwork' : '.forest-turnaround-artwork')!;
        expect(walkingSprite.getAttribute('data-character-artwork')).toBe(gender === 'male' ? 'forest-keeper-male-map-actions-v1' : 'forest-keeper-v2');
        expect(walkingSprite.getAttribute('data-gender')).toBe(gender);
        expect(walkingSprite.getAttribute('data-facing')).toBe(facing);
        expect(walkingSprite.getAttribute('data-locomotion')).toBe('walk');
        expect(walkingSprite.getAttribute('viewBox')).toBe(mapViewBox);
        expect(walkingSprite.getAttribute('width')).toBe(width);
        expect(walkingSprite.getAttribute('height')).toBe(height);
        if (gender === 'male') {
          expect(walkingSprite.getAttribute('data-facing-row')).toBe(String(row));
          expect(walkingArtwork.getAttribute('href')).toBeTruthy();
          expect(walkingArtwork.getAttribute('width')).toBe('288');
          expect(walkingArtwork.getAttribute('height')).toBe('512');
          expect(walkingSprite.querySelector('.forest-map-action-frames')).toBeTruthy();
        } else {
          expect(walkingArtwork.getAttribute('href')).toBe(artworkHref);
          expect(walkingArtwork.getAttribute('x')).toBe(idleArtwork.getAttribute('x'));
          expect(walkingArtwork.getAttribute('y')).toBe(idleArtwork.getAttribute('y'));
          expect(walkingSprite.querySelector('.forest-turnaround-motion')?.classList.contains('is-walking')).toBe(true);
        }

        rerender(<CharacterSprite appearance={appearance} customization={customization} startingCharacter={template.id} facing={facing} walking running />);
        const runningSprite = container.querySelector(gender === 'male' ? '.forest-map-action-sprite' : '.forest-turnaround-sprite')!;
        const runningArtwork = runningSprite.querySelector(gender === 'male' ? '.forest-map-action-artwork' : '.forest-turnaround-artwork')!;
        expect(runningSprite.getAttribute('data-facing')).toBe(facing);
        expect(runningSprite.getAttribute('data-locomotion')).toBe('run');
        expect(runningSprite.getAttribute('viewBox')).toBe(mapViewBox);
        expect(runningSprite.getAttribute('width')).toBe(width);
        expect(runningSprite.getAttribute('height')).toBe(height);
        if (gender === 'male') {
          expect(runningSprite.getAttribute('data-facing-row')).toBe(String(row));
          expect(runningArtwork.getAttribute('href')).toBe(walkingArtwork.getAttribute('href'));
          expect(runningSprite.querySelector('.forest-map-action-frames')).toBeTruthy();
        } else {
          expect(runningArtwork.getAttribute('href')).toBe(artworkHref);
          expect(runningArtwork.getAttribute('x')).toBe(walkingArtwork.getAttribute('x'));
          expect(runningArtwork.getAttribute('y')).toBe(walkingArtwork.getAttribute('y'));
          expect(runningSprite.querySelector('.forest-turnaround-motion')?.classList.contains('is-running')).toBe(true);
        }
      }

      rerender(<CharacterSprite appearance={appearance} customization={customization} startingCharacter={template.id} />);
      expect(container.querySelector('.forest-turnaround-sprite')).toBeTruthy();
    }
  });

  it('uses the supplied four-direction action atlas for male map movement', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    const appearance = startingCharacterAppearance(template.id, 'male');
    const customization = startingCharacterInventory(appearance, template);
    const { container } = render(
      <CharacterSprite
        appearance={appearance}
        customization={customization}
        startingCharacter={template.id}
        walking
      />,
    );

    const sprite = container.querySelector('.forest-map-action-sprite')!;
    expect(sprite.getAttribute('data-character-artwork')).toBe('forest-keeper-male-map-actions-v1');
    expect(sprite.getAttribute('data-locomotion')).toBe('walk');
    expect(sprite.getAttribute('data-facing-row')).toBe('0');
    expect(sprite.querySelector('.forest-map-action-artwork')?.getAttribute('href')).toBeTruthy();
  });

  it('selects a distinct complete view for every gender and direction without mirroring', () => {
    const template = STARTING_CHARACTERS.find(item => item.id === 'forest-keeper')!;
    const cells = new Set<string>();
    for (const gender of ['male', 'female'] as const) {
    for (const facing of ['down', 'right', 'up', 'left'] as const) {
      const appearance = startingCharacterAppearance(template.id, gender);
      const customization = startingCharacterInventory(appearance, template);
      const { container, unmount } = render(
        <CharacterSprite
          debugOutfitAlignment
          facing={facing}
          appearance={appearance}
          customization={customization}
          startingCharacter={template.id}
        />,
      );
      const sprite = container.querySelector('.player-sprite')!;
      const artwork = sprite.querySelector('.forest-turnaround-artwork')!;
      expect(sprite.getAttribute('viewBox')).toBe('0 0 768 1024');
      expect(sprite.getAttribute('data-gender')).toBe(gender);
      expect(sprite.getAttribute('data-facing')).toBe(facing);
      expect(sprite.querySelector('.outfit-alignment-debug rect')).toBeTruthy();
      expect(artwork.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
      expect(sprite.innerHTML).not.toContain('scale(-1');
      expect(artwork.parentElement?.getAttribute('overflow')).toBe('hidden');
      cells.add(`${artwork.getAttribute('x')},${artwork.getAttribute('y')}`);
      unmount();
    }
    }
    expect(cells.size).toBe(8);
  });
});
