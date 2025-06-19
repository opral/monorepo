import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// default timeout
		testTimeout: 20000,
		coverage: {
			include: ["src/**/*"],
			exclude: ["src/cli/**/*", "src/bundler-plugins/**/*"],
		},
	},
});
