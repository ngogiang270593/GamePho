import type { Point } from '../world';
export function joystickVector(dx:number,dy:number,radius:number):Point {
  const distance=Math.hypot(dx,dy),deadZone=.12;
  const magnitude=Math.min(1,distance/Math.max(1,radius));
  if(magnitude<=deadZone)return{x:0,y:0};
  const strength=(magnitude-deadZone)/(1-deadZone);
  return{x:dx/distance*strength,y:dy/distance*strength};
}
