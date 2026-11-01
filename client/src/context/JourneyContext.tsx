import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useGameStore } from './GameContext';
import { journeyAction } from '../services/gameService';
import type { Journey, JourneyAction } from '../game/journey';

interface JourneyContextValue {
  journey: Journey | null; paused: boolean; busy: boolean; error: string;
  act: (action: JourneyAction, body?: Record<string, unknown>) => Promise<boolean>;
  pause: (token: object, value: boolean) => void;
}
const empty: JourneyContextValue = { journey: null, paused: false, busy: false, error: '', act: async () => false, pause: () => {} };
const JourneyContext = createContext<JourneyContextValue>(empty);

export function JourneyProvider({ children }: PropsWithChildren) {
  const { gameState, isLoading, applyJourneyUpdate } = useGameStore();
  const [pauses, setPauses] = useState(new Set<object>());
  const [hidden, setHidden] = useState(document.hidden);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const tickPending = useRef(false);
  const alive = useRef(true);
  const current = useRef({ gameState, isLoading, pauses, hidden, busy });
  current.current = { gameState, isLoading, pauses, hidden, busy };
  const pause = useCallback((token: object, value: boolean) => setPauses(old => {
    if (old.has(token) === value) return old;
    const next = new Set(old); if (value) next.add(token); else next.delete(token); return next;
  }), []);
  useEffect(() => {
    alive.current = true;
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { alive.current = false; document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const act = useCallback(async (action: JourneyAction, body: Record<string, unknown> = {}) => {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError('');
    try { const update = await journeyAction(action, body); if (alive.current) applyJourneyUpdate(update); return true; }
    catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được chuyện trong xóm. Thử lại nhé.'); return false; }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  }, [applyJourneyUpdate]);
  useEffect(() => {
    let previous = performance.now();
    let credit = 0;
    const interval = window.setInterval(() => {
      const now = performance.now(); const dt = Math.min(.6, (now - previous) / 1000); previous = now;
      const state = current.current;
      if (!state.gameState?.journey?.isOpen || state.hidden || state.pauses.size || state.isLoading || state.busy || localStorage.getItem('pho-xom-started') !== 'yes') { credit = 0; return; }
      credit += dt;
      if (credit < 2 || tickPending.current || pending.current) return;
      const seconds = Math.min(3, credit); credit = 0; tickPending.current = true;
      const base = state.gameState;
      void journeyAction('tick', { seconds }).then(update => {
        if (alive.current && current.current.gameState === base && !pending.current) { applyJourneyUpdate(update); setError(''); }
      }).catch(cause => { if (alive.current) setError(cause instanceof Error ? cause.message : 'Đồng hồ đang chờ kết nối.'); }).finally(() => { tickPending.current = false; });
    }, 500);
    return () => window.clearInterval(interval);
  }, [applyJourneyUpdate]);
  const value = useMemo(() => ({ journey: gameState?.journey ?? null, paused: Boolean(pauses.size || hidden || isLoading), busy, error, pause, act }), [gameState?.journey, pauses, hidden, isLoading, busy, error, pause, act]);
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}
export function useJourney() { return useContext(JourneyContext); }
export function useJourneyPause(value: boolean) {
  const { pause } = useJourney(); const token = useRef({});
  useEffect(() => { const id = token.current; pause(id, value); return () => pause(id, false); }, [pause, value]);
}
