import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.browser.js'),
      name: 'telegrambo',
      fileName: (format) => `telegrambo.browser.${format}.js`,
      formats: ['es', 'umd']
    },
    sourcemap: true,
    minify: 'esbuild',
    emptyOutDir: false
  }
})
