import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhoSelector } from './PhoSelector';
import type { PhoMenuItem } from '../services/gameTypes';

const menu: PhoMenuItem[] = [0, 1, 2, 3].map(phoType => ({
  id: phoType + 1,
  name: ['Phở bò', 'Phở tái', 'Phở gà', 'Phở đặc biệt'][phoType],
  phoType,
  basePrice: 50000 + phoType * 5000,
  isAvailable: true,
  isDailySpecial: phoType === 0,
  description: '',
}));

afterEach(cleanup);

describe('PhoSelector', () => {
  it('renders four dishes and clearly labels the daily special reward', () => {
    render(<PhoSelector menu={menu} selectedPho={null} onSelect={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText(/thưởng thêm 5\.000đ khi phục vụ đúng/)).toBeTruthy();
  });

  it('marks the selected dish and reports selections', () => {
    const onSelect = vi.fn();
    render(<PhoSelector menu={menu} selectedPho={menu[1]} onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Phở tái/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Phở gà/ }));
    expect(onSelect).toHaveBeenCalledWith(menu[2]);
  });

  it('shows an empty message when no dishes are available', () => {
    render(<PhoSelector menu={[]} selectedPho={null} onSelect={vi.fn()} />);

    expect(screen.getByText('Chưa có món phở khả dụng.')).toBeTruthy();
  });
});
