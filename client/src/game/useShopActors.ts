import { useEffect, useRef, useState } from 'react';
import type { Facing } from './character';
import type { Point } from './world';
import { deliveryPath, directionBetween, pointOnPath, SHOP_DURATION, type ShopLayout, type ShopMoment } from './shop';

export interface ShopActor { id: string; point: Point; facing: Facing; moving: boolean }
interface MotionPlan { id: string; path: Point[]; duration: number; facing: Facing; offset?: number }

export function useShopActors(layout: ShopLayout, customerIds: number[], activeId: number | undefined, moment: ShopMoment) {
  const current = useRef<ShopActor[]>([]);
  const previousLayout = useRef(layout);
  const [frame, setFrame] = useState<{ actors: ShopActor[]; progress: number }>({ actors: [], progress: 0 });
  const ids = customerIds.join(',');
  useEffect(() => {
    const reduced = document.documentElement.dataset.motion === 'reduced' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const resized = previousLayout.current !== layout;
    previousLayout.current = layout;
    const old = new Map((resized ? [] : current.current).map(actor => [actor.id, actor]));
    const phase = moment.phase;
    const phaseElapsed = Math.max(0, Date.now() - moment.startedAt);
    const cookingPoint = { x: phase === 'pouring' ? layout.pot.x + 30 : phase === 'ready' || phase === 'plating' ? layout.counter.x + layout.counter.width - 37 : layout.noodles.x, y: layout.home.y };
    const atTable = ['carrying', 'handoff', 'tasting', 'happy', 'unhappy', 'drama', 'calming', 'calmed'].includes(phase);
    const chefTarget = atTable ? layout.delivery : ['blanching', 'blanched', 'pouring', 'plating', 'ready'].includes(phase) ? cookingPoint : layout.home;
    const chefFrom = old.get('chef')?.point ?? (phase === 'carrying' ? { x: layout.counter.x + layout.counter.width - 37, y: layout.home.y } : atTable || phase === 'leaving' ? layout.delivery : chefTarget);
    let chefPath: Point[] = [chefFrom, chefTarget];
    if (phase === 'carrying') chefPath = [chefFrom, ...deliveryPath(layout).slice(1)];
    if (phase === 'leaving' || !atTable && Math.abs(chefFrom.y - layout.home.y) > 80) chefPath = [chefFrom, ...deliveryPath(layout).slice(0, -1).reverse(), chefTarget];
    const plans: MotionPlan[] = [{ id: 'chef', path: chefPath, duration: phase === 'carrying' ? SHOP_DURATION.carrying : phase === 'leaving' ? SHOP_DURATION.leaving : 420, facing: atTable ? 'right' : 'down', offset: resized && (phase === 'carrying' || phase === 'leaving') ? phaseElapsed : 0 }];
    let queueIndex = 0;
    customerIds.forEach(id => {
      const key = `guest-${id}`;
      const active = id === activeId;
      const destination = active ? phase === 'leaving' ? layout.door : layout.seat : layout.queue[queueIndex++ % layout.queue.length];
      const from = old.get(key)?.point ?? (resized && phase !== 'arriving' && phase !== 'leaving' ? destination : active && phase === 'leaving' ? layout.seat : { x: layout.door.x + queueIndex * 50, y: layout.door.y });
      const path = [from];
      if (active && phase === 'arriving') {
        const aisle = layout.seat.x + (layout.compact ? -190 : 170);
        path.push({ x: aisle, y: from.y }, { x: aisle, y: layout.seat.y });
      }
      if (active && phase === 'leaving') path.push({ x: layout.seat.x + 165, y: layout.seat.y });
      path.push(destination);
      plans.push({ id: key, path, duration: active && phase === 'leaving' ? SHOP_DURATION.leaving : active && phase === 'arriving' ? SHOP_DURATION.arriving : 850, facing: active ? 'down' : 'left', offset: resized && active && (phase === 'leaving' || phase === 'arriving') ? phaseElapsed : 0 });
    });
    let request = 0;
    const start = Date.now();
    const phaseDuration = SHOP_DURATION[phase as keyof typeof SHOP_DURATION] ?? 1;
    function animate() {
      const elapsed = Date.now() - start;
      const next = plans.map(plan => {
        const progress = reduced ? 1 : Math.min(1, (elapsed + (plan.offset ?? 0)) / plan.duration);
        const point = pointOnPath(plan.path, progress);
        const previous = current.current.find(actor => actor.id === plan.id);
        const moving = progress < 1 && Math.hypot(point.x - (previous?.point.x ?? plan.path[0].x), point.y - (previous?.point.y ?? plan.path[0].y)) > .01;
        return { id: plan.id, point, moving, facing: moving ? directionBetween(previous?.point ?? plan.path[0], point, plan.facing) : plan.facing };
      });
      const progress = Math.min(1, Math.max(0, (Date.now() - moment.startedAt) / phaseDuration));
      const changed = next.length !== current.current.length || next.some((actor, i) => { const p = current.current[i]; return !p || actor.point.x !== p.point.x || actor.point.y !== p.point.y || actor.moving !== p.moving || actor.facing !== p.facing; });
      current.current = next;
      setFrame(previous => changed || previous.progress !== progress ? { actors: next, progress } : previous);
      if (elapsed < Math.max(phaseDuration, ...plans.map(plan => plan.duration)) + 50) request = requestAnimationFrame(animate);
    }
    request = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(request);
  }, [layout, ids, activeId, moment.phase, moment.startedAt]);
  return frame;
}
