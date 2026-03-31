const _p = typeof navigator !== 'undefined' ? navigator.platform : ''
const platform = _p.includes('Win') ? 'win32' : _p.includes('Mac') ? 'darwin' : 'linux'

if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    platform,
    env: {
      NODE_ENV: import.meta.env?.MODE || 'development',
      UNSPLASH_ACCESS_KEY: import.meta.env?.VITE_UNSPLASH_ACCESS_KEY || ''
    },
    versions: {
      MARKTEXT_VERSION_STRING: '0.17.1'
    },
    resourcesPath: '',
    cwd: () => '/',
    type: 'renderer',
    nextTick: (fn) => Promise.resolve().then(fn),
    argv: [],
    stdout: { write: () => {} },
    stderr: { write: () => {} }
  }
} else {
  if (!globalThis.process.versions) globalThis.process.versions = {}
  if (!globalThis.process.versions.MARKTEXT_VERSION_STRING) {
    globalThis.process.versions.MARKTEXT_VERSION_STRING = '0.17.1'
  }
}

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}
