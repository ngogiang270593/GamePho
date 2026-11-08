import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HISTORY_PROFILE_KEY } from '../services/historyProfile';
import { DEFAULT_APPEARANCES } from '../game/character';
import { makeSpriteSheet } from '../game/characterSpriteSheet';
import { DEFAULT_OPENING_MAP_NPCS } from '../game/openingMapNpcs';
import { MAP_CHARACTER_DRAFT_KEY } from '../game/mapCharacterDraft';
import { OPENING_MAP_BUILDINGS } from '../game/openingMap';
import { OPENING_MAP_DELIVERY_QUEST_KEY } from '../game/openingMapDeliveryQuest';
import { freshHistoryProgress, HISTORY_PROGRESS_KEY } from '../services/historyProgress';
import { openingMapForegroundIds } from '../components/OpeningMapScenery';
import { OPENING_MAP_REST_POINT } from '../components/OpeningMapNpcHomes';
import { isOpeningMapWalkable, OPENING_MAP_AREAS, OpeningMapPage } from './OpeningMapPage';

const POSITION_KEY = 'opening-map-player-position-landscape-v2';
const SPAWN = { x: 2160, y: 1620 };
function finishNpcDialogue() {
  while (screen.queryByRole('button', { name: 'Đọc tiếp câu chuyện' })) {
    fireEvent.click(screen.getByRole('button', { name: 'Đọc tiếp câu chuyện' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
}
const sprite = vi.hoisted(() => ({ playerProps: null as Record<string, unknown> | null }));
vi.mock('../components/CharacterSprite', () => ({
  CharacterSprite: (props: { facing?: string; className?: string } & Record<string, unknown>) => {
    if (props.className === 'opening-map-player__sprite') sprite.playerProps = props;
    return <svg className={`${props.className ?? ''} facing-${props.facing}`} />;
  },
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('OpeningMapPage', () => {
  it('starts in the market with scenery and all twenty-two NPC map pins', () => {
    localStorage.setItem(MAP_CHARACTER_DRAFT_KEY, JSON.stringify(DEFAULT_OPENING_MAP_NPCS));
    render(<OpeningMapPage />);
    const art = screen.getByRole('img', { name: /Làng quê Việt Nam ven sông/ });
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    expect(player.getAttribute('data-player-x')).toBe(String(OPENING_MAP_REST_POINT.x));
    expect(player.getAttribute('data-player-y')).toBe(String(OPENING_MAP_REST_POINT.y));
    expect(document.querySelectorAll('[data-npc-id]').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Bản đồ thu nhỏ')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Hiện bản đồ nhỏ' }));
    expect(document.querySelectorAll('.opening-map-minimap__npc-pin')).toHaveLength(25);
    expect(document.querySelector('[data-npc-id="market-vendor"]')).toBeNull();
    expect(document.querySelector('image[href="/assets/maps/thon-que-watercolor.png"]')).toBeNull();
    expect(art.querySelectorAll('path, use, rect, circle').length).toBeGreaterThan(30);
    expect(art.querySelectorAll('[data-building-kind="house"]')).toHaveLength(OPENING_MAP_BUILDINGS.filter(building => building.kind === 'house').length);
    expect(art.querySelectorAll('[data-building-kind="stall"]')).toHaveLength(OPENING_MAP_BUILDINGS.filter(building => building.kind === 'stall').length);
    expect(art.querySelector('[data-building-id="home-nw-1"] path[fill*="plaster"]')).toBeTruthy();
    expect(art.querySelector('[data-building-id="stall-vegetables"] .scenery-awning')).toBeTruthy();
    expect(art.querySelector('[data-building-id="stall-fruit"]')).toBeNull();
    expect(art.querySelector('[data-building-id="stall-spices"]')).toBeNull();
    expect(art.querySelector('[data-landmark="fruit-baskets"]')).toBeTruthy();
    expect(art.querySelectorAll('.scenery-house-roof-ridge')).toHaveLength(OPENING_MAP_BUILDINGS.filter(building => building.kind === 'house').length);
    expect(art.querySelectorAll('.scenery-house-door-grain')).toHaveLength(OPENING_MAP_BUILDINGS.filter(building => building.kind === 'house').length);
    expect(art.querySelectorAll('.scenery-stall-awning-panels')).toHaveLength(OPENING_MAP_BUILDINGS.filter(building => building.kind === 'stall').length);
    expect(art.querySelector('[data-map-object="delivery-dock"]')).toBeTruthy();
    expect(art.querySelector(`use[transform^="translate(2940 2300)"]`)).toBeNull();
    expect(art.querySelectorAll('[data-npc-homestead]')).toHaveLength(5);
    expect(art.querySelector('[data-npc-homestead="memory-keeper"] .opening-map-rest-sign')?.textContent).toContain('NGHỈ QUA ĐÊM');
    expect(art.querySelector('[data-npc-homestead="fisherman-tao"] text')?.textContent).toContain('BẾN CÁ NGẠNH');
    expect(document.querySelector('[data-rest-point]')).toBeTruthy();
    expect(document.querySelector('[data-water-quest]')).toBeTruthy();
    const npcDepths = [...document.querySelectorAll<SVGGElement>('.opening-map-npc-marker')].map(marker => Number(marker.getAttribute('data-npc-y')));
    expect(npcDepths).toEqual([...npcDepths].sort((left, right) => left - right));
    expect(isOpeningMapWalkable(OPENING_MAP_REST_POINT)).toBe(true);
    expect(isOpeningMapWalkable(OPENING_MAP_REST_POINT, undefined, false)).toBe(true);
    expect(document.querySelector('[data-npc-homestead="memory-keeper"]')?.getAttribute('transform')).toBe('translate(2820 1900)');
    expect(art.getAttribute('viewBox')).not.toBe('0 0 4320 3000');
    expect(screen.getByLabelText('Bản đồ thu nhỏ')).toBeTruthy();
  });

  it('updates the clock, light, and weather forecast as in-game time advances', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = { ...progress.riverCampaign, day: '2026-11-06', timeMinutes: 1140 };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage persistPlayerPosition={false} />);
    const map = screen.getByRole('region', { name: 'Bản đồ khởi đầu' });
    const clock = screen.getByLabelText('Thời gian và thời tiết trong game');
    expect(map.getAttribute('data-light-phase')).toBe('sunset');
    expect(map.getAttribute('data-weather')).toBe('breeze');
    expect(clock.textContent).toContain('19:00');
    expect(clock.textContent).toContain('Hoàng hôn');
    expect(clock.textContent).toContain('Gió nhẹ');

    fireEvent.click(within(clock).getByRole('button', { name: 'Chờ thêm 1 giờ' }));
    expect(screen.getByRole('region', { name: 'Bản đồ khởi đầu' }).getAttribute('data-light-phase')).toBe('night');
    expect(screen.getByLabelText('Thời gian và thời tiết trong game').textContent).toContain('20:00');
  });

  it('connects the latest map to the GDD attributes, daily AP, NPC quests, and saved choices', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nhân vật' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Chỉ số' }));
    expect(screen.getByRole('region', { name: 'Nhân vật' }).textContent).toContain('600/600 HP');
    expect(screen.getByRole('region', { name: 'Nhân vật' }).textContent).toContain('300/300 MP');
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bến Nước · Mở hành trình' }));

    expect(screen.getByRole('dialog', { name: 'Hành trình Bến Nước' })).toBeTruthy();
    expect(screen.getByLabelText('3 trên 3 điểm hoạt động còn lại')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Bà Mẹ Quê/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Tảo · Mưu Sinh Và Sinh Tồn/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Võ Sư Nương/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Giao · Mật Thư Đổi Ca/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Trưởng Đội Tuần Tra/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Đóng hành trình' }));
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Bà mẹ quê' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
    fireEvent.click(screen.getByRole('button', { name: 'Con xin thề bảo vệ xóm làng!' }));
    expect(JSON.parse(localStorage.getItem('su-viet-hanh-trinh-progress-v1')!).riverCampaign)
      .toMatchObject({ actionPoints: 2, morality: 60, vanTien: 50, fastTravel: true });
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục đi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bến Nước · Mở hành trình' }));
    expect(screen.getByLabelText('2 trên 3 điểm hoạt động còn lại')).toBeTruthy();
  });

  it('shows story NPCs and village residents when the full map is in overview', () => {
    render(<OpeningMapPage overview persistPlayerPosition={false} />);
    expect([...document.querySelectorAll('[data-npc-id]')].map(npc => npc.getAttribute('data-npc-id'))).toEqual([
      'woman-general', 'herdboy-a-sang', 'blood-blade-phuong', 'tax-official-trieu',
      'fisherman-tao', 'woodcutter', 'fruit-aunt-tu', 'gate-guard', 'herbalist-lang',
      'beggar-hac-lao', 'patrol-archer', 'messenger', 'smith-thiet-chuy', 'village-captain', 'patrol-swordsman', 'singer-le-nuong',
      'poison-witch', 'NPC_DAN_NONG_02', 'NPC_DAN_NONG_03', 'inn-server', 'toy-seller',
      'black-wolf', 'double-agent-acau', 'memory-keeper', 'NPC_DAN_NONG_01',
    ]);
  });

  it('runs and saves the herbalist quest from the NPC conversation', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Lão Lang Trung' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nhận việc tìm Xuyên Khung' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tìm Xuyên Khung ven suối · 1 AP' }));
    fireEvent.click(screen.getByRole('button', { name: /Giao thuốc/ }));

    const saved = JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!);
    expect(saved.riverCampaign).toMatchObject({
      actionPoints: 0,
      maxHp: 650,
      hp: 650,
      poisonRecipeUnlocked: true,
      npcQuestStages: { 'herbalist-lang': 3 },
    });
    expect(saved.riverCampaign.inventory.ITEM_XUYEN_KHUNG).toBeUndefined();
    expect(screen.getByText(/Đã hoàn thành · Khí Huyết tối đa \+50/)).toBeTruthy();
  });

  it('shows the NPC schedule and keeps keyboard focus inside the dialogue', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Bà mẹ quê' }));

    const dialog = screen.getByRole('dialog', { name: /Bà mẹ quê/ });
    expect(dialog.querySelector('.opening-map-dialog__portrait-art')).toBeTruthy();
    expect(dialog.querySelector('.opening-map-dialog__portrait-art')?.getAttribute('data-npc-artwork')).toBe('ba-me-que');
    expect(dialog.querySelector('.opening-map-dialog__schedule')).toBeNull();
    expect(dialog.querySelector('.opening-map-dialog__speech')?.textContent).toContain('Chuyến hàng của làng bị Trưởng Đội Tuần Tra chặn lại');
    expect(within(dialog).queryByText('Nhiệm vụ')).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Tiếp tục đi' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kết thúc trò chuyện' }));
    expect(dialog.querySelector('.opening-map-dialog__schedule')?.textContent).toContain('Ngồi trên chiếu rách ngoài hiên');
    expect(within(dialog).getByRole('button', { name: 'Tiếp tục đi' })).toBeTruthy();

    const controls = dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
    const closeButton = within(dialog).getByRole('button', { name: 'Đóng trò chuyện' });
    controls[controls.length - 1].focus();
    fireEvent.keyDown(controls[controls.length - 1], { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(controls[controls.length - 1]);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Bà mẹ quê/ })).toBeNull();
  });

  it('paginates long NPC dialogue without showing multiple text blocks at once', () => {
    const longDialogue = 'Con hãy mang chiếc bản đồ tuần tra theo bên mình. Nó sẽ giúp con quan sát lính gác từ xa. Nếu đường cầu bị chặn, hãy men theo bờ sông để tìm lối đi an toàn.';
    const npcs = DEFAULT_OPENING_MAP_NPCS.map(npc => npc.id === 'smith-thiet-chuy'
      ? { ...npc, dialogue: longDialogue, schedule: undefined }
      : npc);
    render(<OpeningMapPage npcs={npcs} persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Thiết Chủy' }));

    const dialog = screen.getByRole('dialog', { name: /Thiết Chủy/ });
    const speech = dialog.querySelector('.opening-map-dialog__speech')!;
    const firstPage = speech.querySelector('p')!.textContent;
    expect(firstPage).toContain('Con hãy mang chiếc bản đồ tuần tra theo bên mình.');
    expect(within(speech as HTMLElement).getByText(/1\/\d+/)).toBeTruthy();

    fireEvent.click(within(speech as HTMLElement).getByRole('button', { name: 'Lời thoại tiếp' }));
    expect(speech.querySelectorAll('p')).toHaveLength(1);
    expect(speech.querySelector('p')?.textContent).not.toBe(firstPage);
    expect(within(speech as HTMLElement).getByText(/2\/\d+/)).toBeTruthy();
    fireEvent.click(within(speech as HTMLElement).getByRole('button', { name: 'Lời thoại trước' }));
    expect(speech.querySelector('p')?.textContent).toBe(firstPage);
  });

  it('keeps in-progress and pending-choice objectives accurate in the quest log', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = {
      ...progress.riverCampaign,
      npcQuestStages: { 'herbalist-lang': 1, 'singer-le-nuong': 3 },
    };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nhiệm vụ' }));

    expect(screen.getByText('Tìm Xuyên Khung ven suối, rồi mang về giao')).toBeTruthy();
    const singerStatus = screen.getByText('CHỜ CHỌN HƯỚNG');
    expect(singerStatus.closest('article')?.textContent).toContain('Đã nhận tin tình báo · chọn chia sẻ hoặc giữ bí mật');
    expect(singerStatus.closest('article')?.textContent).not.toContain('Đã hoàn thành');
  });

  it('buys and gifts fruit for MP recovery or persistent affinity', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Thím Tư' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
    fireEvent.click(screen.getByRole('button', { name: /Mua trái cây/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tặng trái cây/ }));

    const saved = JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!);
    expect(saved.riverCampaign).toMatchObject({
      actionPoints: 1,
      vanTien: 42,
      npcAffinities: { 'singer-le-nuong': 60 },
    });
    expect(saved.riverCampaign.inventory.ITEM_TRAI_CAY).toBeUndefined();
  });

  it('blocks movement at the eastern checkpoint before boss victory', async () => {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ x: 3070, y: 1500 }));
    render(<OpeningMapPage embedded />);
    const map = screen.getByRole('region', { name: 'Bản đồ khởi đầu' });
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    expect(document.querySelector('[data-checkpoint-barrier]')).toBeTruthy();

    map.focus();
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => expect(Number(player.getAttribute('data-player-x'))).toBeGreaterThan(3090));
    await new Promise(resolve => window.setTimeout(resolve, 120));
    fireEvent.keyUp(window, { key: 'd' });
    expect(Number(player.getAttribute('data-player-x'))).toBeLessThan(3135);
  });

  it('opens the eastern checkpoint after boss victory', async () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = { ...progress.riverCampaign, bossDefeated: true };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    localStorage.setItem(POSITION_KEY, JSON.stringify({ x: 3070, y: 1500 }));
    render(<OpeningMapPage embedded />);
    const map = screen.getByRole('region', { name: 'Bản đồ khởi đầu' });
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    expect(document.querySelector('[data-checkpoint-barrier]')).toBeNull();

    map.focus();
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => expect(Number(player.getAttribute('data-player-x'))).toBeGreaterThan(3135));
    fireEvent.keyUp(window, { key: 'd' });
  });

  it('starts the boss when entering the checkpoint trigger after preparing both quest rewards', async () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = { ...progress.riverCampaign, trapRecipe: true, knowsDaoManual: true, actionPoints: 0 };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage embedded focusPoint={{ x: 3060, y: 1500 }} persistPlayerPosition={false} />);

    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Trận chiến Chốt Chặn' })).toBeTruthy());
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign)
      .toMatchObject({ bossStarted: true, actionPoints: 0, battle: { status: 'playing' } });
  });

  it('keeps an explicitly empty NPC list empty for isolated previews', () => {
    render(<OpeningMapPage npcs={[]} persistPlayerPosition={false} />);
    expect(document.querySelectorAll('[data-npc-id]')).toHaveLength(0);
    expect(document.querySelectorAll('.opening-map-minimap__npc-pin')).toHaveLength(0);
  });

  it('previews the edited character and animation without moving or replacing saved positions', async () => {
    const saved = JSON.stringify({ x: 2170, y: 1630 });
    const legacy = JSON.stringify({ x: 940, y: 630 });
    localStorage.setItem(POSITION_KEY, saved);
    localStorage.setItem('opening-map-player-position-watercolor', legacy);
    const sheet = makeSpriteSheet('/preview.png', 2048, 1024, 'Walking', 8, 4);
    const props = {
      embedded: true, persistPlayerPosition: false,
      appearance: DEFAULT_APPEARANCES.male, startingCharacter: 'forest-keeper' as const,
      playerSpriteSheet: sheet, playerName: 'Nhân vật thử',
    };
    const { rerender } = render(<OpeningMapPage {...props} interactive={false}
      previewMotion={{ action: 'run', facing: 'left', frame: 3, playing: false }} />);
    const player = screen.getByRole('img', { name: 'Nhân vật thử' });
    expect(sprite.playerProps).toMatchObject({
      appearance: props.appearance, startingCharacter: 'forest-keeper', spriteSheet: sheet,
      facing: 'left', spriteAction: 'run', spriteFrame: 3, spritePlaying: false, walking: true, running: true,
    });
    expect(sprite.playerProps?.customization).toBeUndefined();
    expect(player.getAttribute('data-player-x')).toBe(String(SPAWN.x));
    screen.getByRole('region', { name: 'Bản đồ khởi đầu' }).focus();
    fireEvent.keyDown(window, { key: 'd' });
    await new Promise(resolve => window.setTimeout(resolve, 60));
    expect(player.getAttribute('data-player-x')).toBe(String(SPAWN.x));
    fireEvent.keyUp(window, { key: 'd' });
    rerender(<OpeningMapPage {...props} interactive />);
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => expect(Number(player.getAttribute('data-player-x'))).toBeGreaterThan(SPAWN.x));
    fireEvent.keyUp(window, { key: 'd' });
    expect(localStorage.getItem(POSITION_KEY)).toBe(saved);
    expect(localStorage.getItem('opening-map-player-position-watercolor')).toBe(legacy);
  });

  it('shows the whole world in overview mode and keeps every destination on walkable land', () => {
    render(<OpeningMapPage overview persistPlayerPosition={false} />);
    expect(screen.getByRole('img', { name: /tranh màu nước/ }).getAttribute('viewBox')).toBe('0 0 4320 3000');
    fireEvent.click(screen.getByRole('button', { name: 'Hiện bản đồ nhỏ' }));
    expect(document.querySelectorAll('.opening-map-minimap__area-pin')).toHaveLength(OPENING_MAP_AREAS.length);
    for (const area of OPENING_MAP_AREAS) {
      expect(isOpeningMapWalkable(area.point), area.name).toBe(true);
      expect(screen.getByRole('button', { name: `Đi đến ${area.name}` })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn bản đồ nhỏ' }));
    expect(screen.queryByLabelText('Bản đồ thu nhỏ')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Hiện bản đồ nhỏ' }));
    expect(screen.getByLabelText('Bản đồ thu nhỏ')).toBeTruthy();
  });

  it('opens the world with M and chooses a destination before returning to the following camera', async () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    const art = screen.getByRole('img', { name: /tranh màu nước/ });
    expect(screen.queryByRole('button', { name: 'Đi đến Đồi chè phía Bắc' })).toBeNull();
    fireEvent.keyDown(window, { key: 'm' });
    expect(art.getAttribute('viewBox')).toBe('0 0 4320 3000');
    expect(screen.getByRole('button', { name: /Theo nhân vật/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Đi đến Đồi chè phía Bắc' }));
    expect(art.getAttribute('viewBox')).not.toBe('0 0 4320 3000');
    expect(document.querySelector('.opening-map-destination')).toBeTruthy();
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    await waitFor(() => expect(Number(player.getAttribute('data-player-y'))).toBeLessThan(SPAWN.y));
    fireEvent.keyDown(window, { key: 'm' });
    expect(art.getAttribute('viewBox')).toBe('0 0 4320 3000');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(art.getAttribute('viewBox')).not.toBe('0 0 4320 3000');
  });

  it('scopes embedded keyboard movement to the focused map and moves the camera and minimap with the player', async () => {
    render(<><input aria-label="Tên ngoài map" /><OpeningMapPage embedded persistPlayerPosition={false} /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Hiện bản đồ nhỏ' }));
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    const art = screen.getByRole('img', { name: /tranh màu nước/ });
    const initialX = Number(player.getAttribute('data-player-x'));
    const initialPlayerPinX = document.querySelector('.opening-map-minimap__player-pin')?.getAttribute('cx');
    const initialViewBox = art.getAttribute('viewBox');
    const camera = document.querySelector('[data-opening-map-camera]');
    const initialCameraTransform = camera?.getAttribute('transform');
    const outside = screen.getByLabelText('Tên ngoài map');
    outside.focus();
    fireEvent.keyDown(outside, { key: 'd' });
    await new Promise(resolve => window.setTimeout(resolve, 60));
    expect(Number(player.getAttribute('data-player-x'))).toBe(initialX);
    screen.getByRole('region', { name: 'Bản đồ khởi đầu' }).focus();
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => {
      expect(Number(player.getAttribute('data-player-x'))).toBeGreaterThan(initialX);
      expect(player.querySelector('.facing-right')).toBeTruthy();
      expect(document.querySelector('.opening-map-minimap__player-pin')?.getAttribute('cx')).not.toBe(initialPlayerPinX);
      expect(art.getAttribute('viewBox')).toBe(initialViewBox);
      expect(camera?.getAttribute('transform')).not.toBe(initialCameraTransform);
    });
    fireEvent.keyUp(window, { key: 'd' });
  });

  it('faces forward while idle after walking vertically and stopping', async () => {
    render(<OpeningMapPage embedded persistPlayerPosition={false} />);
    const map = screen.getByRole('region', { name: 'Bản đồ khởi đầu' });
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    expect(player.querySelector('.facing-down')).toBeTruthy();

    map.focus();
    fireEvent.keyDown(window, { key: 'w' });
    await waitFor(() => {
      expect(Number(player.getAttribute('data-player-y'))).toBeLessThan(SPAWN.y);
      expect(player.querySelector('.facing-up')).toBeTruthy();
    });
    fireEvent.keyUp(window, { key: 'w' });
    await waitFor(() => {
      expect(player.querySelector('.facing-down')).toBeTruthy();
      expect(player.querySelector('.is-walking')).toBeNull();
    });
  });

  it('updates the foreground scenery directly as the player walks past buildings', async () => {
    const focus = { x: 2680, y: 1840 };
    expect(isOpeningMapWalkable(focus)).toBe(true);
    expect(openingMapForegroundIds(focus)).toContain('home-se-1');
    render(<OpeningMapPage embedded focusPoint={focus} persistPlayerPosition={false} />);
    const foreground = document.querySelector('.opening-map-foreground');
    expect(foreground?.querySelector('use[href$="home-se-1"]')).toBeTruthy();

    screen.getByRole('region', { name: 'Bản đồ khởi đầu' }).focus();
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => expect(foreground?.querySelector('use[href$="home-se-1"]')).toBeNull());
    fireEvent.keyUp(window, { key: 'd' });
  });

  it('completes Bà mẹ quê’s delivery only through the right NPCs and saves the next clue', async () => {
    const openNpc = (name: string) => {
      fireEvent.click(screen.getByRole('button', { name: `Trò chuyện với ${name}` }));
      finishNpcDialogue();
    };
    const closeDialog = () => {
      if (screen.queryByRole('button', { name: 'Đọc tiếp câu chuyện' }) || screen.queryByRole('button', { name: 'Kết thúc trò chuyện' })) finishNpcDialogue();
      fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục đi' }));
    };
    render(<OpeningMapPage persistPlayerPosition={false} />);

    openNpc('Giao');
    expect(screen.queryByRole('button', { name: 'Giao kiện hàng' })).toBeNull();
    closeDialog();

    openNpc('Bà mẹ quê');
    expect(screen.getByText(/Chuyến hàng của làng bị Trưởng Đội Tuần Tra chặn lại/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nhận kiện hàng' }));
    expect(document.querySelector('.opening-map-player__package')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Hành trang' }));
    const bagPanel = screen.getByRole('region', { name: 'Hành trang' });
    expect(bagPanel.textContent).toContain('Kiện hàng bọc vải');
    expect(bagPanel.textContent).toContain('VẬT PHẨM NHIỆM VỤ');
    expect(bagPanel.textContent).toContain('Đang có trong túi');
    expect(bagPanel.textContent).not.toContain('Giao hàng cho Giao');
    expect(document.querySelector('.opening-map-player__package')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nhiệm vụ' }));
    const questPanel = screen.getByRole('region', { name: 'Nhiệm vụ' });
    expect(questPanel.textContent).toContain('Bà mẹ quê · Bến Thuyền');
    expect(questPanel.textContent).toContain('Giao hàng cho Giao');
    expect(questPanel.textContent).toContain('MỤC TIÊU HIỆN TẠI');
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng' }));
    closeDialog();

    openNpc('Tảo');
    expect(screen.queryByRole('button', { name: 'Giao kiện hàng' })).toBeNull();
    closeDialog();

    openNpc('Giao');
    fireEvent.click(screen.getByRole('button', { name: 'Giao kiện hàng' }));
    expect(screen.getByText(/Nhiều sạp khác cũng bị Trưởng Đội Tuần Tra lấy mất hàng/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hành trang' }));
    expect(screen.getByRole('region', { name: 'Hành trang' }).textContent).toContain('Túi đồ đang trống');
    expect(document.querySelector('.opening-map-player__package')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng' }));
    closeDialog();

    openNpc('Bà mẹ quê');
    fireEvent.click(screen.getByRole('button', { name: 'Báo đã giao hàng' }));
    expect(JSON.parse(localStorage.getItem(OPENING_MAP_DELIVERY_QUEST_KEY)!).stage).toBe('completed');
    closeDialog();

    openNpc('Giao');
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi về hàng bị tịch thu' }));
    expect(JSON.parse(localStorage.getItem(OPENING_MAP_DELIVERY_QUEST_KEY)!).stage).toBe('clue-revealed');
    expect(screen.getByText(/Tảo từng thấy dây chắn dưới cầu tre/)).toBeTruthy();
    closeDialog();

    cleanup();
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nhiệm vụ' }));
    expect(screen.getByRole('region', { name: 'Nhiệm vụ' }).textContent).toContain('Hỏi Tảo về vật chắn dưới cầu tre');
    fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng' }));
    openNpc('Tảo');
    expect(screen.getByRole('button', { name: 'Hỏi Tảo về vật chắn' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hỏi Tảo về vật chắn' }));
    expect(JSON.parse(localStorage.getItem(OPENING_MAP_DELIVERY_QUEST_KEY)!).stage).toBe('tao-informed');
    fireEvent.click(screen.getByRole('button', { name: 'Nhiệm vụ' }));
    expect(screen.getByRole('region', { name: 'Nhiệm vụ' }).textContent).toContain('Câu Cá Cóc ở Bến Nước, chọn chia cá và giao cho ba hộ dân để mở Bẫy Tre Gai');
  });

  it('opens the bag, quests, martial arts, and professions from separate buttons', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    const openInventory = screen.getByRole('button', { name: 'Hành trang' });
    expect(screen.getAllByRole('button', { name: 'Hành trang' })).toHaveLength(1);
    fireEvent.click(openInventory);
    expect(screen.getByRole('region', { name: 'Hành trang' }).textContent).toContain('Túi đồ đang trống');
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByText('Nhiệm vụ chính')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Công pháp' }));
    expect(screen.getByRole('region', { name: 'Công pháp' })).toBeTruthy();
    expect(screen.getByText('Hà Bá Tức Công')).toBeTruthy();
    expect(screen.getByText('Cá Cóc Phún Thủy')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Nghề nghiệp' }));
    expect(screen.getByRole('region', { name: 'Nghề nghiệp' })).toBeTruthy();
    expect(screen.getByText('Câu Cá · Cấp 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nhặt quặng ven sông · 1 AP' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Bến Nước · Mở hành trình' }));
    expect(screen.getByRole('dialog', { name: 'Hành trình Bến Nước' })).toBeTruthy();
  });

  it('keeps the map free of a large journey HUD and exposes the campaign as a menu button', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    expect(screen.queryByLabelText('Nhân vật đang chơi')).toBeNull();
    const campaignButton = screen.getByRole('button', { name: 'Bến Nước · Mở hành trình' });
    expect(campaignButton.textContent).toContain('Hành trình');
    fireEvent.click(campaignButton);
    expect(screen.getByRole('dialog', { name: 'Hành trình Bến Nước' })).toBeTruthy();
  });

  it('shows the character profile as concise, separate tabs without repeating sections', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nhân vật' }));

    const sheet = screen.getByRole('region', { name: 'Nhân vật' });
    const profileContent = () => within(sheet).getByRole('tabpanel');
    expect(screen.getByRole('tab', { name: 'Tổng quan' }).getAttribute('aria-selected')).toBe('true');
    expect(within(sheet).getByText('Tiểu Mông')).toBeTruthy();
    expect(within(sheet).getByText(/Mười bảy tuổi/)).toBeTruthy();
    expect(within(profileContent()).queryByText('Chỉ số căn bản')).toBeNull();
    expect(within(profileContent()).queryByText('Hà Bá Tức Công')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Chỉ số' }));
    expect(within(sheet).getByText('600/600 HP')).toBeTruthy();
    expect(within(sheet).getByText('300/300 MP')).toBeTruthy();
    expect(within(sheet).getByText('Thân Pháp').closest('article')?.textContent).toContain('75');
    expect(within(sheet).getByText('Ngộ Tính').closest('article')?.textContent).toContain('65');
    expect(within(sheet).getByText('Đạo Đức')).toBeTruthy();
    expect(within(sheet).getByText('Tà Khí')).toBeTruthy();
    expect(within(sheet).getByText('3/3 AP')).toBeTruthy();
    expect(within(sheet).getByText('Văn tiền').closest('span')?.textContent).toContain('50');
    expect(within(sheet).getByRole('progressbar', { name: 'Khí huyết' })).toBeTruthy();
    expect(within(profileContent()).queryByText('Chỉ số căn bản')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Thiên phú' }));
    expect(within(sheet).getByText('Linh Mẫn Tinh Anh')).toBeTruthy();
    expect(within(profileContent()).queryByText('600/600 HP')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Tiểu sử' }));
    expect(within(sheet).getByRole('heading', { name: 'Tiểu sử' })).toBeTruthy();
    expect(within(sheet).getByText(/Tính cách/)).toBeTruthy();
    expect(within(profileContent()).queryByText('Linh Mẫn Tinh Anh')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Định hướng' }));
    expect(within(sheet).getByRole('heading', { name: 'Định hướng' })).toBeTruthy();
    expect(within(profileContent()).queryByText('Tiểu sử')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Võ học' }));
    expect(within(sheet).getByText('Hà Bá Tức Công')).toBeTruthy();
    expect(within(profileContent()).queryByText('Định hướng')).toBeNull();

    fireEvent.click(within(sheet).getByRole('button', { name: 'Đóng bảng' }));
    expect(screen.queryByRole('region', { name: 'Nhân vật' })).toBeNull();
  });

  it('switches directly between the character profile and the inventory panel', () => {
    render(<OpeningMapPage persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nhân vật' }));
    expect(screen.getByRole('region', { name: 'Nhân vật' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nhân vật' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Hành trang' }));
    expect(screen.queryByRole('region', { name: 'Nhân vật' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Hành trang' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hành trang' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('uses the Bà mẹ quê rest point to restore health, inner force, and daily action points', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = { ...progress.riverCampaign, actionPoints: 0, hp: 240, mp: 80, mainQuestActivated: false };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage persistPlayerPosition={false} />);

    fireEvent.click(document.querySelector('[data-rest-point]')!);

    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign)
      .toMatchObject({ actionPoints: 3, hp: 600, mp: 300, mainQuestActivated: true });
    expect(screen.getByRole('status').textContent).toContain('HP, MP và 3 AP đã hồi phục');
  });

  it('lets the player interact with the rainwater jar to complete the HP side quest', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = { ...progress.riverCampaign, hp: 240, mp: 100, motherAffinity: 50 };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage persistPlayerPosition={false} />);

    fireEvent.click(document.querySelector('[data-water-quest]')!);

    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign)
      .toMatchObject({ actionPoints: 2, hp: 240, maxHp: 600, waterItemCarried: true, waterQuestComplete: false });
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Bà mẹ quê' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
    fireEvent.click(screen.getByRole('button', { name: 'Giao gáo nước · +50 HP tối đa' }));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign)
      .toMatchObject({ actionPoints: 1, hp: 290, maxHp: 650, waterItemCarried: false, waterQuestComplete: true });
    expect(document.querySelector('[data-water-quest]')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('HP tối đa +50');
  });

  it('halves and displays the guard vision cone when the patrol map is owned at night', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = { ...progress.riverCampaign, patrolMap: true, timeMinutes: 900 };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage persistPlayerPosition={false} />);

    expect(document.querySelector('[data-npc-id="gate-guard"] .opening-map-npc__vision')?.getAttribute('data-vision-range')).toBe('120');
    expect(screen.getByText(/Bản đồ tuần tra giảm 50% tầm phát hiện/)).toBeTruthy();
    expect(document.querySelector('[data-patrol-vision-range]')?.textContent).toContain('Tầm nhìn tuần tra ban đêm: 120');
  });

  it('lets the player hand the caught fish to real village NPCs and replaces them with patrols after betrayal', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = {
      ...progress.riverCampaign,
      fishStock: 3,
      inventory: { ITEM_CA_COC_SONG_DAY: 3 },
    };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    render(<OpeningMapPage persistPlayerPosition={false} />);

    expect(document.querySelector('[data-npc-id="NPC_DAN_NONG_01"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trò chuyện với Bé Thảo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trò chuyện với Cậu Tùng' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trò chuyện với Bác Hòa' })).toBeTruthy();
    expect(document.querySelector('[data-npc-id="NPC_DAN_NONG_01"] [data-npc-artwork="thon-dan-tre"]')).toBeTruthy();
    expect(document.querySelector('[data-npc-id="NPC_DAN_NONG_02"] [data-npc-artwork="nong-dan-tre"]')).toBeTruthy();
    expect(document.querySelector('[data-npc-id="NPC_DAN_NONG_03"] [data-npc-artwork="nong-dan"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Trò chuyện với Bé Thảo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chia Cá Cóc Sông Đáy · 1 AP' }));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign)
      .toMatchObject({ fishStock: 2, taoHandoffs: ['NPC_DAN_NONG_01'] });

    cleanup();
    const betrayed = freshHistoryProgress();
    betrayed.riverCampaign = { ...betrayed.riverCampaign, villageBetrayed: true };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(betrayed));
    render(<OpeningMapPage persistPlayerPosition={false} />);
    expect(document.querySelector('[data-npc-id="NPC_DAN_NONG_01"]')).toBeNull();
    expect(document.querySelector('[data-npc-id="enemy-patrol-1"]')).toBeTruthy();
    expect(screen.getByText(/dân làng đã lánh nạn/i)).toBeTruthy();
  });

  it('focuses a preview without changing saved gameplay positions and reports damaged profiles', async () => {
    const originalPosition = JSON.stringify({ x: 2170, y: 1630 });
    const legacyPosition = JSON.stringify({ x: 1055, y: 475 });
    localStorage.setItem(POSITION_KEY, originalPosition);
    localStorage.setItem('opening-map-player-position', legacyPosition);
    localStorage.setItem(HISTORY_PROFILE_KEY, '{bad json');
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const focus = { x: 2160, y: 1660 };
    render(<OpeningMapPage embedded focusPoint={focus} persistPlayerPosition={false} />);
    expect(screen.getByRole('alert').textContent).toContain('Không đọc được hồ sơ nhân vật');
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    expect(player.getAttribute('data-player-x')).toBe(String(focus.x));
    expect(player.getAttribute('data-player-y')).toBe(String(focus.y));
    screen.getByRole('region', { name: 'Bản đồ khởi đầu' }).focus();
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => expect(Number(player.getAttribute('data-player-x'))).toBeGreaterThan(focus.x));
    fireEvent.keyUp(window, { key: 'd' });
    expect(localStorage.getItem(POSITION_KEY)).toBe(originalPosition);
    expect(localStorage.getItem('opening-map-player-position')).toBe(legacyPosition);
    expect(storage.mock.calls.some(([key]) => key === POSITION_KEY || key === 'opening-map-player-position')).toBe(false);
  });

  it('ignores positions saved for the old landscape and restores valid new-world positions', () => {
    const legacy = JSON.stringify({ x: 700, y: 640 });
    localStorage.setItem('opening-map-player-position-watercolor', legacy);
    const { unmount } = render(<OpeningMapPage />);
    expect(screen.getByRole('img', { name: 'Nhân vật chính' }).getAttribute('data-player-x')).toBe(String(OPENING_MAP_REST_POINT.x));
    expect(localStorage.getItem('opening-map-player-position-watercolor')).toBe(legacy);
    unmount();
    const saved = { x: 2170, y: 1630 };
    expect(isOpeningMapWalkable(saved)).toBe(true);
    localStorage.setItem(POSITION_KEY, JSON.stringify(saved));
    render(<OpeningMapPage />);
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    expect(player.getAttribute('data-player-x')).toBe(String(saved.x));
    expect(player.getAttribute('data-player-y')).toBe(String(saved.y));
  });

  it('places editor NPCs in native SVG world coordinates and rejects houses and water', () => {
    const onNpcPlace = vi.fn();
    render(<OpeningMapPage embedded overview placingNpc onNpcPlace={onNpcPlace} persistPlayerPosition={false} />);
    const art = screen.getByRole('img', { name: /tranh màu nước/ });
    vi.spyOn(art, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 4320, bottom: 3000, width: 4320, height: 3000, toJSON: () => ({}) });
    fireEvent.click(art, { clientX: SPAWN.x, clientY: SPAWN.y });
    expect(onNpcPlace).toHaveBeenLastCalledWith(SPAWN);
    fireEvent.click(art, { clientX: 1600, clientY: 1240 });
    fireEvent.click(art, { clientX: 3190, clientY: 1050 });
    expect(onNpcPlace).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert').textContent).toContain('tránh sông và nhà');
    const inverse = vi.fn(() => ({ inverse: true }));
    const matrixTransform = vi.fn(() => ({ x: 2180, y: 1640 }));
    Object.defineProperty(art, 'getScreenCTM', { configurable: true, value: () => ({ inverse }) });
    Object.defineProperty(art, 'createSVGPoint', { configurable: true, value: () => ({ x: 0, y: 0, matrixTransform }) });
    fireEvent.click(art, { clientX: 22, clientY: 37 });
    expect(inverse).toHaveBeenCalled();
    expect(matrixTransform).toHaveBeenCalledWith({ inverse: true });
    expect(onNpcPlace).toHaveBeenLastCalledWith({ x: 2180, y: 1640 });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('selects explicitly supplied editor NPCs without dialogue and omits hidden NPCs', () => {
    const npc = { ...DEFAULT_OPENING_MAP_NPCS[0], point: SPAWN };
    const hidden = { ...DEFAULT_OPENING_MAP_NPCS[1], point: SPAWN, hidden: true };
    const onNpcSelect = vi.fn();
    render(<OpeningMapPage embedded overview npcs={[npc, hidden]} selectedNpcId={npc.id} onNpcSelect={onNpcSelect} persistPlayerPosition={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hiện bản đồ nhỏ' }));
    const marker = screen.getByRole('button', { name: `Chọn ${npc.name}` });
    fireEvent.click(marker);
    expect(onNpcSelect).toHaveBeenCalledWith(npc.id);
    expect(marker.classList.contains('is-selected')).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('img', { name: hidden.name })).toBeNull();
    expect(document.querySelectorAll('.opening-map-minimap__npc-pin')).toHaveLength(1);
  });

  it('shows the delivery request and stops movement while its NPC dialogue is open', async () => {
    const npc = { ...DEFAULT_OPENING_MAP_NPCS[0], point: SPAWN };
    render(<OpeningMapPage npcs={[npc]} persistPlayerPosition={false} />);
    fireEvent.keyDown(window, { key: 'e' });
    const dialog = screen.getByRole('dialog', { name: npc.name });
    for (const content of [npc.alias, npc.locationLabel]) {
      expect(within(dialog).getByText(content)).toBeTruthy();
    }
    expect(within(dialog).queryByText(/GIAO HÀNG · Mang kiện hàng đến Giao ở Chợ Nhỏ/)).toBeNull();
    expect(within(dialog).getByText(/Chuyến hàng của làng bị Trưởng Đội Tuần Tra chặn lại/)).toBeTruthy();
    finishNpcDialogue();
    expect(within(dialog).getByText(/GIAO HÀNG · Mang kiện hàng đến Giao ở Chợ Nhỏ/)).toBeTruthy();
    const player = screen.getByRole('img', { name: 'Nhân vật chính' });
    const initialX = player.getAttribute('data-player-x');
    fireEvent.keyDown(window, { key: 'd' });
    await new Promise(resolve => window.setTimeout(resolve, 60));
    expect(player.getAttribute('data-player-x')).toBe(initialX);
    fireEvent.keyUp(window, { key: 'd' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `Trò chuyện với ${npc.name}` }));
    expect(screen.getByRole('dialog', { name: npc.name })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc trò chuyện' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục đi' }));
    fireEvent.keyDown(window, { key: 'd' });
    await waitFor(() => expect(Number(player.getAttribute('data-player-x'))).toBeGreaterThan(Number(initialX)));
    fireEvent.keyUp(window, { key: 'd' });
  });
});
