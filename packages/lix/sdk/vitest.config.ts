import { defineConfig, defineProject } from "vitest/config";
import { playwright } from "@vitest/browser/providers/playwright";
import codspeedPlugin from "@codspeed/vitest-plugin";

const COMMON_EXCLUDES = [
	"node_modules/**",
	"dist/**",
	"build/**",
	"coverage/**",
	"**/*.d.ts",
	".{git,cache,output,idea}/**",
];

export default defineConfig({
	plugins: [process.env.CODSPEED_BENCH ? codspeedPlugin() : undefined],
	test: {
		// Define projects to run both Node and Browser tests.
		projects: [
			defineProject({
				test: {
					name: "node",
					// increased default timeout to avoid ci/cd issues
					testTimeout: 120000,
					// Only pick up tests from src; ignore compiled output in dist
					include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
					exclude: [...COMMON_EXCLUDES, "**/*.browser.test.ts"],
					environment: "node",
				},
			}),
			defineProject({
				test: {
					name: "browser",
					// increased default timeout to avoid ci/cd issues
					testTimeout: 120000,
					include: ["src/**/*.browser.test.ts"],
					exclude: [...COMMON_EXCLUDES, "**/*.node.test.ts"],
					browser: {
						provider: playwright(),
						enabled: true,
						screenshotFailures: false,
						headless: true,
						instances: [{ browser: "chromium" }],
					},
				},
			}),
		],
	},
});
