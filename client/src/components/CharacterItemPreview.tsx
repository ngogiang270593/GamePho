import { DEFAULT_APPEARANCE, type CharacterAppearance } from '../game/character';
import { defaultCharacterCustomization, type CharacterCustomization, type CharacterItem } from '../game/characterCustomization';
import { CharacterSprite } from './CharacterSprite';
import { MountSprite } from './MountSprite';
import type { StartingCharacterId } from '../game/startingCharacters';

export function CharacterItemPreview({ item, appearance = DEFAULT_APPEARANCE, customization = defaultCharacterCustomization(), startingCharacterId }: {
  item: CharacterItem;
  appearance?: CharacterAppearance;
  customization?: CharacterCustomization;
  startingCharacterId?: StartingCharacterId;
}) {
  if (item.category === 'mount') {
    return <MountSprite mountId={item.id} className="wardrobe-item-artwork wardrobe-mount-preview" aria-hidden="true" />;
  }

  const previewCustomization = {
    ...customization,
    equipped: { ...customization.equipped, [item.category]: item.id },
  };
  return <CharacterSprite
    className={`wardrobe-item-artwork preview-${item.category}`}
    appearance={appearance}
    customization={previewCustomization}
    startingCharacter={startingCharacterId}
  />;
}
