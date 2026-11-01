import { useEffect, type CSSProperties } from 'react';
import { useGameStore } from '../context/GameContext';

export function NotificationArea() {
  const { notification, clearNotification } = useGameStore();

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(clearNotification, 4000);
    return () => window.clearTimeout(timer);
  }, [notification, clearNotification]);

  if (!notification) return <div className="notification-area" aria-live="polite" />;

  return (
    <div className="notification-area" aria-live="polite">
      {notification.type === 'reward' && <div className="confetti-burst" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ '--piece': index, '--confetti-x': `${(index % 7 - 3) * 42}px`, '--confetti-y': `${90 + (index % 5) * 32}px`, '--confetti-rotation': `${index * 43}deg` } as CSSProperties} />)}</div>}
      <div className={`notification notification-${notification.type}${notification.type === 'drama' ? ' notification-drama' : ''}`} role="status">
        <span>{notification.message}</span>
        <button type="button" onClick={clearNotification} aria-label="Đóng thông báo">×</button>
      </div>
    </div>
  );
}
