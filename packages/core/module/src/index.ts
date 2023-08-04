export type { InlangModule } from "./api.js"
export { moduleBuildConfig } from "./moduleBuildConfig.js"
export { resolveModules } from "./resolveModules.js"

/**
 * -------- RE-EXPORTS --------
 *
 * See https://github.com/inlang/inlang/issues/1184
 */

export * from "@inlang/plugin"
export * from "@inlang/lint"
