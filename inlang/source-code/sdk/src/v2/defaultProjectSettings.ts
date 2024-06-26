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
		"https://raw.githubusercontent.com/opral/monorepo/f6da6761ccbdf652c35eaa645b9c91747655526f/inlang/source-code/sdk/src/v2-lint-rule/index.js",
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
	lintConfig: [
		{ ruleId: "messageBundleLintRule.test.MissingPattern", level: "warning", messageLocale: de }
		{ ruleId: "messageBundleLintRule.test.TODO", level: "warning" }
	],
} satisfies ProjectSettings2
