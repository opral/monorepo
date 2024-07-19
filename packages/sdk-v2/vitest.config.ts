import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		maxConcurrency: 1,
		singleThread: true,
		setupFiles: ["@vitest/web-worker"],
	},
	resolve: {
		conditions: ["vitest"],
	},
})
