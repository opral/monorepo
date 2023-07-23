import type { InlangInstance } from "../app/api.js"
import type { LanguageTag } from "../languageTag.js"
import type { LintRule } from "../lint/api.js"
import type { Message } from "../messages/schema.js"

type JSONSerializable<T extends Record<string, string | string[]>> = T

export type Plugin<
	PluginOptions extends Record<string, string | string[]> = Record<string, never>,
> = {
	// * Must be JSON serializable if we want an external plugin manifest in the future.
	meta: JSONSerializable<{
		id: `${string}.${string}`
		displayName: string
		// TODO make translatable after https://github.com/inlang/inlang/pull/1155
		description: string
		keywords: string[]
	}>
	/**
	 * The setup function is the first function that is called when inlang loads the plugin.
	 *
	 * Use the setup function to initialize state, handle the options and more.
	 */
	setup: (args: { options: PluginOptions; inlang: InlangInstance }) => {
		extendLanguageTags?: () => LanguageTag[]
		loadMessages?: () => Message[]
		saveMessages?: (args: { messages: Message[] }) => void
		addLintRules?: () => LintRule[]
	}
}

// ----------------- EXAMPLE PLUGIN -----------------

type PluginOptions = {
	pathPattern: string
}

export const examplePlugin: Plugin<PluginOptions> = {
	meta: {
		id: "inlang.plugin-i18next",
		displayName: "i18next",
		description: "i18next plugin for inlang",
		keywords: ["i18next", "react", "nextjs"],
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
