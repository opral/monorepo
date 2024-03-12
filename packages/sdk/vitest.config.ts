import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		maxConcurrency: 1,
		singleThread: true,
	},
})
