import type { CSSProperties, SVGProps } from 'react';
import type { Facing } from '../game/character';
import actionAtlas from '../../assets/characters/forest-keeper/male-map-walk-v1.png';
import '../styles/forest-rig.css';

const rows: Record<Facing, number> = { down: 0, up: 1, left: 2, right: 3 };

export function ForestKeeperMapActionSprite({ action, facing, className, svgProps }: {
  action: 'walk' | 'run';
  facing: Facing;
  className: string;
  svgProps: SVGProps<SVGSVGElement>;
}) {
  const row = rows[facing];
  const style = {
    ...svgProps.style,
    '--forest-map-duration': action === 'run' ? '.42s' : '.72s',
  } as CSSProperties;

  return <svg xmlns="http://www.w3.org/2000/svg" {...svgProps}
    viewBox="0 0 768 1024"
    className={`player-sprite forest-action-sprite forest-map-action-sprite action-${action} ${className}`}
    style={style}
    data-starting-character="forest-keeper"
    data-character-artwork="forest-keeper-male-map-actions-v1"
    data-gender="male"
    data-facing={facing}
    data-facing-row={row}
    data-preview-action={action}
    data-locomotion={action}
    aria-hidden="true" focusable="false">
    <g transform="translate(169 0) scale(.56 1)">
      <svg width="768" height="1024" viewBox="0 0 96 128" overflow="hidden">
        <g className="forest-map-action-frames">
          <image className="forest-map-action-artwork" href={actionAtlas}
            x="0" y={-row * 128} width="288" height="512" />
        </g>
      </svg>
    </g>
  </svg>;
}
