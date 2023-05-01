import type { Language } from "../ast/index.js"
import type * as ast from "../ast/index.js"
import type { InlangEnvironment } from '../environment/types.js'
import type { LintRule } from "../lint/rule.js"
import type { Plugin, PluginSetupFunction } from '../plugin/types.js'

/**
 * The entrypoint for inlang.
 *
 * Read more https://inlang.com/documentation/config
 */
export type DefineConfig = (
	env: InlangEnvironment,
) => Promise<InlangConfig | WithRequired<Partial<InlangConfig>, "plugins">>

/**
 * The inlang config module.
 *
 * Use this type to cast an import of an "inlang.config.js" file.
 *
 * @example
 * 	import type { ConfigModule } from "@inlang/core/config"
 *
 * 	const module = (await import("./inlang.config.js")) as InlangConfigModule
 */
export type InlangConfigModule = {
	defineConfig: DefineConfig
}

/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type InlangConfig = {
	/**
	 * The reference language that other messages are validated against.
	 *
	 * The languages can be named freely. It's advisable to follow the IETF BCP 47 language tag scheme.
	 * In most cases, the reference language is `en-US` (American English).
	 *
	 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
	 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	referenceLanguage: Language
	/**
	 * Available languages in this project.
	 *
	 * The languages can be named freely. It's advisable to follow the IETF BCP 47 language tag scheme.
	 *
	 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
	 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	languages: Language[]
	readResources: (args: { config: InlangConfig }) => Promise<ast.Resource[]>
	writeResources: (args: { config: InlangConfig; resources: ast.Resource[] }) => Promise<void>

	/**
	 * Plugins to extend the functionality of inlang.
	 *
	 * @example
	 *  plugins: [
	 * 	 	myPlugin({
	 * 	   	pathPattern: "hello",
	 * 	 	})
	 *  ]
	 */
	plugins?: Array<Plugin | PluginSetupFunction>

	lint?: {
		rules: (LintRule | LintRule[])[]
	}

	/**
	 * WARNING: Experimental properties are not required,
	 * can change at any time and do not lead to a MAJOR version bump.
	 *
	 * Read more under https://inlang.com/documentation/breaking-changes
	 */
	experimental?: Record<string, unknown>

	ideExtension?: {
		/**
		 * Defines matchers for message references inside the code.
		 *
		 * @param args represents the data to conduct the search on
		 * @returns a promise with matched message references
		 */
		messageReferenceMatchers: ((args: { documentText: string }) => Promise<
			Array<{
				/**
				 * The messages id.
				 */
				messageId: string
				/**
				 * The position from where to where the reference can be found.
				 */
				position: {
					start: { line: number; character: number }
					end: { line: number; character: number }
				}
			}>
		>)[]

		/**
		 * Defines the options to extract messages.
		 */
		extractMessageOptions: {
			/**
			 * Function which is called, when the user finished the message extraction command.
			 *
			 * @param messageId is the message identifier entered by the user
			 * @param selection is the text which was extracted
			 * @returns the code which is inserted into the document
			 */
			callback: (messageId: string, selection: string) => string
		}[]

		/**
		 * An array of VSCode DocumentSelectors.
		 *
		 * The document selectors specify for which files/programming languages
		 * (typescript, svelte, etc.) the extension should be activated.
		 *
		 * See https://code.visualstudio.com/api/references/document-selector
		 */
		// documentSelectors: DocumentSelector[];
	}
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
