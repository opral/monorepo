import {
	type Static,
	Type,
	type TTemplateLiteral,
	type TLiteral,
	type TObject,
} from "@sinclair/typebox"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { Message } from "@inlang/message"
import type { JSONObject } from "@inlang/json-types"
import type { CustomApiInlangIdeExtension } from "./customApis/app.inlang.ideExtension.js"
import { Translatable } from "@inlang/translatable"
import type { ProjectSettings2, ExternalProjectSettings } from "./project-settings.js"
import type {
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginReturnedInvalidCustomApiError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginsDoNotProvideLoadOrSaveMessagesError,
} from "./plugin-errors.js"

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
	NodeishFilesystem,
	"readFile" | "readdir" | "mkdir" | "writeFile" | "watch"
>

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The plugin API is used to extend inlang's functionality.
 *
 * You can use your own settings by extending the plugin with a generic:
 *
 * ```ts
 * 	type PluginSettings = {
 *  	filePath: string
 * 	}
 *
 * 	const plugin: Plugin<{
 * 		"plugin.your.id": PluginSettings
 * 	}>
 * ```
 */
export type Plugin2<
	ExternalSettings extends Record<keyof ExternalProjectSettings, JSONObject> | unknown = unknown
> = Omit<
	Static<typeof Plugin2>,
	"loadMessages" | "saveMessages" | "addCustomApi" | "settingsSchema"
> & {
	settingsSchema?: TObject
	/**
	 * Load messages.
	 */
	loadMessages?: (args: {
		settings: ProjectSettings2 & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<Message[]> | Message[]
	saveMessages?: (args: {
		messages: Message[]
		settings: ProjectSettings2 & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<void> | void
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
		settings: ProjectSettings2 & ExternalSettings
	}) =>
		| Record<`app.${string}.${string}`, unknown>
		| { "app.inlang.ideExtension": CustomApiInlangIdeExtension }
}

export const Plugin2 = Type.Object({
	id: Type.String({
		pattern: "^plugin\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
		examples: ["plugin.namespace.id"],
	}) as unknown as TTemplateLiteral<[TLiteral<`plugin.${string}.${string}`>]>,
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),
	/**
	 * Tyepbox is must be used to validate the Json Schema.
	 * Github discussion to upvote a plain Json Schema validator and read the benefits of Typebox
	 * https://github.com/opral/monorepo/discussions/1503
	 */
	settingsSchema: Type.Optional(Type.Object({}, { additionalProperties: true })),
	loadMessages: Type.Optional(Type.Any()),
	saveMessages: Type.Optional(Type.Any()),
	/**
	 * @deprecated removed
	 */
	detectedLanguageTags: Type.Optional(Type.Any()),
	addCustomApi: Type.Optional(Type.Any()),
})

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePlugins2Function = (args: {
	plugins: Array<Plugin2>
	settings: ProjectSettings2
}) => Promise<{
	data: ResolvedPlugin2Api
	errors: Array<
		| PluginReturnedInvalidCustomApiError
		| PluginLoadMessagesFunctionAlreadyDefinedError
		| PluginSaveMessagesFunctionAlreadyDefinedError
		| PluginHasInvalidIdError
		| PluginHasInvalidSchemaError
		| PluginsDoNotProvideLoadOrSaveMessagesError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPlugin2Api = {
	loadMessages: (args: {
		settings: ProjectSettings2
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<Message[]> | Message[]
	saveMessages: (args: {
		settings: ProjectSettings2
		messages: Message[]
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<void> | void
	/**
	 * App specific APIs.
	 *
	 * @example
	 *  // define
	 *  customApi: ({ settings }) => ({
	 * 	 "app.inlang.ide-extension": {
	 * 	   messageReferenceMatcher: () => {
	 * 		 // use settings
	 * 		 settings.pathPattern
	 * 		return
	 * 	   }
	 * 	 }
	 *  })
	 *  // use
	 *  customApi['app.inlang.ide-extension'].messageReferenceMatcher()
	 */
	customApi: Record<`app.${string}.${string}` | `library.${string}.${string}`, unknown> & {
		"app.inlang.ideExtension"?: CustomApiInlangIdeExtension
	}
}
