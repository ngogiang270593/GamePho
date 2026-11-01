import type { SVGProps } from 'react';
import forestKeeperBaseFemale from '../../assets/characters/forest-keeper/reference-base-female.png';
import forestKeeperBaseMale from '../../assets/characters/forest-keeper/reference-base-male.png';
import forestKeeperBoots from '../../assets/characters/forest-keeper/items/aligned/ung.png';
import forestKeeperBasket from '../../assets/characters/forest-keeper/items/aligned/gio.png';
import forestKeeperBandana from '../../assets/characters/forest-keeper/items/aligned/bang_do.png';
import forestKeeperJacket from '../../assets/characters/forest-keeper/items/aligned/ao.png';
import forestKeeperKnife from '../../assets/characters/forest-keeper/items/aligned/dao.png';
import forestKeeperPants from '../../assets/characters/forest-keeper/items/aligned/quan.png';
import forestKeeperPouch from '../../assets/characters/forest-keeper/items/aligned/tui.png';
import type { CharacterAppearance, CharacterGender } from '../game/character';
import { itemById, type CharacterCustomization } from '../game/characterCustomization';
import { getOutfitPalette } from '../game/outfits';
import { CharacterOutfit } from './CharacterOutfit';
import { ForestKeeperMapActionSprite } from './ForestKeeperMapActionSprite';
import { ForestKeeperTurnaround } from './ForestKeeperTurnaround';

type OutfitAnchor = { x: number; y: number; width: number; height?: number };
export type OutfitAnchors = {
  shirt: OutfitAnchor;
  pants: OutfitAnchor;
  boots: OutfitAnchor;
  headband: OutfitAnchor;
  basket: OutfitAnchor;
  medicineBag: OutfitAnchor;
  knife: OutfitAnchor;
};

export type OutfitItem = {
  id: string;
  slot: 'shirt' | 'pants' | 'boots' | 'headband' | 'back' | 'bag' | 'weapon';
  maleSrc?: string;
  femaleSrc?: string;
  maleAnchor?: Partial<OutfitAnchors>;
  femaleAnchor?: Partial<OutfitAnchors>;
  zIndex: number;
};

export const maleAnchors: OutfitAnchors = {
  shirt: { x: 239, y: 472, width: 290 },
  pants: { x: 283, y: 707, width: 220, height: 138 },
  boots: { x: 302, y: 870, width: 176, height: 120 },
  headband: { x: 246, y: 159, width: 276 },
  basket: { x: 172, y: 543, width: 205 },
  medicineBag: { x: 239, y: 642, width: 86 },
  knife: { x: 472, y: 631, width: 47 },
};

export const femaleAnchors: OutfitAnchors = {
  shirt: { x: 251, y: 535, width: 265 },
  pants: { x: 286, y: 740, width: 198, height: 110 },
  boots: { x: 305, y: 870, width: 159, height: 120 },
  headband: { x: 246, y: 218, width: 276 },
  basket: { x: 184, y: 573, width: 190 },
  medicineBag: { x: 250, y: 654, width: 80 },
  knife: { x: 464, y: 640, width: 44 },
};

const sourceSizes = {
  shirt: { width: 725, height: 692 },
  pants: { width: 512, height: 456 },
  boots: { width: 443, height: 416 },
  headband: { width: 492, height: 232 },
  basket: { width: 477, height: 410 },
  medicineBag: { width: 379, height: 408 },
  knife: { width: 157, height: 544 },
} as const;

const outfitItems: OutfitItem[] = [
  {
    id: 'back-basket',
    slot: 'back',
    maleSrc: forestKeeperBasket,
    femaleSrc: forestKeeperBasket,
    maleAnchor: { basket: maleAnchors.basket },
    femaleAnchor: { basket: femaleAnchors.basket },
    zIndex: 0,
  },
  {
    id: 'bottoms-ranger',
    slot: 'pants',
    maleSrc: forestKeeperPants,
    femaleSrc: forestKeeperPants,
    maleAnchor: { pants: maleAnchors.pants },
    femaleAnchor: { pants: femaleAnchors.pants },
    zIndex: 20,
  },
  {
    id: 'clothes-forest-keeper',
    slot: 'shirt',
    maleSrc: forestKeeperJacket,
    femaleSrc: forestKeeperJacket,
    maleAnchor: { shirt: maleAnchors.shirt },
    femaleAnchor: { shirt: femaleAnchors.shirt },
    zIndex: 30,
  },
  {
    id: 'front-herb-knife',
    slot: 'bag',
    maleSrc: forestKeeperPouch,
    femaleSrc: forestKeeperPouch,
    maleAnchor: { medicineBag: maleAnchors.medicineBag },
    femaleAnchor: { medicineBag: femaleAnchors.medicineBag },
    zIndex: 40,
  },
  {
    id: 'front-herb-knife',
    slot: 'weapon',
    maleSrc: forestKeeperKnife,
    femaleSrc: forestKeeperKnife,
    maleAnchor: { knife: maleAnchors.knife },
    femaleAnchor: { knife: femaleAnchors.knife },
    zIndex: 41,
  },
  {
    id: 'hat-forest-bandana',
    slot: 'headband',
    maleSrc: forestKeeperBandana,
    femaleSrc: forestKeeperBandana,
    maleAnchor: { headband: maleAnchors.headband },
    femaleAnchor: { headband: femaleAnchors.headband },
    zIndex: 60,
  },
  {
    id: 'shoes-ranger-boots',
    slot: 'boots',
    maleSrc: forestKeeperBoots,
    femaleSrc: forestKeeperBoots,
    maleAnchor: { boots: maleAnchors.boots },
    femaleAnchor: { boots: femaleAnchors.boots },
    zIndex: 80,
  },
];

const itemSlots = {
  shirt: 'clothes',
  pants: 'bottoms',
  boots: 'shoes',
  headband: 'hat',
  back: 'back',
  bag: 'front',
  weapon: 'front',
} as const;

interface Props {
  clipPathId: string;
  gender: CharacterGender;
  appearance: CharacterAppearance;
  skin: string;
  customization?: CharacterCustomization;
  portrait?: boolean;
  facing: 'up' | 'down' | 'left' | 'right';
  walking?: boolean;
  running?: boolean;
  debugOutfitAlignment?: boolean;
  className: string;
  svgProps: SVGProps<SVGSVGElement>;
}

function layerAnchor(item: OutfitItem, gender: CharacterGender): OutfitAnchor | undefined {
  const key = item.slot === 'shirt' ? 'shirt'
    : item.slot === 'pants' ? 'pants'
      : item.slot === 'boots' ? 'boots'
        : item.slot === 'headband' ? 'headband'
          : item.slot === 'back' ? 'basket'
            : item.slot === 'bag' ? 'medicineBag' : 'knife';
  return (gender === 'male' ? item.maleAnchor : item.femaleAnchor)?.[key];
}

export function ForestKeeperOutfit({
  clipPathId,
  gender,
  appearance,
  skin,
  customization,
  portrait = false,
  facing,
  walking = false,
  running = false,
  debugOutfitAlignment = false,
  className,
  svgProps,
}: Props) {
  const equipped = customization?.equipped ?? {};
  const layers = outfitItems
    .filter(item => item.id === equipped[itemSlots[item.slot]])
    .sort((a, b) => a.zIndex - b.zIndex);
  const anchors = gender === 'male' ? maleAnchors : femaleAnchors;
  const base = gender === 'male' ? forestKeeperBaseMale : forestKeeperBaseFemale;
  const shirtItem = outfitItems.find(item => item.slot === 'shirt');
  const selectedShirtId = equipped.clothes;
  const customShirt = selectedShirtId !== shirtItem?.id;
  const selectedPantsId = equipped.bottoms;
  const customPants = selectedPantsId !== outfitItems.find(item => item.slot === 'pants')?.id;
  const pantsItem = itemById(selectedPantsId);
  const pantsColor = pantsItem?.appearanceValue && /^#[\da-f]{6}$/i.test(pantsItem.appearanceValue)
    ? pantsItem.appearanceValue
    : '#806148';
  const palette = getOutfitPalette(appearance.outfit, gender);
  const wearingShirt = Boolean(selectedShirtId);
  const wearingPants = Boolean(selectedPantsId);
  const wearingBoots = equipped.shoes === 'shoes-ranger-boots';
  const wearingBasket = equipped.back === 'back-basket';
  const completeUniform = !customization || (
    equipped.clothes === 'clothes-forest-keeper'
    && equipped.bottoms === 'bottoms-ranger'
    && equipped.shoes === 'shoes-ranger-boots'
    && equipped.hat === 'hat-forest-bandana'
    && equipped.back === 'back-basket'
    && equipped.front === 'front-herb-knife'
  );
  if (completeUniform && gender === 'male' && !portrait && (walking || running)) {
    return <ForestKeeperMapActionSprite
      action={running ? 'run' : 'walk'}
      facing={facing}
      className={className}
      svgProps={svgProps}
    />;
  }
  if (completeUniform) return <ForestKeeperTurnaround
    gender={gender} facing={facing} portrait={portrait} walking={walking} running={running} className={className}
    debug={debugOutfitAlignment} svgProps={svgProps}
  />;

  function renderLayer(item: OutfitItem) {
    const src = gender === 'male' ? item.maleSrc : item.femaleSrc;
    const anchor = layerAnchor(item, gender);
    if (!src || !anchor) return null;
    const size = sourceSizes[item.slot === 'shirt' ? 'shirt'
      : item.slot === 'pants' ? 'pants'
        : item.slot === 'boots' ? 'boots'
          : item.slot === 'headband' ? 'headband'
            : item.slot === 'back' ? 'basket'
              : item.slot === 'bag' ? 'medicineBag' : 'knife'];
    const height = anchor.height ?? size.height * (anchor.width / size.width);
    const compatibilityClass = {
      'clothes-forest-keeper': 'reference-forest-jacket',
      'bottoms-ranger': 'reference-forest-pants ranger-shorts',
      'shoes-ranger-boots': 'reference-forest-boots',
      'hat-forest-bandana': 'reference-forest-bandana forest-leaf-bandana',
      'back-basket': 'reference-forest-basket forest-herb-basket',
      'front-herb-knife': item.slot === 'bag' ? 'reference-forest-pouch' : 'reference-forest-knife',
    }[item.id] ?? '';
    if (item.slot === 'boots') {
      const centers = gender === 'male' ? [334, 446] : [337, 432];
      const bootWidth = height * (221.5 / 416);
      return <g key={item.id} className="reference-outfit-layer reference-outfit-boots reference-forest-boots" data-outfit-item={item.id}>
        {centers.map((center, index) => <g key={index} className={`forest-fitted-boot forest-fitted-boot-${index}`}>
          <svg x={center - bootWidth / 2} y={anchor.y} width={bootWidth} height={height} viewBox={`${index * 221.5} 0 221.5 416`} overflow="hidden" preserveAspectRatio="xMidYMid meet">
            <image href={src} width="443" height="416" />
          </svg>
          {/* The calf sits inside the opening, behind the front leather rim. */}
          <path d={`M${center - 19} ${anchor.y + 3}Q${center} ${anchor.y - 1} ${center + 19} ${anchor.y + 3}L${center + 18} ${anchor.y + 10}Q${center} ${anchor.y + 17} ${center - 18} ${anchor.y + 10}Z`} fill={skin} />
          <path d={`M${center - 21} ${anchor.y + 9}Q${center} ${anchor.y + 20} ${center + 21} ${anchor.y + 9}`} fill="none" stroke="#593a28" strokeWidth="3" />
          <path d={`M${center - 20} ${anchor.y + 11}Q${center} ${anchor.y + 21} ${center + 20} ${anchor.y + 11}`} fill="none" stroke="#bf8c5c" strokeWidth="1.3" />
        </g>)}
      </g>;
    }
    return <image
      key={`${item.slot}-${item.id}`}
      className={`reference-outfit-layer reference-outfit-${item.slot}${item.slot === 'shirt' ? ' sprite-torso' : ''} ${compatibilityClass}`}
      data-outfit-item={item.id}
      data-outfit={item.slot === 'shirt' ? appearance.outfit : undefined}
      data-z-index={item.zIndex}
      href={src}
      x={anchor.x}
      y={anchor.y}
      width={anchor.width}
      height={height}
      preserveAspectRatio={anchor.height ? 'none' : 'xMidYMid meet'}
    />;
  }

  const leftHandClip = gender === 'male'
    ? 'M208 706Q232 709 267 735L274 775Q258 796 222 770L207 749Z'
    : 'M247 720Q263 724 289 746L296 786Q281 804 254 782L245 755Z';
  const rightHandClip = gender === 'male'
    ? 'M495 735Q527 711 550 710L556 750Q540 778 512 790L495 773Z'
    : 'M477 744Q499 724 520 720L524 757Q510 785 488 800L476 783Z';
  const debugPoints = gender === 'male'
    ? [{ label: 'Vai', x: 239, y: 474 }, { label: 'Hông', x: 384, y: 708 }, { label: 'Gối', x: 384, y: 852 }, { label: 'Bàn chân', x: 384, y: 988 }]
    : [{ label: 'Vai', x: 251, y: 537 }, { label: 'Hông', x: 384, y: 711 }, { label: 'Gối', x: 384, y: 857 }, { label: 'Bàn chân', x: 384, y: 988 }];

  return <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 768 1024"
    className={className}
    data-starting-character="forest-keeper"
    data-reference-base={gender}
    data-debug-outfit={debugOutfitAlignment || undefined}
    aria-hidden="true"
    focusable="false"
    {...svgProps}
  >
    <defs>
      <linearGradient id={`${clipPathId}-forest-leg`} x1="0" x2="1">
        <stop stopColor="#d99b7e" /><stop offset=".22" stopColor={skin} /><stop offset=".7" stopColor="#ffe2c8" /><stop offset="1" stopColor={skin} />
      </linearGradient>
      {/* Replace the starter clothing instead of leaving it beneath transparent
          garment edges. Keep the original face, neck and exposed forearms. */}
      <mask id={`${clipPathId}-forest-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="1024" style={{ maskType: 'luminance' }}>
        <rect width="768" height="1024" fill="white" />
        {wearingShirt && <path d={gender === 'male'
          ? 'M344 480L310 493L279 505L235 600L307 629L290 735L500 735L489 626L534 599L482 503L429 481L429 510L349 510Z'
          : 'M341 546L302 558L281 580L254 644L305 667L288 768L479 768L465 665L514 643L475 568L428 547L427 573L343 573Z'} fill="black" />}
        {wearingPants && <rect x="278" y={gender === 'male' ? 723 : 751} width="228" height={gender === 'male' ? 118 : 97} fill="black" />}
        {wearingBoots && <rect x="280" y="820" width="226" height="182" fill="black" />}
      </mask>
      <clipPath id={`${clipPathId}-forest-hands`}>
        <path d={`${leftHandClip} ${rightHandClip}`} />
      </clipPath>
    </defs>
    <g transform={facing === 'left' ? 'translate(768 0) scale(-1 1)' : undefined}>
      {layers.filter(item => item.slot === 'back').map(renderLayer)}
    </g>
    <g className="sprite-body reference-character-body" transform={facing === 'left' ? 'translate(768 0) scale(-1 1)' : undefined}>
      <image className="reference-character-base" href={base} x="0" y="0" width="768" height="1024" preserveAspectRatio="xMidYMid meet" mask={`url(#${clipPathId}-forest-body)`} />
      {!portrait && wearingBoots && <g className="forest-fitted-legs" fill={`url(#${clipPathId}-forest-leg)`} stroke="#604236" strokeWidth="3" strokeLinejoin="round">
        {(gender === 'male' ? [334, 446] : [337, 432]).map(center => <g key={center}>
          <path d={`M${center - 32} 818Q${center - 36} 842 ${center - 26} 863L${center - 19} 882Q${center} 891 ${center + 19} 882L${center + 26} 863Q${center + 36} 842 ${center + 32} 818Z`} />
          <path d={`M${center - 29} 840Q${center} 852 ${center + 29} 840`} fill="none" stroke="#b7775d" strokeWidth="5" opacity=".24" />
        </g>)}
      </g>}
      {!portrait && customPants && selectedPantsId && <g className="reference-character-bottoms" data-item-id={selectedPantsId}>
        {selectedPantsId === 'bottoms-skirt'
          ? <path d="M296 711Q384 724 472 711L498 844Q384 870 270 844Z" fill={pantsColor} stroke="#493c37" strokeWidth="5" strokeLinejoin="round" />
          : <path d="M296 711Q384 724 472 711L466 828L443 923L398 925L382 838L366 838L350 925L305 923L294 828Z" fill={pantsColor} stroke="#493c37" strokeWidth="5" strokeLinejoin="round" />}
      </g>}
      {!portrait && layers.filter(item => item.slot !== 'back' && item.slot !== 'boots' && item.slot !== 'headband').map(renderLayer)}
      {!portrait && customShirt && <g className="reference-outfit-fallback" transform="translate(0 -144) scale(4.8)">
        <CharacterOutfit appearance={appearance} facing={facing} skin={skin} cloth={palette.main} itemId={selectedShirtId} />
      </g>}
      {!portrait && wearingBasket && <g className="forest-basket-straps" fill="none" strokeLinecap="round">
        <path d={gender === 'male' ? 'M294 515Q316 557 320 665M470 515Q454 557 452 665' : 'M303 575Q324 609 326 690M463 575Q449 615 447 690'} stroke="#4f3829" strokeWidth="18" />
        <path d={gender === 'male' ? 'M294 515Q316 557 320 665M470 515Q454 557 452 665' : 'M303 575Q324 609 326 690M463 575Q449 615 447 690'} stroke="#ae8050" strokeWidth="11" />
        <path d={gender === 'male' ? 'M293 516Q312 557 316 648M468 516Q451 561 449 648' : 'M301 576Q320 611 322 675M461 576Q446 617 444 675'} stroke="#d1ab75" strokeWidth="2" />
      </g>}
      {!portrait && <image className="reference-character-hands" href={base} x="0" y="0" width="768" height="1024" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipPathId}-forest-hands)`} />}
      {!portrait && layers.filter(item => item.slot === 'headband').map(renderLayer)}
      {!portrait && layers.filter(item => item.slot === 'boots').map(renderLayer)}
    </g>
    {debugOutfitAlignment && !portrait && <g className="outfit-alignment-debug" pointerEvents="none" fontFamily="sans-serif">
      <text x="384" y="34" textAnchor="middle" fill="#222" fontSize="22" fontWeight="700">{gender}</text>
      {([
        ['shirt', '#ef4444'],
        ['pants', '#2563eb'],
        ['boots', '#eab308'],
      ] as const).map(([key, color]) => {
        const anchor = anchors[key];
        const size = sourceSizes[key];
        const height = anchor.height ?? size.height * (anchor.width / size.width);
        return <rect key={key} x={anchor.x} y={anchor.y} width={anchor.width} height={height} fill="none" stroke={color} strokeWidth="3" />;
      })}
      {debugPoints.map(({ label, x, y }) => <g key={label}>
        <circle cx={x} cy={y} r="6" fill="#fff" stroke="#111" strokeWidth="2" />
        <text x={x + 9} y={y - 7} fill="#111" fontSize="13" stroke="white" strokeWidth="3" paintOrder="stroke">{label}</text>
      </g>)}
    </g>}
  </svg>;
}
