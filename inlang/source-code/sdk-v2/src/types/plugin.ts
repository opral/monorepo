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
	PluginReturnedInvalidCustomApiError,
	PluginImportFilesFunctionAlreadyDefinedError,
	PluginExportFilesFunctionAlreadyDefinedError,
	PluginsDoNotProvideImportOrExportFilesError,
	PluginToBeImportedFilesFunctionAlreadyDefinedError,
} from "./plugin-errors.js"
import { NestedBundle } from "./schema.js"
import { TranslationFile, type TranslationFile as TranslationFileType } from "./translation-file.js"
import type { ProjectSettings2 } from "./project-settings.js"
import type { ImportFunction } from "../resolve-plugins/import.js"
import type { PluginHasNoExportsError, PluginImportError } from "./plugin-errors.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export const PluginId = Type.String({
	pattern: "^plugin\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
	examples: ["plugin.namespace.id"],
}) as unknown as TTemplateLiteral<[TLiteral<`plugin.${string}.${string}`>]>
export type PluginId = Static<typeof PluginId>

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The plugin API is used to extend inlang's functionality.
 *
 * You can use your own settings by extending the plugin with a generic:
 *
 * ```ts
 *  type PluginSettings = {
 *    filePath: string
 *  }
 *
 *  const plugin: Plugin<{
 *    "plugin.your.id": PluginSettings
 *  }>
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
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
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
	 *   "app.inlang.ide-extension": {
	 *     messageReferenceMatcher: () => {}
	 *   }
	 *  })
	 */
	addCustomApi?: (args: {
		settings: ProjectSettings2Type & ExternalSettings
	}) =>
		| Record<`app.${string}.${string}`, unknown>
		| { "app.inlang.ideExtension": CustomApiInlangIdeExtension }
}

export const Plugin2 = Type.Object({
	id: PluginId,
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),
	/**
	 * Typebox must be used to validate the Json Schema.
	 * Github discussion to upvote a plain Json Schema validator and read the benefits of Typebox
	 * https://github.com/opral/monorepo/discussions/1503
	 */
	settingsSchema: Type.Optional(Type.Object({}, { additionalProperties: true })),
	/**
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
	 */
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
		| PluginToBeImportedFilesFunctionAlreadyDefinedError
		| PluginImportFilesFunctionAlreadyDefinedError
		| PluginExportFilesFunctionAlreadyDefinedError
		| PluginHasInvalidIdError
		| PluginHasInvalidSchemaError
		| PluginsDoNotProvideImportOrExportFilesError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPlugin2Api = {
	/**
	 *  * Importer / Exporter functions.
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
	 */
	toBeImportedFiles: Record<PluginId, Plugin2["toBeImportedFiles"] | undefined>
	importFiles: Record<PluginId, Plugin2["importFiles"] | undefined>
	exportFiles: Record<PluginId, Plugin2["exportFiles"] | undefined>
	/**
	 * App specific APIs.
	 *
	 * @example
	 *  // define
	 *  customApi: ({ settings }) => ({
	 *    "app.inlang.ide-extension": {
	 *      messageReferenceMatcher: () => {
	 *        // use settings
	 *        settings.pathPattern
	 *       return
	 *      }
	 *    }
	 *  })
	 *  // use
	 *  customApi['app.inlang.ide-extension'].messageReferenceMatcher()
	 */
	customApi: Record<`app.${string}.${string}` | `library.${string}.${string}`, unknown> & {
		"app.inlang.ideExtension"?: CustomApiInlangIdeExtension
	}
}

// ---------------------------- RESOLVE PLUGIN API TYPES ---------------------------------------------
/**
 * An inlang plugin module has a default export that is a plugin.
 *
 * @example
 *   export default myPlugin
 */
// not using Static<infer T> here because the type is not inferred correctly
// due to type overwrites in modules.
export type InlangPlugin = { default: Plugin2 }
export const InlangPlugin = Type.Object({
	default: Plugin2,
})

/**
 * Function that resolves modules from the config.
 *
 * Pass a custom `_import` function to override the default import function.
 */
export type ResolvePlugin2Function = (args: {
	settings: ProjectSettings2
	_import: ImportFunction
}) => Promise<{
	/**
	 * Metadata about the resolved module.
	 *
	 * @example
	 * [{
	 * 	  id: "plugin.inlang.json",
	 * 	  module: "https://myplugin.com/index.js"
	 * }]
	 */
	meta: Array<{
		/**
		 * The plugin link.
		 *
		 * @example "https://myplugin.com/index.js"
		 */
		plugin: string
		/**
		 * The resolved item id of the module.
		 */
		id: Plugin2["id"]
	}>
	/**
	 * The resolved plugins.
	 */
	plugins: Array<Plugin2>
	/**
	 * The resolved api provided by plugins.
	 */
	resolvedPluginApi: ResolvedPlugin2Api
	/**
	 * Errors during the resolution process.
	 *
	 * This includes errors from:
	 * - importing module
	 * - resolving plugins
	 * - resolving the runtime plugin api
	 */
	errors: Array<
		| PluginHasNoExportsError
		| PluginImportError
		| Awaited<ReturnType<ResolvePlugins2Function>>["errors"][number]
	>
}>

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
	NodeishFilesystem,
	"readFile" | "readdir" | "mkdir" | "writeFile" | "watch"
>

/**
 * Function that resolves (imports and initializes) the plugins.
 */
export type ResolvePluginsFunction = (args: {
	plugins: Array<Plugin2>
	settings: ProjectSettings2
	nodeishFs: NodeishFilesystemSubset
}) => Promise<{
	data: ResolvedPluginApi
	errors: Array<
		| PluginReturnedInvalidCustomApiError
		| PluginToBeImportedFilesFunctionAlreadyDefinedError
		| PluginImportFilesFunctionAlreadyDefinedError
		| PluginExportFilesFunctionAlreadyDefinedError
		| PluginHasInvalidIdError
		| PluginHasInvalidSchemaError
		| PluginsDoNotProvideImportOrExportFilesError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginApi = {
	/**
	 * Importer / Exporter functions.
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
	 */
	toBeImportedFiles: Record<PluginId, Plugin2["toBeImportedFiles"] | undefined>
	importFiles: Record<PluginId, Plugin2["importFiles"] | undefined>
	exportFiles: Record<PluginId, Plugin2["exportFiles"] | undefined>
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
