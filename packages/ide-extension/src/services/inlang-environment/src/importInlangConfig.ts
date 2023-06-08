import type { InlangConfigModule } from "@inlang/core/config"
import { create$import } from "./create$import.js"

const $import = create$import("")

/**
 * Imports the inlang config from the given path.
 *
 * Under the hood, this function transpiles the config to CommonJS and then imports it.
 */
export async function importInlangConfig(path: string): Promise<InlangConfigModule> {
	return await $import(path)
}
