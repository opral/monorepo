export type { Plugin, ResolvedPluginsApi, ResolvePluginsFunction } from "./api.js"
export { resolvePlugins } from "./resolvePlugins.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184
 */

export * from "@inlang/config"
export * from "@inlang/environment"
export * from "@inlang/language-tag"
export * from "@inlang/messages"
export * from "@inlang/result"
