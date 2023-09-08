import { defineConfig } from "vitest/config"
import { buildStepVariables } from "./src/build/buildStepVariables.js"

export default defineConfig({
	define: buildStepVariables(),
})
