import { defineStore } from 'pinia'
import { preferencesApi } from '../api/tauri-bridge'

export const useAppStore = defineStore('app', {
  state: () => ({
    platform: navigator.platform.includes('Win') ? 'win32'
      : navigator.platform.includes('Mac') ? 'darwin' : 'linux',
    appVersion: '0.17.1',
    windowActive: true,
    init: false,
  }),

  actions: {
    setWindowActive (status) {
      this.windowActive = status
    },
    setInitialized () {
      this.init = true
    },
  },
})
