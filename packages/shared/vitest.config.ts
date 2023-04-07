import { getPrivateEnvVariables, definePublicEnvVariables } from "./env.js"
import { defineConfig } from "vitest/config"

// load env variables into the test environment
const env = await getPrivateEnvVariables()

// no config needed
export default defineConfig({
	define: await definePublicEnvVariables(env)
})
