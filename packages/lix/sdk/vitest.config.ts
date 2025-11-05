import { defineConfig, defineProject } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import codspeedPlugin from "@codspeed/vitest-plugin";

const COMMON_EXCLUDES = [
	"node_modules/**",
	"dist/**",
	"build/**",
	"coverage/**",
	"**/*.d.ts",
	".{git,cache,output,idea}/**",
];

const isBenchRun = process.argv.includes("bench");

const nodeProject = defineProject({
	test: {
		name: "node",
		// increased default timeout to avoid ci/cd issues
		testTimeout: 120000,
		// Only pick up tests from src; ignore compiled output in dist
		include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
		exclude: [...COMMON_EXCLUDES, "**/*.browser.test.ts"],
		environment: "node",
	},
});

const browserProject = defineProject({
	test: {
		name: "browser",
		// increased default timeout to avoid ci/cd issues
		testTimeout: 120000,
		include: ["src/**/*.browser.test.ts"],
		exclude: [...COMMON_EXCLUDES, "**/*.node.test.ts"],
		browser: {
			enabled: true,
			headless: true,
			provider: playwright({
				launchOptions: { headless: true },
			}),
			instances: [{ browser: "chromium" }],
			screenshotFailures: false,
		},
	},
});

const projects = [nodeProject];
if (!isBenchRun) {
	projects.push(browserProject);
}

export default defineConfig({
	plugins: [process.env.CODSPEED_BENCH ? codspeedPlugin() : undefined],
	test: {
		projects,
	},
});
