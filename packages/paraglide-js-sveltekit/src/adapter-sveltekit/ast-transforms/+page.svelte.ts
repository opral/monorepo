import type { VirtualModule } from "../vite-plugin/config/index.js"
import { transformSvelte } from "./_.svelte.js"

export const transformPageSvelte = (
	filePath: string,
	config: VirtualModule,
	code: string,
	root: boolean,
) => {
	return transformSvelte(filePath, config, code)
}
