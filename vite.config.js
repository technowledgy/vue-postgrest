import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import copy from 'rollup-plugin-copy'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
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
  plugins: [
    createVuePlugin(),
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
        find: /^@/,
        replacement: resolve(__dirname, 'src')
      }
    ]
  }
})
