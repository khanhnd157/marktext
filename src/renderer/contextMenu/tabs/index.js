import bus from '../../bus'

export const showContextMenu = (event, tab) => {
  const { pathname } = tab
  const hasPath = !!pathname

  const items = [
    { label: 'Close', action: () => bus.$emit('TABS::close-this', tab.id) },
    { label: 'Close others', action: () => bus.$emit('TABS::close-others', tab.id) },
    { label: 'Close saved tabs', action: () => bus.$emit('TABS::close-saved') },
    { label: 'Close all tabs', action: () => bus.$emit('TABS::close-all') },
    { type: 'separator' },
    { label: 'Rename', action: () => bus.$emit('TABS::rename', tab.id), enabled: hasPath },
    { label: 'Copy path', action: () => bus.$emit('TABS::copy-path', tab.id), enabled: hasPath },
    { label: 'Show in folder', action: () => bus.$emit('TABS::show-in-folder', tab.id), enabled: hasPath }
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
