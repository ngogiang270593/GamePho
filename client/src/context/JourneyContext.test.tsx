import { useCallback, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JourneyProvider, useJourney, useJourneyPause } from './JourneyContext';
import type { GameState } from '../services/gameTypes';
import type { JourneyUpdate } from '../game/journey';

const mocks = vi.hoisted(() => ({ value: {} as Record<string, unknown>, tick: vi.fn() }));
vi.mock('./GameContext', () => ({ useGameStore: () => mocks.value }));
vi.mock('../services/gameService', () => ({ journeyAction: (...args: unknown[]) => mocks.tick(...args) }));
const base = { player: { money: 500000 }, waitingCustomers: [], randomEvents: [], journey: { isOpen: true, minute: 360 } } as unknown as GameState;
function Reader() {
  const [book, setBook] = useState(false);
  const { journey, paused } = useJourney();
  useJourneyPause(book);
  return <><button onClick={() => setBook(!book)}>Sổ món</button><output>{paused ? 'paused' : 'running'}:{journey?.minute}</output></>;
}
function Harness() {
  const [gameState, setGameState] = useState(base);
  const update = useCallback((value: JourneyUpdate) => setGameState(current => ({ ...current, ...value })), []);
  mocks.value = { gameState, isLoading: false, applyJourneyUpdate: update };
  return <><button onClick={() => setGameState(current => ({ ...current, journey: { ...current.journey!, minute: 1000 } }))}>Newer sale</button><JourneyProvider><Reader /></JourneyProvider></>;
}
beforeEach(() => {
  vi.useFakeTimers(); localStorage.setItem('pho-xom-started', 'yes');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  mocks.tick.mockReset().mockResolvedValue({ ...base, journey: { ...base.journey, minute: 372 } });
});
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

describe('visible play clock', () => {
  it('pauses while reading, and resumes without charging the time spent reading', async () => {
    render(<Harness />);
    await act(() => vi.advanceTimersByTimeAsync(2100));
    expect(mocks.tick).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Sổ món' }));
    await act(() => vi.advanceTimersByTimeAsync(12000));
    expect(mocks.tick).toHaveBeenCalledOnce();
    expect(screen.getByText('paused:372')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sổ món' }));
    await act(() => vi.advanceTimersByTimeAsync(2100));
    expect(mocks.tick).toHaveBeenCalledTimes(2);
    expect(mocks.tick.mock.calls[1][1].seconds).toBeLessThanOrEqual(3);
  });

  it('does not overwrite a newer sale with a delayed clock response', async () => {
    let finish!: (value: unknown) => void;
    mocks.tick.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<Harness />);
    await act(() => vi.advanceTimersByTimeAsync(2100));
    fireEvent.click(screen.getByRole('button', { name: 'Newer sale' }));
    await act(async () => finish({ ...base, journey: { ...base.journey, minute: 372 } }));
    expect(screen.getByText('running:1000')).toBeTruthy();
  });

  it('does not tick or accumulate offline time while the tab is hidden', async () => {
    render(<Harness />);
    act(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(mocks.tick).not.toHaveBeenCalled();
    act(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await act(() => vi.advanceTimersByTimeAsync(2100));
    expect(mocks.tick).toHaveBeenCalledOnce(); expect(mocks.tick.mock.calls[0][1].seconds).toBeLessThanOrEqual(3);
  });
});
