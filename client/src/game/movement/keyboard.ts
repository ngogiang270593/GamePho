import type { Point } from '../world';
export const DIRECTION_KEYS:Record<string,Point>={w:{x:0,y:-1},arrowup:{x:0,y:-1},s:{x:0,y:1},arrowdown:{x:0,y:1},a:{x:-1,y:0},arrowleft:{x:-1,y:0},d:{x:1,y:0},arrowright:{x:1,y:0}};
export function keyboardVector(keys:Iterable<string>):Point {
  const result={x:0,y:0};
  for(const key of keys){const delta=DIRECTION_KEYS[key];if(delta){result.x+=delta.x;result.y+=delta.y;}}
  const length=Math.hypot(result.x,result.y);return length?{x:result.x/length,y:result.y/length}:result;
}
