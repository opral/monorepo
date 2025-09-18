import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		dedupe: ["react", "react-dom"],
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	test: {
		environment: "happy-dom",
		globals: true,
		setupFiles: ["src/setupTests.ts"],
		testTimeout: 60_000,
		hookTimeout: 60_000,
	},
});
