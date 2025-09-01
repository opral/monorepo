import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	test: {
		environment: "happy-dom",
		globals: true,
		setupFiles: ["src/setupTests.ts"],
	},
});
