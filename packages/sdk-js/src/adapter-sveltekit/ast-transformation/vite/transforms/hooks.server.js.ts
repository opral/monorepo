import type { TransformConfig } from '../../config.js'

export const transformHooksServerJs = (config: TransformConfig, code: string) => {
	if (code) return wrapHooksServerJs(config, code)

	return createHooksServerJs(config)
}

// ------------------------------------------------------------------------------------------------

export const createHooksServerJs = (config: TransformConfig) => {
	const options = (config.languageInUrl
		? `
getLanguage: ({ url }) => url.pathname.split("/")[1],
`
		: `
getLanguage: () => undefined,
`) + (config.isStatic || !config.languageInUrl
			? `
`: `
initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
redirect: {
	throwable: redirect,
	getPath: ({ url }, language) => replaceLanguageInUrl(url, language),
},
`)

	return `
import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import { initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors/server"
import { redirect } from "@sveltejs/kit"
import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared"

export const handle = initHandleWrapper({${options}}).wrap(async ({ event, resolve }) => resolve(event))
`
}

// TODO: transform
export const wrapHooksServerJs = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error('currently not supported')
}