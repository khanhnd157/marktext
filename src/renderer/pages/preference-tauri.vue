<template>
  <div class="pref-container" :class="platform">
    <div class="pref-titlebar" v-if="titleBarStyle === 'custom'">
      <span class="title">Settings</span>
    </div>
    <div class="pref-content">
      <div class="pref-sidebar">
        <ul>
          <li
            v-for="item in menuItems"
            :key="item.name"
            :class="{ active: $route.name === item.name || (!$route.name && item.name === 'general') }"
            @click="$router.push({ name: item.name })"
          >
            {{ item.label }}
          </li>
        </ul>
      </div>
      <div class="pref-body">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { useAppStore } from '@/stores/app'
import { usePreferencesStore } from '@/stores/preferences'

export default {
  name: 'preference-tauri',
  setup () {
    const appStore = useAppStore()
    const preferencesStore = usePreferencesStore()
    return { appStore, preferencesStore }
  },
  data () {
    return {
      menuItems: [
        { name: 'general', label: 'General' },
        { name: 'editor', label: 'Editor' },
        { name: 'markdown', label: 'Markdown' },
        { name: 'spelling', label: 'Spelling' },
        { name: 'theme', label: 'Theme' },
        { name: 'image', label: 'Image' },
        { name: 'keybindings', label: 'Key Bindings' }
      ]
    }
  },
  computed: {
    platform () {
      return this.appStore.platform
    },
    titleBarStyle () {
      return this.preferencesStore.titleBarStyle
    }
  },
  async created () {
    await this.preferencesStore.loadPreferences()
  }
}
</script>

<style scoped>
.pref-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--editorBgColor, #fff);
  color: var(--editorColor, #333);
}
.pref-titlebar {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag;
  background: var(--titleBarBgColor, #f5f5f5);
}
.pref-titlebar .title {
  font-size: 13px;
  font-weight: 500;
}
.pref-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.pref-sidebar {
  width: 200px;
  border-right: 1px solid var(--tableBorderColor, #e0e0e0);
  padding: 20px 0;
}
.pref-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.pref-sidebar li {
  padding: 10px 24px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.pref-sidebar li:hover {
  background: var(--sideBarItemHoverBgColor, #f0f0f0);
}
.pref-sidebar li.active {
  background: var(--themeColor, #409EFF);
  color: #fff;
}
.pref-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
