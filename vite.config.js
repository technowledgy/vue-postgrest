import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import copy from 'rollup-plugin-copy'

const repoDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    commonjsOptions: { include: [] },
    lib: {
      entry: resolve(repoDir, 'src/index.js'),
      formats: ['es', 'cjs']
    },
    minify: false,
    rollupOptions: {
      external: ['vue'],
      output: {
        entryFileNames: '[format]/vue-postgrest.js',
        exports: 'named'
      }
    },
    sourcemap: true
  },
  optimizeDeps: {
    disabled: false
  },
  plugins: [
    vue(),
    copy({
      targets: [
        { src: 'package.json.cjs', dest: 'dist/cjs', rename: 'package.json' }
      ],
      hook: 'writeBundle'
    })
  ],
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: resolve(repoDir, 'src') + '/'
      }
    ]
  }
})
