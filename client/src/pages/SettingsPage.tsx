import { onlineGame } from '../services/gameMode';
import { logoutAccount } from '../components/AccountGate';
import { useState } from 'react';
﻿import { GameSaveControl } from '../components/GameSaveControl';
import { SystemPreferences } from '../components/SystemPreferences';
import { VillageIllustration } from '../components/VillageIllustration';

export function SettingsPage() {
  const [logoutError,setLogoutError] = useState('');
  function exitGame() {
    localStorage.removeItem('pho-xom-started');
    window.location.assign('/');
  }
  return <section className="village-page"><VillageIllustration kind="settings" title="Góc nghỉ chân" subtitle="NGHỈ TAY MỘT CHÚT · XÓM VẪN ĐỢI BẠN" /><div className="village-paper">
    <SystemPreferences />
    {onlineGame && <div className="danger-zone"><h2>Tài khoản Xóm Nhà Lá</h2><p>Tiến trình và 5 ô sao lưu nằm trong tài khoản của bạn.</p><button onClick={() => void logoutAccount().catch(e => setLogoutError(e.message))}>Đăng xuất · Đổi tài khoản</button>{logoutError && <p role="alert">{logoutError}</p>}</div>}
    <GameSaveControl />
    <div className="danger-zone"><h2>Thoát trò chơi</h2><p>Lưu vào một ô sao lưu trước khi thoát để lần sau chọn đúng bản muốn chơi tiếp.</p><button type="button" onClick={exitGame}>Thoát về màn hình ban đầu</button></div>
  </div></section>;
}
