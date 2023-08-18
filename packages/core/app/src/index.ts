export type { InlangInstance, InstalledLintRule, InstalledPlugin } from "./api.js"
export { createInlang } from "./createInlang.js"
export { withSolidReactivity } from "./wrappers/withSolidReactivity.js"
export { tryAutoGenerateInlangConfig } from "./tryAutoGenerateConfig.js"
export { parseConfig } from "./parseConfig.js"
export { ConfigPathNotFoundError, ConfigSyntaxError, InvalidConfigError } from "./errors.js"

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
