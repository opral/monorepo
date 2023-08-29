export type {
	InlangProject,
	InstalledLintRule,
	InstalledPlugin,
	MessageQueryApi,
	Subscribable,
} from "./api.js"
export { openInlangProject } from "./openInlangProject.js"
export { solidAdapter, InlangProjectWithSolidAdapter } from "./adapter/solidAdapter.js"
export { tryAutoGenerateInlangConfig } from "./tryAutoGenerateConfig.js"
export { createMessagesQuery } from "./createMessagesQuery.js"
export {
	ConfigPathNotFoundError,
	ConfigJSONSyntaxError,
	InvalidConfigError,
	NoPluginProvidesLoadOrSaveMessagesError,
	PluginLoadMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184.
 */

export * from "@inlang/config"
export * from "@inlang/language-tag"
export * from "@inlang/lint"
export * from "@inlang/messages"
export * from "@inlang/result"
export * from "@inlang/plugin"
export * from "@inlang/json-types"
export * from "@inlang/package"
