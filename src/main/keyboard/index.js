import { ipcMain, shell } from 'electron'
import log from 'electron-log'
import EventEmitter from 'events'
import fsPromises from 'fs/promises'
import os from 'os'
import path from 'path'

let nativeKeymap = null
try {
  nativeKeymap = require('native-keymap')
} catch (err) {
  log.warn('native-keymap module not available, keyboard layout detection disabled')
}

let currentKeyboardInfo = null
const loadKeyboardInfo = () => {
  if (!nativeKeymap) {
    currentKeyboardInfo = {
      layout: null,
      keymap: []
    }
    return currentKeyboardInfo
  }
  currentKeyboardInfo = {
    layout: nativeKeymap.getCurrentKeyboardLayout(),
    keymap: nativeKeymap.getKeyMap()
  }
  return currentKeyboardInfo
}

export const getKeyboardInfo = () => {
  if (!currentKeyboardInfo) {
    return loadKeyboardInfo()
  }
  return currentKeyboardInfo
}

const KEYBOARD_LAYOUT_MONITOR_CHANNEL_ID = 'onDidChangeKeyboardLayout'
class KeyboardLayoutMonitor extends EventEmitter {
  constructor () {
    super()
    this._isSubscribed = false
    this._emitTimer = null
  }

  addListener (callback) {
    this._ensureNativeListener()
    this.on(KEYBOARD_LAYOUT_MONITOR_CHANNEL_ID, callback)
  }

  removeListener (callback) {
    this.removeListener(KEYBOARD_LAYOUT_MONITOR_CHANNEL_ID, callback)
  }

  _ensureNativeListener () {
    if (!this._isSubscribed && nativeKeymap) {
      this._isSubscribed = true
      nativeKeymap.onDidChangeKeyboardLayout(() => {
        clearTimeout(this._emitTimer)
        this._emitTimer = setTimeout(() => {
          this.emit(KEYBOARD_LAYOUT_MONITOR_CHANNEL_ID, loadKeyboardInfo())
          this._emitTimer = null
        }, 150)
      })
    }
  }
}

export const keyboardLayoutMonitor = new KeyboardLayoutMonitor()

export const registerKeyboardListeners = () => {
  ipcMain.handle('mt::keybinding-get-keyboard-info', async () => {
    return getKeyboardInfo()
  })
  ipcMain.on('mt::keybinding-debug-dump-keyboard-info', async () => {
    const dumpPath = path.join(os.tmpdir(), 'marktext_keyboard_info.json')
    const content = JSON.stringify(getKeyboardInfo(), null, 2)
    fsPromises.writeFile(dumpPath, content, 'utf8')
      .then(() => {
        console.log(`Keyboard information written to "${dumpPath}".`)
        shell.openPath(dumpPath)
      })
      .catch(error => {
        log.error('Error dumping keyboard information:', error)
      })
  })
}
