import * as Vue from 'vue'

const VueCompat = {
  ...Vue,
  use: () => {},
  prototype: {},
  set: (obj, key, val) => { obj[key] = val },
  delete: (obj, key) => { delete obj[key] },
  config: { productionTip: false },
  observable: (obj) => Vue.reactive(obj),
}

export default VueCompat
export * from 'vue'
