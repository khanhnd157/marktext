<template>
  <div class="toolbar-root">
    <div
      class="toolbar"
      data-tauri-drag-region
      :class="{ active }"
    >
      <div class="toolbar-btn menu-btn" :class="{ active: menuVisible }" @click.stop="toggleMenu">
        <svg viewBox="0 0 16 16" class="toolbar-icon">
          <path d="M1 3h14v1.5H1V3zm0 4.25h14v1.5H1v-1.5zm0 4.25h14V13H1v-1.5z"/>
        </svg>
      </div>

      <div class="toolbar-sep"></div>

      <div class="toolbar-btn" @click="action('new-file')" title="Ctrl+N">
        <svg viewBox="0 0 24 24" class="toolbar-icon"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L17.5 8H13z"/></svg>
        <span class="toolbar-label">New</span>
      </div>
      <div class="toolbar-btn" @click="action('open-file')" title="Ctrl+O">
        <svg viewBox="0 0 24 24" class="toolbar-icon"><path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z"/></svg>
        <span class="toolbar-label">Open</span>
      </div>
      <div class="toolbar-btn" :class="{ dimmed: isSaved }" @click="action('save')" title="Ctrl+S">
        <svg viewBox="0 0 24 24" class="toolbar-icon"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z"/></svg>
        <span class="toolbar-label">Save</span>
      </div>

      <div class="toolbar-sep"></div>

      <div class="toolbar-btn" @click="action('undo')" title="Ctrl+Z">
        <svg viewBox="0 0 24 24" class="toolbar-icon"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        <span class="toolbar-label">Undo</span>
      </div>
      <div class="toolbar-btn" @click="action('redo')" title="Ctrl+Shift+Z">
        <svg viewBox="0 0 24 24" class="toolbar-icon"><path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
        <span class="toolbar-label">Redo</span>
      </div>

      <div class="toolbar-spacer" data-tauri-drag-region @dblclick.stop="handleMaximizeClick"></div>

      <div class="toolbar-file-info" v-if="filename">
        <span class="toolbar-filename">{{ filename }}</span>
        <span class="save-dot" :class="{ unsaved: !isSaved }"></span>
      </div>

      <el-tooltip v-if="wordCount" placement="bottom-end">
        <template #content>
          <div class="title-item">
            <span class="front">Words:</span><span class="text">{{ wordCount['word'] }}</span>
          </div>
          <div class="title-item">
            <span class="front">Characters:</span><span class="text">{{ wordCount['character'] }}</span>
          </div>
          <div class="title-item">
            <span class="front">Paragraphs:</span><span class="text">{{ wordCount['paragraph'] }}</span>
          </div>
        </template>
        <div class="toolbar-btn compact" @click.stop="handleWordClick">
          <span class="toolbar-badge">{{ `${HASH[show].short}: ${wordCount[show]}` }}</span>
        </div>
      </el-tooltip>

      <div class="toolbar-btn-wrap" ref="appearanceWrap">
        <div class="toolbar-btn" :class="{ active: appearanceVisible }" @click.stop="toggleAppearance">
          <svg viewBox="0 0 24 24" class="toolbar-icon"><path d="M12 3a9 9 0 000 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-4a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
          <span class="toolbar-label">Appearance</span>
        </div>
        <div class="appearance-dropdown" v-if="appearanceVisible" @click.stop>
          <div class="dropdown-section-title">Theme</div>
          <div class="dropdown-item" :class="{ checked: currentTheme === 'light' }" @click="setTheme('light')">
            <span class="dropdown-check">&#10003;</span> Light
          </div>
          <div class="dropdown-item" :class="{ checked: currentTheme === 'dark' }" @click="setTheme('dark')">
            <span class="dropdown-check">&#10003;</span> Dark
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-section-title">View</div>
          <div class="dropdown-item" :class="{ checked: !sourceCode }" @click="setViewMode(false)">
            <span class="dropdown-check">&#10003;</span> Editor Mode
          </div>
          <div class="dropdown-item" :class="{ checked: sourceCode }" @click="setViewMode(true)">
            <span class="dropdown-check">&#10003;</span> Source Code Mode
          </div>
        </div>
      </div>

      <div class="toolbar-sep"></div>

      <div class="win-btn win-minimize" @click.stop="handleMinimizeClick">
        <svg width="10" height="10"><path :d="windowIconMinimize"/></svg>
      </div>
      <div class="win-btn win-maximize" @click.stop="handleMaximizeClick">
        <svg width="10" height="10">
          <path v-show="!isMaximized" :d="windowIconMaximize"/>
          <path v-show="isMaximized" :d="windowIconRestore"/>
        </svg>
      </div>
      <div class="win-btn win-close" @click.stop="handleCloseClick">
        <svg width="10" height="10"><path :d="windowIconClose"/></svg>
      </div>
    </div>

    <menu-panel
      :visible="menuVisible"
      :anchor-x="0"
      :anchor-y="46"
      @update:visible="menuVisible = $event"
      @menu-action="onMenuAction"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { minimizeWindow, maximizeWindow, closeWindow, isMaximized as checkMaximized } from '@/services/tauri-api'
import { minimizePath, restorePath, maximizePath, closePath } from '../../assets/window-controls.js'
import MenuPanel from '../sideBar/menuPanel.vue'
import bus from '@/bus'
import { addThemeStyle } from '@/util/theme'

export default {
  components: { MenuPanel },
  data () {
    this.HASH = {
      word: { short: 'W', full: 'word' },
      character: { short: 'C', full: 'character' },
      paragraph: { short: 'P', full: 'paragraph' },
      all: { short: 'A', full: '(with space)character' }
    }
    this.windowIconMinimize = minimizePath
    this.windowIconRestore = restorePath
    this.windowIconMaximize = maximizePath
    this.windowIconClose = closePath
    return {
      isMaximized: false,
      show: 'word',
      menuVisible: false,
      appearanceVisible: false
    }
  },
  props: {
    filename: String,
    pathname: String,
    active: Boolean,
    wordCount: Object,
    isSaved: Boolean
  },
  computed: {
    ...mapState({
      showTabBar: state => state.layout.showTabBar,
      currentTheme: state => state.preferences.theme || 'light',
      sourceCode: state => state.preferences.sourceCode
    })
  },
  mounted () {
    document.addEventListener('click', this.closeAppearance)
  },
  beforeUnmount () {
    document.removeEventListener('click', this.closeAppearance)
  },
  watch: {
    filename (value) {
      const projectName = this.$store.state.project.projectTree?.name
      document.title = value
        ? (projectName ? `${value} - ${projectName}` : `${value} - MarkText`)
        : (projectName ? projectName : 'MarkText')
    }
  },
  methods: {
    action (menuId) {
      bus.$emit('menu-event', menuId)
    },
    toggleMenu () {
      this.menuVisible = !this.menuVisible
      this.appearanceVisible = false
    },
    toggleAppearance () {
      this.appearanceVisible = !this.appearanceVisible
      this.menuVisible = false
    },
    closeAppearance (e) {
      if (this.$refs.appearanceWrap && !this.$refs.appearanceWrap.contains(e.target)) {
        this.appearanceVisible = false
      }
    },
    setTheme (theme) {
      this.$store.commit('SET_USER_PREFERENCE', { theme })
      addThemeStyle(theme)
      this.appearanceVisible = false
    },
    setViewMode (toSource) {
      const current = this.sourceCode
      if (current !== toSource) {
        this.$store.commit('TOGGLE_VIEW_MODE', 'sourceCode')
      }
      this.appearanceVisible = false
    },
    onMenuAction (menuId) {
      bus.$emit('menu-event', menuId)
    },
    handleWordClick () {
      const ITEMS = ['word', 'paragraph', 'character', 'all']
      let index = ITEMS.indexOf(this.show) + 1
      if (index >= ITEMS.length) index = 0
      this.show = ITEMS[index]
    },
    handleCloseClick () { closeWindow() },
    async handleMaximizeClick () {
      this.isMaximized = !this.isMaximized
      await maximizeWindow()
      this.isMaximized = await checkMaximized()
    },
    handleMinimizeClick () { minimizeWindow() }
  }
}
</script>

<style scoped>
  .toolbar {
    -webkit-app-region: drag;
    user-select: none;
    background: var(--sideBarBgColor);
    height: var(--titleBarHeight);
    box-sizing: border-box;
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--floatBorderColor);
    padding: 0 2px;
    transition: opacity .25s;
  }
  .toolbar:not(.active) {
    opacity: .8;
  }

  .toolbar-btn {
    -webkit-app-region: no-drag;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 42px;
    height: 38px;
    padding: 2px 6px;
    margin: 0 1px;
    border-radius: 4px;
    cursor: pointer;
    transition: background .15s;
  }
  .toolbar-btn:hover {
    background: var(--sideBarItemHoverBgColor);
  }
  .toolbar-btn:active {
    background: var(--editorColor10);
  }
  .toolbar-btn.compact {
    min-width: 32px;
    padding: 2px 6px;
  }
  .toolbar-btn.dimmed {
    opacity: .45;
  }
  .toolbar-icon {
    width: 16px;
    height: 16px;
    fill: var(--iconColor);
    flex-shrink: 0;
  }
  .toolbar-label {
    font-size: 10px;
    line-height: 1;
    color: var(--editorColor50);
    margin-top: 2px;
    white-space: nowrap;
  }

  .toolbar-sep {
    width: 1px;
    height: 24px;
    background: var(--floatBorderColor);
    margin: 0 4px;
    flex-shrink: 0;
  }

  .toolbar-spacer {
    flex: 1;
    height: 100%;
    min-width: 20px;
  }

  .menu-btn {
    min-width: 36px;
  }
  .menu-btn.active {
    background: var(--themeColor20);
  }
  .menu-btn .toolbar-icon {
    width: 15px;
    height: 15px;
  }

  .toolbar-file-info {
    -webkit-app-region: no-drag;
    display: flex;
    align-items: center;
    padding: 0 10px;
    max-width: 180px;
  }
  .toolbar-filename {
    font-size: 12px;
    color: var(--editorColor50);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .save-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-left: 5px;
    flex-shrink: 0;
    background: transparent;
    transition: background .2s;
  }
  .save-dot.unsaved {
    background: var(--highlightThemeColor);
  }

  .toolbar-badge {
    font-size: 11px;
    color: var(--editorColor40);
    white-space: nowrap;
  }

  .toolbar-btn-wrap {
    -webkit-app-region: no-drag;
    position: relative;
  }
  .appearance-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    min-width: 180px;
    background: var(--floatBgColor);
    border: 1px solid var(--floatBorderColor);
    border-radius: 6px;
    box-shadow: var(--floatShadow);
    padding: 4px 0;
    z-index: 100;
  }
  .dropdown-section-title {
    padding: 6px 14px 2px;
    font-size: 11px;
    font-weight: 600;
    color: var(--editorColor40);
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    padding: 5px 14px;
    font-size: 13px;
    color: var(--floatFontColor);
    cursor: pointer;
    transition: background .12s;
    user-select: none;
  }
  .dropdown-item:hover {
    background: var(--themeColor);
    color: #fff;
  }
  .dropdown-check {
    width: 18px;
    font-size: 12px;
    flex-shrink: 0;
    visibility: hidden;
  }
  .dropdown-item.checked .dropdown-check {
    visibility: visible;
  }
  .dropdown-item.checked:hover .dropdown-check {
    color: #fff;
  }
  .dropdown-divider {
    height: 1px;
    margin: 4px 8px;
    background: var(--floatBorderColor);
  }

  .win-btn {
    -webkit-app-region: no-drag;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 100%;
    transition: background .15s;
  }
  .win-btn svg {
    fill: var(--editorColor50);
  }
  .win-minimize:hover,
  .win-maximize:hover {
    background: var(--sideBarItemHoverBgColor);
  }
  .win-close:hover {
    background: #e81123;
  }
  .win-close:hover svg {
    fill: #fff;
  }
</style>

<style>
.title-item {
  height: 28px;
  line-height: 28px;
  & .front { opacity: .7; }
  & .text { margin-left: 10px; }
}
</style>
