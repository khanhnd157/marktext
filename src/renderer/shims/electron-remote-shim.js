let _tauriWindow = null

async function getTauriWindow () {
  if (!_tauriWindow) {
    try {
      const { getCurrentWindow: getCW } = await import('@tauri-apps/api/webviewWindow')
      _tauriWindow = getCW()
    } catch {
      _tauriWindow = null
    }
  }
  return _tauriWindow
}

export function getCurrentWindow () {
  return {
    isFullScreen: () => false,
    isMaximized: () => false,
    isMinimized: () => false,
    minimize: () => { getTauriWindow().then(w => w && w.minimize()) },
    maximize: () => { getTauriWindow().then(w => w && w.maximize()) },
    unmaximize: () => { getTauriWindow().then(w => w && w.unmaximize()) },
    close: () => { getTauriWindow().then(w => w && w.close()) },
    isAlwaysOnTop: () => false,
    setAlwaysOnTop: (flag) => { getTauriWindow().then(w => w && w.setAlwaysOnTop(flag)) },
    setTitle: (title) => { getTauriWindow().then(w => w && w.setTitle(title)) },
    on: () => {},
    removeListener: () => {},
    webContents: {
      send: () => {}
    }
  }
}

export class Menu {
  static buildFromTemplate () { return new Menu() }
  static setApplicationMenu () {}
  static getApplicationMenu () { return new Menu() }
  popup () {}
  append () {}
  items = []
}

export class MenuItem {
  constructor () {}
}

export const clipboard = {
  writeText: (text) => navigator.clipboard.writeText(text),
  readText: () => navigator.clipboard.readText(),
  readImage: () => null,
  writeImage: () => {}
}

export default { getCurrentWindow, Menu, MenuItem, clipboard }
