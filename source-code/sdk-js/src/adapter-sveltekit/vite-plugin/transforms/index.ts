import type { TransformConfig } from '../config.js'
import type { FileInformation } from '../vite-plugin.js'
import { transformJs } from './*.js.js'
import { transformSvelte } from './*.svelte.js'
import { transformLayoutJs } from './+layout.js.js'
import { transformLayoutServerJs } from './+layout.server.js.js'
import { transformLayoutSvelte } from './+layout.svelte.js'
import { transformPageJs } from './+page.js.js'
import { transformPageServerJs } from './+page.server.js.js'
import { transformPageSvelte } from './+page.svelte.js'
import { transformHooksServerJs } from './hooks.server.js.js'
import { transformLanguageJson } from './[language].json.js'

// TODO: throw errors if something is not supported and show a guide how to add the functionality manually

export const transformCode = (config: TransformConfig, code: string, { type, root }: FileInformation) => {
	// TODO: check if .svelte files are already transformed. If yes, throw an error. Only do it once per start, as this never changes once running
	switch (type) {
		case "hooks.server.js":
			return transformHooksServerJs(config, code)
		case "[language].json":
			return transformLanguageJson(config, code)
		case "+layout.server.js":
			return transformLayoutServerJs(config, code, root)
		case "+layout.js":
			return transformLayoutJs(config, code, root)
		case "+layout.svelte":
			return transformLayoutSvelte(config, code, root)
		case "+page.server.js":
			return transformPageServerJs(config, code, root)
		case "+page.js":
			return transformPageJs(config, code, root)
		case "+page.svelte":
			return transformPageSvelte(config, code, root)
		case "*.js":
			return transformJs(config, code)
		case "*.svelte":
			return transformSvelte(config, code)
	}
}
