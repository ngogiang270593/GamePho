import { createServer } from '../client/node_modules/vite/dist/node/index.js';
import React from '../client/node_modules/react/index.js';
import { renderToStaticMarkup } from '../client/node_modules/react-dom/server.node.js';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../client/package.json', import.meta.url));
const sharp = require('sharp');
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../client');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { CharacterSprite } = await server.ssrLoadModule('/src/components/CharacterSprite.tsx');
  const { STARTING_CHARACTERS, startingCharacterAppearance } = await server.ssrLoadModule('/src/game/startingCharacters.ts');
  const { startingCharacterInventory } = await server.ssrLoadModule('/src/game/characterInventory.ts');
  const output = path.resolve(root, '../output/forest-outfit');
  await mkdir(output, { recursive: true });
  const panels = [];
  for (const gender of ['male', 'female']) {
    const appearance = startingCharacterAppearance('forest-keeper', gender);
    const customization = startingCharacterInventory(appearance, STARTING_CHARACTERS.find(t => t.id === 'forest-keeper'));
    for (const facing of ['down', 'right', 'up', 'left']) {
    let svg = renderToStaticMarkup(React.createElement(CharacterSprite, { appearance, customization, facing, startingCharacter: 'forest-keeper' }));
    for (const match of [...svg.matchAll(/href="([^"]+)"/g)]) {
      const src = match[1];
      if (src.startsWith('data:')) continue;
      const data = await readFile(path.join(root, src.split('?')[0]));
      svg = svg.replaceAll(`href="${src}"`, `href="data:image/png;base64,${data.toString('base64')}"`);
    }
    const name = facing === 'down' ? gender : `${gender}-${facing}`;
    await writeFile(path.join(output, `${name}.svg`), svg);
    const png = await sharp(Buffer.from(svg)).flatten({ background: '#e9ebd1' }).png().toBuffer();
    await writeFile(path.join(output, `${name}.png`), png);
    panels.push({ input: await sharp(png).resize(288, 384).toBuffer(), left: ['down', 'right', 'up', 'left'].indexOf(facing) * 288, top: gender === 'male' ? 0 : 384 });
    console.log(path.join(output, `${name}.png`));
    }
  }
  await sharp({ create: { width: 1152, height: 768, channels: 4, background: '#e9ebd1' } }).composite(panels).png().toFile(path.join(output, 'turnaround-preview.png'));
} finally { await server.close(); }
