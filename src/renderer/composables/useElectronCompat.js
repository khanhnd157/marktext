import emitter from '@/bus/emitter'
import api from '@/api/tauri-bridge'

export function useBus () {
  return {
    $on: (event, handler) => emitter.on(event, handler),
    $off: (event, handler) => emitter.off(event, handler),
    $emit: (event, ...args) => emitter.emit(event, args.length === 1 ? args[0] : args),
  }
}

export function useIpc () {
  return {
    send: (channel, ...args) => {
      console.warn(`[compat] ipcRenderer.send('${channel}') called - use Tauri bridge instead`)
      api.ipc.emit(channel, args)
    },
    invoke: (channel, ...args) => {
      console.warn(`[compat] ipcRenderer.invoke('${channel}') called - use Tauri bridge instead`)
      return api.ipc.invoke(channel, args[0])
    },
    on: (channel, handler) => {
      api.ipc.listen(channel, (event) => handler(event, event.payload))
    },
  }
}

export { api }
