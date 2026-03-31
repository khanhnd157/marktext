const noop = () => {}
const noopSync = () => undefined
const noopCb = (_, cb) => { if (typeof cb === 'function') cb(null) }

export const readFileSync = noopSync
export const writeFileSync = noop
export const existsSync = () => false
export const mkdirSync = noop
export const readdirSync = () => []
export const statSync = noopSync
export const readFile = noopCb
export const writeFile = noopCb
export const mkdir = noopCb
export const readdir = noopCb
export const stat = noopCb
export const rename = noopCb
export const unlink = noopCb
export const createReadStream = noop
export const createWriteStream = noop
export const watch = noop
export const constants = { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 }
export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  mkdir: async () => {},
  stat: async () => ({}),
  readdir: async () => [],
  rename: async () => {},
  unlink: async () => {},
}
export default {
  readFileSync, writeFileSync, existsSync, mkdirSync,
  readdirSync, statSync, readFile, writeFile, mkdir,
  readdir, stat, rename, unlink, createReadStream,
  createWriteStream, watch, promises
}
