export type { InlangModule, ResolveModuleFunction } from "./api.js"
export { resolveModules } from "./resolveModules.js"
export { type ImportFunction, createImport } from "./import.js"
export { ModuleError, ModuleImportError, ModuleHasNoExportsError } from "./errors.js"

/**
 * Does not re-export `@inlang/plugin` and `@inlang/lint` to
 * keep both APIs under separate semver versions.
 *
 * See https://github.com/inlang/inlang/issues/1184#issuecomment-1655592062
 */
