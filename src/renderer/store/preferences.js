import bus from '../bus'
import { setPreference, showSelectDirectoryDialog, getPreferences } from '@/services/tauri-api'
import { onEvent } from '@/services/tauri-events'

const state = {
  autoSave: false,
  autoSaveDelay: 5000,
  titleBarStyle: 'custom',
  openFilesInNewWindow: false,
  openFolderInNewWindow: false,
  zoom: 1.0,
  hideScrollbar: false,
  wordWrapInToc: false,
  fileSortBy: 'created',
  startUpAction: 'lastState',
  defaultDirectoryToOpen: '',
  language: 'en',

  editorFontFamily: 'Open Sans',
  fontSize: 16,
  lineHeight: 1.6,
  codeFontSize: 14,
  codeFontFamily: 'DejaVu Sans Mono',
  codeBlockLineNumbers: true,
  trimUnnecessaryCodeBlockEmptyLines: true,
  editorLineWidth: '',

  autoPairBracket: true,
  autoPairMarkdownSyntax: true,
  autoPairQuote: true,
  endOfLine: 'default',
  defaultEncoding: 'utf8',
  autoGuessEncoding: true,
  trimTrailingNewline: 2,
  textDirection: 'ltr',
  hideQuickInsertHint: false,
  imageInsertAction: 'folder',
  imagePreferRelativeDirectory: false,
  imageRelativeDirectoryName: 'assets',
  hideLinkPopup: false,
  autoCheck: false,

  preferLooseListItem: true,
  bulletListMarker: '-',
  orderListDelimiter: '.',
  preferHeadingStyle: 'atx',
  tabSize: 4,
  listIndentation: 1,
  frontmatterType: '-',
  superSubScript: false,
  footnote: false,
  isHtmlEnabled: true,
  isGitlabCompatibilityEnabled: false,
  sequenceTheme: 'hand',

  theme: 'light',
  autoSwitchTheme: 2,

  spellcheckerEnabled: false,
  spellcheckerNoUnderline: false,
  spellcheckerLanguage: 'en-US',

  sideBarVisibility: false,
  tabBarVisibility: false,
  sourceCodeModeEnabled: false,

  searchExclusions: [],
  searchMaxFileSize: '',
  searchIncludeHidden: false,
  searchNoIgnore: false,
  searchFollowSymlinks: true,

  watcherUsePolling: false,

  typewriter: false,
  focus: false,
  sourceCode: false,

  imageFolderPath: '',
  webImages: [],
  cloudImages: [],
  currentUploader: 'none',
  githubToken: '',
  imageBed: {
    github: {
      owner: '',
      repo: '',
      branch: ''
    }
  },
  cliScript: ''
}

const getters = {}

const mutations = {
  SET_USER_PREFERENCE (state, preference) {
    Object.keys(preference).forEach(key => {
      if (typeof preference[key] !== 'undefined' && typeof state[key] !== 'undefined') {
        state[key] = preference[key]
      }
    })
  },
  SET_MODE (state, { type, checked }) {
    state[type] = checked
  },
  TOGGLE_VIEW_MODE (state, entryName) {
    state[entryName] = !state[entryName]
  }
}

const actions = {
  async ASK_FOR_USER_PREFERENCE ({ commit }) {
    try {
      const preferences = await getPreferences()
      if (preferences) {
        commit('SET_USER_PREFERENCE', preferences)
      }
    } catch (e) {
      console.warn('[preferences] get_preferences failed:', e)
    }
  },

  SET_SINGLE_PREFERENCE ({ commit }, { type, value }) {
    setPreference(type, value)
  },

  SET_USER_DATA ({ commit }, { type, value }) {
    setPreference(type, value)
  },

  async SET_IMAGE_FOLDER_PATH ({ commit }, value) {
    const folder = await showSelectDirectoryDialog(value)
    if (folder) {
      setPreference('imageFolderPath', folder)
    }
  },

  async SELECT_DEFAULT_DIRECTORY_TO_OPEN ({ commit }) {
    const folder = await showSelectDirectoryDialog()
    if (folder) {
      setPreference('defaultDirectoryToOpen', folder)
    }
  },

  LISTEN_FOR_VIEW ({ commit, dispatch }) {
    onEvent('mt::show-command-palette', () => {
      bus.$emit('show-command-palette')
    })
    onEvent('mt::toggle-view-mode-entry', (entryName) => {
      commit('TOGGLE_VIEW_MODE', entryName)
      dispatch('DISPATCH_EDITOR_VIEW_STATE', { [entryName]: state[entryName] })
    })
  },

  LISTEN_TOGGLE_VIEW ({ commit, dispatch, state }) {
    bus.$on('view:toggle-view-entry', entryName => {
      commit('TOGGLE_VIEW_MODE', entryName)
      dispatch('DISPATCH_EDITOR_VIEW_STATE', { [entryName]: state[entryName] })
    })
  },

  DISPATCH_EDITOR_VIEW_STATE (_, viewState) {
    // no-op in Tauri (no native menu to sync)
  }
}

const preferences = { state, getters, mutations, actions }

export default preferences
