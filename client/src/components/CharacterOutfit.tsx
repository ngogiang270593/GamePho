import type { CharacterAppearance, Facing } from '../game/character';
import { getOutfitPalette } from '../game/outfits';
import forestKeeperJacket from '../../assets/characters/forest-keeper/items/ao.png';

interface CharacterOutfitProps { appearance: CharacterAppearance; facing: Facing; skin: string; cloth: string; itemId?: string; seated?: boolean }

export function CharacterOutfit({ appearance, facing, skin, cloth, itemId, seated = false }: CharacterOutfitProps) {
  const outfit = appearance.outfit;
  const palette = getOutfitPalette(outfit, appearance.gender);
  const side = facing === 'left' || facing === 'right';
  const back = facing === 'up';
  const male = appearance.gender === 'male';
  const short = outfit === 'baba' || outfit === 'apron';
  const forest = outfit === 'forest';
  const wide = outfit === 'nhatbinh';
  const fourPanels = outfit === 'tuthan';
  const hem = short || forest ? 177 : 195;

  function Flower({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
    return <g transform={`translate(${x} ${y}) scale(${size})`} fill={palette.trim} stroke="none">
      {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy="-4" rx="2.2" ry="4" transform={`rotate(${angle})`} />)}<circle r="2" fill="#f9ebc5" />
    </g>;
  }

  function Lotus({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
    return <g transform={`translate(${x} ${y}) scale(${size})`} fill={palette.trim} stroke="none">
      <path d="M0 0C-12-8-11-17-8-20C-1-17 1-8 0 0M0 0C12-8 11-17 8-20C1-17-1-8 0 0M0 0C-8-13-4-23 0-26C4-23 8-13 0 0M-1 1C-15 0-20-8-19-12C-9-12-4-6-1 1M1 1C15 0 20-8 19-12C9-12 4-6 1 1" />
      <path d="M-16 5Q0-2 16 5Q0 11-16 5" opacity=".7" />
    </g>;
  }

  function Sleeve() {
    if (forest) {
      if (!side && !back) {
        return <path d="M33 173L47 179L43 187Q36 189 31 182Z" fill={skin} />;
      }
      return <>
        <path
          d={side ? 'M58 134Q45 135 43 151L45 168L62 172L69 143Z' : 'M56 132Q43 133 39 149L34 168L50 176L63 146Z'}
          fill={cloth}
          stroke="#3e4d32"
          strokeWidth="1.5"
        />
        <path d={side ? 'M44 161L62 164L61 174L45 171Z' : 'M35 162L51 169L47 179L32 173Z'} fill="#879565" stroke="#3e4d32" strokeWidth="1.4" />
        <path d={side ? 'M47 165L60 168' : 'M36 166L48 172'} fill="none" stroke="#b0b17a" strokeWidth="1.3" />
        <path d={side ? 'M48 143L45 157' : 'M45 142L40 157'} fill="none" stroke="#3e4d32" strokeWidth="1" opacity=".65" />
        <path
          d={side ? 'M45 171L60 174L59 181Q53 187 47 181Z' : 'M33 173L47 179L43 187Q36 189 31 182Z'}
          fill={skin}
        />
      </>;
    }
    return <>
      <path d={seated
        ? side ? 'M59 135Q47 136 45 150L59 162L75 153L70 142' : 'M56 132Q45 132 40 145L55 157L71 151L65 139'
        : wide
        ? side ? 'M61 134Q45 130 39 145L26 173L48 185L72 147' : 'M56 132Q40 131 34 148L22 176L47 186L65 147'
        : side ? 'M58 135Q46 135 46 154L48 171L63 169L69 142' : 'M56 132Q45 132 40 147L34 170L48 177L61 148'} fill={cloth} />
      {wide ? <g transform={side ? 'translate(43 173) rotate(27)' : 'translate(37 174) rotate(27)'} stroke="none">
        {['#d5bd74', '#799477', '#eaccc0', '#a3544e', '#6a8396'].map((color, i) => <rect key={color} x="-12" y={-9 + i * 3} width="25" height="3" fill={color} />)}
        <path d="M-12-10H13M-12 7H13" stroke={palette.trim} strokeWidth="1.5" fill="none" />
      </g> : <path d={side ? 'M48 167L62 166' : 'M36 166L50 172'} stroke={palette.trim} strokeWidth={outfit === 'baba' ? 1.3 : 2.4} />}
      <path d={wide
        ? side ? 'M30 174L42 180L38 188Q29 192 27 183Z' : 'M26 174L39 180L35 189Q26 192 23 184Z'
        : seated ? side ? 'M53 153L68 149L75 159Q71 167 64 163Z' : 'M51 150L67 147L76 157Q73 165 65 161Z'
          : side ? 'M48 169L62 168L63 180Q58 187 52 180Z' : 'M36 169L49 175L45 185Q38 190 33 182Z'} fill={skin} />
    </>;
  }

  return <g className={`sprite-torso outfit-${outfit}`} data-layer="clothes" data-outfit={outfit} data-item-id={itemId} transform={male ? 'translate(-8 0) scale(1.1 1)' : undefined}>
    <path d="M70 115L69 135Q80 143 91 135L90 115" fill={skin} />
    {fourPanels && <path d={side ? 'M63 151L55 198Q81 204 109 198L98 151Z' : 'M57 150L38 198Q80 208 122 198L103 150Z'} fill="#3c3d42" />}
    {!short && !forest && <g className="sprite-coattails">
      <path d={side ? 'M66 148L51 192Q66 199 84 193L84 148Z' : 'M53 147L38 193Q58 202 78 193L81 148L107 149L122 193Q105 200 95 194Z'} fill={palette.dark} />
      <path d={side ? 'M55 189L75 193' : 'M42 190L62 195M102 195L118 191'} fill="none" stroke={palette.trim} strokeWidth="1.2" />
    </g>}
    <path d={side
      ? `M59 132Q78 122 94 132L${wide ? 115 : 106} ${hem}Q82 ${hem + 7} 57 ${hem}Z`
      : `M56 131Q80 123 104 131L${wide ? 124 : short || forest ? 111 : 114} ${hem}Q80 ${hem + 8} ${wide ? 36 : short || forest ? 49 : 46} ${hem}Z`} fill={cloth}
      stroke={forest ? '#3e4d32' : undefined} strokeWidth={forest ? '1.7' : undefined} />

    {fourPanels ? (back ? <g fill="none" stroke={palette.trim} strokeWidth="1.2"><path d="M70 132L63 191M90 132L98 191M52 190Q80 196 108 190" /><path d="M51 151Q80 160 109 151" stroke="#afba78" strokeWidth="5" /></g> : <g>
      <path d={side ? 'M80 151H97L107 198Q87 204 65 199Z' : 'M65 151H95L110 199Q80 206 50 199Z'} fill="#373b42" stroke="none" />
      <path d={side ? 'M85 130L96 137L95 156H78L80 138Z' : 'M80 128L96 137L95 158H65L64 137Z'} fill="#d9829a" stroke="#9d6170" strokeWidth="1.3" />
      <path d={side ? 'M62 132L80 138L78 153L89 163L69 192L49 189Z' : 'M56 132L67 137L65 152L80 162L62 193L43 189ZM104 132L93 137L95 152L80 162L98 193L117 189Z'} fill={cloth} />
      <path d={side ? 'M79 137L76 152L86 161' : 'M66 137L63 152L76 161M94 137L97 152L84 161'} fill="none" stroke="#8d9d76" strokeWidth="4" />
      <path d="M55 153Q80 158 105 153L104 159Q80 164 56 159Z" fill="#e6bb72" strokeWidth="1" />
      <path d="M77 160L62 187L70 190L83 162M83 161L91 189L100 187L87 159" fill="#a5b779" stroke="#72815b" strokeWidth="1" />
      <path d="M77 158Q63 148 65 158Q72 166 80 159Q94 148 93 159Q86 165 80 159" fill="#c9c68c" strokeWidth="1.2" />
    </g>) : wide ? <g>
      {!back && <>
        <path d={side ? 'M83 127H104V156H83Z' : 'M63 126H97V157H63Z'} fill={palette.trim} stroke="#9d784c" strokeWidth="1" />
        <path d={side ? 'M87 127H98V149H87Z' : 'M70 126H90V149H70Z'} fill="#f4e3bd" stroke={palette.dark} strokeWidth="1" />
        <path d={side ? 'M90 128H96V143H90Z' : 'M75 126H85V144H75Z'} fill={palette.dark} stroke="none" />
        {[131, 140, 150].map(y => <g key={y} fill={palette.main} stroke="none"><circle cx={side ? 85 : 66} cy={y} r="1.3" /><circle cx={side ? 102 : 94} cy={y} r="1.3" /></g>)}
        <path d="M75 155Q80 148 85 155Q80 162 75 155M79 158L75 172M82 158L87 171" stroke={palette.trim} strokeWidth="2" fill="none" />
      </>}
      {(side ? [[73, 170], [99, 177]] : [[54, 158], [105, 163], [61, 179], [98, 181], [80, 188]]).map(([x, y]) => <Flower key={`${x}-${y}`} x={x} y={y} size={.75} />)}
      <path d={side ? 'M59 188Q68 182 78 188T108 188M59 193Q72 188 82 193T110 193' : 'M41 188Q51 181 61 188T81 188T101 188T120 188M40 194Q50 188 60 194T80 194T100 194T121 194'} fill="none" stroke={palette.trim} strokeWidth="1.7" />
    </g> : forest ? <g className="forest-jacket-details" fill="none" stroke="#3e4d32" strokeWidth="1.5" strokeLinejoin="round">
      {back ? <>
        <path d="M56 137Q80 145 104 137M80 143V174" stroke="#b0b17a" strokeWidth="1.2" />
        <path d="M62 145L55 172M98 145L105 172" opacity=".7" />
      </> : <>
        <path d="M54 134L64 130L79 140L71 153L57 146ZM106 134L96 130L81 140L89 153L103 146Z" fill="#879565" />
        <path d="M54 134L64 130L79 140L71 153L57 146ZM106 134L96 130L81 140L89 153L103 146Z" />
        <path d="M57 134L51 131M103 134L109 131M80 140V176" />
        <path d="M56 150Q65 147 74 151L73 165Q65 168 56 164ZM86 151Q95 147 104 150L104 164Q95 168 87 165Z" fill="#738353" />
        <path d="M58 153Q65 151 72 153M88 153Q95 151 102 152M65 154V164M95 154V164" stroke="#b0b17a" strokeWidth="1" />
        <path d="M56 164Q65 168 74 165M86 165Q95 168 104 164" />
        {[143, 154, 165, 174].map(y => <g key={y} fill="#a96f43" stroke="#493c37" strokeWidth="1">
          <circle cx="80" cy={y} r={y === 143 || y === 174 ? 2 : 2.4} />
        </g>)}
        {[143, 154, 165, 174].map(y => <circle key={`shine-${y}`} cx="79.3" cy={y - .7} r=".65" fill="#f1d09a" stroke="none" />)}
      </>}
    </g> : <g>
      {back ? <>
        <path d={side ? 'M67 134L83 138L94 133' : 'M66 132Q80 141 94 132'} fill="none" stroke={palette.trim} strokeWidth="1.4" />
        <path d={`M80 144V${hem - 2}`} fill="none" stroke={palette.dark} strokeWidth="1.3" />
        {(outfit === 'aodai' || outfit === 'lotus') && <Lotus x={80} y={181} size={.52} />}
        {outfit === 'apron' && <path d="M52 158H108M81 159Q63 145 66 161Q72 170 81 159Q101 145 97 164Q87 170 81 159L75 175M81 159L89 177" fill="none" stroke={palette.trim} strokeWidth="1.5" />}
      </> : <>
        {outfit === 'baba' || outfit === 'apron' ? <path d={side ? 'M78 128Q82 139 92 131' : 'M69 128Q80 142 91 128'} fill="none" stroke={palette.trim} strokeWidth="1.6" /> : <path d={side ? 'M77 126L91 126L94 137L81 140Z' : 'M69 125Q80 131 91 125L93 136Q80 143 67 136Z'} fill={cloth} stroke={palette.trim} strokeWidth="1.4" />}
        {outfit === 'baba' ? <g>
          <path d="M80 141V176" fill="none" stroke={palette.trim} strokeWidth="1" />
          {[144, 151, 158, 165, 172].map(y => <circle key={y} cx={80} cy={y} r="1.4" fill={palette.trim} stroke="none" />)}
          <path d="M54 158H68V170H54ZM92 158H106V170H92Z" fill="none" stroke={palette.dark} strokeWidth="1.3" />
        </g> : outfit === 'apron' ? <g>
          <path d="M60 135L64 153H96L100 135M64 149L58 179Q80 187 103 179L96 149Z" fill="#f8e7bd" />
          <path d="M69 162Q80 157 91 162L89 174H71Z" fill="#e5ca9c" strokeWidth="1.3" /><path d="M73 157Q80 151 87 157" fill="none" stroke="#be684e" />
          <path d="M76 151Q70 146 77 141M85 151Q79 146 86 141" stroke="#fff3d9" fill="none" strokeWidth="2" />
        </g> : outfit === 'nguthan' ? <g>
          <g transform={side ? undefined : 'translate(160 0) scale(-1 1)'}>
          <path d={side ? 'M85 135L93 143L101 192' : 'M82 135L100 143L110 192'} fill="none" stroke={palette.trim} strokeWidth="1.3" />
          {(side ? [[87, 135], [92, 142], [94, 153], [96, 165], [98, 177]] : [[86, 135], [99, 142], [103, 153], [106, 165], [108, 177]]).map(([x, y]) => <g key={y}><path d={`M${x - 3} ${y}H${x + 2}`} stroke={palette.trim} strokeWidth="1.5" /><circle cx={x + 2} cy={y} r="1.7" fill={palette.trim} stroke="none" /></g>)}
          </g>
          <path d="M55 188Q80 194 107 189M61 149Q75 145 84 151" fill="none" stroke={palette.trim} strokeWidth=".8" opacity=".5" />
        </g> : <g>
          <path d="M84 136L100 143L104 165" fill="none" stroke={palette.trim} strokeWidth=".8" opacity=".8" />
          <Lotus x={side ? 87 : 67} y={183} size={.48} /><Lotus x={99} y={193} size={.26} />
          <path d="M59 188Q68 182 67 171M94 187Q88 179 97 170" stroke={palette.trim} strokeWidth="1" fill="none" />
          {outfit === 'aodai' && [[91, 153], [58, 158], [100, 178]].map(([x, y]) => <Flower key={y} x={x} y={y} size={.3} />)}
        </g>}
      </>}
    </g>}
    {forest && !back && !side && <image
      className="forest-jacket-reference"
      href={forestKeeperJacket}
      x="31"
      y="124"
      width="98"
      height="59"
      preserveAspectRatio="none"
    />}
    {!fourPanels && !wide && !short && !forest && <path d={side ? 'M62 192Q83 197 104 192' : 'M50 192Q80 199 110 192'} fill="none" stroke={palette.trim} strokeWidth="1.3" />}
    <g className="sprite-arm sprite-arm-left"><Sleeve /></g>
    {!side && <g className="sprite-arm sprite-arm-right"><g transform="translate(160 0) scale(-1 1)"><Sleeve /></g></g>}
  </g>;
}
