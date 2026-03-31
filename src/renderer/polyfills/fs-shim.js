const noop = () => {}
const noopCb = (cb) => { if (typeof cb === 'function') cb(null) }

export const readFile = (p, opts, cb) => {
  if (typeof opts === 'function') { cb = opts }
  if (typeof cb === 'function') cb(new Error('fs.readFile not available in browser'))
}

export const writeFile = (p, data, opts, cb) => {
  if (typeof opts === 'function') { cb = opts }
  if (typeof cb === 'function') cb(new Error('fs.writeFile not available in browser'))
}

export const existsSync = () => false
export const readFileSync = () => ''
export const writeFileSync = noop
export const mkdirSync = noop
export const readdirSync = () => []
export const statSync = () => ({ isFile: () => false, isDirectory: () => false })
export const unlinkSync = noop
export const renameSync = noop
export const copyFileSync = noop
export const lstatSync = statSync
export const accessSync = noop
export const createReadStream = () => ({ pipe: noop, on: () => ({}) })
export const createWriteStream = () => ({ write: noop, end: noop, on: () => ({}) })
export const readdir = noopCb
export const stat = (p, cb) => { if (typeof cb === 'function') cb(null, statSync()) }
export const lstat = stat
export const mkdir = noopCb
export const unlink = noopCb
export const rename = noopCb
export const access = noopCb
export const copyFile = noopCb
export const realpath = (p, cb) => { if (typeof cb === 'function') cb(null, p) }
export const watch = () => ({ close: noop, on: noop })

export const constants = { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 }

export const ensureDir = async () => {}
export const ensureDirSync = noop
export const outputFile = async () => {}
export const move = async () => {}
export const copy = async () => {}
export const pathExists = async () => false
export const pathExistsSync = () => false
export const remove = async () => {}
export const removeSync = noop
export const mkdirp = async () => {}
export const mkdirpSync = noop
export const outputJson = async () => {}
export const readJson = async () => ({})

export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  mkdir: async () => {},
  readdir: async () => [],
  stat: async () => ({ isFile: () => false, isDirectory: () => false }),
  unlink: async () => {},
  rename: async () => {},
  access: async () => {},
  copyFile: async () => {},
  realpath: async (p) => p
}

export default {
  readFile, writeFile, existsSync, readFileSync, writeFileSync,
  mkdirSync, readdirSync, statSync, unlinkSync, renameSync,
  copyFileSync, lstatSync, accessSync, createReadStream, createWriteStream,
  readdir, stat, lstat, mkdir, unlink, rename, access, copyFile, realpath, watch,
  constants, promises,
  ensureDir, ensureDirSync, outputFile, move, copy, pathExists,
  pathExistsSync, remove, removeSync, mkdirp, mkdirpSync, outputJson, readJson
}
