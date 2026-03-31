export const readFile = async () => ''
export const writeFile = async () => {}
export const mkdir = async () => {}
export const readdir = async () => []
export const stat = async () => ({ isFile: () => false, isDirectory: () => false })
export const unlink = async () => {}
export const rename = async () => {}
export const access = async () => {}
export const copyFile = async () => {}
export const realpath = async (p) => p

export default { readFile, writeFile, mkdir, readdir, stat, unlink, rename, access, copyFile, realpath }
