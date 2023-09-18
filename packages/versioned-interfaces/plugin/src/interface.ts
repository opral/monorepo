import type { LanguageTag } from "@inlang/language-tag"
import { type Static, Type, type TTemplateLiteral, type TLiteral } from "@sinclair/typebox"
import type { NodeishFilesystem as LisaNodeishFilesystem } from "@lix-js/fs"
import type { Message } from "@inlang/message"
import type { JSONObject } from "@inlang/json-types"
import type { CustomApiInlangIdeExtension } from "./customApis/app.inlang.ideExtension.js"
import { Translatable } from "@inlang/translatable"

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
	LisaNodeishFilesystem,
	"readFile" | "readdir" | "mkdir" | "writeFile"
>

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The plugin API is used to extend inlang's functionality.
 */
export type Plugin<Settings extends JSONObject | unknown = unknown> = Omit<
	Static<typeof Plugin>,
	"loadMessages" | "saveMessages" | "detectedLanguageTags" | "addCustomApi"
> & {
	/**
	 * Load messages.
	 */
	loadMessages?: (args: {
		languageTags: LanguageTag[]
		sourceLanguageTag: LanguageTag
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
	 * addCustomApi: () => ({
	 * 	 "app.inlang.ide-extension": {
	 * 	   messageReferenceMatcher: () => {}
	 * 	 }
	 *  })
	 */
	addCustomApi?: (args: {
		settings: Settings
	}) =>
		| Record<`app.${string}.${string}`, unknown>
		| { "app.inlang.ideExtension": CustomApiInlangIdeExtension }
}

export const Plugin = Type.Object(
	{
		id: Type.String({
			pattern: "^plugin\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
			examples: ["plugin.namespace.id"],
		}) as unknown as TTemplateLiteral<[TLiteral<`plugin.${string}.${string}`>]>,
		displayName: Translatable(Type.String()),
		description: Translatable(Type.String()),
		loadMessages: Type.Optional(Type.Any()),
		saveMessages: Type.Optional(Type.Any()),
		detectedLanguageTags: Type.Optional(Type.Any()),
		addCustomApi: Type.Optional(Type.Any()),
	},
	{ additionalProperties: false },
)
