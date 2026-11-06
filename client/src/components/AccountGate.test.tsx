import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { GameProvider } from '../context/GameContext';

const mocks = vi.hoisted(() => ({ onlineRequest: vi.fn() }));
vi.mock('../services/gameMode', () => ({ onlineGame: true, offlineGame: false }));
vi.mock('../services/online/account', () => ({
  onlineRequest: mocks.onlineRequest,
  applyAccount: vi.fn(),
  profileKeys: [],
}));

import { AccountGate } from './AccountGate';
import { HistoryGamePage } from '../pages/HistoryGamePage';
import { freshHistoryProgress, HISTORY_PROGRESS_KEY } from '../services/historyProgress';
import { freshHistoryProfile, HISTORY_PROFILE_KEY } from '../services/historyProfile';
import { createHistoryCloudSave, HISTORY_OFFLINE_SAVE_KEY } from '../services/historyCloud';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AccountGate', () => {
  it('opens login and registration from the initial world menu when no session exists', async () => {
    mocks.onlineRequest.mockRejectedValue(new Error('Hãy đăng nhập để về xóm.'));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AccountGate>
          <HistoryGamePage />
        </AccountGate>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Thế giới' })).toBeTruthy());
    expect(screen.queryByRole('button', { name: /Đăng nhập · Về xóm/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thế giới' }));
    expect(screen.getByRole('heading', { name: /Về xóm, mình làm quen!/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tạo tài khoản · Vào xóm/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeTruthy();
  });

  it('resumes the world flow after authentication remounts the game', async () => {
    mocks.onlineRequest.mockResolvedValue({
      id: 'account-1',
      username: 'nguoidung',
      displayName: 'Người chơi',
      profile: {},
    });

    render(
      <GameProvider><MemoryRouter initialEntries={['/']}>
        <AccountGate><HistoryGamePage /></AccountGate>
      </MemoryRouter></GameProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Thế giới' }));
    fireEvent.change(screen.getByLabelText('Tên trong xóm'), { target: { value: 'Người chơi' } });
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'nguoidung' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'matkhau12345' } });
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu'), { target: { value: 'matkhau12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo tài khoản · Vào xóm/ }));

    expect(await screen.findByRole('heading', { name: /Tiểu Mông · Thiếu niên Lạc tướng/ })).toBeTruthy();
    expect(localStorage.getItem('xnl-game-mode')).toBe('online');
    expect(localStorage.getItem('xnl-world-login-pending')).toBeNull();
  });

  it('asks before replacing different offline and online journeys and preserves the offline copy', async () => {
    const offlineProfile = { ...freshHistoryProfile(), displayName: 'Út Mận' };
    const offlineProgress = { ...freshHistoryProgress(), gold: 750 };
    const onlineProfile = { ...freshHistoryProfile(), displayName: 'Người chơi cloud' };
    const onlineProgress = { ...freshHistoryProgress(), gold: 350 };
    localStorage.setItem(HISTORY_PROFILE_KEY, JSON.stringify(offlineProfile));
    localStorage.setItem(HISTORY_PROGRESS_KEY, JSON.stringify(offlineProgress));
    localStorage.setItem('xnl-last-saved-mode', 'offline');
    const onlineSave = createHistoryCloudSave(onlineProgress, onlineProfile);
    mocks.onlineRequest.mockResolvedValue({
      id: 'account-1',
      username: 'nguoidung',
      displayName: 'Người chơi cloud',
      profile: { 'xnl-history-save-v1': JSON.stringify(onlineSave) },
    });

    render(
      <GameProvider><MemoryRouter initialEntries={['/']}>
        <AccountGate><HistoryGamePage /></AccountGate>
      </MemoryRouter></GameProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Thế giới' }));
    fireEvent.change(screen.getByLabelText('Tên trong xóm'), { target: { value: 'Người chơi cloud' } });
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'nguoidung' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'matkhau12345' } });
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu'), { target: { value: 'matkhau12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo tài khoản · Vào xóm/ }));

    expect(await screen.findByRole('heading', { name: 'Chọn dữ liệu muốn sử dụng' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Giữ dữ liệu offline' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dùng dữ liệu online' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dùng dữ liệu online' }));

    expect(await screen.findByRole('region', { name: /Bản đồ Mê Linh/ })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Mở Nhân vật' }) as HTMLButtonElement).title).toBe('Người chơi cloud');
    expect(JSON.parse(localStorage.getItem(HISTORY_PROFILE_KEY)!).displayName).toBe('Người chơi cloud');
    expect(JSON.parse(localStorage.getItem(HISTORY_OFFLINE_SAVE_KEY)!).profile.displayName).toBe('Út Mận');
    expect(localStorage.getItem('xnl-game-mode')).toBe('online');
  });

  it('allows offline routes without an account or a network request', async () => {
    mocks.onlineRequest.mockRejectedValue(new Error('Hãy đăng nhập để về xóm.'));

    render(
      <MemoryRouter initialEntries={['/uno']}>
        <AccountGate><main>Phòng UNO</main></AccountGate>
      </MemoryRouter>,
    );

    expect(screen.getByText('Phòng UNO')).toBeTruthy();
    expect(mocks.onlineRequest).not.toHaveBeenCalled();
  });

  it('renders online pages after loading the current account', async () => {
    localStorage.setItem('xnl-game-mode', 'online');
    mocks.onlineRequest.mockResolvedValue({
      id: 'account-1',
      username: 'nguoidung',
      displayName: 'Người chơi',
      profile: {},
    });

    render(
      <MemoryRouter initialEntries={['/uno']}>
        <AccountGate><main>Phòng UNO</main></AccountGate>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Phòng UNO')).toBeTruthy();
  });
});
