import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'output', 'forest-outfit');
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186', '--strictPort'], { cwd: path.join(root, 'client'), windowsHide: true, stdio: 'ignore' });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9246', `--user-data-dir=${path.join(output, 'chrome-profile-v2')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let call;
try {
  let targets;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch('http://127.0.0.1:4186', { signal: AbortSignal.timeout(1000) }).then(r => { if (!r.ok) throw Error('server'); });
      targets = await fetch('http://127.0.0.1:9246/json', { signal: AbortSignal.timeout(1000) }).then(r => r.json());
      if (targets.some(t => t.type === 'page')) break;
    } catch {}
    await pause(250);
  }
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (request) { pending.delete(message.id); message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result); }
  };
  call = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'http://127.0.0.1:4186' });
  for (let i = 0; i < 60; i++) {
    if (await evaluate("!!document.querySelector('.sv-title-menu button')")) break;
    await pause(100);
  }
  await evaluate("document.querySelector('.sv-title-menu button').click()");
  for (let i = 0; i < 60; i++) {
    if (await evaluate("!!document.querySelector('.starting-gender-picker button')")) break;
    await pause(100);
  }
  await evaluate("document.querySelector('.starting-gender-picker button').click()");
  await pause(150);
  await evaluate("document.querySelector('.starting-template-card').click()");
  await pause(350);
  const report = [];
  for (const [genderIndex, gender] of [[0, 'male'], [1, 'female']]) {
    await evaluate(`document.querySelectorAll('.starting-gender-picker button')[${genderIndex}].click()`);
    if (await evaluate("!!document.querySelector('.starting-preview-action, .starting-preview-controls button')")) throw Error('Preview must run without action buttons');
    for (const movement of ['idle', 'walk', 'turn', 'run', 'jump']) {
      let matched = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        matched = await evaluate(`document.querySelector('.starting-live-character').dataset.previewAction === '${movement}'`);
        if (matched) break;
        await pause(50);
      }
      if (!matched) throw Error(`Missing automatic phase: ${gender}/${movement}`);
      await evaluate("new Promise((resolve, reject) => { const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = document.querySelector('.starting-game-sprite image').href.baseVal; })");
      await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      const before = await evaluate("getComputedStyle(document.querySelector('.forest-action-frames')).transform");
      if (movement !== 'idle') await pause(movement === 'turn' ? 350 : movement === 'jump' ? 280 : 180);
      await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      const state = await evaluate(`(() => {
        const sprite = document.querySelector('.starting-game-sprite');
        return { gender: sprite.dataset.gender, action: sprite.dataset.previewAction, artwork: sprite.dataset.characterArtwork, images: sprite.querySelectorAll('image').length, frame: getComputedStyle(sprite.querySelector('.forest-action-frames')).transform, overflow: document.documentElement.scrollWidth > innerWidth };
      })()`);
      if (state.gender !== gender || state.action !== movement || state.artwork !== 'forest-keeper-actions-v1' || state.images !== 1 || state.overflow) throw Error(JSON.stringify(state));
      if (movement !== 'idle' && before === state.frame) {
        const detail = await evaluate(`(() => { const node = document.querySelector('.forest-action-frames'); const s = getComputedStyle(node); return { className: document.querySelector('.starting-game-sprite').getAttribute('class'), name:s.animationName, duration:s.animationDuration, playState:s.animationPlayState, hidden:document.hidden, reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, animations:node.getAnimations().map(a=>({time:a.currentTime,state:a.playState})) }; })()`);
        throw Error(`Frozen animation: ${JSON.stringify({ movement, before, state, detail })}`);
      }
      report.push({ ...state, movement });
      const shot = await call('Page.captureScreenshot', { captureBeyondViewport: false });
      await writeFile(path.join(output, `screen-${gender}-${movement}.png`), Buffer.from(shot.data, 'base64'));
    }
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 1, mobile: true });
  await evaluate('scrollTo(0,0)');
  await pause(150);
  if (await evaluate('document.documentElement.scrollWidth > innerWidth')) throw Error('Mobile horizontal overflow');
  const mobileBounds = await evaluate(`(() => {
    const bounds = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    return { stage: bounds('.starting-create-stage'), sprite: bounds('.starting-game-sprite'), controls: bounds('.starting-create-controls'), viewport: innerWidth };
  })()`);
  if (mobileBounds.sprite.bottom > mobileBounds.stage.bottom || mobileBounds.sprite.top < mobileBounds.stage.top || mobileBounds.controls.right > mobileBounds.viewport) throw Error(JSON.stringify(mobileBounds));
  const mobile = await call('Page.captureScreenshot', { captureBeyondViewport: true });
  await writeFile(path.join(output, 'screen-mobile.png'), Buffer.from(mobile.data, 'base64'));
  await writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log('Verified automatic actions without buttons, live frame changes for both genders and mobile layout.');
} finally {
  if (call) { try { await call('Browser.close'); } catch {} }
  socket?.close(); chrome.kill(); server.kill();
}
