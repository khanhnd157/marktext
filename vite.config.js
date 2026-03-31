import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'raw-assets',
      enforce: 'pre',
      transform (code, id) {
        if (id.endsWith('.md') && !id.includes('node_modules')) {
          return {
            code: `export default ${JSON.stringify(code)}`,
            map: null
          }
        }

        if (!id.endsWith('.js') && !id.endsWith('.vue') && !id.endsWith('.ts')) return null

        const cssStringImportRe = /(import\s+\w+\s+from\s+['"])((?:.*?(?:theme-chalk.*index|exportStyle|katex|github-markdown|prism[\w-]*|\.theme|headerFooterStyle)\.css))(['"])/g
        const htmlImportRe = /(import\s+\w+\s+from\s+['"])(\.\/[^'"]+\.html)(['"])/g

        let newCode = code
        let changed = false
        newCode = newCode.replace(cssStringImportRe, (match, pre, src, post) => {
          changed = true
          return `${pre}${src}?inline${post}`
        })
        newCode = newCode.replace(htmlImportRe, (match, pre, src, post) => {
          changed = true
          return `${pre}${src}?raw${post}`
        })
        if (changed) {
          return { code: newCode, map: null }
        }
        return null
      }
    },
    {
      name: 'node-modules-shim',
      enforce: 'pre',
      resolveId (source) {
        const shimMap = {
          fs: 'fs-shim.js',
          'fs/promises': 'fs-promises-shim.js',
          'node:fs': 'fs-shim.js',
          'node:fs/promises': 'fs-promises-shim.js',
          'node:path': null,
          'node:os': 'os-shim.js',
          'node:child_process': 'empty-shim.js',
          'node:crypto': 'empty-shim.js',
          stream: 'empty-shim.js',
          assert: 'empty-shim.js',
          constants: 'empty-shim.js',
          util: 'empty-shim.js',
          url: 'empty-shim.js',
          http: 'empty-shim.js',
          https: 'empty-shim.js',
          querystring: 'empty-shim.js',
        }
        if (source in shimMap && shimMap[source] !== null) {
          return path.resolve(__dirname, 'src/renderer/polyfills', shimMap[source])
        }
        return null
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      'muya': path.resolve(__dirname, 'src/muya'),
      'common': path.resolve(__dirname, 'src/common'),
      snapsvg: path.resolve(__dirname, 'src/muya/lib/assets/libs/snap.svg-min.js'),
      path: 'path-browserify',
      'fontmanager-redux': path.resolve(__dirname, 'src/renderer/polyfills/fontmanager-shim.js'),
      child_process: path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      os: path.resolve(__dirname, 'src/renderer/polyfills/os-shim.js'),
      crypto: path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      zlib: path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      'fs-extra': path.resolve(__dirname, 'src/renderer/polyfills/fs-shim.js'),
      'graceful-fs': path.resolve(__dirname, 'src/renderer/polyfills/fs-shim.js'),
      'keytar': path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      'native-keymap': path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      'vscode-ripgrep': path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      'command-exists': path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
      '@hfelix/electron-localshortcut': path.resolve(__dirname, 'src/renderer/polyfills/empty-shim.js'),
    },
    extensions: ['.js', '.ts', '.vue', '.json', '.css']
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  css: {
    postcss: {
      plugins: []
    },
    transformer: 'postcss',
    lightningcss: undefined
  },
  optimizeDeps: {
    include: [
      'snabbdom',
      'snabbdom-to-html',
      'dompurify',
      'prismjs',
      'katex',
      'codemirror',
      'turndown',
      'fuzzaldrin'
    ],
    exclude: ['fontmanager-redux']
  },
  build: {
    target: ['es2021', 'chrome100', 'safari15'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      external: ['fontmanager-redux', 'eve']
    }
  }
})
