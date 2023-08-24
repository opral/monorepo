import { LanguageTag, Translatable } from "@inlang/language-tag"
import { Static, Type, TTemplateLiteral, TLiteral } from "@sinclair/typebox"
import type { NodeishFilesystem as LisaNodeishFilesystem } from "@inlang-git/fs"
import type {
	PluginReturnedInvalidAppSpecificApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"
import type { Message } from "@inlang/messages"
import type { JSONObject } from "@inlang/json-types"
import type { IdeExtensionConfig } from "./index.js"

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
	settings: Record<Plugin["meta"]["id"], JSONObject>
	nodeishFs: NodeishFilesystemSubset
}) => Promise<{
	data: ResolvedPluginApi
	errors: Array<
		| PluginReturnedInvalidAppSpecificApiError
		| PluginLoadMessagesFunctionAlreadyDefinedError
		| PluginSaveMessagesFunctionAlreadyDefinedError
		| PluginHasInvalidIdError
		| PluginHasInvalidSchemaError
		| PluginUsesReservedNamespaceError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginApi = {
	loadMessages: (args: { languageTags: LanguageTag[] }) => Promise<Message[]> | Message[]
	saveMessages: (args: { messages: Message[] }) => Promise<void> | void
	/**
	 * Detect language tags in the project provided plugins.
	 */
	detectedLanguageTags: LanguageTag[]
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
}

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type Plugin<Settings extends JSONObject | unknown = unknown> = Omit<
	Static<typeof Plugin>,
	"loadMessages" | "saveMessages" | "detectedLanguageTags" | "addAppSpecificApi"
> & {
	/**
	 * Load messages.
	 */
	loadMessages?: (args: {
		languageTags: LanguageTag[]
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
	}) => Promise<LanguageTag[]> | LanguageTag[]
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
	addAppSpecificApi?: (args: {
		settings: Settings
	}) => Record<`${string}.app.${string}`, any> | { "inlang.app.ideExtension": IdeExtensionConfig }
}

export const Plugin = Type.Object(
	{
		meta: Type.Object({
			id: Type.String({
				pattern: "^(?!system\\.)([a-z]+)\\.(plugin)\\.([a-z][a-zA-Z0-9]*)$",
				examples: ["namespace.plugin.example"],
			}) as unknown as TTemplateLiteral<[TLiteral<`${string}.plugin.${string}`>]>,
			displayName: Translatable(Type.String()),
			description: Translatable(Type.String()),
			/* This is used for the marketplace, required if you want to publish your plugin to the marketplace */
			marketplace: Type.Optional(
				Type.Object({
					icon: Type.String(),
					linkToReadme: Translatable(Type.String()),
					keywords: Type.Array(Type.String()),
					publisherName: Type.String(),
					publisherIcon: Type.String(),
				}),
			),
		}),
		loadMessages: Type.Optional(Type.Any()),
		saveMessages: Type.Optional(Type.Any()),
		detectedLanguageTags: Type.Optional(Type.Any()),
		addAppSpecificApi: Type.Optional(Type.Any()),
	},
	{ additionalProperties: false },
)
