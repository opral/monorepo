import type { $fs } from "./$fs.js"
import type { $import } from "./$import.js"

/**
 * The inlang instance environment.
 *
 * Read more https://inlang.com/documentation/inlang-environment
 */
export type InlangInstanceEnvironment = {
	$fs: $fs
	$import: $import
}
