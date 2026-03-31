import notice from '../services/notification'
import { openExternal } from '@/services/tauri-api'
import { onEvent } from '@/services/tauri-events'

const state = {}

const getters = {}

const mutations = {}

const actions = {
  LISTEN_FOR_NOTIFICATION ({ commit }) {
    const DEFAULT_OPTS = {
      title: 'Infomation',
      type: 'primary',
      time: 10000,
      message: 'You should never see this message'
    }

    onEvent('mt::show-notification', (opts) => {
      const options = Object.assign(DEFAULT_OPTS, opts)
      notice.notify(options)
    })

    onEvent('mt::pandoc-not-exists', async (opts) => {
      const options = Object.assign(DEFAULT_OPTS, opts)
      options.showConfirm = true
      await notice.notify(options)
      openExternal('http://pandoc.org')
    })
  }
}

export default { state, getters, mutations, actions }
