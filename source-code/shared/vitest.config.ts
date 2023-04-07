import { privateEnv } from "./lib/env/index.js"
import { definePublicEnvVariables } from "./lib/env/src/definePublicEnvVariables.js"
import { defineConfig } from "vitest/config"

// no config needed
export default defineConfig({
	define: definePublicEnvVariables({
		PUBLIC_IS_DEV: process.env.DEV ? "true" : "false",
		...privateEnv,
	}),
})
