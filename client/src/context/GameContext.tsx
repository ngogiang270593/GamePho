import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getGameState, resetGame as resetGameApi, servePho, startGameDay } from '../services/gameService';
import type { Customer, GameState, PhoMenuItem, PhoOrder, PlayerCharacter } from '../services/gameTypes';
import { playUiSound } from '../services/audioService';
import { APPEARANCE_STORAGE_KEY, normalizeAppearance, readAppearance } from '../game/character';
import type { JourneyUpdate } from '../game/journey';

export type NotificationKind = 'success' | 'error' | 'warning' | 'drama' | 'reward';

export interface GameNotification {
  id: number;
  type: NotificationKind;
  message: string;
}

interface GameContextValue {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  selectedCustomer: Customer | null;
  selectedPho: PhoMenuItem | null;
  selectedToppings: string[];
  character: PlayerCharacter;
  notification: GameNotification | null;
  loadGame: () => Promise<void>;
  applyJourneyUpdate: (update: JourneyUpdate) => void;
  selectCustomer: (customer: Customer | null) => void;
  saveCharacter: (character: PlayerCharacter) => void;
  selectPho: (pho: PhoMenuItem | null) => void;
  toggleTopping: (topping: string) => void;
  serveCustomer: (serviceTimeSeconds: number) => Promise<PhoOrder | null>;
  startDay: () => Promise<void>;
  resetGame: () => Promise<void>;
  clearNotification: () => void;
  showNotification: (type: NotificationKind, message: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function acceptState(current: GameState | null, next: GameState) {
  return (current?.journey?.revision ?? 0) > (next.journey?.revision ?? 0) ? current : next;
}

export function GameProvider({ children }: PropsWithChildren) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPho, setSelectedPho] = useState<PhoMenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [character, setCharacter] = useState<PlayerCharacter>(() => ({
    displayName: localStorage.getItem('pho-xom-character-name') ?? '',
    avatar: localStorage.getItem('pho-xom-character-avatar') ?? '🧑‍🍳',
    appearance: readAppearance(),
  }));
  const [notification, setNotification] = useState<GameNotification | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => localStorage.getItem('pho-xom-sound') !== 'off');
  useEffect(() => {
    document.documentElement.dataset.motion = localStorage.getItem('pho-xom-motion') === 'reduced' ? 'reduced' : 'full';
    document.documentElement.dataset.theme = localStorage.getItem('pho-xom-theme') === 'contrast' ? 'contrast' : 'vietnam';
  }, []);

  const showNotification = useCallback((type: NotificationKind, message: string) => {
    setNotification({ id: Date.now(), type, message });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('pho-xom-sound', enabled ? 'on' : 'off');
  }, []);

  const loadGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await getGameState(); setGameState(current => acceptState(current, next));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể tải trạng thái trò chơi.';
      setError(message);
      showNotification('error', message);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const applyJourneyUpdate = useCallback((update: JourneyUpdate) => {
    setGameState(current => current ? acceptState(current, { ...current, ...update }) : current);
  }, []);

  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
    setSelectedPho(null);
    setSelectedToppings([]);
  }, []);
  const saveCharacter = useCallback((nextCharacter: PlayerCharacter) => {
    const appearance = normalizeAppearance(nextCharacter.appearance);
    localStorage.setItem('pho-xom-character-name', nextCharacter.displayName);
    localStorage.setItem('pho-xom-character-avatar', nextCharacter.avatar);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    setCharacter({ ...nextCharacter, appearance });
  }, []);

  const selectPho = useCallback((pho: PhoMenuItem | null) => {
    setSelectedPho(pho);
  }, []);

  const toggleTopping = useCallback((topping: string) => {
    setSelectedToppings(current => current.includes(topping)
      ? current.filter(item => item !== topping)
      : [...current, topping]);
  }, []);

  const serveCustomer = useCallback(async (serviceTimeSeconds: number): Promise<PhoOrder | null> => {
    if (!selectedCustomer || !selectedPho) {
      const message = 'Hãy chọn khách và món phở trước khi phục vụ.';
      setError(message);
      showNotification('error', message);
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const order = await servePho({
        customerId: selectedCustomer.id,
        phoType: selectedPho.phoType,
        toppings: selectedToppings.join(','),
        serviceTimeSeconds,
      });
      showNotification(order.dramaTriggered ? 'drama' : order.bonusMoney > 0 || order.viralChange > 0 ? 'reward' : order.isCorrect ? 'success' : 'warning', order.message);
      if (soundEnabled) playUiSound(order.dramaTriggered ? 'drama' : order.isCorrect ? 'success' : 'warning');
      setSelectedCustomer(null);
      setSelectedPho(null);
      setSelectedToppings([]);
      // The order has already been committed. A failed refresh must not turn it
      // into a retryable sale and risk submitting the same customer twice.
      try { const next = await getGameState(); setGameState(current => acceptState(current, next)); }
      catch { setError('Đơn đã được ghi nhận. Chưa cập nhật được sổ quán, hãy tải lại trước khi đón khách tiếp.'); }
      return order;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể phục vụ khách.';
      setError(message);
      showNotification('error', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedCustomer, selectedPho, selectedToppings, showNotification, soundEnabled]);

  const startDay = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await startGameDay();
      showNotification('success', result.message);
      if (soundEnabled) playUiSound('success');
      setSelectedCustomer(null);
      setSelectedPho(null);
      setSelectedToppings([]);
      setGameState(await getGameState());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể bắt đầu ngày mới.';
      setError(message);
      showNotification('error', message);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, soundEnabled]);

  const resetGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resetGameApi();
      setSelectedCustomer(null);
      setSelectedPho(null);
      setSelectedToppings([]);
      setGameState(await getGameState());
      setNotification(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể bắt đầu lượt chơi mới.';
      setError(message);
      showNotification('error', message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const value = useMemo(() => ({
    gameState,
    isLoading,
    error,
    selectedCustomer,
    selectedPho,
    selectedToppings,
    character,
    notification,
    loadGame,
    applyJourneyUpdate,
    selectCustomer,
    saveCharacter,
    selectPho,
    toggleTopping,
    serveCustomer,
    startDay,
    resetGame,
    clearNotification,
    showNotification,
    soundEnabled,
    setSoundEnabled,
  }), [gameState, isLoading, error, selectedCustomer, selectedPho, selectedToppings, character, notification, loadGame, applyJourneyUpdate, selectCustomer, saveCharacter, selectPho, toggleTopping, serveCustomer, startDay, resetGame, clearNotification, showNotification, soundEnabled, setSoundEnabled]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameStore phải được dùng bên trong GameProvider.');
  return context;
}
