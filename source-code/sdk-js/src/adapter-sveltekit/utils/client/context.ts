import * as language_in_memory from './context.language-in-memory.js'
import * as language_in_url from './context.language-in-url.js'

// TODO: create dynamic export
// TODO: check if this approach is tree-shakable. Probably not ^^

type Mode = 'in-url' | 'in-memory'

let mode: Mode = 'in-url'

export const setContextMode = (newMode: Mode) => mode = newMode

export const getInlangContext = () => mode === 'in-url' ? language_in_url.getInlangContext() : language_in_memory.getInlangContext()

export const setInlangContext = (...args: [any]) => mode === 'in-url' ? language_in_url.setInlangContext(...args) : language_in_memory.setInlangContext(...args)

export const localStorageKey = language_in_memory.localStorageKey