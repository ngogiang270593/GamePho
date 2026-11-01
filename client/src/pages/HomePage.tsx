import { useState } from 'react';
import { offlineGame } from '../services/gameMode';
import { useGameStore } from '../context/GameContext';
import { POSITION_STORAGE_KEY } from '../game/world';
import { Navigate, useNavigate } from 'react-router-dom';
import { GameSaveControl } from '../components/GameSaveControl';
import { StartMenu } from '../components/StartMenu';
import { SystemPreferences } from '../components/SystemPreferences';
import { CharacterPage } from './CharacterPage';

export function HomePage() {
  const navigate = useNavigate();
  const { resetGame } = useGameStore();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  async function startNewGame() {
    if (starting) return;
    setStarting(true); setStartError('');
    try {
      await resetGame();
      localStorage.removeItem(POSITION_STORAGE_KEY);
      setStartScreen('play');
    } catch { setStartError('Không thể bắt đầu lượt chơi mới. Vui lòng thử lại.'); }
    finally { setStarting(false); }
  }
  const [hasStarted, setHasStarted] = useState(() => localStorage.getItem('pho-xom-started') === 'yes');
  const [startScreen, setStartScreen] = useState<'menu' | 'play' | 'backup' | 'system' | 'exit'>('menu');
  if (!hasStarted) {
    if (startScreen === 'menu') {
      return (
        <div aria-busy={starting}>{startError && <p role="alert">{startError}</p>}<StartMenu
          onPlay={() => void startNewGame()}
          onBackup={() => setStartScreen('backup')}
          onSystem={() => setStartScreen('system')}
          onExit={() => {
            window.close();
            setStartScreen('exit');
          }}
        /></div>
      );
    }
    if (startScreen === 'play') {
      return <CharacterPage initialSetup onBack={() => setStartScreen('menu')} onStart={() => { setHasStarted(true); navigate(offlineGame ? '/map/shop' : '/map'); }} />;
    }
    if (startScreen === 'backup') {
      return (
        <section className="startup-subscreen">
          <div className="startup-panel">
            <p className="eyebrow">GIỮ LẠI HƯƠNG VỊ XÓM MÌNH</p>
            <h1>Sao lưu tiến trình</h1>
            <p>Chọn một trong 5 bản lưu để chơi tiếp hành trình của bạn.</p>
            <GameSaveControl />
            <button className="startup-back-button" type="button" onClick={() => setStartScreen('menu')}>← Menu chính</button>
          </div>
        </section>
      );
    }
    if (startScreen === 'system') {
      return (
        <section className="startup-subscreen">
          <div className="startup-panel">
            <p className="eyebrow">TÙY CHỈNH TRẢI NGHIỆM</p>
            <h1>Hệ thống</h1>
            <SystemPreferences />
            <button className="startup-back-button" type="button" onClick={() => setStartScreen('menu')}>← Menu chính</button>
          </div>
        </section>
      );
    }
    return (
      <section className="startup-subscreen exit-screen">
        <div className="startup-panel">
          <span className="exit-bowl" aria-hidden="true">🍜</span>
          <p className="eyebrow">HẸN GẶP LẠI</p>
          <h1>Cảm ơn đã ghé quán!</h1>
          <p>Trình duyệt không cho trang web tự đóng thẻ này. Bạn có thể đóng thẻ để thoát.</p>
          <button className="startup-back-button" type="button" onClick={() => setStartScreen('menu')}>Quay lại quán</button>
        </div>
      </section>
    );
  }
  return <Navigate to="/map" replace />;
}
