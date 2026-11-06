import type { CharacterPose } from '../components/CharacterSprite';
import type { CharacterAppearance, Facing } from './character';
import type { MapOneNpcVisualDesign } from './mapOneNpcDesign';
import { OPENING_MAP_ID } from './openingMap';
import type { OpeningMapNpcArtworkId } from './openingMapNpcArtwork';
import type { Point } from './world';
import { validateMapCharacterDrafts } from './mapCharacterDraftValidation.mjs';

export const MAP_CHARACTER_DRAFT_KEY = 'character-designer-map-characters';
export const MAP_CHARACTER_DRAFT_EVENT = 'character-designer-map-characters-changed';
export type OpeningMapNpcKind = 'villager' | 'quest' | 'guard' | 'merchant';
export type OpeningMapNpcDayPeriod = 'morning' | 'noon' | 'evening';

export interface OpeningMapNpcScheduleEntry {
  period: OpeningMapNpcDayPeriod;
  activity: string;
  dialogue: string;
  pose: CharacterPose;
}

export interface MapCharacterDraft {
  id: string;
  mapId: string;
  name: string;
  appearance: CharacterAppearance;
  point: Point;
  alias?: string;
  locationLabel?: string;
  role?: string;
  mission?: string;
  dialogue?: string;
  schedule?: OpeningMapNpcScheduleEntry[];
  facing?: Facing;
  pose?: CharacterPose;
  scale?: number;
  kind?: OpeningMapNpcKind;
  artwork?: OpeningMapNpcArtworkId;
  design?: MapOneNpcVisualDesign;
  hidden?: boolean;
}

export function parseMapCharacterDraft(input: unknown): MapCharacterDraft[] {
  return validateMapCharacterDrafts(input, [OPENING_MAP_ID]) as MapCharacterDraft[];
}

export function readMapCharacterDraft(): MapCharacterDraft[] {
  const raw = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
  if (!raw) return [];
  const input: unknown = JSON.parse(raw);
  // Retire old-map records before validating their obsolete fields. Keep the
  // current map's validation strict so corrupt edits remain visible to users.
  const current = Array.isArray(input) ? input.filter(entry => !(
    entry && typeof entry === 'object' && typeof entry.mapId === 'string' && entry.mapId !== OPENING_MAP_ID
  )) : input;
  return parseMapCharacterDraft(current);
}

export function saveMapCharacterDraft(characters: readonly MapCharacterDraft[]): void {
  const valid = parseMapCharacterDraft(characters);
  localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify(valid));
  window.dispatchEvent(new Event(MAP_CHARACTER_DRAFT_EVENT));
}
