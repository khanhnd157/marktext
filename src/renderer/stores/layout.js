import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    showSideBar: false,
    showTabBar: true,
    rightColumn: 'files',
    showCommandPalette: false,
    sideBarWidth: 280,
  }),

  actions: {
    toggleSideBar () {
      this.showSideBar = !this.showSideBar
    },
    toggleTabBar () {
      this.showTabBar = !this.showTabBar
    },
    toggleCommandPalette () {
      this.showCommandPalette = !this.showCommandPalette
    },
    setSideBarView (view) {
      this.rightColumn = view
    },
    setSideBarWidth (width) {
      this.sideBarWidth = width
    },
  },
})
