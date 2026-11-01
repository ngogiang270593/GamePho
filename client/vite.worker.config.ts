import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'dist-online', emptyOutDir: false, lib: { entry: 'cloudflare/worker.ts', formats: ['es'], fileName: () => '_worker.js' }, minify: true } });
