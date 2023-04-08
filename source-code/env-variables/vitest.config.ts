import { privateEnv } from "./src/index.js"
import { definePublicEnvVariables } from "./src/definePublicEnvVariables.js"
import { defineConfig } from "vitest/config"

// no config needed
export default defineConfig({
	define: definePublicEnvVariables({
		PUBLIC_IS_DEV: process.env.DEV ? "true" : "false",
		...privateEnv,
	}),
})
