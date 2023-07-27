import type { InlangConfig } from "@inlang/config"
import type { InlangEnvironment } from "@inlang/environment"
import { TranslatedStrings } from "@inlang/language-tag"
import type { LintRule } from "@inlang/lint-api"
import type { Message } from "@inlang/messages"
import { z } from "zod"
import type {
	PluginApiAlreadyDefinedError,
	PluginError,
	PluginImportError,
	PluginIncorrectlyDefinedUsedApisError,
	PluginUsesReservedNamespaceError,
	PluginUsesUnavailableApiError,
} from "./errors.js"

type JSONSerializable<
	T extends Record<string, string | string[] | Record<string, string | string[]>>,
> = T

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type PluginApi<
	PluginOptions extends Record<string, string | string[]> = Record<string, never>,
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
		usedApis: z.infer<typeof PluginApi>["meta"]["usedApis"]
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
		| PluginError
		| PluginImportError
		| PluginApiAlreadyDefinedError
		| PluginUsesUnavailableApiError
		| PluginUsesReservedNamespaceError
		| PluginIncorrectlyDefinedUsedApisError
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
	plugins: Array<PluginApi["meta"] & { module: string }>
}

// --------------------------------------------- ZOD ---------------------------------------------

export const PluginApi = z.object({
	meta: z.object({
		id: z.custom<PluginApi["meta"]["id"]>((value) =>
			/^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value as string),
		),
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
		.args(z.object({ options: z.record(z.string()), config: z.any(), env: z.any() }))
		.returns(
			z.object({
				loadMessages: z.custom<ReturnType<PluginApi["setup"]>["loadMessages"]>(),
				saveMessages: z.custom<ReturnType<PluginApi["setup"]>["saveMessages"]>(),
				addLintRules: z.custom<ReturnType<PluginApi["setup"]>["addLintRules"]>(),
				addAppSpecificApi: z.custom<ReturnType<PluginApi["setup"]>["addAppSpecificApi"]>(),
			}),
		),
})
