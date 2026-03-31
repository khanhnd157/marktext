import notice from '../services/notification'
import { onEvent } from '@/services/tauri-events'

const state = {}

const getters = {}

const mutations = {}

const actions = {
  LISTEN_FOR_UPDATE ({ commit }) {
    onEvent('mt::UPDATE_ERROR', (message) => {
      notice.notify({
        title: 'Update',
        type: 'error',
        time: 10000,
        message
      })
    })
    onEvent('mt::UPDATE_NOT_AVAILABLE', (message) => {
      notice.notify({
        title: 'Update not Available',
        type: 'primary',
        message
      })
    })
    onEvent('mt::UPDATE_DOWNLOADED', (message) => {
      notice.notify({
        title: 'Update Downloaded',
        type: 'info',
        message
      })
    })
    onEvent('mt::UPDATE_AVAILABLE', (message) => {
      notice.notify({
        title: 'Update Available',
        type: 'primary',
        message,
        showConfirm: true
      })
    })
  }
}

export default { state, getters, mutations, actions }
