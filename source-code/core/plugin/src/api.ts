import { LanguageTag, WithLanguageTags } from "@inlang/language-tag"
import { Static, Type, TTemplateLiteral, TLiteral } from "@sinclair/typebox"
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
import type { Message } from "@inlang/messages"
import type { JSONSerializableObject } from "@inlang/json-serializable"

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
	settings: Record<Plugin["meta"]["id"], JSONSerializableObject>
	nodeishFs: NodeishFilesystemSubset
}) => {
	data: RuntimePluginApi
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
export type RuntimePluginApi = {
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
}

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type Plugin<Settings extends JSONSerializableObject | unknown = unknown> = Omit<
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
			displayName: WithLanguageTags(Type.String()),
			description: WithLanguageTags(Type.String()),
			keywords: Type.Array(Type.String()),
		}),
		loadMessages: Type.Optional(Type.Any()),
		saveMessages: Type.Optional(Type.Any()),
		detectedLanguageTags: Type.Optional(Type.Any()),
		addAppSpecificApi: Type.Optional(Type.Any()),
	},
	{ additionalProperties: false },
)
