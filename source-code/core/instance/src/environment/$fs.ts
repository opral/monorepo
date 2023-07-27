import type { NodeishFilesystem } from "@inlang-git/fs"

/**
 * Minimal filesystem provided by inlang.
 *
 * $fs is a subset of `@inlang-git/fs`. The subset ensures
 * that the filesystem API is supported across all environments
 * (node, browser, etc).
 *
 * If you are missing a method, please open an issue on github.
 */
export type $fs = Pick<NodeishFilesystem, "readdir" | "mkdir" | "writeFile" | "readFile">
