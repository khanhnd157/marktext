export const platform = () => {
  const p = navigator.platform
  if (p.includes('Win')) return 'win32'
  if (p.includes('Mac')) return 'darwin'
  return 'linux'
}
export const homedir = () => ''
export const tmpdir = () => '/tmp'
export const hostname = () => 'localhost'
export const type = () => platform() === 'win32' ? 'Windows_NT' : platform() === 'darwin' ? 'Darwin' : 'Linux'
export const release = () => ''
export const EOL = platform() === 'win32' ? '\r\n' : '\n'
export default { platform, homedir, tmpdir, hostname, type, release, EOL }
