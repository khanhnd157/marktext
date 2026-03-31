import bus from '../../bus'

export const showContextMenu = (event, hasPathCache) => {
  const items = [
    { label: 'New File', action: () => bus.$emit('SIDEBAR::new', 'file') },
    { label: 'New Directory', action: () => bus.$emit('SIDEBAR::new', 'directory') },
    { type: 'separator' },
    { label: 'Copy', action: () => bus.$emit('SIDEBAR::copy-cut', 'copy') },
    { label: 'Cut', action: () => bus.$emit('SIDEBAR::copy-cut', 'cut') },
    { label: 'Paste', action: () => bus.$emit('SIDEBAR::paste'), enabled: hasPathCache },
    { type: 'separator' },
    { label: 'Rename', action: () => bus.$emit('SIDEBAR::rename') },
    { label: 'Move To Trash', action: () => bus.$emit('SIDEBAR::remove') },
    { type: 'separator' },
    { label: 'Show In Folder', action: () => bus.$emit('SIDEBAR::show-in-folder') }
  ]

  showHtmlContextMenu(event, items)
}

function showHtmlContextMenu (event, items) {
  const existing = document.querySelector('.custom-context-menu')
  if (existing) existing.remove()

  const menu = document.createElement('div')
  menu.className = 'custom-context-menu'
  menu.style.cssText = `position:fixed;z-index:10000;left:${event.clientX}px;top:${event.clientY}px;background:var(--floatBgColor);border:1px solid var(--floatBorderColor);border-radius:4px;padding:4px 0;min-width:160px;box-shadow:0 2px 8px rgba(0,0,0,.15);`

  items.forEach(item => {
    if (item.type === 'separator') {
      const sep = document.createElement('div')
      sep.style.cssText = 'height:1px;margin:4px 0;background:var(--floatBorderColor);'
      menu.appendChild(sep)
    } else {
      const el = document.createElement('div')
      el.textContent = item.label
      const disabled = item.enabled === false
      el.style.cssText = `padding:6px 16px;font-size:13px;cursor:${disabled ? 'default' : 'pointer'};color:${disabled ? 'var(--editorColor30)' : 'var(--editorColor)'};`
      if (!disabled) {
        el.onmouseenter = () => { el.style.background = 'var(--sideBarItemHoverBgColor)' }
        el.onmouseleave = () => { el.style.background = '' }
        el.onclick = () => { menu.remove(); item.action() }
      }
      menu.appendChild(el)
    }
  })

  document.body.appendChild(menu)
  const close = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove()
      document.removeEventListener('mousedown', close)
    }
  }
  setTimeout(() => document.addEventListener('mousedown', close), 0)
}
