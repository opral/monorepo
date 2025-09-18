import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Plugin e2e tests materialize markdown ASTs and can take a bit longer.
		testTimeout: 120_000,
		include: ["src/**/*.test.ts"],
	},
});
