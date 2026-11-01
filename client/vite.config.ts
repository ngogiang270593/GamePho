import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { pwaBuild } from './scripts/pwa-build.mjs';
import { characterDesignerSource } from './scripts/character-designer-source.mjs';

export default defineConfig({
  plugins: [react(), pwaBuild(), characterDesignerSource()],
  cacheDir: '../.vite-debug',
  server: { proxy: { '/api': 'http://localhost:5113' } },
  test: {
    environment: 'jsdom',
    clearMocks: true,
  },
});
