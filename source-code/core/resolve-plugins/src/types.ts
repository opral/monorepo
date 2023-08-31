import type { LanguageTag } from "@inlang/language-tag"
import type { NodeishFilesystem as LisaNodeishFilesystem } from "@lix-js/fs"
import type {
	PluginReturnedInvalidAppSpecificApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"
import type { Message } from "@inlang/message"
import type { JSONObject } from "@inlang/json-types"
import type { AppSpecificInlangIdeExtension, Plugin } from "@inlang/plugin"

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
	 *  appSpecificApi['inlang.app.ide-extension'].messageReferenceMatcher()
	 */
	appSpecificApi: Record<`${string}.app.${string}`, unknown> & {
		"inlang.app.ideExtension"?: AppSpecificInlangIdeExtension
	}
}
