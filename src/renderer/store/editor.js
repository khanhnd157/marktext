import path from 'path'
import equal from 'fast-deep-equal'
import { isSamePathSync } from 'common/filesystem/paths'
import bus from '../bus'
import { hasKeys, getUniqueId } from '../util'
import listToTree from '../util/listToTree'
import { createDocumentState, getOptionsFromState, getSingleFileState, getBlankFileState } from './help'
import notice from '../services/notification'
import {
  FileEncodingCommand,
  LineEndingCommand,
  QuickOpenCommand,
  TrailingNewlineCommand
} from '../commands'
import {
  clipboardWriteText,
  showItemInFolder,
  handleFormatLinkClick,
  handleImageAutoPath,
  fileSave,
  fileSaveAs,
  fileMoveTo,
  saveAndCloseTabs,
  confirmCloseWindow,
  closeWindow,
  renameFile,
  exportFile,
  setZoom,
  showImagePathDialog
} from '@/services/tauri-api'
import { onEvent, onceEvent, emitEvent } from '@/services/tauri-events'

const autoSaveTimers = new Map()

const state = {
  currentFile: {},
  tabs: [],
  listToc: [],
  toc: []
}

const mutations = {
  SET_SEARCH (state, value) {
    state.currentFile.searchMatches = value
  },
  SET_TOC (state, toc) {
    state.listToc = toc
    state.toc = listToTree(toc)
  },
  SET_CURRENT_FILE (state, currentFile) {
    const oldCurrentFile = state.currentFile
    if (!oldCurrentFile.id || oldCurrentFile.id !== currentFile.id) {
      const { id, markdown, cursor, history, pathname } = currentFile
      window.DIRNAME = pathname ? path.dirname(pathname) : ''
      state.currentFile = currentFile
      bus.$emit('file-changed', { id, markdown, cursor, renderCursor: true, history })
    }
  },
  ADD_FILE_TO_TABS (state, currentFile) {
    state.tabs.push(currentFile)
  },
  REMOVE_FILE_WITHIN_TABS (state, file) {
    const { tabs, currentFile } = state
    const index = tabs.indexOf(file)
    tabs.splice(index, 1)

    if (file.id && autoSaveTimers.has(file.id)) {
      const timer = autoSaveTimers.get(file.id)
      clearTimeout(timer)
      autoSaveTimers.delete(file.id)
    }

    if (file.id === currentFile.id) {
      const fileState = state.tabs[index] || state.tabs[index - 1] || state.tabs[0] || {}
      state.currentFile = fileState
      if (typeof fileState.markdown === 'string') {
        const { id, markdown, cursor, history, pathname } = fileState
        window.DIRNAME = pathname ? path.dirname(pathname) : ''
        bus.$emit('file-changed', { id, markdown, cursor, renderCursor: true, history })
      }
    }

    if (state.tabs.length === 0) {
      state.listToc = []
      state.toc = []
    }
  },
  EXCHANGE_TABS_BY_ID (state, tabIDs) {
    const { fromId } = tabIDs
    const toId = tabIDs.toId

    const { tabs } = state
    const moveItem = (arr, from, to) => {
      if (from === to) return true
      const len = arr.length
      const item = arr.splice(from, 1)
      if (item.length === 0) return false
      arr.splice(to, 0, item[0])
      return arr.length === len
    }

    const fromIndex = tabs.findIndex(t => t.id === fromId)
    if (!toId) {
      moveItem(tabs, fromIndex, tabs.length - 1)
    } else {
      const toIndex = tabs.findIndex(t => t.id === toId)
      const realToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
      moveItem(tabs, fromIndex, realToIndex)
    }
  },
  LOAD_CHANGE (state, change) {
    const { tabs, currentFile } = state
    const { data, pathname } = change
    const {
      isMixedLineEndings,
      lineEnding,
      adjustLineEndingOnSave,
      trimTrailingNewline,
      encoding,
      markdown,
      filename
    } = data
    const options = { encoding, lineEnding, adjustLineEndingOnSave, trimTrailingNewline }

    const newFileState = getSingleFileState({ markdown, filename, pathname, options })

    const tab = tabs.find(t => isSamePathSync(t.pathname, pathname))
    if (!tab) {
      console.error('LOAD_CHANGE: Cannot find tab in tab list.')
      notice.notify({
        title: 'Error loading tab',
        message: 'There was an error while loading the file change because the tab cannot be found.',
        type: 'error',
        time: 20000,
        showConfirm: false
      })
      return
    }

    const oldId = tab.id
    const oldNotifications = tab.notifications
    let oldHistory = null
    if (tab.history.index >= 0 && tab.history.stack.length >= 1) {
      oldHistory = {
        stack: [tab.history.stack[tab.history.index]],
        index: 0
      }
      tab.history.index--
      tab.history.stack.pop()
    }

    Object.assign(tab, newFileState)
    tab.id = oldId
    tab.notifications = oldNotifications
    if (oldHistory) {
      tab.history = oldHistory
    }

    if (isMixedLineEndings) {
      tab.notifications.push({
        msg: `"${filename}" has mixed line endings which are automatically normalized to ${lineEnding.toUpperCase()}.`,
        showConfirm: false,
        style: 'info',
        exclusiveType: '',
        action: () => {}
      })
    }

    if (pathname === currentFile.pathname) {
      state.currentFile = tab
      const { id, cursor, history } = tab
      bus.$emit('file-changed', { id, markdown, cursor, renderCursor: true, history })
    }
  },
  SET_PATHNAME (state, { tab, fileInfo }) {
    const { currentFile } = state
    const { filename, pathname, id } = fileInfo

    if (id === currentFile.id && pathname) {
      window.DIRNAME = path.dirname(pathname)
    }

    if (tab) {
      Object.assign(tab, { filename, pathname, isSaved: true })
    }
  },
  SET_SAVE_STATUS_BY_TAB (state, { tab, status }) {
    if (hasKeys(tab)) {
      tab.isSaved = status
    }
  },
  SET_SAVE_STATUS (state, status) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.isSaved = status
    }
  },
  SET_SAVE_STATUS_WHEN_REMOVE (state, { pathname }) {
    state.tabs.forEach(f => {
      if (f.pathname === pathname) {
        f.isSaved = false
      }
    })
  },
  SET_MARKDOWN (state, markdown) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.markdown = markdown
    }
  },
  SET_DOCUMENT_ENCODING (state, encoding) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.encoding = encoding
    }
  },
  SET_LINE_ENDING (state, lineEnding) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.lineEnding = lineEnding
    }
  },
  SET_FILE_ENCODING_BY_NAME (state, encodingName) {
    if (hasKeys(state.currentFile)) {
      const { encoding: encodingObj } = state.currentFile
      encodingObj.encoding = encodingName
      encodingObj.isBom = false
    }
  },
  SET_FINAL_NEWLINE (state, value) {
    if (hasKeys(state.currentFile) && value >= 0 && value <= 3) {
      state.currentFile.trimTrailingNewline = value
    }
  },
  SET_ADJUST_LINE_ENDING_ON_SAVE (state, adjustLineEndingOnSave) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.adjustLineEndingOnSave = adjustLineEndingOnSave
    }
  },
  SET_WORD_COUNT (state, wordCount) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.wordCount = wordCount
    }
  },
  SET_CURSOR (state, cursor) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.cursor = cursor
    }
  },
  SET_HISTORY (state, history) {
    if (hasKeys(state.currentFile)) {
      state.currentFile.history = history
    }
  },
  CLOSE_TABS (state, tabIdList) {
    if (!tabIdList || tabIdList.length === 0) return

    let tabIndex = 0
    tabIdList.forEach(id => {
      const index = state.tabs.findIndex(f => f.id === id)
      state.tabs.splice(index, 1)
      if (state.currentFile.id === id) {
        state.currentFile = {}
        window.DIRNAME = ''
        if (tabIdList.length === 1) {
          tabIndex = index
        }
      }
    })

    if (!state.currentFile.id && state.tabs.length) {
      state.currentFile = state.tabs[tabIndex] || state.tabs[tabIndex - 1] || state.tabs[0] || {}
      if (typeof state.currentFile.markdown === 'string') {
        const { id, markdown, cursor, history, pathname } = state.currentFile
        window.DIRNAME = pathname ? path.dirname(pathname) : ''
        bus.$emit('file-changed', { id, markdown, cursor, renderCursor: true, history })
      }
    }

    if (state.tabs.length === 0) {
      state.listToc = []
      state.toc = []
    }
  },
  RENAME_IF_NEEDED (state, { src, dest }) {
    const { tabs } = state
    tabs.forEach(f => {
      if (f.pathname === src) {
        f.pathname = dest
        f.filename = path.basename(dest)
      }
    })
  },
  PUSH_TAB_NOTIFICATION (state, data) {
    const defaultAction = () => {}
    const { tabId, msg } = data
    const action = data.action || defaultAction
    const showConfirm = data.showConfirm || false
    const style = data.style || 'info'
    const exclusiveType = data.exclusiveType || ''

    const { tabs } = state
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) {
      console.error('PUSH_TAB_NOTIFICATION: Cannot find tab in tab list.')
      return
    }

    const { notifications } = tab
    if (exclusiveType) {
      const index = notifications.findIndex(n => n.exclusiveType === exclusiveType)
      if (index >= 0) {
        notifications.splice(index, 1)
      }
    }
    notifications.push({ msg, showConfirm, style, exclusiveType, action })
  }
}

const actions = {
  FORMAT_LINK_CLICK ({ commit }, { data, dirname }) {
    handleFormatLinkClick(data, dirname)
  },

  LISTEN_SCREEN_SHOT ({ commit }) {
    onEvent('mt::screenshot-captured', () => {
      bus.$emit('screenshot-captured')
    })
  },

  ASK_FOR_IMAGE_AUTO_PATH ({ commit, state }, src) {
    const { pathname } = state.currentFile
    if (pathname) {
      let rs
      const promise = new Promise((resolve, reject) => { rs = resolve })
      const id = getUniqueId()
      onceEvent('mt::response-of-image-path-' + id, (files) => {
        rs(files)
      })
      handleImageAutoPath(pathname, src, id)
      return promise
    } else {
      return []
    }
  },

  SEARCH ({ commit }, value) {
    commit('SET_SEARCH', value)
  },

  SHOW_IMAGE_DELETION_URL ({ commit }, deletionUrl) {
    notice.notify({
      title: 'Image deletion URL',
      message: `Click to copy the deletion URL of the uploaded image to the clipboard (${deletionUrl}).`,
      showConfirm: true,
      time: 20000
    })
      .then(() => {
        clipboardWriteText(deletionUrl)
      })
  },

  FORCE_CLOSE_TAB ({ commit, dispatch }, file) {
    commit('REMOVE_FILE_WITHIN_TABS', file)
  },

  EXCHANGE_TABS_BY_ID ({ commit }, tabIDs) {
    commit('EXCHANGE_TABS_BY_ID', tabIDs)
  },

  UPDATE_LINE_ENDING_MENU ({ state }) {
    // no-op in Tauri (no native menu to update)
  },

  CLOSE_UNSAVED_TAB ({ commit, state }, file) {
    const { id, pathname, filename, markdown } = file
    const options = getOptionsFromState(file)
    saveAndCloseTabs([{ id, pathname, filename, markdown, options }])
  },

  LISTEN_FOR_SAVE ({ state, rootState }) {
    onEvent('mt::editor-ask-file-save', () => {
      const { id, filename, pathname, markdown } = state.currentFile
      const options = getOptionsFromState(state.currentFile)
      if (id) {
        fileSave({ id, filename, pathname, markdown, options })
      }
    })
  },

  LISTEN_FOR_SAVE_AS ({ state, rootState }) {
    onEvent('mt::editor-ask-file-save-as', () => {
      const { id, filename, pathname, markdown } = state.currentFile
      const options = getOptionsFromState(state.currentFile)
      if (id) {
        fileSaveAs({ id, filename, pathname, markdown, options })
      }
    })
  },

  LISTEN_FOR_SET_PATHNAME ({ commit, dispatch, state }) {
    onEvent('mt::set-pathname', (fileInfo) => {
      const { tabs } = state
      const { pathname, id } = fileInfo
      const tab = tabs.find(f => f.id === id)
      if (!tab) {
        console.error('[ERROR] Cannot change file path from unknown tab.')
        return
      }
      const existingTab = tabs.find(t => t.id !== id && isSamePathSync(t.pathname, pathname))
      if (existingTab) {
        dispatch('CLOSE_TAB', existingTab)
      }
      commit('SET_PATHNAME', { tab, fileInfo })
    })

    onEvent('mt::tab-saved', (data) => {
      const { tabs } = state
      const tabId = data?.id || data
      const tab = tabs.find(f => f.id === tabId)
      if (tab) {
        Object.assign(tab, { isSaved: true })
      }
    })

    onEvent('mt::tab-save-failure', (data) => {
      const { tabs } = state
      const tabId = data?.id || data
      const msg = data?.msg || 'Unknown error'
      const tab = tabs.find(t => t.id === tabId)
      if (!tab) {
        notice.notify({
          title: 'Save failure',
          message: msg,
          type: 'error',
          time: 20000,
          showConfirm: false
        })
        return
      }

      commit('SET_SAVE_STATUS_BY_TAB', { tab, status: false })
      commit('PUSH_TAB_NOTIFICATION', {
        tabId,
        msg: `There was an error while saving: ${msg}`,
        style: 'crit'
      })
    })
  },

  LISTEN_FOR_CLOSE ({ state }) {
    onEvent('mt::ask-for-close', () => {
      const unsavedFiles = state.tabs
        .filter(file => !file.isSaved)
        .map(file => {
          const { id, filename, pathname, markdown } = file
          const options = getOptionsFromState(file)
          return { id, filename, pathname, markdown, options }
        })

      if (unsavedFiles.length) {
        confirmCloseWindow(unsavedFiles)
      } else {
        closeWindow()
      }
    })
  },

  LISTEN_FOR_SAVE_CLOSE ({ commit }) {
    onEvent('mt::force-close-tabs-by-id', (tabIdList) => {
      if (Array.isArray(tabIdList) && tabIdList.length) {
        commit('CLOSE_TABS', tabIdList)
      }
    })
  },

  ASK_FOR_SAVE_ALL ({ commit, state }, closeTabs) {
    const { tabs } = state
    const unsavedFiles = tabs
      .filter(file => !(file.isSaved && /[^\n]/.test(file.markdown)))
      .map(file => {
        const { id, filename, pathname, markdown } = file
        const options = getOptionsFromState(file)
        return { id, filename, pathname, markdown, options }
      })

    if (closeTabs) {
      if (unsavedFiles.length) {
        commit('CLOSE_TABS', tabs.filter(f => f.isSaved).map(f => f.id))
        saveAndCloseTabs(unsavedFiles)
      } else {
        commit('CLOSE_TABS', tabs.map(f => f.id))
      }
    } else {
      for (const file of unsavedFiles) {
        fileSave(file)
      }
    }
  },

  LISTEN_FOR_MOVE_TO ({ state, rootState }) {
    onEvent('mt::editor-move-file', () => {
      const { id, filename, pathname, markdown } = state.currentFile
      const options = getOptionsFromState(state.currentFile)
      if (!id) return
      if (!pathname) {
        fileSave({ id, filename, pathname, markdown, options })
      } else {
        fileMoveTo(id, pathname)
      }
    })
  },

  LISTEN_FOR_RENAME ({ commit, state, dispatch }) {
    onEvent('mt::editor-rename-file', () => {
      dispatch('RESPONSE_FOR_RENAME')
    })
  },

  RESPONSE_FOR_RENAME ({ state, rootState }) {
    const { id, filename, pathname, markdown } = state.currentFile
    const options = getOptionsFromState(state.currentFile)
    if (!id) return
    if (!pathname) {
      fileSave({ id, filename, pathname, markdown, options })
    } else {
      bus.$emit('rename')
    }
  },

  RENAME ({ commit, state }, newFilename) {
    const { id, pathname, filename } = state.currentFile
    if (typeof filename === 'string' && filename !== newFilename) {
      const newPathname = path.join(path.dirname(pathname), newFilename)
      renameFile(pathname, newPathname).then(() => {
        commit('SET_PATHNAME', {
          tab: state.tabs.find(f => f.id === id),
          fileInfo: { id, pathname: newPathname, filename: newFilename }
        })
      })
    }
  },

  UPDATE_CURRENT_FILE ({ commit, state, dispatch }, currentFile) {
    commit('SET_CURRENT_FILE', currentFile)
    const { tabs } = state
    if (!tabs.some(file => file.id === currentFile.id)) {
      commit('ADD_FILE_TO_TABS', currentFile)
    }
  },

  LISTEN_FOR_BOOTSTRAP_WINDOW ({ commit, state, dispatch, rootState }) {
    setTimeout(() => {
      bus.$emit('cmd::register-command', new FileEncodingCommand(rootState.editor))
      bus.$emit('cmd::register-command', new QuickOpenCommand(rootState))
      bus.$emit('cmd::register-command', new LineEndingCommand(rootState.editor))
      bus.$emit('cmd::register-command', new TrailingNewlineCommand(rootState.editor))
      setTimeout(() => {
        bus.$emit('cmd::sort-commands')
      }, 100)
    }, 400)

    onEvent('mt::bootstrap-editor', (config) => {
      const {
        addBlankTab,
        markdownList,
        lineEnding,
        sideBarVisibility,
        tabBarVisibility,
        sourceCodeModeEnabled
      } = config

      dispatch('SEND_INITIALIZED')
      commit('SET_USER_PREFERENCE', { endOfLine: lineEnding })
      commit('SET_LAYOUT', {
        rightColumn: 'files',
        showSideBar: !!sideBarVisibility,
        showTabBar: !!tabBarVisibility
      })
      dispatch('DISPATCH_LAYOUT_MENU_ITEMS')

      commit('SET_MODE', {
        type: 'sourceCode',
        checked: !!sourceCodeModeEnabled
      })

      if (addBlankTab) {
        dispatch('NEW_UNTITLED_TAB', {})
      } else if (markdownList.length) {
        let isFirst = true
        for (const markdown of markdownList) {
          isFirst = false
          dispatch('NEW_UNTITLED_TAB', { markdown, selected: isFirst })
        }
      }
    })
  },

  LISTEN_FOR_NEW_TAB ({ dispatch }) {
    onEvent('mt::open-new-tab', (markdownDocument, options = {}, selected = true) => {
      if (markdownDocument) {
        dispatch('NEW_TAB_WITH_CONTENT', { markdownDocument, options, selected })
      } else {
        dispatch('NEW_UNTITLED_TAB', {})
      }
    })

    onEvent('mt::new-untitled-tab', (data) => {
      const selected = data?.selected ?? true
      const markdown = data?.markdown ?? ''
      dispatch('NEW_UNTITLED_TAB', { markdown, selected })
    })
  },

  LISTEN_FOR_CLOSE_TAB ({ commit, state, dispatch }) {
    onEvent('mt::editor-close-tab', () => {
      const file = state.currentFile
      if (!hasKeys(file)) return
      dispatch('CLOSE_TAB', file)
    })
  },

  LISTEN_FOR_TAB_CYCLE ({ commit, state, dispatch }) {
    onEvent('mt::tabs-cycle-left', () => {
      dispatch('CYCLE_TABS', false)
    })
    onEvent('mt::tabs-cycle-right', () => {
      dispatch('CYCLE_TABS', true)
    })
  },

  LISTEN_FOR_SWITCH_TABS ({ commit, state, dispatch }) {
    onEvent('mt::switch-tab-by-index', (index) => {
      dispatch('SWITCH_TAB_BY_INDEX', index)
    })
  },

  CLOSE_TAB ({ dispatch }, file) {
    const { isSaved } = file
    if (isSaved) {
      dispatch('FORCE_CLOSE_TAB', file)
    } else {
      dispatch('CLOSE_UNSAVED_TAB', file)
    }
  },

  CLOSE_OTHER_TABS ({ state, dispatch }, file) {
    const { tabs } = state
    tabs.filter(f => f.id !== file.id).forEach(tab => {
      dispatch('CLOSE_TAB', tab)
    })
  },

  CLOSE_SAVED_TABS ({ state, dispatch }) {
    const { tabs } = state
    tabs.filter(f => f.isSaved).forEach(tab => {
      dispatch('CLOSE_TAB', tab)
    })
  },

  CLOSE_ALL_TABS ({ state, dispatch }) {
    const { tabs } = state
    tabs.slice().forEach(tab => {
      dispatch('CLOSE_TAB', tab)
    })
  },

  RENAME_FILE ({ commit, dispatch }, file) {
    commit('SET_CURRENT_FILE', file)
    bus.$emit('rename')
  },

  CYCLE_TABS ({ commit, dispatch, state }, direction) {
    const { tabs, currentFile } = state
    if (tabs.length <= 1) return

    const currentIndex = tabs.findIndex(t => t.id === currentFile.id)
    if (currentIndex === -1) {
      console.error('CYCLE_TABS: Cannot find current tab index.')
      return
    }

    let nextTabIndex = 0
    if (!direction) {
      nextTabIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
    } else {
      nextTabIndex = (currentIndex + 1) % tabs.length
    }

    const nextTab = tabs[nextTabIndex]
    if (!nextTab || !nextTab.id) {
      console.error(`CYCLE_TABS: Cannot find next tab (index="${nextTabIndex}").`)
      return
    }

    commit('SET_CURRENT_FILE', nextTab)
  },

  SWITCH_TAB_BY_INDEX ({ commit, dispatch, state }, nextTabIndex) {
    const { tabs, currentFile } = state
    if (nextTabIndex < 0 || nextTabIndex >= tabs.length) return

    const currentIndex = tabs.findIndex(t => t.id === currentFile.id)
    if (currentIndex === -1) return

    const nextTab = tabs[nextTabIndex]
    if (!nextTab || !nextTab.id) return

    commit('SET_CURRENT_FILE', nextTab)
  },

  NEW_UNTITLED_TAB ({ commit, state, dispatch, rootState }, { markdown: markdownString, selected }) {
    if (selected == null) {
      selected = true
    }

    dispatch('SHOW_TAB_VIEW', false)

    const { defaultEncoding, endOfLine } = rootState.preferences
    const { tabs } = state
    const fileState = getBlankFileState(tabs, defaultEncoding, endOfLine, markdownString)

    if (selected) {
      const { id, markdown } = fileState
      dispatch('UPDATE_CURRENT_FILE', fileState)
      bus.$emit('file-loaded', { id, markdown })
    } else {
      commit('ADD_FILE_TO_TABS', fileState)
    }
  },

  NEW_TAB_WITH_CONTENT ({ commit, state, dispatch }, { markdownDocument, options = {}, selected }) {
    if (!markdownDocument) {
      console.warn('Cannot create a file tab without a markdown document!')
      dispatch('NEW_UNTITLED_TAB', {})
      return
    }

    if (typeof selected === 'undefined') {
      selected = true
    }
    const { currentFile, tabs } = state
    const { pathname } = markdownDocument
    const existingTab = tabs.find(t => isSamePathSync(t.pathname, pathname))
    if (existingTab) {
      dispatch('UPDATE_CURRENT_FILE', existingTab)
      return
    }

    let keepTabBarState = false
    if (currentFile) {
      const { isSaved, pathname } = currentFile
      if (isSaved && !pathname) {
        keepTabBarState = true
        dispatch('FORCE_CLOSE_TAB', currentFile)
      }
    }

    if (!keepTabBarState) {
      dispatch('SHOW_TAB_VIEW', false)
    }

    const { markdown, isMixedLineEndings } = markdownDocument
    const docState = createDocumentState(Object.assign(markdownDocument, options))
    const { id, cursor } = docState

    if (selected) {
      dispatch('UPDATE_CURRENT_FILE', docState)
      bus.$emit('file-loaded', { id, markdown, cursor })
    } else {
      commit('ADD_FILE_TO_TABS', docState)
    }

    if (isMixedLineEndings) {
      const { filename, lineEnding } = markdownDocument
      commit('PUSH_TAB_NOTIFICATION', {
        tabId: id,
        msg: `${filename}" has mixed line endings which are automatically normalized to ${lineEnding.toUpperCase()}.`
      })
    }
  },

  SHOW_TAB_VIEW ({ commit, state, dispatch }, always) {
    const { tabs } = state
    if (always || tabs.length === 1) {
      commit('SET_LAYOUT', { showTabBar: true })
      dispatch('DISPATCH_LAYOUT_MENU_ITEMS')
    }
  },

  LISTEN_FOR_CONTENT_CHANGE ({ commit, dispatch, state, rootState }, { id, markdown, wordCount, cursor, history, toc }) {
    const { autoSave } = rootState.preferences
    const {
      id: currentId,
      filename,
      pathname,
      markdown: oldMarkdown,
      trimTrailingNewline
    } = state.currentFile
    const { listToc } = state

    if (!id) {
      throw new Error('Listen for document change but id was not set!')
    } else if (!currentId || state.tabs.length === 0) {
      return
    } else if (id !== 'muya' && currentId !== id) {
      for (const tab of state.tabs) {
        if (tab.id && tab.id === id) {
          tab.markdown = adjustTrailingNewlines(markdown, tab.trimTrailingNewline)
          if (cursor) tab.cursor = cursor
          if (history) tab.history = history
          break
        }
      }
      return
    }

    markdown = adjustTrailingNewlines(markdown, trimTrailingNewline)
    commit('SET_MARKDOWN', markdown)

    if (oldMarkdown.length === 0 && markdown.length === 1 && markdown[0] === '\n') {
      return
    }

    if (wordCount) commit('SET_WORD_COUNT', wordCount)
    if (cursor) commit('SET_CURSOR', cursor)
    if (history) commit('SET_HISTORY', history)
    if (toc && !equal(toc, listToc)) commit('SET_TOC', toc)

    if (markdown !== oldMarkdown) {
      commit('SET_SAVE_STATUS', false)

      if (pathname && autoSave) {
        const options = getOptionsFromState(state.currentFile)
        dispatch('HANDLE_AUTO_SAVE', { id: currentId, filename, pathname, markdown, options })
      }
    }
  },

  HANDLE_AUTO_SAVE ({ commit, state, rootState }, { id, filename, pathname, markdown, options }) {
    if (!id || !pathname) {
      throw new Error('HANDLE_AUTO_SAVE: Invalid tab.')
    }

    const { tabs } = state
    const { autoSaveDelay } = rootState.preferences

    if (autoSaveTimers.has(id)) {
      const timer = autoSaveTimers.get(id)
      clearTimeout(timer)
      autoSaveTimers.delete(id)
    }

    const timer = setTimeout(() => {
      autoSaveTimers.delete(id)
      const tab = tabs.find(t => t.id === id)
      if (tab && !tab.isSaved) {
        fileSave({ id, filename, pathname, markdown, options })
      }
    }, autoSaveDelay)
    autoSaveTimers.set(id, timer)
  },

  SELECTION_CHANGE ({ commit }, changes) {
    const { start, end } = changes
    if (start.key === end.key && start.block.text) {
      const value = start.block.text.substring(start.offset, end.offset)
      commit('SET_SEARCH', { matches: [], index: -1, value })
    }
  },

  SELECTION_FORMATS (_, formats) {
    // no-op in Tauri
  },

  EXPORT ({ state }, { type, content, pageOptions }) {
    if (!hasKeys(state.currentFile)) return

    let title = ''
    const { listToc } = state
    if (listToc && listToc.length > 0) {
      let headerRef = listToc[0]
      const len = Math.min(listToc.length, 6)
      for (let i = 1; i < len; ++i) {
        if (headerRef.lvl === 1) break
        const header = listToc[i]
        if (headerRef.lvl > header.lvl) headerRef = header
      }
      title = headerRef.content
    }

    const { filename, pathname } = state.currentFile
    exportFile({ type, title, content, filename, pathname, pageOptions })
  },

  LINTEN_FOR_EXPORT_SUCCESS ({ commit }) {
    onEvent('mt::export-success', ({ type, filePath }) => {
      notice.notify({
        title: 'Exported successfully',
        message: `Exported "${path.basename(filePath)}" successfully!`,
        showConfirm: true
      })
        .then(() => {
          showItemInFolder(filePath)
        })
    })
  },

  PRINT_RESPONSE ({ commit }) {
    window.print()
  },

  LINTEN_FOR_PRINT_SERVICE_CLEARUP ({ commit }) {
    onEvent('mt::print-service-clearup', () => {
      bus.$emit('print-service-clearup')
    })
  },

  LINTEN_FOR_SET_LINE_ENDING ({ commit, dispatch, state }) {
    onEvent('mt::set-line-ending', (lineEnding) => {
      const { lineEnding: oldLineEnding } = state.currentFile
      if (lineEnding !== oldLineEnding) {
        commit('SET_LINE_ENDING', lineEnding)
        commit('SET_ADJUST_LINE_ENDING_ON_SAVE', lineEnding !== 'lf')
        commit('SET_SAVE_STATUS', true)
      }
    })
  },

  LINTEN_FOR_SET_ENCODING ({ commit, state }) {
    onEvent('mt::set-file-encoding', (encodingName) => {
      const { encoding } = state.currentFile.encoding
      if (encoding !== encodingName) {
        commit('SET_FILE_ENCODING_BY_NAME', encodingName)
        commit('SET_SAVE_STATUS', true)
      }
    })
  },

  LINTEN_FOR_SET_FINAL_NEWLINE ({ commit, state }) {
    onEvent('mt::set-final-newline', (value) => {
      const { trimTrailingNewline } = state.currentFile
      if (trimTrailingNewline !== value) {
        commit('SET_FINAL_NEWLINE', value)
        commit('SET_SAVE_STATUS', true)
      }
    })
  },

  LISTEN_FOR_FILE_CHANGE ({ commit, state, rootState }) {
    onEvent('mt::update-file', ({ type, change }) => {
      const { tabs } = state
      const { pathname } = change
      const tab = tabs.find(t => isSamePathSync(t.pathname, pathname))
      if (tab) {
        const { id, isSaved, filename } = tab
        switch (type) {
          case 'unlink': {
            commit('SET_SAVE_STATUS_BY_TAB', { tab, status: false })
            commit('PUSH_TAB_NOTIFICATION', {
              tabId: id,
              msg: `"${filename}" has been removed on disk.`,
              style: 'warn',
              showConfirm: false,
              exclusiveType: 'file_changed'
            })
            break
          }
          case 'add':
          case 'change': {
            const { autoSave } = rootState.preferences
            if (autoSave) {
              if (autoSaveTimers.has(id)) {
                const timer = autoSaveTimers.get(id)
                clearTimeout(timer)
                autoSaveTimers.delete(id)
              }
              if (isSaved) {
                commit('LOAD_CHANGE', change)
                return
              }
            }

            commit('SET_SAVE_STATUS_BY_TAB', { tab, status: false })
            commit('PUSH_TAB_NOTIFICATION', {
              tabId: id,
              msg: `"${filename}" has been changed on disk. Do you want to reload it?`,
              showConfirm: true,
              exclusiveType: 'file_changed',
              action: status => {
                if (status) commit('LOAD_CHANGE', change)
              }
            })
            break
          }
          default:
            console.error(`LISTEN_FOR_FILE_CHANGE: Invalid type "${type}"`)
        }
      } else {
        console.error(`LISTEN_FOR_FILE_CHANGE: Cannot find tab for path "${pathname}".`)
      }
    })
  },

  async ASK_FOR_IMAGE_PATH ({ commit }) {
    try {
      const selected = await showImagePathDialog()
      return selected || ''
    } catch (e) {
      return ''
    }
  },

  LISTEN_WINDOW_ZOOM ({ dispatch, rootState }) {
    onEvent('mt::window-zoom', (zoomFactor) => {
      zoomFactor = Number.parseFloat(zoomFactor.toFixed(3))
      const { zoom } = rootState.preferences
      if (zoom !== zoomFactor) {
        dispatch('SET_SINGLE_PREFERENCE', { type: 'zoom', value: zoomFactor })
      }
      setZoom(zoomFactor)
    })
  },

  LISTEN_FOR_RELOAD_IMAGES () {
    onEvent('mt::invalidate-image-cache', () => {
      bus.$emit('invalidate-image-cache')
    })
  },

  LISTEN_FOR_CONTEXT_MENU () {
    onEvent('mt::cm-copy-as-markdown', () => {
      bus.$emit('copyAsMarkdown', 'copyAsMarkdown')
    })
    onEvent('mt::cm-copy-as-html', () => {
      bus.$emit('copyAsHtml', 'copyAsHtml')
    })
    onEvent('mt::cm-paste-as-plain-text', () => {
      bus.$emit('pasteAsPlainText', 'pasteAsPlainText')
    })
    onEvent('mt::cm-insert-paragraph', (location) => {
      bus.$emit('insertParagraph', location)
    })
    onEvent('mt::spelling-replace-misspelling', (info) => {
      bus.$emit('replace-misspelling', info)
    })
    onEvent('mt::spelling-show-switch-language', () => {
      bus.$emit('open-command-spellchecker-switch-language')
    })
  }
}

const getRootFolderFromState = rootState => {
  const openedFolder = rootState.project.projectTree
  if (openedFolder) return openedFolder.pathname
  return ''
}

const adjustTrailingNewlines = (markdown, trimTrailingNewlineOption) => {
  if (!markdown) return ''
  switch (trimTrailingNewlineOption) {
    case 0:
      return trimTrailingNewlines(markdown)
    case 1: {
      const lastIndex = markdown.length - 1
      if (markdown[lastIndex] === '\n') {
        if (markdown.length === 1) return ''
        else if (markdown[lastIndex - 1] !== '\n') return markdown
      }
      markdown = trimTrailingNewlines(markdown)
      if (markdown.length === 0) return ''
      return markdown + '\n'
    }
    default:
      return markdown
  }
}

const trimTrailingNewlines = text => {
  return text.replace(/[\r?\n]+$/, '')
}

const createApplicationMenuState = ({ start, end, affiliation }) => {
  const state = {
    isDisabled: false,
    isMultiline: start.key !== end.key,
    isLooseListItem: false,
    isTaskList: false,
    isCodeFences: false,
    isCodeContent: false,
    isTable: false,
    affiliation: {}
  }
  const { isMultiline } = state

  if (
    (start.block.functionType === 'cellContent' && end.block.functionType === 'cellContent') ||
    (start.type === 'span' && start.block.functionType === 'codeContent') ||
    (end.type === 'span' && end.block.functionType === 'codeContent')
  ) {
    state.isCodeFences = true
    if (start.block.functionType === 'codeContent' || end.block.functionType === 'codeContent') {
      state.isCodeContent = true
    }
  }

  if (affiliation.length >= 1 && /ul|ol/.test(affiliation[0].type)) {
    const listBlock = affiliation[0]
    state.affiliation[listBlock.type] = true
    state.isLooseListItem = listBlock.children[0].isLooseListItem
    state.isTaskList = listBlock.listType === 'task'
  } else if (affiliation.length >= 3 && affiliation[1].type === 'li') {
    const listItem = affiliation[1]
    const listType = listItem.listItemType === 'order' ? 'ol' : 'ul'
    state.affiliation[listType] = true
    state.isLooseListItem = listItem.isLooseListItem
    state.isTaskList = listItem.listItemType === 'task'
  }

  for (const b of affiliation.slice(0, 3)) {
    if (b.type === 'pre' && b.functionType) {
      if (/frontmatter|html|multiplemath|code$/.test(b.functionType)) {
        state.isCodeFences = true
        state.affiliation[b.functionType] = true
      }
      break
    } else if (b.type === 'figure' && b.functionType) {
      if (b.functionType === 'table') {
        state.isTable = true
        state.isDisabled = true
      }
      break
    } else if (isMultiline && /^h{1,6}$/.test(b.type)) {
      state.affiliation = {}
      break
    } else {
      if (!state.affiliation[b.type]) {
        state.affiliation[b.type] = true
      }
    }
  }

  if (Object.getOwnPropertyNames(state.affiliation).length >= 2 && state.affiliation.p) {
    delete state.affiliation.p
  }
  if ((state.affiliation.ul || state.affiliation.ol) && state.affiliation.li) {
    delete state.affiliation.li
  }
  return state
}

const createSelectionFormatState = formats => {
  const state = {}
  for (const item of formats) {
    state[item.type] = true
  }
  return state
}

export default { state, mutations, actions }
