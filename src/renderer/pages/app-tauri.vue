<template>
  <div class="editor-container">
    <side-bar></side-bar>
    <div class="editor-middle">
      <title-bar
        :project="projectTree"
        :pathname="pathname"
        :filename="filename"
        :active="windowActive"
        :word-count="wordCount"
        :platform="platform"
        :is-saved="isSaved"
      ></title-bar>
      <div class="editor-placeholder" v-if="!init"></div>
      <recent v-if="!hasCurrentFile && init"></recent>
      <editor-with-tabs
        v-if="hasCurrentFile && init"
        :markdown="markdown"
        :cursor="cursor"
        :source-code="sourceCode"
        :show-tab-bar="showTabBar"
        :text-direction="textDirection"
        :platform="platform"
      ></editor-with-tabs>
      <command-palette></command-palette>
      <about-dialog></about-dialog>
      <export-setting-dialog></export-setting-dialog>
      <rename-dialog></rename-dialog>
      <tweet></tweet>
      <import-modal></import-modal>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { appDataDir } from '@tauri-apps/api/path'
import { emitEvent } from '@/services/tauri-events'
import { addStyles, addThemeStyle } from '@/util/theme'
import bus from '@/bus'
import Recent from '@/components/recent'
import EditorWithTabs from '@/components/editorWithTabs'
import TitleBar from '@/components/titleBar'
import SideBar from '@/components/sideBar'
import AboutDialog from '@/components/about'
import CommandPalette from '@/components/commandPalette'
import ExportSettingDialog from '@/components/exportSettings'
import RenameDialog from '@/components/rename'
import Tweet from '@/components/tweet'
import ImportModal from '@/components/import'

export default {
  name: 'marktext-tauri',
  components: {
    Recent,
    EditorWithTabs,
    TitleBar,
    SideBar,
    AboutDialog,
    ExportSettingDialog,
    RenameDialog,
    Tweet,
    ImportModal,
    CommandPalette
  },
  computed: {
    ...mapState({
      showTabBar: state => state.layout.showTabBar,
      sourceCode: state => state.preferences.sourceCode,
      theme: state => state.preferences.theme,
      textDirection: state => state.preferences.textDirection || 'ltr',
      zoom: state => state.preferences.zoom
    }),
    ...mapState({
      projectTree: state => state.project.projectTree,
      pathname: state => state.editor.currentFile.pathname,
      filename: state => state.editor.currentFile.filename,
      isSaved: state => state.editor.currentFile.isSaved,
      markdown: state => state.editor.currentFile.markdown,
      cursor: state => state.editor.currentFile.cursor,
      wordCount: state => state.editor.currentFile.wordCount
    }),
    ...mapState([
      'windowActive', 'platform', 'init'
    ]),
    hasCurrentFile () {
      return this.markdown !== undefined
    }
  },
  watch: {
    theme (value, oldValue) {
      if (value !== oldValue) {
        addThemeStyle(value)
      }
    },
    zoom (factor) {
      document.body.style.zoom = String(factor)
    }
  },
  async created () {
    const { commit, dispatch } = this.$store

    await this.initGlobalMarktext()
    await this.loadPreferences()

    dispatch('LISTEN_COMMAND_CENTER_BUS')
    dispatch('LISTEN_FOR_TWEET')
    dispatch('LISTEN_FOR_LAYOUT')
    dispatch('LISTEN_FOR_EDIT')
    dispatch('LISTEN_FOR_VIEW')
    dispatch('LISTEN_FOR_SHOW_DIALOG')
    dispatch('LISTEN_FOR_PARAGRAPH_INLINE_STYLE')
    dispatch('LISTEN_FOR_UPDATE_PROJECT')
    dispatch('LISTEN_FOR_LOAD_PROJECT')
    dispatch('LISTEN_FOR_SIDEBAR_CONTEXT_MENU')
    dispatch('LISTEN_TOGGLE_VIEW')
    dispatch('LISTEN_FOR_CLOSE')
    dispatch('LISTEN_FOR_SAVE_AS')
    dispatch('LISTEN_FOR_MOVE_TO')
    dispatch('LISTEN_FOR_SAVE')
    dispatch('LISTEN_FOR_SET_PATHNAME')
    dispatch('LISTEN_FOR_SAVE_CLOSE')
    dispatch('LISTEN_FOR_RENAME')
    dispatch('LINTEN_FOR_SET_LINE_ENDING')
    dispatch('LINTEN_FOR_SET_ENCODING')
    dispatch('LINTEN_FOR_SET_FINAL_NEWLINE')
    dispatch('LISTEN_FOR_NEW_TAB')
    dispatch('LISTEN_FOR_CLOSE_TAB')
    dispatch('LISTEN_FOR_TAB_CYCLE')
    dispatch('LISTEN_FOR_SWITCH_TABS')
    dispatch('LINTEN_FOR_EXPORT_SUCCESS')
    dispatch('LISTEN_FOR_FILE_CHANGE')
    dispatch('LISTEN_FOR_RELOAD_IMAGES')
    dispatch('LISTEN_FOR_NOTIFICATION')

    bus.$on('menu-event', (menuId) => {
      this.handleMenuEvent(menuId)
    })

    listen('fs-change', (event) => {
      const { path: filePath, kind } = event.payload || {}
      if (filePath && kind) {
        emitEvent('mt::update-file', { type: kind, change: { pathname: filePath, data: { markdown: '', filename: filePath.split(/[/\\]/).pop() } } })
      }
    })

    this.setupDragDrop()
    this.setupKeyboardShortcuts()

    this.$nextTick(() => {
      const theme = this.theme || 'light'
      addStyles({ theme })
      addThemeStyle(theme)

      commit('SET_LAYOUT', {
        rightColumn: 'files',
        showSideBar: !!this.$store.state.preferences.sideBarVisibility,
        showTabBar: !!this.$store.state.preferences.tabBarVisibility
      })

      dispatch('NEW_UNTITLED_TAB', {})
      commit('SET_INITIALIZED')
    })
  },
  methods: {
    async initGlobalMarktext () {
      let userDataPath = ''
      try {
        userDataPath = await appDataDir()
      } catch (_) {
        userDataPath = ''
      }
      const sep = navigator.platform.includes('Win') ? '\\' : '/'
      const join = (...parts) => parts.join(sep)
      const currentDate = new Date()
      global.marktext = {
        initialState: {},
        env: {
          debug: false,
          paths: null,
          windowId: 1,
          type: 'editor'
        },
        paths: {
          userDataPath,
          electronUserDataPath: userDataPath,
          logPath: join(userDataPath, 'logs', `${currentDate.getFullYear()}${currentDate.getMonth() + 1}`),
          preferencesPath: userDataPath,
          dataCenterPath: userDataPath,
          preferencesFilePath: join(userDataPath, 'preference.json'),
          ripgrepBinaryPath: ''
        }
      }
      global.marktext.env.paths = global.marktext.paths
    },

    async loadPreferences () {
      try {
        const prefs = await invoke('get_preferences')
        if (prefs && typeof prefs === 'object') {
          this.$store.commit('SET_USER_PREFERENCE', prefs)
        }
      } catch (e) {
        console.warn('Failed to load preferences:', e)
      }
    },

    setupDragDrop () {
      window.addEventListener('dragover', e => {
        if (!e.dataTransfer.types.length) return
        if (e.dataTransfer.types.indexOf('Files') >= 0) {
          if (e.dataTransfer.items.length === 1 && e.dataTransfer.items[0].type.indexOf('image') > -1) {
            // handled by muya
          } else {
            e.preventDefault()
            if (this.timer) clearTimeout(this.timer)
            this.timer = setTimeout(() => bus.$emit('importDialog', false), 300)
            bus.$emit('importDialog', true)
          }
          e.dataTransfer.dropEffect = 'copy'
        } else {
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'none'
        }
      }, false)
    },

    setupKeyboardShortcuts () {
      window.addEventListener('keydown', (e) => {
        const mod = e.ctrlKey || e.metaKey
        if (!mod) return

        switch (e.key) {
          case 's':
            e.preventDefault()
            if (e.shiftKey) {
              this.handleMenuEvent('save-as')
            } else {
              this.handleMenuEvent('save')
            }
            break
          case 'n':
            e.preventDefault()
            if (e.shiftKey) {
              this.handleMenuEvent('new-window')
            } else {
              this.handleMenuEvent('new-file')
            }
            break
          case 'o':
            e.preventDefault()
            this.handleMenuEvent('open-file')
            break
          case 'w':
            e.preventDefault()
            this.handleCloseTab()
            break
          case 'f':
            e.preventDefault()
            if (e.shiftKey) {
              this.handleMenuEvent('replace')
            } else {
              this.handleMenuEvent('find')
            }
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              bus.$emit('redo')
            } else {
              bus.$emit('undo')
            }
            break
          case 'b':
            e.preventDefault()
            bus.$emit('format', { type: 'strong' })
            break
          case 'i':
            e.preventDefault()
            bus.$emit('format', { type: 'em' })
            break
          case 'u':
            e.preventDefault()
            bus.$emit('format', { type: 'u' })
            break
          case 'p':
            if (e.shiftKey) {
              e.preventDefault()
              bus.$emit('show-command-palette')
            }
            break
          case 'l':
            e.preventDefault()
            this.$store.commit('TOGGLE_LAYOUT_ENTRY', 'showSideBar')
            break
          case '=':
          case '+':
            e.preventDefault()
            this.handleZoom(0.1)
            break
          case '-':
            e.preventDefault()
            this.handleZoom(-0.1)
            break
          case '0':
            e.preventDefault()
            document.body.style.zoom = '1'
            break
        }
      })
    },

    handleZoom (delta) {
      const current = parseFloat(document.body.style.zoom) || 1
      const next = Math.max(0.5, Math.min(2.0, current + delta))
      document.body.style.zoom = String(next)
    },

    handleCloseTab () {
      const { currentFile } = this.$store.state.editor
      if (currentFile && currentFile.id) {
        this.$store.dispatch('CLOSE_TAB', currentFile)
      }
    },

    async handleMenuEvent (menuId) {
      switch (menuId) {
        case 'new-file':
        case 'new-tab':
          this.$store.dispatch('NEW_UNTITLED_TAB', {})
          break
        case 'new-window':
          invoke('create_editor_window').catch(e => console.error(e))
          break
        case 'open-file':
          this.openFile()
          break
        case 'open-folder':
          this.openFolder()
          break
        case 'save':
          this.saveFile()
          break
        case 'save-as':
          this.saveFileAs()
          break
        case 'close-window':
        case 'quit':
          invoke('close_window').catch(() => {})
          break
        case 'toggle-sidebar':
          this.$store.commit('TOGGLE_LAYOUT_ENTRY', 'showSideBar')
          break
        case 'toggle-toc':
          this.$store.commit('TOGGLE_LAYOUT_ENTRY', 'rightColumn')
          break
        case 'source-code':
          this.$store.commit('TOGGLE_VIEW_MODE', 'sourceCode')
          break
        case 'typewriter':
          this.$store.commit('TOGGLE_VIEW_MODE', 'typewriter')
          break
        case 'focus':
          this.$store.commit('TOGGLE_VIEW_MODE', 'focus')
          break
        case 'undo':
          bus.$emit('undo')
          break
        case 'redo':
          bus.$emit('redo')
          break
        case 'copy-as-markdown':
          bus.$emit('copyAsMarkdown', 'copyAsMarkdown')
          break
        case 'copy-as-html':
          bus.$emit('copyAsHtml', 'copyAsHtml')
          break
        case 'paste-as-plain':
          bus.$emit('pasteAsPlainText', 'pasteAsPlainText')
          break
        case 'select-all':
          bus.$emit('selectAll')
          break
        case 'find':
          bus.$emit('find', { type: 'search' })
          break
        case 'replace':
          bus.$emit('find', { type: 'replace' })
          break
        case 'zoom-in':
          this.handleZoom(0.1)
          break
        case 'zoom-out':
          this.handleZoom(-0.1)
          break
        case 'zoom-reset':
          document.body.style.zoom = '1'
          break
        case 'about':
          bus.$emit('aboutDialog')
          break
        case 'export-html':
          bus.$emit('showExportDialog', 'html')
          break
        case 'export-pdf':
          bus.$emit('showExportDialog', 'pdf')
          break
        case 'print':
          window.print()
          break
        case 'website':
          import('@tauri-apps/plugin-opener').then(m => m.openUrl('https://github.com/marktext/marktext'))
          break
        case 'report-bug':
          import('@tauri-apps/plugin-opener').then(m => m.openUrl('https://github.com/marktext/marktext/issues'))
          break
        case 'check-update':
          bus.$emit('checkUpdate')
          break
        case 'heading-1':
        case 'heading-2':
        case 'heading-3':
        case 'heading-4':
        case 'heading-5':
        case 'heading-6': {
          const level = parseInt(menuId.split('-')[1])
          bus.$emit('paragraph', { type: `heading ${level}` })
          break
        }
        case 'paragraph':
          bus.$emit('paragraph', { type: 'paragraph' })
          break
        case 'table':
          bus.$emit('paragraph', { type: 'table' })
          break
        case 'code-block':
          bus.$emit('paragraph', { type: 'pre' })
          break
        case 'quote-block':
          bus.$emit('paragraph', { type: 'blockquote' })
          break
        case 'math-block':
          bus.$emit('paragraph', { type: 'mathblock' })
          break
        case 'ordered-list':
          bus.$emit('paragraph', { type: 'ol-order' })
          break
        case 'bullet-list':
          bus.$emit('paragraph', { type: 'ul-bullet' })
          break
        case 'task-list':
          bus.$emit('paragraph', { type: 'ul-task' })
          break
        case 'bold':
          bus.$emit('format', { type: 'strong' })
          break
        case 'italic':
          bus.$emit('format', { type: 'em' })
          break
        case 'underline':
          bus.$emit('format', { type: 'u' })
          break
        case 'strikethrough':
          bus.$emit('format', { type: 'del' })
          break
        case 'inline-code':
          bus.$emit('format', { type: 'inline_code' })
          break
        case 'inline-math':
          bus.$emit('format', { type: 'inline_math' })
          break
        case 'hyperlink':
          bus.$emit('format', { type: 'link' })
          break
        case 'image':
          bus.$emit('format', { type: 'image' })
          break
        default:
          console.log('Unhandled menu event:', menuId)
      }
    },

    async openFile () {
      const selected = await open({
        multiple: true,
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown', 'mmd', 'mdown', 'mdtxt', 'mdtext', 'rmd'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (!selected) return
      const paths = Array.isArray(selected) ? selected : [selected]
      for (const filePath of paths) {
        await this.openFileByPath(filePath)
      }
    },

    async openFileByPath (filePath) {
      try {
        const result = await invoke('read_markdown_file', { path: filePath })
        const filename = filePath.split(/[/\\]/).pop()
        const markdownDocument = {
          markdown: result.content || result,
          filename,
          pathname: filePath,
          encoding: { encoding: result.encoding || 'utf8', isBom: false },
          lineEnding: result.lineEnding || 'lf',
          adjustLineEndingOnSave: false,
          trimTrailingNewline: 3
        }
        this.$store.dispatch('NEW_TAB_WITH_CONTENT', { markdownDocument, selected: true })
      } catch (e) {
        console.error('Failed to open file:', e)
      }
    },

    async openFolder () {
      const folder = await open({ directory: true })
      if (folder) {
        this.$store.commit('SET_ROOT_DIRECTORY', folder)
        this.$store.commit('TOGGLE_LAYOUT_ENTRY', 'showSideBar')
        await this.populateTree(folder)
      }
    },

    async populateTree (dirPath) {
      try {
        const entries = await invoke('list_directory', { path: dirPath })
        if (!Array.isArray(entries)) return
        for (const entry of entries) {
          const entryPath = entry.path || (dirPath.replace(/[\\/]$/, '') + '/' + entry.name)
          if (entry.is_dir) {
            this.$store.commit('ADD_DIRECTORY', {
              name: entry.name,
              pathname: entryPath
            })
            await this.populateTree(entryPath)
          } else {
            const ext = (entry.name.split('.').pop() || '').toLowerCase()
            const mdExts = ['md', 'markdown', 'mmd', 'mdown', 'mdtxt', 'mdtext', 'rmd']
            this.$store.commit('ADD_FILE', {
              name: entry.name,
              pathname: entryPath,
              isDirectory: false,
              isFile: true,
              isMarkdown: mdExts.includes(ext),
              birthTime: new Date()
            })
          }
        }
      } catch (e) {
        console.warn('Failed to list directory:', dirPath, e)
      }
    },

    async saveFile () {
      const { currentFile } = this.$store.state.editor
      if (!currentFile || !currentFile.id) return

      if (currentFile.pathname) {
        try {
          await invoke('write_markdown_file', {
            path: currentFile.pathname,
            content: currentFile.markdown || '',
            encoding: currentFile.encoding?.encoding || 'utf8',
            lineEnding: currentFile.lineEnding || 'lf'
          })
          this.$store.commit('SET_SAVE_STATUS', true)
        } catch (e) {
          console.error('Save failed:', e)
        }
      } else {
        await this.saveFileAs()
      }
    },

    async saveFileAs () {
      const { currentFile } = this.$store.state.editor
      if (!currentFile || !currentFile.id) return

      const filePath = await save({
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: currentFile.filename
      })
      if (!filePath) return

      try {
        await invoke('write_markdown_file', {
          path: filePath,
          content: currentFile.markdown || '',
          encoding: currentFile.encoding?.encoding || 'utf8',
          lineEnding: currentFile.lineEnding || 'lf'
        })
        const filename = filePath.split(/[/\\]/).pop()
        const tab = this.$store.state.editor.tabs.find(t => t.id === currentFile.id)
        if (tab) {
          Object.assign(tab, { pathname: filePath, filename, isSaved: true })
        }
      } catch (e) {
        console.error('Save-as failed:', e)
      }
    }
  }
}
</script>

<style scoped>
  .editor-placeholder,
  .editor-container {
    display: flex;
    flex-direction: row;
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .editor-container .hide {
    z-index: -1;
    opacity: 0;
    position: absolute;
    left: -10000px;
  }
  .editor-placeholder {
    background: var(--editorBgColor);
  }
  .editor-middle {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100vh;
    position: relative;
    & > .editor {
      flex: 1;
    }
  }
</style>
