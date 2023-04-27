import { describe, it } from 'vitest'
import {transformHooksServerJs, wrapHooksServerJs, createHooksServerJs } from '../transforms/hooks.server.js.js'
import type {TransformConfig} from "../config.js";

const baseConfig:TransformConfig = {
    isStatic: false,
    languageInUrl: false,
    srcFolder: '',
    rootRoutesFolder: '',
    hasAlreadyBeenInitialized: false,
}

describe('transformHooksServerJs', () => {
    it('returns new file if no code provided', ({ expect }) => {
        const code = transformHooksServerJs(baseConfig, '')
        expect(code).toContain('getLanguage')
    })
})
describe('wrapHooksServerJs', () => {
    // todo: cover with real test once this implemented
    it('temporarily throws error', ({ expect }) => {
        expect(() => wrapHooksServerJs(baseConfig, 'anything')).toThrowError('currently not supported')
    })
})

describe('createHooksServerJs', () => {
    it('languageInUrl and isStatic', ({ expect }) => {
        const config:TransformConfig = {
            ...baseConfig,
            languageInUrl: true,
            isStatic: true,
        }
        const code = createHooksServerJs(config)
        expect(code).toMatchSnapshot()
    })

    it('isStatic', ({ expect }) => {
        const config:TransformConfig = {
            ...baseConfig,
            isStatic: true,
        }
        const code = createHooksServerJs(config)
        expect(code).toMatchSnapshot()
    })
})