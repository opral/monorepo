import type { $fs } from "./$fs.js"
import type { $import } from "./$import.js"

/**
 * The inlang environment.
 *
 * Read more https://inlang.com/documentation/inlang-environment
 */
export type InlangEnvironment = {
	$fs: $fs
	$import: $import
}
