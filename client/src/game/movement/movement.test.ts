import {describe,it,expect} from 'vitest';
import {joystickVector} from './joystick';
import {keyboardVector} from './keyboard';
import {clearSegment,findWalkingPath,moveControlled,walkable,nearestWalkablePoint} from './navigation';
import {BUILDINGS,SPAWN} from '../world';
import { MAP_ONE_WORLD_SIZE } from '../mapOneMap';

describe('movement input and navigation',()=>{
  it('recovers an older saved position trapped inside an expanded village house',()=>{
    const home={id:'home',x:95,y:654,width:250,height:201,title:'',subtitle:'',color:'',roof:''};
    const allowed=(p:{x:number;y:number})=>walkable(p,[...BUILDINGS,home]);
    const saved={x:220,y:710};
    expect(allowed(saved)).toBe(false);
    expect(moveControlled(saved,{x:1,y:0},1/60,false,allowed)).toEqual(saved);
    const recovered=nearestWalkablePoint(saved,allowed)!;
    expect(recovered).toBeTruthy();expect(allowed(recovered)).toBe(true);
    expect(findWalkingPath(recovered,{x:390,y:640},allowed).length).toBeGreaterThan(0);
    expect(nearestWalkablePoint({x:480,y:475},allowed)).toEqual({x:480,y:475});
    const npcBlocked=(p:{x:number;y:number})=>walkable(p,BUILDINGS,[{x:480,y:475}]);
    const outsideNpc=nearestWalkablePoint({x:480,y:475},npcBlocked)!;
    expect(npcBlocked(outsideNpc)).toBe(true);
    expect(Math.hypot(outsideNpc.x-480,outsideNpc.y-475)).toBeGreaterThanOrEqual(28);
  });
  it('normalizes keyboard diagonals and cancels opposing keys',()=>{
    expect(keyboardVector(['w','s'])).toEqual({x:0,y:0});
    expect(Math.hypot(...Object.values(keyboardVector(['w','d'])))).toBeCloseTo(1);
  });
  it('has a dead zone and clamps joystick strength without losing direction',()=>{
    expect(joystickVector(2,1,40)).toEqual({x:0,y:0});
    const half=joystickVector(20,0,40),full=joystickVector(100,0,40);
    expect(half.x).toBeGreaterThan(0);expect(half.x).toBeLessThan(full.x);
    expect(full).toEqual({x:1,y:0});expect(joystickVector(0,-100,40)).toEqual({x:0,y:-1});
  });
  it('uses frame time, analog strength and sprint without diagonal acceleration',()=>{
    const allowed=()=>true;
    const travel=(fps:number,input={x:1,y:0},run=false)=>{let p={x:0,y:0};for(let n=0;n<fps;n++)p=moveControlled(p,input,1/fps,run,allowed);return Math.hypot(p.x,p.y);};
    for(const fps of [30,60,120])expect(travel(fps)).toBeCloseTo(160);
    expect(travel(60,{x:.5,y:0})).toBeCloseTo(80);
    expect(travel(60,{x:1,y:1})).toBeCloseTo(160);
    expect(travel(60,{x:1,y:0},true)).toBeCloseTo(250);
    expect(moveControlled(SPAWN,{x:0,y:0},.1,false,allowed)).toEqual(SPAWN);
  });
  it('routes around a house and checks every segment instead of cutting corners',()=>{
    const allowed=(p:{x:number;y:number})=>walkable(p,BUILDINGS);
    const start={x:120,y:370},target={x:550,y:200};
    const path=findWalkingPath(start,target,allowed);
    expect(path.length).toBeGreaterThan(1);
    let previous=start;
    for(const point of path){expect(allowed(point)).toBe(true);expect(clearSegment(previous,point,allowed)).toBe(true);previous=point;}
    expect(path[path.length-1]).toEqual(target);
    expect(findWalkingPath(start,{x:300,y:220},allowed)).toEqual([]);
  });
  it('walks inside Map 1 expanded world bounds',()=>{
    const allowed=(point:{x:number;y:number})=>walkable(point,[],[],'me-linh',MAP_ONE_WORLD_SIZE);
    const target={x:2800,y:1900};
    expect(allowed(target)).toBe(true);
    expect(findWalkingPath({x:960,y:950},target,allowed,MAP_ONE_WORLD_SIZE)).toEqual([target]);
  });
  it('blocks NPCs, trees, ponds and added building footprints',()=>{
    expect(walkable({x:480,y:475},[],[{x:490,y:475}])).toBe(false);
    expect(walkable({x:95,y:465},[])).toBe(false);
    expect(walkable({x:1150,y:800},[])).toBe(false);
    expect(walkable({x:100,y:650},[],[],'bach-dang')).toBe(false);
    expect(walkable({x:480,y:495},[],[],'bach-dang')).toBe(true);
    expect(walkable({x:1070,y:795},[])).toBe(true);
    const building={id:'new',x:450,y:400,width:100,height:100,title:'',subtitle:'',color:'',roof:''};
    expect(walkable({x:480,y:475},[building])).toBe(false);
    let point={x:480,y:550};
    for(let n=0;n<120;n++)point=moveControlled(point,{x:0,y:-1},1/60,true,p=>walkable(p,[building]));
    expect(point.y).toBeGreaterThanOrEqual(513);
  });
});
