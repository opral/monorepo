
import type { TransformConfig } from '../config.js'
import { transformJs } from './*.js.js'

export const transformPageServerJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootPageServerJs(config, code)

	return transformGenericPageServerJs(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformRootPageServerJs = (config: TransformConfig, code: string) => {
	if (code) return wrapRootPageServerJs(config, code)

	return createRootPageServerJs(config)
}

// TODO: transform
export const createRootPageServerJs = (config: TransformConfig) => {
	return ''
}

// TODO: transform
export const wrapRootPageServerJs = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error('currently not supported')
}

// ------------------------------------------------------------------------------------------------

const transformGenericPageServerJs = transformJs
