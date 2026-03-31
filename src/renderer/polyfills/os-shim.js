const p = navigator.platform || ''
const platform = p.indexOf('Win') !== -1 ? 'win32' : p.indexOf('Mac') !== -1 ? 'darwin' : 'linux'

export function homedir () {
  return ''
}

export function tmpdir () {
  return '/tmp'
}

export function hostname () {
  return 'localhost'
}

export function type () {
  return platform === 'win32' ? 'Windows_NT' : platform === 'darwin' ? 'Darwin' : 'Linux'
}

export { platform }
export const EOL = platform === 'win32' ? '\r\n' : '\n'

export default { homedir, tmpdir, hostname, type, platform, EOL }
