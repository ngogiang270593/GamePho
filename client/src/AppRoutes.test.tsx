import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { GameProvider } from './context/GameContext';
import { HISTORY_HEROES } from './game/suViet';
import { startingCharacterImageAsset } from './game/startingCharacters';
import { freshHistoryProgress, HISTORY_PROGRESS_KEY } from './services/historyProgress';
import { freshHistoryProfile, HISTORY_PROFILE_KEY } from './services/historyProfile';
import { HISTORY_SAVES_KEY } from './services/historySaves';
import { historyMapPositionKey } from './game/suVietMap';
import { OPENING_MAP_REST_POINT } from './game/openingMap';

// Route assertions use the built-in character catalog, independent of imports.
vi.mock('./game/characterSpriteSheets.json', () => ({ default: {} }));

// Keep this legacy gameplay suite focused on HistoryGamePage. The opening-map
// route is exercised against the real map in AppRoutes.opening-map.test.tsx.
vi.mock('./pages/OpeningMapPage', async () => {
  const { HistoryGamePage } = await import('./pages/HistoryGamePage');
  function OpeningMapRouteMock() {
    return <HistoryGamePage />;
  }
  return { OpeningMapPage: OpeningMapRouteMock };
});

vi.mock('./pages/CardRoomPage', () => ({
  CardRoomPage: ({ campaignMode, returnPath, onMatchStarted, onMatchFinished, onReserveBet }: { campaignMode: boolean; returnPath: string; onMatchStarted: (matchId: number) => void; onMatchFinished: (result: { matchId: number; round: number; outcome: 'win' | 'loss' | 'draw' }) => void; onReserveBet?: (bet: number, useTicket: boolean, previousMatchId: number | null) => boolean }) => (
    <section aria-label="UNO"><output>{String(campaignMode)}</output><output>{returnPath}</output><Link to={returnPath}>Về bản đồ</Link>
      <button onClick={() => onReserveBet?.(100, false, null)}>Đặt cược thử</button>
      <button onClick={() => onMatchStarted(99)}>Bắt đầu ván thử</button>
      <button onClick={() => onMatchFinished({ matchId: 99, round: 1, outcome: 'win' })}>Kết thúc ván thử</button>
    </section>
  ),
}));

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

function Path() { return <output data-testid="path">{useLocation().pathname}</output>; }
function mount(path = '/') {
  return render(<GameProvider><MemoryRouter initialEntries={[path]}><AppRoutes /><Path /></MemoryRouter></GameProvider>);
}

function startGame(promoCode?: string) {
  if (localStorage.getItem(HISTORY_PROGRESS_KEY) || localStorage.getItem(HISTORY_PROFILE_KEY)) {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
  chooseStartingCharacter();
  fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Út Mận' } });
  if (promoCode) fireEvent.change(screen.getByLabelText(/Nhập mã \(không bắt buộc\)/), { target: { value: promoCode } });
  fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));
}

function chooseStartingCharacter() {
  fireEvent.click(screen.getByRole('button', { name: /Cơ Biến Vô Song/ }));
}

function chooseMapPlace(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: /Mở sơ đồ/ }));
  fireEvent.click(within(screen.getByLabelText('Chọn địa điểm')).getByRole('button', { name }));
}

describe('Sử Việt routes', () => {
  it('starts the river campaign with Tiểu Mông awake at the dock', () => {
    mount();
    startGame();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Tiện ích làng quê' })).getByRole('button', { name: /Bến nước/ }));
    expect(screen.getByRole('heading', { name: 'Bến nước · việc làng mỗi ngày' })).toBeTruthy();
    const mother = screen.getByRole('heading', { name: /Bà Mẹ Quê/ }).closest('article')!;
    expect(within(mother).getByRole('button', { name: /Thề bảo vệ xóm làng/ })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign)
      .toMatchObject({ mainQuestActivated: true, motherChoice: null, actionPoints: 3 });
  });

  it('opens the river-and-spirit skill tree from the map utilities', () => {
    mount();
    startGame();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Tiện ích làng quê' })).getByRole('button', { name: /Võ công/ }));
    expect(screen.getByRole('heading', { name: 'Cây kỹ năng & bộ chiêu thức' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Hà Bá Tức Công' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cá Cóc Phún Thủy' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Hà Bá Cuốn Lưu' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain('chưa được áp dụng vào giao chiến');
    fireEvent.click(screen.getByRole('button', { name: '← Về bản đồ' }));
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
  });

  it('persists the tap-to-move setting from the map settings screen',()=>{
    mount();startGame();
    chooseMapPlace(/Cài đặt.*Góc nghỉ chân/);
    const setting=screen.getByRole('checkbox',{name:/Chạm để di chuyển/}) as HTMLInputElement;
    expect(setting.checked).toBe(true);
    fireEvent.click(setting);
    expect(localStorage.getItem('xom-nha-la-tap-to-move')).toBe('off');
    fireEvent.click(screen.getByRole('button',{name:/Quay lại/}));
    chooseMapPlace(/Cài đặt.*Góc nghỉ chân/);
    expect((screen.getByRole('checkbox',{name:/Chạm để di chuyển/}) as HTMLInputElement).checked).toBe(false);
  });
  it('confirms virtual shop purchases, filters items, equips and returns to the same map', () => {
    mount();startGame('CODEX500');
    fireEvent.click(within(screen.getByRole('navigation', {name:'Tiện ích làng quê'})).getByRole('button',{name:/Cửa hàng/}));
    const shop=screen.getByRole('dialog',{name:'Cửa hàng chú Tư'});
    fireEvent.change(within(shop).getByLabelText('Tìm sản phẩm'),{target:{value:'Tóc đuôi ngựa'}});
    fireEvent.click(within(shop).getByRole('button',{name:'Mua · Tóc đuôi ngựa'}));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(10000);
    fireEvent.click(within(shop).getByRole('button',{name:'Hủy'}));
    expect(within(shop).queryByRole('alertdialog')).toBeNull();
    fireEvent.click(within(shop).getByRole('button',{name:'Mua · Tóc đuôi ngựa'}));
    fireEvent.click(within(shop).getByRole('button',{name:'Xác nhận mua'}));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(9975);
    fireEvent.click(within(shop).getByRole('button',{name:'Trang bị · Tóc đuôi ngựa'}));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).customization.equipped.hair).toBe('hair-ponytail');
    fireEvent.click(within(shop).getByRole('button',{name:'Tháo ra · Tóc đuôi ngựa'}));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).customization.equipped.hair).toBeUndefined();
    fireEvent.change(within(shop).getByLabelText('Danh mục'),{target:{value:'mount'}});
    expect(within(shop).getByText(/Không có sản phẩm phù hợp/)).toBeTruthy();
    fireEvent.click(within(shop).getByRole('button',{name:'Trở lại map'}));
    expect(screen.getByRole('region',{name:/Bản đồ Mê Linh/})).toBeTruthy();
  });

  it('reports insufficient coins and awards a completed village task once', () => {
    mount();startGame();
    const menu=()=>within(screen.getByRole('navigation',{name:'Tiện ích làng quê'}));
    fireEvent.click(menu().getByRole('button',{name:/Cửa hàng/}));
    fireEvent.change(screen.getByLabelText('Tìm sản phẩm'),{target:{value:'Thóc quê'}});
    fireEvent.click(screen.getByRole('button',{name:'Mua · Thóc quê'}));
    expect(screen.getByRole('status',{name:'Thông báo làng quê'}).textContent).toContain('Không đủ xu');
    fireEvent.click(screen.getByRole('button',{name:'Trở lại map'}));
    fireEvent.click(menu().getByRole('button',{name:/Nhiệm vụ/}));
    const task=screen.getByText('Đố vui dưới cây đa').closest('article')!;
    fireEvent.click(within(task).getByRole('button',{name:'Nhận nhiệm vụ'}));
    fireEvent.click(within(task).getByRole('button',{name:'Cây chuối'}));
    fireEvent.click(within(task).getByRole('button',{name:'Nhận thưởng · Đố vui dưới cây đa'}));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!)).toMatchObject({gold:30,fame:5,freeUnoTickets:1});
    expect(within(task).queryByRole('button',{name:/Nhận thưởng/})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Trở lại map'}));
    fireEvent.click(menu().getByRole('button',{name:/Nhiệm vụ/}));
    expect(screen.getByRole('button',{name:/Xuất hiện lại sau \d+s/}).hasAttribute('disabled')).toBe(true);
  });
  it('shows install instructions for eight seconds and restarts the timer on another click', () => {
    vi.useFakeTimers();
    try {
      mount();
      const install = screen.getByRole('button', { name: 'Cài đặt trên Android và iOS' });
      fireEvent.click(install);
      expect(screen.getByRole('status', { name: 'Hướng dẫn cài đặt' }).textContent).toContain('Android:');
      expect(screen.getByRole('status', { name: 'Hướng dẫn cài đặt' }).textContent).toContain('iPhone / iPad:');
      act(() => vi.advanceTimersByTime(6000));
      fireEvent.click(install);
      act(() => vi.advanceTimersByTime(6000));
      expect(screen.getByRole('status', { name: 'Hướng dẫn cài đặt' })).toBeTruthy();
      act(() => vi.advanceTimersByTime(2000));
      expect(screen.queryByRole('status', { name: 'Hướng dẫn cài đặt' })).toBeNull();
    } finally { vi.useRealTimers(); }
  });
  it('opens the new title screen, creates a 2D character and enters the village map', () => {
    mount();
    expect(screen.getByRole('heading', { name: /Xóm Nhà Lá/ })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Menu chính' }).querySelectorAll('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Chơi mới' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Quê nhà' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thế giới' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hệ thống' })).toBeTruthy();
    expect(screen.queryByText(/Tạo nhân vật, khám phá xóm làng/)).toBeNull();
    expect(screen.queryByText(/BÉ VUI HỌC SỬ/)).toBeNull();
    startGame();
    expect(screen.getByText(/Chặng 1\/5 · Mê Linh · năm 40/)).toBeTruthy();
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Út Mận');
    expect(screen.getByRole('button', { name: /Trưng Trắc · Dẫn dắt mạch truyện · câu hỏi lịch sử/ })).toBeTruthy();
    expect(localStorage.getItem('pho-xom-character-name')).toBeNull();
    expect(localStorage.getItem('pho-xom-started')).toBeNull();

    chooseMapPlace(/Lưu hành trình.*Nhà lưu niệm/);
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào ô 1' }));
    expect(JSON.parse(localStorage.getItem(HISTORY_SAVES_KEY)!).length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Khôi phục ô 1' }));
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();

    chooseMapPlace(/Cài đặt.*Góc nghỉ chân/);
    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: /Âm thanh/ })).toBeTruthy();
  });

  it('redeems CODEX500 for a new character and saves 10,000 coins and fame', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    chooseStartingCharacter();
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Út Mận' } });
    fireEvent.change(screen.getByLabelText(/Nhập mã \(không bắt buộc\)/), { target: { value: 'CODEX500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));

    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!)).toMatchObject({
      gold: 10000,
      fame: 10000,
      completedHistoryMissions: ['promo-codex500'],
    });
  });

  it('applies the development-only test code for a quick game start', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    chooseStartingCharacter();
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Út Mận' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nhập mã thử game' }), { target: { value: 'TEST-MELINH' } });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(screen.getByRole('region', { name: 'Mã thử game' }).querySelector('[role="status"]')?.textContent)
      .toContain('10.000 xu và 10.000 danh vọng');
    fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));

    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!)).toMatchObject({
      gold: 10000,
      fame: 10000,
      completedHistoryMissions: [],
    });
    expect(screen.getByTestId('path').textContent).toBe('/map');
  });

  it('opens the latest Mê Linh map from the title-screen test shortcut', () => {
    localStorage.setItem('opening-map-player-position-landscape-v2', JSON.stringify({ x: 500, y: 500 }));
    localStorage.setItem('opening-map-delivery-quest-v1', JSON.stringify({ stage: 'clue-revealed' }));
    mount();
    fireEvent.click(screen.getByRole('button', { name: /TEST-MELINH · Vào map test/ }));

    expect(screen.getByTestId('path').textContent).toBe('/map');
    expect(JSON.parse(localStorage.getItem('opening-map-player-position-landscape-v2')!)).toEqual(OPENING_MAP_REST_POINT);
    expect(localStorage.getItem('opening-map-delivery-quest-v1')).toBeNull();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!)).toMatchObject({
      gold: 10000,
      fame: 10000,
    });
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!)).toMatchObject({
      displayName: 'Tiểu Mông',
      startingCharacterId: 'forest-keeper',
    });
  });

  it('starts a new journey without deleting the current journey until character creation completes', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify({
      ...freshHistoryProgress(),
      gold: 750,
      fame: 100,
      correctQuestions: ['hbt-1'],
    }));
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({ ...freshHistoryProfile(), displayName: 'Người cũ' }));
    localStorage.setItem(historyMapPositionKey('hai-ba-trung'), '{"x":600,"y":500}');
    mount();

    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    fireEvent.click(screen.getByRole('button', { name: /Quay lại/i }));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(750);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Người cũ');
    expect(localStorage.getItem(historyMapPositionKey('hai-ba-trung'))).toBe('{"x":600,"y":500}');

    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    chooseStartingCharacter();
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Người mới' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));

    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!)).toMatchObject({
      gold: 0,
      fame: 0,
      correctQuestions: [],
    });
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Người mới');
    expect(localStorage.getItem(historyMapPositionKey('hai-ba-trung'))).toBeNull();
    expect(JSON.parse(localStorage.getItem('opening-map-player-position-landscape-v2')!)).toEqual(OPENING_MAP_REST_POINT);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign.mainQuestActivated).toBe(true);
  });

  it('does not replace offline data when the player declines new journey confirmation', () => {
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify({ ...freshHistoryProgress(), gold: 750 }));
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({ ...freshHistoryProfile(), displayName: 'Người cũ' }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    mount();

    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));

    expect(confirm).toHaveBeenCalledWith('Bạn có muốn tạo hành trình mới không? Dữ liệu offline hiện tại sẽ được thay thế.');
    expect(screen.getByRole('heading', { name: 'Xóm Nhà Lá' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(750);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Người cũ');
  });

  it('keeps the existing title menu and opens offline home, online notice and system settings', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Quê nhà' }));
    expect(screen.getByText('Chưa có hành trình offline. Hãy chọn Chơi mới để bắt đầu.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Xóm Nhà Lá/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Thế giới' }));
    expect(screen.getByText(/Thế giới cần bản Online/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Xóm Nhà Lá/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hệ thống' }));
    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '← Quay lại' })).toBeTruthy();
  });

  it('shows offline save details and continues the saved journey without removing other menu items', () => {
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify({
      ...freshHistoryProgress(), gold: 320, fame: 25, completedHistoryMaps: ['hai-ba-trung'],
    }));
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({ ...freshHistoryProfile(), displayName: 'Út Mận' }));
    localStorage.setItem('su-viet-hanh-trinh-saved-at', '2026-10-28T12:00:00.000Z');
    mount();

    fireEvent.click(screen.getByRole('button', { name: 'Quê nhà' }));
    expect(screen.getByRole('heading', { name: /Chào mừng về nhà, Út Mận/ })).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
    expect(screen.getByText(/320 · 25/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục hành trình/ }));
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    expect(localStorage.getItem('xnl-game-mode')).toBe('offline');
  });

  it('still opens settings and save data from the in-game settings house', () => {
    mount();
    startGame();
    chooseMapPlace(/Cài đặt.*Góc nghỉ chân/);
    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeTruthy();
    expect(screen.getByText('Tiếng Việt · ngôn ngữ hiện được hỗ trợ')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mở dữ liệu' }));
    expect(screen.getByRole('heading', { name: 'Sao lưu hành trình' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '← Cài đặt' }));
    expect(screen.getByRole('heading', { name: 'Cài đặt' })).toBeTruthy();
  });

  it('opens the village world after choosing to start a new game', () => {
    mount();
    startGame();
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
  });

  it('uses the forest keeper as the only playable starting character', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    expect(screen.getByRole('heading', { name: /Tiểu Mông · Thiếu niên Lạc tướng/ })).toBeTruthy();
    expect(screen.getByText(/Quen sông nước, cậu dùng dao găm/)).toBeTruthy();
    expect(screen.queryByText(/Người con của đồng ruộng|Người học việc của làng/)).toBeNull();
    expect(screen.getByRole('img', { name: /Nhân vật nam đang đi bộ/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Nam' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nữ' })).toBeNull();
    expect(screen.getByText('Tiểu sử')).toBeTruthy();
    expect(screen.queryByText(/Người đi rừng/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Cơ Biến Vô Song/ }));
    expect(screen.queryByText(/IMAGE TO VIDEO|Tạo animation từ ảnh/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Tư An' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));

    const profile = JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!);
    expect(profile).toMatchObject({
      displayName: 'Tư An',
      appearance: { gender: 'male', outfit: 'forest' },
      startingCharacterId: 'forest-keeper',
      startingCharacterImage: startingCharacterImageAsset('forest-keeper', 'male'),
    });
    expect(profile).not.toHaveProperty('startingSkills');
    expect(profile).not.toHaveProperty('developmentPath');
    expect(profile.customization.inventory.defaultItems).toContain('back-basket');
    expect(profile.customization.inventory.ownedItems).toContain('back-basket');
    expect(profile.customization.inventory.ownedItems).not.toContain('back-fabric');
    expect(profile.customization.inventory.purchasedItems).toEqual([]);
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    expect(screen.getByTestId('world-player').querySelector('.player-sprite')?.getAttribute('data-starting-character'))
      .toBe('forest-keeper');
    expect(screen.getByTestId('world-player').querySelector('.player-sprite')?.classList.contains('character-male'))
      .toBe(true);

    chooseMapPlace(/Thoát game.*Cổng về nhà/);
    fireEvent.click(screen.getByRole('button', { name: 'Quê nhà' }));
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục hành trình/ }));
    const restoredSprite = screen.getByTestId('world-player').querySelector('.player-sprite');
    expect(restoredSprite?.getAttribute('data-starting-character')).toBe('forest-keeper');
    expect(restoredSprite?.classList.contains('character-male')).toBe(true);
  });

  it('opens collection, achievements and character setup through their map houses', () => {
    mount();
    startGame();

    chooseMapPlace(/Bộ sưu tập.*Nhà sưu tầm/);
    expect(screen.getByRole('heading', { name: 'Bộ sưu tập' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Bản đồ/ }));

    chooseMapPlace(/Danh vọng & thành tích.*Đình danh vọng/);
    expect(screen.getByRole('heading', { name: 'Thành tích & danh vọng' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Bản đồ/ }));

    chooseMapPlace(/Nhân vật & trang phục.*Tiệm may xóm/);
    expect(screen.getByRole('heading', { name: 'Nhân vật' })).toBeTruthy();
  });

  it('saves purchased wardrobe items and currency during a new journey', () => {
    mount();
    startGame('CODEX500');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Tiện ích làng quê' })).getByRole('button', { name: /Cửa hàng/ }));
    const shop = screen.getByRole('dialog', { name: 'Cửa hàng chú Tư' });
    fireEvent.change(within(shop).getByLabelText('Tìm sản phẩm'), { target: { value: 'Tóc đuôi ngựa' } });
    fireEvent.click(within(shop).getByRole('button', { name: 'Mua · Tóc đuôi ngựa' }));
    fireEvent.click(within(shop).getByRole('button', { name: 'Xác nhận mua' }));

    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(9975);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).customization).toMatchObject({
      inventory: {
        ownedItems: expect.arrayContaining(['hair-ponytail']),
        purchasedItems: expect.arrayContaining(['hair-ponytail']),
      },
    });
  });

  it('opens the character room and restores the forest keeper equipment', () => {
    mount();
    startGame();
    fireEvent.click(screen.getByRole('button', { name: 'Mở Nhân vật' }));
    expect(screen.getByRole('heading', { name: 'Nhân vật' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Túi đồ/ })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Ô trang bị' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Túi đồ/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Tóc/ }));
    expect(within(screen.getByRole('tabpanel')).getByRole('button', { name: /Tóc húi gọn/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Lưu nhân vật/ }));
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mở Nhân vật' }));
    expect(screen.getByRole('tab', { name: /Túi đồ/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Tóc/ }));
    expect(within(screen.getByRole('tabpanel')).getByRole('button', { name: /Tóc húi gọn/ })).toBeTruthy();
  });

  it('opens the history journal from the map and explains progress and sources', () => {
    mount();
    startGame();
    fireEvent.click(screen.getByRole('button', { name: /Nhật ký sử/ }));
    expect(screen.getByRole('heading', { name: 'Nhiệm vụ lịch sử' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tiến trình bản đồ' })).toBeTruthy();
    expect(screen.getByText(/0\/18 nhiệm vụ chính/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Nguồn tham khảo' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Hai Bà Trưng' }).getAttribute('href')).toContain('britannica.com');
  });

  it('accepts a historical mission and completes it at its marked map location', () => {
    mount();
    startGame();
    fireEvent.click(screen.getByRole('button', { name: /Nhật ký sử/ }));
    const missionCard = screen.getByRole('heading', { name: 'Qua cổng làng Mê Linh' }).closest('article')!;
    fireEvent.click(within(missionCard).getByRole('button', { name: 'Nhận nhiệm vụ' }));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).activeHistoryMissionId).toBe('hai-ba-trung:main:1');

    chooseMapPlace(/Nghe giới thiệu vùng đất.*ĐỀN TƯỞNG NIỆM/);
    fireEvent.click(screen.getByRole('button', { name: /Nghe giới thiệu vùng đất/ }));

    const saved = JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!);
    expect(saved.completedHistoryMissions).toContain('hai-ba-trung:main:1');
    expect(saved.activeHistoryMissionId).toBeNull();
    expect(saved.fame).toBe(20);
  });

  it('opens a map-specific NPC question and rewards a correct answer once', () => {
    mount();
    startGame();
    chooseMapPlace(/Gặp Trưng Nhị.*Trưng Nhị/);
    fireEvent.click(screen.getByRole('button', { name: /Gặp Trưng Nhị/ }));
    expect(screen.getByRole('heading', { name: 'Trưng Nhị' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'ATrưng Nhị' }));
    expect(screen.getByText(/\+10 danh vọng/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).fame).toBe(10);
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục khám phá/ }));

    chooseMapPlace(/Gặp Trưng Nhị.*Trưng Nhị/);
    fireEvent.click(screen.getByRole('button', { name: /Gặp Trưng Nhị/ }));
    fireEvent.click(screen.getByRole('button', { name: 'ATrưng Nhị' }));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).fame).toBe(10);
  });

  it('keeps opening-map links available and routes UNO through the history game', () => {
    mount('/map/shop');
    expect(screen.getByTestId('path').textContent).toBe('/map/shop');
    cleanup();
    mount('/uno');
    expect(screen.getByRole('region', { name: 'UNO' })).toBeTruthy();
    expect(screen.getByText('true')).toBeTruthy();
    expect(screen.getByText('/')).toBeTruthy();
  });

  it('keeps auto-saved history data on exit while preserving manual save slots', () => {
    mount();
    startGame();
    chooseMapPlace(/Lưu hành trình.*Nhà lưu niệm/);
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào ô 1' }));
    fireEvent.click(screen.getByRole('button', { name: /Bản đồ/ }));
    localStorage.setItem(historyMapPositionKey('hai-ba-trung'), '{"x":600,"y":500}');

    chooseMapPlace(/Thoát game.*Cổng về nhà/);

    expect(screen.getByRole('heading', { name: /Xóm Nhà Lá/ })).toBeTruthy();
    expect(localStorage.getItem(HISTORY_PROGRESS_KEY)).not.toBeNull();
    expect(localStorage.getItem(HISTORY_PROFILE_KEY)).not.toBeNull();
    expect(localStorage.getItem(historyMapPositionKey('hai-ba-trung'))).toBe('{"x":600,"y":500}');
    expect(JSON.parse(localStorage.getItem(HISTORY_SAVES_KEY)!).length).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Quê nhà' }));
    expect(screen.getByRole('heading', { name: /Chào mừng về nhà, Út Mận/ })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_SAVES_KEY)!).length).toBe(1);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Út Mận');
  });

  it('keeps the auto-saved journey when the browser page is reloaded or closed', () => {
    mount();
    startGame();
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(freshHistoryProgress()));
    expect(localStorage.getItem(HISTORY_PROGRESS_KEY)).not.toBeNull();

    fireEvent(window, new Event('pagehide'));

    expect(localStorage.getItem(HISTORY_PROGRESS_KEY)).not.toBeNull();
    expect(localStorage.getItem(HISTORY_PROFILE_KEY)).not.toBeNull();
  });

  it('keeps the next map gateway locked until the required fame is earned', () => {
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(freshHistoryProgress()));
    mount();
    startGame();
    chooseMapPlace(/Lối sang Sông Bạch Đằng/);
    const lockedGate = screen.getByRole('button', { name: /Cần 500 danh vọng/ });
    expect((lockedGate as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Trở lại map' }));
    chooseMapPlace(/Các bản đồ lịch sử.*Nhà bản đồ/);
    expect(screen.getAllByRole('button', { name: /Hoàn thành nhiệm vụ và thắng thử thách/ })
      .every(button => (button as HTMLButtonElement).disabled)).toBe(true);
  });

  it('keeps saved history data when currently unavailable title-menu options are selected', () => {
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify({ ...freshHistoryProgress(), fame: 100 }));
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({ ...freshHistoryProfile(), displayName: 'Út Mận' }));
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Thế giới' }));
    expect(screen.getByText(/Thế giới cần bản Online/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).fame).toBe(100);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Út Mận');
  });

  it('completes the meet, answer check and map return loop without auto-opening UNO', () => {
    mount();
    startGame();
    chooseMapPlace(/Hai Bà Trưng · Gặp gỡ xóm làng/);
    fireEvent.click(screen.getByRole('button', { name: /Gặp Hai Bà Trưng/ }));
    fireEvent.click(screen.getByRole('button', { name: /Nghe chuyện rồi trả lời/ }));
    const displayedQuestion = screen.getByRole('heading', { level: 2 }).textContent;
    const question = HISTORY_HEROES[0].questions.find(item => item.question === displayedQuestion)!;
    fireEvent.click(screen.getByText(question.answers[question.correct]).closest('button')!);
    expect(screen.getByText('Chính xác! Giỏi quá!')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'UNO' })).toBeNull();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!)).not.toHaveProperty('startingSkills');
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục khám phá/ }));
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    const saved = JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!);
    expect(saved.gold).toBeGreaterThanOrEqual(0);
    expect(saved.fame).toBeGreaterThan(0);
  });

  it('keeps an optional wager separate from question answers and offline practice', () => {
    mount();
    startGame('CODEX500');
    chooseMapPlace(/Chơi UNO.*Quán nước/);
    expect(screen.getByRole('heading', { name: 'Khu Giải trí' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Thiết lập luyện tập/ }));
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu luyện tập/ }));
    expect(screen.getByRole('region', { name: 'UNO' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).currentMatch).toBeNull();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).gold).toBe(10000);
  });

  it('shows a claimable history mission reward and keeps the player on the map after a correct answer', () => {
    mount();
    startGame();
    const hero = HISTORY_HEROES[0];
    chooseMapPlace(/Hai Bà Trưng · Gặp gỡ xóm làng/);
    fireEvent.click(screen.getByRole('button', { name: /Gặp Hai Bà Trưng/ }));
    fireEvent.click(screen.getByRole('button', { name: /Nghe chuyện rồi trả lời/ }));
    const question = screen.getByRole('heading', { level: 2 }).textContent;
    const item = hero.questions.find(entry => entry.question === question)!;
    fireEvent.click(screen.getByText(item.answers[item.correct]).closest('button')!);

    expect(screen.getByText('Chính xác! Giỏi quá!')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'UNO' })).toBeNull();
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).fame).toBeGreaterThan(0);
  });

  it('opens the entertainment hub and starts free offline training from the tea house', () => {
    mount();
    startGame();
    chooseMapPlace(/Chơi UNO.*Quán nước/);
    expect(screen.getByRole('heading', { name: 'Khu Giải trí' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Thử thách NPC chính' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Thiết lập luyện tập/ }));
    expect(screen.getByRole('heading', { name: 'Chọn bạn cùng bàn' })).toBeTruthy();
    expect(screen.getByLabelText('Số đối thủ')).toBeTruthy();
    expect(screen.getByLabelText('Độ khó')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Bắt đầu luyện tập/ }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu luyện tập/ }));
    expect(screen.getByRole('region', { name: 'UNO' })).toBeTruthy();
    expect(screen.getByText('true')).toBeTruthy();
    expect(screen.getByTestId('path').textContent).toBe('/uno');
    const before = JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ván thử' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc ván thử' }));
    const after = JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!);
    expect(after.fame).toBe(before.fame);
    expect(after.completedHistoryMissions).toEqual(before.completedHistoryMissions);
    expect(after.gold).toBe(before.gold + 5);
  });

  it('shows a non-functional multiplayer preview without opening a room', () => {
    mount();
    startGame();
    chooseMapPlace(/Chơi UNO.*Quán nước/);
    fireEvent.click(screen.getByRole('button', { name: /Xem giao diện mẫu/ }));
    expect(screen.getByRole('heading', { name: /Tìm trận/ })).toBeTruthy();
    expect(screen.getByText('Tính năng đấu cùng người chơi khác đang được phát triển.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sẵn sàng' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('path').textContent).toBe('/map');
  });
});
