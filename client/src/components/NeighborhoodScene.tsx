import { memo, type ReactNode } from 'react';
import { BUILDINGS, type HistoricalLandscape, type MapBuilding } from '../game/world';
import { HISTORY_MENU_PLACES } from '../game/suVietMap';
import { MAP_ONE_LAYOUT_SCALE, MAP_ONE_WORLD_SIZE, MAP_ONE_ZONES } from '../game/mapOneMap';

export const NeighborhoodGround = memo(function NeighborhoodGround({ id, label = 'HẺM 28', landscape }: { id: string; label?: string; landscape?: HistoricalLandscape }) {
  const historic = Boolean(landscape);
  return <g>
    <defs>
      <pattern id={`${id}-grass`} width="64" height="56" patternUnits="userSpaceOnUse">
        <rect width="64" height="56" fill="#9fb77b" /><path d="M9 15L12 10L14 15M42 38L45 33L48 38" fill="none" stroke="#78986a" strokeWidth="1.4" opacity=".6" />
        <circle cx="28" cy="45" r="1.7" fill="#c3ce8f" /><circle cx="52" cy="12" r="1.3" fill="#d2dba1" />
      </pattern>
      <pattern id={`${id}-paving`} width="80" height="54" patternUnits="userSpaceOnUse">
        <rect width="80" height="54" fill="#e0c99f" /><path d="M0 27H80M40 0V27M0 27V54M80 27V54" fill="none" stroke="#cbb48f" strokeWidth="1" />
        <path d="M3 30H77M43 3H77M3 3H37" fill="none" stroke="#f2dfb7" strokeWidth="1.5" opacity=".65" />
        <path d="M57 43L64 45M16 14L23 15" stroke="#b7a184" strokeWidth="1" opacity=".5" />
      </pattern>
      <pattern id={`${id}-tiles`} width="20" height="16" patternUnits="userSpaceOnUse"><rect width="20" height="16" fill="#d5c9aa" /><path d="M0 0H20V16H0Z" stroke="#b8b29b" strokeWidth="1" fill="none" /></pattern>
      <linearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b6d7bd" /><stop offset=".45" stopColor="#70a99d" /><stop offset="1" stopColor="#477d7b" /></linearGradient>
      <pattern id={`${id}-ripples`} width="96" height="42" patternUnits="userSpaceOnUse"><path d="M4 20Q24 10 44 20T84 20M22 34Q42 25 62 34" fill="none" stroke="#d7ead0" strokeWidth="2" opacity=".42" /></pattern>
      <linearGradient id="map-water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b6d7bd" /><stop offset=".45" stopColor="#70a99d" /><stop offset="1" stopColor="#477d7b" /></linearGradient>
      <pattern id="map-ripples" width="96" height="42" patternUnits="userSpaceOnUse"><path d="M4 20Q24 10 44 20T84 20M22 34Q42 25 62 34" fill="none" stroke="#d7ead0" strokeWidth="2" opacity=".42" /></pattern>
    </defs>
    <rect width={landscape === 'me-linh' ? MAP_ONE_WORLD_SIZE.width : 1440} height={landscape === 'me-linh' ? MAP_ONE_WORLD_SIZE.height : 1040} fill={landscape === 'bach-dang' ? '#88af9c' : landscape === 'dien-bien' ? '#8fae84' : `url(#${id}-grass)`} />
    <g transform={landscape === 'me-linh' ? `scale(${MAP_ONE_LAYOUT_SCALE})` : undefined}>
    {landscape === 'me-linh' && <g aria-hidden="true"><path d="M75 310Q290 260 500 310T930 300T1370 330V505Q1130 455 910 510T470 500T75 515Z" fill="#b3c58a" /><path d="M116 820Q320 740 510 820T900 810T1325 835V1000H116Z" fill="#b5c77f" /><ellipse cx="1120" cy="790" rx="190" ry="80" fill="#70a99a" /><ellipse cx="1120" cy="790" rx="156" ry="59" fill="#8fc2a8" /><path d="M1000 790q34-50 67 0q34-50 67 0q34-50 67 0" fill="none" stroke="#698a5b" strokeWidth="9" /></g>}
    {landscape === 'bach-dang' && <g aria-hidden="true"><path d="M0 400Q250 330 455 420T900 415T1440 394V770Q1190 840 960 746T500 755T0 785Z" fill="#4d91a0" /><path d="M0 449Q250 380 455 469T900 465T1440 444M0 710Q250 640 455 730T900 725T1440 704" fill="none" stroke="#aed5c4" strokeWidth="11" opacity=".8" /><path d="M240 600Q310 520 380 590Q450 655 515 565Q585 500 660 610" fill="none" stroke="#d7c58d" strokeWidth="23" /></g>}
    {landscape === 'lam-son' && <g aria-hidden="true"><path d="M0 360L150 205L270 360L420 165L610 373L775 220L920 374L1090 180L1285 370L1440 225V590H0Z" fill="#718f68" /><path d="M0 438L190 292L345 435L525 252L710 438L900 305L1080 440L1270 260L1440 410V640H0Z" fill="#90aa70" /><path d="M0 500Q250 450 470 530T920 515T1440 550" fill="none" stroke="#d7bb83" strokeWidth="27" /></g>}
    {landscape === 'dong-da' && <g aria-hidden="true"><path d="M0 155Q340 100 650 168T1440 145V420Q1110 365 780 428T0 410Z" fill="#f3d9b4" /><path d="M0 185Q340 132 650 198T1440 175" fill="none" stroke="#f4b1a6" strokeWidth="15" /><path d="M100 830Q340 760 550 825T980 810T1360 840V1000H100Z" fill="#a5b96e" /><circle cx="1160" cy="290" r="95" fill="#f4d28a" opacity=".8" /></g>}
    {landscape === 'dien-bien' && <g aria-hidden="true"><path d="M0 430L190 220L350 415L560 155L785 440L1010 205L1210 418L1370 240L1440 325V670H0Z" fill="#5f806c" /><path d="M0 495L240 315L445 505L680 260L900 505L1125 322L1325 510L1440 425V735H0Z" fill="#77956f" /><path d="M35 700Q360 620 625 700T1190 705T1440 680M35 755Q360 675 625 755T1190 760T1440 735M35 810Q360 730 625 810T1190 815T1440 790" fill="none" stroke="#d2bd7a" strokeWidth="18" /></g>}
    <path d="M58 78H1382V962H58Z" fill={historic ? 'transparent' : `url(#${id}-tiles)`} stroke="#758a68" strokeWidth="7" />
    {!historic && <><path d="M80 347H1360V675H968V945H390V675H80Z" fill={`url(#${id}-paving)`} stroke="#b49d7c" strokeWidth="3" />
      <path d="M117 382H1318M416 703V913M945 704V913" fill="none" stroke="#f3e1bb" strokeWidth="4" opacity=".6" />
      {/* Quy hoạch giao thông: trục đường chính, vỉa hè và các nút giao nằm dưới toàn bộ scenery. */}
      <path d="M80 515H1360M720 347V945" fill="none" stroke="#8a8f78" strokeWidth="92" opacity=".46" />
      <path d="M80 515H1360M720 347V945" fill="none" stroke="#d8c89f" strokeWidth="76" />
      <path d="M80 515H1360M720 347V945" fill="none" stroke="#756f61" strokeWidth="56" />
      <path d="M80 515H1360M720 347V945" fill="none" stroke="#9a9480" strokeWidth="2" strokeDasharray="18 16" opacity=".8" />
      <path d="M80 467H1360M80 563H1360M672 347V945M768 347V945" fill="none" stroke="#eee2bf" strokeWidth="5" opacity=".9" />
      <g fill="#c7b58e" opacity=".9"><rect x="92" y="454" width="1268" height="8" rx="4" /><rect x="92" y="568" width="1268" height="8" rx="4" /><rect x="664" y="359" width="8" height="574" rx="4" /><rect x="768" y="359" width="8" height="574" rx="4" /></g>
      <path d="M125 90H550V326H125ZM587 86H890V323H587ZM976 77H1300V326H976ZM76 681H375V945H76Z" fill="#7c986c" opacity=".4" />
      <path d="M495 775Q529 738 571 774L587 930H482Z" fill="#97ae75" /><path d="M859 779Q916 780 961 837V945H863Z" fill="#a0b47c" />
      <path d="M1020 701Q1172 660 1327 718V927H1006Z" fill="#8da370" /></>}
    {historic && <><path d="M0 495Q300 450 565 505T1080 500T1440 480" fill="none" stroke="#e5d2a4" strokeWidth="77" /><path d="M0 495Q300 450 565 505T1080 500T1440 480" fill="none" stroke="#f2e4bf" strokeWidth="5" strokeDasharray="12 15" />
      <path d="M92 92H1350V950H92Z" fill="none" stroke="#d5d4a0" strokeWidth="12" opacity=".5" />
      {landscape === 'bach-dang' && <path d="M1050 705L1090 690L1110 825M1170 690L1210 676L1230 810M1290 680L1325 670L1345 795" fill="none" stroke="#79593e" strokeWidth="12" />}
      {landscape === 'dong-da' && <g fill="#e69d9d"><circle cx="130" cy="665" r="16" /><circle cx="180" cy="700" r="13" /><circle cx="1250" cy="630" r="17" /><circle cx="1300" cy="680" r="13" /><circle cx="650" cy="900" r="13" /></g>}</>}
    {landscape === 'me-linh' && <>
      <path d="M520 495Q505 565 430 620T355 805M610 505Q650 570 745 610T930 690M930 690Q1010 745 1085 825T1190 925M520 495Q465 450 420 420M745 610Q770 680 785 765" fill="none" stroke="#d3bb90" strokeWidth="27" strokeLinecap="round" />
      <path d="M520 495Q505 565 430 620T355 805M610 505Q650 570 745 610T930 690M930 690Q1010 745 1085 825T1190 925M520 495Q465 450 420 420M745 610Q770 680 785 765" fill="none" stroke="#f0dfbd" strokeWidth="3" strokeDasharray="7 12" strokeLinecap="round" />
    </>}
    {/* A tiled courtyard, flowering borders and scattered fallen leaves. */}
    {Array.from({ length: 18 }, (_, i) => <g key={i} transform={`translate(${65 + i * 76} ${i % 2 ? 985 : 52})`}>
      <ellipse rx="29" ry="13" fill="#77986a" /><circle cx="-10" cy="-6" r="10" fill="#88a875" /><circle cx="10" cy="-7" r="12" fill="#88a875" />
      <circle cx={i % 3 * 6 - 5} cy="-10" r="3" fill={i % 2 ? '#e7ba8e' : '#f1d7a6'} />
    </g>)}
    {[{ x: 485, y: 350 }, { x: 890, y: 470 }, { x: 600, y: 610 }, { x: 950, y: 730 }, { x: 250, y: 535 }, { x: 790, y: 910 }].map(({ x, y }, i) => <path key={i} d={`M${x} ${y}q12-11 17-3q-7 12-17 3`} fill={i % 2 ? '#b59860' : '#8d9d62'} opacity=".7" />)}
    {!historic && <text x="733" y="546" textAnchor="middle" fill="#b19b79" fontSize="26" fontWeight="800" letterSpacing="6" transform="rotate(-3 733 546)">{label}</text>}
    {!historic && <g transform="translate(604 590)">
      <rect x="-7" y="7" width="294" height="160" rx="18" fill="#40574130" />
      <rect width="280" height="156" rx="16" fill="#fff2ca" stroke="#e69c53" strokeWidth="4" />
      <rect x="8" y="8" width="264" height="140" rx="11" fill="none" stroke="#efbc73" />
      <text x="140" y="29" textAnchor="middle" fill="#914533" fontSize="20" fontFamily="system-ui,sans-serif" fontWeight="800" letterSpacing="1">UNO XÓM ☺</text>
      <ellipse cx="140" cy="88" rx="100" ry="42" fill="#f3b66b" stroke="#ce7846" strokeWidth="7" />
      <ellipse cx="140" cy="84" rx="89" ry="33" fill="#83c9b3" stroke="#fff6d6" strokeWidth="1.5" />
      <text x="140" y="106" textAnchor="middle" fill="#285c53" fontSize="9" fontWeight="800" letterSpacing="2">CÒN MỘT LÁ? UNO!</text>
      {['#eb625a', '#4d9be4', '#f3bd42'].map((fill, index) => <g key={fill} transform={`translate(${114 + index * 21} 69) rotate(${index * 9 - 9})`}><rect width="21" height="30" rx="3" fill="#fff2d0" /><rect x="3" y="3" width="15" height="24" rx="2" fill={fill} /><text x="10" y="20" textAnchor="middle" fill="#fff6db" fontSize="13" fontWeight="900">{index + 7}</text></g>)}
      {[25, 255].map(x => <g key={x}><path d={`M${x} 35V133`} stroke="#ccae66" strokeWidth="3" /><circle cx={x} cy="44" r="7" fill="#ffe3a1" /><circle cx={x} cy="44" r="12" fill="#ffe3a11f" /></g>)}
      {[{x:59,y:130},{x:221,y:130}].map(({x,y}) => <g key={x} transform={`translate(${x} ${y})`}><ellipse rx="15" ry="6" fill="#b39050" /><path d="M-9 4V14M9 4V14" stroke="#cfaf68" strokeWidth="3" /></g>)}
      <text x="140" y="177" textAnchor="middle" fill="#3c5c45" fontSize="12" fontWeight="900" letterSpacing="1">BÀN UNO · ĐẤU MÁY & LẬP NHÓM</text>
    </g>}
    {historic && <g transform="translate(360 287)"><rect x="-145" y="-13" width="290" height="28" rx="14" fill="#fff6d8d9" stroke="#cdb987" strokeWidth="2" /><text className="map-ground-label" y="4" textAnchor="middle" fill="#6e603f" fontSize="11.5" fontWeight="900" letterSpacing="2">{label.toUpperCase()}</text></g>}
    </g>
    {landscape === 'me-linh' && MAP_ONE_ZONES.map(zone => <g key={zone.id} transform={`translate(${zone.point.x} ${zone.point.y})`} pointerEvents="none">
      <rect x="-108" y="-17" width="216" height="34" rx="14" fill="#fff7df" fillOpacity=".86" stroke="#9d845a" strokeWidth="2" />
      <text className="map-ground-label" textAnchor="middle" y="5" fontSize="13" fontWeight="950" letterSpacing=".8">{zone.name}</text>
    </g>)}
  </g>;
});

function Lantern({ x, y, color = '#c6503c' }: { x: number; y: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`} stroke="#714c39" strokeWidth="1.4">
    <path d="M0-19V-9" /><ellipse rx="13" ry="18" fill={color} /><path d="M-8-14Q-15 0-8 14M0-18V18M8-14Q15 0 8 14" fill="none" stroke="#f3c779" strokeWidth="1" opacity=".7" />
    <path d="M-7-17H7M-7 17H7M0 19V29" stroke="#e7ba6d" strokeWidth="3" />
  </g>;
}

function Flowerpot({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} stroke="#705746" strokeWidth="1.5">
    <ellipse cy="3" rx="17" ry="5" fill="#4a4f3730" stroke="none" /><path d="M-14-19H14L10 2Q0 9-10 2Z" fill="#b97650" /><ellipse cy="-19" rx="15" ry="5" fill="#d29466" />
    <path d="M0-18V-46M0-28Q-21-41-17-46Q-2-49 0-28M0-35Q15-56 20-47Q22-38 0-35" fill="#71895b" stroke="#4d7155" />
    {[{ x: -12, y: -45 }, { x: 7, y: -53 }, { x: 18, y: -39 }].map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y})`} fill="#f2c26c" stroke="none"><circle r="6" /><circle r="2" fill="#b77444" /></g>)}
  </g>;
}

function Building({ building }: { building: MapBuilding }) {
  const { x, y, width: w, height: h, title, subtitle, roof, color, id } = building;
  const side = '#876b55';
  return <g transform={`translate(${x} ${y})`} stroke="#715643" strokeWidth="2" strokeLinejoin="round">
    {/* Ground contact and a small extrusion give the flat artwork an orthographic, near-3D read. */}
    <ellipse cx={w / 2} cy={h + 8} rx={w * .56} ry="18" fill="#4f543c" opacity=".16" stroke="none" />
    <path d={`M${w - 3} 76L${w + 18} 64V${h - 3}L${w - 3} ${h}Z`} fill={side} opacity=".82" />
    <rect x="10" y="70" width={w + 4} height={h - 55} rx="6" fill="#4f543c" opacity=".17" stroke="none" />
    <path d={`M0 75H${w}V${h}H0Z`} fill={color} />
    <path d={`M0 75H${w}L${w + 18} 64L${w + 18} 79L${w} 90H0Z`} fill="#f1d28f" opacity=".56" stroke="none" />
    <path d={`M4 ${h - 14}H${w - 4}V${h}H4Z`} fill="#b59c7b" stroke="none" />
    <rect x={w / 2 - 37} y={h - 104} width="74" height="103" rx="3" fill="#665747" />
    <path d={`M${w / 2 - 32} ${h - 94}H${w / 2 + 32}V${h - 4}H${w / 2 - 32}Z`} fill="#483c36" stroke="#9b7754" strokeWidth="4" />
    <path d={`M${w / 2 - 25} ${h - 89}V${h - 6}M${w / 2 + 25} ${h - 89}V${h - 6}`} stroke="#ceb287" />
    {[26, w - 80].map((wx, i) => <g key={i}>
      <rect x={wx} y={h - 99} width="55" height="63" rx="2" fill="#526e68" stroke="#9d7452" strokeWidth="4" />
      <path d={`M${wx + 27} ${h - 96}V${h - 39}M${wx + 3} ${h - 68}H${wx + 52}`} stroke="#d6c090" />
      {[0, 1, 2, 3].map(n => <path key={n} d={`M${wx + 4} ${h - 92 + n * 8}H${wx + 23}M${wx + 31} ${h - 92 + n * 8}H${wx + 51}`} stroke="#88a08a" strokeWidth="2" />)}
      <rect x={wx - 4} y={h - 35} width="63" height="8" fill="#b0926e" />
    </g>)}
    <path d={`M-16 87L14 19Q${w / 2} -5 ${w - 14} 19L${w + 16} 87Z`} fill={roof} stroke="#694d40" strokeWidth="3" />
    {[0, 1, 2, 3].map(n => <path key={n} d={`M${6 - n * 5} ${35 + n * 14}Q${w / 2} ${18 + n * 17} ${w - 6 + n * 5} ${35 + n * 14}`} fill="none" stroke="#e9bc8b" opacity=".42" />)}
    {Array.from({ length: Math.floor(w / 22) }, (_, n) => <path key={n} d={`M${14 + n * 22} 21L${n * 24 - 5} 85`} fill="none" stroke="#593d36" opacity=".3" />)}
    <path d={`M-17 87Q${w / 2} 96 ${w + 17} 87`} fill="none" stroke="#573e35" strokeWidth="7" />
    <path d={`M${w / 2 - 52} ${h}H${w / 2 + 52}L${w / 2 + 43} ${h + 12}H${w / 2 - 43}Z`} fill="#a17c5b" />
    <path d={`M${w / 2 - 46} ${h + 14}H${w / 2 + 46}`} stroke="#e2c18b" strokeWidth="3" />
    <rect className="map-building-sign" x="16" y="96" width={w - 32} height="41" rx="8" />
    <text className="map-building-title" x={w / 2} y="123" textAnchor="middle" fill="#fff0c9" fontSize={id === 'tailor' ? 18 : 21} fontWeight="900" stroke="none" letterSpacing=".6">{title}</text>
    <rect className="map-ground-label-backplate" x={w / 2 - Math.min(w - 20, 240) / 2} y={h - 28} width={Math.min(w - 20, 240)} height="22" rx="8" />
    <text className="map-ground-label map-building-subtitle" x={w / 2} y={h - 13} textAnchor="middle" fill="#624f3d" fontSize="11" stroke="none" fontWeight="750">{subtitle}</text>
    <Lantern x={16} y={126} /><Lantern x={w - 16} y={126} />
    <Flowerpot x={16} y={h + 1} /><Flowerpot x={w - 17} y={h + 1} />
    {id === 'pho' && <g transform="translate(15 -5)">
      <path d="M0 4V70" stroke="#624e3e" strokeWidth="4" /><path d="M0 4Q25-1 46 8V40Q24 31 0 37Z" fill="#b84735" />
      <path d="M23 10L26 19L36 19L28 25L31 34L23 28L15 34L18 25L10 19H20Z" fill="#f8d474" stroke="none" />
    </g>}
  </g>;
}

function Tree({ x, y, variant = 0 }: { x: number; y: number; variant?: number }) {
  const palettes = [
    ['#527f5c', '#76a06a', '#d7c884'], ['#466f63', '#83a878', '#e0c58e'],
    ['#5d7950', '#9aaf6b', '#e8cf91'], ['#3f6d58', '#6e9c72', '#c7d99a'],
    ['#587563', '#8dae7a', '#e3b97f'], ['#4e7351', '#7fa56a', '#e7d19c'],
    ['#55705b', '#a2b66e', '#d8c18a'], ['#426b61', '#70a68a', '#efd39b'],
  ][variant % 8];
  return <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
    <ellipse cy="4" rx="67" ry="23" fill="#465e4733" />
    <path d="M-13 0L-9-94H12L16 0Q0 9-13 0" fill="#947352" stroke="#6c5840" strokeWidth="3" />
    <path d="M0-24L-3-72M-2-46L-22-65M5-59L21-79" fill="none" stroke="#b18a5b" strokeWidth="3" />
    <path d="M-64-75Q-83-120-47-132Q-48-166-13-165Q17-190 42-159Q81-156 76-124Q102-86 68-72Q45-53 19-64Q-3-48-24-63Q-49-51-64-75" fill={palettes[0]} stroke="#42684f" strokeWidth="3" />
    <path d="M-55-113Q-57-142-26-140Q-6-168 24-147Q53-151 59-126Q26-137 12-114Q-18-134-33-109Z" fill={palettes[1]} />
    <path d="M-57-86Q-35-66-16-83M23-84Q45-70 67-91" stroke="#8bac75" strokeWidth="3" fill="none" opacity=".7" />
    {[[-29, -130], [38, -133], [58, -103], [-48, -97], [3, -145]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="3" fill={palettes[2]} />)}
  </g>;
}

function Market() {
  return <g transform="translate(1015 455)" stroke="#6d5843" strokeWidth="2" strokeLinejoin="round">
    <ellipse cx="130" cy="159" rx="137" ry="14" fill="#59614526" stroke="none" />
    <path d="M5 30V153M241 30V153" strokeWidth="7" /><path d="M-15 56L10 0H239L267 56Z" fill="#e8ce98" />
    {[0, 1, 2, 3, 4].map(n => <path key={n} d={`M${n * 54 + 4} 0H${n * 54 + 29}L${n * 59 + 17} 57H${n * 59 - 10}Z`} fill="#809b79" stroke="none" />)}
    <path d="M-15 56H267" stroke="#667e60" strokeWidth="6" />
    <rect x="-2" y="103" width="254" height="45" rx="3" fill="#be9668" /><path d="M6 112H243M8 136H245" stroke="#986f50" />
    {[28, 91, 153].map((cx, i) => <g key={cx}><path d={`M${cx - 20} 82H${cx + 20}V99Q${cx} 110 ${cx - 20} 99Z`} fill={['#9cae9f', '#bb8f61', '#8d9b98'][i]} /><ellipse cx={cx} cy="82" rx="20" ry="5" fill="#dae0c5" /><path d={`M${cx - 24} 88H${cx - 19}M${cx + 19} 88H${cx + 24}`} strokeWidth="4" /></g>)}
    <path d="M206 102V73Q208 60 214 67V102M230 103V82M225 78H235V65H225Z" fill="#e6cf98" stroke="#81684e" strokeWidth="3" />
    <rect x="62" y="58" width="140" height="24" rx="3" fill="#f7dfab" />    <text className="map-ground-label" x="132" y="75" textAnchor="middle" fontSize="12" fontWeight="800" fill="#70523b" stroke="none">SẠP ĐỒ CHÚ TƯ</text>
  </g>;
}

function UnoTeaHouse({ x = 675, y = 560 }: { x?: number; y?: number } = {}) {
  return <g transform={`translate(${x} ${y})`} stroke="#79593e" strokeWidth="4" strokeLinejoin="round">
    <ellipse cx="92" cy="142" rx="103" ry="13" fill="#40574135" stroke="none" />
    <path d="M25 42V132M160 42V132" strokeWidth="7" />
    <path d="M0 47L23 3H162L185 47Z" fill="#d9a95f" />
    <path d="M9 43L27 9H55L47 47ZM61 47L68 9H96L99 47ZM113 47L109 9H139L157 47Z" fill="#527e68" stroke="none" />
    <path d="M0 47H185" stroke="#80543a" strokeWidth="7" />
    <rect x="17" y="77" width="151" height="48" rx="5" fill="#a96f46" />
    <path d="M22 91H162M22 111H162" stroke="#d7ad72" strokeWidth="3" />
    <rect x="35" y="53" width="115" height="24" rx="9" fill="#fff5d8" stroke="#9c7041" strokeWidth="2" />
    <text className="map-ground-label" x="92" y="70" textAnchor="middle" fill="#355b45" stroke="none" fontSize="13" fontWeight="950" letterSpacing=".4">QUÁN NƯỚC UNO</text>
    <ellipse cx="91" cy="82" rx="31" ry="10" fill="#e7d19c" stroke="#806044" strokeWidth="2" />
    <path d="M73 80Q75 67 91 68Q108 68 110 80V84Q92 91 73 84Z" fill="#75a99b" stroke="#537d6c" strokeWidth="2" />
    <path d="M80 66Q85 58 92 65M105 74Q117 70 118 77" fill="none" stroke="#537d6c" strokeWidth="3" />
    {[-16, 0, 16].map((x, index) => <g key={x} transform={`translate(${74 + x} 103) rotate(${(index - 1) * 9})`}><rect x="-7" y="-11" width="14" height="21" rx="3" fill={['#df6255', '#4b91ce', '#ddb443'][index]} stroke="#fff4d8" strokeWidth="2" /><text y="4" textAnchor="middle" fill="#fff" stroke="none" fontSize="10" fontWeight="900">{index + 1}</text></g>)}
  </g>;
}

function MenuHouse({ x, y, name, icon, color, roof }: { x: number; y: number; name: string; icon: string; color: string; roof: string }) {
  return <g transform={`translate(${x} ${y})`} stroke="#72543b" strokeWidth="3" strokeLinejoin="round">
    <ellipse cx="0" cy="5" rx="58" ry="10" fill="#43543a35" stroke="none" />
    <path d="M-39-5V-54H39V-5Z" fill={color} />
    <path d="M-49-51L0-88L49-51Z" fill={roof} />
    <path d="M-9-5V-35Q0-45 9-35V-5" fill="#78563c" strokeWidth="2" />
    <rect x="-28" y="-44" width="17" height="15" rx="3" fill="#d8e8d0" stroke="#718269" strokeWidth="2" />
    <rect x="11" y="-44" width="17" height="15" rx="3" fill="#d8e8d0" stroke="#718269" strokeWidth="2" />
    <rect x="-56" y="-104" width="112" height="25" rx="10" fill="#fff8e3" stroke="#a27e4e" strokeWidth="2" />
    <text className="map-ground-label" x="0" y="-87" textAnchor="middle" fill="#31533d" stroke="none" fontSize="11" fontWeight="950">{icon} {name}</text>
  </g>;
}

function Pond({ x = 1045, y = 720 }: { x?: number; y?: number } = {}) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx="128" cy="174" rx="132" ry="16" fill="#3f5d5038" />
    <rect x="0" y="13" width="255" height="167" rx="64" fill="#b2aa84" stroke="#7b876b" strokeWidth="4" />
    <rect x="9" y="22" width="237" height="148" rx="57" fill="url(#map-water)" stroke="#d7c89e" strokeWidth="6" />
    <rect x="16" y="29" width="223" height="134" rx="51" fill="url(#map-ripples)" opacity=".75" />
    <path d="M29 87Q66 75 106 87M152 129Q187 119 220 129M128 46Q161 38 196 47" stroke="#e2f0cf" strokeWidth="3" fill="none" opacity=".8" />
    {[[57, 61], [158, 97], [91, 125], [197, 60]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M-18 8Q-25-15 3-15Q29-8 18 12L0 6Z" fill="#648c63" stroke="#50795c" strokeWidth="1" />
      <path d="M2-1Q-17-7-11-18Q-1-16 2-1Q14-23 20-12Q21-4 2-1M2-1Q-4-26 3-28Q13-19 2-1" fill={i % 2 ? '#e1a3b0' : '#f3d0c6'} stroke="#bc8394" strokeWidth="1" />
      <ellipse cx="3" cy="0" rx="5" ry="2" fill="#e9c981" />
    </g>)}
  </g>;
}

function Bench() {
  return <g transform="translate(623 778)" stroke="#72583f" strokeWidth="3"><path d="M10 24V50M119 24V50" stroke="#4d655c" strokeWidth="6" /><rect y="3" width="133" height="29" rx="4" fill="#b18a5e" /><path d="M3 13H129M3 23H129" stroke="#d2ad75" /><rect x="-4" y="32" width="141" height="11" rx="3" fill="#ca9f69" /></g>;
}

function BulletinBoard() {
  return <g transform="translate(406 566)" stroke="#775a3d" strokeWidth="2" strokeLinejoin="round">
    <ellipse cx="39" cy="79" rx="49" ry="9" fill="#58603e25" stroke="none" />
    <path d="M9 48V81M69 48V81" strokeWidth="7" /><rect width="78" height="66" rx="4" fill="#a6774e" />
    <path d="M-8 1L38-18L86 1Z" fill="#9f5340" /><rect x="6" y="8" width="66" height="50" rx="2" fill="#e7d5a2" />
    <path d="M34 20H47V29Q47 39 41 39Q34 38 34 29ZM34 23H28Q26 34 35 33M47 23H53Q56 34 47 33M41 39V45M34 46H48" fill="#d6ac4c" stroke="#b78b42" strokeWidth="1.5" />
    <path d="M13 20H24M13 26H23M54 40H65M54 46H65" stroke="#ae9770" strokeWidth="2" /><circle cx="13" cy="46" r="4" fill="#bb6548" />
  </g>;
}

function LedgerDesk() {
  return <g transform="translate(540 322)" stroke="#796047" strokeWidth="2" strokeLinejoin="round">
    <path d="M8 36V57M49 36V57" strokeWidth="5" /><path d="M0 24H61V41H0Z" fill="#b68c5c" /><path d="M-4 24H66V31H-4Z" fill="#cfa670" />
    <path d="M8 10L28 7L32 12L36 7L55 10V25L35 22L32 25L28 22L8 25Z" fill="#fcf0c7" /><path d="M32 12V24M13 14L25 12M13 19L25 17M38 13L50 14M38 18L50 19" stroke="#b5a179" strokeWidth="1.3" />
    <path d="M52 0L46 18" stroke="#596c58" strokeWidth="3" /><rect x="-11" y="11" width="12" height="13" rx="3" fill="#dde0c2" />
  </g>;
}

function MemoryBox() {
  return <g transform="translate(974 927)" stroke="#6e5a42" strokeWidth="2" strokeLinejoin="round">
    <ellipse cy="2" rx="30" ry="7" fill="#58603e25" stroke="none" /><path d="M-6-12V0H7V-12" fill="#98704b" />
    <path d="M-21-48Q-21-62 0-62Q21-62 21-48V-12H-21Z" fill="#719580" /><path d="M-20-36H20M-8-52H8" stroke="#d4d8a9" strokeWidth="3" />
    <rect x="-13" y="-31" width="26" height="15" rx="2" fill="#f2e6be" /><path d="M-12-30L0-22L12-30" fill="none" stroke="#b39c70" strokeWidth="1.2" />
    <path d="M22-48H30V-64" stroke="#856a49" strokeWidth="3" /><path d="M29-64H43V-53H29Z" fill="#ba6950" />
  </g>;
}

function VillageWell({ x = 480, y = 788 }: { x?: number; y?: number } = {}) {
  return <g transform={`translate(${x} ${y})`} stroke="#756a54" strokeWidth="3" strokeLinejoin="round">
    <ellipse cy="15" rx="54" ry="15" fill="#58603e30" stroke="none" />
    <path d="M-46-5Q0-25 46-5V13Q0 31-46 13Z" fill="#b9b08d" />
    <ellipse cy="-5" rx="46" ry="15" fill="#d9d0ad" /><ellipse cy="-5" rx="31" ry="9" fill="#638879" stroke="#958d70" />
    <path d="M-37-22V-48M37-22V-48M-42-47H42M0-45V-21" fill="none" stroke="#795b3e" strokeWidth="5" />
    <path d="M-29-30H29" stroke="#e1cf9f" strokeWidth="3" />
    <rect className="map-ground-label-backplate" x="-54" y="31" width="108" height="23" rx="9" />
    <text className="map-ground-label" y="47" textAnchor="middle" fill="#435b3b" stroke="none" fontSize="13" fontWeight="900">GIẾNG LÀNG</text>
  </g>;
}

function VillageRiceField({ x = 945, y = 923 }: { x?: number; y?: number } = {}) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-78 3Q-34-12 0 1T78 0V57Q36 47 0 58T-78 53Z" fill="#d7bb69" stroke="#9e8a4d" strokeWidth="3" />
    {[-56, -28, 0, 28, 56].map((x, index) => <g key={x} transform={`translate(${x} ${index % 2 ? 19 : 12})`} stroke="#75834d" strokeWidth="2">
      <path d="M0 26V-8M0 1L-10-9M0 8L10-3M0 14L-9 5M0 19L10 11" fill="none" />
      {[-9, -3, 5, 11].map(y => <ellipse key={y} cx={y % 2 ? -7 : 7} cy={y} rx="3" ry="1.5" fill="#e2bb57" stroke="none" />)}
    </g>)}
    <rect className="map-ground-label-backplate" x="-55" y="59" width="110" height="23" rx="9" />
    <text className="map-ground-label" y="76" textAnchor="middle" fill="#435b3b" fontSize="13" fontWeight="900">RUỘNG LÚA</text>
  </g>;
}

function VillageWharf({ x = 1158, y = 878 }: { x?: number; y?: number } = {}) {
  return <g transform={`translate(${x} ${y})`} stroke="#765c3d" strokeWidth="2.5" strokeLinejoin="round">
    <path d="M-37-7V46M37-7V46" strokeWidth="5" />
    <path d="M-47 0H47V10H-47ZM-42 17H42V27H-42ZM-37 34H37V44H-37Z" fill="#bb925b" />
    <path d="M-25 5V8M0 5V8M25 5V8M-20 22V25M5 22V25M-12 39V42" stroke="#e4c487" />
    <rect className="map-ground-label-backplate" x="-54" y="46" width="108" height="23" rx="9" />
    <text className="map-ground-label" y="63" textAnchor="middle" fill="#435b3b" stroke="none" fontSize="13" fontWeight="900">BẾN NƯỚC</text>
  </g>;
}

export function neighborhoodScenery(buildings: readonly MapBuilding[] = BUILDINGS, historyMode = false, landscape?: HistoricalLandscape): { id: string; depth: number; element: ReactNode }[] {
  const mapOne = landscape === 'me-linh';
  const at = (point: { x: number; y: number }) => mapOne ? { x: point.x * MAP_ONE_LAYOUT_SCALE, y: point.y * MAP_ONE_LAYOUT_SCALE } : point;
  const well = at({ x: 480, y: 788 });
  const riceField = at({ x: 945, y: 923 });
  const wharf = at({ x: 1158, y: 878 });
  const unoHouse = at({ x: 675, y: 560 });
  return [
    ...buildings.map(building => ({ id: building.id, depth: building.y + building.height, element: <Building building={building} /> })),
    ...(historyMode ? [{
      id: 'travel-gate', depth: at({ x: 1320, y: 720 }).y,
      element: <g transform={`translate(${at({ x: 1320, y: 720 }).x} ${at({ x: 1320, y: 720 }).y})`} stroke="#71543b" strokeWidth="5" strokeLinejoin="round">
        <path d="M-55 40V-33Q-55-93 0-98Q55-93 55-33V40" fill="#ead6a9" stroke="#79593c" />
        <path d="M-40 38V-32Q-40-72 0-78Q40-72 40-32V38" fill={landscape === 'bach-dang' ? '#79aab0' : landscape === 'dong-da' ? '#d98677' : '#829b72'} stroke="#a88651" strokeWidth="4" />
        <path d="M-65 41H65M-49-54L-69-66M49-54L69-66" stroke="#79593c" strokeWidth="8" />
        <rect x="-68" y="-115" width="136" height="29" rx="8" fill="#fff4d5" stroke="#a88651" strokeWidth="2" />
        <text className="map-ground-label" y="-95" textAnchor="middle" fill="#68472e" stroke="none" fontSize="12" fontWeight="900">CỔNG LỊCH SỬ</text>
      </g>,
    }] : []),
    ...(historyMode ? [
      { id: 'village-well', depth: well.y, element: <VillageWell {...well} /> },
      { id: 'village-rice-field', depth: riceField.y + 57, element: <VillageRiceField {...riceField} /> },
      { id: 'village-wharf', depth: wharf.y + 46, element: <VillageWharf {...wharf} /> },
      { id: 'uno-tea-house', depth: unoHouse.y + 142, element: <UnoTeaHouse {...unoHouse} /> },
      ...(landscape === 'me-linh' ? [] : HISTORY_MENU_PLACES.map((place, index) => ({
        id: place.id,
        depth: place.point.y,
        element: <MenuHouse x={place.point.x} y={place.point.y} name={place.name} icon={place.icon} color={index % 2 ? '#dfc795' : '#c6d1a2'} roof={index % 2 ? '#875545' : '#647b58'} />,
      }))),
    ] : []),
    ...[{ x: 95, y: 465 }, { x: 1335, y: 465 }, { x: 535, y: 745 }, { x: 905, y: 875 }, { x: 290, y: 790 }, { x: 1180, y: 360 }, { x: 1120, y: 920 }, { x: 760, y: 180 }].map((point, i) => {
      const position = at(point);
      return { id: `tree-${i}`, depth: position.y, element: <Tree {...position} variant={i} /> };
    }),
    ...(historyMode && landscape === 'me-linh'
      ? [
        { id: 'pond', depth: 1440 + 180, element: <Pond x={2090} y={1440} /> },
        { id: 'me-linh-flag', depth: 1420 + 75, element: <g transform="translate(1408 1420)" stroke="#74553c" strokeWidth="4" strokeLinejoin="round"><path d="M0 75V-15" /><path d="M2-12H73L56 10H2Z" fill="#b84c37" /><path d="M29-7L32-1L39 0L34 5L35 11L29 8L23 11L24 5L19 0L26-1Z" fill="#f3d37e" stroke="none" /></g> },
        { id: 'me-linh-drum', depth: 1300, element: <g transform="translate(1640 1300)" stroke="#73513a" strokeWidth="3"><ellipse cy="-8" rx="25" ry="9" fill="#d5aa64" /><path d="M-25-8V11Q0 24 25 11V-8M-19-2L18 9M-18 10L18-2" fill="none" /></g> },
        { id: 'me-linh-buffalo', depth: 1730, element: <g transform="translate(600 1730)" stroke="#66523f" strokeWidth="4" strokeLinejoin="round"><ellipse cy="0" rx="32" ry="18" fill="#75644c" /><circle cx="27" cy="-9" r="13" fill="#806b50" /><path d="M18-20Q6-35-2-22M34-19Q49-31 50-17M-17 14V27M7 15V28M-31-3Q-46-10-42 2" fill="none" /><circle cx="31" cy="-10" r="2" fill="#fff2ce" stroke="none" /></g> },
        { id: 'me-linh-boat', depth: 1580, element: <g transform="translate(2220 1580)" stroke="#71543b" strokeWidth="4" strokeLinejoin="round"><path d="M-67 4Q0 32 67 4L48 25Q0 42-48 25Z" fill="#9a6344" /><path d="M0-9V-49L35-23Z" fill="#e6d09e" /><path d="M-87-23L-41 19M87-23L41 19" fill="none" stroke="#75543c" strokeWidth="5" /></g> },
        { id: 'me-linh-bridge', depth: 1610, element: <g transform="translate(2210 1610)" stroke="#765c3d" strokeWidth="5" strokeLinejoin="round"><path d="M-78 3Q0-25 78 3V20Q0-7-78 20Z" fill="#c1985f" /><path d="M-64 4V24M-35-2V15M0-7V10M35-2V15M64 4V24" /></g> },
        { id: 'me-linh-rice-paddies', depth: 1800, element: <g transform="translate(550 1580)" aria-hidden="true" fill="none" stroke="#c9aa60" strokeWidth="4"><path d="M0 0Q115-40 220 10T415 8M-10 35Q110-5 220 45T425 43M0 70Q115 30 220 80T415 78" /><path d="M35-10V110M130-22V120M240-1V110M340-3V110" stroke="#92a35e" strokeWidth="2" /></g> },
        { id: 'me-linh-market-stall', depth: 1070, element: <g transform="translate(2270 1070)" stroke="#76573d" strokeWidth="3" strokeLinejoin="round"><path d="M-35 5V40M35 5V40M-42 40H42" /><path d="M-47-10L-35-35H35L47-10Z" fill="#e7c889" /><path d="M-47-10H47" stroke="#a9543e" strokeWidth="8" /><path d="M-16-30V-10M16-30V-10" stroke="#a9543e" strokeWidth="8" /><rect className="map-ground-label-backplate" x="-35" y="46" width="70" height="19" rx="8" /><text className="map-ground-label" y="60" textAnchor="middle" stroke="none" fontSize="10" fontWeight="900">SẠP CHỢ</text></g> },
      ]
      : !historyMode ? [{ id: 'pond', depth: 900, element: <Pond /> }] : []),
    ...(!historyMode ? [{ id: 'market', depth: 607, element: <Market /> }] : []),
    ...(!historyMode ? [
      { id: 'bench', depth: 830, element: <Bench /> },
      { id: 'bulletin-board', depth: 645, element: <BulletinBoard /> },
      { id: 'ledger-desk', depth: 379, element: <LedgerDesk /> },
    ] : []),
    ...(!historyMode ? [{ id: 'memory-box', depth: 927, element: <MemoryBox /> }] : []),
    { id: 'lanterns', depth: mapOne ? 690 : 345, element: <g transform={mapOne ? `scale(${MAP_ONE_LAYOUT_SCALE})` : undefined}><path d="M548 211Q740 302 985 209" fill="none" stroke="#80735d" strokeWidth="2" />{[585, 672, 762, 851, 944].map((x, i) => <Lantern key={x} x={x} y={245 + [0, 27, 33, 22, -1][i]} color={i % 2 ? '#e5bd65' : '#c5634c'} />)}</g> },
    { id: 'cat', depth: mapOne ? 1100 : 560, element: <g transform={mapOne ? `translate(${866 * MAP_ONE_LAYOUT_SCALE} ${550 * MAP_ONE_LAYOUT_SCALE})` : 'translate(866 550)'} stroke="#8a7256" strokeWidth="1.8"><ellipse cy="7" rx="22" ry="6" fill="#665c4230" stroke="none" /><path d="M-14 0Q-17-20 4-19Q17-15 13 4Z" fill="#d9b482" /><path d="M-11-17L-13-29L-3-23L7-24L15-30L15-16Q5-7-11-17" fill="#e9c998" /><path d="M-1-15H2M7-16H10M-13 0Q-35 2-24-12" stroke="#8a7256" fill="none" strokeWidth="3" /></g> },
  ];
}
