import bus from '../bus'
import { onEvent } from '@/services/tauri-events'

const width = localStorage.getItem('side-bar-width')
const sideBarWidth = typeof +width === 'number' ? Math.max(+width, 220) : 280

const state = {
  rightColumn: 'files',
  showSideBar: false,
  showTabBar: false,
  sideBarWidth
}

const getters = {}

const mutations = {
  SET_LAYOUT (state, layout) {
    Object.assign(state, layout)
  },
  TOGGLE_LAYOUT_ENTRY (state, entryName) {
    state[entryName] = !state[entryName]
  },
  SET_SIDE_BAR_WIDTH (state, width) {
    localStorage.setItem('side-bar-width', Math.max(+width, 220))
    state.sideBarWidth = width
  }
}

const actions = {
  LISTEN_FOR_LAYOUT ({ state, commit, dispatch }) {
    onEvent('mt::set-view-layout', (layout) => {
      if (layout.rightColumn) {
        commit('SET_LAYOUT', {
          ...layout,
          rightColumn: layout.rightColumn === state.rightColumn ? '' : layout.rightColumn,
          showSideBar: true
        })
      } else {
        commit('SET_LAYOUT', layout)
      }
      dispatch('DISPATCH_LAYOUT_MENU_ITEMS')
    })

    onEvent('mt::toggle-view-layout-entry', (entryName) => {
      commit('TOGGLE_LAYOUT_ENTRY', entryName)
      dispatch('DISPATCH_LAYOUT_MENU_ITEMS')
    })

    bus.$on('view:toggle-layout-entry', entryName => {
      commit('TOGGLE_LAYOUT_ENTRY', entryName)
    })
  },

  DISPATCH_LAYOUT_MENU_ITEMS ({ state }) {
    // no-op in Tauri
  },

  CHANGE_SIDE_BAR_WIDTH ({ commit }, width) {
    commit('SET_SIDE_BAR_WIDTH', width)
  }
}

export default { state, getters, mutations, actions }
