import { InstallAppControl } from './InstallAppControl';
import { useEffect, useState } from 'react';
import { useGameStore } from '../context/GameContext';
import { CONTROL_SETTINGS_EVENT, TAP_MOVE_KEY, tapMovementEnabled } from '../game/movement/preferences';

export function SystemPreferences({ onOpenData }: { onOpenData?: () => void }) {
  const { soundEnabled, setSoundEnabled } = useGameStore();
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('pho-xom-theme') === 'contrast');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('pho-xom-motion') === 'reduced');
  const [tapMove,setTapMove]=useState(tapMovementEnabled);

  useEffect(() => {
    document.documentElement.dataset.theme = highContrast ? 'contrast' : 'vietnam';
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

  function changeTheme(enabled: boolean) {
    setHighContrast(enabled);
    localStorage.setItem('pho-xom-theme', enabled ? 'contrast' : 'vietnam');
  }

  function changeMotion(enabled: boolean) {
    setReducedMotion(enabled);
    localStorage.setItem('pho-xom-motion', enabled ? 'reduced' : 'full');
  }

  return (
    <section className="system-preferences" aria-labelledby="system-preferences-title">
      <div className="section-heading">
        <h2 id="system-preferences-title">Cài đặt hệ thống</h2>
        <span>Áp dụng ngay, lưu trên thiết bị này</span>
      </div>
      <label className="setting-row">
        <span><strong>Âm thanh</strong><small>Bật hoặc tắt hiệu ứng âm thanh trong trò chơi.</small></span>
        <input type="checkbox" checked={soundEnabled} onChange={event => setSoundEnabled(event.target.checked)} />
      </label>
      <label className="setting-row">
        <span><strong>Tương phản cao</strong><small>Tăng độ rõ của chữ và màu giao diện.</small></span>
        <input type="checkbox" checked={highContrast} onChange={event => changeTheme(event.target.checked)} />
      </label>
      <label className="setting-row">
        <span><strong>Giảm chuyển động</strong><small>Hạn chế hiệu ứng hoạt ảnh trong trò chơi.</small></span>
        <input type="checkbox" checked={reducedMotion} onChange={event => changeMotion(event.target.checked)} />
      </label>
      <p className="system-setting-note"><strong>Ngôn ngữ</strong><small>Tiếng Việt · ngôn ngữ hiện được hỗ trợ</small></p>
      <label className="setting-row">
        <span><strong>Chạm để di chuyển</strong><small>Chạm vào đường để tự đi tới. Kéo bằng ngón tay để xem bản đồ.</small></span>
        <input type="checkbox" checked={tapMove} onChange={event=>{setTapMove(event.target.checked);localStorage.setItem(TAP_MOVE_KEY,event.target.checked?'on':'off');window.dispatchEvent(new Event(CONTROL_SETTINGS_EVENT));}} />
      </label>
      {onOpenData && <div className="setting-row">
        <span><strong>Dữ liệu hành trình</strong><small>Quản lý các ô sao lưu trên thiết bị này.</small></span>
        <button className="system-data-button" type="button" onClick={onOpenData}>Mở dữ liệu</button>
      </div>}
      <InstallAppControl />
    </section>
  );
}
