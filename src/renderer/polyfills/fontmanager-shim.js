export const getAvailableFonts = (callback) => {
  if (typeof callback === 'function') {
    callback([])
  }
}

export const getAvailableFontsSync = () => []

export default { getAvailableFonts, getAvailableFontsSync }
