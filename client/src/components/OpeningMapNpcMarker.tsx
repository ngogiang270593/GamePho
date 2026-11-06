import { useEffect, useRef } from 'react';
import { OpeningMapNpcArtwork } from './OpeningMapNpcArtwork';
import { NPC_WORK_SPRITE_ACTION, useAppliedSpriteSheet, type SpriteAction } from '../game/characterSpriteSheet';
import type { Facing } from '../game/character';
import type { OpeningMapNpc } from '../game/openingMapNpcs';
import type { Point } from '../game/world';

export function OpeningMapNpcMarker({ npc, selected, showLocationLabel, interactionLabel, onInteract, onPosition, visionRange }: {
  npc: OpeningMapNpc;
  selected: boolean;
  showLocationLabel: boolean;
  interactionLabel: string;
  onInteract: () => void;
  visionRange?: number;
  onPosition: (id: string, point: Point, facing: Facing) => void;
}) {
  const sheet = useAppliedSpriteSheet(`opening-map-npc:${npc.id}`);
  const workClip = sheet?.clips[NPC_WORK_SPRITE_ACTION];
  const hasFrontAction = (workClip?.directions.down.count ?? 0) >= 4;
  const spriteAction: SpriteAction = hasFrontAction ? NPC_WORK_SPRITE_ACTION : 'idle';
  const spriteFacing: Facing = hasFrontAction ? 'down' : npc.facing;
  const point = npc.point;
  const facing = npc.facing;
  const visionRotation = facing === 'right' ? 90 : facing === 'down' ? 180 : facing === 'left' ? 270 : 0;
  const visionStartX = -Math.sin(Math.PI / 6) * (visionRange ?? 0);
  const visionStartY = -Math.cos(Math.PI / 6) * (visionRange ?? 0);
  const visionEndX = Math.sin(Math.PI / 6) * (visionRange ?? 0);
  const visionEndY = visionStartY;
  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;
  useEffect(() => onPositionRef.current(npc.id, npc.point, npc.facing), [npc.id, npc.point.x, npc.point.y, npc.facing]);

  const scale = npc.scale;
  return <g className={`opening-map-npc-marker${selected ? ' is-selected' : ''}`}
    data-npc-id={npc.id}
    data-npc-x={Math.round(point.x)}
    data-npc-y={Math.round(point.y)}
    data-patrolling="false"
    data-npc-action={spriteAction}
    transform={`translate(${point.x} ${point.y})`}
    role="button"
    tabIndex={0}
    aria-label={`${interactionLabel}${npc.name}`}
    onClick={event => { event.stopPropagation(); onInteract(); }}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        onInteract();
      }
    }}>
    {visionRange !== undefined && <path
      className="opening-map-npc__vision"
      data-vision-range={visionRange}
      d={`M0 0L${visionStartX} ${visionStartY}A${visionRange} ${visionRange} 0 0 1 ${visionEndX} ${visionEndY}Z`}
      transform={`rotate(${visionRotation})`}
      aria-hidden="true"
    />}
    <ellipse cx="0" cy="0" rx="22" ry="7" fill="#243c3044" />
    <foreignObject x={-44 * scale} y={-110 * scale} width={88 * scale} height={120 * scale} className="opening-map-npc">
      <div className={`opening-map-npc__body opening-map-npc__body--${npc.design.bodyType}`} role="img" aria-label={npc.name}>
        <OpeningMapNpcArtwork npcId={npc.id} className="opening-map-npc__sprite" appearance={npc.appearance} design={npc.design} artwork={npc.artwork} pose={npc.pose} facing={spriteFacing} action={spriteAction} />
        <span>{npc.name}</span>
      </div>
    </foreignObject>
    {showLocationLabel && npc.locationLabel && <text x="0" y="35" className="opening-map-npc__location" textAnchor="middle">{npc.locationLabel}</text>}
  </g>;
}
