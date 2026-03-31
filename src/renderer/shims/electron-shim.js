import { invoke } from '@tauri-apps/api/core'
import { listen, emit } from '@tauri-apps/api/event'

const listeners = new Map()

export const ipcRenderer = {
  send (channel, ...args) {
    emit(channel, args.length === 1 ? args[0] : args)
  },
  sendSync () {
    console.warn('[electron-shim] sendSync not supported in Tauri')
    return null
  },
  invoke (channel, ...args) {
    return invoke(channel.replace(/::/g, '_').replace(/-/g, '_'), args[0] || {})
      .catch(err => {
        console.warn(`[electron-shim] invoke(${channel}) failed:`, err)
        return null
      })
  },
  on (channel, handler) {
    const unlisten = listen(channel, (event) => {
      handler(event, event.payload)
    })
    if (!listeners.has(channel)) listeners.set(channel, [])
    listeners.get(channel).push({ handler, unlisten })
    return ipcRenderer
  },
  once (channel, handler) {
    const unlisten = listen(channel, (event) => {
      handler(event, event.payload)
      unlisten.then(fn => fn())
    })
    return ipcRenderer
  },
  off (channel, handler) {
    const channelListeners = listeners.get(channel)
    if (channelListeners) {
      const entry = channelListeners.find(e => e.handler === handler)
      if (entry) {
        entry.unlisten.then(fn => fn())
        listeners.set(channel, channelListeners.filter(e => e !== entry))
      }
    }
    return ipcRenderer
  },
  removeAllListeners (channel) {
    const channelListeners = listeners.get(channel)
    if (channelListeners) {
      channelListeners.forEach(e => e.unlisten.then(fn => fn()))
      listeners.delete(channel)
    }
    return ipcRenderer
  },
  emit (channel, event, ...args) {
    emit(channel, args.length === 1 ? args[0] : args)
  }
}

export const shell = {
  openExternal (url) {
    window.open(url, '_blank')
  },
  openPath (p) {
    console.warn('[electron-shim] shell.openPath not supported:', p)
  }
}

export const clipboard = {
  writeText (text) {
    navigator.clipboard.writeText(text)
  },
  readText () {
    return navigator.clipboard.readText()
  }
}

export const webFrame = {
  setZoomFactor (factor) {
    document.body.style.zoom = factor
  }
}

export default { ipcRenderer, shell, clipboard, webFrame }
