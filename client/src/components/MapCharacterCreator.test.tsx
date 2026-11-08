import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APPEARANCES } from '../game/character';
import { MAP_CHARACTER_DRAFT_KEY, type MapCharacterDraft } from '../game/mapCharacterDraft';
import { useOpeningMapNpcs, type OpeningMapNpc } from '../game/openingMapNpcs';
import type { Point } from '../game/world';
import { MapCharacterCreator } from './MapCharacterCreator';

type MapProps = {
  embedded?: boolean; overview?: boolean; npcs?: readonly OpeningMapNpc[];
  selectedNpcId?: string; placingNpc?: boolean; focusPoint?: Point;
  onNpcPlace?: (point: Point) => void; onNpcSelect?: (id: string) => void;
};
const map = vi.hoisted(() => ({ props: null as MapProps | null }));
// Only replace the large map renderer and artwork. Catalog, validation, storage
// and the actual game's live NPC subscription stay real.
vi.mock('../pages/OpeningMapPage', () => ({
  OpeningMapPage: (props: MapProps) => {
    map.props = props;
    return <div aria-label="Map khởi đầu">
      <button type="button" onClick={() => props.onNpcPlace?.({ x: 321, y: 456 })}>Đặt tại 321, 456</button>
      <button type="button" onClick={() => props.onNpcSelect?.('gate-guard')}>Chọn đội trưởng trên map</button>
    </div>;
  },
}));
vi.mock('./CharacterSprite', () => ({
  CharacterSprite: (props: { facing?: string; role?: string; 'aria-label'?: string }) =>
    <svg role={props.role} aria-label={props['aria-label']} data-facing={props.facing} />,
}));
vi.mock('../game/openingMapNpcs.json', () => ({ default: {} }));
function stored(): MapCharacterDraft[] {
  return JSON.parse(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY) ?? '[]');
}
function GameObserver() {
  const npcs = useOpeningMapNpcs();
  return <output data-testid="game-npcs">{JSON.stringify(npcs)}</output>;
}
afterEach(() => {
  cleanup(); localStorage.clear(); vi.unstubAllGlobals(); map.props = null;
});

describe('MapCharacterCreator on the current opening map', () => {
  it('opens the playable opening map from the editor', () => {
    render(<MapCharacterCreator />);
    expect(screen.getByRole('link', { name: 'Mở map trong game ↗' }).getAttribute('href')).toBe('/map');
  });

  it('links each NPC to one shared movement and action sprite editor', () => {
    render(<MapCharacterCreator />);
    const link = screen.getByRole('link', { name: 'Thêm sprite động tác đặc trưng ↗' });
    expect(link.getAttribute('href')).toContain('npc=memory-keeper&action=npc-morning');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.queryByLabelText('Hoạt động')).toBeNull();
    expect(screen.queryByLabelText('Lịch hoạt động trong game')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh Lão Lang Trung' }));
    expect(screen.getByRole('link', { name: 'Thêm sprite động tác đặc trưng ↗' }).getAttribute('href'))
      .toContain('npc=herbalist-lang&action=npc-morning');
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh Lính Tuần Tra Cung' }));
    expect(screen.getByRole('link', { name: 'Thêm sprite động tác đặc trưng ↗' }).getAttribute('href'))
      .toContain('npc=patrol-archer&action=npc-morning');
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh Lính Tuần Tra Đao' }));
    expect(screen.getByRole('link', { name: 'Thêm sprite động tác đặc trưng ↗' }).getAttribute('href'))
      .toContain('npc=patrol-swordsman&action=npc-morning');
  });

  it('places all twenty-two NPCs in their areas with separate visual identities', () => {
    render(<MapCharacterCreator />);
    const expected = [
      ['Bà mẹ quê', 'memory-keeper', 'Bến Thuyền', 2860, 1945],
      ['Tảo', 'fisherman-tao', 'Bến Cá Ngạnh', 2970, 1320],
      ['Võ Sư Nương', 'woman-general', 'Khu Luyện Võ', 2160, 610],
      ['Giao', 'messenger', 'Chợ Nhỏ', 2500, 1535],
      ['Trưởng Đội Tuần Tra', 'gate-guard', 'Chốt Chặn', 3050, 1500],
      ['Lão Lang Trung', 'herbalist-lang', 'Hiệu thuốc Nam', 1650, 1500],
      ['Tiểu Nhị Quán Rạp', 'inn-server', 'Quán Rạp', 2350, 1810],
      ['Thím Tư', 'fruit-aunt-tu', 'Sạp Trái Cây', 2140, 1420],
      ['Thiết Chủy', 'smith-thiet-chuy', 'Lò Rèn', 2670, 1550],
      ['Lão Tiều Phu', 'woodcutter', 'Rìa Rừng Tre', 1000, 1330],
      ['Tiểu Muội Bán Đồ Chơi', 'toy-seller', 'Gian Hàng Đồ Chơi', 1900, 1810],
      ['Hạc Lão', 'beggar-hac-lao', 'Góc Tường Cũ', 1780, 1500],
      ['Lệ Nương', 'singer-le-nuong', 'Tửu Lâu', 2540, 1700],
      ['A Sáng', 'herdboy-a-sang', 'Đồng Cỏ Phía Bắc', 2160, 810],
      ['Đội Trưởng Hộ Vệ Làng', 'village-captain', 'Cổng Làng', 2840, 1650],
      ['Hắc Lang', 'black-wolf', 'Lều Rách Sau Kho', 1360, 1810],
      ['Mụ Độc Bà', 'poison-witch', 'Hang Đầm Lầy', 520, 1710],
      ['A Cẩu', 'double-agent-acau', 'Gầm Cầu Gỗ', 3010, 1830],
      ['Huyết Đao Phượng', 'blood-blade-phuong', 'Vách Đá Biên Giới', 1110, 865],
      ['Quản Gia Triệu', 'tax-official-trieu', 'Trạm Thu Thuế', 2780, 1160],
      ['Lính Tuần Tra Cung', 'patrol-archer', 'Chốt Chặn · Đầu cầu phía Đông', 3260, 1510],
      ['Lính Tuần Tra Đao', 'patrol-swordsman', 'Chốt Chặn · Đầu cầu phía Tây', 2940, 1670],
    ] as const;
    for (const [name, id, locationLabel, x, y] of expected) {
      expect(screen.getByRole('button', { name: `Chỉnh ${name}` })).toBeTruthy();
      expect(map.props?.npcs?.find(npc => npc.id === id)).toMatchObject({ name, mapId: 'opening-map', locationLabel, point: { x, y } });
    }
    expect(screen.getByRole('button', { name: 'Chỉnh Bà mẹ quê' }).querySelector('svg')).toBeTruthy();
    expect(map.props?.embedded).toBe(true);
    expect(map.props?.overview).toBe(true);
    const requested = map.props!.npcs!.filter(npc => expected.some(([, id]) => id === npc.id));
    expect(new Set(requested.map(npc => `${npc.design.bodyType}:${npc.design.hairstyle}:${npc.design.outfit}:${npc.design.outfitColor}`)).size).toBe(22);
  });

  it('autosaves appearance and missions, updates the game subscription, and restores after remount', async () => {
    render(<><MapCharacterCreator /><GameObserver /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh Võ Sư Nương' }));
    fireEvent.change(screen.getByLabelText('Tên nhân vật'), { target: { value: 'Nương giữ sân võ' } });
    fireEvent.change(screen.getByLabelText('Nhiệm vụ nhân vật giao'), { target: { value: 'Tập đội hình rồi trở lại gặp ta.' } });
    fireEvent.change(screen.getByLabelText('Lời thoại khi tương tác'), { target: { value: 'Giữ vững bước chân!' } });
    fireEvent.change(screen.getByLabelText('Màu áo / giáp'), { target: { value: '#123456' } });
    const expected = { name: 'Nương giữ sân võ', mission: 'Tập đội hình rồi trở lại gặp ta.', dialogue: 'Giữ vững bước chân!', design: { outfitColor: '#123456', outfit: 'light-armor', bodyType: 'athletic' } };
    await waitFor(() => expect(stored().find(npc => npc.id === 'woman-general')).toMatchObject(expected));
    expect(map.props?.npcs?.find(npc => npc.id === 'woman-general')).toMatchObject(expected);
    const gameNpcs = JSON.parse(screen.getByTestId('game-npcs').textContent ?? '[]') as OpeningMapNpc[];
    expect(gameNpcs.find(npc => npc.id === 'woman-general')).toMatchObject(expected);
    cleanup();
    render(<MapCharacterCreator />);
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh Nương giữ sân võ' }));
    expect((screen.getByLabelText('Nhiệm vụ nhân vật giao') as HTMLTextAreaElement).value).toBe(expected.mission);
  });

  it('selects an NPC for the shared action editor and removes legacy image/pose controls', async () => {
    const onNpcSelect = vi.fn();
    render(<MapCharacterCreator onNpcSelect={onNpcSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh Tảo' }));
    expect(onNpcSelect).toHaveBeenCalledWith('fisherman-tao');
    expect(screen.queryByLabelText('Ảnh nhân vật NPC')).toBeNull();
    expect(screen.queryByLabelText('Hướng nhìn NPC')).toBeNull();
    expect(screen.queryByLabelText('Động tác')).toBeNull();
    expect(screen.queryByRole('link', { name: /Chỉnh ảnh và hành động/ })).toBeNull();
  });

  it('selects from the map, repositions in overview and focuses the game camera', async () => {
    render(<MapCharacterCreator />);
    fireEvent.click(screen.getByRole('button', { name: 'Chọn đội trưởng trên map' }));
    expect(map.props?.selectedNpcId).toBe('gate-guard');
    fireEvent.click(screen.getByRole('button', { name: 'Chọn lại vị trí trên map' }));
    expect(map.props?.placingNpc).toBe(true);
    expect(map.props?.overview).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Đặt tại 321, 456' }));
    await waitFor(() => expect(stored().find(npc => npc.id === 'gate-guard')?.point).toEqual({ x: 321, y: 456 }));
    expect(map.props?.placingNpc).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Đến vị trí NPC · góc nhìn game' }));
    expect(map.props?.overview).toBe(false);
    expect(map.props?.focusPoint).toEqual({ x: 321, y: 456 });
  });

  it('writes full profiles to source and removes drafts belonging to retired maps', async () => {
    const legacy: MapCharacterDraft = { id: 'old-map-npc', mapId: 'hai-ba-trung', name: 'Chú lái đò', appearance: { ...DEFAULT_APPEARANCES.male }, point: { x: 4000, y: 5000 } };
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([legacy]));
    const fetchMock = vi.fn(async (_url: string, options: RequestInit) => ({ ok: true, text: async () => JSON.stringify(JSON.parse(options.body as string)) }));
    vi.stubGlobal('fetch', fetchMock);
    render(<MapCharacterCreator />);
    fireEvent.change(screen.getByLabelText('Nhiệm vụ nhân vật giao'), { target: { value: 'Ghé bến và hỏi thăm dân làng.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ghi NPC vào source' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Đã ghi NPC'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/__character-designer/save-map-characters');
    expect(options.method).toBe('POST');
    const payload = JSON.parse(options.body as string) as { characters: OpeningMapNpc[] };
    expect(payload.characters.every(npc => npc.mapId === 'opening-map')).toBe(true);
    expect(payload.characters.find(npc => npc.id === 'memory-keeper')).toMatchObject({
      name: 'Bà mẹ quê', alias: 'Người giữ bến', locationLabel: 'Bến Thuyền', mission: 'Ghé bến và hỏi thăm dân làng.',
      point: { x: 2860, y: 1945 }, appearance: { gender: 'female' }, design: { bodyType: 'elderly-bent', weapon: 'walking-staff' },
    });
    expect(stored().find(npc => npc.id === legacy.id)).toBeUndefined();
    expect(stored().find(npc => npc.id === 'memory-keeper')?.mission).toBe('Ghé bến và hỏi thăm dân làng.');
  });

  it('loads current NPC edits despite malformed retired records and preserves other browser saves', async () => {
    const current: MapCharacterDraft = { id: 'memory-keeper', mapId: 'opening-map', name: 'Bà giữ bến đã sửa', appearance: { ...DEFAULT_APPEARANCES.female }, point: { x: 463, y: 632 } };
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify([{ mapId: 'hai-ba-trung', point: null }, current]));
    localStorage.setItem('player-profile', '{"name":"Người chơi"}');
    localStorage.setItem('game-save-slot-1', '{"progress":42}');
    render(<MapCharacterCreator />);
    expect(screen.getByRole('button', { name: 'Chỉnh Bà giữ bến đã sửa' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    await waitFor(() => expect(stored()).toEqual([current]));
    expect(localStorage.getItem('player-profile')).toBe('{"name":"Người chơi"}');
    expect(localStorage.getItem('game-save-slot-1')).toBe('{"progress":42}');
  });

  it('rejects importing retired-map NPCs without replacing current-map edits', async () => {
    render(<MapCharacterCreator />);
    fireEvent.change(screen.getByLabelText('Tên nhân vật'), { target: { value: 'Bà giữ bến đã sửa' } });
    const before = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
    const retired = new File(['{}'], 'old-map-npcs.json', { type: 'application/json' });
    Object.defineProperty(retired, 'text', { value: async () => JSON.stringify({ characters: [{ id: 'old-npc', mapId: 'hai-ba-trung', name: 'NPC cũ', point: { x: 100, y: 100 } }] }) });
    fireEvent.change(screen.getByLabelText('Nhập JSON NPC'), { target: { files: [retired] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Bản đồ'));
    expect(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)).toBe(before);
    expect(map.props?.npcs?.every(npc => npc.mapId === 'opening-map')).toBe(true);
  });

  it('rejects an invalid import without overwriting saved work', async () => {
    render(<MapCharacterCreator />);
    fireEvent.change(screen.getByLabelText('Tên nhân vật'), { target: { value: 'Bà giữ bến đã sửa' } });
    const before = localStorage.getItem(MAP_CHARACTER_DRAFT_KEY);
    const invalid = new File(['{}'], 'bad-npc.json', { type: 'application/json' });
    Object.defineProperty(invalid, 'text', { value: async () => JSON.stringify({ characters: [{ id: 'broken', mapId: 'opening-map', name: 'Sai tọa độ', point: { x: -100, y: 100 } }] }) });
    fireEvent.change(screen.getByLabelText('Nhập JSON NPC'), { target: { files: [invalid] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Tọa độ X'));
    expect(localStorage.getItem(MAP_CHARACTER_DRAFT_KEY)).toBe(before);
    expect(map.props?.npcs?.find(npc => npc.id === 'memory-keeper')?.name).toBe('Bà giữ bến đã sửa');
  });
});
