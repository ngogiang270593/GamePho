import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const sharp = createRequire(import.meta.url)('../client/node_modules/sharp');
const output = path.join(root, 'output/eight-frame-designer');
const manifestPath = path.join(root, 'client/src/game/characterSpriteSheets.json');
const assetDirectory = path.join(root, 'client/public/assets/character-designer');
await mkdir(output, { recursive: true });
const originalManifest = await readFile(manifestPath);
const originalAssets = new Set(await readdir(assetDirectory).catch(() => []));
const files = {};
for (const [row, facing] of ['down', 'right', 'up', 'left'].entries()) {
  files[facing] = [];
  for (let frame = 0; frame < 8; frame++) {
    const file = path.join(output, `${facing}-${frame + 1}.png`);
    await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 30 + frame * 25, g: 50 + row * 55, b: 100, alpha: 1 } } }).png().toFile(file);
    files[facing].push(file);
  }
}
const port = 9243;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join(output, 'chrome-profile')}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket, call, sourceWritten = false, createdSourceAsset;
const report = {};
try {
  let targets;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { targets = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json()); if (targets.some(t => t.type === 'page')) break; } catch {}
    await pause(150);
  }
  assert(targets?.length, 'Chrome did not start');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data), request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(Error(JSON.stringify(message.error))); else request.resolve(message.result);
  };
  call = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw Error('Timed out: ' + expression + '\n' + await evaluate('document.body.innerText.slice(0,8000)'));
  };
  const click = label => evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);
  const upload = async (label, images) => {
    const doc = await call('DOM.getDocument');
    const input = await call('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `input[aria-label="${label}"]` });
    await call('DOM.setFileInputFiles', { nodeId: input.nodeId, files: images });
    await pause(100);
  };
  const stage = 'document.querySelector(".sprite-editor__stage .sprite-sheet-character")';
  const map = 'document.querySelector("#character-designer-map .opening-map")';
  const playerPoint = 'document.querySelector("#character-designer-map .opening-map-player")';
  const player = 'document.querySelector("#character-designer-map .opening-map-player__sprite.sprite-sheet-character")';
  const config = 'JSON.parse(document.querySelector(".sprite-editor__source pre").textContent).sheet';
  const saveDisabled = 'Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Lưu và áp dụng vào game").disabled';
  await call('Page.enable');
  await call('Storage.clearDataForOrigin', { origin: 'http://127.0.0.1:5173', storageTypes: 'indexeddb,local_storage' });
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'http://127.0.0.1:5173/debug/character-designer' });
  await waitFor(`!!document.querySelector('input[aria-label="Nhập ảnh sprite"]')`);
  await waitFor(`!!${map}?.querySelector('.opening-map-minimap')`);
  assert(await evaluate(`${map}.classList.contains('opening-map--embedded')`));
  assert.equal(await evaluate(`${map}.querySelector('#opening-map-artwork image').getAttribute('href')`), '/assets/maps/thon-que-watercolor.png');
  assert.equal(await evaluate('!!document.querySelector("#character-designer-map .world-map, #character-designer-map select")'), false);
  const mapLayout = await evaluate(`(()=>{const map=document.querySelector('#character-designer-map').getBoundingClientRect(),editor=document.querySelector('.sprite-editor__layout').getBoundingClientRect();return {below:map.top>=editor.bottom-1,width:map.width,editorWidth:editor.width}})()`);
  assert(mapLayout.below && mapLayout.width >= mapLayout.editorWidth * .99);
  report.wideCurrentGameMapBelowEditor = true;
  await evaluate(`${map}.querySelector('[data-npc-id="memory-keeper"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
  await waitFor(`!!${map}.querySelector('[role=dialog] .opening-map-dialog__mission')`);
  await evaluate(`${map}.querySelector('button[aria-label="Đóng trò chuyện"]').click()`);
  await evaluate(`${map}.querySelector('button[aria-label="Ẩn bản đồ nhỏ"]').click()`);
  await waitFor(`!${map}.querySelector('.opening-map-minimap')`);
  await evaluate(`${map}.querySelector('button[aria-label="Hiện bản đồ nhỏ"]').click()`);
  await waitFor(`!!${map}.querySelector('.opening-map-minimap')`);
  report.newMapNpcDialogueAndMinimap = true;
  await upload('Nhập ảnh sprite', [path.resolve(process.argv.slice(2).find(argument => !argument.startsWith('--')) ?? 'C:/Users/Ngo Giang/Downloads/Frame Người giữ rừng nam đang đi bộ, PNG RGBA 256x256.png')]);
  await waitFor('document.querySelector("[data-testid=action-frame-count]").textContent==="1/8 frame"');
  assert(await evaluate(saveDisabled));
  assert.deepEqual(await evaluate(`[+${stage}.querySelector('image').getAttribute('width'),+${stage}.querySelector('image').getAttribute('height')]`), [256, 256]);
  report.singleImageIsFullFrameAndIncomplete = true;
  await click('Lưu bản nháp');
  await waitFor('document.querySelector("[role=status]")?.textContent.includes("Đã lưu bản nháp")');
  await call('Page.reload'); await pause(400);
  await waitFor('document.querySelector("[data-testid=action-frame-count]")?.textContent==="1/8 frame"');
  assert.deepEqual(await evaluate(`[+${stage}.querySelector('image').getAttribute('width'),+${stage}.querySelector('image').getAttribute('height')]`), [256, 256]);
  report.partialDraftRestoresAfterReload = true;
  await upload('Nhập frame hành động', files.down.slice(0, 4));
  await waitFor('!!document.querySelector("[role=alert]")');
  await evaluate('Array.from(document.querySelectorAll("label")).find(l=>l.textContent.includes("Nhập 4 tư thế rồi lặp")).querySelector("input").click()');
  await upload('Nhập frame hành động', files.down.slice(0, 4));
  await waitFor('document.querySelector("[data-testid=action-frame-count]").textContent==="8/8 frame"');
  const names = await evaluate('Array.from(document.querySelectorAll(".sprite-editor__slot img")).map(i=>i.src)');
  assert.equal(names.length, 8);
  assert.deepEqual(names.slice(0, 4), names.slice(4));
  assert.equal(await evaluate(saveDisabled), false, 'A completed direction can be saved independently');
  report.explicitFourPoseRepeat = true;
  await click('Lưu và áp dụng vào game');
  await waitFor('document.querySelector("[role=status]")?.textContent.includes("Đã lưu và áp dụng")');
  await click('↑ W · Sau / quay lưng');
  for (let slot = 1; slot <= 8; slot++) {
    await waitFor('!document.querySelector(\'input[aria-label="Nhập frame hành động"]\').disabled');
    const remove = `document.querySelector('button[aria-label="Xóa frame ${slot}"]')`;
    if (await evaluate(`${remove}.disabled`)) continue;
    const filled = await evaluate('document.querySelectorAll(".sprite-editor__slot.is-filled").length');
    await evaluate(`${remove}.click()`);
    await waitFor(`${remove}.disabled && document.querySelector('[data-testid=action-frame-count]').textContent==='${filled - 1}/8 frame' && !document.querySelector('input[aria-label="Nhập frame hành động"]').disabled`);
  }
  await upload('Ảnh frame 1', [files.up[0]]);
  await waitFor('document.querySelector("[data-testid=action-frame-count]").textContent==="1/8 frame"');
  await click('↓ S · Trước');
  await waitFor(`!(${saveDisabled})`);
  await click('Lưu và áp dụng vào game');
  await waitFor('document.querySelector("[role=status]")?.textContent.includes("Đã lưu và áp dụng")');
  await call('Page.reload'); await pause(400);
  await waitFor('document.querySelector("[data-testid=action-frame-count]")?.textContent==="8/8 frame"');
  await click('↑ W · Sau / quay lưng');
  await waitFor('document.querySelector("[data-testid=action-frame-count]").textContent==="1/8 frame"');
  report.saveCompletedDirectionKeepsOtherDrafts = true;
  for (const [facing, label] of [['down', '↓ S · Trước'], ['right', '→ D · Phải'], ['up', '↑ W · Sau / quay lưng'], ['left', '← A · Trái']]) {
    await click(label);
    await upload('Nhập frame hành động', [...files[facing]].reverse());
    await waitFor(`document.querySelector('[role=status]')?.textContent.includes('Đã ghép đủ 8 frame') && ${config}.clips.walk.directions.${facing}.count===8`);
    const order = await evaluate('Array.from(document.querySelectorAll(".sprite-editor__slot small")).map(el=>el.textContent)');
    assert(order.every((name, index) => name.endsWith(`${facing}-${index + 1}.png`)));
  }
  await waitFor(`!(${saveDisabled})`);
  const before = await evaluate(`${stage}.dataset.frame`); await pause(160);
  assert.notEqual(await evaluate(`${stage}.dataset.frame`), before);
  await click('Tạm dừng');
  const paused = await evaluate(`${stage}.dataset.frame`); await pause(300);
  assert.equal(await evaluate(`${stage}.dataset.frame`), paused);
  await click('Phát animation');
  const ranges = await evaluate(`${config}.clips.walk.directions`);
  const mapKeys = [['ArrowUp', 'up', 38], ['ArrowDown', 'down', 40], ['ArrowLeft', 'left', 37], ['ArrowRight', 'right', 39]];
  report.mapDirections = {};
  for (const [key, facing, code] of mapKeys) {
    await evaluate(`${map}.focus({preventScroll:true})`);
    const axis = facing === 'up' || facing === 'down' ? 'playerY' : 'playerX';
    const sign = facing === 'up' || facing === 'left' ? -1 : 1;
    const start = Number(await evaluate(`${playerPoint}.dataset.${axis}`));
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code });
    await waitFor(`${player}?.dataset.facing==='${facing}' && ${player}?.dataset.locomotion==='walk'`);
    await waitFor(`(Number(${playerPoint}.dataset.${axis})-${start})*${sign}>=2`);
    const frame = Number(await evaluate(`${player}.dataset.frame`));
    assert(frame >= ranges[facing].start && frame < ranges[facing].start + 8);
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code });
    await waitFor(`${player}?.dataset.locomotion==='idle' && ${player}?.dataset.facing==='${facing}'`);
    const idle = await evaluate(`${config}.clips.idle.directions.${facing}`);
    const stoppedFrame = Number(await evaluate(`${player}.dataset.frame`));
    assert(stoppedFrame >= idle.start && stoppedFrame < idle.start + idle.count, 'Stopped sprite must use the idle range for ' + facing);
    report.mapDirections[facing] = true;
  }
  report.walkAndStopFollowRealInput = true;
  await evaluate('document.querySelector("#character-designer-map input[type=checkbox]").click()');
  await waitFor(`${player}?.dataset.locomotion==='walk' && ${player}?.dataset.facing==='left'`);
  const previewPosition = await evaluate(`[${playerPoint}.dataset.playerX,${playerPoint}.dataset.playerY]`);
  await evaluate(`${map}.focus({preventScroll:true})`);
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await pause(160);
  assert.deepEqual(await evaluate(`[${playerPoint}.dataset.playerX,${playerPoint}.dataset.playerY]`), previewPosition);
  assert.equal(await evaluate(`${player}.dataset.facing`), 'left');
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await evaluate('document.querySelector("#character-designer-map input[type=checkbox]").click()');
  await waitFor(`${player}?.dataset.locomotion==='idle'`);
  report.previewMotionDoesNotMovePlayer = true;
  await click('Đặt lại vị trí thử');
  await waitFor(`${playerPoint}?.dataset.playerX==='700' && ${playerPoint}?.dataset.playerY==='640'`);
  report.previewPositionResets = true;
  await click('Lưu và áp dụng vào game');
  await waitFor('document.querySelector("[role=status]")?.textContent.includes("Đã lưu và áp dụng")');
  await call('Page.reload'); await pause(400);
  await waitFor(`${stage} && ${config}.clips.walk.directions.up.count===8`);
  report.reloadRestoresAllDirections = true;
  if (process.argv.includes('--save-source')) {
    await click('Ghi ảnh + hành động vào source');
    await waitFor('document.querySelector("[role=status]")?.textContent.includes("Đã ghi ảnh và hành động")');
    sourceWritten = true;
    const saved = JSON.parse(await readFile(manifestPath, 'utf8'))['forest-keeper:male'];
    createdSourceAsset = path.basename(saved.src);
    assert.equal(saved.movementFrameCount, 8);
    assert(Object.values(saved.clips.walk.directions).every(range => range.count === 8));
    report.sourcePreservesAllDirections = true;
    await evaluate(`new Promise((resolve,reject)=>{localStorage.removeItem('xnl-character-sprites-v1:applied:forest-keeper:male');localStorage.removeItem('xnl-character-sprites-v1:draft:forest-keeper:male');const r=indexedDB.open('xnl-character-sprites-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,t=db.transaction('sheets','readwrite');t.objectStore('sheets').delete('applied:forest-keeper:male');t.objectStore('sheets').delete('draft:forest-keeper:male');t.oncomplete=()=>{db.close();resolve(true)};t.onerror=()=>reject(t.error)}})`);
    await call('Page.reload'); await pause(400);
    await waitFor(`${stage} && ${config}.clips.walk.directions.up.count===8`);
    assert(await evaluate(`${stage}.querySelector('image').getAttribute('href').startsWith('/assets/character-designer/')`));
    report.sourceWorksWithoutBrowserOverride = true;
    await waitFor(`${player}?.querySelector('image').getAttribute('href')===${stage}.querySelector('image').getAttribute('href')`);
    const idle = await evaluate(`${config}.clips.idle.directions.down`);
    const stoppedFrame = Number(await evaluate(`${player}.dataset.frame`));
    assert(stoppedFrame >= idle.start && stoppedFrame < idle.start + idle.count);
  }
  for (const [width, height] of [[1440, 1100], [393, 852]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); await pause(150);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false, `Horizontal overflow at ${width}`);
    const screenshot = await call('Page.captureScreenshot', { captureBeyondViewport: true });
    await writeFile(path.join(output, `${width}x${height}.png`), Buffer.from(screenshot.data, 'base64'));
    const mapRect = await evaluate(`(()=>{const r=document.querySelector('#character-designer-map').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
    const mapScreenshot = await call('Page.captureScreenshot', { captureBeyondViewport: true, clip: mapRect });
    await writeFile(path.join(output, `map-${width}.png`), Buffer.from(mapScreenshot.data, 'base64'));
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  try { await call?.('Browser.close'); } catch {}
  socket?.close(); chrome.kill();
  if (sourceWritten || process.argv.includes('--save-source')) {
    await writeFile(manifestPath, originalManifest);
    if (createdSourceAsset && !originalAssets.has(createdSourceAsset) && /^forest-keeper-male-[0-9a-f]+\.png$/.test(createdSourceAsset)) await unlink(path.join(assetDirectory, createdSourceAsset));
  }
}
