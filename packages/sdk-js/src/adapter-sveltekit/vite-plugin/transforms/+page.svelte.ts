import type { TransformConfig } from "../config.js"
import { transformSvelte } from "./_.svelte.js"

export const transformPageSvelte = (config: TransformConfig, code: string, root: boolean) => {
	return transformSvelte(config, code)
}
