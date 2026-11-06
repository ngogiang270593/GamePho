import type { Facing } from './character';
import { makeSpriteSheet, spriteCell, spriteSheetError, type CharacterSpriteSheet, type SpriteAction } from './characterSpriteSheet';
import type { OpeningMapNpcDayPeriod } from './mapCharacterDraft';

export const ACTION_FRAME_COUNT = 8;
export interface FrameImage { src: string; width: number; height: number; name: string }

const walkPoses = [
  'Chân trái phía trước, chân phải phía sau, tay phải đưa ra trước.',
  'Cơ thể chuyển trọng tâm, hai chân gần nhau.',
  'Chân phải phía trước, chân trái phía sau, tay trái đưa ra trước.',
  'Cơ thể chuyển trọng tâm, hai chân gần nhau.',
];
const npcActionPoses = [
  'Tư thế bắt đầu, đứng vững và hướng về đạo cụ.',
  'Đưa tay vào vị trí thực hiện động tác.',
  'Thực hiện động tác đặc trưng một nhịp, giữ chân ổn định.',
  'Thả lỏng tay và trở về tư thế bắt đầu.',
];

export const ACTION_POSES: Record<SpriteAction, readonly string[]> = {
  walk: [...walkPoses, ...walkPoses],
  idle: ['Đứng cân bằng, hai chân cố định.', 'Hít vào nhẹ, vai nâng rất ít.', 'Ngực nâng nhẹ, giữ nguyên bàn chân.', 'Thở ra chậm, vai hạ nhẹ.', 'Đứng cân bằng, hai chân cố định.', 'Chớp mắt nhẹ, giữ nguyên tư thế.', 'Mở mắt, tay thả tự nhiên.', 'Trở về đúng tư thế của frame đầu.'],
  run: ['Chân trái vươn về trước, tay phải đánh về trước.', 'Chân trái chạm đất, thân hơi nghiêng.', 'Đẩy người bằng chân trái, chân phải thu lên.', 'Hai chân rời đất ngắn, chân phải vươn ra.', 'Chân phải vươn về trước, tay trái đánh về trước.', 'Chân phải chạm đất, thân hơi nghiêng.', 'Đẩy người bằng chân phải, chân trái thu lên.', 'Hai chân rời đất ngắn, trở về bước chân trái.'],
  turn: ['Đứng ở hướng ban đầu.', 'Xoay người 45 độ theo chiều kim đồng hồ.', 'Xoay người 90 độ theo chiều kim đồng hồ.', 'Xoay người 135 độ theo chiều kim đồng hồ.', 'Xoay người 180 độ theo chiều kim đồng hồ.', 'Xoay người 225 độ theo chiều kim đồng hồ.', 'Xoay người 270 độ theo chiều kim đồng hồ.', 'Xoay người 315 độ, chuẩn bị về hướng đầu.'],
  jump: ['Đứng cân bằng, chuẩn bị nhảy.', 'Khuỵu gối, hạ trọng tâm.', 'Duỗi chân đẩy người lên.', 'Hai chân rời mặt đất, người đang lên.', 'Đạt điểm cao nhất, chân thu nhẹ.', 'Hạ người xuống, chân duỗi chuẩn bị tiếp đất.', 'Tiếp đất, khuỵu gối giảm lực.', 'Đứng cân bằng trở lại, hai chân chạm đất.'],
  'npc-morning': [...npcActionPoses, ...npcActionPoses],
  'npc-noon': ['Bắt đầu công việc buổi trưa.', 'Chuẩn bị dụng cụ bằng hai tay.', 'Thực hiện động tác chính lần một.', 'Giữ nhịp công việc, không đổi vị trí chân.', 'Thực hiện động tác chính lần hai.', 'Điều chỉnh dụng cụ hoặc nguyên liệu.', 'Hoàn tất thao tác, thả lỏng vai.', 'Trở về tư thế đầu để lặp tự nhiên.'],
  'npc-evening': ['Bắt đầu công việc buổi tối.', 'Đưa đạo cụ vào vị trí làm việc.', 'Thực hiện động tác chính lần một.', 'Tiếp tục công việc trong tư thế ổn định.', 'Thực hiện động tác chính lần hai.', 'Kiểm tra hoặc cất đạo cụ.', 'Hoàn tất thao tác, thả lỏng vai.', 'Trở về tư thế đầu để lặp tự nhiên.'],
};

export const NPC_SCHEDULE_ANIMATION_POSES: Record<string, Record<OpeningMapNpcDayPeriod, readonly string[]>> = {
  'memory-keeper': {
    morning: ['Ngồi bệt trên chiếu, nhìn xuống tấm lưới.', 'Giữ lưới bằng tay trái, tay phải tìm nút rối.', 'Kéo nhẹ một đầu dây để gỡ nút.', 'Nới nút lưới bằng hai bàn tay chai sần.', 'Kéo đoạn lưới vừa gỡ ra kiểm tra.', 'Ngước nhìn dòng sông, thở dài lo lắng.', 'Cúi xuống tiếp tục gỡ lưới.', 'Trở về tư thế đầu, hai tay đặt trên lưới.'],
    noon: ['Cúi bên bếp củi ẩm, đưa củi vào bếp.', 'Chụm củi mục và nhóm lửa nhỏ.', 'Quạt bếp bằng tay hoặc quạt mo.', 'Nghiêng người thổi nhẹ cho lửa bén.', 'Khuấy nồi cháo loãng bằng muôi.', 'Thêm rau đắng vào nồi, giữ bếp cháy.', 'Quạt bếp thêm vài nhịp.', 'Trở về tư thế đầu bên bếp.'],
    evening: ['Ngồi bên ngọn đèn dầu, cầm áo vá.', 'Luồn kim vào vành áo cũ.', 'Khâu một mũi chậm bằng tay phải.', 'Kéo chỉ qua lớp vải, giữ áo bằng tay trái.', 'Khâu mũi tiếp theo dọc vành áo.', 'Nâng áo lên kiểm tra đường chỉ.', 'Hạ áo xuống và tiếp tục khâu.', 'Trở về tư thế đầu dưới ánh đèn.'],
  },
  'fisherman-tao': {
    morning: ['Đứng kiễng chân trên mỏm đá, giữ cần tre.', 'Đưa cần ra sau lấy đà nhẹ.', 'Vung cần tre về phía dòng sông.', 'Giữ cần, mắt nhìn phao trên mặt nước.', 'Kéo cần lên khi cá vừa cắn câu.', 'Giữ cá bằng một tay, gỡ móc câu.', 'Thả cá vào giỏ tre bên cạnh.', 'Trở về tư thế đầu, hướng mắt ra sông.'],
    noon: ['Ngồi dưới bóng cây vối bên thớt cá.', 'Đặt cá lên thớt và giữ chắc bằng tay.', 'Dùng dao nhỏ lóc vảy cá.', 'Xoay cá để làm sạch mặt còn lại.', 'Phân loại cá vào giỏ hoặc rổ.', 'Đan lại nan tre của chiếc bẫy cá.', 'Kiểm tra và siết mối đan cuối.', 'Trở về tư thế đầu bên thớt cá.'],
    evening: ['Thu mình trong túp lều cọ để ngủ.', 'Nằm nghiêng, hai tay đặt gần ngực.', 'Nhắm mắt và thở đều.', 'Ngủ say, vai nâng nhẹ theo nhịp thở.', 'Ngáy khò khò, giữ nguyên tư thế nằm.', 'Thở ra chậm, cơ thể thư giãn.', 'Tiếp tục ngủ yên trong lều.', 'Trở về nhịp thở đầu khi ngủ.'],
  },
  'woman-general': {
    morning: ['Đứng vững dưới gốc đa, cầm mộc đao.', 'Đưa mộc đao lên thế chuẩn bị.', 'Chém ngang dứt khoát sang trái.', 'Thu đao về trước ngực, chân trụ chắc.', 'Xoay hông và chém chéo sang phải.', 'Hạ thấp trọng tâm, giữ thế thủ.', 'Nâng đao trở lại tư thế luyện tập.', 'Trở về tư thế đầu dưới gốc đa.'],
    noon: ['Đeo tạp dề, dùng kìm giữ thỏi quặng đỏ.', 'Đặt thỏi sắt lên mặt đe.', 'Nâng búa qua vai chuẩn bị dập.', 'Dập búa xuống thỏi sắt đúng nhịp.', 'Nâng búa lên và xoay thỏi sắt bằng kìm.', 'Dập búa lần nữa, tia lửa nhỏ bật ra.', 'Kiểm tra hình dạng thỏi sắt trên đe.', 'Trở về tư thế đầu bên lò rèn.'],
    evening: ['Ngồi bên gốc đa, cầm thanh đao cần lau.', 'Giữ lưỡi đao bằng khăn tẩm dầu.', 'Lau dọc sống đao bằng một tay.', 'Đổi tay và lau mặt còn lại.', 'Xoay đao để kiểm tra ánh thép.', 'Mài nhẹ cạnh đao bằng đá mài.', 'Cất khăn, giữ đao trong tay.', 'Trở về tư thế đầu để tiếp tục bảo dưỡng.'],
  },
  messenger: {
    morning: ['Quỳ bên tấm cót, mở sạp hàng.', 'Đặt khoai thành một hàng nhỏ.', 'Xếp rau muống và hũ muối lên cót.', 'Vuốt phẳng mép tấm cót bán hàng.', 'Ngó nhanh về phía đầu đường.', 'Che bớt hàng, cảnh giác bóng lính tuần.', 'Chỉnh lại sạp nhưng vẫn quan sát xung quanh.', 'Trở về tư thế đầu cạnh sạp hàng.'],
    noon: ['Ngồi bên sạp, cầm quạt mo cau.', 'Quạt nhẹ để đuổi ruồi khỏi hàng.', 'Nghiêng người rao hàng với khách.', 'Mỉm cười mời khách xem hàng.', 'Nghiêng tai dò hỏi tin tức khách.', 'Quạt mo và liếc nhìn con đường.', 'Đon đả mời khách nhưng giữ vẻ cảnh giác.', 'Trở về tư thế đầu bên sạp.'],
    evening: ['Đóng sạp, kéo tấm bạt che kín.', 'Kiểm tra cửa kho phía sau.', 'Thắp ngọn đèn mờ trong kho.', 'Mở sổ và đếm tiền trên bàn.', 'Xếp từng đồng tiền thành chồng nhỏ.', 'Nghe tiếng động, quay nhìn ra cửa.', 'Gấp sổ và ra dấu hẹn gặp bí mật.', 'Trở về tư thế đầu trong kho tối.'],
  },
  'gate-guard': {
    morning: ['Đứng giữa đầu cầu, chống trường kiếm.', 'Chặn người qua cầu bằng một tay.', 'Chỉ tay yêu cầu xuất trình giấy tờ.', 'Quan sát người đi qua với vẻ hách dịch.', 'Đưa tay thu thuế qua cầu.', 'Kiểm tra giấy thông hành lần nữa.', 'Trở về thế đứng canh gác.', 'Đứng vững giữa lối lên cầu.'],
    noon: ['Đứng trên cầu, giữ kiếm bên người.', 'Quan sát giấy tờ của người qua đường.', 'Nghiêng người kiểm tra tờ giấy.', 'Ra hiệu dừng lại để lục soát.', 'Thu thuế và xua người qua chốt.', 'Quay nhìn dọc cầu tìm người khả nghi.', 'Trở về thế đứng chặn đường.', 'Giữ vị trí canh gác giữa cầu.'],
    evening: ['Đứng cạnh lửa trại, tay giữ trường kiếm.', 'Nhấp chén rượu, vẫn nhìn về đầu cầu.', 'Cười lớn và thách thức người muốn qua.', 'Đặt chén xuống, tay trở lại chuôi kiếm.', 'Hạ thấp trọng tâm vào thế phòng thủ.', 'Giữ kiếm sẵn sàng khi nghe động tĩnh.', 'Bước lên chắn trước cây cầu.', 'Trở về thế thủ cạnh lửa trại.'],
  },
};

export function npcScheduleAnimationPoses(npcId: string, period: OpeningMapNpcDayPeriod): readonly string[] {
  const action = period === 'morning' ? 'npc-morning' : period === 'noon' ? 'npc-noon' : 'npc-evening';
  return NPC_SCHEDULE_ANIMATION_POSES[npcId]?.[period] ?? ACTION_POSES[action];
}

export function actionFramePoses(action: SpriteAction, repeatFour = false): string[] {
  const poses = ACTION_POSES[action];
  return repeatFour ? [...poses.slice(0, 4), ...poses.slice(0, 4)] : [...poses];
}

export function makeActionSlots(frames: readonly FrameImage[], repeatFour = false, frameCount = ACTION_FRAME_COUNT): FrameImage[] {
  const expected = repeatFour ? 4 : frameCount;
  if (frames.length !== expected) throw new Error(repeatFour
    ? 'Chọn đúng 4 ảnh để tạo thứ tự 1, 2, 3, 4, 1, 2, 3, 4.'
    : `Mỗi hành động cần đủ đúng ${frameCount} ảnh frame.`);
  for (const frame of frames) {
    if (!frame || typeof frame.src !== 'string' || !frame.src
      || !Number.isInteger(frame.width) || frame.width < 1 || frame.width > 16384
      || !Number.isInteger(frame.height) || frame.height < 1 || frame.height > 16384) throw new Error('Frame cần có ảnh và kích thước nguyên dương hợp lệ.');
  }
  return repeatFour ? [...frames, ...frames] : [...frames];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không đọc được ảnh frame. Hãy nhập lại ảnh PNG, JPEG hoặc WebP.'));
    image.src = src;
  });
}

function canvasFor(width: number, height: number) {
  if (width > 16384 || height > 16384) throw new Error('Atlas vượt 16384 pixel. Hãy dùng frame nhỏ hơn hoặc giảm số ô của atlas gốc.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ ghép frame.');
  return { canvas, context };
}

function reusableRange(base: CharacterSpriteSheet, action: SpriteAction, facing: Facing, frameCount: number): number | null {
  const selected = base.clips[action]?.directions[facing];
  if (selected?.count !== frameCount) return null;
  for (const [otherAction, clip] of Object.entries(base.clips)) {
    if (!clip) continue;
    for (const [otherFacing, range] of Object.entries(clip.directions)) {
      if (otherAction === action && otherFacing === facing) continue;
      if (action === 'walk' && otherFacing === facing
        && ((otherAction === 'idle' && range.start === selected.start && range.count === 1)
          || (otherAction === 'run' && range.start === selected.start && range.count === selected.count))) continue;
      if (range.start < selected.start + selected.count && range.start + range.count > selected.start) return null;
    }
  }
  return selected.start;
}

/** Repack full cells without resizing/cropping their artwork; replace one action and direction. */
export async function compileActionFrames(base: CharacterSpriteSheet | null, inputFrames: readonly FrameImage[], action: SpriteAction, facing: Facing, name: string, frameCount = ACTION_FRAME_COUNT): Promise<CharacterSpriteSheet> {
  const frames = makeActionSlots(inputFrames, false, frameCount);
  if (base) {
    const error = spriteSheetError(base);
    if (error) throw new Error(error);
  }
  const cellWidth = Math.max(base?.cellWidth ?? 0, ...frames.map(frame => frame.width));
  const cellHeight = Math.max(base?.cellHeight ?? 0, ...frames.map(frame => frame.height));
  const originalCells = base ? base.columns * base.rows : 0;
  const reusable = base ? reusableRange(base, action, facing, frameCount) : null;
  const start = reusable ?? Math.ceil(originalCells / frameCount) * frameCount;
  const rows = Math.ceil(Math.max(originalCells, start + frameCount) / frameCount);
  const { canvas, context } = canvasFor(cellWidth * frameCount, cellHeight * rows);
  const images = new Map<string, Promise<HTMLImageElement>>();
  const read = (src: string) => {
    if (!images.has(src)) images.set(src, loadImage(src));
    return images.get(src)!;
  };
  const [originalImage, frameImages] = await Promise.all([
    base ? read(base.src) : Promise.resolve(null),
    Promise.all(frames.map(frame => read(frame.src))),
  ]);
  if (base && originalImage) {
    for (let index = 0; index < originalCells; index++) {
      if (reusable !== null && index >= start && index < start + frameCount) continue;
      const cell = spriteCell(base, index);
      context.drawImage(originalImage, cell.x, cell.y, base.cellWidth, base.cellHeight,
        index % frameCount * cellWidth + (cellWidth - base.cellWidth) / 2,
        Math.floor(index / frameCount) * cellHeight + cellHeight - base.cellHeight,
        base.cellWidth, base.cellHeight);
    }
  }
  frames.forEach((frame, offset) => {
    const index = start + offset;
    context.drawImage(frameImages[offset], 0, 0, frame.width, frame.height,
      index % frameCount * cellWidth + (cellWidth - frame.width) / 2,
      Math.floor(index / frameCount) * cellHeight + cellHeight - frame.height,
      frame.width, frame.height);
  });
  const initial = base ?? makeSpriteSheet(frames[0].src, cellWidth, cellHeight, name);
  const selected = initial.clips[action] ?? initial.clips.walk;
  const sheet: CharacterSpriteSheet = {
    ...initial, name, src: canvas.toDataURL('image/png'),
    imageWidth: canvas.width, imageHeight: canvas.height, cellWidth, cellHeight,
    columns: frameCount, rows, offsetX: 0, offsetY: 0, gapX: 0, gapY: 0,
    // Keep the old cell's anchor position when its artwork receives padding.
    anchorX: base ? ((cellWidth - base.cellWidth) / 2 + base.anchorX * base.cellWidth) / cellWidth : .5,
    anchorY: base ? (cellHeight - base.cellHeight + base.anchorY * base.cellHeight) / cellHeight : .97,
    scale: base ? Math.min(4, base.scale * cellHeight / base.cellHeight) : 1,
    singleFrameWalk: false, movementFrameCount: 8,
    clips: {
      ...initial.clips,
      [action]: {
        ...selected, fps: base?.clips[action]?.fps ?? 8, loop: base?.clips[action]?.loop ?? action !== 'jump',
        directions: { ...selected.directions, [facing]: { start, count: frameCount } },
      },
    },
  };
  if (action === 'walk') {
    // Standing must keep the same view as the direction the player last moved.
    // Until a separate idle/run sequence is authored, derive these from that
    // direction's walk frames instead of reusing the front-facing reference.
    const oldWalk = base?.clips.walk.directions[facing];
    const idle = sheet.clips.idle;
    if (idle.directions[facing].count < ACTION_FRAME_COUNT) {
      sheet.clips.idle = { ...idle, directions: { ...idle.directions, [facing]: { start, count: 1 } } };
    }
    const run = sheet.clips.run;
    const runRange = run?.directions[facing];
    if (run && (runRange.count < ACTION_FRAME_COUNT || (oldWalk && runRange.start === oldWalk.start && runRange.count === oldWalk.count))) {
      sheet.clips.run = { ...run, directions: { ...run.directions, [facing]: { start, count: ACTION_FRAME_COUNT } } };
    }
  }
  const error = spriteSheetError(sheet);
  if (error) throw new Error(error);
  return sheet;
}

/** Read actual cells only; a one-frame clip remains one frame for the editor to fill. */
export async function readActionFrames(sheet: CharacterSpriteSheet, action: SpriteAction, facing: Facing): Promise<FrameImage[]> {
  const error = spriteSheetError(sheet);
  if (error) throw new Error(error);
  const clip = sheet.clips[action] ?? sheet.clips.walk ?? sheet.clips.idle;
  const range = clip.directions[facing];
  const image = await loadImage(sheet.src);
  const { canvas, context } = canvasFor(sheet.cellWidth, sheet.cellHeight);
  return Array.from({ length: Math.min(ACTION_FRAME_COUNT, range.count) }, (_, offset) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const cell = spriteCell(sheet, range.start + offset);
    context.drawImage(image, cell.x, cell.y, sheet.cellWidth, sheet.cellHeight, 0, 0, sheet.cellWidth, sheet.cellHeight);
    return { src: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, name: `${sheet.name.replace(/\.[^.]+$/, '')}-${action}-${facing}-${offset + 1}.png` };
  });
}
