import type { ProjectSettings2 } from "./types/index.js"

/**
 * Default project settings for createNewProject
 * from paraglide-js/src/cli/commands/init/defaults.ts
 */
export const defaultProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	baseLocale: "en",
	locales: ["en", "de"],
	modules: [
		"sdk-dev:opral-uppercase-lint.js",
		"sdk-dev:missing-selector-lint-rule.js",
		"sdk-dev:missing-catchall-variant",
		// for instant gratification, we're adding common rules
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
		// default to the message format plugin because it supports all features
		// "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
		// the m function matcher should be installed by default in case Sherlock (VS Code extension) is adopted
		// "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js",
	],
	"plugin.inlang.messageFormat": {
		pathPattern: "./messages/{languageTag}.json",
	},
	lintConfig: [{ ruleId: "messageBundleLintRule.test.TODO", level: "warning" }],
} satisfies ProjectSettings2
