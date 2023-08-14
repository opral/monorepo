import type { InlangConfig } from "@inlang/config"
import { LanguageTag, TranslatedStrings } from "@inlang/language-tag"
import { Message } from "@inlang/messages"
import { Static, TSchema, Type, TTemplateLiteral, TLiteral } from "@sinclair/typebox"
import type { NodeishFilesystem as LisaNodeishFilesystem } from "@inlang-git/fs"
import type {
	PluginAppSpecificApiReturnError,
	PluginFunctionDetectLanguageTagsAlreadyDefinedError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesInvalidSchemaError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
	LisaNodeishFilesystem,
	"readFile" | "readdir" | "mkdir" | "writeFile"
>

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePluginsFunction = (args: {
	plugins: Array<Plugin>
	settings: InlangConfig["settings"]
	nodeishFs: NodeishFilesystemSubset
}) => {
	data: ResolvedPlugins
	errors: Array<
		| PluginAppSpecificApiReturnError
		| PluginFunctionDetectLanguageTagsAlreadyDefinedError
		| PluginFunctionLoadMessagesAlreadyDefinedError
		| PluginFunctionSaveMessagesAlreadyDefinedError
		| PluginUsesInvalidIdError
		| PluginUsesInvalidSchemaError
		| PluginUsesReservedNamespaceError
	>
}

/**
 * The API after resolving the plugins.
 */
export type ResolvedPlugins = {
	loadMessages: (args: { languageTags: LanguageTag[] }) => Promise<Message[]> | Message[]
	saveMessages: (args: { messages: Message[] }) => Promise<void> | void
	detectedLanguageTags?: () => Promise<string[]> | string[]
	/**
	 * App specific APIs.
	 *
	 * @example
	 *  // define
	 *  appSpecificApi: ({ settings }) => ({
	 * 	 "inlang.app.ide-extension": {
	 * 	   messageReferenceMatcher: () => {
	 * 		 // use settings
	 * 		 settings.pathPattern
	 * 		return
	 * 	   }
	 * 	 }
	 *  })
	 *  // use
	 *  appSpecificApi['inlang.ideExtension'].messageReferenceMatcher()
	 */
	appSpecificApi: ReturnType<NonNullable<Plugin["addAppSpecificApi"]>>
	/**
	 * Metainformation for a specific plugin.
	 *
	 * @example
	 *   meta['inlang.plugin.i18next'].description['en']
	 *   meta['inlang.plugin.i18next'].module
	 */
	meta: Record<Plugin["meta"]["id"], Plugin["meta"]>
}

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

const PromiseLike = (T: TSchema) => Type.Union([T, Type.Promise(T)])

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type Plugin<Settings extends InlangConfig["settings"] | unknown = unknown> = Omit<
	Static<typeof Plugin>,
	"loadMessages" | "saveMessages" | "detectedLanguageTags" | "addAppSpecificApi"
> & {
	/**
	 * Load messages.
	 */
	loadMessages?: (args: {
		languageTags: Readonly<InlangConfig["languageTags"]>
		settings: Settings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<Message[]> | Message[]
	saveMessages?: (args: {
		messages: Message[]
		settings: Settings
		nodeishFs: NodeishFilesystemSubset
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
		nodeishFs: NodeishFilesystemSubset
		settings: Settings
	}) => Promise<string[]> | string[]
	/**
	 * Define app specific APIs.
	 *
	 * @example
	 * addAppSpecificApi: () => ({
	 * 	 "inlang.app.ide-extension": {
	 * 	   messageReferenceMatcher: () => {}
	 * 	 }
	 *  })
	 */
	addAppSpecificApi?: (args: { settings: Settings }) => Record<`${string}.app.${string}`, any>
}

export const Plugin = Type.Object(
	{
		meta: Type.Object({
			id: Type.String({
				pattern: "^(?!system\\.)([a-z]+)\\.(plugin)\\.([a-z][a-zA-Z0-9]*)$",
				examples: ["namespace.plugin.example"],
			}) as unknown as TTemplateLiteral<[TLiteral<`${string}.plugin.${string}`>]>,
			displayName: TranslatedStrings,
			description: TranslatedStrings,
			keywords: Type.Array(Type.String()),
		}),
		loadMessages: Type.Optional(
			Type.Function(
				[
					Type.Object({
						languageTags: LanguageTag,
						settings: Type.Union([Type.Object({}), Type.Undefined()]),
						nodeishFs: Type.Object({}),
					}),
				],
				PromiseLike(Type.Array(Message)),
			),
		),
		saveMessages: Type.Optional(
			Type.Function(
				[
					Type.Object({
						messages: Type.Array(Message),
						settings: Type.Union([Type.Object({}), Type.Undefined()]),
						nodeishFs: Type.Object({}),
					}),
				],
				PromiseLike(Type.Void()),
			),
		),
		detectedLanguageTags: Type.Optional(
			Type.Function(
				[
					Type.Object({
						settings: Type.Union([Type.Object({}), Type.Undefined()]),
						nodeishFs: Type.Object({}),
					}),
				],
				PromiseLike(Type.Array(Type.String())),
			),
		),
		addAppSpecificApi: Type.Optional(
			Type.Function(
				[
					Type.Object({
						settings: Type.Union([Type.Object({}), Type.Undefined()]),
					}),
				],
				PromiseLike(Type.Record(Type.String(), Type.Any())),
			),
		),
	},
	{ additionalProperties: false },
)
