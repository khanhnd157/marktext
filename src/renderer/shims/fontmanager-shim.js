export function getAvailableFonts (callback) {
  const defaultFonts = [
    'Arial', 'Courier New', 'Georgia', 'Helvetica', 'Lucida Console',
    'Monaco', 'Open Sans', 'Roboto', 'Segoe UI', 'Tahoma',
    'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Consolas', 'Fira Code', 'JetBrains Mono', 'Source Code Pro'
  ]

  if (typeof callback === 'function') {
    callback(defaultFonts.map(f => ({ family: f })))
  }
  return defaultFonts.map(f => ({ family: f }))
}

export function getAvailableFontsSync () {
  return getAvailableFonts()
}

export default { getAvailableFonts, getAvailableFontsSync }
