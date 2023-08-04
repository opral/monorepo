export type {
	Plugin,
	ResolvedPlugins,
	ResolvePluginsFunction,
	NodeishFilesystemSubset,
} from "./api.js"
export { resolvePlugins } from "./resolvePlugins.js"
export { pluginBuildConfig } from "./pluginBuildConfig.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184
 */

export * from "@inlang/config"
export * from "@inlang/language-tag"
export * from "@inlang/messages"
export * from "@inlang/result"
