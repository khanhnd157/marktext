import mitt from 'mitt'

const emitter = mitt()

const bus = {
  $on: (event, handler) => emitter.on(event, handler),
  $off: (event, handler) => emitter.off(event, handler),
  $emit: (event, ...args) => emitter.emit(event, args.length <= 1 ? args[0] : args),
  $once: (event, handler) => {
    const wrapper = (...args) => {
      handler(...args)
      emitter.off(event, wrapper)
    }
    emitter.on(event, wrapper)
  }
}

export default bus
