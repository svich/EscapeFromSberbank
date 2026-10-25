import { defineConfig } from 'vite';

export default defineConfig({
  // Phaser alone is ~1.4 MB minified; don't warn about the expected bundle size.
  build: { chunkSizeWarningLimit: 2000 },
});
