import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const CARD_EXIT_MARKER = 'pho-xom-card-abandon';
export function useCardExitGuard(matchId: number | null, onForfeit: () => Promise<boolean>, markerKey = CARD_EXIT_MARKER) {
  const navigate = useNavigate();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const destination = useRef<string | null>(null), confirmed = useRef(false), generation = useRef(0);
  const latest = useRef({ matchId, onForfeit }); latest.current = { matchId, onForfeit };
  function askExit(path: string | null = null) {
    if (latest.current.matchId === null) { if (path) navigate(path); return; }
    destination.current = path; setConfirmQuit(true);
  }
  async function confirmExit() {
    confirmed.current = true;
    if (await latest.current.onForfeit()) { setConfirmQuit(false); if (destination.current) navigate(destination.current); }
    else confirmed.current = false;
  }
  useEffect(() => {
    const id = ++generation.current; confirmed.current = false;
    setConfirmQuit(false);
    if (matchId === null) return;
    const baseline = window.history.state?.idx;
    let restoring = false;
    const back = (event: PopStateEvent) => {
      if (restoring) { event.stopImmediatePropagation(); restoring = false; return; }
      const target = event.state?.idx;
      if (confirmed.current || typeof baseline !== 'number' || typeof target !== 'number' || target === baseline) return;
      event.stopImmediatePropagation(); restoring = true;
      window.history.go(baseline - target); destination.current = '/map'; setConfirmQuit(true);
    };
    const unload = (event: BeforeUnloadEvent) => { if (!confirmed.current) { event.preventDefault(); event.returnValue = ''; } };
    const mark = () => { if (!confirmed.current) localStorage.setItem(markerKey, String(matchId)); };
    const resume = (event: PageTransitionEvent) => {
      if (event.persisted && localStorage.getItem(markerKey) === String(matchId)) {
        void latest.current.onForfeit().then(ok => { if (ok) localStorage.removeItem(markerKey); });
      }
    };
    window.addEventListener('popstate', back, true); window.addEventListener('beforeunload', unload); window.addEventListener('pagehide', mark);
    window.addEventListener('pageshow', resume);
    return () => {
      window.removeEventListener('popstate', back, true); window.removeEventListener('beforeunload', unload); window.removeEventListener('pagehide', mark);
      window.removeEventListener('pageshow', resume);
      queueMicrotask(() => {
        if (generation.current === id && latest.current.matchId === matchId && !confirmed.current) {
          mark(); void latest.current.onForfeit();
        }
      });
    };
  }, [matchId]);
  return { confirmQuit, askExit, confirmExit, stay: () => setConfirmQuit(false) };
}
