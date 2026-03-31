import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    currentFile: null,
    tabs: [],
    activeTab: null,
    wordCount: { word: 0, character: 0, paragraph: 0 },
    cursor: { line: 0, column: 0 },
    searchMatches: { index: -1, matches: 0, value: '' },
    sourceCode: false,
    typewriter: false,
    focus: false,
    markdown: '',
  }),

  getters: {
    hasCurrentFile: (state) => !!state.currentFile,
    isSourceMode: (state) => state.sourceCode,
  },

  actions: {
    setCurrentFile (file) {
      this.currentFile = file
    },
    addTab (tab) {
      const exists = this.tabs.find(t => t.path === tab.path)
      if (!exists) {
        this.tabs.push(tab)
      }
      this.activeTab = tab.path
    },
    removeTab (path) {
      this.tabs = this.tabs.filter(t => t.path !== path)
      if (this.activeTab === path) {
        this.activeTab = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].path : null
      }
    },
    setActiveTab (path) {
      this.activeTab = path
    },
    updateWordCount (count) {
      this.wordCount = count
    },
    updateCursor (cursor) {
      this.cursor = cursor
    },
    toggleSourceCode () {
      this.sourceCode = !this.sourceCode
    },
    toggleTypewriter () {
      this.typewriter = !this.typewriter
    },
    toggleFocus () {
      this.focus = !this.focus
    },
    setMarkdown (markdown) {
      this.markdown = markdown
    },
  },
})
