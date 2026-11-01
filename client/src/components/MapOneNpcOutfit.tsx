import type { MapOneNpcVisualDesign } from '../game/mapOneNpcDesign';
import type { Facing } from '../game/character';

export function MapOneNpcOutfit({ design, facing, skin }: { design: MapOneNpcVisualDesign; facing: Facing; skin: string }) {
  const side = facing === 'left' || facing === 'right';
  const halfShoulder = 24 * design.shoulderWidth * design.bodyWidth;
  const left = 80 - halfShoulder;
  const right = 80 + halfShoulder;
  const hem = design.outfit === 'light-armor' || design.outfit === 'guard-armor' ? 184 : 197;
  const main = design.outfitColor;
  const light = design.accentColor;
  return <g className={`sprite-torso map-one-costume outfit-${design.outfit}`} data-outfit={design.outfit}>
    <path d={`M70 115L69 135Q80 143 91 135L90 115`} fill={skin} />
    <path d={side
      ? `M${left + 14} 132Q80 122 ${right - 10} 132L${right + 1} ${hem}Q80 ${hem + 8} ${left + 5} ${hem}Z`
      : `M${left} 132Q80 122 ${right} 132L${right + 8} ${hem}Q80 ${hem + 9} ${left - 8} ${hem}Z`}
    fill={main} stroke="#493c37" strokeWidth="2.2" strokeLinejoin="round" />
    <path d={side ? `M80 137L${design.outfit === 'noble-robe' ? 99 : 92} 145L86 189L72 191Z` : 'M80 137L97 147L88 191L72 191Z'}
      fill={light} stroke="#493c37" strokeWidth="1.5" />
    {design.outfit === 'light-armor' || design.outfit === 'guard-armor'
      ? <g stroke="#493c37" strokeWidth="1.5">
        <path d={`M${left - 5} 139Q80 128 ${right + 5} 139L${right} 164Q80 172 ${left} 164Z`} fill={light} />
        <path d={`M${left} 151H${right}M${left + 3} 159H${right - 3}`} fill="none" stroke="#f0d28a" strokeWidth="3" />
        <path d="M75 143L80 150L85 143" fill="none" stroke="#f5e5bb" strokeWidth="2" />
      </g>
      : design.outfit === 'smith-apron'
        ? <g stroke="#493c37" strokeWidth="1.5"><path d="M65 143H95L101 187Q80 195 59 187Z" fill="#624f43" /><path d="M68 158H92M68 177H92" stroke={light} /></g>
        : design.outfit === 'messenger-vest'
          ? <g fill="none" stroke={light} strokeWidth="3"><path d="M63 139L75 153L80 195M97 139L85 153L80 195" /><path d="M68 160L92 160" /></g>
          : design.outfit === 'healer-robe'
            ? <g fill="none" stroke={light} strokeWidth="2"><path d={`M${left - 6} 177Q80 188 ${right + 6} 177`} /><path d="M80 143V190M74 151H86" /></g>
            : <g fill="none" stroke={light} strokeWidth="2"><path d={`M${left - 5} 174Q80 183 ${right + 5} 174`} /><path d="M80 145V190" /></g>}
    <path d={side ? 'M48 167L62 166' : 'M36 166L50 172'} stroke={light} strokeWidth="2" />
    <path d={side ? 'M48 169L62 168L63 180Q58 187 52 180Z' : 'M36 169L49 175L45 185Q38 190 33 182Z'} fill={skin} stroke="#493c37" strokeWidth="1.5" />
    <path d={side ? 'M92 169L107 166L111 179Q105 187 98 181Z' : 'M111 169L126 165L129 179Q123 187 116 181Z'} fill={skin} stroke="#493c37" strokeWidth="1.5" />
    <path d={`M${left - 2} 138Q80 149 ${right + 2} 138`} fill="none" stroke={design.accentColor} strokeWidth="4" />
  </g>;
}
