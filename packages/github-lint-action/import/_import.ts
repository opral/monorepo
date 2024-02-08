import { normalizePath } from "@lix-js/fs"
import ts from "typescript"
import type { ImportFunction } from "@inlang/sdk"
import requireFromString from "require-from-string"
import fs from "node:fs/promises"

/**
 * Wraps the import function to inject the base path.
 *
 * The wrapping is necessary to resolve relative imports.
 */
export function _import(basePath: string): ImportFunction {
	return (uri: string) => {
		if (uri.startsWith("./")) {
			return createImport(normalizePath(basePath + "/" + uri.slice(2)))
		}
		return createImport(uri)
	}
}

const createImport: ImportFunction = async (uri: string) => {
	// polyfill for environments that don't support dynamic
	// http imports yet like VSCode.

	const moduleAsText = uri.startsWith("http")
		? await(await fetch(uri)).text()
		: await fs.readFile(uri, { encoding: "utf-8" })

	try {
		const module = requireFromString(moduleAsText)
		// for whatever reason, the default export is a function
		// that we need to call to get the property
		// if (module.default) {
		// 	module.default = module.default()
		// }
		return module
	} catch (error) {
		throw new Error(
			`Error while importing ${uri}: ${(error as Error)?.message ?? "Unknown error"}`,
			{ cause: error }
		)
	}
}
