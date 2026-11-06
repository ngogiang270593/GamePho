import { CharacterSprite, type CharacterPose } from './CharacterSprite';
import type { CharacterAppearance, Facing } from '../game/character';
import type { MapOneNpcVisualDesign } from '../game/mapOneNpcDesign';
import { OPENING_MAP_NPC_ARTWORKS, type OpeningMapNpcArtworkId } from '../game/openingMapNpcArtwork';
import { openingMapNpcSpriteTarget } from '../game/openingMapNpcs';
import { useAppliedSpriteSheet, type CharacterSpriteSheet, type SpriteAction } from '../game/characterSpriteSheet';

export function OpeningMapNpcArtwork({ npcId, appearance, design, artwork, pose, facing, className, portrait = false, action = 'idle', frame, playing = true, spriteSheet }: {
  npcId?: string;
  appearance: CharacterAppearance;
  design: MapOneNpcVisualDesign;
  artwork?: OpeningMapNpcArtworkId;
  pose: CharacterPose;
  facing: Facing;
  className: string;
  portrait?: boolean;
  action?: SpriteAction;
  frame?: number;
  playing?: boolean;
  spriteSheet?: CharacterSpriteSheet | null;
}) {
  const appliedSheet = useAppliedSpriteSheet(npcId ? openingMapNpcSpriteTarget(npcId) : null);
  const sheet = spriteSheet === undefined ? appliedSheet : spriteSheet;
  const image = artwork ? OPENING_MAP_NPC_ARTWORKS[artwork] : undefined;
  if (sheet) return <CharacterSprite
    className={className}
    appearance={appearance}
    npcDesign={design}
    spriteSheet={sheet}
    spriteAction={action}
    spriteFrame={frame}
    spritePlaying={playing}
    spritePlaybackIntervalMultiplier={2}
    pose={pose}
    facing={facing}
    portrait={portrait}
    aria-hidden="true"
  />;
  if (!image) return <CharacterSprite
    className={className}
    appearance={appearance}
    npcDesign={design}
    pose={pose}
    facing={facing}
    portrait={portrait}
    aria-hidden="true"
  />;

  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
    className={className}
    data-character-artwork="npc-image"
    data-npc-artwork={artwork}
    aria-hidden="true" focusable="false">
    <image href={image.src} width="256" height="256" preserveAspectRatio="xMidYMax meet" />
  </svg>;
}
