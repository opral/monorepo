import type { InlangConfig } from "../config/schema.js"
import type { InlangApp } from "./api.js"
import type { InlangAppEnvironment } from "./env/types.js"

export function createApp(args: { config: InlangConfig; env: InlangAppEnvironment }): InlangApp {
	return {} as any
}
