import type { InlangConfigModule } from "@inlang/core/config"
import { _import as __import } from "./_import.js"

const _import = __import("")

/**
 * Imports the inlang config from the given path.
 *
 * Under the hood, this function transpiles the config to CommonJS and then imports it.
 */
export async function importInlangConfig(path: string): Promise<InlangConfigModule> {
	return await _import(path)
}
