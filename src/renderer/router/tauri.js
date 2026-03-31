import { createRouter, createWebHashHistory } from 'vue-router'

const parseSettingsPage = type => {
  let pageUrl = '/preference'
  if (/\/spelling$/.test(type)) {
    pageUrl += '/spelling'
  }
  return pageUrl
}

export function createAppRouter (type = 'editor') {
  const routes = [{
    path: '/',
    redirect: type === 'editor' ? '/editor' : parseSettingsPage(type)
  }, {
    path: '/editor',
    component: () => import('@/pages/app-tauri.vue')
  }, {
    path: '/preference',
    component: () => import('@/pages/preference-tauri.vue'),
    children: [{
      path: '',
      component: () => import('@/prefComponents/general/index.vue')
    }, {
      path: 'general',
      component: () => import('@/prefComponents/general/index.vue'),
      name: 'general'
    }, {
      path: 'editor',
      component: () => import('@/prefComponents/editor/index.vue'),
      name: 'editor'
    }, {
      path: 'markdown',
      component: () => import('@/prefComponents/markdown/index.vue'),
      name: 'markdown'
    }, {
      path: 'spelling',
      component: () => import('@/prefComponents/spellchecker/index.vue'),
      name: 'spelling'
    }, {
      path: 'theme',
      component: () => import('@/prefComponents/theme/index.vue'),
      name: 'theme'
    }, {
      path: 'image',
      component: () => import('@/prefComponents/image/index.vue'),
      name: 'image'
    }, {
      path: 'keybindings',
      component: () => import('@/prefComponents/keybindings/index.vue'),
      name: 'keybindings'
    }]
  }]

  return createRouter({
    history: createWebHashHistory(),
    routes
  })
}
