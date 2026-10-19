import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 4000, cssCodeSplit: false, modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true, entryFileNames: 'game.js', assetFileNames: '[name][extname]' } } },
  server: { port: 5188, strictPort: true, host: '127.0.0.1' },
  preview: { port: 5189, strictPort: true, host: '127.0.0.1' },
  test: { environment: 'node' },
} as any);
