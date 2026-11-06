import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { freshRiverCampaign } from '../game/riverCampaign';
import { MelinProfessionPanel } from './MelinProfessionPanel';

describe('Mê Linh professions', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('only collects river ore and forges at Võ Sư Nương’s training yard', () => {
    const campaign = { ...freshRiverCampaign(), ironOre: 2, vanTien: 50 };
    const onAction = vi.fn(() => true);
    const { rerender } = render(<MelinProfessionPanel
      campaign={campaign}
      onAction={onAction}
      atRiverbank={false}
      atForge={false}
      atNoon={false}
    />);
    expect((screen.getByRole('button', { name: 'Nhặt quặng ven sông · 1 AP' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Bắt đầu rèn Dao Găm Thép' }) as HTMLButtonElement).disabled).toBe(true);

    rerender(<MelinProfessionPanel campaign={campaign} onAction={onAction} atRiverbank={true} atForge={true} atNoon={true} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nhặt quặng ven sông · 1 AP' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'collect-ore' });
  });

  it('uses the Space timing minigame to forge the steel dagger', () => {
    vi.useFakeTimers();
    const campaign = { ...freshRiverCampaign(), ironOre: 2, vanTien: 50, timeMinutes: 720 };
    const onAction = vi.fn(() => true);
    render(<MelinProfessionPanel campaign={campaign} onAction={onAction} atRiverbank={true} atForge={true} atNoon={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu rèn Dao Găm Thép' }));
    act(() => { vi.advanceTimersByTime(600); });
    expect((screen.getByLabelText('Canh nhiệt · nhấn Space trong vùng xanh') as HTMLProgressElement).value).toBe(50);
    fireEvent.keyDown(window, { code: 'Space' });

    expect(onAction).toHaveBeenCalledWith({ type: 'forge-dagger' });
    expect(screen.getByRole('status').textContent).toContain('Rèn thành công');
  });
});
