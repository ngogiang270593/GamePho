import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroSkillPlayground } from './HeroSkillPlayground';
import { SKILL_LOADOUT_STORAGE_KEY } from '../game/heroSkillLoadout';

describe('hero skill training arena', () => {
  beforeEach(() => {
    window.sessionStorage.removeItem('gamepho-skill-practice-post-v1');
    window.localStorage.removeItem(SKILL_LOADOUT_STORAGE_KEY);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (timer: number) => window.clearTimeout(timer));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.sessionStorage.removeItem('gamepho-skill-practice-post-v1');
    window.localStorage.removeItem(SKILL_LOADOUT_STORAGE_KEY);
  });

  function startArena() {
    fireEvent.click(screen.getByRole('button', { name: /Chốt Chặn · Đột Phá Vòng Vây/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục chọn bộ võ công' }));
    expect(screen.getByLabelText('Tâm pháp · chọn 1')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Phím 1 · võ công chiến đấu 1/ })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Phím 2 · võ công chiến đấu 2/ })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Phím 3 · võ công chiến đấu 3/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử trên cọc gỗ' }));
  }

  function getStage() {
    const stage = screen.getByRole('application', { name: /Sân tập võ công thời gian thực/ });
    Object.defineProperty(stage, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, right: 600, bottom: 600, width: 600, height: 600, x: 0, y: 0, toJSON: () => ({}) }),
    });
    return stage;
  }

  it('shows the visual 6x6 terrain and lets the hero move continuously', () => {
    vi.useFakeTimers();
    render(<HeroSkillPlayground />);
    startArena();
    const stage = getStage();
    expect(stage.querySelectorAll('.sprite-editor__skill-floor span')).toHaveLength(36);
    expect(stage.querySelector('.sprite-editor__skill-character')).toBeTruthy();
    expect(stage.querySelector('.sprite-editor__skill-post-art')).toBeTruthy();
    expect(screen.queryByRole('gridcell')).toBeNull();
    const hero = screen.getByRole('button', { name: /Tiểu Mông · vị trí/ });
    const initialLeft = parseFloat((hero as HTMLElement).style.left);

    fireEvent.keyDown(hero, { key: 'd' });
    act(() => vi.advanceTimersByTime(180));
    fireEvent.keyUp(window, { key: 'd' });

    expect(parseFloat((screen.getByRole('button', { name: /Tiểu Mông · vị trí/ }) as HTMLElement).style.left)).toBeGreaterThan(initialLeft);
  });

  it('starts the selected Chốt Chặn encounter on its map with the real-time combat hotbar', () => {
    render(<HeroSkillPlayground />);
    fireEvent.click(screen.getByRole('button', { name: /Chốt Chặn · Đột Phá Vòng Vây/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục chọn bộ võ công' }));
    fireEvent.change(screen.getByRole('combobox', { name: /Phím 1 · võ công chiến đấu 1/ }), { target: { value: 'bay-tre-gai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vào trận Chốt Chặn' }));

    const stage = screen.getByRole('application', { name: /Đấu trường thời gian thực/ });
    expect(stage.querySelectorAll('.river-battle__floor span')).toHaveLength(36);
    expect(stage.querySelector('.river-battle__map-art')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Bẫy Tre Gai/ })).toBeTruthy();
    expect(screen.getByLabelText(/Trưởng Đội · 850 HP/)).toBeTruthy();
    expect(screen.getByLabelText(/Lính Tuần Tra Cung · 200 HP/)).toBeTruthy();
    expect(screen.getByLabelText(/Lính Tuần Tra Đao · 200 HP/)).toBeTruthy();
  });

  it('uses the mouse to aim and casts the selected skill on the post', () => {
    vi.useFakeTimers();
    render(<HeroSkillPlayground />);
    startArena();
    const stage = getStage();
    fireEvent.pointerMove(stage, { clientX: 500, clientY: 250 });
    expect(stage.querySelector('.sprite-editor__skill-aim')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Cọc gỗ, 1500 HP/ }), { clientX: 500, clientY: 250 });
    expect(screen.getByText('Cá Cóc Phún Thủy: vào thế, chuẩn bị thi triển…')).toBeTruthy();
    act(() => vi.advanceTimersByTime(700));

    expect(screen.getByText('Cọc gỗ: 1400 / 1500 HP')).toBeTruthy();
    expect(screen.getByText(/Cá Cóc Phún Thủy gây 100 sát thương/)).toBeTruthy();
    expect(screen.getByText('−100')).toBeTruthy();
  });

  it('uses the numbered skill bar and persists a distinct three-skill loadout', () => {
    vi.useFakeTimers();
    render(<HeroSkillPlayground />);
    fireEvent.click(screen.getByRole('button', { name: /Chốt Chặn · Đột Phá Vòng Vây/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục chọn bộ võ công' }));
    fireEvent.change(screen.getByRole('combobox', { name: /Phím 1 · võ công chiến đấu 1/ }), { target: { value: 'bay-tre-gai' } });
    expect(JSON.parse(window.localStorage.getItem(SKILL_LOADOUT_STORAGE_KEY) ?? '{}').combatSkillIds[0]).toBe('bay-tre-gai');
    fireEvent.click(screen.getByRole('button', { name: 'Thử trên cọc gỗ' }));

    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyUp(window, { key: '2' });
    act(() => vi.advanceTimersByTime(700));

    expect(screen.getByText('Cọc gỗ: 1190 / 1500 HP')).toBeTruthy();
    expect(screen.getByText(/Rái Cá Quần Thủy gây 310 sát thương/)).toBeTruthy();
  });

  it('runs the self-support skill on the hero without damaging the post', () => {
    vi.useFakeTimers();
    render(<HeroSkillPlayground />);
    startArena();
    fireEvent.click(screen.getByRole('button', { name: /Vận hành tâm pháp/ }));
    expect(screen.getByText(/Tiểu Mông điều hòa hơi thở/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText('Cọc gỗ: 1500 / 1500 HP')).toBeTruthy();
    expect(screen.getByText(/Hà Bá Tức Công vận hành · hiệu ứng hồi phục 3% HP và 3% MP/)).toBeTruthy();
  });

  it('keeps the broken post at zero HP after remount until the arena is explicitly reset', () => {
    vi.useFakeTimers();
    const firstRender = render(<HeroSkillPlayground />);
    startArena();
    const stage = getStage();
    const post = () => screen.getByRole('button', { name: /Cọc gỗ/ });
    for (let hit = 0; hit < 15; hit += 1) {
      fireEvent.click(post(), { clientX: 500, clientY: 250 });
      act(() => vi.advanceTimersByTime(1100));
    }

    expect(screen.getByText('Cọc gỗ: 0 / 1500 HP')).toBeTruthy();
    expect(post().getAttribute('aria-label')).toContain('Cọc gỗ vỡ');
    expect(window.sessionStorage.getItem('gamepho-skill-practice-post-v1')).toBe('0');
    firstRender.unmount();

    render(<HeroSkillPlayground />);
    startArena();
    getStage();
    expect(screen.getByText('Cọc gỗ: 0 / 1500 HP')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Cọc gỗ vỡ/ }), { clientX: 500, clientY: 250 });
    expect(screen.getByText('Cọc gỗ đã vỡ. Nhấn Đặt lại để dựng cọc mới.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại sân tập' }));
    expect(screen.getByText('Cọc gỗ: 1500 / 1500 HP')).toBeTruthy();
  });
});
