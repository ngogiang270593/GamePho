import { useEffect, useId, useRef, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

interface MapDialogProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  onClose: () => void;
  className?: string;
  closeLabel?: string;
}

export function MapDialog({ title, subtitle, onClose, children, className = '', closeLabel = 'Trở lại map' }: MapDialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<div className="map-modal-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} className={`world-location-panel ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
        if (event.key !== 'Tab') return;
        event.stopPropagation();
        const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])]
          .filter(control => !control.closest('[inert]') && control.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
      }}>
      <header className="location-panel-heading"><div><span>MỘT GÓC XÓM MÌNH</span><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="location-panel-close" onClick={onClose} aria-label={closeLabel}>← <span>{closeLabel}</span><kbd>Esc</kbd></button></header>
      <div className="location-panel-content">{children}</div>
    </div>
  </div>, document.body);
}
