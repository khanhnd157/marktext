import path from 'path'
import { isImageFile } from 'common/filesystem/paths'
import { isWindows } from './index'

let _invoke = null
const getInvoke = async () => {
  if (!_invoke) {
    const { invoke } = await import('@tauri-apps/api/core')
    _invoke = invoke
  }
  return _invoke
}

export const create = async (pathname, type) => {
  const inv = await getInvoke()
  if (type === 'directory') {
    await inv('create_directory', { path: pathname })
  } else {
    await inv('write_markdown_file', { path: pathname, content: '', encoding: 'utf8', lineEnding: 'lf' })
  }
}

export const paste = async ({ src, dest, type }) => {
  const inv = await getInvoke()
  if (type === 'cut') {
    await inv('rename_file', { oldPath: src, newPath: dest })
  } else {
    await inv('copy_file', { src, dest })
  }
}

export const rename = async (src, dest) => {
  const inv = await getInvoke()
  await inv('rename_file', { oldPath: src, newPath: dest })
}

export const getHash = (content) => {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

export const getContentHash = content => {
  return getHash(content)
}

export const moveToRelativeFolder = async (cwd, relativeName, filePath, imagePath) => {
  if (!relativeName) relativeName = 'assets'
  if (path.isAbsolute(relativeName)) throw new Error('Invalid relative directory name.')

  const dstPath = path.resolve(cwd, relativeName)
  const inv = await getInvoke()
  await inv('create_directory', { path: dstPath })
  const dstFile = path.resolve(dstPath, path.basename(imagePath))
  await inv('copy_file', { src: imagePath, dest: dstFile })
  return path.relative(path.dirname(filePath), dstFile)
}

export const moveImageToFolder = async (destFolder, imagePath) => {
  const dstFile = path.resolve(destFolder, path.basename(imagePath))
  const inv = await getInvoke()
  await inv('create_directory', { path: destFolder })
  await inv('copy_file', { src: imagePath, dest: dstFile })
  return dstFile
}

export const uploadImage = async (pathname, imageAction, preferences) => {
  return pathname
}
