import type { InlangInstance } from "../app/api.js"
import type { LanguageTag } from "../languageTag.js"
import type { LintRule } from "../lint/api.js"
import type { Message } from "../messages/schema.js"

export type Plugin<
	PluginOptions extends Record<string, string | string[]> = Record<string, never>,
> = {
	id: `${string}.${string}`
	displayName: string
	// TODO make translatable after https://github.com/inlang/inlang/pull/1155
	description: string
	keywords: string[]
	/**
	 * The setup function is the first function that is called when inlang loads the plugin.
	 *
	 * Use the setup function to initialize state, handle the options and more.
	 */
	setup: (args: { options: PluginOptions; inlang: InlangInstance }) => Promise<void> | void
	extendLanguageTags?: () => LanguageTag[]
	loadMessages?: () => Message[]
	saveMessages?: (args: { messages: Message[] }) => void
	addLintRules?: () => LintRule[]
}

// ----------------- EXAMPLE PLUGIN -----------------

type PluginOptions = {
	pathPattern: string
}

// this state is module scoped and can be used in all plugin functions
let options: PluginOptions
let inlang: InlangInstance

export const examplePlugin: Plugin<PluginOptions> = {
	id: "inlang.plugin-i18next",
	displayName: "i18next",
	description: "i18next plugin for inlang",
	keywords: ["i18next", "react", "nextjs"],
	setup: (args) => {
		options = args.options
		inlang = args.inlang
		if (options.pathPattern === undefined) {
			throw Error("Path pattern is undefined")
		}
	},
	extendLanguageTags: () => {
		return ["en-US"]
	},
	loadMessages: () => {
		for (const languageTag of inlang.config.languageTags) {
			console.log(languageTag + options.pathPattern)
		}
		return []
	},
	saveMessages: ({ messages }) => {
		console.log(messages)
	},
}

export const examplePlugin2NotWorking: Plugin<PluginOptions> = {
	id: "inlang.plugin-i18next",
	displayName: "i18next",
	description: "i18next plugin for inlang",
	keywords: ["i18next", "react", "nextjs"],
	setup: ({ options, inlang }) => {
		//! The following line will crash any static access to plugin functions
		if (options.pathPattern === undefined) {
			throw Error("Path pattern is undefined")
		}
		return {
			extendLanguageTags: () => {
				return ["en-US"]
			},
			loadMessages: () => {
				for (const languageTag of inlang.config.languageTags) {
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
