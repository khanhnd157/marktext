import { invoke } from '@tauri-apps/api/core'
import { listen, emit } from '@tauri-apps/api/event'
import { open, save } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

const listeners = new Map()

const tauriHandlers = {
  'mt::ask-for-user-preference': async () => {
    try {
      const prefs = await invoke('get_preferences')
      ipcRenderer._dispatch('mt::user-preference', prefs)
    } catch (e) {
      console.warn('[tauri-shim] get_preferences failed:', e)
    }
  },
  'mt::set-user-preference': async (data) => {
    try {
      const obj = Array.isArray(data) ? data[0] : data
      for (const [key, value] of Object.entries(obj)) {
        await invoke('set_preference', { key, value: JSON.stringify(value) })
      }
    } catch (e) {
      console.warn('[tauri-shim] set_preference failed:', e)
    }
  },
  'mt::ask-for-user-data': async () => {
    // user data (image config, etc.) also stored in preferences
  },
  'mt::set-user-data': async (data) => {
    try {
      const obj = Array.isArray(data) ? data[0] : data
      for (const [key, value] of Object.entries(obj)) {
        await invoke('set_preference', { key, value: JSON.stringify(value) })
      }
    } catch (e) {
      console.warn('[tauri-shim] set_user_data failed:', e)
    }
  },
  'mt::response-file-save': async (data) => {
    try {
      const args = Array.isArray(data) ? data : [data]
      const { id, pathname, markdown, options } = args[0] || {}
      if (pathname && markdown !== undefined) {
        await invoke('write_markdown_file', {
          path: pathname,
          content: markdown,
          encoding: options?.encoding?.encoding || 'utf8',
          lineEnding: options?.lineEnding || 'lf'
        })
        ipcRenderer._dispatch('mt::tab-saved', { id, pathname })
      }
    } catch (e) {
      console.warn('[tauri-shim] save file failed:', e)
      ipcRenderer._dispatch('mt::tab-save-failure', { id: data?.id })
    }
  },
  'mt::response-file-save-as': async (data) => {
    try {
      const args = Array.isArray(data) ? data : [data]
      const { id, markdown, options, pathname: currentPath } = args[0] || {}
      const filePath = await save({
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: currentPath
      })
      if (filePath) {
        await invoke('write_markdown_file', {
          path: filePath,
          content: markdown || '',
          encoding: options?.encoding?.encoding || 'utf8',
          lineEnding: options?.lineEnding || 'lf'
        })
        const filename = filePath.split(/[/\\]/).pop()
        ipcRenderer._dispatch('mt::set-pathname', {
          id,
          pathname: filePath,
          filename
        })
        ipcRenderer._dispatch('mt::tab-saved', { id, pathname: filePath })
      }
    } catch (e) {
      console.warn('[tauri-shim] save-as failed:', e)
    }
  },
  'mt::ask-for-open-project-in-sidebar': async () => {
    try {
      const folder = await open({ directory: true })
      if (folder) {
        ipcRenderer._dispatch('mt::open-directory', folder)
      }
    } catch (e) {
      console.warn('[tauri-shim] open project failed:', e)
    }
  },
  'mt::close-window': async () => {
    try {
      await invoke('close_window')
    } catch (e) {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      getCurrentWebviewWindow().close()
    }
  },
  'mt::open-setting-window': async () => {
    try {
      await invoke('create_settings_window')
    } catch (e) {
      console.warn('[tauri-shim] create settings window failed:', e)
    }
  },
  'mt::ask-for-image-path': async (data) => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff'] }
        ]
      })
      return selected || ''
    } catch (e) {
      return ''
    }
  },
  'mt::rename': async (data) => {
    try {
      const args = Array.isArray(data) ? data : [data]
      const { id, pathname, newPathname } = args[0] || {}
      if (pathname && newPathname) {
        await invoke('rename_file', { oldPath: pathname, newPath: newPathname })
      }
    } catch (e) {
      console.warn('[tauri-shim] rename failed:', e)
    }
  },
  'mt::select-default-directory-to-open': async () => {
    try {
      const folder = await open({ directory: true })
      if (folder) {
        await invoke('set_preference', {
          key: 'defaultDirectoryToOpen',
          value: JSON.stringify(folder)
        })
      }
    } catch (e) {
      console.warn('[tauri-shim] select dir failed:', e)
    }
  },
  'mt::ask-for-modify-image-folder-path': async (data) => {
    try {
      const current = Array.isArray(data) ? data[0] : data
      const folder = await open({ directory: true, defaultPath: current || undefined })
      if (folder) {
        await invoke('set_preference', {
          key: 'imageFolderPath',
          value: JSON.stringify(folder)
        })
      }
    } catch (e) {
      console.warn('[tauri-shim] modify image folder failed:', e)
    }
  }
}

export const ipcRenderer = {
  send (channel, ...args) {
    const handler = tauriHandlers[channel]
    if (handler) {
      handler(args.length === 1 ? args[0] : args)
    } else {
      emit(channel, args.length === 1 ? args[0] : args).catch(() => {})
    }
  },
  sendSync (channel, ...args) {
    const handler = tauriHandlers[channel]
    if (handler) {
      const result = handler(args.length === 1 ? args[0] : args)
      if (result instanceof Promise) {
        console.warn('[electron-shim] sendSync async handler, returning null:', channel)
        return null
      }
      return result
    }
    return null
  },
  invoke (channel, ...args) {
    let cmdName = channel.replace(/::/g, '_').replace(/-/g, '_').replace(/^mt_/, '')
    const cmdAliases = {
      'fs_trash_item': 'trash_item'
    }
    if (cmdAliases[cmdName]) cmdName = cmdAliases[cmdName]
    const payload = args[0] || {}
    return invoke(cmdName, typeof payload === 'string' ? { path: payload } : payload).catch(err => {
      console.warn(`[electron-shim] invoke(${channel} → ${cmdName}) failed:`, err)
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
  removeListener (channel, handler) {
    return ipcRenderer.off(channel, handler)
  },
  _dispatch (channel, payload) {
    const channelListeners = listeners.get(channel)
    if (channelListeners) {
      channelListeners.forEach(e => {
        try { e.handler({}, payload) } catch (err) { console.error(err) }
      })
    }
  }
}

export const shell = {
  openExternal (url) {
    openUrl(url).catch(() => window.open(url, '_blank'))
  },
  openPath (p) {
    openUrl(p).catch(() => console.warn('[electron-shim] openPath failed:', p))
  },
  showItemInFolder (p) {
    openUrl(p).catch(() => console.warn('[electron-shim] showItemInFolder not fully supported:', p))
  }
}

export const clipboard = {
  writeText (text) {
    return writeText(text)
  },
  readText () {
    return readText()
  },
  readImage () {
    return null
  },
  writeImage () {}
}

export const webFrame = {
  setZoomFactor (factor) {
    document.body.style.zoom = String(factor)
  },
  getZoomFactor () {
    return parseFloat(document.body.style.zoom) || 1.0
  }
}

export default { ipcRenderer, shell, clipboard, webFrame }
