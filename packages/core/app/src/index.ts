export type { InlangProject, InstalledLintRule, InstalledPlugin, MessageQueryApi } from "./api.js"
export { openInlangProject } from "./openInlangProject.js"
export { withSolidReactivity, SolidInlangProject } from "./wrappers/withSolidReactivity.js"
export { tryAutoGenerateInlangConfig } from "./tryAutoGenerateConfig.js"
export { parseConfig } from "./parseConfig.js"
export {
	ConfigPathNotFoundError,
	ConfigSyntaxError,
	InvalidConfigError,
	NoMessagesPluginError,
	PluginLoadMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"
export { createReactiveQuery } from "./createReactiveQuery.js"

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
export * from "@inlang/json-serializable"
export * from "@inlang/module"