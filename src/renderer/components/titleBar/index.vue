<template>
  <div>
    <div
      class="title-bar-editor-bg"
      :class="{ 'tabs-visible': showTabBar }"
    ></div>
    <div
      class="title-bar"
      data-tauri-drag-region
      :class="[{ 'active': active }, { 'tabs-visible': showTabBar }]"
    >
      <div class="title" data-tauri-drag-region @dblclick.stop="handleMaximizeClick">
        <span v-if="!filename">MarkText</span>
        <span v-else>
          <span
            v-for="(pathItem, index) of paths"
            :key="index"
          >
            {{ pathItem }}
            <svg class="icon" aria-hidden="true">
              <use xlink:href="#icon-arrow-right"></use>
            </svg>
          </span>
          <span class="filename" @click="rename">
            {{ filename }}
          </span>
          <span class="save-dot" :class="{'show': !isSaved}"></span>
        </span>
      </div>
      <div class="toolbar-center title-no-drag">
        <el-tooltip
          v-if="wordCount"
          placement="bottom-end"
        >
          <template #content>
            <div class="title-item">
              <span class="front">Words:</span><span class="text">{{wordCount['word']}}</span>
            </div>
            <div class="title-item">
              <span class="front">Characters:</span><span class="text">{{wordCount['character']}}</span>
            </div>
            <div class="title-item">
              <span class="front">Paragraphs:</span><span class="text">{{wordCount['paragraph']}}</span>
            </div>
          </template>
          <div class="word-count" @click.stop="handleWordClick">
            <span>{{ `${HASH[show].short} ${wordCount[show]}` }}</span>
          </div>
        </el-tooltip>
      </div>
      <div class="right-toolbar title-no-drag">
        <div class="frameless-titlebar-button frameless-titlebar-minimize" @click.stop="handleMinimizeClick">
          <div>
            <svg width="10" height="10">
              <path :d="windowIconMinimize" />
            </svg>
          </div>
        </div>
        <div class="frameless-titlebar-button frameless-titlebar-toggle" @click.stop="handleMaximizeClick">
          <div>
            <svg width="10" height="10">
              <path v-show="!isMaximized" :d="windowIconMaximize" />
              <path v-show="isMaximized" :d="windowIconRestore" />
            </svg>
          </div>
        </div>
        <div class="frameless-titlebar-button frameless-titlebar-close" @click.stop="handleCloseClick">
          <div>
            <svg width="10" height="10">
              <path :d="windowIconClose" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { minimizeWindow, maximizeWindow, closeWindow, isMaximized as checkMaximized } from '@/services/tauri-api'
import { minimizePath, restorePath, maximizePath, closePath } from '../../assets/window-controls.js'
import { PATH_SEPARATOR } from '../../config'

export default {
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
      isFullScreen: false,
      isMaximized: false,
      show: 'word'
    }
  },
  props: {
    project: Object,
    filename: String,
    pathname: String,
    active: Boolean,
    wordCount: Object,
    platform: String,
    isSaved: Boolean
  },
  computed: {
    ...mapState({
      showTabBar: state => state.layout.showTabBar
    }),
    paths () {
      if (!this.pathname) return []
      const pathnameToken = this.pathname.split(PATH_SEPARATOR).filter(i => i)
      return pathnameToken.slice(0, pathnameToken.length - 1).slice(-3)
    }
  },
  watch: {
    filename: function (value) {
      const hasOpenFolder = this.project && this.project.name
      let title = ''
      if (value) {
        title = hasOpenFolder ? `${value} - ${this.project.name}` : `${value} - MarkText`
      } else {
        title = hasOpenFolder ? this.project.name : 'MarkText'
      }
      document.title = title
    }
  },
  methods: {
    handleWordClick () {
      const ITEMS = ['word', 'paragraph', 'character', 'all']
      const len = ITEMS.length
      let index = ITEMS.indexOf(this.show)
      index += 1
      if (index >= len) index = 0
      this.show = ITEMS[index]
    },
    handleCloseClick () {
      closeWindow()
    },
    async handleMaximizeClick () {
      await maximizeWindow()
      this.isMaximized = await checkMaximized()
    },
    handleMinimizeClick () {
      minimizeWindow()
    },
    rename () {
      this.$store.dispatch('RESPONSE_FOR_RENAME')
    }
  }
}
</script>

<style scoped>
  .title-bar-editor-bg {
    height: var(--titleBarHeight);
    background: var(--editorBgColor);
    position: relative;
    left: 0;
    top: 0;
    right: 0;
  }
  .title-bar {
    -webkit-app-region: drag;
    user-select: none;
    background: var(--editorBgColor);
    height: var(--titleBarHeight);
    box-sizing: border-box;
    color: var(--editorColor50);
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    z-index: 2;
    transition: color .4s ease-in-out;
    cursor: default;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--floatBorderColor);
  }
  .title-bar.active {
    color: var(--editorColor);
  }
  .title {
    flex: 1;
    height: 100%;
    line-height: var(--titleBarHeight);
    font-size: 13px;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0 8px;
  }
  .title .filename:hover {
    color: var(--themeColor);
    cursor: pointer;
  }
  .active .save-dot {
    margin-left: 3px;
    width: 7px;
    height: 7px;
    display: inline-block;
    border-radius: 50%;
    background: var(--highlightThemeColor);
    opacity: .7;
    visibility: hidden;
  }
  .active .save-dot.show {
    visibility: visible;
  }

  .toolbar-center {
    display: flex;
    align-items: center;
  }

  .word-count {
    cursor: pointer;
    font-size: 12px;
    color: var(--editorColor30);
    padding: 2px 8px;
    border-radius: 3px;
    transition: all .2s;
  }
  .word-count:hover {
    background: var(--sideBarItemHoverBgColor);
    color: var(--editorColor);
  }

  .title-no-drag {
    -webkit-app-region: no-drag;
  }

  .right-toolbar {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .frameless-titlebar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 100%;
    transition: background .15s;
  }
  .frameless-titlebar-button > div {
    display: inline-flex;
  }
  .frameless-titlebar-button svg {
    fill: var(--editorColor50);
  }
  .frameless-titlebar-minimize:hover,
  .frameless-titlebar-toggle:hover {
    background: var(--sideBarItemHoverBgColor);
  }
  .frameless-titlebar-close:hover {
    background: #e81123;
  }
  .frameless-titlebar-close:hover svg {
    fill: #ffffff;
  }
</style>

<style>
.title-item {
  height: 28px;
  line-height: 28px;
  & .front {
    opacity: .7;
  }
  & .text {
    margin-left: 10px;
  }
}
</style>
