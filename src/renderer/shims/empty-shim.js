export const spawn = () => ({
  stdout: { on: () => {} },
  stderr: { on: () => {} },
  on: () => {},
  kill: () => {}
})
export const exec = (cmd, cb) => { if (cb) cb(null, '', '') }
export const execSync = () => ''
export default {}
