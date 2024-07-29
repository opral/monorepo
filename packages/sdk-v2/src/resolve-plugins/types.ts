import type { NodeishFilesystem } from "@lix-js/fs"
import type {
	PluginError,
	PluginImportError,
	PluginHasNoExportsError,
	PluginExportIsInvalidError,
	PluginSettingsAreInvalidError,
	PluginReturnedInvalidCustomApiError,
	PluginImportFilesFunctionAlreadyDefinedError,
	PluginExportFilesFunctionAlreadyDefinedError,
	PluginToBeImportedFilesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginsDoNotProvideImportOrExportFilesError,
} from "../types/plugin-errors.js"

import type { CustomApiInlangIdeExtension, Plugin } from "@inlang/plugin"
import type { ProjectSettings2 } from "../types/project-settings.js"

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
	plugins: Array<Plugin>
	settings: ProjectSettings2
	nodeishFs: NodeishFilesystemSubset
}) => Promise<{
	data: ResolvedPluginApi
	errors: Array<
		| PluginError
		| PluginImportError
		| PluginHasNoExportsError
		| PluginExportIsInvalidError
		| PluginSettingsAreInvalidError
		| PluginReturnedInvalidCustomApiError
		| PluginImportFilesFunctionAlreadyDefinedError
		| PluginExportFilesFunctionAlreadyDefinedError
		| PluginToBeImportedFilesFunctionAlreadyDefinedError
		| PluginHasInvalidIdError
		| PluginHasInvalidSchemaError
		| PluginsDoNotProvideImportOrExportFilesError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginApi = {
	// TODO SDK-v2 IMPORT/EXPORT needed implement importer exporter?
	// loadMessages: (args: {
	// 	settings: ProjectSettings2
	// 	nodeishFs: NodeishFilesystemSubset
	// }) => Promise<Message[]> | Message[]
	// saveMessages: (args: {
	// 	settings: ProjectSettings
	// 	messages: Message[]
	// 	nodeishFs: NodeishFilesystemSubset
	// }) => Promise<void> | void
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
