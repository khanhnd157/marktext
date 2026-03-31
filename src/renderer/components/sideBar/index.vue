<template>
  <div
    class="side-bar"
    ref="sideBar"
    :class="{ 'collapsed': !showSideBar }"
    :style="[ !showSideBar ? { 'width': '0', 'min-width': '0' } : { 'width': `${finalSideBarWidth}px` } ]"
  >
    <div class="right-column" v-show="showSideBar">
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
    <div class="drag-bar" ref="dragBar" v-show="showSideBar"></div>
  </div>
</template>

<script>
import Tree from './tree.vue'
import SideBarSearch from './search.vue'
import Toc from './toc.vue'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      openedFiles: [],
      sideBarViewWidth: 280
    }
  },
  components: {
    Tree,
    SideBarSearch,
    Toc
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
      const { showSideBar, sideBarViewWidth } = this
      if (!showSideBar) return 0
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
    height: 100%;
    min-width: 0;
    position: relative;
    color: var(--sideBarColor);
    user-select: none;
    background: var(--sideBarBgColor);
    border-right: 1px solid var(--itemBgColor);
    z-index: 3;
    transition: width .15s ease;
  }
  .side-bar.collapsed {
    border-right: none;
  }
  .right-column {
    flex: 1;
    width: 100%;
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
