export type {
	Plugin,
	RuntimePluginApi,
	ResolvePluginsFunction,
	NodeishFilesystemSubset,
} from "./api.js"
export { resolvePlugins } from "./resolvePlugins.js"
export {
	PluginReturnedInvalidAppSpecificApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
} from "./errors.js"

/**
 * -------- APP-SPECIFIC APIS --------
 */
export type { IdeExtensionConfig } from "./appSpecificApis/inlang.app.ideExtension.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184
 */

export * from "@inlang/language-tag"
export * from "@inlang/messages"
export * from "@inlang/result"
export * from "@inlang/json-types"
