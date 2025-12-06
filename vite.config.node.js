import { resolve } from 'path';
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import pkg from './package.json' with { type: 'json' };

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: resolve(__dirname, 'src/index.node.js'),
      name: 'telegrambo',
      fileName: (format) => `telegrambo.node.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        ...Object.keys(pkg.dependencies || {})
      ],
    },
    sourcemap: true,
    minify: 'esbuild'
  }
})