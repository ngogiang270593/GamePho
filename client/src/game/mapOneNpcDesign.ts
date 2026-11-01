import type { CharacterAppearance } from './character';

export type MapOneFaceShape = 'round' | 'oval' | 'long' | 'square' | 'angular' | 'petite' | 'high-cheek' | 'broad-forehead' | 'wrinkled' | 'child';
export type MapOneHairStyle =
  | 'high-bun' | 'low-bun' | 'tied-back' | 'loose-long' | 'braided' | 'cloth-wrap' | 'cropped'
  | 'silver-bun' | 'messy-short' | 'topknot' | 'side-part' | 'double-braid' | 'ribbon-tie'
  | 'warrior-knot' | 'short-fringe' | 'long-braid' | 'wrapped-knot' | 'low-ponytail'
  | 'curled-bun' | 'half-tied' | 'shaved-side' | 'braided-crown' | 'scarf-tie'
  | 'gray-topknot' | 'loose-wave' | 'child-crop' | 'elder-wrap';
export type MapOneBeardStyle = 'none' | 'short' | 'full' | 'long' | 'sparse' | 'gray-short' | 'gray-long';
export type MapOneBodyType = 'petite' | 'tall-slim' | 'short-sturdy' | 'broad-shouldered' | 'soft-middle' | 'elderly-bent' | 'athletic' | 'child' | 'strong-arms' | 'lean' | 'stately' | 'compact';
export type MapOneOutfitStyle = 'noble-robe' | 'light-armor' | 'crossed-wrap' | 'field-tunic' | 'market-wrap' | 'smith-apron' | 'river-tunic' | 'healer-robe' | 'elder-cloak' | 'child-tunic' | 'messenger-vest' | 'guard-armor';
export type MapOneAccessory = 'headband' | 'cloth-tie' | 'hairpin' | 'headscarf' | 'wrist-wrap' | 'herb-pouch' | 'woven-basket' | 'shoulder-sash' | 'shoulder-guard' | 'bead-cord' | 'none' | 'reed-hat';
export type MapOneWeapon = 'none' | 'flag' | 'spear' | 'shield' | 'bow' | 'walking-staff' | 'paddle' | 'hammer' | 'medicine-bag' | 'grain-basket' | 'scroll' | 'practice-sword';
export type MapOneHeldItem = 'none' | 'cooking-pot' | 'ladle' | 'serving-tray' | 'trade-scale' | 'market-goods' | 'seed-bag' | 'seedlings' | 'hoe' | 'sickle' | 'tongs' | 'iron-bar' | 'rope' | 'horse-reins' | 'herbs' | 'medicine-bottle' | 'bamboo-tablet' | 'toy-kite' | 'water-bowl' | 'grain-basket' | 'woven-basket';
export type MapOnePosture = 'upright' | 'relaxed' | 'stooped' | 'ready' | 'leaning' | 'working' | 'alert' | 'running' | 'calm';
export type MapOneAnimation = 'breathe' | 'storytelling' | 'fieldwork' | 'hammering' | 'paddling' | 'guarding' | 'commanding' | 'running' | 'healing' | 'trading' | 'resting' | 'practice';

export interface MapOneNpcVisualDesign {
  faceShape: MapOneFaceShape;
  faceWidth: number;
  faceHeight: number;
  jawWidth: number;
  foreheadWidth: number;
  skinTone: CharacterAppearance['skin'];
  eyeShape: CharacterAppearance['eyes'];
  eyeSpacing: number;
  eyebrowShape: 'soft' | 'straight' | 'arched' | 'strong' | 'angled' | 'silver';
  noseShape: 'small' | 'straight' | 'broad' | 'angular' | 'round';
  mouthShape: 'gentle' | 'wide' | 'thin' | 'smile' | 'stern' | 'downturned';
  facialMarks: readonly string[];
  hairstyle: MapOneHairStyle;
  hairColor: CharacterAppearance['hairColor'];
  beardStyle: MapOneBeardStyle;
  bodyType: MapOneBodyType;
  height: number;
  shoulderWidth: number;
  bodyWidth: number;
  outfit: MapOneOutfitStyle;
  outfitColor: string;
  accentColor: string;
  trouserColor: string;
  accessory: MapOneAccessory;
  weapon: MapOneWeapon;
  heldItem: MapOneHeldItem;
  posture: MapOnePosture;
  animationSet: MapOneAnimation;
  occupation: string;
  historicalRole: string;
}

export interface MapOneVisualSubject {
  id: string;
  design: MapOneNpcVisualDesign;
}

const faceShapes: readonly MapOneFaceShape[] = ['round', 'oval', 'long', 'square', 'angular', 'petite', 'high-cheek', 'broad-forehead', 'wrinkled', 'child'];
const hairstyles: readonly MapOneHairStyle[] = [
  'high-bun', 'low-bun', 'tied-back', 'loose-long', 'braided', 'cloth-wrap', 'cropped', 'silver-bun',
  'messy-short', 'topknot', 'side-part', 'double-braid', 'ribbon-tie', 'warrior-knot', 'short-fringe',
  'long-braid', 'wrapped-knot', 'low-ponytail', 'curled-bun', 'half-tied', 'shaved-side',
  'braided-crown', 'scarf-tie', 'gray-topknot', 'loose-wave', 'child-crop', 'elder-wrap',
];
const bodyTypes: readonly MapOneBodyType[] = ['petite', 'tall-slim', 'short-sturdy', 'broad-shouldered', 'soft-middle', 'elderly-bent', 'athletic', 'child', 'strong-arms', 'lean', 'stately', 'compact'];
const bodyProfiles: Record<MapOneBodyType, [number, number, number]> = {
  petite: [.86, .82, .88],
  'tall-slim': [1.06, .84, .88],
  'short-sturdy': [.86, 1.04, 1.05],
  'broad-shouldered': [1, 1.1, 1.03],
  'soft-middle': [.94, 1, 1.08],
  'elderly-bent': [.84, .86, .92],
  athletic: [1, 1.02, .98],
  child: [.76, .82, .85],
  'strong-arms': [.98, 1.08, 1.04],
  lean: [1.02, .86, .87],
  stately: [1.02, .98, .98],
  compact: [.84, .96, .98],
};
const colors = [
  ['#8f3433', '#e3bd68', '#493f43'], ['#285c61', '#dabd78', '#3d4551'], ['#4b536b', '#c4a26a', '#45404a'],
  ['#76503d', '#a8a06a', '#353a40'], ['#577344', '#d2bb7d', '#41413c'], ['#884e3a', '#dfc49a', '#45434a'],
  ['#425b79', '#d5a74e', '#393e49'], ['#706144', '#a1b18a', '#3e4342'], ['#6c464f', '#d2b178', '#46404b'],
  ['#386b59', '#c4ad73', '#3b4540'], ['#985f32', '#e0cf9d', '#393f48'], ['#4e4b6c', '#d7bd75', '#45404b'],
  ['#617248', '#c47a59', '#414239'], ['#8a4241', '#a8b078', '#41414a'], ['#3e6778', '#c9985c', '#42414b'],
  ['#75523c', '#d1b877', '#3d4244'], ['#8b5747', '#bcc58b', '#41454a'], ['#365a4d', '#d7a866', '#394047'],
  ['#805d72', '#d6bd7e', '#41434a'], ['#596c4c', '#bf7d60', '#3c3e45'], ['#6b4c37', '#c0a475', '#464149'],
  ['#a04c3a', '#e0ca91', '#41434a'], ['#536776', '#bf9c5e', '#424045'], ['#756a4c', '#a58a72', '#414148'],
  ['#77455a', '#b7a16d', '#40434a'], ['#4f705e', '#d8b576', '#41434a'], ['#715743', '#b7a78a', '#424149'],
] as const;
const accessories: readonly MapOneAccessory[] = ['shoulder-sash', 'wrist-wrap', 'bead-cord', 'hairpin', 'headband', 'reed-hat', 'herb-pouch', 'woven-basket', 'shoulder-guard', 'cloth-tie', 'headscarf', 'none'];
const weapons: readonly MapOneWeapon[] = ['flag', 'practice-sword', 'scroll', 'shield', 'medicine-bag', 'grain-basket', 'bow', 'paddle', 'hammer', 'walking-staff', 'spear', 'none'];
const postures: readonly MapOnePosture[] = ['upright', 'ready', 'calm', 'working', 'relaxed', 'stooped', 'alert', 'running', 'leaning'];
const animations: readonly MapOneAnimation[] = ['commanding', 'practice', 'storytelling', 'fieldwork', 'trading', 'healing', 'guarding', 'running', 'hammering', 'paddling', 'resting', 'breathe'];

export function createMapOneNpcDesign(index: number, occupation: string, historicalRole: string): MapOneNpcVisualDesign {
  const [outfitColor, accentColor, trouserColor] = colors[index % colors.length];
  const bodyType = bodyTypes[index % bodyTypes.length];
  const [heightBase, shoulderBase, widthBase] = bodyProfiles[bodyType];
  return {
    faceShape: faceShapes[index % faceShapes.length],
    faceWidth: 88 + (index * 7) % 29,
    faceHeight: 91 + (index * 11) % 27,
    jawWidth: 53 + (index * 5) % 31,
    foreheadWidth: 65 + (index * 9) % 29,
    skinTone: (['honey', 'tan', 'peach', 'bronze', 'deep', 'porcelain'] as const)[index % 6],
    eyeShape: (['sparkle', 'almond', 'smile'] as const)[index % 3],
    eyeSpacing: 35 + (index * 3) % 15,
    eyebrowShape: (['soft', 'straight', 'arched', 'strong', 'angled', 'silver'] as const)[index % 6],
    noseShape: (['small', 'straight', 'broad', 'angular', 'round'] as const)[index % 5],
    mouthShape: (['gentle', 'wide', 'thin', 'smile', 'stern', 'downturned'] as const)[index % 6],
    facialMarks: index % 6 === 0 ? ['freckles'] : index % 8 === 0 ? ['cheek-mark'] : index % 7 === 0 ? ['wrinkle'] : [],
    hairstyle: hairstyles[index],
    hairColor: (['ink', 'brown', 'chestnut'] as const)[index % 3],
    beardStyle: (['none', 'short', 'sparse', 'full', 'long', 'gray-short', 'gray-long'] as const)[index % 7],
    bodyType,
    height: heightBase + (((index * 3) % 5) - 2) / 100,
    shoulderWidth: shoulderBase + (((index * 7) % 5) - 2) / 100,
    bodyWidth: widthBase + (((index * 11) % 5) - 2) / 100,
    outfit: (['noble-robe', 'light-armor', 'crossed-wrap', 'field-tunic', 'market-wrap', 'smith-apron', 'river-tunic', 'healer-robe', 'elder-cloak', 'child-tunic', 'messenger-vest', 'guard-armor'] as const)[index % 12],
    outfitColor,
    accentColor,
    trouserColor,
    accessory: accessories[index % accessories.length],
    weapon: weapons[index % weapons.length],
    heldItem: 'none',
    posture: postures[index % postures.length],
    animationSet: animations[index % animations.length],
    occupation,
    historicalRole,
  };
}

function faceSignature(design: MapOneNpcVisualDesign): string {
  return [design.faceShape, design.faceWidth, design.faceHeight, design.jawWidth, design.foreheadWidth, design.eyeShape, design.eyeSpacing, design.noseShape, design.mouthShape, design.facialMarks.join(',')].join('|');
}

function collisionKey(design: MapOneNpcVisualDesign): string {
  return [faceSignature(design), design.hairstyle, design.hairColor, design.bodyType, design.height, design.shoulderWidth, design.bodyWidth, design.outfit, design.outfitColor, design.accentColor, design.trouserColor, design.accessory, design.weapon, design.heldItem].join('|');
}

function tooSimilar(first: MapOneNpcVisualDesign, second: MapOneNpcVisualDesign): boolean {
  const matchingTraits = [
    faceSignature(first) === faceSignature(second),
    first.hairstyle === second.hairstyle && first.hairColor === second.hairColor,
    first.bodyType === second.bodyType && first.height === second.height && first.shoulderWidth === second.shoulderWidth && first.bodyWidth === second.bodyWidth,
    first.outfit === second.outfit && first.outfitColor === second.outfitColor && first.accentColor === second.accentColor && first.trouserColor === second.trouserColor,
    first.accessory === second.accessory,
    first.weapon === second.weapon,
    first.heldItem === second.heldItem,
  ].filter(Boolean).length;
  return collisionKey(first) === collisionKey(second) || matchingTraits >= 5;
}

export function resolveMapOneNpcVisualCollisions<T extends MapOneVisualSubject>(subjects: readonly T[]): T[] {
  const placed: MapOneNpcVisualDesign[] = [];
  return subjects.map((subject, index) => {
    const original = { ...subject.design };
    let design = original;
    for (let attempt = 0; placed.some(previous => tooSimilar(previous, design)); attempt += 1) {
      if (attempt > 100) throw new Error(`Không thể tạo diện mạo riêng cho NPC ${subject.id}.`);
      const palette = colors[(index + attempt + 11) % colors.length];
      design = {
        ...original,
        faceShape: faceShapes[(index + attempt + 4) % faceShapes.length],
        faceWidth: 88 + ((index * 7 + attempt * 5) % 29),
        jawWidth: 54 + ((index * 17 + attempt * 3 + 3) % 31),
        bodyType: bodyTypes[(index + attempt + 5) % bodyTypes.length],
        height: 0.8 + ((index * 7 + attempt * 3 + 9) % 21) / 100,
        hairstyle: hairstyles[(index + attempt + 3) % hairstyles.length],
        outfitColor: palette[0],
        accentColor: palette[1],
        trouserColor: palette[2],
      };
    }
    placed.push(design);
    return { ...subject, design };
  });
}

export function findMapOneNpcVisualCollisions(subjects: readonly MapOneVisualSubject[]): Array<[string, string]> {
  const collisions: Array<[string, string]> = [];
  for (let index = 0; index < subjects.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < subjects.length; otherIndex += 1) {
      if (tooSimilar(subjects[index].design, subjects[otherIndex].design)) {
        collisions.push([subjects[index].id, subjects[otherIndex].id]);
      }
    }
  }
  return collisions;
}
