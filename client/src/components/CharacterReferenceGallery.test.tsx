import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { startingCharacterArtwork } from '../game/startingCharacterArtwork';
import { CharacterReferenceGallery } from './CharacterReferenceGallery';

afterEach(cleanup);

describe('character reference gallery', () => {
  it('shows the original male and female assets for the two reference templates', () => {
    render(<CharacterReferenceGallery />);
    const gallery = screen.getByRole('region', { name: 'Mẫu ảnh tham khảo' });
    const images = within(gallery).getAllByRole('img');
    expect(images).toHaveLength(4);
    expect(images.map(image => image.getAttribute('src'))).toEqual([
      startingCharacterArtwork('field-worker', 'male'),
      startingCharacterArtwork('field-worker', 'female'),
      startingCharacterArtwork('village-apprentice', 'male'),
      startingCharacterArtwork('village-apprentice', 'female'),
    ]);
    expect(within(gallery).queryByRole('button')).toBeNull();
    expect(within(gallery).queryByRole('combobox')).toBeNull();
    expect(within(gallery).queryByRole('textbox')).toBeNull();
  });
});
