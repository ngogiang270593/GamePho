import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'output', 'character-layout-check');
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4179', '--strictPort'], { cwd: path.join(root, 'client'), windowsHide: true, stdio: 'ignore' });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9237', `--user-data-dir=${path.join(output, 'chrome-profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let call;
try {
  let targets;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch('http://127.0.0.1:4179').then(r => { if (!r.ok) throw Error('server'); });
      targets = await fetch('http://127.0.0.1:9237/json').then(r => r.json());
      if (targets.some(target => target.type === 'page')) break;
    } catch {}
    await pause(250);
  }
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  };
  call = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  await call('Page.enable');
  await call('Page.navigate', { url: 'http://127.0.0.1:4179' });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await evaluate("!!document.querySelector('.sv-title-menu button')")) break;
    await pause(100);
  }
  await evaluate("document.querySelector('.sv-title-menu button').click()");
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await evaluate("!!document.querySelector('.creation-form')")) break;
    await pause(100);
  }
  const sizes = [[360,800], [393,852], [412,915], [852,393], [1280,800], [1024,768], [768,1024], [1920,1080], [2560,1440], [3440,1440]];
  const report = [];
  for (const [width, height] of sizes) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    const metrics = await evaluate(`(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; };
      const form = document.querySelector('.creation-form');
      const controls = [...form.querySelectorAll('button, input, select')].filter(el => el.checkVisibility());
      const elements = controls.map(rect);
      const overlap = elements.some((a, i) => elements.slice(i+1).some(b => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
      const overlaps = controls.flatMap((el,i)=>controls.slice(i+1).filter(other=>{const a=rect(el),b=rect(other);return Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;}).map(other=>[el.getAttribute('aria-label') || el.textContent,other.getAttribute('aria-label') || other.textContent]));
      return { viewport:[innerWidth,innerHeight], overflow:document.documentElement.scrollWidth>innerWidth, overlap, overlaps, form:rect(form), minHitHeight:Math.min(...elements.map(r=>r.height)), preview:rect(document.querySelector('.creation-model')) };
    })()`);
    report.push(metrics);
    if (metrics.overflow || metrics.overlap || metrics.minHitHeight < 44) throw Error(`Layout failure ${JSON.stringify(metrics)}`);
    if (width === 393 || width === 1920 || width === 852 || width === 1024) {
      const screenshot = await call('Page.captureScreenshot', { captureBeyondViewport: true });
      await writeFile(path.join(output, `${width}x${height}.png`), Buffer.from(screenshot.data, 'base64'));
    }
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  if (call) { try { await call('Browser.close'); } catch {} }
  socket?.close(); chrome.kill(); server.kill();
}
