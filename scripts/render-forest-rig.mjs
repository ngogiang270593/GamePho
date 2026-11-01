import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(new URL('../client/package.json', import.meta.url));
const sharp = require('sharp');
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'output/forest-rig-v2');
const assets = path.join(root, 'client/assets/characters/forest-keeper/rig-v2');
await mkdir(output, { recursive: true }); await mkdir(assets, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4195', '--strictPort'], { cwd: path.join(root, 'client'), windowsHide: true, stdio: 'ignore' });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9255', `--user-data-dir=${path.join(output, 'chrome-profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket, call;
try {
  let targets;
  for (let i = 0; i < 60; i++) {
    try {
      await fetch('http://127.0.0.1:4195', { signal: AbortSignal.timeout(1000) });
      targets = await fetch('http://127.0.0.1:9255/json', { signal: AbortSignal.timeout(1000) }).then(r => r.json());
      if (targets.some(t => t.type === 'page')) break;
    } catch {}
    await pause(200);
  }
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map();
  socket.onmessage = event => { const r = JSON.parse(event.data), p = pending.get(r.id); if (p) { pending.delete(r.id); r.error ? p.reject(Error(JSON.stringify(r.error))) : p.resolve(r.result); } };
  call = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value;
  };
  await call('Page.enable');
  await call('Page.navigate', { url: 'http://127.0.0.1:4195/scripts/forest-rig-preview.html' });
  let ready = false;
  for (let i = 0; i < 120; i++) { ready = await evaluate('Boolean(window.forestReady)'); if (ready) break; await pause(200); }
  if (!ready) throw Error('3D renderer did not initialize');
  const preview = [], report = {};
  for (const gender of ['male', 'female']) {
    await evaluate(`forestStudio.setGender('${gender}')`);
    for (const [name, angle] of [['front', 0], ['right', Math.PI / 2], ['back', Math.PI]]) {
      const data = await evaluate(`forestStudio.render('idle',0,${angle})`);
      const png = Buffer.from(data.split(',')[1], 'base64');
      await writeFile(path.join(output, `${gender}-${name}.png`), png);
      preview.push({ input: await sharp(png).flatten({ background: '#e7e9ce' }).png().toBuffer(), left: ['front', 'right', 'back'].indexOf(name) * 256, top: gender === 'male' ? 0 : 320 });
    }
    if (process.argv.includes('--preview')) continue;
    report[gender] = {};
    for (const action of ['idle', 'walk', 'run', 'jump', 'turn']) {
      const frames = action === 'idle' ? 1 : action === 'turn' ? 16 : 12;
      const rows = action === 'turn' ? 1 : 4;
      const panels = [];
      for (let row = 0; row < rows; row++) {
        for (let frame = 0; frame < frames; frame++) {
          const phase = frame / frames;
          const heading = action === 'turn' ? phase * Math.PI * 2 : [0, Math.PI / 2, Math.PI, -Math.PI / 2][row];
          const data = await evaluate(`forestStudio.render('${action}',${phase},${heading})`);
          panels.push({ input: Buffer.from(data.split(',')[1], 'base64'), left: frame * 256, top: row * 320 });
        }
      }
      const target = path.join(assets, `${gender}-${action}.webp`);
      await sharp({ create: { width: frames * 256, height: rows * 320, channels: 4, background: '#00000000' } }).composite(panels).webp({ quality: 92, alphaQuality: 100, effort: 4 }).toFile(target);
      report[gender][action] = { frames, rows, frameWidth: 256, frameHeight: 320, path: path.relative(root, target) };
      console.log(`${gender}/${action}: ${frames * rows} frames`);
    }
  }
  await sharp({ create: { width: 768, height: 640, channels: 4, background: '#e7e9ce' } }).composite(preview).png().toFile(path.join(output, 'character-comparison.png'));
  await writeFile(path.join(output, 'render-report.json'), JSON.stringify(report, null, 2));
} finally {
  if (call) { try { await call('Browser.close'); } catch {} }
  socket?.close(); chrome.kill(); server.kill();
}
