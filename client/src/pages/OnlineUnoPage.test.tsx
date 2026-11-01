import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ onlineRequest: vi.fn() }));
vi.mock('../services/online/account', () => ({ onlineRequest: mocks.onlineRequest }));
vi.mock('../services/online/firebaseRealtime', () => ({
  watchLobby: () => () => undefined,
  watchRoom: () => () => undefined,
}));
vi.mock('./CardRoomPage', () => ({ CardFace: () => <div data-testid="card-face" /> }));

import { OnlineUnoPage } from './OnlineUnoPage';

const waitingRoom = (ready = true) => ({
  code: 'ABC234',
  host: true,
  members: [
    { name: 'Mận', avatar: 'man', ready, connected: true, isHost: true },
    { name: 'Tí', avatar: 'ti', ready: false, connected: true, isHost: false },
  ],
  phase: 'waiting' as const,
  viewer: 0,
  snapshot: { progress: { active: null }, revision: 1, now: Date.now() },
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Online UNO lobby', () => {
  it('creates and displays a waiting room with copied invite controls and readiness', async () => {
    mocks.onlineRequest.mockImplementation(async (path: string, body?: Record<string, unknown>) => {
      if (path === '/rooms') return [];
      if (path === '/rooms/create') {
        expect(body).toMatchObject({ name: 'Mận', avatar: 'man', turnSeconds: 30 });
        return waitingRoom();
      }
      if (path.endsWith('/ready')) return waitingRoom(false);
      throw new Error(`Unexpected API path: ${path}`);
    });

    render(<OnlineUnoPage onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tên người chơi'), { target: { value: 'Mận' } });
    fireEvent.change(screen.getByLabelText('Nhân vật'), { target: { value: 'man' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phòng mới' }));

    expect(await screen.findByText('ABC234')).toBeTruthy();
    expect(screen.getByText(/Mận · Bạn · Chủ phòng/)).toBeTruthy();
    expect(screen.getByText('Tí', { exact: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sao chép liên kết mời' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ sẵn sàng' }));
    await waitFor(() => expect(mocks.onlineRequest).toHaveBeenCalledWith('/rooms/ABC234/ready', { ready: false }));
  });

  it('requires a valid six-character room code and player name to join', async () => {
    mocks.onlineRequest.mockImplementation(async path => path === '/rooms' ? [] : waitingRoom(false));
    render(<OnlineUnoPage onBack={vi.fn()} />);
    const joinButton = screen.getByRole('button', { name: 'Tham gia phòng →' });
    expect(joinButton).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Tên người chơi'), { target: { value: 'Bống' } });
    fireEvent.change(screen.getByLabelText('Mã phòng'), { target: { value: 'BAD123' } });
    expect(joinButton).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Mã phòng'), { target: { value: 'DEF567' } });
    expect(joinButton).toHaveProperty('disabled', false);
  });
});
