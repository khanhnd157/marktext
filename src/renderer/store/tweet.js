import bus from '../bus'
import { onEvent } from '@/services/tauri-events'

const state = {}

const getters = {}

const mutations = {}

const actions = {
  LISTEN_FOR_TWEET () {
    onEvent('mt::tweet', (type) => {
      if (type === 'twitter') {
        bus.$emit('tweetDialog')
      }
    })
  }
}

export default { state, getters, mutations, actions }
