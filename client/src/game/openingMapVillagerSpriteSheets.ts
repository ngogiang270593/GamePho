import type { CharacterSpriteSheet } from './characterSpriteSheet';
import youngVillagerGirl from '../../assets/nhan-vat/thon-dan-tre.png?inline';
import youngVillagerFarmer from '../../assets/nhan-vat/nong-dan-tre.png?inline';
import elderVillagerFarmer from '../../assets/nhan-vat/nong-dan.png?inline';

type FramePose = readonly [x: number, y: number, rotation: number];

function fourFrameSheet(name: string, artwork: string, poses: readonly FramePose[]): CharacterSpriteSheet {
  const frameSize = 256;
  const cells = poses.map(([x, y, rotation], index) =>
    `<svg x="${index * frameSize}" y="0" width="${frameSize}" height="${frameSize}" viewBox="0 0 ${frameSize} ${frameSize}"><g transform="translate(${x} ${y}) rotate(${rotation} 128 212)"><image href="${artwork}" width="256" height="256" preserveAspectRatio="xMidYMax meet"/></g></svg>`,
  ).join('');
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="256" viewBox="0 0 1024 256">${cells}</svg>`)}`;
  const directions = Object.fromEntries(['down', 'right', 'up', 'left'].map(direction => [direction, { start: 0, count: 1 }])) as CharacterSpriteSheet['clips']['idle']['directions'];
  const clips = Object.fromEntries(['idle', 'walk', 'run', 'attack', 'turn', 'jump', 'npc-morning', 'npc-noon', 'npc-evening'].map(action => [
    action,
    {
      fps: action === 'run' ? 12 : 8,
      loop: action !== 'jump' && action !== 'attack',
      directions: {
        ...directions,
        down: { start: 0, count: action === 'npc-morning' ? 4 : 1 },
      },
    },
  ])) as CharacterSpriteSheet['clips'];
  return {
    version: 1, name, src,
    imageWidth: 1024, imageHeight: frameSize, cellWidth: frameSize, cellHeight: frameSize,
    columns: 4, rows: 1, offsetX: 0, offsetY: 0, gapX: 0, gapY: 0,
    anchorX: .5,
    anchorY: .97,
    scale: 1,
    singleFrameWalk: true,
    clips: { ...clips, 'npc-morning': { ...clips['npc-morning'], fps: 5 } },
  };
}

export const OPENING_MAP_VILLAGER_SPRITE_SHEETS: Record<string, CharacterSpriteSheet> = {
  'opening-map-npc:NPC_DAN_NONG_01': fourFrameSheet('Bé Thảo · nâng niu giỏ rau', youngVillagerGirl, [
    [0, 0, 0], [0, -2, -1.2], [1, 0, 1.1], [0, -1, 0],
  ]),
  'opening-map-npc:NPC_DAN_NONG_02': fourFrameSheet('Cậu Tùng · thu hoạch rau', youngVillagerFarmer, [
    [0, 0, 0], [1, 1, 1.6], [-1, -1, -1.7], [0, 1, 0],
  ]),
  'opening-map-npc:NPC_DAN_NONG_03': fourFrameSheet('Bác Hòa · gom lúa mùa', elderVillagerFarmer, [
    [0, 0, 0], [-1, -1, -1.5], [1, 0, 1.7], [0, -1, 0],
  ]),
};
