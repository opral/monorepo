import type { InlangConfig, PluginSettings } from "@inlang/config"
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
	AppSpecificApis extends JSONSerializable<unknown> = Record<string, unknown>,
> = {
	// * Must be JSON serializable if we want an external plugin manifest in the future.
	meta: JSONSerializable<{
		id: `${string}.${string}`
		displayName: TranslatedStrings
		description: TranslatedStrings
		keywords: string[]
	}>
	/**
	 * Load messages.
	 */
	loadMessages?: (args: {
		languageTags: Readonly<InlangConfig["languageTags"]>
		options: PluginOptions
		nodeishFs: InlangEnvironment["$fs"]
	}) => Promise<Message[]> | Message[]
	saveMessages?: (args: {
		messages: Message[]
		options: PluginOptions
		nodeishFs: InlangEnvironment["$fs"]
	}) => Promise<void> | void
	/**
	 * Detect language tags in the project.
	 *
	 * Some projects use files or another config file as the source
	 * of truth for the language tags. This function allows plugins
	 * to detect language tags of those other sources.
	 *
	 * Apps use this function to prompt the user to update their
	 * language tags in the config if additional language tags are detected.
	 */
	detectedLanguageTags?: (args: {
		nodeishFs: InlangEnvironment["$fs"]
		options: PluginOptions
	}) => Promise<string[]> | string[]
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
	addAppSpecificApi?: (args: { options: PluginOptions }) => AppSpecificApis
	// afterSetup: () => {}
}

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePluginsFunction = (args: {
	module: string
	plugins: Plugin[]
	pluginSettings: Record<Plugin["meta"]["id"], PluginSettings>
	config: InlangConfig
	env: InlangEnvironment
}) => Promise<{
	data: ResolvedPlugins
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
export type ResolvedPlugins = {
	loadMessages?: Plugin["loadMessages"]
	saveMessages?: Plugin["saveMessages"]
	detectedLanguageTags?: Plugin["detectedLanguageTags"]
	/**
	 * App specific APIs.
	 *
	 * @example
	 *  // define
	 *  appSpecificApi: () => ({
	 * 	 "inlang.ide-extension": {
	 * 	   messageReferenceMatcher: () => {}
	 * 	 }
	 *  })
	 *  // use
	 *  appSpecificApi['inlang.ide-extension'].messageReferenceMatcher()
	 */
	appSpecificApi?: Plugin["addAppSpecificApi"]
	/**
	 * Metainformation for a specific plugin.
	 *
	 * @example
	 *   meta['inlang.plugin-i18next'].description['en']
	 *   meta['inlang.plugin-i18next'].module
	 */
	meta: Record<Plugin["meta"]["id"], Plugin["meta"] & { module: string }>
}

// --------------------------------------------- ZOD ---------------------------------------------

const PluginOptions = z.record(z.union([z.string(), z.array(z.string()), z.record(z.string())]))

export const Plugin = z
	.object({
		meta: z.object({
			id: z.custom<Plugin["meta"]["id"]>((value) => pluginIdRegex.test(value as string)),
			displayName: TranslatedStrings,
			description: TranslatedStrings,
			keywords: z.array(z.string()),
		}),
		loadMessages: z.optional(
			z
				.function()
				.args(
					z.object({
						languageTags: z.custom<InlangConfig["languageTags"]>(),
						options: PluginOptions,
						nodeishFs: z.custom<InlangEnvironment["$fs"]>(),
					}),
				)
				.returns(z.custom<Message[]>()),
		),
		saveMessages: z.optional(
			z
				.function()
				.args(
					z.object({
						messages: z.custom<Message[]>(),
						options: PluginOptions,
						nodeishFs: z.custom<InlangEnvironment["$fs"]>(),
					}),
				)
				.returns(z.custom<void>()),
		),
		detectedLanguageTags: z.optional(
			z
				.function()
				.args(
					z.object({
						nodeishFs: z.custom<InlangEnvironment["$fs"]>(),
						options: PluginOptions,
					}),
				)
				.returns(z.custom<Promise<string[]> | string[]>()),
		),
		addAppSpecificApi: z.optional(
			z
				.function()
				.args(
					z.object({
						options: PluginOptions,
					}),
				)
				.returns(z.custom<Record<string, unknown>>()),
		),
	})
	.strict()
