import { memo, useId, type CSSProperties } from 'react';
import {
  OPENING_MAP_BUILDINGS,
  OPENING_MAP_TREES,
  OPENING_MAP_ROADS,
  OPENING_MAP_RIVER,
  OPENING_MAP_BRIDGES,
  OPENING_MAP_DOCK,
  OPENING_MAP_GATES,
  OPENING_MAP_PONDS,
  OPENING_MAP_MEMORY_KEEPER_CLEARING,
  type OpeningMapTree,
} from '../game/openingMap';
import '../styles/opening-map-scenery.css';

interface OpeningMapSceneryProps {
  idPrefix?: string;
  simplified?: boolean;
}

type XY = { x: number; y: number };

/** A rounded centre line keeps the visible roads and river on the gameplay geometry. */
function flowingPath(points: readonly XY[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  let path = `M${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const point = points[index];
    const next = points[index + 1];
    path += ` Q${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
  }
  const last = points[points.length - 1];
  return `${path} L${last.x} ${last.y}`;
}

const MEADOW_PATCHES = [
  'M-80 340C260 80 800 210 1110 80S1530 190 1430 550S1040 940 670 780S-80 890-80 340Z',
  'M140 1180C460 830 1040 890 1280 1200S1380 1940 1040 2150S140 2180 80 1760Z',
  'M3200 60C3550 130 3920-80 4400 120L4400 1100C4080 1060 3770 1220 3470 950S3210 460 3200 60Z',
  'M3490 1790C3810 1630 4220 1880 4410 2130L4410 3100L3010 3100C3000 2800 3210 2670 3350 2390S3240 1930 3490 1790Z',
  'M40 2490C360 2160 870 2340 1190 2580S1430 3020 980 3120H-70Z',
];

const MEADOW_SHRUBS = [
  [415, 425, 1.25], [1050, 410, 1.1], [1650, 550, .9], [2395, 510, 1.15],
  [2805, 495, 1.2], [3745, 660, 1.45], [4180, 800, 1.1], [3980, 1170, 1.35],
  [3890, 1830, 1.4], [3580, 2390, 1.2], [4180, 2820, 1.15], [620, 2810, 1.45],
  [1220, 2810, 1.35], [2940, 2300, 1.1], [2810, 2690, 1.2], [2620, 2900, 1],
];

const FLOWERS = [
  [1320, 1280], [1590, 2160], [2470, 2090], [2860, 1280],
  [1780, 915], [3580, 1630], [3330, 2190], [840, 2580],
];

const ROCKS = [
  [1400, 660, .9], [2410, 380, 1.2], [1250, 1090, .8],
  [2990, 1050, 1.05], [3400, 2280, .85], [970, 2420, .9],
];

const TREE_VARIANTS: Record<OpeningMapTree['kind'], readonly string[]> = {
  bamboo: ['bamboo', 'bambooGrove'],
  fruit: ['fruitTree', 'blossomTree'],
  palm: ['palm', 'palmFruit'],
  banyan: ['banyan', 'willow'],
};

/** The village is intentionally unpopulated: these are scenery and ordinary market stalls. */
export const OpeningMapScenery = memo(function OpeningMapScenery({ idPrefix, simplified = false }: OpeningMapSceneryProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const prefix = `scenery-${idPrefix ?? instanceId}`;
  const ref = (name: string) => `url(#${prefix}-${name})`;
  const href = (name: string) => `#${prefix}-${name}`;
  // Keep the water edge exactly on its collision polyline. Rounded joins soften the bends.
  const riverPath = `M${OPENING_MAP_RIVER.points.map(point => `${point.x} ${point.y}`).join(' L')}`;
  const animateStyle = (index: number): CSSProperties => ({ '--scenery-delay': `${-(index * 1.73) % 19}s` } as CSSProperties);

  return <g className={`opening-map-scenery${simplified ? ' is-simplified' : ''}`} aria-hidden="true">
    <defs>
      <linearGradient id={`${prefix}-earth`} x1="0" y1="0" x2=".7" y2="1">
        <stop stopColor="#d7d995" /><stop offset=".48" stopColor="#bfc98a" /><stop offset="1" stopColor="#aebf80" />
      </linearGradient>
      <radialGradient id={`${prefix}-sunwash`} cx="34%" cy="18%" r="85%">
        <stop stopColor="#fff5c4" stopOpacity=".48" /><stop offset=".55" stopColor="#eddea0" stopOpacity=".08" /><stop offset="1" stopColor="#365f51" stopOpacity=".18" />
      </radialGradient>
      <linearGradient id={`${prefix}-hill`} x1="0" y1="0" x2=".2" y2="1">
        <stop stopColor="#b0c48b" /><stop offset="1" stopColor="#72966f" />
      </linearGradient>
      <linearGradient id={`${prefix}-water`} x1="0" y1="0" x2="1" y2=".3">
        <stop stopColor="#397d79" /><stop offset=".25" stopColor="#62aaa0" /><stop offset=".6" stopColor="#86beb0" /><stop offset="1" stopColor="#3e8c86" />
      </linearGradient>
      <linearGradient id={`${prefix}-pond`} x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor="#51968a" /><stop offset=".65" stopColor="#a0c4a2" /><stop offset="1" stopColor="#6caaa0" />
      </linearGradient>
      <linearGradient id={`${prefix}-road`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="4320" y2="3000">
        <stop stopColor="#ead39c" /><stop offset=".58" stopColor="#dfbd83" /><stop offset="1" stopColor="#d3aa75" />
      </linearGradient>
      <linearGradient id={`${prefix}-canopy`} x1="0" y1="0" x2=".5" y2="1">
        <stop stopColor="#a4b95f" /><stop offset=".4" stopColor="#7e9e56" /><stop offset="1" stopColor="#416d50" />
      </linearGradient>
      <linearGradient id={`${prefix}-bambooGreen`} x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#52774c" /><stop offset=".35" stopColor="#b2c477" /><stop offset=".7" stopColor="#83a15a" /><stop offset="1" stopColor="#4a7450" />
      </linearGradient>
      <linearGradient id={`${prefix}-roof`} x1="0" y1="0" x2=".3" y2="1">
        <stop stopColor="#cb8e61" /><stop offset=".55" stopColor="#ab6d4d" /><stop offset="1" stopColor="#7d4f3e" />
      </linearGradient>
      <linearGradient id={`${prefix}-tileRoof`} x1="0" y1="0" x2=".2" y2="1">
        <stop stopColor="#655e57" /><stop offset=".5" stopColor="#494844" /><stop offset="1" stopColor="#302f2e" />
      </linearGradient>
      <linearGradient id={`${prefix}-thatch`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#e5c481" /><stop offset=".45" stopColor="#c5a16b" /><stop offset="1" stopColor="#aa8052" />
      </linearGradient>
      <linearGradient id={`${prefix}-goldField`} x1="0" y1="0" x2=".4" y2="1">
        <stop stopColor="#e8d980" /><stop offset=".45" stopColor="#d3be62" /><stop offset="1" stopColor="#b0a252" />
      </linearGradient>
      <linearGradient id={`${prefix}-greenField`} x1="0" y1="0" x2=".3" y2="1">
        <stop stopColor="#bdce80" /><stop offset=".5" stopColor="#91b167" /><stop offset="1" stopColor="#749959" />
      </linearGradient>
      <radialGradient id={`${prefix}-shadow`}>
        <stop stopColor="#3a5744" stopOpacity=".22" /><stop offset="1" stopColor="#3a5744" stopOpacity="0" />
      </radialGradient>
      <filter id={`${prefix}-paperNoise`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="3" stitchTiles="stitch" seed="8" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <pattern id={`${prefix}-paper`} width="128" height="128" patternUnits="userSpaceOnUse"><rect width="128" height="128" filter={ref('paperNoise')} opacity=".09" /></pattern>
      <pattern id={`${prefix}-grass`} width="112" height="98" patternUnits="userSpaceOnUse">
        <path d="M13 30l-3-7m3 7 4-6M75 72l-4-8m4 8 3-6M42 88l-2-5m54-58 4-6" fill="none" stroke="#668a53" strokeWidth="2" opacity=".25" />
        <path d="M28 48l10-2m24-32 6 1m-7 68 11-2" fill="none" stroke="#f4e9b0" strokeWidth="3" opacity=".3" />
        <circle cx="23" cy="73" r="2" fill="#7c985b" opacity=".25" /><circle cx="85" cy="45" r="2" fill="#f9edbd" opacity=".6" />
      </pattern>
      <pattern id={`${prefix}-cobbles`} width="78" height="50" patternUnits="userSpaceOnUse" patternTransform="rotate(-9)">
        <path d="M6 7l25-2 8 13-6 15-26-2-4-10ZM47 4l21 3 6 14-7 13-22-3-4-14ZM27 40l25-3 9 12-31 5Z" fill="#e1cf9e" stroke="#b5a47f" strokeWidth="2" opacity=".6" />
      </pattern>
      <pattern id={`${prefix}-rice`} width="28" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
        <path d="M8 23v-14m0 8-5-6m5 2 6-7M23 10V1m0 6-4-5" fill="none" stroke="#66864d" strokeWidth="1.5" opacity=".35" />
        <path d="M9 8l-4-4m4 3 5-4" stroke="#f2df94" strokeWidth="2.5" strokeLinecap="round" opacity=".75" />
      </pattern>
      <pattern id={`${prefix}-tiles`} width="22" height="15" patternUnits="userSpaceOnUse">
        <path d="M0 3q5 8 11 0q5 8 11 0M11 10q5 8 11 0" fill="none" stroke="#222321" strokeWidth="1.5" opacity=".6" />
        <path d="M0 2q5 6 11 0q5 6 11 0" fill="none" stroke="#a9a08f" strokeWidth="1" opacity=".38" />
      </pattern>
      <pattern id={`${prefix}-plaster`} width="44" height="32" patternUnits="userSpaceOnUse">
        <rect width="44" height="32" fill="#c9bd9e" />
        <path d="M4 9q8-4 16 0m11 13q5-3 10 0M4 28q7-3 12 0" fill="none" stroke="#a99e85" strokeWidth="1.4" opacity=".25" />
        <circle cx="26" cy="7" r="1.5" fill="#e5d7b7" opacity=".38" /><circle cx="18" cy="24" r="1" fill="#8d856f" opacity=".22" />
      </pattern>
      <pattern id={`${prefix}-ripples`} width="160" height="220" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <path d="M20 45q25 9 58 0m-19 5 37-1M65 146q25 8 58-1m-98 41 19 1" fill="none" stroke="#e3eac5" strokeWidth="3" strokeLinecap="round" opacity=".32" />
        <path d="M95 92q16 5 35-1M10 112l18 2" fill="none" stroke="#316e70" strokeWidth="2" opacity=".18" />
      </pattern>
      <pattern id={`${prefix}-timber`} width="24" height="70" patternUnits="userSpaceOnUse">
        <rect width="24" height="70" fill="#ba9560" /><path d="M2 0v70m20-70v70M8 7l3 36-3 18m8-48-2 26 3 28" stroke="#775f43" strokeWidth="1.5" opacity=".55" fill="none" /><path d="M5 0v70" stroke="#e7cc91" strokeWidth="2" opacity=".6" />
      </pattern>
      <g id={`${prefix}-tree`}>
        <ellipse cx="32" cy="8" rx="107" ry="35" fill={ref('shadow')} />
        <path d="M-8 1q10-37-3-78l21-8Q2-34 13 1Z" fill="#7a7250" />
        <path d="M2-18-28-58m32 26 30-40" fill="none" stroke="#716449" strokeWidth="10" strokeLinecap="round" />
        <path d="M-93-79q-9-30 19-47-6-30 36-37 16-32 52-15 36-20 54 7 38-4 43 25 36 15 20 44 11 31-27 38-21 26-57 7-31 16-54-3-37 9-51-19Z" fill="#406a4e" />
        <g className="scenery-foliage">
          <path d="M-96-93q-12-31 22-44 0-33 36-36 22-30 54-12 37-17 53 11 34-4 39 24 31 15 15 40-7 27-40 26-17 20-47 5-30 17-52-3-36 10-46-11Z" fill={ref('canopy')} />
          <path d="M-77-119q17-23 42-15 4-25 31-25 20-14 39 0m-87 59q21-16 43-7m30-21q27-12 44 6" fill="none" stroke="#c0cc7a" strokeWidth="15" strokeLinecap="round" opacity=".42" />
          <path d="M-71-78q29 17 52-1m30-6q28 13 55-6" fill="none" stroke="#315c4a" strokeWidth="9" opacity=".32" strokeLinecap="round" />
          <path d="M-69-134l5-4m42-29 9-2m44 8 6 3m31 26 4 4M-84-111l6-3" stroke="#e0dc95" strokeWidth="5" strokeLinecap="round" opacity=".45" />
        </g>
      </g>
      <g id={`${prefix}-fruitTree`}>
        <use href={href('tree')} />
        <g fill="#e2a05c" stroke="#a67845" strokeWidth="1.5"><circle cx="-52" cy="-113" r="7" /><circle cx="28" cy="-144" r="7" /><circle cx="62" cy="-98" r="6" /><circle cx="-7" cy="-83" r="6" /><circle cx="-29" cy="-152" r="6" /></g>
      </g>
      <g id={`${prefix}-banyan`}>
        <ellipse cx="40" cy="8" rx="165" ry="57" fill={ref('shadow')} />
        <path d="M-25 8q28-30 15-106l-43-27 8-13 52 27 45-46 12 13-44 54Q2-35 42 10L10 1-8 13Z" fill="#7a7150" />
        <path d="M-8 2q20-51 10-99m-9 55-13-35m36 44 12 30" fill="none" stroke="#b5a273" strokeWidth="5" />
        <g className="scenery-foliage">
          <path d="M-163-115q-11-33 28-46-9-29 35-38 15-37 58-25 26-31 63-10 45-12 60 20 45-4 58 26 43 5 39 34 37 31 4 51-20 27-64 16-25 26-64 8-41 23-69 0-43 14-62-8-55 5-64-28Z" fill="#416c52" />
          <path d="M-162-132q-7-30 29-40-2-31 36-33 20-31 55-19 26-28 62-12 41-10 58 19 46-5 57 25 38 4 40 29l-38 15-44-5-30 17-38-8-38 13-36-14-39 6-33-13Z" fill={ref('canopy')} />
          <path d="M-119-175q18-13 40-8m44-25 25-2m28 17q21-9 42 3m24 19 24 2M-63-149l22 2" stroke="#d1d590" opacity=".45" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M-103-124v51m15-46v34m137-29v48m12-54v26" stroke="#7a8960" opacity=".75" strokeWidth="3" fill="none" />
        </g>
      </g>
      <g id={`${prefix}-bamboo`}>
        <ellipse cx="15" cy="8" rx="92" ry="25" fill={ref('shadow')} />
        <g className="scenery-bamboo">
          <path d="M-29 1Q-48-100-64-199M-6 1Q-11-131-9-235M14 1Q28-117 37-214M28 1Q52-100 69-178" stroke="#345d48" strokeWidth="12" fill="none" />
          <path d="M-31 0Q-50-102-65-199M-8 0Q-13-131-11-235M12 0Q26-117 35-214M26 0Q50-100 67-178" stroke={ref('bambooGreen')} strokeWidth="8" fill="none" />
          <path d="M-39-48l8-1m-17-48 8-2m-17-48 8-2m-19-38 8-2M-15-47h10m-12-48h10m-11-49h10m-9-49h10M17-48l10 2m-3-51 10 2m-1-51 10 2m-2-46 10 2M37-51l9 2m4-50 9 3m5-47 9 3" stroke="#d0d18b" strokeWidth="3" />
          <path d="M-52-155q-54-15-66-47 41 5 66 47m-4-7q-10-54 9-75 13 40-9 75M-12-183q-54-20-66-56 45 9 66 56m1-9q7-60 31-74 2 41-31 74M31-161q-11-52 14-79 11 40-14 79m2-2q43-42 76-34-18 33-76 34M56-114q39-37 69-26-24 26-69 26m-88 20q-44-37-77-28 22 29 77 28M8-103q-44-25-58-61 36 6 58 61m7-18q36-39 61-25-20 23-61 25" fill="#5f8d55" />
          <path d="M-55-164q-29-7-45-22m87-10-41-31m87 55 56-19M-28-101l-50-16m96-10 39-15" stroke="#b3be74" strokeWidth="3" fill="none" opacity=".6" />
        </g>
      </g>
      <g id={`${prefix}-palm`}>
        <ellipse cx="28" cy="7" rx="85" ry="26" fill={ref('shadow')} />
        <path d="M-6 2q37-83 19-169l12-1Q46-73 9 2Z" fill="#8e8660" /><path d="M0-16l15 4M8-44l14 4m-8-31 14 3m-10-29 12 2m-11-31 11 1" stroke="#c9bd88" strokeWidth="3" />
        <g className="scenery-foliage" fill="#5e8b58" stroke="#436f4e" strokeWidth="2">
          <path d="M21-162q-80-56-126 0 57-24 126 0M21-166q-38-82-83-70 22 38 83 70M24-166q25-91 74-87-21 40-74 87M23-161q89-48 116 11-56-30-116-11M24-158q58-4 63 65-24-43-63-65M17-160q-61 7-64 64 28-36 64-64" />
          <path d="M-100-163q55-31 119 1M-58-232l76 65m9 1 65-80m-65 86q61-27 103 5" fill="none" stroke="#adbf78" strokeWidth="3" />
        </g>
        <g fill="#a3a66a"><circle cx="14" cy="-153" r="9" /><circle cx="31" cy="-151" r="8" /><circle cx="24" cy="-140" r="8" /></g>
      </g>
      <g id={`${prefix}-blossomTree`}>
        <use href={href('tree')} />
        <g className="scenery-foliage" fill="#d99d91" stroke="#a56f69" strokeWidth="1.5">
          <circle cx="-56" cy="-133" r="9" /><circle cx="-49" cy="-128" r="6" />
          <circle cx="-8" cy="-163" r="8" /><circle cx="-2" cy="-157" r="6" />
          <circle cx="46" cy="-139" r="9" /><circle cx="53" cy="-134" r="6" />
          <circle cx="71" cy="-103" r="8" /><circle cx="77" cy="-98" r="5" />
          <circle cx="-67" cy="-96" r="7" /><circle cx="-61" cy="-91" r="5" />
        </g>
        <g fill="#f1d9a8"><circle cx="-52" cy="-135" r="2" /><circle cx="-5" cy="-164" r="2" /><circle cx="49" cy="-141" r="2" /><circle cx="74" cy="-105" r="2" /></g>
      </g>
      <g id={`${prefix}-willow`}>
        <use href={href('banyan')} />
        <g className="scenery-foliage" fill="none" stroke="#6b915b" strokeWidth="7" strokeLinecap="round" opacity=".9">
          <path d="M-119-111q-7 32 7 61m26-54q-4 42 13 76m120-83q8 39-2 68m31-56q10 31 2 50" />
        </g>
        <path d="M-95-107q-5 27 7 47m119-45q6 24 0 42" fill="none" stroke="#a8bd70" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g id={`${prefix}-bambooGrove`}>
        <use href={href('bamboo')} />
        <g className="scenery-bamboo" fill="none" strokeLinecap="round">
          <path d="M-45 0Q-63-83-70-169M42 0Q60-96 77-161" stroke="#345d48" strokeWidth="10" />
          <path d="M-47 0Q-65-84-72-169M40 0Q58-97 75-161" stroke={ref('bambooGreen')} strokeWidth="6" />
          <path d="M-58-52l12-2m-19-48 11-2m94 44 12 3m-5-49 12 3" stroke="#d0d18b" strokeWidth="3" />
          <path d="M-70-161q-45-49-75-29 26 4 75 29m145-15q46-40 72-20-32 1-72 20" fill="#5f8d55" stroke="#436f4e" strokeWidth="2" />
        </g>
      </g>
      <g id={`${prefix}-palmFruit`}>
        <use href={href('palm')} />
        <g fill="#8d8c50" stroke="#5d704c" strokeWidth="2">
          <ellipse cx="6" cy="-143" rx="7" ry="10" /><ellipse cx="19" cy="-138" rx="7" ry="10" /><ellipse cx="31" cy="-144" rx="7" ry="10" />
        </g>
        <path d="M6-148v8m13-3v8m12-13v8" stroke="#c9bd88" strokeWidth="2" />
      </g>
      <g id={`${prefix}-rock`}>
        <ellipse cx="15" cy="4" rx="48" ry="15" fill={ref('shadow')} /><path d="M-39-3-26-34 7-44 34-29 43-6 20 6-15 6Z" fill="#889087" /><path d="m-39-3 13-31 33-10 12 18-20 15Z" fill="#bec1a7" /><path d="m7-44 27 15 9 23-24-20Z" fill="#9fa797" /><path d="m-23-29 20-7m-26 24 12-5" stroke="#d9d5b1" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g id={`${prefix}-shrub`}>
        <ellipse cx="8" cy="4" rx="63" ry="16" fill={ref('shadow')} />
        <path d="M-53-2q-17-25 10-36-1-26 27-25 15-21 35-8 29-7 32 18 29 4 21 26 9 21-24 24-26 14-48 0-26 12-53 1Z" fill="#6c925d" />
        <path d="M-42-34q20-23 38-12 16-23 34-9m-45 30q20-10 36 1" fill="none" stroke="#bbc77e" strokeWidth="11" opacity=".52" strokeLinecap="round" />
        <path d="m-24-44 6-3m38-9 5 2M-38-23l6-2" stroke="#dedb96" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g id={`${prefix}-flowers`}>
        <path d="M-29 10q9-23 4-37M-5 12q2-32 11-40M19 14q11-27 8-40M36 14q5-16 14-22" stroke="#648254" strokeWidth="3" fill="none" />
        <g fill="#e6ad8b"><circle cx="-26" cy="-27" r="7" /><circle cx="7" cy="-28" r="8" /><circle cx="28" cy="-26" r="6" /></g><g fill="#f4e2ab"><circle cx="-26" cy="-27" r="2.5" /><circle cx="7" cy="-28" r="3" /><circle cx="28" cy="-26" r="2" /><circle cx="50" cy="-10" r="5" /></g>
        <path d="m-25-5-10-8 11 2m25-1 12-10-4 13m17 9 12-8-6 9" fill="#87a16c" />
      </g>
      <g id={`${prefix}-basket`}>
        <ellipse cy="4" rx="24" ry="8" fill={ref('shadow')} /><path d="m-21-19 4 24q17 14 34 0l4-24Z" fill="#b48c51" stroke="#8f7144" strokeWidth="2" /><path d="M-19-13q19 10 38 0m-36 9q17 9 34 0m-31 9q14 7 28 0M-12-16l3 25M0-15v27m12-28-3 25" fill="none" stroke="#dec48a" strokeWidth="2" opacity=".8" /><ellipse cy="-19" rx="21" ry="8" fill="#7a6b42" stroke="#d4b377" strokeWidth="3" />
      </g>
      <g id={`${prefix}-jar`}>
        <ellipse cx="6" cy="4" rx="23" ry="8" fill={ref('shadow')} /><path d="M-10-36h20l-1 10q23 16 10 34-17 12-37-1-11-18 9-33Z" fill="#8d7970" stroke="#71665b" strokeWidth="2" /><path d="M-7-25q-12 15-6 25" stroke="#c1b5a0" opacity=".6" strokeWidth="5" fill="none" strokeLinecap="round" /><ellipse cy="-36" rx="11" ry="4" fill="#5f6256" stroke="#b4a18a" strokeWidth="3" />
      </g>
      <g id={`${prefix}-lotus`}>
        <ellipse rx="29" ry="12" fill="#518e6d" /><path d="M-26 0 0 2 15-10" fill="none" stroke="#94b080" strokeWidth="1.8" /><path d="M0-5q-21-1-20-17 13 0 20 17M0-5q20-1 20-17-13 0-20 17" fill="#e3a8a1" /><path d="M0-6q-12-7 0-25 12 18 0 25" fill="#f4cfb6" /><path d="M-6-8q6 5 12 0" stroke="#e6c574" strokeWidth="4" fill="none" />
      </g>
      <g id={`${prefix}-reeds`}>
        <path d="M-25 7q4-30-13-57m16 57q20-35 12-65M-1 7q0-27 19-53M2 7q22-15 32-22M-10 8q-9-20-28-27" fill="none" stroke="#859d59" strokeWidth="4" strokeLinecap="round" /><path d="M-10-49v-18m-27 19-4-10m60 11 5-12" stroke="#b5aa6c" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g id={`${prefix}-bird`} fill="none" stroke="#4e675b" strokeWidth="3" strokeLinecap="round"><path d="M-15 0q8-10 15 0 7-10 15 0" /></g>
      <g id={`${prefix}-cloud`} fill="#fffae0"><path d="M-160 0q-27-35 21-49 9-43 62-36 33-50 86-21 49-12 67 26 57-7 62 35 61 3 42 39-95 21-185 13Z" opacity=".5" /><ellipse cx="-8" cy="8" rx="190" ry="18" opacity=".22" /></g>
    </defs>

    <rect width="4320" height="3000" fill={ref('earth')} />
    <g fill="#94b17b" opacity=".38">{MEADOW_PATCHES.map((path, index) => <path key={index} d={path} />)}</g>
    <path d="M-50 2320Q500 2130 1110 2410T2070 2780L2450 3100H-50Z" fill="#d7cf8a" opacity=".52" />
    <path d="M3430 140Q3820 240 4390 50L4380 580Q3890 790 3430 570Z" fill="#d7d898" opacity=".6" />
    <rect width="4320" height="3000" fill={ref('grass')} />

    {/* Distant ridges fade into the warm paper; nearer hills have individual wooded folds. */}
    <g>
      <path d="M-100 480Q160 130 410 290 680-95 970 200 1190-100 1450 190 1670-80 1900 120 2190-115 2450 130 2700-90 3000 190 3270-90 3540 100 3920-100 4420 300V-20H-100Z" fill="#d6d5a4" />
      <path d="M-50 490Q250 215 510 430 760 70 1070 330 1390 10 1630 300 1890 70 2170 290 2470-60 2740 280 3000 130 3200 410L3260 650 2710 750 2180 610 1750 830 1170 650 610 750-50 680Z" fill="#adbe8b" opacity=".78" />
      <path d="M1000 750Q1150 365 1440 480 1640 100 1870 390 2060 265 2220 480 2490 175 2720 500 2920 420 3010 800L2710 970 2440 810 2160 920 1770 790 1530 990Z" fill={ref('hill')} />
      <path d="M1410 485q-115 175-105 330m510-415q-95 141-83 294m303-245q82 102 92 238m435-184q-100 93-117 253m-550-51q-60 75-39 146" stroke="#4a795c" strokeWidth="25" opacity=".16" fill="none" strokeLinecap="round" />
      <path d="M1120 714q155-165 294-151m205-90q108-92 198-37m488 100q120-94 215 45" stroke="#dce1ab" strokeWidth="18" opacity=".25" fill="none" strokeLinecap="round" />
      <path d="M1495 790Q1650 710 1810 755T2090 750M2340 730q165-81 295 6" stroke="#ced899" strokeWidth="6" opacity=".55" fill="none" />
      <g fill="none" strokeLinecap="round" opacity=".6">
        <path d="M1450 630q165-105 330-42M1430 674q174-107 359-38M1420 720q170-102 373-35M2330 600q175-95 350 24M2330 649q168-92 345 25M2320 699q167-90 329 25" stroke="#557f56" strokeWidth="23" />
        <path d="M1450 624q165-105 330-42M1430 668q174-107 359-38M1420 714q170-102 373-35M2330 594q175-95 350 24M2330 643q168-92 345 25M2320 693q167-90 329 25" stroke="#a1b36d" strokeWidth="12" />
      </g>
    </g>

    {/* Broad curving fields are divided by planted earthen levees. */}
    <g stroke="#8a9c5c" strokeWidth="9" strokeLinejoin="round">
      <path d="M1330 2260Q1660 2100 2030 2220L2050 2370Q1640 2240 1305 2430Z" fill={ref('greenField')} />
      <path d="M1305 2430Q1640 2240 2050 2370L2060 2510Q1630 2380 1280 2590Z" fill={ref('goldField')} />
      <path d="M1280 2590Q1630 2380 2060 2510L2070 2650Q1660 2520 1280 2750Z" fill={ref('greenField')} />
      <path d="M1280 2750Q1660 2520 2070 2650L2080 2820Q1650 2680 1290 2910Z" fill={ref('goldField')} />
      <path d="M2290 2250Q2560 2130 2870 2250L2830 2410Q2570 2310 2280 2405Z" fill={ref('goldField')} />
      <path d="M2280 2405Q2570 2310 2830 2410L2800 2570Q2520 2440 2270 2555Z" fill={ref('greenField')} />
      <path d="M2270 2555Q2520 2440 2800 2570L2750 2730Q2510 2600 2260 2725Z" fill={ref('goldField')} />
      <path d="M2260 2725Q2510 2600 2750 2730L2680 2900Q2490 2760 2250 2900Z" fill={ref('greenField')} />
      <path d="M700 2180q170-90 390 40l-20 170q-230-150-430-30Z" fill={ref('greenField')} />
      <path d="M640 2360q200-120 430 30l-20 160q-230-130-460-10Z" fill={ref('goldField')} />
    </g>
    <g fill={ref('rice')} opacity=".86">
      <path d="M1330 2260Q1660 2100 2030 2220L2080 2820Q1650 2680 1290 2910Z" />
      <path d="M2290 2250Q2560 2130 2870 2250L2680 2900Q2490 2760 2250 2900Z" />
      <path d="M700 2180q170-90 390 40l-40 330q-230-130-460-10Z" />
    </g>
    <g fill="none" stroke="#f0df9c" strokeWidth="5" opacity=".58">
      <path d="M1355 2303q310-143 654-41M1325 2475q339-156 690-61M1317 2798q340-169 700-94M2320 2300q248-89 504-12M2305 2611q222-91 440 11M2295 2781q202-93 396 6" />
    </g>

    {/* Banks, shallow water and current all share the canonical river route. */}
    <path d={riverPath} fill="none" stroke="#9f9d67" strokeWidth={OPENING_MAP_RIVER.width + 65} strokeLinecap="round" strokeLinejoin="round" />
    <path d={riverPath} fill="none" stroke="#bdd091" strokeWidth={OPENING_MAP_RIVER.width + 37} strokeLinecap="round" strokeLinejoin="round" />
    <path d={riverPath} fill="none" stroke={ref('water')} strokeWidth={OPENING_MAP_RIVER.width} strokeLinecap="round" strokeLinejoin="round" />
    <path d={riverPath} fill="none" stroke="#c5ddba" strokeWidth={OPENING_MAP_RIVER.width - 35} strokeLinecap="round" strokeLinejoin="round" opacity=".12" />
    <path className="scenery-current" d={riverPath} fill="none" stroke={ref('ripples')} strokeWidth={OPENING_MAP_RIVER.width - 25} strokeLinecap="round" />
    {!simplified && <path className="scenery-flow" d={riverPath} fill="none" stroke="#def0ce" strokeWidth="2" strokeDasharray="24 120 45 210" opacity=".32" />}
    {OPENING_MAP_PONDS.map(pond => <g key={pond.id}>
      <ellipse cx={pond.x} cy={pond.y} rx={pond.rx + 13} ry={pond.ry + 12} fill="#909d6c" />
      <ellipse cx={pond.x} cy={pond.y} rx={pond.rx + 5} ry={pond.ry + 5} fill="#c5cb90" />
      <ellipse cx={pond.x} cy={pond.y} rx={pond.rx} ry={pond.ry} fill={ref('pond')} />
      <ellipse cx={pond.x} cy={pond.y} rx={pond.rx - 7} ry={pond.ry - 6} fill={ref('ripples')} opacity=".75" />
      <path d={`M${pond.x - pond.rx * .7} ${pond.y - pond.ry * .55}q${pond.rx * .5} ${-pond.ry * .4} ${pond.rx} ${-pond.ry * .12}`} stroke="#d8dfb2" strokeWidth="4" fill="none" opacity=".55" />
      {[[-75, 12], [-15, -37], [40, 40], [98, -11], [-30, 61]].map(([x, y], index) => <use key={index} href={href('lotus')} x={pond.x + x} y={pond.y + y} />)}
      <use href={href('reeds')} x={pond.x - pond.rx + 10} y={pond.y + 20} /><use href={href('reeds')} x={pond.x + pond.rx - 25} y={pond.y + 25} />
    </g>)}
    <g opacity=".85"><use href={href('lotus')} x="3190" y="1120" /><use href={href('lotus')} x="3240" y="1175" /><use href={href('lotus')} x="3130" y="2250" /><use href={href('lotus')} x="3185" y="2300" /></g>

    {/* Forest floor is darker and cooler, with a clear sunlit walking trail through it. */}
    <path d="M170 910q310-200 685-50 300 70 390 340l-40 200-100 150 95 240q-60 370-380 390-360 10-640-170L80 1660Z" fill="#76966c" opacity=".47" />
    <path d="M230 1050q270-130 520-45T1110 1270M180 1810q280 190 605 105" fill="none" stroke="#d0cf8b" strokeWidth="55" strokeLinecap="round" opacity=".21" />

    {/* The market has a wide worn square and four connected approaches. */}
    <path d="M1700 1130Q2120 1055 2550 1150L2670 1390 2640 1790 2470 1960 1800 1950 1595 1730 1585 1350Z" fill="#bca87a" opacity=".38" />
    <path d="M1720 1140Q2135 1090 2530 1175L2630 1390 2610 1770 2460 1920 1810 1910 1630 1720 1620 1360Z" fill={ref('road')} />
    <path d="M1780 1210Q2150 1140 2500 1230L2550 1430 2540 1740 2420 1850 1850 1850 1690 1700 1680 1380Z" fill={ref('cobbles')} opacity=".72" />
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {OPENING_MAP_ROADS.map(road => <path key={`${road.id}-edge`} d={flowingPath(road.points)} stroke="#a89368" strokeWidth={road.width + 12} opacity=".47" />)}
      {OPENING_MAP_ROADS.map(road => <path key={road.id} d={flowingPath(road.points)} stroke={ref('road')} strokeWidth={road.width} opacity=".78" />)}
      {OPENING_MAP_ROADS.map(road => <path key={`${road.id}-wear`} d={flowingPath(road.points)} stroke="#d8bd91" strokeWidth={road.width * .31} opacity=".28" />)}
    </g>
    <g className="scenery-compound-walls" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1595 1170Q1680 1060 1810 1085L1945 1112M2300 1085Q2420 1038 2555 1120L2665 1220M2660 1770Q2545 1874 2425 1848L2320 1825M1910 1850Q1770 1905 1650 1785L1578 1690" stroke="#665e53" strokeWidth="25" opacity=".36" />
      <path d="M1595 1160Q1680 1050 1810 1075L1945 1102M2300 1075Q2420 1028 2555 1110L2665 1210M2660 1760Q2545 1864 2425 1838L2320 1815M1910 1840Q1770 1895 1650 1775L1578 1680" stroke="#b4a48b" strokeWidth="13" strokeDasharray="31 15" opacity=".72" />
    </g>
    {/* Enclosing garden fences leave all four village entrances completely open. */}
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1540 1390V1190Q1540 1000 1770 990H2060M2260 990H2530Q2740 990 2740 1210V1390M2740 1610V1810Q2740 2030 2510 2040H2260M2060 2040H1760Q1510 2040 1510 1810V1610" stroke="#6c7c50" strokeWidth="17" opacity=".2" transform="translate(8 9)" />
      <path d="M1540 1390V1190Q1540 1000 1770 990H2060M2260 990H2530Q2740 990 2740 1210V1390M2740 1610V1810Q2740 2030 2510 2040H2260M2060 2040H1760Q1510 2040 1510 1810V1610" stroke="#9a8655" strokeWidth="11" />
      <path d="M1540 1370V1170Q1540 980 1770 970H2060M2260 970H2530Q2740 970 2740 1190V1370M2740 1590V1790Q2740 2010 2510 2020H2260M2060 2020H1760Q1510 2020 1510 1790V1590" stroke="#d2bd83" strokeWidth="7" />
      {[1630, 1745, 1860, 1975, 2340, 2455, 2570, 2660].map((x, index) => <g key={`fence-${index}`} stroke="#9a8153" strokeWidth="9"><path d={`M${x} ${x < 1680 || x > 2600 ? 1012 : 956}v58M${x} ${x < 1680 || x > 2600 ? 1995 : 2005}v58`} /></g>)}
      {[1130, 1240, 1350, 1650, 1760, 1870].map(y => <path key={`sidefence-${y}`} d={`M1527 ${y}h27m1173 0h27`} stroke="#a38b57" strokeWidth="10" />)}
    </g>

    {/* Forest and orchard silhouettes also supply the same trunks used by collision. */}
    {MEADOW_SHRUBS.filter(([x, y]) =>
      x < OPENING_MAP_MEMORY_KEEPER_CLEARING.x || x > OPENING_MAP_MEMORY_KEEPER_CLEARING.x + OPENING_MAP_MEMORY_KEEPER_CLEARING.width
      || y < OPENING_MAP_MEMORY_KEEPER_CLEARING.y || y > OPENING_MAP_MEMORY_KEEPER_CLEARING.y + OPENING_MAP_MEMORY_KEEPER_CLEARING.height,
    ).map(([x, y, scale], index) => <use key={`shrub-${index}`} href={href('shrub')} transform={`translate(${x} ${y}) scale(${scale})`} />)}
    {[...OPENING_MAP_TREES].sort((left, right) => left.y - right.y).map((tree, index) => {
      const variants = TREE_VARIANTS[tree.kind];
      const variant = variants[index % variants.length];
      return <use key={tree.id} id={`${prefix}-object-${tree.id}`} data-tree-kind={tree.kind} data-tree-variant={variant} href={href(variant)} transform={`translate(${tree.x} ${tree.y}) scale(${tree.scale})`} style={animateStyle(index)} />;
    })}

    {ROCKS.map(([x, y, scale], index) => <use key={`rock-${index}`} href={href('rock')} transform={`translate(${x} ${y}) scale(${scale})`} />)}
    {FLOWERS.map(([x, y], index) => <use key={`flowers-${index}`} className="scenery-flowers" href={href('flowers')} x={x} y={y} style={animateStyle(index)} />)}
    <g>
      {[[3010, 360], [3230, 685], [2980, 1120], [3310, 1220], [3030, 1800], [3280, 2050], [2990, 2540], [3180, 2820], [3060, 820], [3220, 2160], [2990, 2340]].map(([x, y], index) => <use key={`reed-${index}`} className="scenery-flowers" href={href('reeds')} x={x} y={y} style={animateStyle(index)} />)}
    </g>

    {/* A broad timber bridge and simple working docks belong to the landscape. */}
    {OPENING_MAP_BRIDGES.map(bridge => <g key={bridge.id} transform={`translate(${bridge.x} ${bridge.y})`}>
      <rect x="10" y="24" width={bridge.width} height={bridge.height} rx="12" fill="#315d55" opacity=".23" />
      <rect x="0" y="0" width={bridge.width} height={bridge.height} rx="4" fill={ref('timber')} stroke="#8c784f" strokeWidth="7" />
      <path d={`M0 12H${bridge.width}M0 ${bridge.height - 12}H${bridge.width}`} stroke="#e4c58a" strokeWidth="8" />
      <path d={`M0 -13H${bridge.width}M0 ${bridge.height - 9}H${bridge.width}`} stroke="#816f48" strokeWidth="10" />
      {Array.from({ length: Math.ceil(bridge.width / 76) + 1 }, (_, index) => <g key={index} transform={`translate(${Math.min(bridge.width, index * 76)} 0)`}><path d={`M0 -23V18M0 ${bridge.height - 20}v40`} stroke="#8c774a" strokeWidth="12" strokeLinecap="round" /><path d={`M-2 -21v35m0 ${bridge.height - 31}v38`} stroke="#d6bc7d" strokeWidth="4" strokeLinecap="round" /></g>)}
    </g>)}
    <g id={`${prefix}-object-${OPENING_MAP_DOCK.id}`} data-map-object="delivery-dock">
      <ellipse cx={OPENING_MAP_DOCK.x + 126} cy={OPENING_MAP_DOCK.y + 104} rx="146" ry="111" fill="#315d55" opacity=".24" />
      {[OPENING_MAP_DOCK.x + 20, OPENING_MAP_DOCK.x + OPENING_MAP_DOCK.width - 22].map(x => [OPENING_MAP_DOCK.y + 17, OPENING_MAP_DOCK.y + OPENING_MAP_DOCK.height - 17].map(y =>
        <g key={`dock-pile-${x}-${y}`}>
          <path d={`M${x - 5} ${y + 22}v-37`} stroke="#72583c" strokeWidth="14" strokeLinecap="round" />
          <path d={`M${x - 5} ${y + 18}v-33`} stroke="#c9a46c" strokeWidth="7" strokeLinecap="round" />
          <path d={`M${x - 14} ${y - 13}h18`} stroke="#816747" strokeWidth="13" strokeLinecap="round" />
        </g>))}
      <rect x={OPENING_MAP_DOCK.x} y={OPENING_MAP_DOCK.y} width={OPENING_MAP_DOCK.width} height={OPENING_MAP_DOCK.height} rx="5" fill={ref('timber')} stroke="#806a49" strokeWidth="8" />
      <path d={`M${OPENING_MAP_DOCK.x + 4} ${OPENING_MAP_DOCK.y + 12}h${OPENING_MAP_DOCK.width - 8}M${OPENING_MAP_DOCK.x + 4} ${OPENING_MAP_DOCK.y + OPENING_MAP_DOCK.height - 12}h${OPENING_MAP_DOCK.width - 8}`} stroke="#e2c48a" strokeWidth="9" />
      {Array.from({ length: 10 }, (_, index) => <path key={`dock-plank-${index}`} d={`M${OPENING_MAP_DOCK.x + 8} ${OPENING_MAP_DOCK.y + 20 + index * 15}h${OPENING_MAP_DOCK.width - 16}`} stroke={index % 2 ? '#806a49' : '#e1c48b'} strokeWidth={index % 2 ? 2 : 1.5} opacity={index % 2 ? .38 : .55} />)}
      <path d={`M${OPENING_MAP_DOCK.x + 15} ${OPENING_MAP_DOCK.y + 35}l13 2m64 25 17-2m-87 55 18 2m112-20 17-3`} stroke="#735d42" strokeWidth="2" opacity=".6" />
      <g id={`${prefix}-object-dock-cargo`}>
        <path d="M3379 1612h48v38h-48z" fill="#b68e59" stroke="#755a3c" strokeWidth="4" />
        <path d="M3385 1617v28m16-28v28m-19-19h38" stroke="#e0c58c" strokeWidth="3" opacity=".8" />
        <path d="M3417 1645h38v29h-38z" fill="#92744d" stroke="#684f37" strokeWidth="4" />
        <path d="M3422 1650v19m12-19v19m-15-12h29" stroke="#d8bd87" strokeWidth="2.5" opacity=".8" />
      </g>
      <path d="M3421 1595c28 4 20 24 42 17s8 14 2 17" fill="none" stroke="#755a3c" strokeWidth="4" />
    </g>
    <g className="scenery-boat" transform="translate(3188 1698) rotate(90)">
      <g className="scenery-boat-hull"><ellipse cx="14" cy="14" rx="43" ry="103" fill="#285b5b" opacity=".2" /><path d="M0-102Q65-40 0 108-65-40 0-102Z" fill="#9c8152" stroke="#6e6848" strokeWidth="5" /><path d="M0-83Q40-24 0 85-40-24 0-83Z" fill="#bb9c66" /><path d="M-20-26h40M-20 8h40M-13 47h26" stroke="#7d704c" strokeWidth="8" /><path d="m-32 31 82-66" stroke="#bda677" strokeWidth="5" strokeLinecap="round" /><path d="m47-37 16-16" stroke="#806b48" strokeWidth="9" strokeLinecap="round" /></g>
    </g>
    <g transform="translate(2970 1920) rotate(-8)">
      <path d="M0 0h180v110H0Z" fill="#426c5c" opacity=".2" transform="translate(12 15)" />
      <path d="M0 0h180v105H0Z" fill={ref('timber')} stroke="#947b4d" strokeWidth="6" />
      <path d="M20-9v126M162-9v126" stroke="#ab8c55" strokeWidth="9" /><path d="M15-9h10m132 0h10M15 117h10m132 0h10" stroke="#dfc48c" strokeWidth="6" strokeLinecap="round" />
      <use href={href('basket')} x="25" y="65" /><use href={href('basket')} x="47" y="90" transform="scale(.7)" />
      <path d="M183 19q14 45 2 85" fill="none" stroke="#bca374" strokeWidth="4" />
    </g>
    <g className="scenery-boat" transform="translate(3205 2080) rotate(12)">
      <g className="scenery-boat-hull"><ellipse cx="14" cy="14" rx="47" ry="109" fill="#285b5b" opacity=".2" /><path d="M0-110Q69-43 0 116-69-43 0-110Z" fill="#9c8152" stroke="#6e6848" strokeWidth="5" /><path d="M0-90Q43-25 0 92-43-25 0-90Z" fill="#bb9c66" /><path d="M-22-30h44M-22 8h44M-14 51h28" stroke="#7d704c" strokeWidth="9" /><path d="m-35 34 90-72" stroke="#bda677" strokeWidth="5" strokeLinecap="round" /><path d="m52-40 17-17" stroke="#806b48" strokeWidth="10" strokeLinecap="round" /></g>
    </g>

    {OPENING_MAP_BUILDINGS.map((building, index) => building.kind === 'house'
      ? <g key={building.id} id={`${prefix}-object-${building.id}`} data-building-id={building.id} data-building-kind="house" transform={`translate(${building.x} ${building.y}) scale(${building.width / 180} ${building.height / 150})`}>
        <ellipse cx="98" cy="145" rx="111" ry="30" fill={ref('shadow')} />
        <path d="M10 65h141v75H10Z" fill={building.color} stroke="#806c50" strokeWidth="3" />
        <path d="M10 65h141v75H10Z" fill={ref('plaster')} opacity=".34" />
        <path d="m151 64 24-18v79l-24 15Z" fill="#9e8a68" stroke="#75654d" strokeWidth="2" />
        <path d="m155 77 17-11v53l-17 10Z" fill="#675e47" opacity=".27" />
        <path d="M14 111h134v29H14Z" fill="#75634d" opacity=".16" />
        <path d="M15 68h132M15 134h135M20 68v70m124-70v70" fill="none" stroke="#795f42" strokeWidth="5" opacity=".72" />
        <path d="M22 71v63m116-63v63M57 69v8m62-8v8" fill="none" stroke="#e0c58f" strokeWidth="3" opacity=".75" />
        <path d="M69 82h34v58H69Z" fill="#493f32" stroke="#8c7854" strokeWidth="3" />
        <path d="M73 87h12v49H73Z" fill="#8d7955" />
        <path d="M90 89v45m-16-2h27" stroke="#d7bb82" strokeWidth="3" />
        <path className="scenery-house-door-grain" d="M76 92v39m6-39v39m14-38v35" stroke="#5c503c" strokeWidth="1.5" opacity=".58" />
        <path d="M75 100h11m-11 12h11m-11 12h11" stroke="#d1b582" strokeWidth="1.5" opacity=".55" />
        <circle cx="95" cy="113" r="2" fill="#e1c27d" />
        <path d="M24 84h29v26H24Zm92 0h25v26h-25Z" fill="#65715d" stroke="#b09b70" strokeWidth="5" />
        <path d="M29 89v17m9-17v17m9-17v17m74-17v17m8-17v17m8-17v17M23 97h31m61 0h27" stroke="#d2c193" strokeWidth="2.5" />
        <path d="M26 87h25m68 0h21" stroke="#edf0ce" strokeWidth="3" opacity=".62" />
        <path d="M31 91h19m67 0h18" stroke="#a9cbad" strokeWidth="5" opacity=".46" />
        <path d="M28 115h22m70 0h20" stroke="#8e7853" strokeWidth="3" opacity=".75" />
        <path d="m1 76 37-63 114-7 33 56-35 21-68-14Z" fill={index % 3 === 0 ? ref('thatch') : ref('roof')} stroke="#8d714f" strokeWidth="3" />
        <path d="m1 76 37-63 114-7-26 60-44 3Z" fill={index % 3 === 0 ? '#e5c481' : '#f0c58a'} opacity=".34" />
        <path d="m81 63 71-57 33 56-35 21Z" fill="#493e35" opacity=".19" />
        {index % 3 !== 0 && <path d="m1 76 37-63 114-7 33 56-35 21-68-14Z" fill={ref('tiles')} />}
        <path d="m37 13 115-7M2 75l79-6 69 14 35-21" fill="none" stroke="#e8c995" strokeWidth="5" opacity=".78" />
        <path className="scenery-house-roof-ridge" d="m38 12 114-7 5 5-114 8Z" fill="#f3d9a1" opacity=".76" />
        <path d="m37 14 4 3m15-4 4 3m15-4 4 3m15-4 4 3m15-4 4 3m15-4 4 3m15-4 4 3" fill="none" stroke="#735640" strokeWidth="2" opacity=".58" />
        <path d="M40 11 6 72m30-7L61 10m20 53L96 8m-7 55 74-56" fill="none" stroke="#654b39" strokeWidth="2" opacity=".34" />
        <path d="M39 13v-5m114-2v-6m33 63 5-7M2 75l-5-3" stroke="#eed9aa" strokeWidth="3" />
        {index % 3 === 0
          ? <path d="m25 45-15 28m32-52L26 67m37-41L43 66m39-42L61 65m39-42L80 64m40-43-25 43m47-38-22 39m37-29 17 26" fill="none" stroke="#efd39a" strokeWidth="2.5" opacity=".7" />
          : <path d="m47 23 19 39m8-42 17 39m8-42 16 39m9-40 14 37m9-38 13 35" fill="none" stroke="#ded0ab" strokeWidth="2" opacity=".42" />}
        <path d="M63 142h47v8H63Z" fill="#a28d67" stroke="#766448" strokeWidth="2" />
        <path d="M59 150h57m-44-8v8m30-8v8" stroke="#e0c58f" strokeWidth="3" />
        <path d="M72 153h35m-30 5h24" stroke="#a99b78" strokeWidth="4" strokeLinecap="round" />
        <path d="M14 137h45m59 0h27" stroke="#dfcfaa" strokeWidth="2" opacity=".7" />
        <use href={href('jar')} x="155" y="140" transform="translate(45 44) scale(.7)" /><use href={href('basket')} x="23" y="142" transform="translate(0 42) scale(.7)" />
        {index % 4 === 1 && !simplified && <g className="scenery-smoke" opacity=".5"><path d="M141 6q-24-26 1-46t-1-43" fill="none" stroke="#fbf3d5" strokeWidth="10" strokeLinecap="round" /><path d="M143-12q20-22 4-44" fill="none" stroke="#fbf3d5" strokeWidth="6" strokeLinecap="round" /></g>}
      </g>
      : <g key={building.id} id={`${prefix}-object-${building.id}`} data-building-id={building.id} data-building-kind="stall" transform={`translate(${building.x} ${building.y}) scale(${building.width / 160} ${building.height / 120})`}>
        <ellipse cx="89" cy="115" rx="94" ry="26" fill={ref('shadow')} />
        <path d="M9 43v73M151 43v73M29 12v73m101-73v73" stroke="#725b3f" strokeWidth="8" strokeLinecap="round" />
        <path d="M9 43v73M151 43v73M29 12v73m101-73v73" stroke="#c5a36d" strokeWidth="4" strokeLinecap="round" />
        <path d="m12 44 17-13m122 13-21-13m-101 58 17-13m122 13-21-13" fill="none" stroke="#886b48" strokeWidth="4" />
        <path d="M12 76h138v32l-12 9H12Z" fill={building.color} stroke="#786444" strokeWidth="3" />
        <path d="M16 80h129v12H16Z" fill="#c8aa70" />
        <path d="M16 94h130v12H16Z" fill={ref('timber')} opacity=".58" />
        <path d="M15 106h133M18 96h129m-113-4v20m32-20v20m32-20v20m32-20v20" stroke="#896e49" strokeWidth="3" opacity=".78" />
        <path d="M21 109h125" stroke="#e0c48c" strokeWidth="3" />
        <path d="M23 113h120M33 97v11m33-11v11m34-11v11m33-11v11" fill="none" stroke="#694f38" strokeWidth="1.5" opacity=".62" />
        <path d="M18 62h36v20H18Zm44 0h39v20H62Zm47 0h35v20h-35Z" fill="#8c794c" stroke="#d8bb80" strokeWidth="2" />
        {building.id.includes('cloth') ? <g><path d="M21 65h28v12H21Z" fill="#d5bd98" /><path d="M27 63h29v12H27Z" fill="#a6b7a6" /><path d="M64 64h31v14H64Z" fill="#b78877" /><path d="M113 64h26v13h-26Z" fill="#b5c395" /><path d="M34 65v11m8-11v11m30-11v12m9-12v12m41-12v11" stroke="#f5e1b4" strokeWidth="2" opacity=".7" /></g>
          : building.id.includes('pottery') ? <g fill="#8da5a0" stroke="#667f74" strokeWidth="1.5"><path d="M25 61h12l-1 5q12 12 0 15H23q-10-8 3-15Z" /><path d="M46 59h11v6q10 12 0 16H44q-8-10 3-16Z" /><path d="M73 63h12l-1 5q12 10 0 13H71q-10-8 3-13Z" /><path d="M114 60h13v7q12 10 0 14h-15q-11-9 3-14Z" /></g>
          : building.id.includes('baskets') ? <g><use href={href('basket')} transform="translate(35 73) scale(.6)" /><use href={href('basket')} transform="translate(80 73) scale(.65)" /><use href={href('basket')} transform="translate(125 75) scale(.55)" /></g>
          : building.id.includes('rice') ? <g fill="#d1bd85" stroke="#a38b57" strokeWidth="1.5"><path d="M24 79q-7-14 1-25h18q10 16 1 25Z" /><path d="M64 79q-7-14 1-25h18q10 16 1 25Z" /><path d="M107 79q-7-14 1-25h18q10 16 1 25Z" /><path d="M24 55q10 4 19 0m21 0q10 4 19 0m24 0q10 4 19 0" stroke="#f1daa1" strokeWidth="3" /></g>
          : building.id.includes('flowers') ? <g><use href={href('flowers')} transform="translate(39 77) scale(.5)" /><use href={href('flowers')} transform="translate(89 77) scale(.5)" /><use href={href('flowers')} transform="translate(130 77) scale(.5)" /></g>
          : <g stroke="#7a8b51" strokeWidth="1.2">{Array.from({ length: 16 }, (_, item) => <ellipse key={item} cx={24 + (item % 8) * 16} cy={item < 8 ? 67 : 76} rx={item % 3 === 0 ? 8 : 6} ry="6" fill={['#dca55d', '#d68a62', '#b9bd6d', '#7f9e65', '#e3c774'][(item + index) % 5]} />)}</g>}
        <g className="scenery-awning" style={animateStyle(index)}>
          <path d="m27 4 105 0 28 41-15 9-17-5-15 6-17-6-16 6-17-6-16 6-17-6-16 5L0 45Z" fill={building.roof} stroke="#786345" strokeWidth="3" />
          <path className="scenery-stall-awning-panels" d="m40 5 12 0-19 45-13 2Zm32 0 12 0-7 47-14 1Zm33 0 12 0 8 47-15 2Zm26 4 9 2 17 30-13 7Z" fill="#fff1cd" opacity=".2" />
          <path d="M28 8h103M6 44q35-9 71-1t76 1" fill="none" stroke="#6f5639" strokeWidth="2" opacity=".48" />
          <path d="m42 4-16 43 20 4L58 4ZM75 4l-4 46 18 1-1-47ZM108 4l9 46 16 0-14-46Z" fill="#f3e3b7" opacity=".52" />
          <path d="m27 4 105 0m-105 0-27 41m132-41 28 41" fill="none" stroke="#f2ddb0" strokeWidth="5" opacity=".82" />
          <path d="M0 45q10-8 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0l-15 9-17-5-15 6-17-6-16 6-17-6-16 6-17-6-16 5Z" fill="#f0d7a5" stroke="#806a49" strokeWidth="2" />
          <path d="M8 47q11-6 20 0v9q-10 3-18 2Zm37-1q12-5 23 0v10q-12 3-23 0Zm39 0q12-5 23 0v10q-11 4-23 0Zm39 0q12-5 22 0l-1 9q-11 3-21 0Z" fill="#fff1cf" opacity=".2" />
          <path d="m155 44-15-2m10 11-2 23m-112-18v23m111-26v26M16 48h12m110 5h11" fill="none" stroke="#795f3f" strokeWidth="3" />
          <path d="m24 59-2 6m39-7-1 7m39-7v7m37-8 1 7" stroke="#4e4938" strokeWidth="2" opacity=".52" />
        </g>
        <use href={href('basket')} x="-9" y="164" transform="scale(.65)" />
      </g>)}

    {/* Modest timber gateways are village architecture; no quest or character structures. */}
    {OPENING_MAP_GATES.map(gate => <g key={gate.id} transform={`translate(${gate.point.x} ${gate.point.y})`}>
      <ellipse cx="19" cy="16" rx="111" ry="24" fill={ref('shadow')} />
      <path d="M-89 10v-104M89 10v-104" stroke="#8d7751" strokeWidth="16" strokeLinecap="round" /><path d="M-92 7v-98m178 98v-98" stroke="#d0ac70" strokeWidth="5" />
      <path d="M-104-85h208v-19h-208Z" fill="#b99a64" stroke="#92764b" strokeWidth="3" />
      <path d="m-122-103 30-23H91l31 23-12 12H-111Z" fill={ref('roof')} stroke="#846b4d" strokeWidth="3" /><path d="M-122-103q118 17 244 0" stroke="#dbb17c" strokeWidth="4" fill="none" />
      <path d="M-79-77l27-10m131 10L52-87" stroke="#b99c6a" strokeWidth="6" />
      <path d="M-104 13h29v10h-29Zm179 0h29v10H75Z" fill="#b2a586" />
    </g>)}

    <g opacity=".85"><use href={href('basket')} x="1810" y="1715" /><use href={href('basket')} x="2500" y="1370" /><use href={href('jar')} x="2425" y="1880" /><use href={href('jar')} x="1770" y="1330" /></g>

    {!simplified && <g className="scenery-atmosphere">
      <g className="scenery-water-rings" fill="none" stroke="#e6e9c4" strokeWidth="2" opacity=".65"><ellipse cx="3120" cy="1100" rx="39" ry="12" /><ellipse cx="3095" cy="2460" rx="44" ry="13" /><ellipse cx="3185" cy="2250" rx="37" ry="11" /><ellipse cx="1070" cy="590" rx="35" ry="10" /></g>
      <g className="scenery-birds"><use href={href('bird')} x="1780" y="390" /><use href={href('bird')} x="1822" y="365" transform="translate(365 70) scale(.8)" /><use href={href('bird')} x="1830" y="410" /><use href={href('bird')} x="1880" y="388" /></g>
      <g className="scenery-butterfly" transform="translate(2540 2100)"><path className="scenery-butterfly-wings" d="M0 0q-27-28-28-3T0 5q27 20 27-5T0 0Z" fill="#efd6a0" stroke="#c6aa76" strokeWidth="1.5" /><path d="M0-4v12" stroke="#8a8860" strokeWidth="2" /></g>
      <g className="scenery-butterfly scenery-butterfly--second" transform="translate(1380 1300)"><path className="scenery-butterfly-wings" d="M0 0q-20-23-21-2T0 4q21 16 21-4T0 0Z" fill="#e6b29b" /><path d="M0-3v10" stroke="#8a8860" strokeWidth="2" /></g>
      <g fill="#fff5c0" className="scenery-pollen"><circle cx="1990" cy="1430" r="2.5" /><circle cx="2340" cy="1630" r="3" /><circle cx="1440" cy="1050" r="2.5" /><circle cx="2660" cy="1930" r="3" /><circle cx="1050" cy="1560" r="2.5" /><circle cx="3600" cy="1680" r="3" /></g>
      <g className="scenery-clouds" opacity=".4"><use href={href('cloud')} x="570" y="430" /><use href={href('cloud')} x="2440" y="510" /><use href={href('cloud')} x="3780" y="1990" /></g>
      <g className="scenery-clouds scenery-clouds--high" opacity=".27"><use href={href('cloud')} x="1200" y="2050" /><use href={href('cloud')} x="3650" y="800" /></g>
    </g>}
    <rect width="4320" height="3000" fill={ref('sunwash')} pointerEvents="none" />
    {!simplified && <rect width="4320" height="3000" fill={ref('paper')} pointerEvents="none" />}
  </g>;
});

/** Only nearby objects need a foreground layer in front of the player's feet. */
export function openingMapForegroundIds(point: XY): string[] {
  const foreground: { id: string; y: number }[] = [];
  const dockCargoBottom = OPENING_MAP_DOCK.y + 104;
  if (point.y > OPENING_MAP_DOCK.y - 95 && point.y < dockCargoBottom - 5
    && point.x > OPENING_MAP_DOCK.x + 120 && point.x < OPENING_MAP_DOCK.x + OPENING_MAP_DOCK.width + 10) {
    foreground.push({ id: 'dock-cargo', y: dockCargoBottom });
  }
  for (const building of OPENING_MAP_BUILDINGS) {
    const feet = building.y + building.height;
    if (feet > point.y + 5 && point.y > building.y - 95
      && point.x > building.x - 45 && point.x < building.x + building.width + 45) {
      foreground.push({ id: building.id, y: feet });
    }
  }
  for (const tree of OPENING_MAP_TREES) {
    const canopyWidth = (tree.kind === 'banyan' ? 185 : tree.kind === 'palm' ? 140 : 120) * tree.scale;
    if (tree.y > point.y + 4 && point.y > tree.y - 260 * tree.scale
      && Math.abs(point.x - tree.x) < canopyWidth + 25) foreground.push({ id: tree.id, y: tree.y });
  }
  return foreground.sort((left, right) => left.y - right.y).map(object => object.id);
}
