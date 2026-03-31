<template>
  <div class="editor-container">
    <side-bar v-if="init"></side-bar>
    <div class="editor-middle">
      <title-bar
        :project="projectTree"
        :pathname="currentFile.pathname || ''"
        :filename="currentFile.filename || 'Untitled'"
        :active="windowActive"
        :word-count="currentFile.wordCount"
        :platform="platform"
        :is-saved="currentFile.isSaved !== false"
      ></title-bar>
      <div class="editor-placeholder" v-if="!init"></div>
      <recent v-if="!hasFile && init"></recent>
      <editor-with-tabs
        v-if="hasFile && init"
        :markdown="currentFile.markdown"
        :cursor="currentFile.cursor"
        :source-code="sourceCode"
        :show-tab-bar="showTabBar"
        :text-direction="textDirection"
        :platform="platform"
      ></editor-with-tabs>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { listen } from '@tauri-apps/api/event'
import { dialog, fs } from '@/api/tauri-bridge'
import { addStyles, addThemeStyle } from '@/util/theme'
import bus from '@/bus'
import Recent from '@/components/recent'
import EditorWithTabs from '@/components/editorWithTabs'
import TitleBar from '@/components/titleBar'
import SideBar from '@/components/sideBar'
import path from 'path-browserify'

export default {
  name: 'marktext-tauri',
  components: {
    Recent,
    EditorWithTabs,
    TitleBar,
    SideBar,
  },
  computed: {
    ...mapState({
      platform: state => state.platform,
      windowActive: state => state.windowActive,
      init: state => state.init,
      currentFile: state => state.editor.currentFile,
      sourceCode: state => state.preferences.sourceCode,
      showTabBar: state => state.layout.showTabBar,
      textDirection: state => state.preferences.textDirection || 'ltr',
      projectTree: state => state.project.projectTree,
    }),
    hasFile () {
      return this.currentFile && typeof this.currentFile.markdown === 'string'
    }
  },
  async created () {
    listen('menu-event', (event) => {
      this.handleMenuEvent(event.payload)
    })

    listen('fs-change', (event) => {
      console.log('File changed:', event.payload)
    })

    this.$nextTick(() => {
      const style = window.marktext?.initialState || { theme: 'light' }
      addStyles(style)
      this.$store.dispatch('NEW_UNTITLED_TAB', {})
      this.$store.commit('SET_INITIALIZED')
    })
  },
  methods: {
    async handleMenuEvent (menuId) {
      switch (menuId) {
        case 'new-file':
        case 'new-tab':
          this.$store.dispatch('NEW_UNTITLED_TAB', {})
          break
        case 'new-window':
          try {
            const { invoke } = await import('@tauri-apps/api/core')
            await invoke('create_editor_window')
          } catch (e) {
            console.error('Failed to create new window:', e)
          }
          break
        case 'open-file': {
          const selected = await dialog.openFile({ multiple: true })
          if (selected) {
            const paths = Array.isArray(selected) ? selected : [selected]
            for (const filePath of paths) {
              await this.openFileByPath(filePath)
            }
          }
          break
        }
        case 'open-folder': {
          const folder = await dialog.openFolder()
          if (folder) {
            this.$store.commit('SET_ROOT_DIRECTORY', folder)
          }
          break
        }
        case 'save': {
          await this.saveCurrentFile()
          break
        }
        case 'save-as': {
          await this.saveCurrentFileAs()
          break
        }
        case 'toggle-sidebar':
          this.$store.commit('TOGGLE_LAYOUT_ENTRY', 'showSideBar')
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

    async openFileByPath (filePath) {
      try {
        const result = await fs.readMarkdownFile(filePath)
        const filename = filePath.split(/[/\\]/).pop()
        const markdownDocument = {
          markdown: result.content || result,
          filename,
          pathname: filePath,
          encoding: {
            encoding: result.encoding || 'utf8',
            isBom: false
          },
          lineEnding: result.lineEnding || 'lf',
          adjustLineEndingOnSave: false,
          trimTrailingNewline: 3
        }
        this.$store.dispatch('NEW_TAB_WITH_CONTENT', { markdownDocument, selected: true })
      } catch (e) {
        console.error('Failed to open file:', e)
      }
    },

    async saveCurrentFile () {
      const { currentFile } = this
      if (!currentFile || !currentFile.id) return

      if (currentFile.pathname) {
        try {
          const markdown = currentFile.markdown || ''
          await fs.writeMarkdownFile(
            currentFile.pathname,
            markdown,
            currentFile.encoding?.encoding || 'utf8',
            currentFile.lineEnding || 'lf'
          )
          this.$store.commit('SET_SAVE_STATUS', true)
        } catch (e) {
          console.error('Failed to save file:', e)
        }
      } else {
        await this.saveCurrentFileAs()
      }
    },

    async saveCurrentFileAs () {
      const { currentFile } = this
      if (!currentFile || !currentFile.id) return

      const filePath = await dialog.saveFile({
        defaultPath: currentFile.filename
      })
      if (filePath) {
        try {
          const markdown = currentFile.markdown || ''
          await fs.writeMarkdownFile(
            filePath,
            markdown,
            currentFile.encoding?.encoding || 'utf8',
            currentFile.lineEnding || 'lf'
          )
          this.$store.commit('SET_SAVE_STATUS', true)
        } catch (e) {
          console.error('Failed to save file:', e)
        }
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
