import type { TransformConfig } from '../config.js'
import type { FileInformation } from './plugin.js'
import { transformJs } from './transforms/*.js.js'
import { transformLayoutJs } from './transforms/+layout.js.js'
import { transformLayoutServerJs } from './transforms/+layout.server.js.js'
import { transformPageJs } from './transforms/+page.js.js'
import { transformPageServerJs } from './transforms/+page.server.js.js'
import { transformHooksServerJs } from './transforms/hooks.server.js.js'
import { transformLanguageJson } from './transforms/[language].json.js'

// TODO: throw errors if something is not supported and show a guide how to add the functionality manually

export const transformCode = (config: TransformConfig, code: string, { type, root }: FileInformation) => {
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
		case "*.js":
			return transformJs(config, code)
	}
}
