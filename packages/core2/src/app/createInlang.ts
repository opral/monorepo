import type { InlangInstance } from "./api.js"
import type { InlangInstanceEnvironment } from "./environment/index.js"

export function createInlang(args: {
	configPath: string
	env: InlangInstanceEnvironment
}): InlangInstance {
	return {} as any
}
