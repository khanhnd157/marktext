import bus from '../bus'
import staticCommands, { RootCommand } from '../commands'
import { onEvent } from '@/services/tauri-events'

const state = {
  rootCommand: new RootCommand(staticCommands)
}

const getters = {}

const mutations = {
  REGISTER_COMMAND (state, command) {
    state.rootCommand.subcommands.push(command)
  },
  SORT_COMMANDS (state) {
    state.rootCommand.subcommands.sort((a, b) => a.description.localeCompare(b.description))
  }
}

const actions = {
  LISTEN_COMMAND_CENTER_BUS ({ commit, state }) {
    bus.$on('cmd::sort-commands', () => {
      commit('SORT_COMMANDS')
    })
    onEvent('mt::keybindings-response', (keybindingMap) => {
      const { subcommands } = state.rootCommand
      for (const entry of subcommands) {
        const value = keybindingMap[entry.id]
        if (value) {
          entry.shortcut = normalizeAccelerator(value)
        }
      }
    })

    bus.$on('cmd::register-command', command => {
      commit('REGISTER_COMMAND', command)
    })

    bus.$on('cmd::execute', commandId => {
      executeCommand(state, commandId)
    })
    onEvent('mt::execute-command-by-id', (commandId) => {
      executeCommand(state, commandId)
    })
  }
}

const executeCommand = (state, commandId) => {
  const { subcommands } = state.rootCommand
  const command = subcommands.find(c => c.id === commandId)
  if (!command) {
    const errorMsg = `Cannot execute command "${commandId}" because it's missing.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }
  command.execute()
}

const normalizeAccelerator = acc => {
  try {
    return acc
      .replace(/cmdorctrl|cmd/i, 'Cmd')
      .replace(/ctrl/i, 'Ctrl')
      .split('+')
  } catch (_) {
    return [acc]
  }
}

export default { state, getters, mutations, actions }
