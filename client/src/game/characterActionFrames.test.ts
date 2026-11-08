import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACTION_FRAME_COUNT, ACTION_POSES, actionFramePoses, compileActionFrames, makeActionSlots, npcScheduleAnimationPoses, readActionFrames, type FrameImage } from './characterActionFrames';
import { appliedSpriteSheet, makeSpriteSheet, NPC_SCHEDULE_SPRITE_ACTION, SPRITE_ACTIONS, SPRITE_DIRECTIONS, spriteSheetError, type CharacterSpriteSheet } from './characterSpriteSheet';
import { OPENING_MAP_VILLAGER_SPRITE_SHEETS } from './openingMapVillagerSpriteSheets';
import sourceSheets from './characterSpriteSheets.json';

function frames(count = 8, width = 256, height = 256): FrameImage[] {
  return Array.from({ length: count }, (_, index) => ({ src: `data:image/png;base64,${index}`, width, height, name: `frame-${index + 1}.png` }));
}

function mockCanvas() {
  const context = { drawImage: vi.fn(), clearRect: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,YXRsYXM=');
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private imageSrc = '';
    set src(src: string) { this.imageSrc = src; queueMicrotask(() => this.onload?.()); }
    get src() { return this.imageSrc; }
  });
  return context;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('eight real action frames', () => {
  it('accepts exactly eight real frames, or four explicitly repeated in order', () => {
    expect(ACTION_FRAME_COUNT).toBe(8);
    const four = frames(4);
    expect(makeActionSlots(four, true).map(frame => frame.name)).toEqual([
      'frame-1.png', 'frame-2.png', 'frame-3.png', 'frame-4.png',
      'frame-1.png', 'frame-2.png', 'frame-3.png', 'frame-4.png',
    ]);
    const eight = frames();
    expect(makeActionSlots(eight)).toEqual(eight);
    expect(makeActionSlots(eight)).not.toBe(eight);
    for (const count of [0, 1, 4, 7, 9]) expect(() => makeActionSlots(frames(count))).toThrow('8');
    expect(() => makeActionSlots(eight, true)).toThrow('4');
    expect(() => makeActionSlots([{ ...eight[0], width: 0 }, ...eight.slice(1)])).toThrow('kích thước');
  });

  it('uses the requested four walking poses twice and supplies eight prompts for every action', () => {
    const expected = [
      'Chân trái phía trước, chân phải phía sau, tay phải đưa ra trước.',
      'Cơ thể chuyển trọng tâm, hai chân gần nhau.',
      'Chân phải phía trước, chân trái phía sau, tay trái đưa ra trước.',
      'Cơ thể chuyển trọng tâm, hai chân gần nhau.',
    ];
    expect(ACTION_POSES.walk).toEqual([...expected, ...expected]);
    for (const action of SPRITE_ACTIONS) {
      expect(actionFramePoses(action)).toHaveLength(8);
      expect(actionFramePoses(action, true).slice(0, 4)).toEqual(actionFramePoses(action, true).slice(4));
    }
  });

  it('provides task-specific eight-frame instructions for all five NPCs and their day periods', () => {
    for (const npcId of ['memory-keeper', 'fisherman-tao', 'woman-general', 'messenger', 'gate-guard']) {
      for (const period of ['morning', 'noon', 'evening'] as const) {
        expect(npcScheduleAnimationPoses(npcId, period)).toHaveLength(8);
      }
    }
    expect(npcScheduleAnimationPoses('memory-keeper', 'morning')[2]).toContain('nút');
    expect(npcScheduleAnimationPoses('fisherman-tao', 'morning')[2]).toContain('cần tre');
    expect(npcScheduleAnimationPoses('woman-general', 'noon')[3]).toContain('Dập búa');
    expect(NPC_SCHEDULE_SPRITE_ACTION).toEqual({ morning: 'npc-morning', noon: 'npc-noon', evening: 'npc-evening' });
  });

  it('leaves scheduled sprite clips as one-frame placeholders until they are explicitly authored', () => {
    const sheet = makeSpriteSheet('/npc.png', 2048, 256, 'NPC', 8, 1);
    for (const action of Object.values(NPC_SCHEDULE_SPRITE_ACTION)) {
      expect(sheet.clips[action].directions.down.count).toBe(1);
    }
  });

  it('ships each new villager with exactly four distinct front-facing signature frames', () => {
    for (const id of ['NPC_DAN_NONG_01', 'NPC_DAN_NONG_02', 'NPC_DAN_NONG_03']) {
      const sheet = OPENING_MAP_VILLAGER_SPRITE_SHEETS[`opening-map-npc:${id}`];
      expect(sheet).toMatchObject({ columns: 4, rows: 1, clips: { 'npc-morning': { directions: { down: { start: 0, count: 4 } } } } });
      expect(spriteSheetError(sheet)).toBeNull();
    }
  });

  it('uses saved action sheets instead of the built-in villager artwork after a source save', () => {
    for (const id of ['NPC_DAN_NONG_01', 'NPC_DAN_NONG_02', 'NPC_DAN_NONG_03']) {
      const target = `opening-map-npc:${id}`;
      const saved = sourceSheets[target as keyof typeof sourceSheets] as CharacterSpriteSheet | undefined;
      if (!saved) continue;

      expect(appliedSpriteSheet(target)).toMatchObject({
        src: saved.src,
        name: saved.name,
        rows: saved.rows,
        clips: { 'npc-morning': { directions: { down: saved.clips['npc-morning'].directions.down } } },
      });
    }
  });

  it('compiles four villager frames without repeating them or changing their frame count', async () => {
    mockCanvas();
    const base = makeSpriteSheet('/villager.png', 1024, 256, 'Villager', 4, 1);
    base.clips['npc-morning'].directions.down = { start: 0, count: 4 };
    const result = await compileActionFrames(base, frames(4), 'npc-morning', 'down', 'Villager work', 4);
    expect(result).toMatchObject({ columns: 4, rows: 2 });
    expect(result.clips['npc-morning'].directions.down.count).toBe(4);
    expect(result.clips['npc-morning'].directions.down.start + 4).toBeLessThanOrEqual(result.columns * result.rows);
    expect(spriteSheetError(result)).toBeNull();
  });

  it('keeps full offset/gap cells and every unselected clip when repacking a non-eight-column atlas', async () => {
    const context = mockCanvas();
    const base = {
      ...makeSpriteSheet('/base.png', 37, 36, 'Original', 3, 2),
      cellWidth: 8, cellHeight: 10, offsetX: 9, offsetY: 13, gapX: 2, gapY: 3,
    };
    const original = structuredClone(base);
    const result = await compileActionFrames(base, frames(8, 12, 16), 'walk', 'down', 'Walk');
    expect(result).toMatchObject({ columns: 8, rows: 2, cellWidth: 12, cellHeight: 16, imageWidth: 96, imageHeight: 32, offsetX: 0, offsetY: 0, gapX: 0, gapY: 0, singleFrameWalk: false });
    expect(result.clips.walk.directions.down).toEqual({ start: 8, count: 8 });
    for (const action of SPRITE_ACTIONS) for (const facing of SPRITE_DIRECTIONS) {
      if (facing === 'down' && ['walk', 'idle', 'run'].includes(action)) continue;
      expect(result.clips[action].directions[facing]).toEqual(base.clips[action].directions[facing]);
    }
    expect(result.clips.idle.directions.down).toEqual({ start: 8, count: 1 });
    expect(result.clips.run.directions.down).toEqual({ start: 8, count: 8 });
    expect(context.drawImage.mock.calls[4].slice(1)).toEqual([19, 26, 8, 10, 50, 6, 8, 10]);
    expect(context.drawImage.mock.calls[6].slice(1)).toEqual([0, 0, 12, 16, 0, 16, 12, 16]);
    expect(spriteSheetError(result)).toBeNull();
    expect(base).toEqual(original);
  });

  it('centers and bottom-aligns different whole frame sizes without cropping', async () => {
    const context = mockCanvas();
    const imported = frames(8, 128, 128);
    imported[1] = { ...imported[1], width: 256, height: 320 };
    const result = await compileActionFrames(null, imported, 'walk', 'left', 'Walk left');
    expect(result).toMatchObject({ columns: 8, rows: 1, cellWidth: 256, cellHeight: 320 });
    expect(context.drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 128, 128, 64, 192, 128, 128]);
    expect(context.drawImage.mock.calls[1].slice(1)).toEqual([0, 0, 256, 320, 256, 0, 256, 320]);
    expect(result.clips.walk.directions.left).toEqual({ start: 0, count: 8 });
    expect(result.clips.walk.directions.down).toEqual({ start: 0, count: 1 });
    expect(result.clips.idle.directions.left).toEqual({ start: 0, count: 1 });
    expect(result.clips.run.directions.left).toEqual({ start: 0, count: 8 });
  });

  it('replaces an unshared eight-frame range without growing the atlas on every edit', async () => {
    mockCanvas();
    const initial = await compileActionFrames(null, frames(), 'walk', 'down', 'Walk');
    const second = await compileActionFrames(initial, frames(), 'walk', 'down', 'Updated walk');
    const third = await compileActionFrames(second, frames(), 'walk', 'down', 'Updated again');
    expect(second.rows).toBe(2);
    expect(third.rows).toBe(second.rows);
    expect(third.clips.walk.directions.down).toEqual(second.clips.walk.directions.down);
    expect(third.clips.idle.directions.down).toEqual({ start: third.clips.walk.directions.down.start, count: 1 });
  });

  it('reads only actual current action frames and crops using original offsets and gaps', async () => {
    const context = mockCanvas();
    const sheet = { ...makeSpriteSheet('/base.png', 37, 36, 'Original', 3, 2), cellWidth: 8, cellHeight: 10, offsetX: 9, offsetY: 13, gapX: 2, gapY: 3 };
    const extracted = await readActionFrames(sheet, 'walk', 'right');
    expect(extracted).toHaveLength(3);
    expect(extracted[0]).toMatchObject({ width: 8, height: 10, name: 'Original-walk-right-1.png' });
    expect(context.drawImage.mock.calls[0].slice(1)).toEqual([9, 26, 8, 10, 0, 0, 8, 10]);
    expect(context.drawImage.mock.calls[1].slice(1)).toEqual([19, 26, 8, 10, 0, 0, 8, 10]);
    const single = await readActionFrames(makeSpriteSheet('/single.png', 256, 256), 'walk', 'down');
    expect(single).toHaveLength(1);
  });

  it('uses a non-looping eight-frame jump clip and rejects incomplete batches', async () => {
    mockCanvas();
    const jumping = await compileActionFrames(null, frames(), 'jump', 'up', 'Jump');
    expect(jumping.clips.jump).toMatchObject({ fps: 8, loop: false, directions: { up: { start: 0, count: 8 } } });
    const attack = await compileActionFrames(null, frames(), 'attack', 'up', 'Attack');
    expect(attack.clips.attack).toMatchObject({ fps: 8, loop: false, directions: { up: { start: 0, count: 8 } } });
    expect((await compileActionFrames(null, frames(), 'run', 'down', 'Run')).clips.run.fps).toBe(8);
    await expect(compileActionFrames(null, frames(1), 'walk', 'down', 'Incomplete')).rejects.toThrow('8');
  });

  it('keeps four distinct movement directions and stops facing the last movement direction', async () => {
    mockCanvas();
    let sheet: CharacterSpriteSheet | null = null;
    for (const direction of SPRITE_DIRECTIONS) sheet = await compileActionFrames(sheet, frames(), 'walk', direction, 'Directional walk');
    expect(sheet!.movementFrameCount).toBe(8);
    const starts = SPRITE_DIRECTIONS.map(direction => sheet!.clips.walk.directions[direction].start);
    expect(new Set(starts).size).toBe(4);
    for (const direction of SPRITE_DIRECTIONS) {
      const walk = sheet!.clips.walk.directions[direction];
      expect(walk.count).toBe(8);
      expect(sheet!.clips.idle.directions[direction]).toEqual({ start: walk.start, count: 1 });
      expect(sheet!.clips.run.directions[direction]).toEqual(walk);
    }
    // A separately authored run survives later changes to the walking sequence.
    const authored = await compileActionFrames(sheet, frames(), 'run', 'right', 'Run');
    const run = authored.clips.run.directions.right;
    authored.clips.walk.loop = false;
    const changed = await compileActionFrames(authored, frames(), 'walk', 'right', 'Walk');
    expect(changed.clips.run.directions.right).toEqual(run);
    expect(changed.clips.walk.loop).toBe(false);
  });
});
