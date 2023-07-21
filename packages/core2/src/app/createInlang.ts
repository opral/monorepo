import type { InlangConfig } from "../config/schema.js"
import type { InlangInstance } from "./api.js"
import type { InlangInstanceEnv } from "./env/types.js"

export function createInlang(args: {
	config: InlangConfig
	env: InlangInstanceEnv
}): InlangInstance {
	return {} as any
}
