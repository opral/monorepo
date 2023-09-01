/**
 *! PUBLIC API FOR THE INLANG SDK.
 *!
 *! EXPORT AS LITTLE AS POSSIBLE TO MINIMIZE THE CHANCE OF BREAKING CHANGES.
 */

export type {
	InlangProject,
	InstalledLintRule,
	InstalledPlugin,
	MessageQueryApi,
	Subscribable,
} from "./api.js"
export type { InlangModule, ImportFunction } from "./resolve-modules/index.js"
export { openInlangProject } from "./openInlangProject.js"
export { solidAdapter, type InlangProjectWithSolidAdapter } from "./adapter/solidAdapter.js"
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
export * from "./interfaces.js"
