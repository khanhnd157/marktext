<template>
  <div
    class="side-bar"
    ref="sideBar"
    :class="{ 'collapsed': !showSideBar }"
    :style="[ !showSideBar ? { 'width': '45px', 'min-width': '45px' } : !rightColumn ? { 'min-width': '45px', 'width': '45px' } : { 'width': `${finalSideBarWidth}px` } ]"
  >
    <div class="left-column">
      <ul>
        <li
          class="menu-trigger"
          :class="{ active: menuVisible }"
          @click.stop="toggleMenu"
        >
          <svg viewBox="0 0 16 16">
            <path d="M1 3h14v1.5H1V3zm0 4.25h14v1.5H1v-1.5zm0 4.25h14V13H1v-1.5z" />
          </svg>
        </li>
        <li
          v-for="(c, index) of sideBarIcons"
          :key="index"
          @click="handleLeftIconClick(c.name)"
          :class="{ 'active': c.name === rightColumn }"
        >
          <svg :viewBox="c.icon.viewBox">
            <use :xlink:href="c.icon.url"></use>
          </svg>
        </li>
      </ul>
      <ul class="bottom">
        <li
          v-for="(c, index) of sideBarBottomIcons"
          :key="index"
          @click="handleLeftBottomClick(c.name)"
        >
          <svg :viewBox="c.icon.viewBox">
            <use :xlink:href="c.icon.url"></use>
          </svg>
        </li>
      </ul>
    </div>
    <div class="right-column" v-show="showSideBar && rightColumn">
      <tree
        :project-tree="projectTree"
        :opened-files="openedFiles"
        :tabs="tabs"
        v-if="rightColumn === 'files'"
      ></tree>
      <side-bar-search
        v-else-if="rightColumn === 'search'"
      ></side-bar-search>
      <toc
        v-else-if="rightColumn === 'toc'"
      ></toc>
    </div>
    <div class="drag-bar" ref="dragBar" v-show="showSideBar && rightColumn"></div>
    <menu-panel
      :visible="menuVisible"
      :anchor-x="45"
      :anchor-y="0"
      @update:visible="menuVisible = $event"
      @menu-action="onMenuAction"
    />
  </div>
</template>

<script>
import { sideBarIcons, sideBarBottomIcons } from './help'
import Tree from './tree.vue'
import SideBarSearch from './search.vue'
import Toc from './toc.vue'
import MenuPanel from './menuPanel.vue'
import { mapState } from 'vuex'
import bus from '@/bus'

export default {
  data () {
    this.sideBarIcons = sideBarIcons
    this.sideBarBottomIcons = sideBarBottomIcons
    return {
      openedFiles: [],
      sideBarViewWidth: 280,
      menuVisible: false
    }
  },
  components: {
    Tree,
    SideBarSearch,
    Toc,
    MenuPanel
  },
  computed: {
    ...mapState({
      rightColumn: state => state.layout.rightColumn,
      showSideBar: state => state.layout.showSideBar,
      projectTree: state => state.project.projectTree,
      sideBarWidth: state => state.layout.sideBarWidth,
      tabs: state => state.editor.tabs
    }),
    finalSideBarWidth () {
      const { showSideBar, rightColumn, sideBarViewWidth } = this
      if (!showSideBar) return 0
      if (rightColumn === '') return 45
      return sideBarViewWidth < 220 ? 220 : sideBarViewWidth
    }
  },
  created () {
    this.$nextTick(() => {
      const dragBar = this.$refs.dragBar
      let startX = 0
      let sideBarWidth = +this.sideBarWidth
      let startWidth = sideBarWidth

      this.sideBarViewWidth = sideBarWidth

      const mouseUpHandler = event => {
        document.removeEventListener('mousemove', mouseMoveHandler, false)
        document.removeEventListener('mouseup', mouseUpHandler, false)
        this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', sideBarWidth < 220 ? 220 : sideBarWidth)
      }

      const mouseMoveHandler = event => {
        const offset = event.clientX - startX
        sideBarWidth = startWidth + offset
        this.sideBarViewWidth = sideBarWidth
      }

      const mouseDownHandler = event => {
        startX = event.clientX
        startWidth = +this.sideBarWidth
        document.addEventListener('mousemove', mouseMoveHandler, false)
        document.addEventListener('mouseup', mouseUpHandler, false)
      }

      dragBar.addEventListener('mousedown', mouseDownHandler, false)
    })
  },
  methods: {
    handleLeftIconClick (name) {
      if (this.rightColumn === name) {
        this.$store.commit('SET_LAYOUT', { rightColumn: '' })
        this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', this.finalSideBarWidth)
      } else {
        const needDispatch = this.rightColumn === ''
        this.$store.commit('SET_LAYOUT', { rightColumn: name })
        this.sideBarViewWidth = +this.sideBarWidth
        if (needDispatch) {
          this.$store.dispatch('CHANGE_SIDE_BAR_WIDTH', this.finalSideBarWidth)
        }
      }
    },
    handleLeftBottomClick (name) {
      if (name === 'settings') {
        this.$store.dispatch('OPEN_SETTING_WINDOW')
      }
    },
    toggleMenu () {
      this.menuVisible = !this.menuVisible
    },
    onMenuAction (menuId) {
      bus.$emit('menu-event', menuId)
    }
  }
}
</script>

<style scoped>
  .side-bar {
    display: flex;
    flex-shrink: 0;
    flex-grow: 0;
    width: 280px;
    height: 100vh;
    min-width: 45px;
    position: relative;
    color: var(--sideBarColor);
    user-select: none;
    background: var(--sideBarBgColor);
    border-right: 1px solid var(--itemBgColor);
    z-index: 3;
    & .left-column {
      & svg {
        fill: var(--iconColor);
      }
    }
  }
  .side-bar.collapsed .left-column ul li:not(.menu-trigger) {
    opacity: .4;
  }

  .left-column {
    height: 100%;
    width: 45px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 4px;
    box-sizing: border-box;
    & > ul {
      opacity: 1;
    }
  }

  .left-column ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    & > li {
      width: 45px;
      height: 45px;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      cursor: pointer;
      & > svg {
        width: 18px;
        height: 18px;
        fill: var(--sideBarIconColor);
        opacity: 1;
        transition: transform .25s ease-in-out;
      }
      &.active > svg {
        fill: var(--themeColor);
      }
    }
  }

  .left-column ul li.menu-trigger {
    margin-bottom: 8px;
    border-bottom: 1px solid var(--floatBorderColor);
    padding-bottom: 8px;
  }
  .left-column ul li.menu-trigger > svg {
    width: 16px;
    height: 16px;
  }
  .side-bar:hover .left-column ul li svg {
    opacity: 1;
  }
  .right-column {
    flex: 1;
    width: calc(100% - 50px);
    overflow: hidden;
  }
  .drag-bar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 3px;
    cursor: col-resize;
    &:hover {
      border-right: 2px solid var(--iconColor);
    }
  }
</style>
