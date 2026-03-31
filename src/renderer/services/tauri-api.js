import { invoke } from '@tauri-apps/api/core'
import { open, save, ask } from '@tauri-apps/plugin-dialog'
import { openUrl } from '@tauri-apps/plugin-opener'
import { writeText as clipWrite, readText as clipRead } from '@tauri-apps/plugin-clipboard-manager'
import { emitEvent } from './tauri-events'

// --- File Operations ---

export async function readFile (path) {
  return invoke('read_markdown_file', { path })
}

export async function writeFile (path, content, opts = {}) {
  return invoke('write_markdown_file', {
    path,
    content,
    encoding: opts.encoding || 'utf8',
    lineEnding: opts.lineEnding || 'lf'
  })
}

export async function renameFile (oldPath, newPath) {
  return invoke('rename_file', { oldPath, newPath })
}

export async function trashItem (path) {
  return invoke('trash_item', { path })
}

export async function listDir (path) {
  return invoke('list_directory', { path })
}

export async function fileExists (path) {
  return invoke('file_exists', { path })
}

export async function createDir (path) {
  return invoke('create_directory', { path })
}

export async function copyFile (src, dst) {
  return invoke('copy_file', { src, dst })
}

// --- Open File Helpers ---

export async function openFileByPath (filePath, options = {}) {
  try {
    const result = await readFile(filePath)
    const filename = filePath.split(/[/\\]/).pop()
    const doc = {
      markdown: result.content || result,
      filename,
      pathname: filePath,
      encoding: { encoding: result.encoding || 'utf8', isBom: false },
      lineEnding: result.lineEnding || 'lf',
      adjustLineEndingOnSave: false
    }
    emitEvent('mt::open-new-tab', doc, options)
  } catch (e) {
    console.warn('[tauri] open file failed:', filePath, e)
  }
}

export async function openFileDialog () {
  const selected = await open({
    multiple: true,
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mmd', 'mdown', 'mdtxt', 'mdtext', 'rmd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (!selected) return
  const paths = Array.isArray(selected) ? selected : [selected]
  for (const p of paths) {
    await openFileByPath(p)
  }
}

export async function saveFileContent (file) {
  const { pathname, markdown, options } = file
  if (pathname && markdown !== undefined) {
    await writeFile(pathname, markdown, {
      encoding: options?.encoding?.encoding || 'utf8',
      lineEnding: options?.lineEnding || 'lf'
    })
  }
}

export async function saveAndCloseTabs (unsavedFiles) {
  const files = Array.isArray(unsavedFiles) ? unsavedFiles : [unsavedFiles]
  const tabIds = []
  for (const file of files) {
    await saveFileContent(file)
    tabIds.push(file.id)
  }
  emitEvent('mt::force-close-tabs-by-id', tabIds)
}

export async function confirmCloseWindow (unsavedFiles) {
  const files = Array.isArray(unsavedFiles) ? unsavedFiles : [unsavedFiles]
  const names = files.map(f => f.filename || 'Untitled').join(', ')
  const shouldSave = await ask(`Save changes to: ${names}?`, {
    title: 'Unsaved Changes',
    kind: 'warning',
    okLabel: 'Save',
    cancelLabel: 'Discard'
  })
  if (shouldSave) {
    for (const file of files) {
      await saveFileContent(file)
    }
  }
  closeWindow()
}

export async function fileSave (fileInfo) {
  const { id, pathname, markdown, options } = fileInfo
  try {
    if (pathname && markdown !== undefined) {
      await writeFile(pathname, markdown, {
        encoding: options?.encoding?.encoding || 'utf8',
        lineEnding: options?.lineEnding || 'lf'
      })
      emitEvent('mt::tab-saved', { id, pathname })
    }
  } catch (e) {
    console.warn('[tauri] save file failed:', e)
    emitEvent('mt::tab-save-failure', { id })
  }
}

export async function fileSaveAs (fileInfo) {
  const { id, markdown, options, pathname: currentPath } = fileInfo
  const filePath = await save({
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: currentPath
  })
  if (filePath) {
    await writeFile(filePath, markdown || '', {
      encoding: options?.encoding?.encoding || 'utf8',
      lineEnding: options?.lineEnding || 'lf'
    })
    const filename = filePath.split(/[/\\]/).pop()
    emitEvent('mt::set-pathname', { id, pathname: filePath, filename })
    emitEvent('mt::tab-saved', { id, pathname: filePath })
  }
}

export async function fileMoveTo (id, pathname) {
  const newPath = await save({
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: pathname
  })
  if (newPath && pathname) {
    await renameFile(pathname, newPath)
    const filename = newPath.split(/[/\\]/).pop()
    emitEvent('mt::set-pathname', { id, pathname: newPath, filename })
  }
}

export async function exportFile ({ type, content, pathname, title }) {
  if (type === 'pdf') {
    window.print()
    return
  }
  const ext = type === 'html' ? 'html' : 'md'
  const defaultName = (title || pathname?.split(/[/\\]/).pop()?.replace(/\.md$/, '') || 'export') + '.' + ext
  const filePath = await save({
    filters: [{ name: type.toUpperCase(), extensions: [ext] }],
    defaultPath: defaultName
  })
  if (filePath && content) {
    await writeFile(filePath, content)
    emitEvent('mt::export-success', { type, filePath })
  }
}

export async function handleFormatLinkClick (data, dirname) {
  const href = data?.href || data || ''
  if (/^https?:\/\//.test(href)) {
    openExternal(href)
  } else if (href.endsWith('.md') || href.endsWith('.markdown')) {
    const sep = navigator.platform.includes('Win') ? '\\' : '/'
    const fullPath = dirname ? dirname + sep + href : href
    await openFileByPath(fullPath)
  } else if (href) {
    openExternal(href)
  }
}

export async function handleImageAutoPath (pathname, src, id) {
  try {
    const sep = pathname.includes('/') ? '/' : '\\'
    const dirname = pathname.substring(0, pathname.lastIndexOf(sep))
    const entries = await listDir(dirname)
    const matches = (entries || [])
      .filter(e => !e.isDirectory && e.name && src.includes(e.name.split('.')[0]))
      .map(e => dirname + sep + e.name)
    emitEvent('mt::response-of-image-path-' + id, matches)
  } catch (_) {
    emitEvent('mt::response-of-image-path-' + id, [])
  }
}

export async function handleDroppedFiles (fileList) {
  const files = Array.isArray(fileList) ? fileList : [fileList]
  for (const filePath of files) {
    if (typeof filePath === 'string') {
      const ext = filePath.split('.').pop().toLowerCase()
      if (['md', 'markdown', 'mmd', 'mdown', 'mdtxt', 'mdtext', 'rmd', 'txt'].includes(ext)) {
        await openFileByPath(filePath)
      }
    }
  }
}

// --- Dialogs ---

export async function showOpenFileDialog () {
  return openFileDialog()
}

export async function showOpenFolderDialog () {
  return open({ directory: true })
}

export async function showSaveDialog (opts = {}) {
  return save(opts)
}

export async function showConfirmDialog (msg, opts = {}) {
  return ask(msg, opts)
}

export async function showImagePathDialog () {
  return open({
    multiple: false,
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff'] }
    ]
  })
}

export async function showSelectDirectoryDialog (defaultPath) {
  return open({ directory: true, defaultPath: defaultPath || undefined })
}

// --- Shell ---

export function openExternal (url) {
  openUrl(url).catch(() => window.open(url, '_blank'))
}

export function openPath (p) {
  openUrl(p).catch(() => console.warn('[tauri] openPath failed:', p))
}

export function showItemInFolder (p) {
  openUrl(p).catch(() => console.warn('[tauri] showItemInFolder:', p))
}

// --- Clipboard ---

export function clipboardWriteText (text) {
  return clipWrite(text)
}

export function clipboardReadText () {
  return clipRead()
}

// --- Window ---

export async function minimizeWindow () {
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  getCurrentWebviewWindow().minimize()
}

export async function maximizeWindow () {
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  const win = getCurrentWebviewWindow()
  const maximized = await win.isMaximized()
  if (maximized) {
    win.unmaximize()
  } else {
    win.maximize()
  }
}

export async function toggleFullscreen () {
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  const win = getCurrentWebviewWindow()
  const fs = await win.isFullscreen()
  await win.setFullscreen(!fs)
}

export async function closeWindow () {
  try {
    await invoke('close_window')
  } catch (_) {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    getCurrentWebviewWindow().close()
  }
}

export async function isMaximized () {
  try {
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    return getCurrentWebviewWindow().isMaximized()
  } catch (_) {
    return false
  }
}

export async function setAlwaysOnTop (flag) {
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  getCurrentWebviewWindow().setAlwaysOnTop(flag)
}

export async function setWindowTitle (title) {
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  getCurrentWebviewWindow().setTitle(title)
}

export async function createEditorWindow () {
  return invoke('create_editor_window')
}

export async function createSettingsWindow () {
  return invoke('create_settings_window')
}

// --- Preferences ---

export async function getPreferences () {
  return invoke('get_preferences')
}

export async function setPreference (key, value) {
  return invoke('set_preference', { key, value: JSON.stringify(value) })
}

export async function getPreference (key) {
  return invoke('get_preference', { key })
}

// --- Zoom ---

export function setZoom (factor) {
  document.body.style.zoom = String(factor)
}

export function getZoom () {
  return parseFloat(document.body.style.zoom) || 1.0
}

// --- Invoke (generic) ---

export { invoke }
