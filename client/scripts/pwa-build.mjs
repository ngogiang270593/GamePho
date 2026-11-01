import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function pwaBuild() {
  return {
    name: 'pho-xom-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const publicFiles = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'images/start-menu-village.png', 'images/xom-nha-la-title-screen.jpg'];
      const listAssets = directory => readdirSync(resolve('public', directory), { withFileTypes: true })
        .flatMap(entry => entry.isDirectory()
          ? listAssets(`${directory}/${entry.name}`)
          : [`${directory}/${entry.name}`]);
      const characterAssets = listAssets('assets');
      const hash = createHash('sha256');
      for (const [name, asset] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
        hash.update(name); hash.update(asset.type === 'chunk' ? asset.code : asset.source);
      }
      for (const path of [...publicFiles, ...characterAssets]) {
        hash.update(path);
        hash.update(readFileSync(resolve('public', path)));
      }
      const version = hash.digest('hex').slice(0, 16);
      const files = [...new Set(['/index.html', ...Object.keys(bundle).filter(name => /\.(js|css)$/.test(name)).map(name => '/' + name), ...publicFiles.map(name => '/' + name), ...characterAssets.map(name => '/' + name)])];
      const source = `/* Generated for this complete build. Never cache or replay API requests. */
const CACHE = 'pho-xom-shell-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  // Wait for existing game windows to close; never force-reload a live cooking session.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pho-xom-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/api' || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match('/index.html')).then(response => response || Response.error())));
    return;
  }
  if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname)).then(response => response || fetch(request)));
  }
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
