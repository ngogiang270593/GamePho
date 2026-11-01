import { useEffect, useState } from 'react';
import { getAchievementProgress } from '../services/gameService';
import type { Achievement } from '../services/gameTypes';
import { VillageIllustration } from '../components/VillageIllustration';

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAchievementProgress()
      .then(setAchievements)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải thành tựu.'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="village-page"><VillageIllustration kind="achievements" title="Bảng vàng của xóm" subtitle="MỖI TÔ ĐÚNG MÓN · MỘT DẤU ẤN NHỎ" />
    {loading ? <p>Đang kiểm tra thành tích...</p> : error ? <p role="alert">{error}</p> : achievements.length
      ? <div className="medal-wall">{achievements.map(item => <article className={`achievement-card${item.isUnlocked ? ' unlocked' : ''}`} key={item.id}><svg className="achievement-medal" viewBox="0 0 80 88" aria-hidden="true"><path d="M20 32L10 80L39 64L70 80L59 32" fill="#9ca67a" stroke="#7f8c64" strokeWidth="2" /><circle cx="40" cy="32" r="28" fill="#e0bd70" stroke="#b69856" strokeWidth="3" /><circle cx="40" cy="32" r="21" fill="#edce87" stroke="#ffdf9c" /><path d="M40 15L45 26L58 28L48 37L51 50L40 44L28 50L31 37L22 28L35 26Z" fill="#fff0b6" stroke="#c5a05b" /></svg><h2>{item.name}</h2><p>{item.description}</p><p>{Math.min(item.currentValue, item.targetValue)}/{item.targetValue}</p>{item.isUnlocked && <small>Đã mở khóa</small>}</article>)}</div>
      : <p>Chưa có thành tựu.</p>}
  </section>;
}
