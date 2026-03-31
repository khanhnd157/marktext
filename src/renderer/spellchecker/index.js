import { invoke } from '@/services/tauri-api'
import { isOsx } from '@/util'

/**
 * High level spell checker API based on Chromium built-in spell checker.
 */
export class SpellChecker {
  /**
   * ctor
   *
   * @param {boolean} enabled Whether spell checking is enabled in settings.
   */
  constructor (enabled = true, lang) {
    this.enabled = enabled
    this.currentSpellcheckerLanguage = lang

    // Helper to forbid the usage of the spell checker (e.g. failed to create native spell checker),
    // even if spell checker is enabled in settings.
    this.isProviderAvailable = true
  }

  /**
   * Whether the spell checker is available and enabled.
   */
  get isEnabled () {
    return this.isProviderAvailable && this.enabled
  }

  /**
   * Enable the spell checker and sets `lang` or tries to find a fallback.
   *
   * @param {string} lang The language to set.
   * @returns {Promise<boolean>}
   */
  async activateSpellchecker (lang) {
    try {
      this.enabled = true
      this.isProviderAvailable = true
      if (isOsx) {
        // No language string needed on macOS.
        return await invoke('spellchecker_set_enabled', true)
      }
      return await this.switchLanguage(lang || this.currentSpellcheckerLanguage)
    } catch (error) {
      this.deactivateSpellchecker()
      throw error
    }
  }

  /**
   * Disables the native spell checker.
   */
  deactivateSpellchecker () {
    this.enabled = false
    this.isProviderAvailable = false
    invoke('spellchecker_set_enabled', false)
  }

  /**
   * Return the current language.
   */
  get lang () {
    if (this.isEnabled) {
      return this.currentSpellcheckerLanguage
    }
    return ''
  }

  set lang (lang) {
    this.currentSpellcheckerLanguage = lang
  }

  /**
   * Explicitly switch the language to a specific language.
   *
   * NOTE: This function can throw an exception.
   *
   * @param {string} lang The language code
   * @returns {Promise<boolean>} Return the language on success or null.
   */
  async switchLanguage (lang) {
    if (isOsx) {
      // NB: On macOS the OS spell checker is used and will detect the language automatically.
      return true
    } else if (!lang) {
      throw new Error('Expected non-empty language for spell checker.')
    } else if (this.isEnabled) {
      await invoke('spellchecker_switch_language', lang)
      this.lang = lang
      return true
    }
    return false
  }

  /**
   * Returns a list of available dictionaries.
   * @returns {Promise<string[]>} Available dictionary languages.
   */
  static async getAvailableDictionaries () {
    if (isOsx) {
      // NB: On macOS the OS spell checker is used and will detect the language automatically.
      return []
    }
    return invoke('spellchecker_get_available_dictionaries')
  }
}
