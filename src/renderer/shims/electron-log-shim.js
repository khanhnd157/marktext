const log = {
  info: (...args) => console.info('[marktext]', ...args),
  warn: (...args) => console.warn('[marktext]', ...args),
  error: (...args) => console.error('[marktext]', ...args),
  debug: (...args) => console.debug('[marktext]', ...args),
  verbose: (...args) => console.log('[marktext]', ...args),
  transports: {
    console: { level: 'info' },
    file: {
      level: 'info',
      resolvePath: () => '',
      sync: false
    },
    mainConsole: null
  }
}

export default log
