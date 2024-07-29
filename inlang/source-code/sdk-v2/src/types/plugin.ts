import {
	type Static,
	Type,
	type TTemplateLiteral,
	type TLiteral,
	type TObject,
} from "@sinclair/typebox"
import type { JSONObject } from "@inlang/json-types"
import type { CustomApiInlangIdeExtension } from "./customApis/app.inlang.ideExtension.js"
import { Translatable } from "@inlang/translatable"
import {
	type ProjectSettings2 as ProjectSettings2Type,
	type ExternalProjectSettings as ExternalProjectSettingsType,
	ExternalProjectSettings,
} from "./project-settings.js"
import type {
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginReturnedInvalidCustomApiError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginsDoNotProvideLoadOrSaveMessagesError,
} from "./plugin-errors.js"
import { NestedBundle } from "./schema.js"
import { TranslationFile, type TranslationFile as TranslationFileType } from "./translation-file.js"

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
	ExternalSettings extends Record<keyof ExternalProjectSettingsType, JSONObject> | unknown = unknown
> = Omit<
	Static<typeof Plugin2>,
	"toBeImportedFiles" | "importFiles" | "exportFiles" | "addCustomApi" | "settingsSchema"
> & {
	settingsSchema?: TObject
	/**
	 * Import / Export files.
	 */
	toBeImportedFiles?: (args: {
		settings: ProjectSettings2Type & ExternalSettings
		nodeFs: unknown
	}) => Promise<Array<TranslationFileType>> | Array<TranslationFileType>
	importFiles?: (args: { files: Array<TranslationFileType> }) => { bundles: NestedBundle }
	exportFiles?: (args: {
		bundles: NestedBundle
		settings: ProjectSettings2Type & ExternalSettings
	}) => Array<TranslationFileType>
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
		settings: ProjectSettings2Type & ExternalSettings
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
	toBeImportedFiles: Type.Optional(
		Type.Function(
			[Type.Object({ settings: ExternalProjectSettings, nodeFs: Type.Any() })],
			Type.Array(TranslationFile)
		)
	),
	importFiles: Type.Optional(
		Type.Function(
			[Type.Object({ files: Type.Array(TranslationFile) })],
			Type.Object({ bundles: NestedBundle })
		)
	),
	exportFiles: Type.Optional(
		Type.Function(
			[Type.Object({ bundles: NestedBundle, settings: ExternalProjectSettings })],
			Type.Array(TranslationFile)
		)
	),
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
	settings: ProjectSettings2Type
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
	toBeImportedFiles: Array<Plugin2["toBeImportedFiles"]>
	importFiles: Array<Plugin2["importFiles"]>
	exportFiles: Array<Plugin2["exportFiles"]>
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
