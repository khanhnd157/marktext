import bus from '../bus'
import { onEvent } from '@/services/tauri-events'

const state = {}

const getters = {}

const mutations = {}

const actions = {
  LISTEN_FOR_EDIT ({ commit }) {
    onEvent('mt::editor-edit-action', (type) => {
      if (type === 'findInFolder') {
        commit('SET_LAYOUT', {
          rightColumn: 'search',
          showSideBar: true
        })
      }
      bus.$emit(type, type)
    })
  },

  LISTEN_FOR_SHOW_DIALOG ({ commit }) {
    onEvent('mt::about-dialog', () => {
      bus.$emit('aboutDialog')
    })
    onEvent('mt::show-export-dialog', (type) => {
      bus.$emit('showExportDialog', type)
    })
  },

  LISTEN_FOR_PARAGRAPH_INLINE_STYLE () {
    onEvent('mt::editor-paragraph-action', ({ type }) => {
      bus.$emit('paragraph', type)
    })
    onEvent('mt::editor-format-action', ({ type }) => {
      bus.$emit('format', type)
    })
  }
}

const listenForMain = { state, getters, mutations, actions }

export default listenForMain
