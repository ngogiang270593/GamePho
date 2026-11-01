import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CharacterSprite, type CharacterEmotion, type CharacterPose } from './CharacterSprite';
import { PetSprite } from './PetSprite';
import { DiningTable, KitchenCounter, PhoBowl, ShopRoom } from './ShopArt';
import { isReaction, shopLayout, type ShopLayout, type ShopMoment } from '../game/shop';
import { useShopActors } from '../game/useShopActors';
import type { CharacterAppearance } from '../game/character';
import type { Customer, PhoOrder } from '../services/gameTypes';
import { CustomerSprite } from './CustomerSprite';
import { NeighborSprite } from './NeighborSprite';
import { WorldAtmosphere } from './WorldAtmosphere';
import { getCustomerTimeRemaining } from './CustomerCard';

interface ShopSceneProps {
  appearance: CharacterAppearance; customers: Customer[]; active: Customer | null; moment: ShopMoment; order: PhoOrder | null;
  toppings: string[]; phoType?: number; canSelect: boolean; onSelect: (customer: Customer) => void;
  onInspect?: () => void; speechVisible?: boolean; speechId?: string;
  workBowls?: { slot: number; phoType: number; toppings: string[]; broth: boolean }[];
  fire?: string;
  children: (layout: ShopLayout) => ReactNode;
}

export function ShopScene({ appearance, customers, active, moment, order, toppings, phoType, canSelect, onSelect, onInspect, speechVisible, speechId, children, workBowls, fire }: ShopSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 1200, height: 650 });
  useEffect(() => {
    const measure = () => { const rect = root.current?.getBoundingClientRect(); if (rect?.width && rect.height) setBounds({ width: rect.width, height: rect.height }); };
    measure(); const observer = new ResizeObserver(measure); if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const layout = useMemo(() => shopLayout(bounds.width, bounds.height), [bounds.width, bounds.height]);
  const people = useMemo(() => [...(active ? [active] : []), ...customers.filter(c => c.id !== active?.id).slice(0, 3)], [active, customers]);
  const { actors, progress } = useShopActors(layout, people.map(c => c.id), active?.id, moment);
  const { phase } = moment;
  const chef = actors.find(actor => actor.id === 'chef');
  const entities: { id: string; depth: number; node: ReactNode }[] = [
    { id: 'counter', depth: layout.counter.y + 83, node: <KitchenCounter layout={layout} blanching={phase === 'blanching'} pouring={phase === 'pouring'} toppings={toppings} phoType={phoType} bowlReady={!workBowls && ['blanched', 'pouring', 'plating', 'ready'].includes(phase)} broth={phase !== 'blanched'} /> },
    { id: 'table', depth: layout.table.y + 22, node: <DiningTable {...layout.table} /> },
  ];
  if (chef) {
    const pose: CharacterPose = phase === 'carrying' ? 'carry' : phase === 'handoff' || phase === 'calming' ? 'offer' : phase === 'blanching' || phase === 'pouring' ? 'stir' : phase === 'happy' || phase === 'calmed' ? 'cheer' : 'idle';
    entities.push({ id: 'chef', depth: chef.point.y, node: <g transform={`translate(${chef.point.x} ${chef.point.y})`} data-testid="shop-chef" data-x={chef.point.x.toFixed(1)} data-y={chef.point.y.toFixed(1)} data-pose={pose}>
      <CharacterSprite x={-55} y={-147} width="110" height="154" appearance={appearance} facing={chef.facing} walking={chef.moving} pose={pose} emotion={phase === 'drama' || phase === 'unhappy' ? 'surprised' : phase === 'happy' || phase === 'calmed' ? 'happy' : 'neutral'} />
      {phase === 'carrying' && <g className="carried-bowl" transform="translate(32 -34) scale(.58)"><PhoBowl toppings={toppings} phoType={phoType} /></g>}
      {phase === 'calming' && <g transform="translate(34 -35)"><path d="M-14-10H14V9Q0 17-14 9Z" fill="#c9d4b4" stroke="#789078" strokeWidth="2" /><path d="M14-6Q29-8 25 2Q24 8 14 7M0-18Q-6-25 0-33" fill="none" stroke="#a7b699" strokeWidth="2" /></g>}
    </g> });
  }
  people.forEach(person => {
    const actor = actors.find(item => item.id === `guest-${person.id}`);
    if (!actor) return;
    const selected = active?.id === person.id;
    const canInteract = selected ? Boolean(onInspect) && phase !== 'leaving' : canSelect;
    const interact = () => { if (selected) onInspect?.(); else if (canSelect) onSelect(person); };
    const showPatience = !selected || !isReaction(phase) && !['tasting', 'calming', 'leaving'].includes(phase);
    const secondsLeft = getCustomerTimeRemaining(person);
    const upset = selected && (phase === 'unhappy' || phase === 'drama' || phase === 'expired');
    const emotion: CharacterEmotion = upset ? 'angry' : selected && (phase === 'happy' || phase === 'calmed') ? 'happy' : !selected && phase === 'drama' ? 'surprised' : 'neutral';
    const pose: CharacterPose = upset ? 'complain' : selected && phase === 'tasting' ? 'eat' : selected && (phase === 'happy' || phase === 'calmed') ? 'cheer' : selected && (phase === 'arriving' || phase === 'choosing') ? 'order' : !selected && phase === 'drama' ? 'gossip' : 'idle';
    entities.push({ id: actor.id, depth: actor.point.y, node: <g transform={`translate(${actor.point.x} ${actor.point.y})`} className={`shop-guest${selected ? ' is-selected' : ''}`} data-testid="shop-guest" data-customer={person.id} data-active={selected} data-x={actor.point.x.toFixed(1)} data-y={actor.point.y.toFixed(1)} data-emotion={emotion}
      role="button" tabIndex={canInteract ? 0 : -1} aria-disabled={!canInteract} aria-label={selected ? `Xem lại lời của ${person.name}` : `Gọi món cho ${person.name}`} aria-expanded={selected ? speechVisible : undefined} aria-controls={selected && speechVisible ? speechId : undefined} onClick={() => { if (canInteract) interact(); }} onKeyDown={event => { if (canInteract && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); interact(); } }}>
      {selected && <ellipse cy="3" rx="42" ry="13" fill="#f8e7a8" opacity=".85" />}
      <CustomerSprite x={selected ? -57 : -47} y={selected ? -154 : -126} width={selected ? 114 : 94} height={selected ? 159.6 : 131.6} customer={person} facing={actor.facing} walking={actor.moving} emotion={emotion} pose={pose} />
      {selected && phase === 'tasting' && <g className="shop-eating-chopsticks" transform="translate(0 -42)" stroke="#816444" strokeWidth="2.5" strokeLinecap="round" fill="none"><path d="M-18 4L20-13M-13 10L24-7" /><path d="M20-12Q28 1 17 15M24-8Q33 8 21 19" stroke="#f4ddb0" strokeWidth="2" /></g>}
      <g className={`shop-guest-name${selected ? ' active-guest-label' : ''}`} transform={`translate(0 ${selected ? -174 : -145})`}>
        <rect x="-80" y="-12" width="160" height={showPatience ? 39 : 24} rx="11" fill={selected ? '#fff1cf' : '#fff5de'} stroke="#b2a481" />
        <text x={selected ? -8 : 0} y="2" textAnchor="middle" fontSize="12" fontWeight="850" fill="#34432a">{person.name.length > 20 ? person.name.slice(0, 19) + '…' : person.name}</text>
        {selected && <g transform="translate(67 -1)" fill="#8c9c72"><path d="M-8-7H8V4H1L-4 8V4H-8Z" stroke="#8c9c72" strokeWidth="1" /><path d="M-4-2H4" stroke="#fff5d9" strokeWidth="2" /></g>}
        {showPatience && <><path d="M-57 16H36" stroke="#ded0a6" strokeWidth="4" strokeLinecap="round" /><path d={`M-57 16H${-57 + 93 * Math.max(0, Math.min(1, secondsLeft / Math.max(1, person.patience)))}`} stroke={secondsLeft < 20 ? '#b76850' : '#8da077'} strokeWidth="4" strokeLinecap="round" /><text x="63" y="19" textAnchor="middle" fontSize="11" fontWeight="800" fill={secondsLeft < 20 ? '#b76850' : '#839166'}>{secondsLeft}s</text></>}
      </g>
      {selected && upset && <g className="shop-anger-puff" transform="translate(53 -135)" stroke="#bb6853" strokeWidth="4" fill="none"><path d="M-10 0H-3V-9M3-9V0H11M-10 7H-3V15M3 15V7H11" /></g>}
      <rect x="-50" y="-160" width="100" height="170" rx="15" fill="transparent" />
    </g> });
  });
  if (appearance.pet !== 'none') entities.push({ id: 'pet', depth: layout.counter.y + 175, node: <PetSprite x={layout.counter.x + 10} y={layout.counter.y + 110} width="70" height="71" pet={appearance.pet} /> });

  return <div ref={root} className={`shop-scene shop-phase-${phase}`} data-fire={fire} role="region" aria-label="Quán phở 2D · bếp và bàn khách">
    <svg className="shop-scene-svg" viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="Chủ quán nấu phở và phục vụ khách trong quán Việt Nam">
      <ShopRoom layout={layout} />
      {phase === 'drama' && <g className="shop-drama-burst" transform={`translate(${layout.seat.x} ${layout.seat.y - 85})`}><path d="M0-115L25-78L70-100L69-55L120-45L91-9L125 28L76 39L76 86L30 69L0 111L-23 73L-75 91L-73 43L-120 29L-94-9L-119-49L-72-59L-68-102L-24-78Z" fill="#e6c481" stroke="#b27f64" strokeWidth="3" opacity=".5" /></g>}
      {entities.sort((a, b) => a.depth - b.depth).map(entity => <g key={entity.id}>{entity.node}</g>)}
      {workBowls?.map(b => <g key={b.slot} transform={`translate(${layout.counter.x + layout.counter.width * (.56 + (b.slot - 1) * .25)} ${layout.counter.y + 10}) scale(.65)`}><PhoBowl phoType={b.phoType} toppings={b.toppings} broth={b.broth} /><circle cy="45" r="11" fill="#fff4d6" stroke="#8f7150" /><text y="49" textAnchor="middle" fontSize="13" fontWeight="800" fill="#55472f">{b.slot}</text></g>)}
      {['handoff', 'tasting', 'happy', 'unhappy', 'drama', 'calming', 'calmed'].includes(phase) && <g data-testid="served-bowl" transform={phase === 'handoff' && chef ? `translate(${chef.point.x + 32 + (layout.table.x - chef.point.x - 32) * progress} ${chef.point.y - 34 + (layout.table.y - 42 - chef.point.y + 34) * progress - Math.sin(progress * Math.PI) * 45}) scale(.67)` : `translate(${layout.table.x} ${layout.table.y - 42}) scale(.67)`}><PhoBowl toppings={toppings} phoType={phoType} /></g>}
      {(phase === 'drama' || phase === 'calming' || phase === 'calmed') && [0, 1].map((index) => <g key={index} className="shop-onlooker" data-testid="drama-onlooker" transform={`translate(${layout.compact ? 640 - index * 35 : 1130 - index * 110} ${layout.compact ? layout.height * (.51 + index * .31) : layout.height * (.45 + index * .16)})`}>
        <NeighborSprite npcId={index ? 'co-ba' : 'chu-tu'} x="-44" y="-117" width="88" height="123.2" facing="left" emotion={phase === 'calmed' ? 'happy' : 'surprised'} pose={phase === 'calmed' ? 'cheer' : 'gossip'} />
        {index === 0 && phase === 'drama' && <g className="shop-phone" transform="translate(-30 -43) rotate(-12)"><rect x="-9" y="-18" width="18" height="31" rx="4" fill="#52695e" stroke="#374d47" strokeWidth="2" /><rect x="-6" y="-13" width="12" height="19" rx="2" fill="#c4d0b2" /><circle cy="9" r="1.8" fill="#e3d6af" /><circle cy="-23" r="4" fill="#dba660" /></g>}
      </g>)}
      {isReaction(phase) && <g className={`shop-reaction-particles particles-${phase}`} transform={`translate(${layout.seat.x} ${layout.seat.y - 105})`} aria-hidden="true">
        {Array.from({ length: phase === 'happy' || phase === 'calmed' ? 7 : 4 }, (_, i) => <g key={i} transform={`translate(${(i % 2 ? 1 : -1) * (65 + i * 10)} ${-i * 14})`} style={{ animationDelay: `${i * 90}ms` }}><path d={phase === 'happy' || phase === 'calmed' ? 'M0 5C-24-9-5-24 0-12C8-25 24-10 0 5' : 'M-3-16H3V-3H-3ZM-3 3H3V9H-3Z'} fill={phase === 'happy' || phase === 'calmed' ? '#c68174' : '#b58159'} /></g>)}
        {phase === 'happy' && order && <text className="shop-coins-float" y="-50" textAnchor="middle" fill="#4e7e54" stroke="#fff5d9" strokeWidth="6" paintOrder="stroke" fontSize="27" fontWeight="900">+{order.moneyChange.toLocaleString('vi-VN')}đ</text>}
      </g>}
    </svg>
    <WorldAtmosphere indoors />
    {children(layout)}
  </div>;
}
