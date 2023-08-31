export type {
	InlangProject,
	InstalledLintRule,
	InstalledPlugin,
	MessageQueryApi,
	Subscribable,
} from "./api.js"
export { openInlangProject } from "./openInlangProject.js"
export { solidAdapter, InlangProjectWithSolidAdapter } from "./adapter/solidAdapter.js"
export { createMessagesQuery } from "./createMessagesQuery.js"
export {
	ProjectFilePathNotFoundError,
	ProjectFileJSONSyntaxError,
	InvalidConfigError,
	NoPluginProvidesLoadOrSaveMessagesError,
	PluginLoadMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"
export * from "./messages/variant.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184.
 */

export * from "./interfaces.js"
export * from "@inlang/result"
