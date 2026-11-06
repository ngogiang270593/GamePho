import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MelinCheckpointBattle } from './MelinCheckpointBattle';
import { freshRiverBattleSnapshot, freshRiverCampaign } from '../game/riverCampaign';

describe('Mê Linh checkpoint tactical battle', () => {
  afterEach(cleanup);

  it('uses a 6 by 6 board and spends one AP for a one-cell move', () => {
    const campaign = {
      ...freshRiverCampaign(),
      bossStarted: true,
      trapRecipe: true,
      oldBamboo: 3,
      knowsDaoManual: true,
      morality: 60,
    };
    render(<MelinCheckpointBattle
      campaign={campaign}
      talent={null}
      haBaEquipped
      onVictory={vi.fn(() => true)}
      onRetreat={vi.fn()}
      onStateChange={vi.fn(() => true)}
    />);
    const board = screen.getByRole('grid', { name: 'Bàn cờ 6 nhân 6' });
    expect(within(board).getAllByRole('gridcell')).toHaveLength(36);
    fireEvent.click(screen.getByRole('button', { name: 'Di chuyển · 1 AP' }));
    fireEvent.click(within(board).getByRole('gridcell', { name: 'Ô 2, 3' }));
    expect(screen.getByText('AP 2 / 3 · Lượt 1')).toBeTruthy();
    expect(within(board).getByRole('gridcell', { name: 'Ô 2, 3, Tiểu Mông' })).toBeTruthy();
  });

  it('unlocks Nỏ Cóc after fishing and damages a target at range', () => {
    const campaign = {
      ...freshRiverCampaign(),
      bossStarted: true,
      trapRecipe: true,
      oldBamboo: 3,
      knowsDaoManual: true,
      crossbowUnlocked: true,
      battle: {
        ...freshRiverBattleSnapshot(freshRiverCampaign()),
        hero: { x: 2, y: 2 },
        boss: { x: 4, y: 2 },
      },
    };
    const onStateChange = vi.fn(() => true);
    render(<MelinCheckpointBattle
      campaign={campaign}
      talent={null}
      haBaEquipped={false}
      onVictory={vi.fn(() => true)}
      onRetreat={vi.fn()}
      onStateChange={onStateChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Nỏ Cóc Liên Châu · 30 MP · 1 AP' }));

    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      bossHp: 610,
      bossPoisonTurns: 0,
      poisonUsed: false,
      mp: 320,
      ap: 2,
    }));
  });

  it('applies poison over three turns on the first successful dagger strike', () => {
    const base = freshRiverCampaign();
    const campaign = {
      ...base,
      bossStarted: true,
      daggerPoisoned: true,
      battle: {
        ...freshRiverBattleSnapshot(base),
        hero: { x: 3, y: 3 },
        boss: { x: 4, y: 3 },
        soldiers: [
          { id: 'spear-1' as const, position: { x: 0, y: 0 }, hp: 200 },
          { id: 'spear-2' as const, position: { x: 1, y: 0 }, hp: 200 },
        ],
      },
    };
    const onStateChange = vi.fn(() => true);
    render(<MelinCheckpointBattle
      campaign={campaign}
      talent={null}
      haBaEquipped={false}
      onVictory={vi.fn(() => true)}
      onRetreat={vi.fn()}
      onStateChange={onStateChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Đánh thường · 1 AP' }));
    fireEvent.click(screen.getByRole('gridcell', { name: 'Ô 5, 4, Trưởng đội, sông' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      bossHp: 740,
      bossPoisonTurns: 3,
      poisonUsed: true,
      ap: 2,
    }));
    expect(screen.getByText(/trúng độc 3 lượt/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc lượt' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      bossHp: 720,
      bossPoisonTurns: 2,
      poisonUsed: true,
    }));
  });

  it('uses Hạc Lão’s unlocked technique as a real combat skill', () => {
    const base = freshRiverCampaign();
    const campaign = {
      ...base,
      bossStarted: true,
      inventory: { SKILL_DA_NGUU_BAI_TUONG: 1 },
      battle: {
        ...freshRiverBattleSnapshot(base),
        hero: { x: 3, y: 2 },
        boss: { x: 4, y: 2 },
        soldiers: [
          { id: 'spear-1' as const, position: { x: 0, y: 0 }, hp: 200 },
          { id: 'spear-2' as const, position: { x: 1, y: 0 }, hp: 200 },
        ],
      },
    };
    const onStateChange = vi.fn(() => true);
    render(<MelinCheckpointBattle
      campaign={campaign}
      talent={null}
      haBaEquipped={false}
      onVictory={vi.fn(() => true)}
      onRetreat={vi.fn()}
      onStateChange={onStateChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Đả Ngưu Bái Tướng · 40 MP · 1 AP' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ bossHp: 608, mp: 310, ap: 2 }));
  });

  it('applies the village-captain armor reward as incoming damage reduction', () => {
    const base = freshRiverCampaign();
    const campaign = {
      ...base,
      bossStarted: true,
      banditArmorUnlocked: true,
      battle: {
        ...freshRiverBattleSnapshot(base),
        hero: { x: 0, y: 0 },
        boss: { x: 5, y: 5 },
        soldiers: [
          { id: 'spear-1' as const, position: { x: 1, y: 0 }, hp: 200 },
          { id: 'spear-2' as const, position: { x: 0, y: 0 }, hp: 0 },
        ],
      },
    };
    const onStateChange = vi.fn(() => true);
    render(<MelinCheckpointBattle
      campaign={campaign}
      talent={null}
      haBaEquipped={false}
      onVictory={vi.fn(() => true)}
      onRetreat={vi.fn()}
      onStateChange={onStateChange}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc lượt' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ hp: 542 }));
  });

  it('sets the GDD starting positions and wins the two-turn trap, crossbow, and critical combo', () => {
    const base = freshRiverCampaign();
    const campaign = {
      ...base,
      bossStarted: true,
      trapRecipe: true,
      oldBamboo: 3,
      knowsDaoManual: true,
      crossbowUnlocked: true,
      morality: 60,
      battle: freshRiverBattleSnapshot(base),
    };
    const onStateChange = vi.fn(() => true);
    render(<MelinCheckpointBattle
      campaign={campaign}
      talent={null}
      haBaEquipped={false}
      onVictory={vi.fn(() => true)}
      onRetreat={vi.fn()}
      onStateChange={onStateChange}
    />);
    const board = screen.getByRole('grid', { name: 'Bàn cờ 6 nhân 6' });
    expect(within(board).getByRole('gridcell', { name: 'Ô 1, 3, Tiểu Mông' })).toBeTruthy();
    expect(within(board).getByRole('gridcell', { name: 'Ô 4, 2, Lính giáo một 200 HP' })).toBeTruthy();
    expect(within(board).getByRole('gridcell', { name: 'Ô 4, 4, Lính giáo hai 200 HP, sông' })).toBeTruthy();
    expect(within(board).getByRole('gridcell', { name: 'Ô 5, 3, Trưởng đội' })).toBeTruthy();
    expect(screen.getByText(/Trưởng Đội 850 \/ 850 HP/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Di chuyển · 1 AP' }));
    fireEvent.click(within(board).getByRole('gridcell', { name: 'Ô 2, 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Di chuyển · 1 AP' }));
    fireEvent.click(within(board).getByRole('gridcell', { name: 'Ô 3, 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bẫy Tre Gai · 50 MP · 1 AP' }));
    fireEvent.click(within(board).getByRole('gridcell', { name: 'Ô 4, 3' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      bossHp: 730,
      rootTurns: 1,
      armorTurns: 2,
      armorBreakBonus: 50,
      turn: 2,
      ap: 3,
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Nỏ Cóc Liên Châu · 30 MP · 1 AP' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      bossHp: 370,
      mp: 270,
      ap: 2,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Rái Cá Quần Thủy · 50 MP · 2 AP' }));
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      bossHp: 0,
      status: 'won',
      mp: 220,
      ap: 0,
    }));
    expect(screen.getByRole('region', { name: 'Chọn kết cục' })).toBeTruthy();
    expect(screen.getByText(/hai lính giáo buông vũ khí và đầu hàng/)).toBeTruthy();
  });
});
