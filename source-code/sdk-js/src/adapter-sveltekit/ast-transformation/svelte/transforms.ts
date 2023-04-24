
import type { TransformConfig } from '../config.js'
import type { FileInformation } from './preprocessor.js'
import { transformSvelte } from './transforms/*.svelte.js'
import { transformLayoutSvelte } from './transforms/+layout.svelte.js'
import { transformPageSvelte } from './transforms/+page.svelte.js'

// ------------------------------------------------------------------------------------------------

export const transformCode = (config: TransformConfig, code: string, { type, root }: FileInformation) => {
	switch (type) {
		case "+layout.svelte":
			return transformLayoutSvelte(config, code, root)
		case "+page.svelte":
			return transformPageSvelte(config, code, root)
		case "*.svelte":
			return transformSvelte(config, code)
	}
}
