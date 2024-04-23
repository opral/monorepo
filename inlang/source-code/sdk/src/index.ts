/**
 *! PUBLIC API FOR THE INLANG SDK.
 *!
 *! EXPORT AS LITTLE AS POSSIBLE TO MINIMIZE THE CHANCE OF BREAKING CHANGES.
 */

export type {
	InlangProject,
	InstalledMessageLintRule,
	InstalledPlugin,
	MessageQueryApi,
	Subscribable,
} from "./api.js"
export { type ImportFunction, createImport } from "./resolve-modules/index.js"
export { createNewProject } from "./createNewProject.js"
export { defaultProjectSettings } from "./defaultProjectSettings.js"
export { loadProject } from "./loadProject.js"
export { listProjects } from "./listProjects.js"
export { solidAdapter, type InlangProjectWithSolidAdapter } from "./adapter/solidAdapter.js"
export { createMessagesQuery } from "./createMessagesQuery.js"
export {
	ProjectSettingsFileJSONSyntaxError,
	ProjectSettingsFileNotFoundError,
	ProjectSettingsInvalidError,
	PluginLoadMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"

export { stringifyMessage } from "./storage/helper.js"
export * from "./messages/variant.js"
export * from "./versionedInterfaces.js"
export { InlangModule } from "@inlang/module"
