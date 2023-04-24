// ------------------------------------------------------------------------------------------------

import type { Config } from '../config.js'
import type { FileInformation } from './plugin.js'

// TODO: throw errors if something is not supported and show a guide how to add the functionality manually
// TODO: move .svelte transform to preprocessor

export const transformCode = (config: Config, code: string, { type, root }: FileInformation) => {
	switch (type) {
		case "hooks.server.js":
			return transformHooksServerJs(config, code)
		case "[language].json":
			return transformLanguageJson(config, code)
		case "+layout.server.js":
			return transformLayoutServerJs(config, code, root)
		case "+layout.js":
			return transformLayoutJs(config, code, root)
		case "+page.server.js":
			return transformPageServerJs(config, code, root)
		case "+page.js":
			return transformPageJs(config, code, root)
		case ".js":
			return transformJs(config, code)
	}
}

const transformHooksServerJs = (config: Config, code: string) => {
	if (!code) {
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

	return code
}

const transformLanguageJson = (config: Config, code: string) => {
	if (!code)
		return `
import { json } from "@sveltejs/kit"
import { getResource } from "@inlang/sdk-js/adapter-sveltekit/server"

export const GET = (({ params: { language } }) =>
	json(getResource(language) || null))
`

	return code
}

const transformLayoutServerJs = (config: Config, code: string, root: boolean) => {
	if (root && !code)
		return `
import { initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const load = initRootServerLayoutLoadWrapper().wrap(() => { })
`

	return code
}

const transformLayoutJs = (config: Config, code: string, root: boolean) => {
	if (root && !code) {
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

	return code
}

const transformPageServerJs = (config: Config, code: string, root: boolean) => {
	return code
}

const transformPageJs = (config: Config, code: string, root: boolean) => {
	if (!code && config.isStatic && config.languageInUrl) {
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
	return code
}

const transformJs = (config: Config, code: string) => {
	return code
}