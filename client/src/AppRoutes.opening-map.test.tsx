import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { GameProvider } from './context/GameContext';
import { emptyHistoryCloudSave, HISTORY_OFFLINE_SAVE_KEY } from './services/historyCloud';
import { freshHistoryProfile, HISTORY_PROFILE_KEY } from './services/historyProfile';
import { freshHistoryProgress, HISTORY_PROGRESS_KEY } from './services/historyProgress';
import { OPENING_MAP_REST_POINT } from './game/openingMap';

afterEach(() => { cleanup(); localStorage.clear(); });

function mount(path: string | { pathname: string; state?: unknown }) {
  return render(<GameProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></GameProvider>);
}

describe('startup and opening map routes', () => {
  it('shows the initial title screen when there is no saved game', () => {
    mount('/');
    expect(screen.getByRole('navigation', { name: 'Menu chính' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chơi mới' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Bản đồ khởi đầu' })).toBeNull();
  });

  it.each(['/map', '/map/shop', '/map/character'])('keeps the opening map available at %s', path => {
    localStorage.setItem('character-designer-map-characters', JSON.stringify([{ id: 'trung-trac', mapId: 'hai-ba-trung', name: 'Trưng Trắc' }]));
    mount(path);
    expect(screen.getByRole('region', { name: 'Bản đồ khởi đầu' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Làng quê Việt Nam ven sông/ })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Nhân vật chính' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ẩn bản đồ nhỏ' })).toBeTruthy();
    expect(screen.getByLabelText('Bản đồ thu nhỏ')).toBeTruthy();
    expect(document.querySelector('image[href="/assets/maps/thon-que-watercolor.png"]')).toBeNull();
    expect(document.querySelectorAll('[data-npc-id]')).toHaveLength(23);
    expect(document.querySelector('.world-map')).toBeNull();
    expect(screen.queryByRole('button', { name: /Trưng Trắc/ })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Bản đồ thử' })).toBeNull();
  });

  it.each([
    ['righteous', 'Chương 1 · Lối vào Chính đạo'],
    ['shadow', 'Chương 1 · Lối vào Tà đạo'],
  ] as const)('opens the actual Chapter 1 map for the %s ending', (entry, label) => {
    mount({ pathname: '/chapter-1', state: { riverCampaignEntry: entry } });
    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Nhật ký sử/ })).toBeTruthy();
  });

  it('takes the selected campaign ending to the real Chapter 1 world map', () => {
    const progress = freshHistoryProgress();
    progress.riverCampaign = {
      ...progress.riverCampaign,
      bossDefeated: true,
      worldMapUnlocked: true,
      worldMapEntry: 'shadow',
    };
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(progress));
    mount('/map');

    fireEvent.click(screen.getByRole('button', { name: /Bến Nước · Mở hành trình/ }));
    fireEvent.click(screen.getByRole('button', { name: /World Map đã mở · xem bản đồ/ }));

    expect(screen.getByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    expect(screen.getByText('Chương 1 · Lối vào Tà đạo')).toBeTruthy();
  });

  it('starts a new game from the beginning when there is no saved progress', () => {
    localStorage.setItem('pho-xom-started', 'yes');
    localStorage.setItem('xnl-game-mode', 'offline');
    mount('/');
    expect(screen.getByRole('navigation', { name: 'Menu chính' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    expect(screen.getByRole('heading', { name: /Tiểu Mông · Thiếu niên Lạc tướng/ })).toBeTruthy();
  });

  it('enters the latest opening map after confirming a new character', () => {
    localStorage.setItem('opening-map-player-position-landscape-v2', JSON.stringify({ x: 500, y: 500 }));
    localStorage.setItem('opening-map-delivery-quest-v1', JSON.stringify({ stage: 'clue-revealed' }));
    mount('/');
    fireEvent.click(screen.getByRole('button', { name: 'Chơi mới' }));
    fireEvent.click(screen.getByRole('button', { name: /Cơ Biến Vô Song/ }));
    fireEvent.change(screen.getByLabelText(/Tên người chơi/), { target: { value: 'Tư An' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));

    expect(screen.getByRole('region', { name: 'Bản đồ khởi đầu' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Nhân vật chính' })).toBeTruthy();
    expect(document.querySelector('.opening-map-player')?.getAttribute('data-player-x')).toBe(String(OPENING_MAP_REST_POINT.x));
    expect(document.querySelector('.opening-map-player')?.getAttribute('data-player-y')).toBe(String(OPENING_MAP_REST_POINT.y));
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Tư An');
    expect(JSON.parse(localStorage.getItem('opening-map-player-position-landscape-v2')!)).toEqual(OPENING_MAP_REST_POINT);
    expect(JSON.parse(localStorage.getItem(HISTORY_PROGRESS_KEY)!).riverCampaign.mainQuestActivated).toBe(true);
    expect(localStorage.getItem('opening-map-delivery-quest-v1')).toBeNull();
  });

  it('opens the initial screen first and lets a saved journey continue from home', () => {
    localStorage.setItem('xnl-game-mode', 'offline');
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify({ ...freshHistoryProfile(), displayName: 'Tiểu Mông' }));
    localStorage.setItem(HISTORY_OFFLINE_SAVE_KEY, JSON.stringify(emptyHistoryCloudSave()));
    mount('/');
    expect(screen.getByRole('navigation', { name: 'Menu chính' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quê nhà' }));
    expect(screen.getByRole('heading', { name: 'Chào mừng về nhà, Tiểu Mông!' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tiếp tục hành trình →' })).toBeTruthy();
  });
});
