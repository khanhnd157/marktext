import { createStore } from 'vuex'
import { onEvent } from '@/services/tauri-events'

import listenForMain from './listenForMain'
import project from './project'
import editor from './editor'
import layout from './layout'
import preferences from './preferences'
import autoUpdates from './autoUpdates'
import notification from './notification'
import tweet from './tweet'
import commandCenter from './commandCenter'

const state = {
  platform: process.platform,
  appVersion: (process.versions && process.versions.MARKTEXT_VERSION_STRING) || '0.17.1',
  windowActive: true,
  init: false
}

const getters = {}

const mutations = {
  SET_WIN_STATUS (state, status) {
    state.windowActive = status
  },
  SET_INITIALIZED (state) {
    state.init = true
  }
}

const actions = {
  LINTEN_WIN_STATUS ({ commit, state }) {
    onEvent('mt::window-active-status', ({ status }) => {
      commit('SET_WIN_STATUS', status)
    })
  },

  SEND_INITIALIZED ({ commit }) {
    commit('SET_INITIALIZED')
  }
}

const store = createStore({
  state,
  getters,
  mutations,
  actions,
  modules: {
    listenForMain,
    autoUpdates,
    notification,
    tweet,
    project,
    preferences,
    editor,
    layout,
    commandCenter
  }
})

export default store
