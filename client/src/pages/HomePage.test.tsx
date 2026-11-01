import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

const gameStore = vi.hoisted(() => ({
  gameState: null,
  isLoading: true,
  error: 'Network Error',
  selectedCustomer: null,
  selectedPho: null,
  selectedToppings: [] as string[],
  character: { displayName: '', avatar: '🧑‍🍳' },
  soundEnabled: true,
  loadGame: vi.fn(),
  resetGame: vi.fn(),
  selectCustomer: vi.fn(),
  selectPho: vi.fn(),
  toggleTopping: vi.fn(),
  serveCustomer: vi.fn(),
  startDay: vi.fn(),
  showNotification: vi.fn(),
  saveCharacter: vi.fn(),
  setSoundEnabled: vi.fn(),
}));

vi.mock('../context/GameContext', () => ({
  useGameStore: () => gameStore,
}));

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  gameStore.resetGame.mockReset().mockResolvedValue(undefined);
});

describe('HomePage', () => {
  it('shows the four-option title menu before requiring game data from the server', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Xóm Nhà Lá/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Chơi mới/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sao lưu/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Hệ thống/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Thoát/ })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Không tải được trò chơi' })).toBeNull();
  });

  it('opens system preferences from the title menu', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Hệ thống/ }));
    expect(screen.getByRole('heading', { name: 'Cài đặt hệ thống' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '← Menu chính' })).toBeTruthy();
  });
});

it('resets the active game before opening a blank new character', async () => {
  gameStore.character.displayName = 'Tên cũ';
  localStorage.setItem('pho-xom-world-position', '{"x":900,"y":900}');
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Chơi mới/ }));
  await waitFor(() => expect(screen.getByLabelText(/Tên người chơi/)).toBeTruthy());
  expect(gameStore.resetGame).toHaveBeenCalledOnce();
  expect((screen.getByLabelText(/Tên người chơi/) as HTMLInputElement).value).toBe('');
  expect(localStorage.getItem('pho-xom-world-position')).toBeNull();
  expect(localStorage.getItem('pho-xom-started')).toBeNull();
});

it('stays at the menu when starting a new game fails', async () => {
  gameStore.resetGame.mockRejectedValueOnce(new Error('Offline'));
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Chơi mới/ }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  expect(screen.queryByLabelText(/Tên người chơi/)).toBeNull();
});