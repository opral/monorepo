import type { TransformConfig } from '../../config.js'
import { transformJs } from './*.js.js'

export const transformLayoutServerJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootLayoutServerJs(config, code)

	return transformGenericLayoutServerJs(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformRootLayoutServerJs = (config: TransformConfig, code: string) => {
	if (code) return wrapRootLayoutServerJs(config, code)

	return createRootLayoutServerJs(config)
}

export const createRootLayoutServerJs = (config: TransformConfig) => {
	return `
import { initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const load = initRootServerLayoutLoadWrapper().wrap(() => { })
`
}

// TODO: transform
export const wrapRootLayoutServerJs = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error('currently not supported')
}

// ------------------------------------------------------------------------------------------------

const transformGenericLayoutServerJs = transformJs
