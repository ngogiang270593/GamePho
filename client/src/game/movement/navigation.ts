import { OBSTACLES, PLAYER_RADIUS, WORLD_SIZE, type Point, type MapBuilding, type HistoricalLandscape, type WorldBounds } from '../world';
export function walkable(point:Point,buildings:readonly MapBuilding[],npcs:readonly Point[]=[],landscape?:HistoricalLandscape,worldSize:WorldBounds=WORLD_SIZE):boolean {
  if(point.x<53||point.x>worldSize.width-53||point.y<73||point.y>worldSize.height-53)return false;
  const bridge=point.x>=1000&&point.x<=1110&&point.y>=782&&point.y<=812;
  for(const b of landscape === 'me-linh' ? [] : OBSTACLES){
    if(bridge&&b.x===1050&&b.y===735)continue;
    const x=Math.max(b.x,Math.min(b.x+b.width,point.x)),y=Math.max(b.y,Math.min(b.y+b.height,point.y));
    if(Math.hypot(point.x-x,point.y-y)<PLAYER_RADIUS)return false;
  }
  if(landscape==='bach-dang'&&point.y>430&&point.y<745){
    const mainRoad=point.y>=455&&point.y<=545;
    const riverBridge=point.x>=240&&point.x<=660&&point.y<=650;
    const teaIsland=point.x>=600&&point.x<=900&&point.y>=600;
    const gateWalkway=point.x>=1270&&point.x<=1370;
    if(!mainRoad&&!riverBridge&&!teaIsland&&!gateWalkway)return false;
  }
  for(const b of buildings){
    const x=Math.max(b.x,Math.min(b.x+b.width,point.x));
    const y=Math.max(b.y+46,Math.min(b.y+b.height,point.y));
    if(Math.hypot(point.x-x,point.y-y)<PLAYER_RADIUS)return false;
  }
  return !npcs.some(npc=>Math.hypot(npc.x-point.x,npc.y-point.y)<28);
}
export function clearSegment(a:Point,b:Point,allowed:(point:Point)=>boolean):boolean {
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5));
  for(let i=1;i<=steps;i++)if(!allowed({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps}))return false;
  return true;
}
// Older saves were checked against fewer building footprints. Relocate only an
// invalid saved position to nearby free ground before accepting movement input.
export function nearestWalkablePoint(origin:Point,allowed:(point:Point)=>boolean,maxRadius=320):Point|null {
  if(allowed(origin))return origin;
  for(let radius=8;radius<=maxRadius;radius+=8){
    const count=Math.max(16,Math.ceil(2*Math.PI*radius/8));
    for(let i=0;i<count;i++){
      const point={x:origin.x+Math.cos(i/count*2*Math.PI)*radius,y:origin.y+Math.sin(i/count*2*Math.PI)*radius};
      if(allowed(point))return point;
    }
  }
  return null;
}
export function moveControlled(point:Point,input:Point,seconds:number,running:boolean,allowed:(point:Point)=>boolean):Point {
  const length=Math.hypot(input.x,input.y);if(!length)return point;
  const distance=(running?190:120)*Math.min(1,length)*Math.min(.1,Math.max(0,seconds));
  const steps=Math.max(1,Math.ceil(distance/4));let next=point;
  for(let i=0;i<steps;i++){
    const x={x:next.x+input.x/length*distance/steps,y:next.y};if(allowed(x))next=x;
    const y={x:next.x,y:next.y+input.y/length*distance/steps};if(allowed(y))next=y;
  }
  return next;
}
export function findWalkingPath(start:Point,target:Point,allowed:(point:Point)=>boolean,worldSize:WorldBounds=WORLD_SIZE):Point[] {
  if(!allowed(target))return[];
  if(clearSegment(start,target,allowed))return[target];
  const size=20,cols=Math.ceil(worldSize.width/size),rows=Math.ceil(worldSize.height/size);
  const key=(p:Point)=>Math.round(p.y/size)*cols+Math.round(p.x/size);
  const point=(id:number)=>({x:id%cols*size,y:Math.floor(id/cols)*size});
  const startId=key(start),queue=[startId],parents=new Map<number,number>([[startId,-1]]);
  for(let cursor=0;cursor<queue.length;cursor++){
    const id=queue[cursor],here=id===startId?start:point(id);
    if(Math.hypot(here.x-target.x,here.y-target.y)<32&&clearSegment(here,target,allowed)){
      const path=[target];let at=id;
      while(at!==startId){path.unshift(point(at));at=parents.get(at)!;}
      return path;
    }
    const grid=point(id);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const next={x:grid.x+dx*size,y:grid.y+dy*size};
      if(next.x<0||next.y<0||next.x>=cols*size||next.y>=rows*size)continue;
      const nextId=key(next);if(parents.has(nextId)||!clearSegment(here,next,allowed))continue;
      parents.set(nextId,id);queue.push(nextId);
    }
  }
  return[];
}
