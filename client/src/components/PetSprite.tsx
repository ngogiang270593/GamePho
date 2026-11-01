import { memo, type SVGProps } from 'react';
import type { Facing, PetKind } from '../game/character';

interface PetSpriteProps extends SVGProps<SVGSVGElement> {
  pet: PetKind;
  facing?: Facing;
  walking?: boolean;
}

export const PetSprite = memo(function PetSprite({ pet, facing = 'down', walking = false, className = '', ...props }: PetSpriteProps) {
  const back = facing === 'up';
  const side = facing === 'right' || facing === 'left';
  const rabbit = pet === 'rabbit';
  const dog = pet === 'dog';
  const fur = rabbit ? '#f1ebdd' : dog ? '#d6a365' : '#c88f57';
  const light = rabbit ? '#fffaf0' : dog ? '#f5d6a1' : '#f4d9ac';
  const ink = rabbit ? '#8c8072' : '#73543d';
  const headX = side ? 62 : 50;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 112" className={`pet-sprite pet-${pet}${walking ? ' is-walking' : ''} facing-${facing} ${className}`} aria-hidden="true" focusable="false" {...props}>
    {pet === 'none' ? <g fill="none" stroke="#b6ad93" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="55" cy="57" r="36" strokeDasharray="4 5" /><path d="M41 66Q47 47 55 52Q67 47 72 66Q66 78 55 72Q43 78 41 66Z" fill="#dfd9c7" stroke="none" />
      <ellipse cx="38" cy="48" rx="5" ry="8" /><ellipse cx="50" cy="38" rx="5" ry="8" /><ellipse cx="64" cy="39" rx="5" ry="8" /><ellipse cx="75" cy="49" rx="5" ry="8" />
      <path d="M28 88L82 25" stroke="#aa9e81" strokeWidth="3" />
    </g> : <>
      <ellipse cx="55" cy="102" rx="33" ry="5" fill="#56654b" opacity=".19" />
      <g transform={facing === 'left' ? 'translate(110 0) scale(-1 1)' : undefined} stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <g className="pet-body">
          {!rabbit && <path className="pet-tail" d={dog ? 'M31 84Q6 87 14 67Q21 61 24 69' : 'M29 84Q5 86 14 61Q20 53 24 61Q26 67 19 70'} fill="none" stroke={fur} strokeWidth={dog ? 13 : 10} />}
          <g className="pet-paw pet-paw-left"><path d="M31 84L28 98Q28 105 41 102L44 87" fill={fur} /><path d="M30 99H38" stroke={light} strokeWidth="3" /></g>
          <g className="pet-paw pet-paw-right"><path d="M63 84L65 99Q68 105 80 101L76 85" fill={fur} /><path d="M68 99H76" stroke={light} strokeWidth="3" /></g>
          <ellipse cx="53" cy="80" rx={rabbit ? 26 : 28} ry="20" fill={fur} />
          {!back && <ellipse cx={side ? 66 : 54} cy="83" rx="14" ry="13" fill={light} stroke="none" />}
          {rabbit && <circle cx={side ? 27 : 53} cy={back ? 87 : 83} r="10" fill="#fff9ef" />}
          <g className="pet-paw pet-paw-left"><path d={side ? 'M57 85L55 99Q56 105 69 102L71 86' : 'M36 87L34 99Q36 106 48 102L50 88'} fill={fur} /><path d={side ? 'M58 100H66' : 'M38 100H45'} stroke={light} strokeWidth="3" /></g>
          <g className="pet-paw pet-paw-right"><path d={side ? 'M75 85L77 99Q79 105 90 101L88 85' : 'M62 88L61 100Q64 106 77 102L75 87'} fill={fur} /><path d={side ? 'M80 100H87' : 'M65 100H72'} stroke={light} strokeWidth="3" /></g>
          {dog && <path d={side ? 'M45 71Q66 82 82 69' : 'M28 69Q52 83 78 69'} fill="none" stroke="#bc6952" strokeWidth="6" />}
          {rabbit ? <g className="pet-ears" fill={fur}>
            <path d={`M${headX - 17} 50Q${headX - 38} 3 ${headX - 23} 7Q${headX - 10} 13 ${headX - 7} 47Z`} />
            <path d={`M${headX + 3} 46Q${headX + 4} -1 ${headX + 19} 6Q${headX + 29} 17 ${headX + 14} 49Z`} />
            <path d={`M${headX - 18} 37Q${headX - 29} 9 ${headX - 22} 15L${headX - 12} 40M${headX + 8} 38Q${headX + 9} 8 ${headX + 16} 14L${headX + 12} 41`} fill="none" stroke="#e1b2a6" strokeWidth="6" />
          </g> : !dog && <g fill={fur}>
            <path d={`M${headX - 25} 49L${headX - 27} 23Q${headX - 10} 25 ${headX - 6} 39Z`} />
            <path d={`M${headX + 8} 38Q${headX + 17} 24 ${headX + 28} 23L${headX + 27} 51Z`} />
            <path d={`M${headX - 22} 41L${headX - 22} 30L${headX - 13} 37M${headX + 15} 37L${headX + 23} 30L${headX + 22} 43`} fill="#d5a18a" stroke="none" />
          </g>}
          <path d={rabbit ? `M${headX - 26} 53Q${headX - 27} 31 ${headX} 34Q${headX + 30} 33 ${headX + 28} 56Q${headX + 28} 77 ${headX} 78Q${headX - 28} 77 ${headX - 26} 53Z` : `M${headX - 27} 52Q${headX - 28} 29 ${headX} 31Q${headX + 29} 28 ${headX + 29} 53Q${headX + 31} 76 ${headX} 77Q${headX - 30} 76 ${headX - 27} 52Z`} fill={fur} />
          {dog && <g className="pet-ears" fill="#ac784e"><path d={`M${headX - 17} 34Q${headX - 37} 25 ${headX - 35} 58Q${headX - 27} 73 ${headX - 20} 54Z`} /><path d={`M${headX + 19} 33Q${headX + 37} 24 ${headX + 35} 58Q${headX + 28} 74 ${headX + 22} 54Z`} /></g>}
          {!rabbit && !dog && <g fill="none" stroke="#98653e" strokeWidth="4"><path d={`M${headX - 10} 35L${headX - 8} 44M${headX} 33V42M${headX + 10} 35L${headX + 8} 44M${headX - 26} 56L${headX - 19} 59M${headX + 26} 56L${headX + 20} 59`} /></g>}
          {!back && <g>
            {side ? <ellipse cx={headX + 13} cy="53" rx="8" ry="6" fill={light} stroke="none" /> : <path d={`M${headX - 17} 56Q${headX} 48 ${headX + 18} 56L${headX + 16} 67Q${headX} 78 ${headX - 16} 67Z`} fill={light} stroke="none" />}
            <g className="pet-eyes" fill="#3d3838" stroke="none">
              {(side ? [headX + 10] : [headX - 11, headX + 11]).map(x => <g key={x}><ellipse cx={x} cy="53" rx="3.5" ry="5.3" /><circle cx={x - 1} cy="51" r="1.1" fill="#fff5db" /></g>)}
            </g>
            <path d={side ? `M${headX + 23} 59Q${headX + 32} 55 ${headX + 30} 63L${headX + 25} 65Z` : `M${headX - 5} 61Q${headX} 58 ${headX + 5} 61L${headX} 66Z`} fill={rabbit ? '#d0918b' : '#5b4037'} stroke="none" />
            <path d={side ? `M${headX + 22} 68Q${headX + 27} 71 ${headX + 29} 67` : `M${headX} 66V69M${headX - 7} 68Q${headX - 3} 74 ${headX} 69Q${headX + 4} 74 ${headX + 8} 68`} strokeWidth="1.5" fill="none" />
            {!dog && <path d={side ? `M${headX + 12} 65L${headX + 3} 62M${headX + 12} 69L${headX + 2} 71` : `M${headX - 19} 65L${headX - 31} 62M${headX - 19} 69L${headX - 31} 72M${headX + 20} 65L${headX + 32} 62M${headX + 20} 69L${headX + 32} 72`} fill="none" strokeWidth="1.2" />}
          </g>}
          {dog && !back && <g><circle cx={side ? 74 : 54} cy="78" r="4.5" fill="#e6c17a" strokeWidth="1.2" /><path d={side ? 'M74 76V80' : 'M54 76V80'} strokeWidth="1" /></g>}
        </g>
      </g>
    </>}
  </svg>;
});
