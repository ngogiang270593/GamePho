import { createServer } from '../client/node_modules/vite/dist/node/index.js';
import React from '../client/node_modules/react/index.js';
import { renderToStaticMarkup } from '../client/node_modules/react-dom/server.node.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../client');
const output = path.resolve(root, '../output/forest-animation');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { ForestKeeperActionSprite } = await server.ssrLoadModule('/src/components/ForestKeeperActionSprite.tsx');
  const templates = { male: {}, female: {} }, images = {};
  for (const gender of ['male', 'female']) {
    for (const action of ['idle', 'walk', 'turn', 'run', 'jump']) {
      const svg = renderToStaticMarkup(React.createElement(ForestKeeperActionSprite, { gender, action }));
      const src = svg.match(/href="([^"]+)"/)[1];
      images[action] = `data:image/webp;base64,${(await readFile(path.join(root, src))).toString('base64')}`;
      templates[gender][action] = svg.replace(src, '__SPRITE__');
    }
  }
  // Idle shares the turn image; avoid duplicating its embedded bytes.
  delete images.idle;
  const css = await readFile(path.join(root, 'src/styles/character-creation.css'), 'utf8');
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chuyển động người giữ rừng</title>
<style>${css}
body{margin:0;padding:24px;background:#f7efdb;color:#4a3423;font-family:system-ui,sans-serif}main{max-width:1000px;margin:auto}h1{text-align:center;font-size:24px}main>p{text-align:center}.cards{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{border:1px solid #c5b58b;border-radius:22px;background:#e7e9ce;text-align:center}.art{height:min(70vh,600px);padding:12px}.art>svg{width:100%;height:100%}.label{margin:0 0 16px;font-weight:700}@media(max-width:600px){.cards{grid-template-columns:1fr}.art{height:420px}}@media(prefers-reduced-motion:reduce){.art *{animation:none!important}}
</style><main><h1>Người giữ rừng · Chuyển động tự động</h1><p>Đi → xoay 360° → chạy → nhảy → lặp lại</p><div class="cards"><section class="card"><div class="art" id="male"></div><p class="label">Nam</p></section><section class="card"><div class="art" id="female"></div><p class="label">Nữ</p></section></div></main>
<script>
const templates=${JSON.stringify(templates)}, images=${JSON.stringify(images)};
const phases=[['idle',600],['walk',3200],['turn',2400],['run',2800],['jump',1200]];
let step=0,timer;
function paint(){const action=phases[step][0];for(const gender of ['male','female']) document.getElementById(gender).innerHTML=templates[gender][action].replace('__SPRITE__',images[action==='idle'?'turn':action]);}
function play(){clearTimeout(timer);paint();if(!document.hidden&&!matchMedia('(prefers-reduced-motion:reduce)').matches)timer=setTimeout(()=>{step=(step+1)%phases.length;play()},phases[step][1]);}
Promise.all(Object.values(images).map(src=>{const img=new Image();img.src=src;return img.decode()})).then(play);
document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)play()});
</script></html>`;
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'preview.html'), html);
  console.log(path.join(output, 'preview.html'));
} finally { await server.close(); }
