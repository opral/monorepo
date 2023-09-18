import type { LanguageTag } from "@inlang/language-tag"
import type { NodeishFilesystem as LisaNodeishFilesystem } from "@lix-js/fs"
import type {
	PluginReturnedInvalidCustomApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
	PluginsDoNotProvideLoadOrSaveMessagesError,
} from "./errors.js"
import type { Message } from "@inlang/message"
import type { JSONObject } from "@inlang/json-types"
import type { CustomApiInlangIdeExtension, Plugin } from "@inlang/plugin"

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
	settings: Record<Plugin["id"], JSONObject>
	nodeishFs: NodeishFilesystemSubset
}) => Promise<{
	data: ResolvedPluginApi
	errors: Array<
		| PluginReturnedInvalidCustomApiError
		| PluginLoadMessagesFunctionAlreadyDefinedError
		| PluginSaveMessagesFunctionAlreadyDefinedError
		| PluginHasInvalidIdError
		| PluginHasInvalidSchemaError
		| PluginUsesReservedNamespaceError
		| PluginsDoNotProvideLoadOrSaveMessagesError
	>
}>

/**
 * The API after resolving the plugins.
 */
export type ResolvedPluginApi = {
	loadMessages: (args: {
		languageTags: LanguageTag[]
		sourceLanguageTag: LanguageTag
	}) => Promise<Message[]> | Message[]
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
