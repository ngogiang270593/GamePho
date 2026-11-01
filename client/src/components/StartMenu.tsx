import { useAccount, logoutAccount } from './AccountGate';
import { InstallAppControl } from './InstallAppControl';
interface StartMenuProps {
  onPlay: () => void;
  onBackup: () => void;
  onSystem: () => void;
  onExit: () => void;
}

const menuItems = [
  { id: 'play', label: 'Chơi mới', icon: '🍜', detail: 'Mở quán, bắt đầu chuyện xóm mình' },
  { id: 'backup', label: 'Sao lưu', icon: '💾', detail: 'Chọn bản lưu để chơi tiếp' },
  { id: 'system', label: 'Hệ thống', icon: '⚙️', detail: 'Âm thanh, hình ảnh và chuyển động' },
  { id: 'exit', label: 'Thoát', icon: '🚪', detail: 'Rời quán phở hôm nay' },
] as const;

export function StartMenu({ onPlay, onBackup, onSystem, onExit }: StartMenuProps) {
  const account = useAccount();
  const actions = { play: onPlay, backup: onBackup, system: onSystem, exit: onExit };

  return (
    <section className="start-menu-screen village-start" aria-label="Màn hình chính Xóm Nhà Lá">
      <div className="pho-night-scene" aria-hidden="true">
        <div className="scene-moon" />
        <div className="scene-lantern">🏮</div>
        <div className="scene-ground" />
      </div>

      <div className="start-menu-content">
        <div className="start-menu-brand">
          <span className="start-menu-kicker">MỘT CHÚT QUÊ NHÀ</span>
          <h1>Xóm <span>Nhà Lá</span></h1>
          <p>Nắng trên đồng. Vui trong xóm.</p>
        </div>
        {account && <div className="village-account-tools"><span>Chào {account.displayName} ☺</span><button onClick={() => void logoutAccount().catch(e => window.alert(e.message))}>Đổi tài khoản</button></div>}
        <nav className="start-menu-actions" aria-label="Menu chính">
          {menuItems.map(item => (
            <button key={item.id} type="button" onClick={actions[item.id]}>
              <span className="menu-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="menu-item-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
              <span className="menu-item-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </nav>
        <InstallAppControl />
        <p className="start-menu-footer">NẤU BẰNG CẢ TẤM LÒNG · ĂN BẰNG CẢ TÌNH THÂN</p>
      <div className="start-menu-dish" aria-hidden="true">
        <div className="scene-bowl">
          <img src="/images/pho-bowl-cutout.png" alt="" loading="eager" width="1280" height="1280" />
          <span className="photo-steam"><i /><i /><i /><i /><i /></span>
        </div>
        <p className="start-dish-caption"><span /> Phở vừa lên · Mời bạn xơi!</p>
      </div>
      </div>
    </section>
  );
}
