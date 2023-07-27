import type { Plugin } from "./api.js"

type PluginOptions = {
	pathPattern: string
}

export const examplePlugin: Plugin<PluginOptions> = {
	meta: {
		id: "inlang.plugin-i18next",
		displayName: { en: "i18next" },
		description: { en: "i18next plugin for inlang" },
		keywords: ["i18next", "react", "nextjs"],
		usedApis: ["addLintRules", "loadMessages", "saveMessages"],
	},
	setup: ({ options, inlang }) => {
		if (options.pathPattern === undefined) {
			throw Error("Path pattern is undefined")
		}
		return {
			extendLanguageTags: () => {
				return ["en-US"]
			},
			loadMessages: () => {
				for (const languageTag of inlang.config.get().languageTags) {
					console.log(languageTag + options.pathPattern)
				}
				return []
			},
			saveMessages: ({ messages }) => {
				console.log(messages)
			},
		}
	},
}
