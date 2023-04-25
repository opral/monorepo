import type { TransformConfig } from '../../config.js'
import { transformJs } from './*.js.js'

export const transformPageJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootPageJs(config, code)

	return transformGenericPageJs(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformRootPageJs = (config: TransformConfig, code: string) => {
	if (code) return wrapRootPageJs(config, code)

	return createRootPageJs(config)
}

export const createRootPageJs = (config: TransformConfig) => {
	if (config.isStatic && config.languageInUrl) {
		return `
import { initRootPageLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { navigatorDetector } from "@inlang/sdk-js/detectors/client"
import { browser } from "$app/environment"
import { redirect } from "@sveltejs/kit"
import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared"

export const load = initRootPageLoadWrapper({
	browser,
	initDetectors: () => [navigatorDetector],
	redirect: {
		throwable: redirect,
		getPath: ({ url }, language) => replaceLanguageInUrl(new URL(url), language),
	},
}).wrap(async () => { })
`
	}

	return ''
}

// TODO: transform
export const wrapRootPageJs = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error('currently not supported')
}

// ------------------------------------------------------------------------------------------------

const transformGenericPageJs = transformJs
