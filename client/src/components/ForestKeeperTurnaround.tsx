import type { SVGProps } from 'react';
import type { CharacterGender, Facing } from '../game/character';
import turnaround from '../../assets/characters/forest-keeper/turnaround-v2.png';
import '../styles/forest-rig.css';

// Each cell contains a complete, anatomically consistent uniform. Never place
// the previous body, limbs or clothing cutouts underneath this illustration.
const columns: Record<Facing, number> = { down: 0, right: 1, up: 2, left: 3 };
const centerOffsets = [56, 40, 0, 0];

export function ForestKeeperTurnaround({ gender, facing, portrait, walking = false, running = false, className, debug, svgProps }: {
  gender: CharacterGender;
  facing: Facing;
  portrait: boolean;
  walking?: boolean;
  running?: boolean;
  className: string;
  debug: boolean;
  svgProps: SVGProps<SVGSVGElement>;
}) {
  const column = columns[facing];
  const row = gender === 'male' ? 0 : 1;
  return <svg xmlns="http://www.w3.org/2000/svg"
    viewBox={portrait ? '152 28 464 464' : '0 0 768 1024'}
    className={`${className} forest-turnaround-sprite`}
    data-starting-character="forest-keeper"
    data-character-artwork="forest-keeper-v2"
    data-gender={gender}
    data-facing={facing}
    data-locomotion={running ? 'run' : walking ? 'walk' : 'idle'}
    aria-hidden="true" focusable="false" {...svgProps}>
    <g className={`forest-turnaround-motion${walking && !running ? ' is-walking' : ''}${running ? ' is-running' : ''}`}>
      <g className="sprite-body forest-turnaround-body">
        <g transform="translate(23.04 59.4) scale(.94)">
          <svg width="768" height="1008" viewBox="0 0 768 1008" overflow="hidden">
            <image className="forest-turnaround-artwork" href={turnaround}
              x={-column * 768 - centerOffsets[column]} y={-row * 1024}
              width="3072" height="2048" preserveAspectRatio="xMidYMid meet" />
          </svg>
        </g>
      </g>
    </g>
    {debug && <g className="outfit-alignment-debug" fill="none" stroke="#526e38" strokeWidth="2">
      <rect x="1" y="1" width="766" height="1022" />
      <path d="M384 0V1024M0 990H768" strokeDasharray="8 8" />
    </g>}
  </svg>;
}
