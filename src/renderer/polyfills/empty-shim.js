export const spawn = () => ({
  stdout: { on: () => {} },
  stderr: { on: () => {} },
  on: () => {},
  kill: () => {}
})
export const exec = (cmd, cb) => { if (typeof cb === 'function') cb(new Error('Not available')) }
export const execSync = () => ''
export const execFile = exec
export const fork = spawn
export const setKeyboardLayout = () => {}
export default {}
