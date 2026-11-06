import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'output', 'opening-map-check');
await mkdir(output, { recursive: true });
const port = 4183;
const debugPort = 9241;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: path.join(root, 'client'), windowsHide: true, stdio: 'ignore' });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(output, 'chrome-profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];
let socket;
let call;
try {
  let targets;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(`http://127.0.0.1:${port}`);
      targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then(response => response.json());
      if (targets.some(target => target.type === 'page')) break;
    } catch {}
    await pause(200);
  }
  if (!targets) throw Error('Preview server or Chrome did not start');
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!pending.has(message.id)) return;
    const task = pending.get(message.id);
    pending.delete(message.id);
    message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result);
  };
  call = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await pause(100);
    }
    throw Error('Timed out: ' + expression);
  };
  const settle = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  const screenshot = async name => {
    await settle();
    const result = await call('Page.captureScreenshot', { captureBeyondViewport: false });
    await writeFile(path.join(output, name + '.png'), Buffer.from(result.data, 'base64'));
  };
  const position = () => evaluate("(()=>{const p=document.querySelector('.opening-map-player');return{x:+p.dataset.playerX,y:+p.dataset.playerY};})()");
  const key = (type, keyName, code, extra = {}) => call('Input.dispatchKeyEvent', { type, key: keyName, code, ...extra });
  const click = async point => {
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', buttons: 1, clickCount: 1, ...point });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', buttons: 0, clickCount: 1, ...point });
  };
  const button = label => evaluate(`document.querySelector('[aria-label="${label}"]').click()`);
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Page.bringToFront');
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: "if(location.hostname==='127.0.0.1')localStorage.clear();" });
  await call('Network.setBypassServiceWorker', { bypass: true });
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Emulation.setDeviceMetricsOverride', { width: 1536, height: 960, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await waitFor("!!document.querySelector('.opening-map-art')");
  await settle();
  const initial = await position();
  if (initial.x !== 2160 || initial.y !== 1620) throw Error('Unexpected market spawn ' + JSON.stringify(initial));
  if (await evaluate("document.querySelectorAll('[data-npc-id]').length")) throw Error('Landscape placed NPCs');
  if (await evaluate("!!document.querySelector('image[href*=thon-que-watercolor]')")) throw Error('Old flattened map is still present');
  const animationBefore = await evaluate("document.getAnimations().map(animation=>({time:animation.currentTime,state:animation.playState}))");
  await pause(200);
  await settle();
  const animationAfter = await evaluate("document.getAnimations().map(animation=>({time:animation.currentTime,state:animation.playState}))");
  if (!animationAfter.some((animation, index) => animation.state === 'running' && animation.time > (animationBefore[index]?.time ?? 0))) throw Error('Scenery animations are not advancing ' + JSON.stringify({before:animationBefore.slice(0,3),after:animationAfter.slice(0,3),counts:[animationBefore.length,animationAfter.length]}));
  await screenshot('market-desktop');
  const cameraBefore = await evaluate("document.querySelector('.opening-map-art').getAttribute('viewBox')");
  await key('keyDown', 's', 'KeyS');
  await pause(250);
  await key('keyUp', 's', 'KeyS');
  const walked = await position();
  await key('keyDown', 'Shift', 'ShiftLeft', { modifiers: 8 });
  await key('keyDown', 's', 'KeyS', { modifiers: 8 });
  await waitFor("!!document.querySelector('.opening-map-player__sprite.is-running')");
  await pause(250);
  await key('keyUp', 's', 'KeyS', { modifiers: 8 });
  await key('keyUp', 'Shift', 'ShiftLeft');
  const ran = await position();
  if (walked.y - initial.y < 5 || ran.y - walked.y < 5) throw Error('Walk or run failed ' + JSON.stringify({ initial, walked, ran }));
  if (cameraBefore === await evaluate("document.querySelector('.opening-map-art').getAttribute('viewBox')")) throw Error('Camera does not follow player');
  const stopped = await position();
  await pause(200);
  if (JSON.stringify(stopped) !== JSON.stringify(await position())) throw Error('Keyboard release did not stop movement');
  const target = { x: 2160, y: 1880 };
  const clickPoint = await evaluate(`(()=>{const svg=document.querySelector('.opening-map-art'),p=svg.createSVGPoint();p.x=${target.x};p.y=${target.y};const point=p.matrixTransform(svg.getScreenCTM());return{x:point.x,y:point.y};})()`);
  await click(clickPoint);
  await waitFor("(()=>{const p=document.querySelector('.opening-map-player');return Math.hypot(+p.dataset.playerX-2160,+p.dataset.playerY-1880)<10;})()");
  await key('keyDown', 'm', 'KeyM');
  await key('keyUp', 'm', 'KeyM');
  await waitFor("document.querySelector('.opening-map-art').getAttribute('viewBox')==='0 0 4320 3000'");
  await screenshot('world-overview-desktop');
  if (await evaluate("document.querySelectorAll('.opening-map-area').length") !== 5) throw Error('Missing world destinations');
  await evaluate("document.querySelector('[aria-label=\"Đi đến Đồi chè phía Bắc\"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))");
  await waitFor("document.querySelector('.opening-map-art').getAttribute('viewBox')!=='0 0 4320 3000'");
  await waitFor("!!document.querySelector('.opening-map-destination')");
  await key('keyDown', 'w', 'KeyW');
  await key('keyUp', 'w', 'KeyW');
  const report = [];
  for (const [width, height] of [[1536, 960], [393, 852], [852, 393], [360, 800]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await settle();
    const layout = await evaluate(`(()=>{const rect=element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const map=rect(document.querySelector('.opening-map')),minimap=rect(document.querySelector('.opening-map-minimap')),controls=rect(document.querySelector('.opening-map-view-controls'));return{overflow:document.documentElement.scrollWidth>innerWidth,map,minimap,controls};})()`);
    if (layout.overflow || layout.map.x < 0 || layout.map.right > width + 1 || layout.map.bottom > height + 1 || layout.controls.x < 0 || layout.controls.right > width + 1) throw Error('Map layout ' + JSON.stringify({ width, height, layout }));
    await screenshot(`market-${width}x${height}`);
    const beforeZoom = await evaluate("document.querySelector('.opening-map-art').getAttribute('viewBox')");
    await button('Phóng to góc nhìn');
    await settle();
    if (beforeZoom === await evaluate("document.querySelector('.opening-map-art').getAttribute('viewBox')")) throw Error('Zoom did not change camera');
    await button('Thu nhỏ góc nhìn');
    await button('Ẩn bản đồ nhỏ');
    if (await evaluate("!!document.querySelector('.opening-map-minimap')")) throw Error('Minimap did not hide');
    await button('Hiện bản đồ nhỏ');
    if (!await evaluate("!!document.querySelector('.opening-map-minimap')")) throw Error('Minimap did not restore');
    report.push({ viewport: [width, height], layout, zoom: true, minimapToggle: true });
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 1, mobile: false });
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await settle();
  const joystick = await evaluate("(()=>{const r=document.querySelector('.virtual-joystick').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
  const touchStart = await position();
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, ...joystick }] });
  await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: joystick.x, y: joystick.y - 28 }] });
  await pause(300);
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const touchMoved = await position();
  if (touchMoved.y >= touchStart.y - 10) throw Error('Touch joystick did not move player ' + JSON.stringify({ touchStart, touchMoved, joystick }));
  await pause(200);
  if (JSON.stringify(touchMoved) !== JSON.stringify(await position())) throw Error('Touch release did not stop movement');
  await screenshot('market-mobile-touch');
  await key('keyDown', 'm', 'KeyM');
  await key('keyUp', 'm', 'KeyM');
  await waitFor("document.querySelector('.opening-map-art').getAttribute('viewBox')==='0 0 4320 3000'");
  await screenshot('world-overview-mobile');
  if (errors.length) throw Error('Browser exceptions: ' + JSON.stringify(errors));
  const result = { animationCount: animationAfter.length, spawn: initial, movement: { walked, ran, clickTarget: target, touchStart, touchMoved }, npcCount: 0, report, errors };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  if (call) { try { await call('Browser.close'); } catch {} }
  socket?.close();
  chrome.kill();
  server.kill();
}
