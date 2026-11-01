import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StartingCharacterSelection } from './StartingCharacterSelection';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function mountPreview() {
  vi.useFakeTimers();
  return render(<StartingCharacterSelection name="Tư An" promoCode=""
    onName={vi.fn()} onPromoCode={vi.fn()} onBack={vi.fn()} onConfirm={vi.fn()} />);
}

describe('automatic character actions', () => {
  it('loops walking, turning, running and jumping automatically without buttons', () => {
    const { container } = mountPreview();
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.queryByRole('button', { name: /Xem hành động|Dừng hành động/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const expected of ['idle', 'walk', 'turn', 'run', 'jump']) {
        expect(container.querySelector('.starting-live-character')?.getAttribute('data-preview-action')).toBe(expected);
        expect(container.querySelector('.forest-action-sprite')?.getAttribute('data-preview-action')).toBe(expected);
        expect(vi.getTimerCount()).toBe(1);
        act(() => { vi.advanceTimersToNextTimer(); });
      }
    }
    expect(container.querySelector('.starting-live-character')?.getAttribute('data-preview-action')).toBe('idle');
    expect(screen.queryByRole('button', { name: /Xem hành động|Dừng hành động/ })).toBeNull();
  });

  it('restarts for another gender or template and cleans up on unmount', () => {
    const { container, unmount } = mountPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    for (const change of [
      () => fireEvent.click(screen.getByRole('button', { name: 'Nữ' })),
      () => fireEvent.click(screen.getByRole('button', { name: /Người con của đồng ruộng/ })),
    ]) {
      act(() => { vi.advanceTimersToNextTimer(); });
      expect(container.querySelector('.starting-live-character')?.getAttribute('data-preview-action')).toBe('walk');
      change();
      expect(container.querySelector('.starting-live-character')?.getAttribute('data-preview-action')).toBe('idle');
      expect(vi.getTimerCount()).toBe(1);
    }
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses while hidden and respects reduced motion', () => {
    const { unmount } = mountPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Nam' }));
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(0);
    hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { container } = mountPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Nữ' }));
    expect(container.querySelector('.starting-live-character')?.getAttribute('data-preview-action')).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
  });
});
