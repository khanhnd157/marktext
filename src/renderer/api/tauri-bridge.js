import { invoke } from '@tauri-apps/api/core'
import { listen, emit } from '@tauri-apps/api/event'
import { open, save, message, ask, confirm } from '@tauri-apps/plugin-dialog'
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'
import { openUrl } from '@tauri-apps/plugin-opener'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

export const ipc = {
  invoke: (cmd, args) => invoke(cmd, args),
  listen: (event, handler) => listen(event, handler),
  emit: (event, payload) => emit(event, payload),
}

export const fs = {
  readMarkdownFile: (path) => invoke('read_markdown_file', { path }),
  writeMarkdownFile: (path, content, encoding, lineEnding) =>
    invoke('write_markdown_file', { path, content, encoding, lineEnding }),
  listDirectory: (path) => invoke('list_directory', { path }),
  renameFile: (oldPath, newPath) => invoke('rename_file', { oldPath, newPath }),
  trashItem: (path) => invoke('trash_item', { path }),
  detectEncoding: (path) => invoke('detect_encoding', { path }),
  watchPath: (path) => invoke('watch_path', { path }),
  unwatchPath: (path) => invoke('unwatch_path', { path }),
  onFsChange: (handler) => listen('fs-change', (event) => handler(event.payload)),
}

export const dialog = {
  openFile: (options = {}) =>
    open({
      multiple: options.multiple || false,
      filters: options.filters || [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mmd', 'mdown', 'mdtxt', 'mdtext', 'rmd'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    }),
  openFolder: () => open({ directory: true }),
  saveFile: (options = {}) =>
    save({
      filters: options.filters || [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      defaultPath: options.defaultPath,
    }),
  showMessage: (title, msg, kind = 'info') => message(msg, { title, kind }),
  ask: (title, msg) => ask(msg, { title }),
  confirm: (title, msg) => confirm(msg, { title }),
}

export const shell = {
  openExternal: (url) => openUrl(url),
}

export const clipboard = {
  writeText: (text) => writeText(text),
  readText: () => readText(),
}

export const windowApi = {
  close: () => invoke('close_window'),
  toggleAlwaysOnTop: () => invoke('toggle_always_on_top'),
  setTitle: (title) => invoke('set_title', { title }),
  createEditorWindow: () => invoke('create_editor_window'),
  createSettingsWindow: () => invoke('create_settings_window'),
  getCurrentWindow: () => getCurrentWebviewWindow(),
  minimize: () => getCurrentWebviewWindow().minimize(),
  maximize: () => getCurrentWebviewWindow().toggleMaximize(),
  isMaximized: () => getCurrentWebviewWindow().isMaximized(),
  setFocus: () => getCurrentWebviewWindow().setFocus(),
}

export const preferencesApi = {
  getAll: () => invoke('get_preferences'),
  get: (key) => invoke('get_preference', { key }),
  set: (key, value) => invoke('set_preference', { key, value }),
}

export default {
  ipc,
  fs,
  dialog,
  shell,
  clipboard,
  window: windowApi,
  preferences: preferencesApi,
}
