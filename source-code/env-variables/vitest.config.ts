import { defineConfig } from "vitest/config"
import { buildTimeVariables } from "./src/buildTimeVariables"

export default defineConfig({
	define: buildTimeVariables(),
})
