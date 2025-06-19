import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// default timeout
		testTimeout: 30000,
		globals: true,
		environment: "node",
		server: {
			deps: {
				// we mock fs and fs.promises in loadProjectFromDirectory.test.ts we got to inline readDir to allow vite to mock fs for this package as well
				// https://github.com/vitest-dev/vitest/discussions/587
				inline: ["readdirp"],
			},
		},
	},
});

