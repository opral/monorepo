import type { TransformConfig } from '../../config.js'
import { transformJs } from './*.js.js'

export const transformLayoutJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootLayoutJs(config, code)

	return transformGenericLayoutJs(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformRootLayoutJs = (config: TransformConfig, code: string) => {
	if (code) return wrapRootLayoutJs(config, code)

	return createRootLayoutJs(config)
}

export const createRootLayoutJs = (config: TransformConfig) => {
	const options = !config.languageInUrl
		? `
initDetectors: browser
? () => [initLocalStorageDetector(localStorageKey), navigatorDetector]
: undefined,
`
		: ""

	return `
import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

export const load = initRootLayoutLoadWrapper({${options}}).wrap(async () => { })
`
}

// TODO: transform
export const wrapRootLayoutJs = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error('currently not supported')
}

// ------------------------------------------------------------------------------------------------

const transformGenericLayoutJs = transformJs