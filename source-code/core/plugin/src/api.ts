import type { InlangConfig } from "@inlang/config"
import type { InlangEnvironment } from "@inlang/environment"
import { TranslatedStrings } from "@inlang/language-tag"
import type { LintRule } from "../../lint/dist/index.js"
import type { Message } from "@inlang/messages"
import { z } from "zod"
import type {
	PluginApiAlreadyDefinedException,
	PluginException,
	PluginImportException,
	PluginIncorrectlyDefinedUsedApisException,
	PluginUsesReservedNamespaceException,
	PluginUsesUnavailableApiException,
} from "./exceptions.js"

type JSONSerializable<
	T extends Record<string, string | string[] | Record<string, string | string[]>>,
> = T

/**
 * Regex for valid plugin ids.
 */
export const pluginIdRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type Plugin<
	PluginOptions extends Record<string, string | string[]> = Record<string, string>,
	AppSpecificApis extends object = {},
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
		usedApis: z.infer<typeof Plugin>["meta"]["usedApis"]
	}>
	/**
	 * The setup function is the first function that is called when inlang loads the plugin.
	 *
	 * Use the setup function to initialize state, handle the options and more.
	 */
	setup: (args: { options: PluginOptions; config: Readonly<InlangConfig> }) => {
		/**
		 * Load messages.
		 *
		 * - if messages with language tags that are not defined in the config.languageTags
		 *   are returned, the user config will be automatically updated to include the
		 *   new language tags.
		 */
		loadMessages?: (args: {}) => Promise<Message[]> | Message[]
		saveMessages?: (args: { messages: Message[] }) => Promise<void> | void
		addLintRules?: () => LintRule[]
		/**
		 * Define app specific APIs.
		 *
		 * @example
		 * addAppSpecificApi: () => ({
		 * 	 "inlang.ide-extension": {
		 * 	   messageReferenceMatcher: () => {}
		 * 	 }
		 *  })
		 */
		addAppSpecificApi?: () => AppSpecificApis
		// afterSetup: () => {}
	}
}

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePlugins = <AppSpecificApis extends object = {}>(args: {
	config: InlangConfig
	env: InlangEnvironment
}) => Promise<{
	data: ResolvedPluginsApi<AppSpecificApis>
	errors: Array<
		| PluginException
		| PluginImportException
		| PluginApiAlreadyDefinedException
		| PluginUsesUnavailableApiException
		| PluginUsesReservedNamespaceException
		| PluginIncorrectlyDefinedUsedApisException
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginsApi<AppSpecificApis extends object = {}> = {
	loadMessages: () => Promise<Message[]>
	saveMessages: (args: { messages: Message[] }) => Promise<void>
	lintRules: LintRule[]
	/**
	 * App specific APIs.
	 *
	 * @example
	 *  appSpecificApi["inlang.ide-extension"].messageReferenceMatcher()
	 */
	appSpecificApi: AppSpecificApis
	/**
	 * Meta information about the imported plugins.
	 */
	plugins: Array<Plugin["meta"] & { module: string }>
}

// --------------------------------------------- ZOD ---------------------------------------------

export const Plugin = z.object({
	meta: z.object({
		id: z.custom<Plugin["meta"]["id"]>((value) => pluginIdRegex.test(value as string)),
		displayName: TranslatedStrings,
		description: TranslatedStrings,
		keywords: z.array(z.string()),
		usedApis: z.array(
			z.union([
				z.literal("loadMessages"),
				z.literal("saveMessages"),
				z.literal("addLintRules"),
				z.literal("addAppSpecificApi"),
			]),
		),
	}),
	setup: z
		.function()
		.args(z.custom<Parameters<Plugin["setup"]>[0]>())
		.returns(z.custom<ReturnType<Plugin["setup"]>>()),
})
