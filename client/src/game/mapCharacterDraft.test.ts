import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCES } from './character';
import { MAP_CHARACTER_DRAFT_KEY, parseMapCharacterDraft, readMapCharacterDraft, saveMapCharacterDraft, type MapCharacterDraft } from './mapCharacterDraft';
import { OPENING_MAP_HEIGHT, OPENING_MAP_ID, OPENING_MAP_WIDTH } from './openingMap';

const current: MapCharacterDraft = {
  id: 'current-npc', mapId: OPENING_MAP_ID, name: 'Người giữ bến',
  appearance: DEFAULT_APPEARANCES.female, point: { x: 463, y: 632 },
  mission: 'Ghé thăm dân làng.', hidden: true,
};

afterEach(() => localStorage.clear());

describe('current-map character drafts', () => {
  it('filters retired maps before validating malformed legacy NPCs', () => {
    const retired = Array.from({ length: 301 }, (_, index) => ({ mapId: `retired-${index}`, id: null, point: null }));
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([...retired, current]));
    expect(readMapCharacterDraft()).toEqual([current]);
    saveMapCharacterDraft(readMapCharacterDraft());
    expect(JSON.parse(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)!)).toEqual([current]);
  });

  it('rejects explicit imports and saves for retired maps without overwriting saved work', () => {
    saveMapCharacterDraft([current]);
    const before = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
    const retired = { ...current, mapId: 'hai-ba-trung' };
    expect(() => parseMapCharacterDraft([retired])).toThrow(/Bản đồ/);
    expect(() => saveMapCharacterDraft([retired])).toThrow(/Bản đồ/);
    expect(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)).toBe(before);
  });

  it('still rejects invalid current-map drafts and malformed storage containers', () => {
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([{ mapId: 'hai-ba-trung' }, { ...current, point: { x: OPENING_MAP_WIDTH + 1, y: 0 } }]));
    expect(() => readMapCharacterDraft()).toThrow(/Tọa độ X/);
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, '{}');
    expect(() => readMapCharacterDraft()).toThrow(/Danh sách/);
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([null, current]));
    expect(() => readMapCharacterDraft()).toThrow(/Nhân vật/);
  });

  it('round trips expanded-map drafts beyond both old edges and rejects either new edge', () => {
    const expanded = { ...current, point: { x: 3710, y: 2520 } };
    saveMapCharacterDraft([expanded]);
    expect(readMapCharacterDraft()).toEqual([expanded]);
    const before = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
    for (const point of [{ x: OPENING_MAP_WIDTH + 1, y: 1500 }, { x: 2160, y: OPENING_MAP_HEIGHT + 1 }]) {
      expect(() => saveMapCharacterDraft([{ ...expanded, point }])).toThrow(/Tọa độ/);
      expect(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)).toBe(before);
    }
  });

  it('keeps browser reads scoped to NPC drafts', () => {
    localStorage.setItem('player-profile', '{"name":"Người chơi"}');
    localStorage.setItem('game-save-slot-1', '{"progress":42}');
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([{ mapId: 'hai-ba-trung' }, current]));
    const before = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
    expect(readMapCharacterDraft()).toEqual([current]);
    expect(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)).toBe(before);
    saveMapCharacterDraft([current]);
    expect(localStorage.getItem('player-profile')).toBe('{"name":"Người chơi"}');
    expect(localStorage.getItem('game-save-slot-1')).toBe('{"progress":42}');
  });
});
