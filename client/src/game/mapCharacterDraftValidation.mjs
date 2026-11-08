// Shared validation for the editor and the local source-save endpoint.
import { OPENING_MAP_WIDTH, OPENING_MAP_HEIGHT } from './openingMapBounds.mjs';

const appearances = {
  gender: ['female', 'male'], hair: ['bangs', 'bun', 'braid', 'short', 'long', 'ponytail', 'sidepart', 'crop', 'topknot'],
  eyes: ['sparkle', 'almond', 'smile'], face: ['round', 'oval', 'freckles'],
  outfit: ['aodai', 'tuthan', 'baba', 'forest', 'nhatbinh', 'nguthan', 'lotus', 'apron'],
  accessory: ['flower', 'nonla', 'khandong', 'none', 'quaithao', 'moqua'],
  skin: ['porcelain', 'peach', 'honey', 'tan', 'bronze', 'deep'], hairColor: ['ink', 'brown', 'chestnut'], pet: ['none', 'cat', 'dog', 'rabbit'],
};
const defaultAppearances = {
  female: { gender: 'female', hair: 'braid', eyes: 'sparkle', face: 'round', outfit: 'aodai', accessory: 'flower', skin: 'peach', hairColor: 'ink', pet: 'none' },
  male: { gender: 'male', hair: 'sidepart', eyes: 'almond', face: 'oval', outfit: 'nguthan', accessory: 'khandong', skin: 'honey', hairColor: 'ink', pet: 'none' },
};
const designEnums = {
  faceShape: ['round', 'oval', 'long', 'square', 'angular', 'petite', 'high-cheek', 'broad-forehead', 'wrinkled', 'child'],
  skinTone: appearances.skin, eyeShape: appearances.eyes, hairColor: appearances.hairColor,
  eyebrowShape: ['soft', 'straight', 'arched', 'strong', 'angled', 'silver'], noseShape: ['small', 'straight', 'broad', 'angular', 'round'],
  mouthShape: ['gentle', 'wide', 'thin', 'smile', 'stern', 'downturned'],
  hairstyle: ['high-bun', 'low-bun', 'tied-back', 'loose-long', 'braided', 'cloth-wrap', 'cropped', 'silver-bun', 'messy-short', 'topknot', 'side-part', 'double-braid', 'ribbon-tie', 'warrior-knot', 'short-fringe', 'long-braid', 'wrapped-knot', 'low-ponytail', 'curled-bun', 'half-tied', 'shaved-side', 'braided-crown', 'scarf-tie', 'gray-topknot', 'loose-wave', 'child-crop', 'elder-wrap'],
  beardStyle: ['none', 'short', 'full', 'long', 'sparse', 'gray-short', 'gray-long'],
  bodyType: ['petite', 'tall-slim', 'short-sturdy', 'broad-shouldered', 'soft-middle', 'elderly-bent', 'athletic', 'child', 'strong-arms', 'lean', 'stately', 'compact'],
  outfit: ['noble-robe', 'light-armor', 'crossed-wrap', 'field-tunic', 'market-wrap', 'smith-apron', 'river-tunic', 'healer-robe', 'elder-cloak', 'child-tunic', 'messenger-vest', 'guard-armor'],
  accessory: ['headband', 'cloth-tie', 'hairpin', 'headscarf', 'wrist-wrap', 'herb-pouch', 'woven-basket', 'shoulder-sash', 'shoulder-guard', 'bead-cord', 'none', 'reed-hat'],
  weapon: ['none', 'flag', 'spear', 'shield', 'bow', 'walking-staff', 'paddle', 'hammer', 'medicine-bag', 'grain-basket', 'scroll', 'practice-sword'],
  heldItem: ['none', 'cooking-pot', 'ladle', 'serving-tray', 'trade-scale', 'market-goods', 'seed-bag', 'seedlings', 'hoe', 'sickle', 'tongs', 'iron-bar', 'rope', 'horse-reins', 'herbs', 'medicine-bottle', 'bamboo-tablet', 'toy-kite', 'water-bowl', 'grain-basket', 'woven-basket'],
  posture: ['upright', 'relaxed', 'stooped', 'ready', 'leaning', 'working', 'alert', 'running', 'calm'],
  animationSet: ['breathe', 'storytelling', 'fieldwork', 'hammering', 'paddling', 'guarding', 'commanding', 'running', 'healing', 'trading', 'resting', 'practice'],
};
const designNumbers = {
  faceWidth: [40, 180], faceHeight: [40, 180], jawWidth: [20, 150], foreheadWidth: [20, 150], eyeSpacing: [10, 90],
  height: [.5, 1.6], shoulderWidth: [.5, 1.6], bodyWidth: [.5, 1.6],
};
const npcArtworks = [
  'a-cau', 'a-sang', 'ba-me-que', 'doi-truong-ho-vuong-lang', 'giao',
  'hac-lang', 'hac-lao', 'huyet-dao-phuong', 'lao-lang-trung', 'lao-tieu-phu',
  'le-nuong', 'mu-doc-ba', 'quan-gia-trieu', 'tao', 'thiet-chuy', 'thim-tu',
  'tieu-muoi-ban-do-choi', 'tieu-nhi-quan-rap', 'linh-tuan-tra-cung', 'linh-tuan-tra-dao',
  'truong-doi-tuan-tra', 'vo-su-nuong',
  'elder', 'fisherman', 'martial-artist', 'messenger', 'guard',
  'thon-dan-tre', 'nong-dan-tre', 'nong-dan',
];
const schedulePeriods = ['morning', 'noon', 'evening'];
const poses = ['idle', 'order', 'stir', 'carry', 'offer', 'eat', 'cheer', 'complain', 'gossip'];
function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} không hợp lệ.`);
  return value;
}
function text(value, label, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`${label} phải có ${required ? 'từ 1 đến ' : 'tối đa '}${max} ký tự.`);
  return value.trim();
}
function number(value, label, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label} phải từ ${min} đến ${max}.`);
  return value;
}
function option(value, choices, label) {
  if (!choices.includes(value)) throw new Error(`${label} không hợp lệ.`);
  return value;
}
function normalizeAppearance(input) {
  const value = input && typeof input === 'object' ? input : {};
  const result = { ...defaultAppearances[value.gender === 'male' ? 'male' : 'female'] };
  for (const [key, choices] of Object.entries(appearances)) if (choices.includes(value[key])) result[key] = value[key];
  return result;
}
export function validateNpcDesign(input) {
  const value = record(input, 'Tạo hình NPC');
  const result = {};
  for (const [key, choices] of Object.entries(designEnums)) result[key] = option(value[key], choices, `Tạo hình ${key}`);
  for (const [key, [min, max]] of Object.entries(designNumbers)) result[key] = number(value[key], `Tạo hình ${key}`, min, max);
  for (const key of ['outfitColor', 'accentColor', 'trouserColor']) {
    if (typeof value[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(value[key])) throw new Error(`Màu ${key} phải có định dạng #RRGGBB.`);
    result[key] = value[key];
  }
  if (!Array.isArray(value.facialMarks) || value.facialMarks.length > 8) throw new Error('Dấu hiệu khuôn mặt không hợp lệ.');
  result.facialMarks = value.facialMarks.map(mark => text(mark, 'Dấu hiệu khuôn mặt', 40));
  result.occupation = text(value.occupation, 'Nghề nghiệp', 300);
  result.historicalRole = text(value.historicalRole, 'Vai trò tạo hình', 500);
  return result;
}
export function validateMapCharacterDrafts(input, validMapIds) {
  if (!Array.isArray(input) || input.length > 300) throw new Error('Danh sách nhân vật trên map phải là mảng tối đa 300 nhân vật.');
  const identities = new Set();
  return input.map((entry, index) => {
    const item = record(entry, `Nhân vật thứ ${index + 1}`);
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(item.id)) throw new Error(`Mã nhân vật thứ ${index + 1} không hợp lệ.`);
    if (!validMapIds.includes(item.mapId)) throw new Error(`Bản đồ của nhân vật ${item.id} không hợp lệ.`);
    const identity = `${item.mapId}:${item.id}`;
    if (identities.has(identity)) throw new Error(`Trùng mã nhân vật ${item.id} trong bản đồ.`);
    identities.add(identity);
    const point = record(item.point, `Vị trí ${item.id}`);
    const opening = item.mapId === 'opening-map';
    const result = {
      id: item.id, mapId: item.mapId, name: text(item.name, 'Tên nhân vật', 100, true), appearance: normalizeAppearance(item.appearance),
      point: { x: number(point.x, 'Tọa độ X', 0, opening ? OPENING_MAP_WIDTH : 100000), y: number(point.y, 'Tọa độ Y', 0, opening ? OPENING_MAP_HEIGHT : 100000) },
    };
    for (const [key, max] of Object.entries({ alias: 120, locationLabel: 160, role: 500, mission: 3000, dialogue: 6000 })) {
      if (item[key] !== undefined) result[key] = text(item[key], key, max);
    }
    if (item.facing !== undefined) result.facing = option(item.facing, ['down', 'up', 'left', 'right'], 'Hướng nhìn');
    if (item.pose !== undefined) result.pose = option(item.pose, poses, 'Tư thế');
    if (item.schedule !== undefined) {
      if (!Array.isArray(item.schedule) || item.schedule.length > schedulePeriods.length) throw new Error('Lịch hành động NPC không hợp lệ.');
      const periods = new Set();
      result.schedule = item.schedule.map(entry => {
        const activity = record(entry, `Lịch hành động ${item.id}`);
        const period = option(activity.period, schedulePeriods, 'Buổi hoạt động NPC');
        if (periods.has(period)) throw new Error(`Lịch NPC ${item.id} bị trùng buổi ${period}.`);
        periods.add(period);
        return {
          period,
          activity: text(activity.activity, 'Mô tả hoạt động NPC', 500, true),
          dialogue: text(activity.dialogue, 'Lời thoại hoạt động NPC', 1000),
          pose: option(activity.pose, poses, 'Tư thế hoạt động NPC'),
        };
      });
    }
    if (item.kind !== undefined) result.kind = option(item.kind, ['villager', 'quest', 'guard', 'merchant'], 'Loại nhân vật');
    if (item.artwork !== undefined) result.artwork = option(item.artwork, npcArtworks, 'Ảnh nhân vật');
    if (item.scale !== undefined) result.scale = number(item.scale, 'Kích thước nhân vật', .5, 2);
    if (item.hidden !== undefined) {
      if (typeof item.hidden !== 'boolean') throw new Error('Trạng thái ẩn nhân vật không hợp lệ.');
      result.hidden = item.hidden;
    }
    if (item.design !== undefined) result.design = validateNpcDesign(item.design);
    return result;
  });
}
