import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const movementMode=process.argv.includes('--movement');
const output=path.join(root,'output',movementMode?'movement-layout-check':'village-layout-check');
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4181','--strictPort'],{cwd:path.join(root,'client'),windowsHide:true,stdio:'ignore'});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9239',`--user-data-dir=${path.join(output,'chrome-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket,call;
try{
  let targets;
  for(let n=0;n<60;n++){
    try{await fetch('http://127.0.0.1:4181');targets=await fetch('http://127.0.0.1:9239/json').then(r=>r.json());if(targets.some(t=>t.type==='page'))break;}catch{}
    await pause(250);
  }
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let id=0;const pending=new Map();
  socket.onmessage=event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
  call=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const waitFor=async selector=>{for(let n=0;n<80;n++){if(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`))return;await pause(100);}throw Error(`Missing ${selector}`);};
  const settle=()=>evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const shot=async name=>{const r=await call('Page.captureScreenshot',{captureBeyondViewport:false});await writeFile(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
  await call('Page.enable');
  await call('Page.addScriptToEvaluateOnNewDocument',{source:"if(location.hostname==='127.0.0.1')localStorage.clear();"});
  await call('Network.setBypassServiceWorker',{bypass:true});
  await call('Network.setCacheDisabled',{cacheDisabled:true});
  await call('Page.navigate',{url:'http://127.0.0.1:4181'});
  await waitFor('.sv-title-menu button');
  await evaluate("document.querySelector('.sv-title-menu button').click()");
  await waitFor('.creation-form');
  await evaluate(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;const name=document.querySelector('#creation-name');set.call(name,'Út Mận');name.dispatchEvent(new Event('input',{bubbles:true}));const promo=document.querySelector('#creation-promo');set.call(promo,'CODEX500');promo.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  if(process.argv.includes('--stuck'))await evaluate("localStorage.setItem('su-viet-hanh-trinh-world-position-hai-ba-trung',JSON.stringify({x:220,y:710}))");
  await settle();await evaluate("document.querySelector('.creation-form').requestSubmit()");
  await waitFor('.village-map-nav');
  if(process.argv.includes('--stuck')){
    await call('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});await settle();
    const recovered=await evaluate("(()=>{const p=document.querySelector('[data-testid=world-player]');return{x:+p.dataset.x,y:+p.dataset.y};})()");
    if(recovered.x===220&&recovered.y===710)throw Error('Saved player remains trapped in house');
    const destination=await evaluate("(()=>{const svg=document.querySelector('.neighborhood-svg'),r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal;return{x:r.x+(400-v.x)/v.width*r.width,y:r.y+(680-v.y)/v.height*r.height};})()");
    await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...destination});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...destination});await pause(2000);
    const reached=await evaluate("(()=>{const p=document.querySelector('[data-testid=world-player]');return{x:+p.dataset.x,y:+p.dataset.y};})()");
    if(Math.hypot(reached.x-400,reached.y-680)>5)throw Error('Recovered player cannot walk '+JSON.stringify({recovered,reached}));
    await writeFile(path.join(output,'stuck-recovery.json'),JSON.stringify({saved:{x:220,y:710},recovered,reached},null,2));
    await evaluate("document.querySelector('.map-control-bar button').click()");await settle();
  }
  if(movementMode){
    await call('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:1,mobile:false});await settle();
    await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
    const position=()=>evaluate("(()=>{const p=document.querySelector('[data-testid=world-player]');return {x:+p.dataset.x,y:+p.dataset.y};})()");
    const touch=async(type,points=[])=>{await call('Input.dispatchTouchEvent',{type,touchPoints:points});await settle();};
    await touch('touchStart',[{id:1,x:12,y:250}]);await touch('touchCancel');
    await waitFor('.virtual-joystick');
    const joy=await evaluate("(()=>{const r=document.querySelector('.virtual-joystick').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
    const start=await position();
    await touch('touchStart',[{id:1,...joy}]);await touch('touchMove',[{id:1,x:joy.x+32,y:joy.y}]);await pause(400);await touch('touchEnd');
    const moved=await position();if(moved.x-start.x<10)throw Error('Joystick did not move player '+JSON.stringify({start,moved}));
    await pause(100);const stopped=await position();await pause(250);if(JSON.stringify(stopped)!==JSON.stringify(await position()))throw Error('Player kept moving after joystick release');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA'});await pause(250);await call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA'});await settle();
    if(await evaluate("!!document.querySelector('.virtual-joystick')"))throw Error('Keyboard did not hide joystick');
    if((await position()).x>=stopped.x)throw Error('Keyboard did not move player');
    await touch('touchStart',[{id:1,x:12,y:250}]);await touch('touchCancel');await waitFor('.virtual-joystick');
    const tapPoint=await evaluate(`(()=>{const svg=document.querySelector('.neighborhood-svg'),r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal,p=document.querySelector('[data-testid=world-player]');for(const [dx,dy]of [[0,65],[-65,0],[65,0],[0,-65]]){const world={x:+p.dataset.x+dx,y:+p.dataset.y+dy},x=r.left+(world.x-v.x)/v.width*r.width,y=r.top+(world.y-v.y)/v.height*r.height,el=document.elementFromPoint(x,y);if(el?.closest('.neighborhood-svg')&&!el.closest('[role="button"]'))return{x,y,world};}return null;})()`);
    if(!tapPoint)throw Error('No tap target');
    await touch('touchStart',[{id:1,x:tapPoint.x,y:tapPoint.y}]);await touch('touchEnd');await pause(900);
    const reached=await position();if(Math.hypot(reached.x-tapPoint.world.x,reached.y-tapPoint.world.y)>5)throw Error('Tap destination not reached '+JSON.stringify({tapPoint,reached}));
    await evaluate("localStorage.setItem('xom-nha-la-tap-to-move','off');window.dispatchEvent(new Event('xom-nha-la-controls-changed'))");await settle();
    const noTap=await position();await touch('touchStart',[{id:1,x:tapPoint.x+25,y:tapPoint.y}]);await touch('touchEnd');await pause(250);
    if(JSON.stringify(noTap)!==JSON.stringify(await position()))throw Error('Disabled tap movement still moves player');
    await evaluate("localStorage.setItem('xom-nha-la-tap-to-move','on');window.dispatchEvent(new Event('xom-nha-la-controls-changed'))");await settle();
    const joy2=await evaluate("(()=>{const r=document.querySelector('.virtual-joystick').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
    await touch('touchStart',[{id:1,...joy2}]);await touch('touchMove',[{id:1,x:joy2.x+30,y:joy2.y}]);await pause(100);await touch('touchCancel');await pause(100);const cancelled=await position();await pause(200);
    if(JSON.stringify(cancelled)!==JSON.stringify(await position()))throw Error('Pointer cancel did not stop player');
    await touch('touchStart',[{id:1,...joy2}]);await touch('touchMove',[{id:1,x:joy2.x+30,y:joy2.y}]);
    await evaluate("document.querySelector('.village-map-nav button').click()");await touch('touchCancel');await waitFor('.village-modal');
    const modalPosition=await position();await pause(200);if(JSON.stringify(modalPosition)!==JSON.stringify(await position()))throw Error('Player moves under modal');
    await evaluate("document.querySelector('.village-modal .location-panel-close').click()");await settle();await pause(200);
    if(JSON.stringify(modalPosition)!==JSON.stringify(await position()))throw Error('Movement resumed after closing modal');
    await call('Emulation.setTouchEmulationEnabled',{enabled:false});
    await evaluate("localStorage.setItem('xom-nha-la-tap-to-move','off');window.dispatchEvent(new Event('xom-nha-la-controls-changed'))");await settle();
    const mousePoint=await evaluate(`(()=>{const svg=document.querySelector('.neighborhood-svg'),r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal,p=document.querySelector('[data-testid=world-player]');for(const [dx,dy]of [[-60,0],[0,60],[60,0]]){const world={x:+p.dataset.x+dx,y:+p.dataset.y+dy},x=r.left+(world.x-v.x)/v.width*r.width,y=r.top+(world.y-v.y)/v.height*r.height,el=document.elementFromPoint(x,y);if(el?.closest('.neighborhood-svg')&&!el.closest('[role="button"]'))return{x,y,world};}return null;})()`);
    if(!mousePoint)throw Error('No mouse destination');
    await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:mousePoint.x,y:mousePoint.y});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:mousePoint.x,y:mousePoint.y});await pause(900);
    const mouseReached=await position();if(Math.hypot(mouseReached.x-mousePoint.world.x,mouseReached.y-mousePoint.world.y)>5)throw Error('Mouse destination not reached '+JSON.stringify({mousePoint,mouseReached}));
    if(await evaluate("!!document.querySelector('.map-directions')"))throw Error('Old movement buttons still exist');
    await evaluate("localStorage.setItem('xom-nha-la-tap-to-move','on');window.dispatchEvent(new Event('xom-nha-la-controls-changed'))");
    await writeFile(path.join(output,'movement.json'),JSON.stringify({joystick:true,releaseStops:true,keyboardHidesJoystick:true,tapToMove:true,tapSetting:true,cancelStops:true,modalStops:true},null,2));
  }
  const report=[];
  for(const [width,height] of [[360,800],[393,852],[412,915],[852,393],[1280,800],[1024,768],[768,1024],[1920,1080],[2560,1440],[3440,1440]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await settle();
    if(movementMode){
      await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
      await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:5,y:200}]});
      await call('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await settle();
      const controls=await evaluate(`(()=>{const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const joy=rect(document.querySelector('.virtual-joystick')),nav=rect(document.querySelector('.village-map-nav')),actions=rect(document.querySelector('.touch-action-buttons'));const overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.x,b.x)&&Math.min(a.bottom,b.bottom)>Math.max(a.y,b.y);return{joy,actions,overlap:overlap(joy,nav)||overlap(actions,nav)||overlap(joy,actions)};})()`);
      if(controls.overlap||controls.joy.x<0||controls.joy.bottom>height||controls.actions.right>width)throw Error('Touch control layout '+JSON.stringify(controls));
    }
    if(movementMode){
      await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
      await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:5,y:200}]});
      await call('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await settle();
      const controls=await evaluate(`(()=>{const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const joy=rect(document.querySelector('.virtual-joystick')),nav=rect(document.querySelector('.village-map-nav')),actions=rect(document.querySelector('.touch-action-buttons'));const overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.x,b.x)&&Math.min(a.bottom,b.bottom)>Math.max(a.y,b.y);return{joy,actions,overlap:overlap(joy,nav)||overlap(actions,nav)||overlap(joy,actions)};})()`);
      if(controls.overlap||controls.joy.x<0||controls.joy.bottom>height||controls.actions.right>width)throw Error('Touch control layout '+JSON.stringify(controls));
    }
    const map=await evaluate(`(()=>{const nav=document.querySelector('.village-map-nav').getBoundingClientRect();const world=document.querySelector('.world-map-viewport').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,navFraction:nav.width*nav.height/(innerWidth*innerHeight),world:[world.width,world.height],nav:[nav.left,nav.top,nav.right,nav.bottom]};})()`);
    if(map.overflow||map.navFraction>.25||map.nav[0]<0||map.nav[2]>width||map.nav[3]>height)throw Error('Map layout '+JSON.stringify(map));
    if(width===393||width===1920||width===852)await shot(`map-${width}x${height}`);
    const before=await evaluate("document.querySelector('.neighborhood-svg').getAttribute('viewBox')");
    await evaluate("document.querySelector('[aria-label=\"Phóng to bản đồ\"]').click()");await settle();
    const after=await evaluate("document.querySelector('.neighborhood-svg').getAttribute('viewBox')");
    if(before===after)throw Error('Zoom did not change camera');
    await evaluate("document.querySelector('[aria-label=\"Theo nhân vật\"]').click()");await settle();
    const dragPoint=await evaluate(`(()=>{for(const fx of [.45,.55,.65])for(const fy of [.4,.5,.6]){const x=innerWidth*fx,y=innerHeight*fy;const el=document.elementFromPoint(x,y);if(el?.closest('.neighborhood-svg')&&!el.closest('[role="button"]'))return{x,y};}return null;})()`);
    if(dragPoint){
      const beforeDrag=await evaluate("document.querySelector('.neighborhood-svg').getAttribute('viewBox')");
      await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...dragPoint});
      await call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:dragPoint.x-35,y:dragPoint.y-25});
      await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:dragPoint.x-35,y:dragPoint.y-25});await settle();
      const afterDrag=await evaluate("document.querySelector('.neighborhood-svg').getAttribute('viewBox')");
      if(beforeDrag===afterDrag)throw Error('Drag did not change camera');
    }
    if(width===393){
      await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
      const point=await evaluate(`(()=>{for(const fx of [.4,.5,.6])for(const fy of [.4,.5,.6]){const x=innerWidth*fx,y=innerHeight*fy;const points=[document.elementFromPoint(x-15,y),document.elementFromPoint(x+15,y)];if(points.every(el=>el?.closest('.neighborhood-svg')&&!el.closest('[role="button"]')))return{x,y};}return null;})()`);
      if(!point)throw Error('No space to test pinch');
      const oldBox=await evaluate("document.querySelector('.neighborhood-svg').getAttribute('viewBox')");
      await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:point.x-15,y:point.y},{id:2,x:point.x+15,y:point.y}]});
      await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:point.x-30,y:point.y},{id:2,x:point.x+30,y:point.y}]});
      await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle();
      if(oldBox===await evaluate("document.querySelector('.neighborhood-svg').getAttribute('viewBox')"))throw Error('Pinch did not change camera');
      await call('Emulation.setTouchEmulationEnabled',{enabled:false});
      await evaluate("document.querySelector('[aria-label=\"Theo nhân vật\"]').click()");await settle();
    }
    await evaluate("document.querySelector('.village-map-nav button').click()");await waitFor('.village-modal');await settle();
    const shop=await evaluate(`(()=>{const panel=document.querySelector('.village-modal'),content=panel.querySelector('.location-panel-content'),r=panel.getBoundingClientRect();return {bounds:[r.left,r.top,r.right,r.bottom],overflow:content.scrollWidth>content.clientWidth+1,hitHeight:Math.min(...[...panel.querySelectorAll('button,input,select')].filter(el=>el.checkVisibility()).map(el=>el.getBoundingClientRect().height))};})()`);
    if(shop.overflow||shop.bounds[0]<0||shop.bounds[1]<0||shop.bounds[2]>width||shop.bounds[3]>height||shop.hitHeight<44)throw Error('Shop layout '+JSON.stringify(shop));
    if(width===360){
      await evaluate(`(()=>{const input=document.querySelector('.village-shop input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Tóc tết hai bên');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await settle();
      await evaluate("document.querySelector('[aria-label=\"Mua · Tóc tết hai bên\"]').click()");await settle();
      await evaluate("[...document.querySelectorAll('.village-purchase-confirm button')].find(b=>b.textContent==='Xác nhận mua').click()");await settle();
      const coins=await evaluate("JSON.parse(localStorage.getItem('su-viet-hanh-trinh-progress-v1')).gold");
      if(coins!==9970)throw Error('Browser purchase balance '+coins);
      await evaluate("document.querySelector('[aria-label=\"Trang bị · Tóc tết hai bên\"]').click()");await settle();
      const equipped=await evaluate("JSON.parse(localStorage.getItem('su-viet-hanh-trinh-character-v1')).customization.equipped.hair");
      if(equipped!=='hair-braid')throw Error('Browser equip failed');
    }
    if(width===393||width===1920||width===852)await shot(`shop-${width}x${height}`);
    await evaluate("document.querySelector('.village-modal').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");await settle();
    if(await evaluate("!!document.querySelector('.village-modal')"))throw Error('Escape did not close shop');
    report.push({viewport:[width,height],map,shop,zoom:true,drag:!!dragPoint});
  }
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(call){try{await call('Browser.close');}catch{}}socket?.close();chrome.kill();server.kill();}
