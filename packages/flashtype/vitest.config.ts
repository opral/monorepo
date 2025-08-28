import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["src/setupTests.ts"],
	},
});
