import { defineStore } from 'pinia'
import { fs as tauriFs } from '../api/tauri-bridge'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectPath: '',
    treeData: [],
    openedFiles: [],
    searchResult: [],
    searchValue: '',
  }),

  getters: {
    hasProject: (state) => !!state.projectPath,
  },

  actions: {
    async openProject (path) {
      this.projectPath = path
      await this.loadTree(path)
    },

    async loadTree (path) {
      try {
        const entries = await tauriFs.listDirectory(path)
        this.treeData = entries
      } catch (err) {
        console.error('Failed to load tree:', err)
      }
    },

    closeProject () {
      this.projectPath = ''
      this.treeData = []
    },

    addOpenedFile (file) {
      if (!this.openedFiles.find(f => f.path === file.path)) {
        this.openedFiles.push(file)
      }
    },

    removeOpenedFile (path) {
      this.openedFiles = this.openedFiles.filter(f => f.path !== path)
    },
  },
})
