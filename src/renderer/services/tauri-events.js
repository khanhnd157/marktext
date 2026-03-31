import mitt from 'mitt'

const emitter = mitt()
const onceHandlers = new WeakMap()

export function onEvent (channel, handler) {
  emitter.on(channel, handler)
}

export function offEvent (channel, handler) {
  if (handler) {
    emitter.off(channel, handler)
    if (onceHandlers.has(handler)) {
      emitter.off(channel, onceHandlers.get(handler))
      onceHandlers.delete(handler)
    }
  } else {
    emitter.all.delete(channel)
  }
}

export function emitEvent (channel, ...args) {
  emitter.emit(channel, args.length <= 1 ? args[0] : args)
}

export function onceEvent (channel, handler) {
  const wrapper = (payload) => {
    handler(payload)
    emitter.off(channel, wrapper)
  }
  onceHandlers.set(handler, wrapper)
  emitter.on(channel, wrapper)
}

export function removeAllListeners (channel) {
  emitter.all.delete(channel)
}

export default emitter
