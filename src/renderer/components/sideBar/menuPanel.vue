<template>
  <div class="menu-panel-overlay" v-if="visible" @click.self="close">
    <div class="menu-panel" :style="panelStyle">
      <div class="menu-bar">
        <div
          v-for="menu in menus"
          :key="menu.id"
          class="menu-bar-item"
          :class="{ active: openSubmenu === menu.id }"
          @click.stop="toggleSubmenu(menu.id)"
          @mouseenter="hoverSubmenu(menu.id)"
        >
          {{ menu.label }}
        </div>
      </div>
      <div class="submenu-container" v-if="openSubmenu">
        <div class="submenu">
          <template v-for="item in activeItems" :key="item.id">
            <div v-if="item.type === 'separator'" class="menu-separator"></div>
            <div
              v-else
              class="menu-item"
              @click.stop="executeItem(item)"
            >
              <span class="menu-item-label">{{ item.label }}</span>
              <span class="menu-item-shortcut" v-if="item.shortcut">{{ item.shortcut }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { isOsx } from '@/util'

const mod = isOsx ? '⌘' : 'Ctrl'
const alt = isOsx ? '⌥' : 'Alt'

const menuData = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new-file', label: 'New File', shortcut: `${mod}+N` },
      { id: 'new-window', label: 'New Window', shortcut: `${mod}+Shift+N` },
      { type: 'separator' },
      { id: 'open-file', label: 'Open File', shortcut: `${mod}+O` },
      { id: 'open-folder', label: 'Open Folder' },
      { type: 'separator' },
      { id: 'save', label: 'Save', shortcut: `${mod}+S` },
      { id: 'save-as', label: 'Save As...', shortcut: `${mod}+Shift+S` },
      { type: 'separator' },
      { id: 'export-html', label: 'Export HTML' },
      { id: 'export-pdf', label: 'Export PDF' },
      { type: 'separator' },
      { id: 'print', label: 'Print', shortcut: `${mod}+P` },
      { type: 'separator' },
      { id: 'close-window', label: 'Close Window', shortcut: `${mod}+W` },
      { id: 'quit', label: 'Quit', shortcut: `${mod}+Q` }
    ]
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', shortcut: `${mod}+Z` },
      { id: 'redo', label: 'Redo', shortcut: `${mod}+Shift+Z` },
      { type: 'separator' },
      { id: 'cut', label: 'Cut', shortcut: `${mod}+X` },
      { id: 'copy', label: 'Copy', shortcut: `${mod}+C` },
      { id: 'paste', label: 'Paste', shortcut: `${mod}+V` },
      { id: 'paste-as-plain', label: 'Paste as Plain Text', shortcut: `${mod}+Shift+V` },
      { type: 'separator' },
      { id: 'copy-as-markdown', label: 'Copy as Markdown' },
      { id: 'copy-as-html', label: 'Copy as HTML' },
      { type: 'separator' },
      { id: 'select-all', label: 'Select All', shortcut: `${mod}+A` },
      { type: 'separator' },
      { id: 'find', label: 'Find', shortcut: `${mod}+F` },
      { id: 'replace', label: 'Find and Replace', shortcut: `${mod}+H` }
    ]
  },
  {
    id: 'format',
    label: 'Format',
    items: [
      { id: 'bold', label: 'Bold', shortcut: `${mod}+B` },
      { id: 'italic', label: 'Italic', shortcut: `${mod}+I` },
      { id: 'underline', label: 'Underline', shortcut: `${mod}+U` },
      { id: 'strikethrough', label: 'Strikethrough', shortcut: `${alt}+Shift+5` },
      { type: 'separator' },
      { id: 'inline-code', label: 'Inline Code', shortcut: `${mod}+\`` },
      { id: 'inline-math', label: 'Inline Math', shortcut: `${mod}+Shift+M` },
      { id: 'hyperlink', label: 'Hyperlink', shortcut: `${mod}+L` },
      { id: 'image', label: 'Image', shortcut: `${mod}+Shift+I` },
      { type: 'separator' },
      { id: 'heading-1', label: 'Heading 1', shortcut: `${mod}+1` },
      { id: 'heading-2', label: 'Heading 2', shortcut: `${mod}+2` },
      { id: 'heading-3', label: 'Heading 3', shortcut: `${mod}+3` },
      { id: 'heading-4', label: 'Heading 4', shortcut: `${mod}+4` },
      { id: 'heading-5', label: 'Heading 5', shortcut: `${mod}+5` },
      { id: 'heading-6', label: 'Heading 6', shortcut: `${mod}+6` },
      { type: 'separator' },
      { id: 'paragraph', label: 'Paragraph' },
      { id: 'table', label: 'Table' },
      { id: 'code-block', label: 'Code Block' },
      { id: 'quote-block', label: 'Quote Block' },
      { id: 'math-block', label: 'Math Block' },
      { id: 'ordered-list', label: 'Ordered List' },
      { id: 'bullet-list', label: 'Bullet List' },
      { id: 'task-list', label: 'Task List' }
    ]
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: `${mod}+L` },
      { id: 'toggle-toc', label: 'Table of Contents' },
      { type: 'separator' },
      { id: 'source-code', label: 'Source Code Mode' },
      { id: 'typewriter', label: 'Typewriter Mode' },
      { id: 'focus', label: 'Focus Mode' },
      { type: 'separator' },
      { id: 'zoom-in', label: 'Zoom In', shortcut: `${mod}++` },
      { id: 'zoom-out', label: 'Zoom Out', shortcut: `${mod}+-` },
      { id: 'zoom-reset', label: 'Reset Zoom', shortcut: `${mod}+0` }
    ]
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'about', label: 'About MarkText' },
      { id: 'check-update', label: 'Check for Updates' },
      { type: 'separator' },
      { id: 'website', label: 'Website' },
      { id: 'report-bug', label: 'Report Bug' }
    ]
  }
]

export default {
  name: 'menu-panel',
  props: {
    visible: { type: Boolean, default: false },
    anchorX: { type: Number, default: 45 },
    anchorY: { type: Number, default: 0 }
  },
  data () {
    return {
      openSubmenu: null,
      menus: menuData
    }
  },
  computed: {
    panelStyle () {
      return {
        left: `${this.anchorX}px`,
        top: `${this.anchorY}px`
      }
    },
    activeItems () {
      const menu = this.menus.find(m => m.id === this.openSubmenu)
      return menu ? menu.items : []
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.openSubmenu = 'file'
        this.addKeyListener()
      } else {
        this.openSubmenu = null
        this.removeKeyListener()
      }
    }
  },
  methods: {
    toggleSubmenu (id) {
      this.openSubmenu = this.openSubmenu === id ? null : id
    },
    hoverSubmenu (id) {
      if (this.openSubmenu) {
        this.openSubmenu = id
      }
    },
    executeItem (item) {
      this.$emit('menu-action', item.id)
      this.close()
    },
    close () {
      this.$emit('update:visible', false)
    },
    onKeydown (e) {
      if (e.key === 'Escape') {
        this.close()
      }
    },
    addKeyListener () {
      window.addEventListener('keydown', this.onKeydown)
    },
    removeKeyListener () {
      window.removeEventListener('keydown', this.onKeydown)
    }
  },
  beforeUnmount () {
    this.removeKeyListener()
  }
}
</script>

<style scoped>
  .menu-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  .menu-panel {
    position: absolute;
    background: var(--floatBgColor);
    border: 1px solid var(--floatBorderColor);
    border-radius: 4px;
    box-shadow: var(--floatShadow);
    min-width: 220px;
    z-index: 1001;
    overflow: hidden;
  }

  .menu-bar {
    display: flex;
    border-bottom: 1px solid var(--floatBorderColor);
    background: var(--sideBarBgColor);
  }

  .menu-bar-item {
    padding: 6px 12px;
    font-size: 13px;
    color: var(--sideBarColor);
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s, color .15s;
    user-select: none;
  }

  .menu-bar-item:hover,
  .menu-bar-item.active {
    background: var(--themeColor);
    color: #fff;
  }

  .submenu-container {
    max-height: 70vh;
    overflow-y: auto;
  }

  .submenu {
    padding: 4px 0;
  }

  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 16px;
    font-size: 13px;
    color: var(--floatFontColor);
    cursor: pointer;
    transition: background .12s;
    user-select: none;
  }

  .menu-item:hover {
    background: var(--themeColor);
    color: #fff;
  }

  .menu-item:hover .menu-item-shortcut {
    color: rgba(255, 255, 255, .75);
  }

  .menu-item-label {
    flex: 1;
  }

  .menu-item-shortcut {
    margin-left: 24px;
    font-size: 12px;
    color: var(--editorColor30);
    white-space: nowrap;
  }

  .menu-separator {
    height: 1px;
    margin: 4px 8px;
    background: var(--floatBorderColor);
  }
</style>
