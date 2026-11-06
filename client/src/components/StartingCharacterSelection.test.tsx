import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StartingCharacterSelection } from './StartingCharacterSelection';
import { makeSpriteSheet, type CharacterSpriteSheet } from '../game/characterSpriteSheet';

const spriteStore = vi.hoisted(() => ({ sheet: null as CharacterSpriteSheet | null }));

// Exercise the default action cycle independently of a designer's saved sprite.
vi.mock('../game/characterSpriteSheets.json', () => ({ default: {} }));
vi.mock('../game/characterSpriteSheet', async importOriginal => ({
  ...await importOriginal<typeof import('../game/characterSpriteSheet')>(),
  useAppliedSpriteSheet: () => spriteStore.sheet,
}));

afterEach(() => { cleanup(); spriteStore.sheet = null; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function mountPreview() {
  return render(<StartingCharacterSelection name="Tư An" promoCode=""
    onName={vi.fn()} onPromoCode={vi.fn()} onBack={vi.fn()} onConfirm={vi.fn()} />);
}

describe('starting character preview', () => {
  it('always previews the front-facing walk action without rotating to another action or direction', () => {
    const { container } = mountPreview();
    const preview = container.querySelector('.starting-live-character');
    const sprite = container.querySelector('.forest-action-sprite');
    expect(screen.queryByRole('button', { name: 'Nam' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nữ' })).toBeNull();
    expect(screen.getByRole('img', { name: 'Nhân vật nam đang đi bộ về phía trước' })).toBeTruthy();
    expect(preview?.getAttribute('data-preview-action')).toBe('walk');
    expect(preview?.getAttribute('data-preview-facing')).toBe('down');
    expect(preview?.getAttribute('aria-label')).toContain('đang đi bộ về phía trước');
    expect(sprite?.getAttribute('data-preview-action')).toBe('walk');
    expect(sprite?.getAttribute('data-facing')).toBe('down');
  });

  it('uses the saved walk-down frames from the designer sheet', () => {
    spriteStore.sheet = makeSpriteSheet('/designer-walk.png', 2048, 2304, 'Designer walk', 8, 9);
    spriteStore.sheet.clips.walk.directions.down.start = 8;
    const { container } = mountPreview();
    const preview = container.querySelector('.starting-live-character');
    const sprite = container.querySelector('.sprite-sheet-character');
    expect(preview?.getAttribute('data-preview-action')).toBe('walk');
    expect(preview?.getAttribute('data-preview-facing')).toBe('down');
    expect(sprite?.getAttribute('data-preview-action')).toBe('walk');
    expect(sprite?.getAttribute('data-facing')).toBe('down');
    expect(sprite?.getAttribute('data-frame')).toBe('8');
    expect(sprite?.getAttribute('data-playing')).toBe('true');
  });

  it('starts with a default talent and saves the chosen talent and alignment goal with Tiểu Mông', () => {
    const onConfirm = vi.fn();
    render(<StartingCharacterSelection name="Tiểu Mông" promoCode=""
      onName={vi.fn()} onPromoCode={vi.fn()} onBack={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByText('Tiểu sử')).toBeTruthy();
    fireEvent.click(screen.getByText('Tiểu sử'));
    expect(screen.getByText(/Cậu lớn lên trong một gia đình Lạc tướng/)).toBeTruthy();
    const confirmButton = screen.getByRole('button', { name: 'Vào game' }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(false);
    expect(screen.getByRole('button', { name: /Linh Mẫn Tinh Anh/ }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Cơ Biến Vô Song/ }));
    expect(confirmButton.disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Mê Linh Hiệp Khách/ }));
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      displayName: 'Tiểu Mông',
      startingCharacterId: 'forest-keeper',
      heroDevelopment: { talent: 'ingenious-trapper', alignmentGoal: 'righteous' },
    }));
    expect(screen.getByRole('button', { name: /U Minh Quỷ Sứ/ }).textContent).toContain('U Lược Sát Quỷ Công');
    expect(screen.getByRole('button', { name: /Mê Linh Hiệp Khách/ }).textContent).toContain('Chính Khí Lạc Hồng');
  });

  it('only activates the development reward after applying the valid test code', () => {
    const onConfirm = vi.fn();
    render(<StartingCharacterSelection name="Tiểu Mông" promoCode=""
      onName={vi.fn()} onPromoCode={vi.fn()} onBack={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /Cơ Biến Vô Song/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nhập mã thử game' }), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(screen.getByRole('status').textContent).toContain('Mã thử chưa đúng');
    expect(screen.getByRole('button', { name: 'Vào game' })).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox', { name: 'Nhập mã thử game' }), { target: { value: 'test-melinh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(screen.getByRole('status').textContent).toContain('10.000 xu và 10.000 danh vọng');
    fireEvent.click(screen.getByRole('button', { name: 'Vào game' }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      testGameCodeRedeemed: true,
      promoCodeRedeemed: false,
    }));
  });
});
