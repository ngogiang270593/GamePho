import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MelinCheckpointBattle } from './MelinCheckpointBattle';
import { freshRiverBattleSnapshot, freshRiverCampaign, type RiverBattleSnapshot } from '../game/riverCampaign';
import { SKILL_LOADOUT_STORAGE_KEY } from '../game/heroSkillLoadout';

function renderBattle(overrides: Record<string, unknown> = {}) {
  const campaign = { ...freshRiverCampaign(), bossStarted: true, ...overrides } as ReturnType<typeof freshRiverCampaign>;
  const onStateChange = vi.fn((_snapshot: RiverBattleSnapshot) => true);
  render(<MelinCheckpointBattle
    campaign={campaign}
    talent={null}
    haBaEquipped={false}
    onVictory={vi.fn(() => true)}
    onRetreat={vi.fn()}
    onStateChange={onStateChange}
  />);
  const stage = screen.getByRole('application', { name: /Đấu trường thời gian thực/ });
  Object.defineProperty(stage, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ left: 0, top: 0, right: 600, bottom: 600, width: 600, height: 600, x: 0, y: 0, toJSON: () => ({}) }),
  });
  return { stage, onStateChange };
}

describe('Mê Linh real-time checkpoint battle', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SKILL_LOADOUT_STORAGE_KEY);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (timer: number) => window.clearTimeout(timer));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.removeItem(SKILL_LOADOUT_STORAGE_KEY);
  });

  it('replaces tile selection with a continuous arena and movement instructions', () => {
    renderBattle();
    const stage = screen.getByRole('application', { name: /Đấu trường thời gian thực/ });
    expect(screen.queryByRole('gridcell')).toBeNull();
    expect(screen.queryByRole('button', { name: /Di chuyển/ })).toBeNull();
    expect(screen.getByText(/WASD \/ ↑↓←→: di chuyển · kỹ năng phím 1–5/)).toBeTruthy();
    expect(stage.querySelectorAll('.river-battle__floor span')).toHaveLength(36);
    expect(stage.querySelector('.river-battle__map-art')).toBeTruthy();
    expect(stage.querySelector('.river-battle__bridge')).toBeTruthy();
    expect(stage.querySelector('.river-battle__actor--boss [data-sprite-name]')?.getAttribute('data-sprite-name'))
      .toBe('Trưởng Đội Tuần Tra · Nam');
    expect(stage.querySelector('.river-battle__actor--soldier[aria-label^="Lính Tuần Tra Cung"] .river-battle__sprite')).toBeTruthy();
    expect(stage.querySelector('.river-battle__actor--soldier[aria-label^="Lính Tuần Tra Đao"] .river-battle__sprite')).toBeTruthy();
    expect(stage.querySelector('.river-battle__actor--hero .river-battle__actor-vitals .is-mana')).toBeTruthy();
    expect(stage.querySelector('.river-battle__actor--boss .river-battle__actor-vitals')).toBeTruthy();
    expect(stage.querySelector('.river-battle__actor--hero .river-battle__speech')?.textContent).toBe('Ta sẽ phá vòng vây!');
    expect(stage.querySelector('.river-battle__actor--boss .river-battle__speech')?.textContent).toBe('Qua cầu này, đừng hòng!');
    expect(stage.querySelectorAll('.river-battle__skill-dock .river-battle__skill-button')).toHaveLength(5);
    expect(stage.querySelector('.river-battle__map-art img')?.getAttribute('alt')).toMatch(/mũi thuyền.*cọc chắn.*tháp canh/);
    expect(stage.querySelector('.river-battle__map-art source')?.getAttribute('srcset')).toContain('chot-chan-river-checkpoint-mobile.svg');
    expect(stage.closest('.river-battle--realtime')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cá Cóc Phún Thủy/ }).querySelector('kbd')?.textContent).toBe('1');
    expect(screen.getByRole('button', { name: /Hà Bá Cuộn Lưu/ }).querySelector('kbd')?.textContent).toBe('5');
  });

  it('moves smoothly while a direction key is held', () => {
    vi.useFakeTimers();
    renderBattle();
    const hero = screen.getByLabelText(/Tiểu Mông · 650 HP/);
    const initialLeft = parseFloat((hero as HTMLElement).style.left);

    fireEvent.keyDown(hero, { key: 'd' });
    act(() => vi.advanceTimersByTime(180));
    fireEvent.keyUp(window, { key: 'd' });

    expect(parseFloat((screen.getByLabelText(/Tiểu Mông · 650 HP/) as HTMLElement).style.left)).toBeGreaterThan(initialLeft);
  });

  it('keeps hero and enemies inside the bridge when loading and moving', () => {
    vi.useFakeTimers();
    const base = freshRiverCampaign();
    const snapshot = {
      ...freshRiverBattleSnapshot(base),
      hero: { x: 2, y: -3 },
      boss: { x: 8, y: 9 },
      soldiers: freshRiverBattleSnapshot(base).soldiers.map(soldier => ({
        ...soldier,
        position: { x: soldier.position.x, y: 8 },
      })),
    };
    const { onStateChange } = renderBattle({ battle: snapshot });
    const hero = screen.getByLabelText(/Tiểu Mông · 650 HP/) as HTMLElement;
    expect(parseFloat(hero.style.top)).toBeCloseTo((2.4 / 6) * 100);
    const stage = screen.getByRole('application', { name: /Đấu trường thời gian thực/ });
    fireEvent.click(screen.getByRole('button', { name: /Cá Cóc Phún Thủy · 40 MP/ }));
    fireEvent.click(stage, { clientX: 300, clientY: 100 });
    expect(screen.getByText('Chỉ có thể di chuyển và tung chiêu trên mặt cầu.')).toBeTruthy();

    fireEvent.keyDown(window, { key: 's' });
    act(() => vi.advanceTimersByTime(900));
    fireEvent.keyUp(window, { key: 's' });
    const movedHero = screen.getByLabelText(/Tiểu Mông · 650 HP/) as HTMLElement;
    expect((parseFloat(movedHero.style.top) / 100) * 6 - .5).toBeLessThanOrEqual(3.1);
    expect(onStateChange.mock.calls.length).toBeGreaterThan(0);
    expect(onStateChange.mock.calls.every(([saved]) =>
      [saved.hero, saved.boss, ...saved.soldiers.map(soldier => soldier.position)]
        .every(point => point.x >= .25 && point.x <= 5 && point.y >= 1.9 && point.y <= 3.1),
    )).toBe(true);
  });

  it('updates both characters dialogue at half and critical health', () => {
    const base = freshRiverCampaign();
    const halfHealth = { ...freshRiverBattleSnapshot(base), hp: 325, bossHp: 425 };
    const { stage } = renderBattle({ battle: halfHealth });

    expect(stage.querySelector('.river-battle__actor--hero .river-battle__speech')?.textContent).toBe('Chưa thể dừng bước!');
    expect(stage.querySelector('.river-battle__actor--boss .river-battle__speech')?.textContent).toBe('Ngươi khá lắm, nhưng chưa xong đâu!');
  });

  it('shows defeat dialogue when the player loses', () => {
    const base = freshRiverCampaign();
    const lost = { ...freshRiverBattleSnapshot(base), hp: 0, status: 'lost' as const };
    const { stage } = renderBattle({ battle: lost });

    expect(stage.querySelector('.river-battle__actor--hero .river-battle__speech')?.textContent).toBe('Ta… không thể gục ngã…');
    expect(stage.querySelector('.river-battle__actor--boss .river-battle__speech')?.textContent).toBe('Bỏ vũ khí xuống! Chốt Chặn vẫn là của ta!');
    expect(screen.getByRole('region', { name: 'Thất bại' })).toBeTruthy();
  });

  it('aims a water projectile with the mouse and resolves its damage and armor break in real time', () => {
    vi.useFakeTimers();
    renderBattle();
    const stage = screen.getByRole('application', { name: /Đấu trường thời gian thực/ });

    fireEvent.click(screen.getByRole('button', { name: /Cá Cóc Phún Thủy · 40 MP/ }));
    fireEvent.pointerMove(stage, { clientX: 540, clientY: 340 });
    expect(stage.querySelector('.river-battle__aim-path')).toBeTruthy();
    fireEvent.click(stage, { clientX: 540, clientY: 340 });
    act(() => vi.advanceTimersByTime(900));

    expect(stage.querySelector('.river-battle__actor--boss')?.getAttribute('aria-label')).toContain('750 HP');
    expect(screen.getByText(/giáp vỡ \+30%/)).toBeTruthy();
  });

  it('plays the main character authored combat action for a normal attack', () => {
    const base = freshRiverCampaign();
    const battle = {
      ...freshRiverBattleSnapshot(base),
      hero: { x: 4, y: 2.5 },
      boss: { x: 4.7, y: 2.5 },
    };
    const { stage } = renderBattle({ battle });

    fireEvent.click(screen.getByRole('button', { name: /4 Đánh thường/ }));
    fireEvent.click(stage, { clientX: 520, clientY: 300 });

    expect(stage.querySelector('.river-battle__actor--hero .river-battle__sprite')?.getAttribute('data-preview-action')).toBe('attack');
  });

  it('persists the terminal battle snapshot immediately on victory', () => {
    vi.useFakeTimers();
    const base = freshRiverCampaign();
    const battle = { ...freshRiverBattleSnapshot(base), bossHp: 100 };
    const { onStateChange, stage } = renderBattle({ battle });

    fireEvent.click(screen.getByRole('button', { name: /Cá Cóc Phún Thủy · 40 MP/ }));
    fireEvent.click(stage, { clientX: 540, clientY: 340 });
    act(() => vi.advanceTimersByTime(900));

    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'won', bossHp: 0 }));
    expect(screen.getByRole('region', { name: 'Đối thoại cuối trận' })).toBeTruthy();
    expect(screen.getByText('Ta đã bại… xin hãy tha cho thuộc hạ.')).toBeTruthy();
    expect(screen.getByText('Đầu hàng đi, đừng làm hại dân làng!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục đối thoại' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục đối thoại' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chọn hành động' }));
    expect(screen.getByRole('region', { name: 'Chọn kết cục' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tha mạng, buộc mở chốt/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Kết liễu và lấy chiến lợi phẩm/ })).toBeTruthy();
  });

  it('warns before the boss hook attack and applies its damage only after the tell', () => {
    vi.useFakeTimers();
    const { stage } = renderBattle();
    expect(screen.getByLabelText(/Tiểu Mông · 650 HP/)).toBeTruthy();

    act(() => vi.advanceTimersByTime(2500));
    expect(stage.querySelector('.river-battle__boss-cast')).toBeTruthy();
    expect(stage.querySelector('.river-battle__actor--boss')?.classList.contains('is-attacking')).toBe(true);
    expect(screen.getByText(/Truy Hồn Câu · né vùng đỏ!/)).toBeTruthy();
    expect(screen.getByLabelText(/Tiểu Mông · 650 HP/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(500));

    expect(screen.getByText(/Truy Hồn Câu · trúng!/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByLabelText(/Tiểu Mông · (?!650 HP)\d+ HP/)).toBeTruthy();
  });

  it('uses the otter dash to move continuously around the boss without tile snapping', () => {
    vi.useFakeTimers();
    const base = freshRiverCampaign();
    const campaign = {
      ...base,
      bossStarted: true,
      battle: freshRiverBattleSnapshot(base),
    };
    renderBattle(campaign);
    const hero = screen.getByLabelText(/Tiểu Mông · 650 HP/) as HTMLElement;
    const initialLeft = parseFloat(hero.style.left);

    fireEvent.click(screen.getByRole('button', { name: /Rái Cá Quần Thủy · 50 MP/ }));
    act(() => vi.advanceTimersByTime(1200));

    expect(parseFloat((screen.getByLabelText(/Tiểu Mông · 650 HP/) as HTMLElement).style.left)).toBeGreaterThan(initialLeft + 20);
    expect(screen.getByText(/lướt vòng ra sau lưng/)).toBeTruthy();
  });

  it('saves continuous coordinates in the battle snapshot', () => {
    vi.useFakeTimers();
    const base = freshRiverCampaign();
    const { onStateChange } = renderBattle({ battle: { ...freshRiverBattleSnapshot(base), hero: { x: 0, y: 2 } } });

    fireEvent.keyDown(window, { key: 'd' });
    act(() => vi.advanceTimersByTime(800));
    fireEvent.keyUp(window, { key: 'd' });
    act(() => vi.advanceTimersByTime(700));

    expect(onStateChange.mock.calls.some(([snapshot]) => snapshot.hero.x > 0 && !Number.isInteger(snapshot.hero.x))).toBe(true);
  });
});
