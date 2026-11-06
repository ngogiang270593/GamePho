import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { freshHistoryProgress } from '../services/historyProgress';
import { freshRiverCampaign } from '../game/riverCampaign';
import { MelinRiverCampaign } from './MelinRiverCampaign';

describe('Mê Linh NPC quest interactions', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('lets the player evade the practice strike before choosing the martial path', () => {
    const progress = { ...freshHistoryProgress(), riverCampaign: { ...freshRiverCampaign(), timeMinutes: 840 } };
    const onAction = vi.fn(() => true);
    render(<MelinRiverCampaign
      progress={progress}
      talent={null}
      onAction={onAction}
      onStartBoss={vi.fn()}
      onWorldMap={vi.fn()}
      onFastTravel={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu tỷ thí · 3 × 3' }));
    const board = screen.getByRole('grid', { name: 'Bàn cờ thử tập 3 nhân 3' });
    fireEvent.click(within(board).getByRole('gridcell', { name: 'Ô tập 2, 3' }));
    expect(screen.getByRole('status').textContent).toContain('Né thành công');
    for (const cellName of ['Ô tập 3, 3', 'Ô tập 3, 2', 'Ô tập 2, 2', 'Ô tập 1, 2']) {
      fireEvent.click(within(board).getByRole('gridcell', { name: cellName }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Khiêm Tốn · nhận sách và kỹ năng' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'martial-spar', path: 'righteous' });
  });

  it('uses the Space timing minigame for Tảo’s first catch and commits the chosen fish reward', () => {
    vi.useFakeTimers();
    const progress = { ...freshHistoryProgress(), riverCampaign: freshRiverCampaign() };
    const onAction = vi.fn(() => true);
    render(<MelinRiverCampaign
      progress={progress}
      talent={null}
      onAction={onAction}
      onStartBoss={vi.fn()}
      onWorldMap={vi.fn()}
      onFastTravel={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: '🎣 Thả câu · bắt đầu minigame' }));
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText(/Phao rung/)).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(Number(screen.getByLabelText('Vị trí vạch câu cá').getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(130);
    expect(Number(screen.getByLabelText('Vị trí vạch câu cá').getAttribute('aria-valuenow'))).toBeLessThanOrEqual(170);
    fireEvent.keyDown(window, { code: 'Space' });
    fireEvent.click(screen.getByRole('button', { name: 'Mang cá chia cho 3 hộ dân' }));

    expect(onAction).toHaveBeenCalledWith({ type: 'tao-fish', path: 'righteous' });
  });
});
