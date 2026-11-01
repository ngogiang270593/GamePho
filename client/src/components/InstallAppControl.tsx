import { useEffect, useState } from 'react';
import { hasInstallPrompt, installApp } from '../services/pwa';

export function InstallAppControl() {
  const [installable, setInstallable] = useState(hasInstallPrompt);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  useEffect(() => {
    let active = true;
    if ('serviceWorker' in navigator) void navigator.serviceWorker.ready.then(() => { if (active) setCached(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const change = () => setInstallable(hasInstallPrompt());
    const finish = () => setInstalled(true);
    window.addEventListener('pho-xom-install-change', change); window.addEventListener('pho-xom-installed', finish);
    return () => { window.removeEventListener('pho-xom-install-change', change); window.removeEventListener('pho-xom-installed', finish); };
  }, []);
  if (installed) return null;
  return <details className="pwa-install"><summary>Cài Xóm Nhà Lá lên điện thoại</summary>
    {installable && <button type="button" onClick={() => { void installApp().catch(() => setError('Hãy cài từ menu của trình duyệt theo hướng dẫn bên dưới.')); }}>Cài ứng dụng</button>}
    <p><strong>Android:</strong> mở bằng Chrome → menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào màn hình chính.</p>
    <p><strong>iPhone/iPad:</strong> mở bằng Safari → Chia sẻ → Thêm vào MH chính → bật Mở dưới dạng ứng dụng web nếu có → Thêm.</p>
    <p>Tải game lần đầu có mạng, chờ tải xong rồi cài. Sau đó bạn có thể chơi offline; tiến trình được lưu trên thiết bị này. Khi có bản mới, đóng hết cửa sổ game rồi mở lại để cập nhật.</p>
    {'serviceWorker' in navigator && <p role="status">{cached ? 'Đã tải đủ game để chơi offline.' : 'Đang tải bản offline… Giữ mạng cho đến khi tải xong.'}</p>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
export function ConnectivityBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return offline ? <div className="pwa-offline" role="status">Đang offline · Bạn vẫn chơi được, tiến trình sẽ lưu trên thiết bị.</div> : null;
}
