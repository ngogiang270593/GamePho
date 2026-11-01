import { createContext, useContext, useEffect, useState, type PropsWithChildren, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onlineGame } from '../services/gameMode';
import { onlineRequest, applyAccount, profileKeys, type Account } from '../services/online/account';
import { InstallAppControl } from './InstallAppControl';
import '../styles/village-welcome.css';
const AccountContext = createContext<Account | null>(null);
const AccountGateActionsContext = createContext({ openAccountScreen: () => {} });
export const useAccount = () => useContext(AccountContext);
export const useAccountGateActions = () => useContext(AccountGateActionsContext);
export function AccountGate({ children }: PropsWithChildren) {
 const [account,setAccount] = useState<Account | null>(null), [error,setError] = useState('');
 const [accountScreenOpen,setAccountScreenOpen] = useState(false);
 const location = useLocation();
 const navigate = useNavigate();
 useEffect(() => {
  if (!onlineGame) return; let active = true;
  if (localStorage.getItem('xnl-game-mode') === 'online') {
   void onlineRequest<Account>('/auth/me').then(a => { if (active) { applyAccount(a); setAccount(a); } }).catch(e => { if (active && !/đăng nhập|hết hạn/i.test(e.message)) setError(e.message); });
  }
  const expired = () => { setAccount(null); setAccountScreenOpen(true); setError('Phiên đã hết hạn. Đăng nhập lại để chơi tiếp nhé.'); };
  window.addEventListener('xnl-session-expired', expired); return () => { active = false; window.removeEventListener('xnl-session-expired', expired); };
 }, []);
 if (!onlineGame) return <>{children}</>;
 if (accountScreenOpen) {
  return <AccountScreen
   initialError={error}
   onCancel={() => { setAccountScreenOpen(false); setError(''); localStorage.removeItem('xnl-world-login-pending'); if (location.pathname !== '/') navigate('/'); }}
   onAccount={a => { applyAccount(a); setAccount(a); setAccountScreenOpen(false); setError(''); }}
  />;
 }
 return <AccountContext.Provider value={account}>
  <AccountGateActionsContext.Provider value={{ openAccountScreen: () => { setError(''); setAccountScreenOpen(true); } }}>
   {children}
  </AccountGateActionsContext.Provider>
 </AccountContext.Provider>;
}
export async function logoutAccount() {
 await onlineRequest('/auth/logout', {}); for (const key of profileKeys) localStorage.removeItem(key); localStorage.removeItem('xnl-online-room'); localStorage.removeItem('xnl-world-login-pending'); if (localStorage.getItem('xnl-game-mode') === 'online') { if (localStorage.getItem('xnl-offline-history-save-v1')) localStorage.setItem('xnl-game-mode', 'offline'); else localStorage.removeItem('xnl-game-mode'); } window.location.assign('/');
}
export function AccountScreen({ onAccount, onCancel, initialError = '' }: { onAccount: (account: Account) => void; onCancel?: () => void; initialError?: string }) {
 const [register,setRegister] = useState(true), [username,setUsername] = useState(''), [name,setName] = useState(''), [password,setPassword] = useState(''), [confirm,setConfirm] = useState(''), [show,setShow] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState(initialError), [recoveryHelp,setRecoveryHelp] = useState(false);
 async function submit(event: FormEvent) {
  event.preventDefault(); if (busy) return; if (register && password !== confirm) { setError('Hai mật khẩu chưa khớp nhau.'); return; }
  setBusy(true); setError(''); try { onAccount(await onlineRequest<Account>('/auth/' + (register ? 'register' : 'login'), { username, password, displayName:name })); } catch(e) { setError(e instanceof Error ? e.message : 'Chưa vào được xóm. Thử lại nhé.'); } finally { setBusy(false); }
 }
 return <section className="village-welcome" aria-label="Chào mừng đến Xóm Nhà Lá">
  <div className="village-welcome-brand"><span>MỘT CHÚT QUÊ NHÀ</span><h1>Xóm<br/><em>Nhà Lá</em><i aria-hidden="true">❧</i></h1><p>Nắng trên đồng. Vui trong xóm.</p></div>
  <div className="village-auth-panel"><div className="village-auth-tabs" role="group" aria-label="Tài khoản"><button aria-pressed={register} onClick={() => { setRegister(true); setError(''); setRecoveryHelp(false); }}>Tạo tài khoản</button><button aria-pressed={!register} onClick={() => { setRegister(false); setError(''); setRecoveryHelp(false); }}>Đăng nhập</button></div>
   <h2>{register ? 'Về xóm, mình làm quen!' : 'Xóm chờ bạn về!'}</h2><p>{register ? 'Một tài khoản, chơi trên mọi thiết bị.' : 'Đăng nhập để chơi tiếp câu chuyện của bạn.'}</p>
   <form onSubmit={event => void submit(event)} aria-busy={busy}>
    {register && <label>Tên trong xóm<input autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required placeholder="Xóm gọi bạn là…" /></label>}
    <label>Tên đăng nhập<input autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={e => setUsername(e.target.value)} pattern="[A-Za-z0-9_]{3,24}" minLength={3} maxLength={24} required placeholder="Chữ không dấu, số hoặc dấu _" /></label>
    <label>Mật khẩu<div className="village-password"><input type={show ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={10} maxLength={128} required placeholder="Ít nhất 10 ký tự" /><button type="button" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(v => !v)}>{show ? 'Ẩn' : 'Hiện'}</button></div></label>
    {register && <label>Nhập lại mật khẩu<input type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={10} maxLength={128} required placeholder="Nhập lại cho chắc nhé" /></label>}
    {error && <p role="alert" className="village-auth-error">{error}</p>}
    {!register && <button className="village-auth-cancel" type="button" onClick={() => setRecoveryHelp(value => !value)}>Quên mật khẩu?</button>}
    {recoveryHelp && <p role="status" className="village-auth-note">Tài khoản hiện chưa có email khôi phục. Vui lòng liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu.</p>}
    <button className="village-auth-submit" disabled={busy}>{busy ? 'Đang mở cổng…' : register ? 'Tạo tài khoản · Vào xóm →' : 'Đăng nhập · Về xóm →'}</button>
   </form>{onCancel && <button className="village-auth-cancel" type="button" onClick={onCancel}>← Quay lại menu</button>}<p className="village-auth-note">Tiến trình riêng · UNO cùng bạn bè qua mạng</p><InstallAppControl />
  </div><p className="village-scene-caption">Mùi lúa mới, bóng chuối xanh, một miền thương nhớ.</p>
 </section>;
}
