import { useEffect, useRef } from 'react';
import { BUILDINGS, WORLD_SIZE } from '../game/world';
import { ThreeSceneRenderer } from '../game/rendering/ThreeSceneRenderer';

export function ThreeWorldCanvas({ onReady, onFallback }: { onReady?: () => void; onFallback?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current || typeof WebGLRenderingContext === 'undefined') { onFallback?.(); return; }
    let renderer: ThreeSceneRenderer;
    try {
      renderer = new ThreeSceneRenderer(host.current, { width: host.current.clientWidth || 800, height: host.current.clientHeight || 600, worldWidth: WORLD_SIZE.width, worldHeight: WORLD_SIZE.height });
      BUILDINGS.forEach(building => renderer.addBuilding(building));
      [{ x: 95, y: 465 }, { x: 1335, y: 465 }, { x: 535, y: 745 }, { x: 905, y: 875 }].forEach(point => renderer.addTree(point));
      onReady?.();
      const resize = () => renderer.resize(host.current?.clientWidth || 800, host.current?.clientHeight || 600);
      window.addEventListener('resize', resize); return () => { window.removeEventListener('resize', resize); renderer.dispose(); };
    } catch { host.current.replaceChildren(); onFallback?.(); return; }
  }, [onReady, onFallback]);
  return <div ref={host} className="three-world-canvas" aria-hidden="true" />;
}
