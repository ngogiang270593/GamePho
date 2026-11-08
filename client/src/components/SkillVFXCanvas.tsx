import { useEffect, useRef } from 'react';
import { SkillVFXManager, type SkillVfxEffect } from '../game/skillVfx';

export function SkillVFXCanvas({ effect, reducedQuality = false }: { effect: SkillVfxEffect | null; reducedQuality?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const manager = useRef<SkillVFXManager | null>(null);
  const currentEffect = useRef(effect);
  const hasEffect = effect !== null;
  currentEffect.current = effect;

  useEffect(() => {
    if (!hasEffect || !host.current || typeof CanvasRenderingContext2D === 'undefined' || typeof ResizeObserver === 'undefined') return;
    try {
      const instance = new SkillVFXManager(host.current, reducedQuality);
      manager.current = instance;
      instance.setEffect(currentEffect.current);
      return () => {
        instance.dispose();
        manager.current = null;
      };
    } catch (error) {
      host.current.replaceChildren();
      console.error('Không khởi tạo được hiệu ứng Canvas 2D cho võ công.', error);
    }
  }, [hasEffect, reducedQuality]);

  useEffect(() => {
    manager.current?.setEffect(effect);
  }, [effect]);

  return <div ref={host} className="skill-vfx" data-skill={effect?.skill} data-phase={effect?.phase} aria-hidden="true" />;
}
