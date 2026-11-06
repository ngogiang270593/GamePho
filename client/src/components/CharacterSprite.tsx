import { memo, useId, type SVGProps } from 'react';
import { characterOptions, DEFAULT_APPEARANCE, type CharacterAppearance, type Facing } from '../game/character';
import { getOutfitPalette } from '../game/outfits';
import { CharacterOutfit } from './CharacterOutfit';
import { MapOneNpcOutfit } from './MapOneNpcOutfit';
import { itemById, type CharacterCustomization } from '../game/characterCustomization';
import type { MapOneNpcVisualDesign } from '../game/mapOneNpcDesign';
import type { StartingCharacterId } from '../game/startingCharacters';
import { startingCharacterArtwork } from '../game/startingCharacterArtwork';
import { ForestKeeperOutfit } from './ForestKeeperOutfit';
import { SpriteSheetCharacter } from './SpriteSheetCharacter';
import { spriteSheetTarget, useAppliedSpriteSheet, type CharacterSpriteSheet, type SpriteAction } from '../game/characterSpriteSheet';

export type CharacterEmotion = 'neutral' | 'happy' | 'angry' | 'surprised';
export type CharacterPose = 'idle' | 'order' | 'stir' | 'carry' | 'offer' | 'eat' | 'cheer' | 'complain' | 'gossip';
interface CharacterSpriteProps extends SVGProps<SVGSVGElement> {
  appearance?: CharacterAppearance;
  facing?: Facing;
  walking?: boolean;
  running?: boolean;
  portrait?: boolean;
  emotion?: CharacterEmotion;
  pose?: CharacterPose;
  customization?: CharacterCustomization;
  npcDesign?: MapOneNpcVisualDesign;
  startingCharacter?: StartingCharacterId;
  debugOutfitAlignment?: boolean;
  spriteSheet?: CharacterSpriteSheet | null;
  spriteAction?: SpriteAction;
  spriteFrame?: number;
  spritePlaying?: boolean;
  spritePlaybackIntervalMultiplier?: number;
}

export const CharacterSprite = memo(function CharacterSprite({
  appearance = DEFAULT_APPEARANCE, facing = 'down', walking = false,
  running = false,   portrait = false, emotion = 'neutral', pose = 'idle', customization, npcDesign, startingCharacter, debugOutfitAlignment = false, spriteSheet, spriteAction, spriteFrame, spritePlaying, spritePlaybackIntervalMultiplier, className = '', ...props
}: CharacterSpriteProps) {
  const id = useId().replace(/:/g, '');
  const spriteTemplate = startingCharacter ?? (appearance.outfit === 'forest' || customization?.equipped.clothes === 'clothes-forest-keeper' ? 'forest-keeper' : undefined);
  const appliedSheet = useAppliedSpriteSheet(!npcDesign && spriteTemplate === 'forest-keeper' ? spriteSheetTarget(spriteTemplate, appearance.gender) : null);
  if (!spriteSheet && !npcDesign && (startingCharacter === 'field-worker' || startingCharacter === 'village-apprentice')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox={portrait ? '9 5 142 128' : '0 0 160 224'}
      className={`player-sprite character-${appearance.gender} character-reference ${className}`}
      data-starting-character={startingCharacter} data-character-artwork="reference-image"
      aria-hidden="true" focusable="false" {...props}>
      <image href={startingCharacterArtwork(startingCharacter, appearance.gender)} width="160" height="224" preserveAspectRatio="xMidYMid meet" />
    </svg>;
  }
  const sheet = spriteSheet === undefined ? appliedSheet : spriteSheet;
  const action = spriteAction ?? (walking ? running ? 'run' : 'walk' : 'idle');
  const usesEightFrames = sheet?.movementFrameCount === 8 || Object.values(sheet?.clips.walk.directions ?? {}).some(range => range.count === 8);
  const directionReady = !usesEightFrames
    || sheet?.clips[action]?.directions[facing].count === 8
    || (action === 'idle' && sheet?.clips.walk.directions[facing].count === 8);
  if (sheet && (!npcDesign || spriteSheet !== undefined) && directionReady) return <SpriteSheetCharacter
    {...props} sheet={sheet} facing={facing} portrait={portrait}
    action={action}
    frame={spriteFrame} playing={spritePlaying}
    playbackIntervalMultiplier={spritePlaybackIntervalMultiplier}
    data-starting-character={spriteTemplate}
    className={`character-${appearance.gender}${walking ? ' is-walking' : ''}${running ? ' is-running' : ''} ${className}`}
  />;
  const baseAppearance = appearance;
  const hairItem = itemById(customization?.equipped.hair);
  const clothesItem = itemById(customization?.equipped.clothes);
  const hatItem = itemById(customization?.equipped.hat);
  const equippedAccessory = characterOptions.accessory.find(option => option.value === hatItem?.appearanceValue)?.value;
  const renderAppearance: CharacterAppearance = {
    ...appearance,
    hair: (hairItem?.appearanceValue ?? appearance.hair) as CharacterAppearance['hair'],
    outfit: (clothesItem?.appearanceValue ?? appearance.outfit) as CharacterAppearance['outfit'],
    accessory: hatItem ? equippedAccessory ?? 'none' : appearance.accessory,
  };
  appearance = renderAppearance;
  const male = appearance.gender === 'male';
  const skin = characterOptions.skin.find(option => option.value === appearance.skin)?.color ?? '#f4c39f';
  const skinHighlight = { porcelain: '#ffe9d6', peach: '#ffdfbe', honey: '#eabd92', tan: '#ce976d', bronze: '#b17850', deep: '#915f43' }[appearance.skin];
  const hair = npcDesign?.hairstyle.startsWith('silver') || npcDesign?.hairstyle === 'gray-topknot' || npcDesign?.faceShape === 'wrinkled'
    ? '#aaa49a'
    : { ink: '#29282e', brown: '#633d31', chestnut: '#8b5135' }[appearance.hairColor];
  const basePalette = getOutfitPalette(appearance.outfit, appearance.gender);
  const identityPalette = getOutfitPalette(baseAppearance.outfit, baseAppearance.gender);
  const palette = npcDesign ? {
    ...basePalette,
    main: npcDesign.outfitColor,
    light: npcDesign.accentColor,
    dark: npcDesign.outfitColor,
    trim: npcDesign.accentColor,
    pants: npcDesign.trouserColor,
  } : basePalette;
  const back = facing === 'up';
  const side = facing === 'left' || facing === 'right';
  const shortHair = ['short', 'sidepart', 'crop', 'topknot'].includes(appearance.hair);
  const mountedItem = itemById(customization?.equipped.mount);
  const shoeItem = itemById(customization?.equipped.shoes);
  const bottomsItem = itemById(customization?.equipped.bottoms);
  const bottomsColor = bottomsItem?.appearanceValue && /^#[\da-f]{6}$/i.test(bottomsItem.appearanceValue)
    ? bottomsItem.appearanceValue
    : identityPalette.pants;
  const wingItem = itemById(customization?.equipped.wings);
  const backItem = itemById(customization?.equipped.back);
  const frontItem = itemById(customization?.equipped.front);
  const effectItem = itemById(customization?.equipped.effect);
  const outline = '#493c37';
  const url = (name: string) => `url(#${id}-${name})`;
  if (startingCharacter === 'forest-keeper') {
    return <ForestKeeperOutfit
      clipPathId={id}
      gender={appearance.gender}
      appearance={appearance}
      skin={skin}
      customization={customization}
      portrait={portrait}
      facing={facing}
      walking={walking}
      running={running}
      debugOutfitAlignment={debugOutfitAlignment}
      className={`player-sprite character-${male ? 'male' : 'female'}${walking ? ' is-walking' : ''}${running ? ' is-running' : ''}${customization?.facing === 'three-quarter' ? ' view-three-quarter' : ''} facing-${facing} emotion-${emotion} pose-${pose} ${className}`}
      svgProps={props}
    />;
  }
  const bodyTransform = npcDesign
    ? `translate(80 212) scale(1 ${npcDesign.height}) ${npcDesign.posture === 'stooped' ? 'skewX(4)' : npcDesign.posture === 'leaning' ? 'rotate(-3 80 165)' : npcDesign.posture === 'ready' ? 'skewX(-2)' : ''} translate(-80 -212)`
    : undefined;
  const spriteClassName = `player-sprite character-${male ? 'male' : 'female'}${walking ? ' is-walking' : ''}${running ? ' is-running' : ''}${mountedItem ? ' is-riding' : ''}${customization?.facing === 'three-quarter' ? ' view-three-quarter' : ''}${npcDesign ? ` map-one-npc-sprite npc-animation-${npcDesign.animationSet} npc-posture-${npcDesign.posture} npc-body-${npcDesign.bodyType}` : ''} facing-${facing} emotion-${emotion} pose-${pose} ${className}`;

  function Lotus({ x, y, scale = 1, color = palette.trim }: { x: number; y: number; scale?: number; color?: string }) {
    return <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color} stroke="none" opacity=".85">
      <path d="M0 0C-12-8-11-17-8-20C-1-17 1-8 0 0M0 0C12-8 11-17 8-20C1-17-1-8 0 0" />
      <path d="M0 0C-8-13-4-23 0-26C4-23 8-13 0 0M-1 1C-15 0-20-8-19-12C-9-12-4-6-1 1M1 1C15 0 20-8 19-12C9-12 4-6 1 1" />
      <path d="M-16 5Q0-2 16 5Q0 11-16 5" opacity=".6" />
    </g>;
  }

  function Eye({ x, mirrored = false, width = 1 }: { x: number; mirrored?: boolean; width?: number }) {
    const almond = appearance.eyes === 'almond';
    const eyebrow = npcDesign?.eyebrowShape ?? 'soft';
    return <g data-eye={x < 80 ? 'left' : 'right'} transform={`translate(${x} 82) scale(${(mirrored ? -1 : 1) * width} 1)`}>
      <path d={emotion === 'angry' || eyebrow === 'angled' ? 'M-9-18L8-10' : emotion === 'surprised' || eyebrow === 'arched' ? 'M-9-18Q0-24 8-18' : eyebrow === 'straight' ? 'M-9-13H8' : eyebrow === 'strong' || eyebrow === 'silver' ? 'M-9-14Q0-17 8-13' : male ? 'M-9-12Q0-15 8-12' : 'M-9-13Q0-17 8-13'} fill="none" stroke={eyebrow === 'silver' ? '#aaa49a' : hair} strokeWidth={eyebrow === 'strong' ? 3.6 : male ? 3.1 : 2.2} strokeLinecap="round" />
      {emotion === 'happy' || emotion === 'neutral' && appearance.eyes === 'smile' ? <path d="M-9 1Q0-11 9 1" fill="none" stroke="#3a2f31" strokeWidth="3.3" strokeLinecap="round" /> : <g className="sprite-eye">
        <ellipse rx={almond ? 9 : npcDesign?.eyeShape === 'smile' ? 7.5 : 8.3} ry={almond ? 8 : npcDesign?.faceShape === 'child' ? 12.5 : 11.7} fill="#fff8ed" />
        <ellipse rx={almond ? 5.2 : 6.2} ry={almond ? 7.2 : 10.5} fill="#52382e" />
        <ellipse cy="1.5" rx="3.5" ry="6.5" fill="#282735" />
        <ellipse cx="-2" cy="-4" rx="2.5" ry="3.1" fill="white" />
        <circle cx="3" cy="4" r="1.4" fill="#f6cb87" />
        <path d={male ? 'M-9-5Q-1-10 9-6' : 'M-9-5Q-1-12 9-7M-7-7L-10-10'} fill="none" stroke="#352b2d" strokeWidth="2.3" strokeLinecap="round" />
      </g>}
    </g>;
  }

  const headPath = npcDesign
    ? (() => {
      const half = npcDesign.faceWidth / 2;
      const jaw = npcDesign.jawWidth / 2;
      const forehead = npcDesign.foreheadWidth / 2;
      const bottom = 68 + npcDesign.faceHeight * .48;
      const crown = 68 - npcDesign.faceHeight * .48;
      const angular = npcDesign.faceShape === 'square' || npcDesign.faceShape === 'angular';
      return `M${80 - forehead} 66 C${80 - forehead - 5} ${crown} ${80 + forehead + 5} ${crown} ${80 + forehead} 66
        L${80 + half} 91 ${80 + jaw} ${bottom - 14} Q80 ${bottom + (angular ? 3 : 14)} ${80 - jaw} ${bottom - 14}
        L${80 - half} 91 Z`;
    })()
    : male ? (appearance.face === 'oval'
    ? 'M34 65C34 24 126 24 126 65L123 94L110 113Q80 137 50 113L37 94Z'
    : 'M31 64C31 21 129 21 129 64L126 94Q120 115 100 123L60 123Q39 115 34 94Z') : appearance.face === 'oval'
    ? 'M37 65C37 27 122 25 123 65L119 92Q111 121 80 127Q49 121 41 92Z'
    : 'M32 64C32 23 128 23 128 64L125 92C121 115 103 125 80 125C57 125 39 115 35 92Z';

  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={portrait ? '9 5 142 128' : mountedItem ? '0 0 160 252' : '0 0 160 224'}
    className={spriteClassName}
    data-starting-character={startingCharacter}
    aria-hidden="true" focusable="false" {...props}>
    <defs>
      <linearGradient id={`${id}-skin`} x2=".7" y2="1"><stop stopColor={skinHighlight} /><stop offset=".35" stopColor={skin} /><stop offset="1" stopColor={skin} /></linearGradient>
      <linearGradient id={`${id}-hair`} x2=".7" y2="1"><stop stopColor={hair} /><stop offset="1" stopColor={hair === '#29282e' ? '#151f29' : '#382b2b'} /></linearGradient>
      <linearGradient id={`${id}-cloth`} x2="1" y2=".7"><stop stopColor={palette.light} /><stop offset=".45" stopColor={palette.main} /><stop offset="1" stopColor={palette.dark} /></linearGradient>
      <linearGradient id={`${id}-hat`} x2=".6" y2="1"><stop stopColor="#fff2c6" /><stop offset="1" stopColor="#cfaa65" /></linearGradient>
    </defs>
    <ellipse cx="80" cy="212" rx="38" ry="8" fill="#3b473c" opacity=".19" />
    <g transform={facing === 'left' ? 'translate(160 0) scale(-1 1)' : undefined} stroke={outline} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <g className={mountedItem ? 'character-riding-pose' : undefined} transform={mountedItem ? 'translate(0 22)' : undefined}>
      {wingItem && <g className={`character-layer character-wings ${wingItem.id}`} data-layer="wings" stroke="#557b59" opacity=".94">
        {wingItem.id.includes('butterfly') ? <g fill="#d99acb">
          <path d="M76 110Q29 107 22 74Q23 50 54 60Q74 66 79 97Q86 64 109 58Q141 53 138 80Q132 108 84 112Z" />
          <path d="M73 109Q37 121 32 102Q31 87 56 91Q72 93 79 103Q86 91 103 89Q128 88 126 104Q119 123 84 111Z" fill="#efb6d2" />
          <path d="M31 77Q54 78 75 103M131 76Q105 80 85 103" fill="none" stroke="#fff0d8" strokeWidth="2" />
        </g> : wingItem.id.includes('leaf') ? <g fill="#85b879">
          <path d="M77 112Q33 102 29 60Q56 63 77 98Q63 59 78 42Q98 62 82 100Q105 65 130 61Q130 100 84 113Z" />
          <path d="M79 109L47 68M81 109L111 69" fill="none" stroke="#d7edb4" strokeWidth="2.5" />
        </g> : wingItem.id.includes('phoenix') ? <g fill="#e5a65f">
          <path d="M77 112Q32 102 20 57Q42 55 66 83L52 44Q75 43 82 83Q95 48 118 43L97 88Q124 63 142 68Q126 106 84 114Z" />
          <path d="M78 108L39 66M81 108L61 56M84 108L110 54M86 108L132 75" fill="none" stroke="#f7d993" strokeWidth="3" />
        </g> : wingItem.id.includes('cloud') ? <g fill="#fff2d6" stroke="#b7ad9a">
          <path d="M77 111Q35 105 27 89Q20 72 42 73Q38 54 57 55Q71 56 77 75Q86 53 104 56Q122 59 116 76Q140 72 137 91Q132 108 84 112Z" />
          <path d="M40 95Q60 89 76 101M121 94Q103 89 85 102" fill="none" stroke="#c6d9db" strokeWidth="3" />
        </g> : <g fill="#b9ddf2" stroke="#6688aa">
          <path d="M76 112Q24 103 21 68Q40 70 53 83Q42 52 59 40Q75 57 78 87Q91 48 109 44Q118 65 97 91Q120 73 140 70Q129 105 84 113Z" />
          <path d="M34 79Q58 84 77 105M125 79Q104 84 84 105" fill="none" stroke="#f8e9ae" strokeWidth="3" />
        </g>}
      </g>}
      {backItem && <g className="character-layer character-back-accessory" data-layer="back_accessory" transform="translate(0 10)">
        {backItem.id.includes('flower')
          ? <g fill="#e58e71" stroke="#a9544d"><path d="M111 118L132 150" fill="none" stroke="#648c59" strokeWidth="4" /><circle cx="127" cy="111" r="7" /><circle cx="136" cy="119" r="6" /><circle cx="118" cy="120" r="6" /></g>
          : backItem.id === 'back-basket' ? <g className="forest-herb-basket" stroke="#684e35" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M8 166Q21 154 36 165L45 184Q29 197 12 187Z" fill="#b8874e" />
            <path d="M11 167Q27 151 40 166M14 173L40 171M12 179L43 177M13 185L44 182M19 164L19 190M27 161L28 193M35 164L36 190" fill="none" stroke="#e1bd7b" strokeWidth="1.8" />
            <path d="M14 166Q22 143 37 165" fill="none" stroke="#916a3e" strokeWidth="3" />
            <path d="M17 166Q14 151 20 145M23 164Q26 149 31 146M30 164Q35 151 40 151M20 160Q14 157 12 151M32 160Q38 155 43 157" fill="none" stroke="#71894e" strokeWidth="2.5" />
            <ellipse cx="22" cy="157" rx="2.5" ry="3" fill="#bd5c48" stroke="none" /><ellipse cx="36" cy="156" rx="2.5" ry="3" fill="#bd5c48" stroke="none" />
          </g>
          : backItem.id.includes('guitar') ? <g stroke="#684e3b" strokeWidth="2"><path d="M124 111L137 150" stroke="#805d43" strokeWidth="5" /><ellipse cx="125" cy="141" rx="10" ry="15" fill="#cb9c59" /><circle cx="125" cy="138" r="3" fill="#493b33" /></g>
            : backItem.id.includes('water') ? <g fill="#88b5aa" stroke="#547b73"><path d="M116 117H133L137 156H112Z" /><path d="M119 117V108H130V117M113 133H136" fill="none" strokeWidth="2" /></g>
              : backItem.id.includes('nameplate') ? <g fill="#e5c571" stroke="#73595a">
                <path d="M111 119H140V145H111Z" /><path d="M116 145V159M135 145V158M116 128H135M116 135H131" fill="none" stroke="#f2dfb6" strokeWidth="2" />
                <circle cx="115" cy="123" r="1.5" fill="#a96c4b" /><circle cx="136" cy="123" r="1.5" fill="#a96c4b" />
              </g>
                : backItem.id.includes('fabric') ? <g fill="#ad7184" stroke="#73595a">
                  <path d="M109 124Q120 116 136 124L140 153Q125 161 110 153Z" /><path d="M112 129Q124 119 134 129M111 140H137M111 149H137" fill="none" stroke="#f2dfb6" strokeWidth="2" />
                  <path d="M119 125Q125 120 131 125V130H119Z" fill="#f3d9b6" />
                </g>
                : <g fill="#b88b54" stroke="#765c39"><path d="M107 123Q135 118 139 142L137 159H111Z" /><path d="M110 128Q123 105 136 128M112 140H138M113 149H137" fill="none" strokeWidth="2" /></g>}
      </g>}
      <g className="sprite-body" transform={bodyTransform}>
        {!shortHair && <path d={side ? 'M52 62Q19 80 38 136L69 139L77 70Z' : 'M35 57Q15 91 35 140L123 140Q147 92 125 52Z'} fill={url('hair')} />}
        {appearance.hair === 'bun' && <g fill={url('hair')}><ellipse cx={side ? 40 : 80} cy="35" rx="25" ry="25" /><path d={side ? 'M22 35Q39 19 57 34' : 'M61 26Q80 9 99 28'} fill="none" stroke="#ffffff25" strokeWidth="3" />        <path d={side ? 'M25 51L52 53' : 'M59 48L101 48'} stroke={identityPalette.trim} strokeWidth="5" /></g>}
        {appearance.hair === 'topknot' && <g fill={url('hair')}><ellipse cx={side ? 62 : 80} cy="19" rx="20" ry="15" /><path d={side ? 'M48 28L75 28' : 'M65 28H96'} stroke={identityPalette.trim} strokeWidth="4" /></g>}
        <g className="character-layer character-bottoms" data-layer="bottoms" data-item-id={bottomsItem?.id}>
          <g className={`sprite-leg sprite-leg-left${mountedItem ? ' seated-leg' : ''}`}>
            {mountedItem ? <>
              <path d={side ? 'M63 164L82 164L96 176L88 186L66 178L59 173Z' : 'M55 163L77 163L94 175L87 185L65 178L54 173Z'} fill={bottomsColor} />
              <path d={side ? 'M86 180L98 179L99 203L87 203Z' : 'M84 179L96 179L96 203L85 203Z'} fill={bottomsColor} />
            </> : <>
              <path d={side ? 'M63 167L85 167L81 204L62 204Z' : 'M55 165L78 165L74 205L56 205Z'} fill={bottomsColor} />
              <path d={side ? 'M63 198L82 198Q97 204 89 211L62 211Q57 206 63 198' : 'M56 198L75 198L76 207Q73 214 52 212Q46 208 56 198'} fill="#4b3c3b" />
              <path d={side ? 'M65 200L80 200' : 'M57 201L70 201'} stroke="#bba289" strokeWidth="2" />
            </>}
          </g>
          <g className={`sprite-leg sprite-leg-right${mountedItem ? ' seated-leg' : ''}`}>
            {mountedItem ? <>
              <path d={side ? 'M81 164L101 164L110 174L97 184L79 178L76 172Z' : 'M82 163L105 163L112 173L98 184L82 178L77 172Z'} fill={bottomsColor} />
              <path d={side ? 'M96 180L108 179L109 201L97 203Z' : 'M96 179L108 179L109 201L97 203Z'} fill={bottomsColor} />
            </> : <>
              <path d={side ? 'M80 168L101 168L98 204L79 204Z' : 'M82 165L105 165L104 205L86 205Z'} fill={bottomsColor} />
              <path d={side ? 'M80 198L99 198Q112 204 107 211L79 211Q76 205 80 198' : 'M85 198L104 198Q116 208 108 212Q86 214 84 207Z'} fill="#4b3c3b" />
              <path d={side ? 'M83 200L98 200' : 'M90 201L103 201'} stroke="#bba289" strokeWidth="2" />
            </>}
          </g>
        </g>
        {npcDesign ? <MapOneNpcOutfit design={npcDesign} facing={facing} skin={skin} /> : <CharacterOutfit appearance={appearance} facing={facing} skin={skin} cloth={url('cloth')} itemId={clothesItem?.id} seated={Boolean(mountedItem)} />}
        {bottomsItem?.id === 'bottoms-skirt' && <g className="character-layer character-bottoms" data-layer="bottoms" data-item-id={bottomsItem.id}>
          <path
            d={side ? 'M63 158L99 158L108 195Q83 202 57 195Z' : 'M53 157Q80 162 107 157L121 194Q80 205 39 194Z'}
            fill={bottomsColor}
            stroke={outline}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d={side ? 'M61 190Q81 196 105 190' : 'M42 189Q80 198 118 189'} fill="none" stroke="#ad9872" strokeWidth="1.5" />
        </g>}
        {bottomsItem?.id === 'bottoms-ranger' && <g className="character-layer character-bottoms ranger-shorts" data-layer="bottoms" data-item-id={bottomsItem.id}>
          <path d={side ? 'M63 166L99 166L103 190Q84 197 59 190Z' : 'M52 166Q80 170 108 166L114 191Q80 199 46 191Z'} fill={bottomsColor} stroke="#493c37" strokeWidth="2" strokeLinejoin="round" />
          <path d={side ? 'M61 170L100 170' : 'M53 171Q80 174 107 171'} fill="none" stroke="#b48b64" strokeWidth="2" />
          {!side && <>
            <path d="M80 171V190M51 181Q62 184 73 181M87 181Q98 184 109 181" fill="none" stroke="#604a39" strokeWidth="1.4" />
            <path d="M49 176Q59 174 68 177L67 185Q58 187 49 184ZM92 177Q101 174 111 176L111 184Q101 187 93 185Z" fill="#957252" stroke="#604a39" strokeWidth="1.3" />
            <path d="M51 184Q59 187 67 185M93 185Q102 187 110 184" fill="none" stroke="#c1a17a" strokeWidth="1" />
            <path d="M47 190Q59 194 72 191M88 191Q101 194 113 190" fill="none" stroke="#c6a37a" strokeWidth="2.5" />
          </>}
          {side && <path d="M68 168V191M60 180H100M61 185Q80 190 101 185" fill="none" stroke="#604a39" strokeWidth="1.3" />}
        </g>}
        <g className="sprite-head">
          <ellipse cx="34" cy="85" rx="9" ry="12" fill={skin} /><ellipse cx="126" cy="85" rx="9" ry="12" fill={skin} />
          <path d="M32 82Q38 79 37 89M123 82Q130 79 127 89" fill="none" stroke="#bd8265" strokeWidth="1.4" />
          <path d={headPath} fill={url('skin')} />
          {back ? <g fill={url('hair')}>
            <path d={shortHair ? 'M32 66C28 9 130 11 129 66L124 95L111 101L98 98L81 106L64 98L50 101L36 94Z' : 'M32 66C28 9 130 11 129 66L126 107Q110 125 80 126Q49 124 34 106Z'} />
            <path d="M52 43Q39 75 49 104M67 35Q58 73 64 113M86 33Q91 72 85 114M104 41Q120 82 108 109" fill="none" stroke="#ffffff12" strokeWidth="3" />
            {appearance.hair === 'short' && <path d="M38 101L52 107L64 103L79 110L93 103L110 107L123 97" fill="none" stroke={outline} />}
          </g> : side ? <g>
            <path d="M113 72Q131 84 124 91L116 93" fill={skin} />
            <Eye x={npcDesign ? 80 - npcDesign.eyeSpacing / 2 : 75} width={.76} /><Eye x={npcDesign ? 80 + npcDesign.eyeSpacing / 2 : 104} />
            <path d={emotion === 'angry' ? 'M112 108Q118 101 124 108' : emotion === 'surprised' ? 'M117 103Q124 99 123 108Q116 114 117 103' : 'M113 106Q119 108 123 103'} stroke="#a35e56" strokeWidth="2" fill={emotion === 'surprised' ? '#874c4e' : 'none'} />
            {npcDesign && <path d={npcDesign.noseShape === 'broad' ? 'M113 96Q120 102 125 97' : npcDesign.noseShape === 'angular' ? 'M118 91L121 102L116 103' : 'M118 94Q123 100 118 103'} fill="none" stroke="#a66d58" strokeWidth={npcDesign.noseShape === 'broad' ? 2.3 : 1.7} />}
            <ellipse cx="96" cy="102" rx="10" ry="5" fill="#df8a7d" opacity={male ? .22 : .45} stroke="none" />
            <path d={appearance.hair === 'crop' ? 'M32 76Q23 27 65 26Q106 18 125 50L119 63L103 56L94 63L82 57L71 63L61 56L51 80L43 96L34 91Z' : shortHair ? 'M32 76C22 17 118 10 127 55Q109 44 98 57L88 64L78 57L68 63L58 55L49 83L43 96L34 91Z' : 'M32 76C22 17 118 10 127 55Q109 45 98 55L88 64L78 58L68 65L58 57L52 86L49 105Q38 106 34 95Z'} fill={url('hair')} />
            <path d="M42 53Q55 32 81 33M43 62Q50 42 61 39" stroke="#ffffff20" strokeWidth="3" fill="none" />
          </g> : <g>
            <Eye x={npcDesign ? 80 - npcDesign.eyeSpacing / 2 : 58} /><Eye x={npcDesign ? 80 + npcDesign.eyeSpacing / 2 : 102} mirrored />
            <path d={npcDesign?.noseShape === 'broad' ? 'M75 97Q80 102 85 97' : npcDesign?.noseShape === 'angular' ? 'M80 94L77 102L83 102' : npcDesign?.noseShape === 'round' ? 'M76 99Q80 104 84 99' : 'M78 96Q75 101 82 101'} fill="none" stroke="#a76f59" strokeWidth={npcDesign?.noseShape === 'broad' ? 2.5 : 1.6} />
            <ellipse cx="47" cy="103" rx="11" ry="5.5" fill="#df8a7d" opacity={male ? .22 : .45} stroke="none" /><ellipse cx="113" cy="103" rx="11" ry="5.5" fill="#df8a7d" opacity={male ? .22 : .45} stroke="none" />
            {emotion === 'surprised' ? <ellipse cx="80" cy="111" rx="5" ry="7" fill="#874c4e" stroke="#9b5553" strokeWidth="1.4" /> : <path d={npcDesign?.mouthShape === 'wide' ? 'M67 111Q80 119 93 111' : npcDesign?.mouthShape === 'thin' || npcDesign?.mouthShape === 'stern' ? 'M72 112H88' : npcDesign?.mouthShape === 'downturned' ? 'M72 110Q80 105 88 110' : emotion === 'angry' ? 'M71 115Q80 104 89 115' : emotion === 'happy' || npcDesign?.mouthShape === 'smile' ? 'M70 108Q80 127 90 108Z' : male ? 'M73 111Q80 116 87 111' : 'M72 110Q80 117 88 110'} fill={emotion === 'happy' || npcDesign?.mouthShape === 'smile' || emotion === 'neutral' && !male ? '#b55e63' : 'none'} stroke="#9b5553" strokeWidth={male ? 1.9 : 1.5} />}
            {emotion !== 'angry' && emotion !== 'surprised' && (!male || emotion === 'happy') && <path d="M76 111H84" stroke="#ffe9d5" strokeWidth="1.3" />}
            {appearance.face === 'freckles' && [44, 50, 56, 104, 110, 116].map((x, i) => <circle key={x} cx={x} cy={101 + i % 2 * 4} r="1.3" fill="#ac6e51" stroke="none" />)}
            {npcDesign?.facialMarks.includes('freckles') && [44, 50, 56, 104, 110, 116].map((x, i) => <circle key={`npc-freckle-${x}`} cx={x} cy={99 + i % 2 * 5} r="1.7" fill="#9e6348" stroke="none" />)}
            {npcDesign?.facialMarks.includes('cheek-mark') && <path d="M45 94L52 90M108 94L115 90" fill="none" stroke="#9b5948" strokeWidth="2.2" strokeLinecap="round" />}
            {npcDesign?.facialMarks.includes('wrinkle') && <path d="M39 89Q46 86 53 89M107 89Q114 86 121 89M65 70Q80 66 95 70" fill="none" stroke="#a8745b" strokeWidth="1.4" />}
            <path d={appearance.hair === 'sidepart'
              ? 'M31 77Q20 36 49 27Q81 8 112 32Q137 42 128 79L117 75L111 56L94 48Q80 68 47 67L42 81Z'
              : appearance.hair === 'crop'
              ? 'M32 78Q22 30 50 27Q80 14 108 29Q137 35 128 78L116 73L111 54L98 59L86 54L73 60L60 55L47 62L42 80Z'
              : appearance.hair === 'topknot'
              ? 'M31 77Q23 25 79 23Q135 23 129 78L116 74L111 50L80 39L48 52L43 80Z'
              : appearance.hair === 'short'
              ? 'M31 74Q20 35 45 28Q76 5 108 29Q140 34 129 78L115 60L102 65L96 49L77 62L72 46L57 64L46 56L38 81Z'
              : appearance.hair === 'bangs'
                ? 'M31 79Q22 20 80 21Q138 20 129 79L118 78L114 56L100 59L99 50L82 59L80 50L63 59L62 50L46 57L43 80Z'
                : 'M31 76Q22 24 78 21Q138 18 129 78L116 72Q112 56 96 48Q77 64 46 66L42 82Z'} fill={url('hair')} />
            <path d="M46 43Q66 28 84 32M50 49Q64 37 75 37M99 34Q119 42 121 58" fill="none" stroke="#ffffff20" strokeWidth="3" />
          </g>}
          {appearance.hair === 'braid' && (side ? [42] : [30, 130]).map((x, index) => <g key={x} fill={url('hair')}>
            {[0, 1, 2, 3].map(n => <ellipse key={n} cx={x + (n % 2 ? -2 : 2)} cy={106 + n * 11} rx="9" ry="9" />)}
            <path d={`M${x - 7} 144L${x + 7} 144`} stroke={identityPalette.trim} strokeWidth="5" />
            <path d={`M${x} 147L${x - 5} 157L${x + 6} 155Z`} />
            <circle cx={x + (index ? -2 : 2)} cy="144" r="2.5" fill={identityPalette.light} stroke="none" />
          </g>)}
      {npcDesign && npcDesign.hairstyle !== 'cropped' && npcDesign.hairstyle !== 'child-crop' && <g className="map-one-hair-detail" fill={url('hair')} stroke={outline} strokeWidth="1.6">
          {['high-bun', 'silver-bun', 'curled-bun'].includes(npcDesign.hairstyle) && <ellipse cx="80" cy="21" rx={npcDesign.hairstyle === 'curled-bun' ? 16 : 13} ry={npcDesign.hairstyle === 'silver-bun' ? 11 : 13} />}
          {['low-bun', 'elder-wrap', 'wrapped-knot'].includes(npcDesign.hairstyle) && <ellipse cx="80" cy="44" rx="17" ry="10" />}
          {['topknot', 'warrior-knot', 'gray-topknot'].includes(npcDesign.hairstyle) && <path d="M69 30Q64 14 80 7Q96 14 91 30Q80 35 69 30Z" />}
          {['cloth-wrap', 'scarf-tie', 'elder-wrap'].includes(npcDesign.hairstyle) && <path d="M39 41Q80 27 121 41L117 49Q80 36 43 50Z" fill={npcDesign.accentColor} />}
          {['tied-back', 'ribbon-tie', 'low-ponytail'].includes(npcDesign.hairstyle) && <path d="M118 44Q145 43 141 66L130 82L118 69Z" />}
          {['braided', 'double-braid', 'long-braid'].includes(npcDesign.hairstyle) && <path d="M43 69Q35 87 47 102L42 116M117 69Q125 87 113 102L118 116" fill="none" stroke={hair} strokeWidth="7" strokeLinecap="round" />}
          {['messy-short', 'loose-wave', 'short-fringe'].includes(npcDesign.hairstyle) && <path d="M38 61Q48 42 57 58Q66 37 76 57Q86 39 96 58Q108 40 122 61" fill="none" stroke={hair} strokeWidth="5" strokeLinecap="round" />}
          {npcDesign.hairstyle === 'shaved-side' && <path d="M37 67V85M42 66V87" fill="none" stroke="#d4ab8d" strokeWidth="2" />}
          {npcDesign.hairstyle === 'braided-crown' && <path d="M43 46Q80 23 117 46M48 51Q80 31 112 51" fill="none" stroke={hair} strokeWidth="3" />}
          {npcDesign.hairstyle === 'half-tied' && <path d="M62 36Q80 25 98 36L92 46Q80 40 68 46Z" />}
          <path d={npcDesign.hairstyle === 'ribbon-tie' || npcDesign.hairstyle === 'warrior-knot' ? 'M71 44L80 50L89 44M80 50V60' : 'M72 42H88'} fill="none" stroke={npcDesign.accentColor} strokeWidth="3" strokeLinecap="round" />
      </g>}
      {npcDesign && male && !back && !side && npcDesign.beardStyle !== 'none' && <g className="map-one-beard" fill={npcDesign.beardStyle.startsWith('gray') ? '#aaa196' : url('hair')} stroke={outline} strokeWidth="1.2">
          {npcDesign.beardStyle === 'short' || npcDesign.beardStyle === 'gray-short'
            ? <path d="M58 111Q80 120 102 111L98 120Q80 129 62 120Z" />
            : npcDesign.beardStyle === 'sparse'
              ? <path d="M63 113Q67 122 71 116M89 116Q94 122 97 113" fill="none" strokeWidth="3" />
              : <path d={npcDesign.beardStyle === 'long' || npcDesign.beardStyle === 'gray-long' ? 'M57 108Q80 121 103 108L98 139Q80 153 62 139Z' : 'M57 108Q80 122 103 108L98 132Q80 145 62 132Z'} />}
      </g>}
        {appearance.hair === 'long' && !back && <path className="character-long-hair" d={side ? 'M48 51Q39 87 49 127L56 138L63 128L61 81Z' : 'M34 59Q28 93 39 130L48 142L56 130L51 75ZM126 59Q133 93 121 130L112 142L104 130L109 75Z'} fill={url('hair')} stroke={outline} strokeWidth="2" />}
        {appearance.hair === 'ponytail' && <g className="character-ponytail" fill={url('hair')} stroke={outline} strokeWidth="2">
          <path d={side ? 'M111 50Q145 54 138 80L129 100L116 89Z' : 'M118 47Q145 53 141 78L128 101L117 85Z'} />
          <circle cx={side ? 115 : 118} cy="48" r="5" fill={identityPalette.trim} />
        </g>}
          {appearance.accessory === 'flower' && <g transform={`translate(${side ? 52 : 116} 48)`} fill="#fff1cb" stroke="#bd9c72" strokeWidth=".8">
            {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy="-6" rx="4.6" ry="8.5" transform={`rotate(${angle})`} />)}<circle r="3.5" fill="#e6b747" />
          </g>}
          {appearance.accessory === 'khandong' && <g>
            <path d="M29 51Q20 14 80 12Q141 14 131 51L117 46Q116 28 80 29Q45 28 43 47Z" fill={identityPalette.main} />
            <path d="M31 35Q81 2 129 35M34 44Q80 16 126 44" fill="none" stroke={identityPalette.trim} strokeWidth="2" />
            <Lotus x={80} y={28} scale={.33} color={identityPalette.trim} />
          </g>}
          {appearance.accessory === 'nonla' && <g>
            {!back && <path d="M26 61Q24 126 80 130Q135 126 134 61" fill="none" stroke="#be727a" strokeWidth="3" />}
            <path d="M8 56L79 6L152 56Q82 82 8 56Z" fill={url('hat')} />
            <path d="M15 57Q80 73 145 57M29 43Q81 57 130 43M47 29Q80 38 112 29M79 6L48 65M79 6L80 69M79 6L112 65" fill="none" stroke="#bb9759" strokeWidth="1" opacity=".8" />
          </g>}
          {appearance.accessory === 'quaithao' && <g>
            <path d="M12 43Q2 122 62 133M148 43Q158 122 98 133" stroke="#55504b" strokeWidth="5" fill="none" />
            <path d="M11 35V43Q80 65 149 43V35" fill="#c6a267" stroke="#8e7654" strokeWidth="1.5" />
            <ellipse cx="80" cy="34" rx="74" ry="18" fill={url('hat')} stroke="#9a8057" strokeWidth="1.8" />
            <ellipse cx="80" cy="33" rx="61" ry="12" fill="none" stroke="#c6a56b" strokeWidth="1" />
            <ellipse cx="80" cy="32" rx="35" ry="8" fill="#f4deb0" stroke="#c6a56b" strokeWidth="1" />
            <path d="M12 35H43M116 35H147M23 25L45 29M116 29L137 25M80 16V24M80 40V51" stroke="#c6a56b" strokeWidth="1" />
          </g>}
          {appearance.accessory === 'moqua' && <g fill="#34353c" stroke="#252c33" strokeWidth="1.8">
            <path d={back ? 'M30 69Q18 23 80 17Q143 22 131 69L119 105Q80 120 41 105Z' : 'M28 73Q14 23 80 18Q146 23 132 73L117 67L101 46L80 60L58 46L43 69Z'} />
            <path d="M39 43Q56 27 78 27M89 28Q114 31 123 47" fill="none" stroke="#64636a" strokeWidth="2" />
            {back && <><path d="M73 105L58 130L78 126L83 107M83 108L99 130L108 124L89 103" /><ellipse cx="81" cy="108" rx="10" ry="6" fill="#44464c" /></>}
          </g>}
        </g>
      {shoeItem && <g className={`character-layer character-shoes${shoeItem.id.includes('glow') ? ' shoes-glow' : ''}`} data-layer="shoes" fill={shoeItem.id.includes('boots') ? '#87734e' : shoeItem.id.includes('glow') ? '#9c8bd1' : shoeItem.id.includes('sandals') ? '#c78652' : '#a5673f'} stroke="#493c37">
          {shoeItem.id.includes('sandals') ? <>
            <path d="M49 201Q61 195 74 203L76 210Q66 215 49 212ZM86 203Q98 196 111 204L115 211Q104 215 87 212Z" />
            <path d="M54 202L68 210M70 202L58 210M91 202L106 210M108 202L95 210" fill="none" stroke="#f1d8a7" strokeWidth="2.5" />
          </> : <>
            <path d={shoeItem.id.includes('boots') ? 'M49 184H71L74 207Q70 214 48 213Q43 210 49 184ZM85 184H106L114 207Q111 214 86 213Q82 210 85 184Z' : 'M49 198H72L76 208Q74 214 48 213Q43 210 49 198ZM85 198H106L115 208Q114 214 86 213Q82 210 85 198Z'} />
            {shoeItem.id.includes('clogs') && <path d="M48 206H75M85 206H113" fill="none" stroke="#d7ae6a" strokeWidth="3" />}
            {shoeItem.id.includes('cloth') && <path d="M50 204Q62 199 73 204M87 204Q99 199 110 204" fill="none" stroke="#f4e4cc" strokeWidth="2" />}
            {shoeItem.id.includes('boots') && <g className="ranger-boots-detail" fill="none" stroke="#4d382b" strokeWidth="1.5">
              <path d="M49 190H71M86 190H107M52 194L69 194M88 194L105 194" />
              <path d="M56 187L65 197M64 187L56 197M91 187L100 197M99 187L91 197" stroke="#d8b27a" strokeWidth="1.8" />
              <path d="M47 207Q59 211 74 207M85 207Q100 211 114 207" stroke="#d8b27a" strokeWidth="2" />
            </g>}
          </>}
        </g>}
        {hatItem && hatItem.id !== 'hat-nonla' && hatItem.appearanceValue !== 'nonla' && <g className="character-layer character-hat" data-layer="hat">
          {hatItem.id === 'hat-forest-bandana' ? <g className="forest-leaf-bandana" stroke="#43553a" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M37 48Q40 33 55 31Q80 26 105 31Q120 34 123 48L115 54Q80 46 45 54Z" fill="#71864f" />
            <path d="M45 44Q80 50 115 44M48 49Q80 55 112 49" fill="none" stroke="#d7d2a0" strokeWidth="1.4" />
            <path d="M56 42L60 35M60 39Q54 38 53 34M60 39Q66 37 67 33M79 45L82 35M82 40Q76 38 76 34M82 40Q88 37 90 34M99 43L103 35M103 39Q97 38 96 34M103 39Q108 37 110 34" fill="none" stroke="#c1c58b" strokeWidth="1.2" strokeLinecap="round" />
            {appearance.gender === 'female' && <path d="M46 51L40 64Q37 69 34 64L38 51M114 51L120 64Q123 69 126 64L122 51" fill="#8d9a64" />}
          </g>
            : hatItem.id.includes('bandana') ? <g fill="#7d9d80" stroke="#526f58"><path d="M36 49Q40 26 80 25Q120 26 124 49L114 55Q80 48 46 55Z" /><path d="M47 42Q80 49 113 42M51 47Q80 53 109 47" fill="none" stroke="#f1e4c4" strokeWidth="2" /><path d="M45 51L40 66M115 51L120 66" fill="none" stroke="#7d9d80" strokeWidth="4" /></g>
            : hatItem.id.includes('chef') ? <g fill="#fff9e9" stroke="#a9a08c"><path d="M52 39Q38 31 48 21Q47 5 62 14Q80-1 88 15Q106 4 108 22Q121 31 106 40Z" /><path d="M48 40H110V51H48Z" fill="#fffdf5" /></g>
            : hatItem.id.includes('warrior') ? <g fill="#7b9980" stroke="#4c6857"><path d="M43 48L48 25L65 32L80 14L95 32L112 25L117 48Z" /><path d="M80 15V4M75 5Q80-1 85 5L80 15" fill="#e9c568" /><path d="M47 48H113" stroke="#e5c777" strokeWidth="4" /></g>
              : hatItem.id.includes('festival') ? <g fill="#d88764" stroke="#8e5945"><path d="M48 43Q52 25 80 24Q108 25 112 43L132 51Q80 60 28 51Z" /><path d="M80 24V10M72 12Q80 4 88 12L80 25" fill="#e8bd68" /></g>
                : hatItem.id.includes('straw') ? <g fill="#d9b866" stroke="#9d7945">
                    <path d="M49 43Q51 19 80 18Q109 19 111 43L131 51Q80 63 29 51Z" />
                    <path d="M38 49Q80 59 122 49M53 41Q80 47 107 41M64 28L57 48M79 21V51M94 28L101 48" fill="none" stroke="#f1d991" strokeWidth="1.5" />
                  </g>
                  : hatItem.id.includes('wide') ? <g fill="#ba7462" stroke="#824e49">
                    <ellipse cx="80" cy="48" rx="57" ry="10" />
                    <path d="M51 46Q54 24 80 23Q106 24 109 46Z" fill="#d38a70" />
                    <path d="M36 49Q80 57 124 49M56 42Q80 47 104 42" fill="none" stroke="#f4d8aa" strokeWidth="2" />
                  </g>
                  : <g fill="#ba7462" stroke="#824e49"><path d="M42 45Q48 20 80 22Q112 20 118 45L125 52H35Z" /><path d="M48 38H112" fill="none" stroke="#f4d8aa" strokeWidth="3" /></g>}
        </g>}
        {frontItem && <g className="character-layer character-front-accessory" data-layer="front_accessory">
          {frontItem.id.includes('herb-knife') ? <g transform="translate(119 155)" stroke="#75563c" strokeWidth="2"><path d="M0 10L-7-2L-5-11L2-7L5 2Z" fill="#d0d5c6" /><path d="M-2 7L5 14" stroke="#9b7049" strokeWidth="4" /></g>
            : frontItem.id.includes('small-hoe') ? <g transform="translate(119 152)" stroke="#79593e" strokeWidth="3"><path d="M-3 15L5-13" /><path d="M-7-10L10-5L8 0L-9-5Z" fill="#b9a17c" strokeWidth="2" /></g>
              : frontItem.id.includes('bamboo-book') ? <g transform="translate(111 148)" stroke="#80613e" strokeWidth="1.5"><path d="M-11-8Q-3-11 0-5Q3-11 11-8V10Q3 7 0 12Q-3 7-11 10Z" fill="#e9d39b" /><path d="M0-5V12M-8-4H-3M4-4H8M-8 1H-3M4 1H8" fill="none" /></g>
                : frontItem.id.includes('lantern') ? <g transform="translate(119 125)" stroke="#a4613c"><path d="M0-12V-22M-10-13Q0-21 10-13V5Q0 14-10 5Z" fill="#f3c86b" /><path d="M-7 0H7M0 8V13" fill="none" /></g>
            : frontItem.id.includes('badge') ? <g transform="translate(107 145)" stroke="#956c3e" strokeWidth="1.5">
              <circle r="9" fill="#f4d684" /><path d="M0 6Q-8 0-5-5Q0-4 0 1Q0-5 5-6Q8 0 0 6Z" fill="#d98578" /><circle r="2" fill="#f8efc6" stroke="none" />
            </g>
              : <g><rect x="96" y="144" width="31" height="13" rx="4" fill="#fff3cd" stroke="#a68152" strokeWidth="1.5" /><path d="M101 150H122" stroke="#6b7960" strokeWidth="1" /></g>}
        </g>}
        {npcDesign && <g className="map-one-identity-accessory" transform="translate(0 10)" stroke="#493c37" strokeWidth="2.2" strokeLinejoin="round">
          {npcDesign.accessory === 'shoulder-sash' && <path d="M43 130L57 125L112 181L102 188Z" fill={npcDesign.accentColor} />}
          {npcDesign.accessory === 'shoulder-guard' && <path d="M40 135Q54 123 67 138L62 157L42 155Z" fill={npcDesign.accentColor} />}
          {npcDesign.accessory === 'herb-pouch' && <g fill="#a77c4a"><path d="M108 153L132 150L135 178L111 180Z" /><path d="M112 151Q118 137 129 151" fill="none" /></g>}
          {npcDesign.accessory === 'woven-basket' && <g fill="#b98c51"><path d="M105 157H137L133 179H109Z" /><path d="M109 157Q121 136 134 157M107 166H135M108 173H134" fill="none" stroke="#f0d39a" strokeWidth="2" /></g>}
          {npcDesign.accessory === 'wrist-wrap' && <path d="M38 169L51 174M111 170L125 166" stroke={npcDesign.accentColor} strokeWidth="6" />}
          {npcDesign.accessory === 'bead-cord' && <path d="M66 138Q80 156 94 138M76 151L80 158L84 151" fill="none" stroke={npcDesign.accentColor} strokeWidth="3" />}
          {npcDesign.weapon === 'flag' && <g><path d="M132 167V92" stroke="#775638" strokeWidth="4" /><path d="M133 94H157L151 108H133Z" fill={npcDesign.outfitColor} /><path d="M140 96L142 100L147 101L143 104L144 108L140 106L136 108L137 104L134 101L139 100Z" fill="#f3d982" stroke="none" /></g>}
          {npcDesign.weapon === 'spear' || npcDesign.weapon === 'practice-sword' ? <g><path d="M132 184L148 93" stroke="#805d43" strokeWidth="4" /><path d="M145 99L151 82L155 100Z" fill={npcDesign.weapon === 'spear' ? '#bfc6ba' : npcDesign.accentColor} /></g> : null}
          {npcDesign.weapon === 'shield' && <path d="M120 144L144 138L146 164Q133 181 121 164Z" fill={npcDesign.accentColor} />}
          {npcDesign.weapon === 'bow' && <path d="M134 121Q156 142 134 169M134 121L134 169" fill="none" stroke="#845e3d" strokeWidth="3" />}
          {npcDesign.weapon === 'walking-staff' && <path d="M137 119L128 191" stroke="#79593e" strokeWidth="5" />}
          {npcDesign.weapon === 'paddle' && <g><path d="M132 155L149 119" stroke="#79593e" strokeWidth="4" /><path d="M145 123L151 108L157 114L151 128Z" fill="#ba925b" /></g>}
          {npcDesign.weapon === 'hammer' && <g><path d="M137 165L147 133" stroke="#79593e" strokeWidth="4" /><path d="M138 130L155 135L152 143L135 138Z" fill="#786b5d" /></g>}
          {npcDesign.weapon === 'medicine-bag' && <path d="M115 153H139L137 177H117Z" fill="#8d6949" />}
          {npcDesign.weapon === 'grain-basket' && <path d="M111 157H140L136 178H115Z" fill="#b98c51" />}
          {npcDesign.weapon === 'scroll' && <g fill="#f1dfb8"><path d="M121 151H144V173H121Z" /><circle cx="121" cy="151" r="4" /><circle cx="144" cy="173" r="4" /></g>}
          {npcDesign.heldItem === 'cooking-pot' && <g transform="translate(24 164)" fill="#8d7560"><path d="M-13-5H13L10 11H-10Z" /><path d="M-16-6H16M-7-10Q0-17 7-10M-5 12V16M5 12V16" fill="none" stroke="#674f3e" strokeWidth="2" /><path d="M-2-12Q-8-18-2-22M4-12Q-1-18 5-23" fill="none" stroke="#f4e3bf" strokeWidth="1.5" /></g>}
          {npcDesign.heldItem === 'cooking-pot' && <g><path d="M126 156L143 124" stroke="#815f3f" strokeWidth="3" /><ellipse cx="145" cy="121" rx="5" ry="7" fill="#b48b58" /></g>}
          {npcDesign.heldItem === 'ladle' && <g><path d="M126 156L143 124" stroke="#815f3f" strokeWidth="3" /><ellipse cx="145" cy="121" rx="5" ry="7" fill="#b48b58" /></g>}
          {npcDesign.heldItem === 'serving-tray' && <g><ellipse cx="132" cy="160" rx="18" ry="5" fill="#ba925b" /><path d="M119 157Q121 145 128 151Q137 143 143 155" fill="#e1c98e" /></g>}
          {npcDesign.heldItem === 'trade-scale' && <g stroke="#72583e" fill="none"><path d="M132 137V174M121 142H143M132 136L139 132M126 143L121 153L132 153L127 143M138 143L133 153L144 153L139 143" strokeWidth="2" /><path d="M124 174H141" strokeWidth="3" /></g>}
          {npcDesign.heldItem === 'market-goods' && <g fill="#b98c51"><path d="M112 156H140L136 179H116Z" /><path d="M116 156Q126 138 137 156" fill="none" stroke="#f0d39a" strokeWidth="2" /><circle cx="120" cy="153" r="4" fill="#b45f46" stroke="none" /><circle cx="130" cy="151" r="4" fill="#81975e" stroke="none" /></g>}
          {npcDesign.heldItem === 'seed-bag' && <path d="M115 152Q128 146 140 153L138 177Q128 184 116 176Z" fill="#c1a06b" />}
          {npcDesign.heldItem === 'seedlings' && <g fill="none" stroke="#75894f" strokeWidth="3"><path d="M130 174V143M130 159Q116 150 117 143Q129 144 130 153M130 154Q143 146 146 139Q134 139 130 148" /></g>}
          {npcDesign.heldItem === 'hoe' && <g><path d="M137 177L150 129" stroke="#815f3f" strokeWidth="4" /><path d="M140 130L158 132L157 137L139 136Z" fill="#9b9e91" /></g>}
          {npcDesign.heldItem === 'sickle' && <g fill="none" stroke="#7d6146"><path d="M136 176L143 147" strokeWidth="4" /><path d="M143 147Q160 136 153 126Q150 141 140 140" stroke="#b6bdb0" strokeWidth="3" /></g>}
          {npcDesign.heldItem === 'tongs' && <g fill="none" stroke="#635a50" strokeWidth="3"><path d="M135 175L144 137M139 176L150 138M143 139Q148 133 152 139M142 139Q138 133 136 138" /></g>}
          {npcDesign.heldItem === 'iron-bar' && <path d="M139 178L151 131" stroke="#82847d" strokeWidth="5" />}
          {npcDesign.heldItem === 'rope' && <path d="M123 149Q150 152 130 166Q112 176 138 182" fill="none" stroke="#b99b6a" strokeWidth="3" />}
          {npcDesign.heldItem === 'horse-reins' && <path d="M122 146Q143 152 132 166Q127 173 140 179" fill="none" stroke="#845e3e" strokeWidth="3" />}
          {npcDesign.heldItem === 'herbs' && <g fill="none" stroke="#70884b" strokeWidth="2.5"><path d="M133 176V147M133 161Q119 155 119 147Q129 148 133 157M133 155Q145 148 148 140Q138 141 133 151M133 168Q121 165 118 158" /></g>}
          {npcDesign.heldItem === 'medicine-bottle' && <g fill="#9bb19b" stroke="#6b745e"><path d="M124 151H139V176H124Z" /><path d="M128 145H135V152H128Z" fill="#b3a078" /></g>}
          {npcDesign.heldItem === 'bamboo-tablet' && <g transform="rotate(-12 132 164)" fill="#d4b87b" stroke="#806643"><rect x="121" y="148" width="23" height="31" rx="2" /><path d="M126 152V175M132 152V175M138 152V175" stroke="#92764d" strokeWidth="1.5" /></g>}
          {npcDesign.heldItem === 'toy-kite' && <g><path d="M132 178V144L148 130" fill="none" stroke="#805d43" strokeWidth="2" /><path d="M148 118L159 129L148 140L137 129Z" fill="#cc7050" stroke="#7e5140" /><path d="M146 139L151 148L146 155" fill="none" stroke="#d7a866" strokeWidth="2" /></g>}
          {npcDesign.heldItem === 'water-bowl' && <path d="M118 160Q130 156 143 160L140 173Q131 180 121 173Z" fill="#91aca0" stroke="#5d786a" />}
          {npcDesign.heldItem === 'grain-basket' && <g fill="#b98c51"><path d="M111 157H140L136 178H115Z" /><path d="M114 157Q126 135 138 157" fill="none" stroke="#f0d39a" strokeWidth="2" /></g>}
          {npcDesign.heldItem === 'woven-basket' && <g fill="#b98c51"><path d="M111 157H140L136 178H115Z" /><path d="M114 157Q126 135 138 157M112 166H139M114 172H138" fill="none" stroke="#f0d39a" strokeWidth="2" /></g>}
        </g>}
        {effectItem && <g className={`character-layer character-effect effect-${effectItem.id}`} data-layer="visual_effect" fill="none" stroke={effectItem.id.includes('halo') ? '#e5bd58' : '#f0a857'} strokeWidth="2">
          {effectItem.id.includes('halo') ? <ellipse cx="80" cy="22" rx="35" ry="9" />
            : effectItem.id.includes('leaves') ? <><path d="M25 117Q12 108 25 98Q39 109 25 117ZM135 145Q123 133 138 126Q147 137 135 145Z" fill="#7fa866" stroke="#658853" /><path d="M23 111L30 102M133 140L139 130" /></>
              : effectItem.id.includes('fireflies') ? <><circle cx="35" cy="119" r="3" fill="#f4df7a" /><circle cx="129" cy="94" r="2.5" fill="#f4df7a" /><circle cx="137" cy="159" r="2" fill="#f4df7a" /></>
                : effectItem.id.includes('fame') ? <><circle cx="80" cy="104" r="56" stroke="#f1cf68" strokeDasharray="3 8" /><path d="M37 67Q80 42 123 67" stroke="#f1cf68" /></>
                : effectItem.id.includes('cooking-smoke') ? <><path d="M55 150Q43 140 55 130Q67 120 55 110M78 151Q68 138 80 128Q91 119 80 107M101 150Q91 140 102 130" stroke="#a8a399" strokeWidth="3" opacity=".7" /><circle cx="55" cy="106" r="2" fill="#d5aa69" stroke="none" /></>
                  : <><path d="M28 105Q12 94 22 84Q39 91 28 105ZM130 120Q119 110 131 103Q145 109 130 120Z" fill="#f3c07d" /><path d="M40 42Q80 29 120 42" strokeDasharray="2 7" /></>}
        </g>}
      </g>
      </g>
    </g>
  </svg>;
});
