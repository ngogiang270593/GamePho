import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APPEARANCES } from './character';
import { findOpeningMapPath, isOpeningMapWalkable, OPENING_MAP_SPAWN } from './openingMap';
import { OPENING_MAP_WIDTH, OPENING_MAP_HEIGHT } from './openingMapBounds.mjs';
import { MAP_CHARACTER_DRAFT_EVENT, MAP_CHARACTER_DRAFT_KEY, parseMapCharacterDraft, readMapCharacterDraft, saveMapCharacterDraft, type MapCharacterDraft } from './mapCharacterDraft';
import { DEFAULT_OPENING_MAP_NPCS, openingMapDayPeriod, OPENING_MAP_ID, resolveOpeningMapNpcRecords, resolveOpeningMapNpcs, useOpeningMapNpcs } from './openingMapNpcs';
import { OPENING_MAP_AFFINITY_IDS, OPENING_MAP_SIDE_NPC_IDS } from './riverCampaign';

const source = vi.hoisted(() => ({} as Record<string, unknown>));
vi.mock('./openingMapNpcs.json', () => ({ default: source }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  for (const key of Object.keys(source)) delete source[key];
  vi.restoreAllMocks();
});

describe('latest opening-map NPC catalog and storage', () => {
  it('contains the five core and seventeen supporting identities and retires earlier villagers', () => {
    expect(DEFAULT_OPENING_MAP_NPCS).toHaveLength(22);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(0, 5).map(npc => [npc.name, npc.alias, npc.locationLabel])).toEqual([
      ['Bà mẹ quê', 'Người giữ bến', 'Bến Thuyền'],
      ['Tảo', 'Ngư dân', 'Bến Cá Ngạnh'],
      ['Võ Sư Nương', 'Trưởng khu võ', 'Khu Luyện Võ'],
      ['Giao', 'Chủ tiệm kiêm giao liên', 'Chợ Nhỏ'],
      ['Trưởng Đội Tuần Tra', 'Mini-Boss', 'Chốt Chặn'],
    ]);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(0, 5).map(npc => npc.artwork)).toEqual([
      'ba-me-que', 'tao', 'vo-su-nuong', 'giao', 'truong-doi-tuan-tra',
    ]);
    expect(DEFAULT_OPENING_MAP_NPCS.map(npc => npc.artwork)).toEqual([
      'ba-me-que', 'tao', 'vo-su-nuong', 'giao', 'truong-doi-tuan-tra',
      'lao-lang-trung', 'tieu-nhi-quan-rap', 'thim-tu', 'thiet-chuy', 'lao-tieu-phu',
      'tieu-muoi-ban-do-choi', 'hac-lao', 'le-nuong', 'a-sang', 'doi-truong-ho-vuong-lang',
      'hac-lang', 'mu-doc-ba', 'a-cau', 'huyet-dao-phuong', 'quan-gia-trieu',
      'linh-tuan-tra-cung', 'linh-tuan-tra-dao',
    ]);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(5, 15).map(npc => npc.id)).toEqual([
      'herbalist-lang', 'inn-server', 'fruit-aunt-tu', 'smith-thiet-chuy', 'woodcutter',
      'toy-seller', 'beggar-hac-lao', 'singer-le-nuong', 'herdboy-a-sang', 'village-captain',
    ]);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(15, 20).map(npc => npc.id)).toEqual([
      'black-wolf', 'poison-witch', 'double-agent-acau', 'blood-blade-phuong', 'tax-official-trieu',
    ]);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(20).map(npc => [npc.id, npc.name, npc.artwork])).toEqual([
      ['patrol-archer', 'Lính Tuần Tra Cung', 'linh-tuan-tra-cung'],
      ['patrol-swordsman', 'Lính Tuần Tra Đao', 'linh-tuan-tra-dao'],
    ]);
    expect(OPENING_MAP_SIDE_NPC_IDS).toEqual(DEFAULT_OPENING_MAP_NPCS.slice(5, 15).map(npc => npc.id));
    expect(OPENING_MAP_AFFINITY_IDS.every(id => DEFAULT_OPENING_MAP_NPCS.some(npc => npc.id === id))).toBe(true);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(5).every(npc => !npc.schedule)).toBe(true);
    expect(DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'messenger')?.mission).toBe('NHẬN NHIỆM VỤ: ĐƯA THƯ');
    expect(DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'memory-keeper')?.mission).toBe('GIAO HÀNG');
    expect(new Set(DEFAULT_OPENING_MAP_NPCS.map(npc => npc.design.bodyType)).size).toBeGreaterThan(5);
    expect(DEFAULT_OPENING_MAP_NPCS.some(npc => ['market-vendor', 'cook', 'farmer'].includes(npc.id))).toBe(false);
    expect(parseMapCharacterDraft(DEFAULT_OPENING_MAP_NPCS)).toEqual(DEFAULT_OPENING_MAP_NPCS);
    expect(DEFAULT_OPENING_MAP_NPCS.filter(npc => !isOpeningMapWalkable(npc.point)).map(npc => npc.id)).toEqual([]);
    expect(DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'fisherman-tao')?.point).toEqual({ x: 2970, y: 1320 });
    expect(DEFAULT_OPENING_MAP_NPCS.find(npc => npc.id === 'messenger')?.point).toEqual({ x: 2500, y: 1535 });
    for (let index = 0; index < DEFAULT_OPENING_MAP_NPCS.length; index++) {
      for (const other of DEFAULT_OPENING_MAP_NPCS.slice(index + 1)) {
        const npc = DEFAULT_OPENING_MAP_NPCS[index];
        expect(Math.abs(npc.point.x - other.point.x) < 88 && Math.abs(npc.point.y - other.point.y) < 120,
          `${npc.name} overlaps ${other.name}`).toBe(false);
      }
    }
    expect(DEFAULT_OPENING_MAP_NPCS.slice(15).every(npc => isOpeningMapWalkable(npc.point))).toBe(true);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(15).filter(npc => findOpeningMapPath(OPENING_MAP_SPAWN, npc.point).length === 0).map(npc => npc.id)).toEqual([]);
  });

  it('retains the original period data and keeps the new NPCs schedule-free', () => {
    expect(DEFAULT_OPENING_MAP_NPCS.slice(0, 5).every(npc =>
      !!npc.schedule && npc.schedule.map(entry => entry.period).join(',') === 'morning,noon,evening'
      && npc.schedule.every(entry => !!entry.activity && !!entry.dialogue && !!entry.pose),
    )).toBe(true);
    expect(DEFAULT_OPENING_MAP_NPCS.slice(5).every(npc => !npc.schedule)).toBe(true);
    expect(openingMapDayPeriod(360)).toBe('morning');
    expect(openingMapDayPeriod(659)).toBe('morning');
    expect(openingMapDayPeriod(660)).toBe('noon');
    expect(openingMapDayPeriod(839)).toBe('noon');
    expect(openingMapDayPeriod(840)).toBe('evening');
    expect(openingMapDayPeriod(0)).toBe('evening');
  });

  it('round-trips rich current-map edits after retiring earlier map drafts', () => {
    const old: MapCharacterDraft = { id: 'old-draft', mapId: 'hai-ba-trung', name: 'Bản cũ', appearance: DEFAULT_APPEARANCES.male, point: { x: 100, y: 100 } };
    const edited = { ...DEFAULT_OPENING_MAP_NPCS[0], point: { x: 3710, y: 2520 }, mission: 'Giao nhiệm vụ đã sửa', dialogue: 'Lời thoại đã sửa', facing: 'left' as const, scale: 1.2 };
    const listener = vi.fn();
    window.addEventListener(MAP_CHARACTER_DRAFT_EVENT, listener);
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([old, edited]));
    expect(readMapCharacterDraft()).toEqual([edited]);
    saveMapCharacterDraft(readMapCharacterDraft());
    expect(JSON.parse(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)!)).toEqual([edited]);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(MAP_CHARACTER_DRAFT_EVENT, listener);
  });

  it('merges defaults, portable source, then device drafts by ID and honors hidden defaults', () => {
    const elder = DEFAULT_OPENING_MAP_NPCS[0];
    source[elder.id] = { ...elder, name: 'Bà từ source', role: 'Vai trò từ source' };
    expect(resolveOpeningMapNpcs([]).find(npc => npc.id === elder.id)?.name).toBe('Bà từ source');
    const local = { ...elder, name: 'Bà từ máy này' };
    expect(resolveOpeningMapNpcs([local]).find(npc => npc.id === elder.id)?.name).toBe('Bà từ máy này');
    const retired: MapCharacterDraft = { id: 'market-vendor', mapId: OPENING_MAP_ID, name: 'Người bán hàng cũ', appearance: DEFAULT_APPEARANCES.male, point: { x: 700, y: 480 } };
    const merged = resolveOpeningMapNpcs([{ ...elder, hidden: true }, retired]);
    expect(merged.find(npc => npc.id === elder.id)).toBeUndefined();
    expect(merged).toHaveLength(21);
    expect(merged.some(npc => npc.id === retired.id)).toBe(false);
    source[elder.id] = { ...elder, hidden: true };
    expect(resolveOpeningMapNpcs([]).some(npc => npc.id === elder.id)).toBe(false);
    expect(resolveOpeningMapNpcRecords([]).find(npc => npc.id === elder.id)?.hidden).toBe(true);
  });

  it('migrates the former Bà mẹ quê display name and moves legacy home coordinates before the checkpoint', () => {
    const elder = DEFAULT_OPENING_MAP_NPCS[0];
    const migrated = resolveOpeningMapNpcs([{
      ...elder,
      name: 'Ba Mẹ Quế',
      point: { x: 3488, y: 1665 },
    }]).find(npc => npc.id === 'memory-keeper');
    expect(migrated?.id).toBe('memory-keeper');
    expect(migrated?.name).toBe('Bà mẹ quê');
    expect(migrated?.point).toEqual({ x: 2860, y: 1945 });
    expect(isOpeningMapWalkable(migrated!.point)).toBe(true);
  });

  it('updates a mounted game view immediately after editor save and after another tab saves', () => {
    function View() {
      const characters = useOpeningMapNpcs();
      return <p>{characters.find(npc => npc.id === 'memory-keeper')?.name}</p>;
    }
    render(<View />);
    expect(screen.getByText('Bà mẹ quê')).toBeTruthy();
    act(() => saveMapCharacterDraft([{ ...DEFAULT_OPENING_MAP_NPCS[0], name: 'Bà đã sửa trong tool' }]));
    expect(screen.getByText('Bà đã sửa trong tool')).toBeTruthy();
    act(() => {
      localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([{ ...DEFAULT_OPENING_MAP_NPCS[0], name: 'Bà đã sửa ở tab khác' }]));
      window.dispatchEvent(new StorageEvent('storage', { key: MAP_CHARACTER_DRAFT_KEY }));
    });
    expect(screen.getByText('Bà đã sửa ở tab khác')).toBeTruthy();
  });

  it('validates map coordinates, identities and visual designs before replacing a saved draft', () => {
    const npc = DEFAULT_OPENING_MAP_NPCS[0];
    saveMapCharacterDraft([npc]);
    const saved = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
    expect(() => saveMapCharacterDraft([{ ...npc, point: { x: OPENING_MAP_WIDTH + 1, y: 0 } }])).toThrow(/Tọa độ X/);
    expect(() => saveMapCharacterDraft([{ ...npc, point: { x: 0, y: OPENING_MAP_HEIGHT + 1 } }])).toThrow(/Tọa độ Y/);
    expect(() => saveMapCharacterDraft([{ ...npc, design: { ...npc.design, hairstyle: 'bad' as never } }])).toThrow(/hairstyle/);
    expect(() => saveMapCharacterDraft([{ ...npc, artwork: 'unknown' as never }])).toThrow(/Ảnh nhân vật/);
    expect(() => saveMapCharacterDraft([{ ...npc, schedule: [npc.schedule![0], npc.schedule![0]] }])).toThrow(/trùng buổi/);
    expect(() => saveMapCharacterDraft([npc, npc])).toThrow(/Trùng mã/);
    expect(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)).toBe(saved);
  });

  it('reports unavailable browser storage instead of pretending the change persisted', () => {
    const listener = vi.fn();
    window.addEventListener(MAP_CHARACTER_DRAFT_EVENT, listener);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage denied'); });
    expect(() => saveMapCharacterDraft([DEFAULT_OPENING_MAP_NPCS[0]])).toThrow('storage denied');
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(MAP_CHARACTER_DRAFT_EVENT, listener);
  });
});
