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

describe('transform hooks.server.js', () => {
    it.concurrent('transformHooksServerJs returns new file if no code provided', async ({ expect }) => {
        const code = transformHooksServerJs(baseConfig, '')
        expect(code).toContain('getLanguage')
    })

    // todo: cover with real test once this implemented
    it.concurrent('wrapHooksServerJs', async ({ expect }) => {
        expect(() => wrapHooksServerJs(baseConfig, 'anything')).toThrowError('currently not supported')
    })

    it.concurrent('createHooksServerJs languageInUrl and isStatic', async ({ expect }) => {
        const config:TransformConfig = {
            ...baseConfig,
            languageInUrl: true,
            isStatic: true,
        }
        const code = createHooksServerJs(config)
        expect(code).toMatchSnapshot()
    })

    it.concurrent('createHooksServerJs isStatic', async ({ expect }) => {
        const config:TransformConfig = {
            ...baseConfig,
            isStatic: true,
        }
        const code = createHooksServerJs(config)
        expect(code).toMatchSnapshot()
    })
})