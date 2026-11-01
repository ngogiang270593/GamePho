import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CardRoomPage } from './CardRoomPage';
import { localApi, newRoot, type LocalRoot } from '../services/offline/engine';

const storage = vi.hoisted(() => vi.fn());
const setSoundEnabled = vi.hoisted(() => vi.fn());
vi.mock('../services/offline/storage', () => ({ runLocalRequest: storage, runOfflineRequest: storage }));
vi.mock('../context/GameContext', () => ({ useGameStore: () => ({ character: { displayName: 'Út' }, soundEnabled: false, setSoundEnabled }) }));
vi.mock('../components/CharacterSprite', () => ({ CharacterSprite: () => null }));
vi.mock('../components/NeighborSprite', () => ({ NeighborSprite: () => null }));
let root: LocalRoot;
const epoch = Date.parse('2026-10-26T08:00:00Z');
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers(); vi.setSystemTime(epoch); root = newRoot(epoch);
  localApi(root, 'POST', '/cards/start', { mode: 'friends', variant: 'expanded', opponents: 2, missionMode: true }, {}, epoch);
  storage.mockImplementation(async (method, path, body, params) => structuredClone(localApi(root, method, path, body, params, Date.now())));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
async function mount() { await act(async () => { render(<MemoryRouter><CardRoomPage /></MemoryRouter>); }); }
async function click(name: string | RegExp) { await act(async () => { fireEvent.click(screen.getByRole('button', { name })); }); }
it('opens a dedicated full-screen card room with accessible sound settings', async () => {
  await mount();
  expect(document.querySelector('.cards-room-screen')).toBeTruthy();
  await click('Cài đặt bàn chơi');
  const sound = screen.getByRole('checkbox', { name: 'Âm thanh' });
  expect(sound).toBeTruthy();
  await act(async () => { fireEvent.click(sound); });
  expect(setSoundEnabled).toHaveBeenCalledWith(true);
});
it('offers only bots and group creation with a compact basic setup', async () => {
  root.active.cards!.active = null;
  await mount();
  const modes = within(screen.getByRole('group', { name: 'Chế độ chơi' }));
  expect(modes.getAllByRole('button')).toHaveLength(2);
  expect(modes.getByRole('button', { name: /Đấu với máy/ })).toBeTruthy();
  expect(modes.getByRole('button', { name: /Lập nhóm/ })).toBeTruthy();
  expect(screen.queryByText('Phiêu lưu')).toBeNull();
  expect(screen.queryByRole('group', { name: 'Phòng chơi' })).toBeNull();
  await click('Bắt đầu đấu máy →');
  expect(root.active.cards!.active!.mode).toBe('bots');
  expect(root.active.cards!.active!.rules.variant).toBe('basic');
  expect(root.active.cards!.active!.wager?.stake).toBe(5000);
  expect(root.active.player.money).toBe(495000);
});

it('allows unlimited new campaign UNO matches after a practice match ends', async () => {
  const previous = root.active.cards!.active!;
  previous.mode = 'bots';
  previous.rules = { variant: 'basic', stack: false, turnSeconds: 0, initialCards: 7 };
  previous.status = 'finished';
  previous.winner = 0;
  previous.champion = 0;
  const previousId = previous.id;

  await act(async () => {
    render(<MemoryRouter><CardRoomPage campaignMode rewardsEnabled={false} /></MemoryRouter>);
  });

  expect(screen.getByRole('button', { name: /Chơi ván UNO mới · không giới hạn/ })).toBeTruthy();
  await click(/Chơi ván UNO mới · không giới hạn/);

  expect(root.active.cards!.active!.status).toBe('playing');
  expect(root.active.cards!.active!.id).not.toBe(previousId);
});

it('advertises free, unlimited UNO practice from the campaign lobby', async () => {
  root.active.cards!.active = null;
  await act(async () => {
    render(<MemoryRouter><CardRoomPage campaignMode rewardsEnabled={false} /></MemoryRouter>);
  });

  expect(screen.getByText(/Nhiệm vụ miễn cược · chơi lại không giới hạn/)).toBeTruthy();
});
it('creates a ten-person offline group with collapsed member settings', async () => {
  root.active.cards!.active = null;
  await mount(); await click(/Lập nhóm.*cùng thiết bị/);
  await act(async () => { fireEvent.change(screen.getByLabelText('Số người trong nhóm'), { target: { value: '9' } }); });
  expect(document.querySelector('details.cards-group-details')?.hasAttribute('open')).toBe(false);
  await click('Lập nhóm · chia bài →');
  expect(root.active.cards!.active!.players).toHaveLength(10);
  expect(root.active.cards!.active!.handoff).toBe(true);
  expect(screen.queryByRole('button', { name: /^Đánh / })).toBeNull();
});
it('removes private cards from the DOM until the next human is ready', async () => {
  await mount();
  expect(screen.queryByRole('button', { name: /^Đánh / })).toBeNull();
  await click(/Tôi là Bạn · sẵn sàng/);
  expect(screen.getAllByRole('button', { name: /^Đánh / })).toHaveLength(7);
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); });
  expect(screen.queryByRole('button', { name: /^Đánh / })).toBeNull();
});
it('asks before leaving and counts a confirmed exit as one loss', async () => {
  await mount();
  await click('← Về xóm');
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  expect(root.active.cards!.active!.status).toBe('playing');
  await click('Ở lại chơi');
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await click('Rời bàn'); await click('Chấp nhận thua · thoát');
  expect(root.active.cards!.active!.forfeitedBy).toBe(0);
  expect(root.active.cards!.losses).toBe(1);
});
it('allows choosing a timed virtual stake before the deal', async () => {
  root.active.cards!.active = null;
  await mount(); await click('10.000 xu');
  await act(async () => { fireEvent.change(screen.getByLabelText('Thời gian mỗi lượt'), { target: { value: '15' } }); });
  await click('Bắt đầu đấu máy →');
  expect(root.active.cards!.active!.rules.turnSeconds).toBe(15);
  expect(root.active.cards!.active!.wager?.stake).toBe(10000);
  expect(root.active.player.money).toBe(490000);
  expect(screen.getByRole('timer')).toBeTruthy();
});

it('keeps mission UNO free and shows the no-cost mission reminder', async () => {
  root.active.cards!.active = null;
  await act(async () => { render(<MemoryRouter><CardRoomPage campaignMode rewardsEnabled /></MemoryRouter>); });

  await click(/Bắt đầu đấu máy/);
  expect(root.active.cards!.active!.missionMode).toBe(true);
  expect(root.active.cards!.active!.wager?.stake).toBe(0);
  expect(root.active.player.money).toBe(500000);
});
it('reserves the selected history bet only after the confirmation dialog', async () => {
  root.active.cards!.active = null;
  const reserve = vi.fn(() => true);
  const started = vi.fn();
  await act(async () => {
    render(<MemoryRouter><CardRoomPage
      campaignMode
      bettingMode
      betBalance={500}
      selectedBet={100}
      onReserveBet={reserve}
      onMatchStarted={started}
    /></MemoryRouter>);
  });

  await click('Xác nhận cược');
  expect(screen.getByRole('alertdialog').textContent).toContain('Bạn đang chọn cược 100 xu');
  expect(reserve).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xác nhận cược' })); });

  expect(reserve).toHaveBeenCalledWith(100, false, null);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(root.active.cards!.active!.status).toBe('playing');
  expect(started).toHaveBeenCalledWith(root.active.cards!.active!.id);
});

it('allows a free ticket instead of coins and confirms the free entry', async () => {
  root.active.cards!.active = null;
  const reserve = vi.fn(() => true);
  await act(async () => {
    render(<MemoryRouter><CardRoomPage
      campaignMode
      bettingMode
      betBalance={0}
      freeUnoTickets={1}
      selectedBet={100}
      onReserveBet={reserve}
    /></MemoryRouter>);
  });

  await click('Dùng Vé UNO miễn phí · 1');
  expect(screen.getByText('Ván này được miễn phí nhờ Vé UNO')).toBeTruthy();
  await click('Chơi miễn phí');
  expect(screen.getByRole('alertdialog').textContent).toContain('Vé sẽ được dùng khi ván bắt đầu');
  await act(async () => { fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Chơi miễn phí' })); });

  expect(reserve).toHaveBeenCalledWith(100, true, null);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(root.active.cards!.active!.status).toBe('playing');
});

it('does not attach a new reservation to an older finished match after reload', async () => {
  const previous = root.active.cards!.active!;
  previous.status = 'finished';
  previous.winner = 0;
  const cancel = vi.fn();
  const started = vi.fn();
  await act(async () => {
    render(<MemoryRouter><CardRoomPage
      campaignMode
      bettingMode
      hasPendingBet
      pendingPreviousMatchId={previous.id}
      onCancelBet={cancel}
      onMatchStarted={started}
    /></MemoryRouter>);
  });

  expect(cancel).toHaveBeenCalledOnce();
  expect(started).not.toHaveBeenCalled();
});

it('opens a wild color picker and lets the human call Còn 1 after playing', async () => {
  const m = root.active.cards!.active!;
  m.mode = 'bots'; m.players[1].human = m.players[2].human = false; m.handoff = false;
  const wild = m.deck.find(c => c.face === 'wild')!;
  // A specific red 3 may already have been dealt; this test only needs any
  // remaining number card beside the wild card.
  const number = m.deck.find(c => /^\d$/.test(c.face))!;
  expect(wild).toBeTruthy();
  expect(number).toBeTruthy();
  m.players[0].hand = [wild, number];
  await mount(); await click('Đánh Đổi màu');
  expect(screen.getByRole('region', { name: 'Chọn màu và đối thủ' })).toBeTruthy();
  await click('♣ Xanh lá'); await click('Đánh lá này →');
  expect(root.active.cards!.active!.color).toBe('green');
  expect(root.active.cards!.active!.onePending?.player).toBe(0);
  await click(/Còn 1! ·/);
  expect(root.active.cards!.active!.onePending).toBeNull();
  expect(root.active.cards!.active!.players[0].hand).toHaveLength(1);
});
