import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import pinia from './stores'
import store from './store'
import { createAppRouter } from './router/tauri'
import App from './App.vue'

import './assets/styles/index.css'

const parseUrlArgs = () => {
  const params = new URLSearchParams(window.location.search)
  const type = params.get('type') || 'editor'
  const theme = params.get('theme') || 'light'
  const debug = params.get('debug') === '1'
  return { type, theme, debug }
}

const { type, theme, debug } = parseUrlArgs()

window.marktext = {
  env: {
    type,
    debug,
    paths: {},
    windowId: Date.now()
  },
  initialState: { theme }
}

const app = createApp(App)

app.use(pinia)
app.use(store)
app.use(ElementPlus)
app.use(createAppRouter(type))

app.config.globalProperties.$marktext = window.marktext

app.mount('#app')
