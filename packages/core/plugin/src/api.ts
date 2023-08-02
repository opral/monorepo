import type { InlangConfig } from "@inlang/config"
import { TranslatedStrings } from "@inlang/language-tag"
import type { Message } from "@inlang/messages"
import type { InlangEnvironment } from "@inlang/environment"
import { z } from "zod"
import type {
	PluginApiAlreadyDefinedError,
	PluginError,
	PluginUsesReservedNamespaceError,
	PluginUsesInvalidApiError,
} from "./errors.js"

type JSONSerializable<
	T extends Record<string, string | string[] | Record<string, string | string[]>> | unknown,
> = T

/**
 * Regex for valid plugin ids.
 */
export const pluginIdRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type Plugin<
	PluginOptions extends JSONSerializable<unknown> = Record<string, string> | unknown,
	AppSpecificApis extends object = {},
> = {
	// * Must be JSON serializable if we want an external plugin manifest in the future.
	meta: JSONSerializable<{
		id: `${string}.${string}`
		displayName: TranslatedStrings
		description: TranslatedStrings
		keywords: string[]
	}>
	/**
	 * The setup function is the first function that is called when inlang loads the plugin.
	 *
	 * Use the setup function to initialize state, handle the options and more.
	 */
	setup: (args: { options: PluginOptions; fs: InlangEnvironment["$fs"] }) => {}
	/**
	 * Load messages.
	 *
	 * - if messages with language tags that are not defined in the config.languageTags
	 *   are returned, the user config will be automatically updated to include the
	 *   new language tags.
	 */
	loadMessages?: (args: {
		languageTags: InlangConfig["languageTags"]
	}) => Promise<Message[]> | Message[]
	saveMessages?: (args: { messages: Message[] }) => Promise<void> | void
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

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePluginsFunction = <AppSpecificApis extends object = {}>(args: {
	plugins: Plugin[]
	pluginsInConfig: Exclude<InlangConfig["settings"], undefined>["plugins"]
	config: InlangConfig
	env: InlangEnvironment
}) => Promise<{
	data: ResolvedPluginsApi<AppSpecificApis>
	errors: Array<
		| PluginError
		| PluginApiAlreadyDefinedError
		| PluginUsesInvalidApiError
		| PluginUsesReservedNamespaceError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginsApi<AppSpecificApis extends object = {}> = {
	loadMessages: (args: { languageTags: InlangConfig["languageTags"] }) => Promise<Message[]>
	saveMessages: (args: { messages: Message[] }) => Promise<void>
	plugins: Record<string, Plugin>
	/**
	 * App specific APIs.
	 *
	 * @example
	 *  appSpecificApi["inlang.ide-extension"].messageReferenceMatcher()
	 */
	appSpecificApi: AppSpecificApis
}

// --------------------------------------------- ZOD ---------------------------------------------

export const Plugin = z.object({
	meta: z.object({
		id: z.custom<Plugin["meta"]["id"]>((value) => pluginIdRegex.test(value as string)),
		displayName: TranslatedStrings,
		description: TranslatedStrings,
		keywords: z.array(z.string()),
	}),
	setup: z
		.function()
		.args(
			z.object({
				options: z.record(z.union([z.string(), z.array(z.string()), z.record(z.string())])),
				fs: z.custom<InlangEnvironment["$fs"]>(),
			}),
		)
		.returns(z.custom<{}>()),
	loadMessages: z.optional(
		z
			.function()
			.args(z.object({ languageTags: z.custom<InlangConfig["languageTags"]>() }))
			.returns(z.custom<Message[]>()),
	),
	saveMessages: z.optional(
		z
			.function()
			.args(z.object({ messages: z.custom<Message[]>() }))
			.returns(z.custom<void>()),
	),
	addAppSpecificApi: z.optional(z.function().args().returns(z.custom<Record<string, unknown>>())),
})
