import type { Point } from './world';

export const MAP_ONE_LAYOUT_SCALE = 2;
export const MAP_ONE_WORLD_SIZE = { width: 1440 * MAP_ONE_LAYOUT_SCALE, height: 1040 * MAP_ONE_LAYOUT_SCALE };

export function mapOnePoint(point: Point): Point {
  return { x: point.x * MAP_ONE_LAYOUT_SCALE, y: point.y * MAP_ONE_LAYOUT_SCALE };
}

export const MAP_ONE_ZONES = [
  { id: 'me-linh-center', name: 'TRUNG TÂM MÊ LINH', point: mapOnePoint({ x: 570, y: 430 }) },
  { id: 'me-linh-residential', name: 'KHU DÂN CƯ', point: mapOnePoint({ x: 320, y: 640 }) },
  { id: 'me-linh-fields', name: 'RUỘNG LÚA & VƯỜN RAU', point: mapOnePoint({ x: 420, y: 905 }) },
  { id: 'me-linh-market', name: 'CHỢ QUÊ', point: mapOnePoint({ x: 990, y: 550 }) },
  { id: 'me-linh-kitchen', name: 'BẾP CHUNG & HÀNG ĂN', point: mapOnePoint({ x: 1110, y: 460 }) },
  { id: 'me-linh-camp', name: 'DOANH TRẠI NGHĨA QUÂN', point: mapOnePoint({ x: 565, y: 900 }) },
  { id: 'me-linh-training', name: 'SÂN LUYỆN TẬP', point: mapOnePoint({ x: 785, y: 820 }) },
  { id: 'me-linh-forge', name: 'LÒ RÈN CÔNG CỤ', point: mapOnePoint({ x: 1255, y: 685 }) },
  { id: 'me-linh-river', name: 'BẾN SÔNG', point: mapOnePoint({ x: 1080, y: 880 }) },
  { id: 'me-linh-memorial', name: 'ĐỀN & DI TÍCH', point: mapOnePoint({ x: 195, y: 365 }) },
  { id: 'me-linh-forest', name: 'RỪNG NHIỆM VỤ ẨN', point: mapOnePoint({ x: 1350, y: 500 }) },
  { id: 'me-linh-uno', name: 'GIẢI TRÍ · LUYỆN UNO', point: mapOnePoint({ x: 765, y: 640 }) },
] as const;
