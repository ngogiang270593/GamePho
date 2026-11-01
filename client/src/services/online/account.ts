export interface Account { id: string; username: string; displayName: string; profile: Record<string,string> }
export const profileKeys = ['pho-xom-started','pho-xom-character-name','pho-xom-character-avatar','pho-xom-character-appearance','pho-xom-world-position'] as const;
export async function onlineRequest<T>(path: string, body?: Record<string,unknown>, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
 const response = await fetch('/api' + path, { method, credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 const type = response.headers.get('Content-Type') ?? '';
 if (!type.includes('application/json')) throw new Error('Máy chủ tài khoản chưa được triển khai. Hãy dùng bản Online và kết nối Cloudflare D1 theo hướng dẫn.');
 const data = await response.json(); if (!response.ok) { if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('xnl-session-expired')); throw new Error(data?.message ?? 'Không kết nối được với xóm.'); } return data as T;
}
export function applyAccount(account: Account) {
 // Never mix a previous player's appearance or started flag into another account.
 for (const key of profileKeys) { const value = account.profile[key]; if (value !== undefined) localStorage.setItem(key,value); else localStorage.removeItem(key); }
 if (localStorage.getItem('xnl-account-id') !== account.id) { localStorage.removeItem('pho-xom-card-abandon'); localStorage.removeItem('xnl-online-room'); localStorage.removeItem('xnl-network-abandon'); }
 localStorage.setItem('xnl-account-id', account.id);
}
export function saveAccountProfile() {
 const body: Record<string,string> = {}; for (const key of profileKeys) { const value = localStorage.getItem(key); if (value !== null) body[key] = value; }
 return onlineRequest('/auth/profile', body, 'PUT');
}
