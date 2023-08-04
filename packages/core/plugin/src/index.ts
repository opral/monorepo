export type { Plugin, ResolvedPlugins, ResolvePluginsFunction, NodeishFilesystem } from "./api.js"
export { resolvePlugins } from "./resolvePlugins.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184
 */

export * from "@inlang/config"
export * from "@inlang/language-tag"
export * from "@inlang/messages"
export * from "@inlang/result"

// for testing purposes a memory fs is helpful
export { createMemoryFs } from "@inlang-git/fs"
