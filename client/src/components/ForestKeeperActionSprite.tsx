import { useEffect } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import type { CharacterGender, Facing } from '../game/character';
import { FOREST_RIG_ARTWORK } from '../game/forestRigArtwork';
import { FOREST_PROFILES, type ForestAction } from '../game/forestLocomotion';
import '../styles/forest-rig.css';

export type CharacterPreviewAction = ForestAction;

const preloaded = new Set<string>();
const rows: Record<Facing, number> = { down: 0, right: 1, up: 2, left: 3 };

// Every gender has its own 3D model and atlas. Rows are actual camera headings,
// not mirrored front views. Maps drive phase from travelled ground distance.
export function ForestKeeperActionSprite({ gender, action, facing = 'down', phase, portrait = false, mapScale = false, debug = false, className = '', svgProps = {} }: {
  gender: CharacterGender;
  action: CharacterPreviewAction;
  className?: string;
  facing?: Facing;
  phase?: number;
  portrait?: boolean;
  mapScale?: boolean;
  debug?: boolean;
  svgProps?: SVGProps<SVGSVGElement>;
}) {
  const artwork = FOREST_RIG_ARTWORK[gender];
  useEffect(() => {
    for (const src of Object.values(FOREST_RIG_ARTWORK[gender])) {
      if (!preloaded.has(src)) { preloaded.add(src); const image = new Image(); image.src = src; }
    }
  }, [gender]);
  const frames = action === 'idle' ? 1 : action === 'turn' ? 16 : 12;
  const row = action === 'turn' ? 0 : rows[facing];
  const controlled = phase !== undefined || action === 'idle' || portrait;
  const frame = Math.min(frames - 1, Math.floor(Math.max(0, phase ?? 0) * frames)) % frames;
  const duration = action === 'walk' ? FOREST_PROFILES[gender].walkSeconds : action === 'run' ? FOREST_PROFILES[gender].runSeconds : action === 'turn' ? 2.4 : 1.2;
  const style = {
    ...svgProps.style,
    '--forest-frames': frames, '--forest-width': `${frames * 256}px`, '--forest-duration': `${duration}s`,
  } as CSSProperties;
  const mapScaleX = facing === 'left' || facing === 'right' ? .7 : .55;
  const mapScaleY = gender === 'male' ? .82 : .77;
  const mapOffsetY = gender === 'male' ? -26 : -11;
  return <svg xmlns="http://www.w3.org/2000/svg" {...svgProps}
    viewBox={portrait ? '24 42 112 112' : mapScale ? '0 0 768 1024' : '0 0 160 224'}
    className={`player-sprite forest-rig-sprite forest-action-sprite action-${action} ${className}`} style={style}
    data-starting-character="forest-keeper" data-character-artwork="forest-rig-v2" data-map-scale={mapScale || undefined}
    data-preview-action={action} data-locomotion={action} data-gender={gender} data-facing={facing} data-facing-row={row} data-frame={controlled ? frame : undefined}
    aria-hidden="true" focusable="false">
    <g transform={mapScale ? 'scale(4.8 4.5714285714)' : undefined}>
      {!portrait && <ellipse className="forest-rig-shadow" cx="80" cy="212" rx="21" ry="4" fill="#49553b" opacity={action === 'jump' ? .10 : .17} />}
      <g transform={mapScale
        ? `translate(${80 - mapScaleX * 128} ${mapOffsetY}) scale(${mapScaleX} ${mapScaleY})`
        : 'translate(0 22) scale(.625)'} key={`${gender}-${action}`}>
        <svg width="256" height="320" viewBox="0 0 256 320" overflow="hidden">
          <g className={`forest-rig-frames${controlled ? ' is-controlled' : ''}`} style={controlled ? { transform: `translateX(${-frame * 256}px)` } : undefined}>
            <image className="forest-rig-artwork" href={artwork[action]} x="0" y={-row * 320}
              width={frames * 256} height={action === 'turn' ? 320 : 1280} preserveAspectRatio="xMidYMid meet" />
          </g>
        </svg>
      </g>
      {debug && <g className="outfit-alignment-debug" fill="none" stroke="#526e38" strokeWidth=".6"><rect x="1" y="1" width="158" height="222" /><path d="M0 212H160M80 0V224" strokeDasharray="3 3" /></g>}
    </g>
  </svg>;
}
