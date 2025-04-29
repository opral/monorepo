import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	{
		test: {
			name: "node",
			environment: "node",
		},
	},
	// {
	// 	test: {
	// 		name: "browser",
	// 		browser: {
	// 			enabled: true,
	// 			ui: true,
	// 			provider: "playwright",
	// 			// https://vitest.dev/guide/browser/playwright
	// 			instances: [{ browser: "chromium" }],
	// 		},
	// 	},
	// },
]);
