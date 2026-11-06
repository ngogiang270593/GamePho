import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSprite } from './CharacterSprite';
import { startingCharacterAppearance } from '../game/startingCharacters';
import { startingCharacterArtwork } from '../game/startingCharacterArtwork';
import { DEFAULT_APPEARANCES } from '../game/character';
import { appliedSpriteSheet, applySpriteSheet, makeSpriteSheet, spriteCell, spriteSheetError } from '../game/characterSpriteSheet';

const target = 'forest-keeper:male';
const image = 'data:image/png;base64,Y3VzdG9tLWNoYXJhY3Rlcg==';

afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const template of ['forest-keeper', 'field-worker', 'village-apprentice']) {
    for (const gender of ['male', 'female']) {
      const key = `${template}:${gender}`;
      if (appliedSpriteSheet(key)) await applySpriteSheet(key, null);
    }
  }
  localStorage.clear();
});

describe('applied character sprite', () => {
  it('keeps a 256 × 256 image as one complete cell with optional walking enabled', () => {
    const sheet = makeSpriteSheet(image, 256, 256);
    expect(sheet).toMatchObject({ columns: 1, rows: 1, cellWidth: 256, cellHeight: 256, singleFrameWalk: true });
    expect(spriteCell(sheet, 0)).toEqual({ x: 0, y: 0 });
    expect(spriteSheetError(sheet)).toBeNull();
    expect(spriteSheetError({ ...sheet, singleFrameWalk: 'yes' })).not.toBeNull();
    const atlas = makeSpriteSheet(image, 1024, 1024, 'Atlas', 4, 4);
    expect(atlas.singleFrameWalk).toBe(false);
    const { singleFrameWalk: _optional, ...olderSheet } = sheet;
    expect(spriteSheetError(olderSheet)).toBeNull();
  });

  it('applies immediately during a blocked database and persists through localStorage', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('indexedDB', { open: vi.fn(() => ({})) });
    const sheet = makeSpriteSheet(image, 256, 256);
    const applying = applySpriteSheet(target, sheet);
    expect(appliedSpriteSheet(target)).toBe(sheet);
    await vi.advanceTimersByTimeAsync(4100);
    expect(await applying).toEqual({ persisted: true, warning: undefined });
    expect(JSON.parse(localStorage.getItem(`xnl-character-sprites-v1:applied:${target}`)!)).toEqual(sheet);
  });

  it('updates a mounted game character, including a forest outfit from an older save', async () => {
    const appearance = startingCharacterAppearance('forest-keeper', 'male');
    const { container } = render(<svg>
      <CharacterSprite appearance={appearance} startingCharacter="forest-keeper" walking />
      <CharacterSprite appearance={appearance} walking running />
    </svg>);
    await act(async () => { await applySpriteSheet(target, makeSpriteSheet(image, 256, 256)); });
    const sprites = container.querySelectorAll('[data-character-artwork="custom-sprite-sheet"]');
    expect(sprites).toHaveLength(2);
    expect(sprites[0].getAttribute('data-locomotion')).toBe('walk');
    expect(sprites[1].getAttribute('data-locomotion')).toBe('run');
    expect(sprites[0].querySelector('image')?.getAttribute('href')).toBe(image);
  });

  it('uses the real facing and stays idle when only Shift is held; incomplete views use the original renderer', () => {
    const appearance = startingCharacterAppearance('forest-keeper', 'male');
    const sheet = makeSpriteSheet(image, 2048, 1024, '4 views', 8, 4);
    sheet.clips.walk.directions.up = { start: 0, count: 1 };
    const { container } = render(<svg>
      <CharacterSprite appearance={appearance} spriteSheet={sheet} facing="up" walking />
      <CharacterSprite appearance={appearance} spriteSheet={sheet} facing="right" walking running />
      <CharacterSprite appearance={appearance} spriteSheet={sheet} facing="right" running />
    </svg>);
    const custom = container.querySelectorAll('[data-character-artwork="custom-sprite-sheet"]');
    expect(custom).toHaveLength(2);
    expect(custom[0].getAttribute('data-facing')).toBe('right');
    expect(custom[0].getAttribute('data-locomotion')).toBe('run');
    expect(custom[1].getAttribute('data-locomotion')).toBe('idle');
    expect(custom[1].getAttribute('data-facing')).toBe('right');
  });

  it.each([
    ['field-worker', 'male'], ['field-worker', 'female'],
    ['village-apprentice', 'male'], ['village-apprentice', 'female'],
  ] as const)('uses only the static original image for %s %s, even with an imported sprite', async (template, gender) => {
    const sheet = makeSpriteSheet(image, 256, 256);
    await applySpriteSheet(`${template}:${gender}`, sheet);
    const appearance = DEFAULT_APPEARANCES[gender];
    const { container } = render(<svg>
      <CharacterSprite appearance={appearance} startingCharacter={template} walking running className="reference-preview" width={80} />
      <CharacterSprite appearance={appearance} startingCharacter={template} spriteSheet={sheet} portrait />
    </svg>);

    const references = container.querySelectorAll('[data-character-artwork="reference-image"]');
    expect(references).toHaveLength(2);
    expect(references[0].classList.contains('reference-preview')).toBe(true);
    expect(references[0].getAttribute('width')).toBe('80');
    expect(container.querySelector('.is-walking, .is-running, [data-character-artwork="custom-sprite-sheet"]')).toBeNull();
    expect(container.querySelector('path, [data-layer]')).toBeNull();
    references.forEach(reference => {
      expect(reference.querySelector('image')?.getAttribute('href')).toBe(startingCharacterArtwork(template, gender));
    });
  });

  it('keeps an applied sprite active and reports persistence failure when all storage is denied', async () => {
    vi.stubGlobal('indexedDB', undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Storage denied', 'QuotaExceededError'); });
    const sheet = makeSpriteSheet(image, 256, 256);
    const result = await applySpriteSheet(target, sheet);
    expect(result.persisted).toBe(false);
    expect(result.warning).toContain('Đã áp dụng trong game hiện tại');
    expect(appliedSpriteSheet(target)).toBe(sheet);
  });
});
