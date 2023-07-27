import type { InlangInstance } from "../app/api.js"
import type { LintRule } from "../lint/api.js"
import type { Message } from "../message/schema.js"
import type { TranslatedStrings } from "../types.js"

type JSONSerializable<
	T extends Record<string, string | string[] | Record<string, string | string[]>>,
> = T

export type Plugin<
	PluginOptions extends Record<string, string | string[]> = Record<string, never>,
> = {
	// * Must be JSON serializable if we want an external plugin manifest in the future.
	meta: JSONSerializable<{
		id: `${string}.${string}`
		displayName: TranslatedStrings
		description: TranslatedStrings
		keywords: string[]
		/**
		 * The APIs that the plugin uses.
		 *
		 * If the plugin uses an API that is not listed here, the plugin will not be loaded.
		 * Mainly used for the plugin marketplace.
		 */
		usedApis: ("loadMessages" | "saveMessages" | "addLintRules")[]
	}>
	/**
	 * The setup function is the first function that is called when inlang loads the plugin.
	 *
	 * Use the setup function to initialize state, handle the options and more.
	 */
	setup: (args: { options: PluginOptions; inlang: InlangInstance }) => {
		/**
		 * Load messages.
		 *
		 * - if messages with language tags that are not defined in the config.languageTags
		 *   are returned, the user config will be automatically updated to include the
		 *   new language tags.
		 */
		loadMessages?: () => Message[]
		saveMessages?: (args: { messages: Message[] }) => void
		addLintRules?: () => LintRule[]
	}
}
