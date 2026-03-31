import { defineStore } from 'pinia'
import { preferencesApi } from '../api/tauri-bridge'

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    autoSave: false,
    autoPairBracket: true,
    autoPairMarkdownSyntax: true,
    autoPairQuote: true,
    bulletListMarker: '-',
    codeFontFamily: '',
    codeFontSize: 14,
    codeBlockLineNumbers: false,
    editorFontFamily: 'Open Sans',
    editorFontSize: 16,
    editorLineWidth: '',
    endOfLine: 'default',
    fileEncoding: 'utf-8',
    hideScrollbar: false,
    listIndentation: '1',
    markdownExtensions: ['md', 'markdown', 'mmd', 'mdown', 'mdtxt', 'mdtext'],
    orderedListDelimiter: '.',
    preferHeadingStyle: 'atx',
    preferLooseListItem: true,
    sidebar: false,
    tabSize: 4,
    textDirection: 'ltr',
    theme: 'light',
    titleBarStyle: 'custom',
    zoom: 1.0,
  }),

  actions: {
    async loadPreferences () {
      try {
        const prefs = await preferencesApi.getAll()
        if (prefs && typeof prefs === 'object') {
          Object.keys(prefs).forEach(key => {
            if (key in this.$state) {
              this.$state[key] = prefs[key]
            }
          })
        }
      } catch (err) {
        console.error('Failed to load preferences:', err)
      }
    },

    async setPreference (key, value) {
      if (key in this.$state) {
        this.$state[key] = value
      }
      try {
        await preferencesApi.set(key, value)
      } catch (err) {
        console.error('Failed to save preference:', err)
      }
    },
  },
})
