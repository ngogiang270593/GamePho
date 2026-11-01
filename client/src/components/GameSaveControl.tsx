import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

const characterKeys = ['pho-xom-character-name', 'pho-xom-character-avatar', 'pho-xom-character-appearance', 'pho-xom-world-position'];
interface SaveSlot { id: number; savedAt: string | null }

export function GameSaveControl() {
  const [slots, setSlots] = useState<SaveSlot[]>(Array.from({ length: 5 }, (_, i) => ({ id: i + 1, savedAt: null })));
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const playing = localStorage.getItem('pho-xom-started') === 'yes';
  useEffect(() => {
    let active = true;
    apiClient.get<SaveSlot[]>('/backup/slots').then(({ data }) => { if (active) { setSlots(data); setReady(true); } })
      .catch(() => { if (active) setError('Không thể tải danh sách bản lưu. Hãy đóng và mở lại cửa sổ để thử lại.'); });
    return () => { active = false; };
  }, []);

  async function act(slot: SaveSlot, load: boolean) {
    if (slot.savedAt && !window.confirm(load ? 'Chơi bản lưu này? Tiến trình chưa sao lưu sẽ được thay bằng bản đã chọn.' : 'Ghi đè bản lưu trong ô này bằng tiến trình đang chơi?')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (load) {
        const { data } = await apiClient.post<Record<string, string>>(`/backup/slots/${slot.id}/load`);
        for (const key of characterKeys) { if (data[key] !== undefined) localStorage.setItem(key, data[key]); else localStorage.removeItem(key); }
        localStorage.setItem('pho-xom-started', 'yes');
        window.location.assign('/map');
      } else {
        const character: Record<string, string> = {};
        for (const key of characterKeys) { const value = localStorage.getItem(key); if (value !== null) character[key] = value; }
        await apiClient.put(`/backup/slots/${slot.id}`, character);
        const { data } = await apiClient.get<SaveSlot[]>('/backup/slots');
        setSlots(data); setMessage(`Đã lưu vào ô ${slot.id}.`);
      }
    } catch { setError('Không thể lưu hoặc mở bản lưu. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  return <section className="game-save-control" aria-labelledby="game-save-title" style={{ display: 'block' }}>
    <h2 id="game-save-title">Sao lưu tiến trình</h2>
    <p>Chọn một trong 5 ô để lưu trò chơi. Bấm Chơi bản lưu để tiếp tục từ thời điểm đã lưu.</p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {slots.map(slot => <div key={slot.id} className="save-slot">
      <div><strong>Ô lưu {slot.id}</strong><p>{slot.savedAt ? new Date(slot.savedAt).toLocaleString('vi-VN') : 'Chưa có bản lưu'}</p></div>
      <div className="save-slot-actions">
        {playing && <button type="button" disabled={busy || !ready} onClick={() => void act(slot, false)}>{slot.savedAt ? 'Lưu đè' : 'Lưu vào ô này'}</button>}
        <button type="button" disabled={busy || !ready || !slot.savedAt} onClick={() => void act(slot, true)}>Chơi bản lưu {slot.id}</button>
      </div>
    </div>)}
  </section>;
}
