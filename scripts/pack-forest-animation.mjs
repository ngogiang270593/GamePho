import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(new URL('../client/package.json', import.meta.url));
const sharp = require('sharp');
const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'client/assets/characters/forest-keeper');
const output = path.join(root, 'output/forest-animation');
await mkdir(output, { recursive: true });
const report = {};

// Sprite packaging only: locate complete silhouettes, extract their original
// pixels, and give every frame a consistent transparent cell and foot baseline.
function silhouettes(data, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const boxes = [];
  for (let seed = 0; seed < seen.length; seed++) {
    if (seen[seed] || data[seed * 4 + 3] < 128) continue;
    let head = 0, tail = 1, area = 0;
    let left = width, top = height, right = 0, bottom = 0;
    queue[0] = seed; seen[seed] = 1;
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width, y = Math.floor(pixel / width);
      area++;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
      const neighbors = [x ? pixel - 1 : -1, x < width - 1 ? pixel + 1 : -1, y ? pixel - width : -1, y < height - 1 ? pixel + width : -1];
      for (const next of neighbors) {
        if (next >= 0 && !seen[next] && data[next * 4 + 3] >= 128) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    if (area > 1000) boxes.push({ left, top, right, bottom, area });
  }
  return boxes.sort((a, b) => b.area - a.area).slice(0, 16).sort((a, b) => (a.top + a.bottom) - (b.top + b.bottom));
}

for (const action of process.argv.slice(2).length ? process.argv.slice(2) : ['walk', 'turn', 'run', 'jump']) {
  const boxes = [];
  const sources = action === 'walk'
    ? ['walk-male-v1.png', 'walk-female-v1.png'].map(name => path.join(assets, name))
    : [path.join(assets, `${action}-v1.png`)];
  for (const source of sources) {
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const expected = sources.length === 2 ? 8 : 16;
    const found = silhouettes(data, info.width, info.height);
    if (found.length !== expected) throw Error(`${action}: expected ${expected} separate complete figures, found ${found.length}`);
    for (let row = 0; row < expected / 4; row++) {
      boxes.push(...found.slice(row * 4, row * 4 + 4).sort((a, b) => a.left - b.left).map(box => ({ ...box, source })));
    }
  }
  const maxHeight = Math.max(...boxes.map(b => b.bottom - b.top + 1));
  if (boxes.some(b => b.bottom - b.top < maxHeight * .5)) throw Error(`${action}: incomplete figure detected`);
  const scale = 400 / maxHeight;
  const panels = [];
  for (const [index, box] of boxes.entries()) {
    const left = box.left, top = box.top;
    const width = box.right - left + 1;
    const height = box.bottom - top + 1;
    const resizedWidth = Math.round(width * scale), resizedHeight = Math.round(height * scale);
    const column = index % 4, row = Math.floor(index / 4);
    const input = await sharp(box.source).extract({ left, top, width, height }).resize(resizedWidth, resizedHeight).png().toBuffer();
    const x = column * 512 + Math.round(256 - resizedWidth / 2);
    const y = row * 512 + 472 - resizedHeight;
    if (x < column * 512 || x + resizedWidth > (column + 1) * 512 || y < row * 512) throw Error(`${action}: frame ${index} exceeds its cell`);
    panels.push({ input, left: x, top: y });
  }
  const packed = await sharp({ create: { width: 2048, height: 2048, channels: 4, background: '#00000000' } }).composite(panels).png().toBuffer();
  await writeFile(path.join(assets, `${action}-atlas-v1.png`), packed);
  await sharp(packed).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(path.join(assets, `${action}-atlas-v1.webp`));
  await sharp(packed).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(path.join(assets, `${action}-atlas-v1.webp`));
  await sharp(packed).flatten({ background: '#e7e9ce' }).resize(1024, 1024).png().toFile(path.join(output, `${action}-atlas-preview.png`));
  report[action] = { sources: sources.map(source => path.relative(root, source)), frames: 16, width: 2048, height: 2048, scale, boxes };
  console.log(`${action}: packed 16 frames`);
}
await writeFile(path.join(output, 'atlas-report.json'), JSON.stringify(report, null, 2));
