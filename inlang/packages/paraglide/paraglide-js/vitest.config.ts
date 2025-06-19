import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// default timeout
		testTimeout: 30000,
		coverage: {
			include: ["src/**/*"],
			exclude: ["src/cli/**/*", "src/bundler-plugins/**/*"],
		},
	},
});
