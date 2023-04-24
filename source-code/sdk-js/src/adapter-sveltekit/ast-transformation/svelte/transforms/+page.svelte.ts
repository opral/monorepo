import type { TransformConfig } from '../../config.js'
import { transformSvelte } from './*.svelte.js'

export const transformPageSvelte = (config: TransformConfig, code: string, root: boolean) => {
	return transformSvelte(config, code)
}
