import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {joystickVector} from '../game/movement/joystick';
import type {Point} from '../game/world';
export function VirtualJoystick({onChange,resetKey}:{onChange:(vector:Point)=>void;resetKey:number}){
  const pointer=useRef<number|null>(null);
  const [knob,setKnob]=useState({x:0,y:0});
  const callback=useRef(onChange);callback.current=onChange;
  function stop(){pointer.current=null;setKnob({x:0,y:0});callback.current({x:0,y:0});}
  useEffect(()=>{stop();},[resetKey]);
  useEffect(()=>()=>callback.current({x:0,y:0}),[]);
  function move(event:PointerEvent<HTMLDivElement>){
    if(pointer.current!==event.pointerId)return;
    const rect=event.currentTarget.getBoundingClientRect(),radius=rect.width*.3;
    const dx=event.clientX-rect.left-rect.width/2,dy=event.clientY-rect.top-rect.height/2;
    const length=Math.hypot(dx,dy),scale=Math.min(1,radius/Math.max(1,length));
    setKnob({x:dx*scale,y:dy*scale});callback.current(joystickVector(dx,dy,radius));
  }
  return <div className={`virtual-joystick${pointer.current!==null?' is-active':''}`} aria-label="Joystick di chuyển" role="group"
    onPointerDown={event=>{if(pointer.current!==null)return;event.preventDefault();event.stopPropagation();pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);move(event);}}
    onPointerMove={move} onPointerUp={event=>{if(pointer.current===event.pointerId)stop();}} onPointerCancel={stop} onLostPointerCapture={stop}>
    <span className="joystick-cross" aria-hidden="true">✥</span><span className="joystick-knob" style={{transform:`translate(${knob.x}px,${knob.y}px)`}} aria-hidden="true" />
  </div>;
}
