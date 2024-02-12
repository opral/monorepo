import { normalizePath } from "@lix-js/fs"
import type { ImportFunction } from "@inlang/sdk"
import fs from "node:fs/promises"

/**
 * Wraps the import function to inject the base path.
 *
 * The wrapping is necessary to resolve relative imports.
 */
export function _import(basePath: string): ImportFunction {
	return (uri: string) => {
		if (uri.startsWith("./")) {
			return createImport(normalizePath(basePath + "/" + uri.slice(2)), basePath)
		}
		return createImport(uri, basePath)
	}
}

const createImport = async (uri: string, basePath: string) => {
	if (!uri.startsWith("http")) {
		// support for local modules
		return import(normalizePath(basePath + "/" + uri))
	}

	const moduleAsText = await (await fetch(uri)).text()

	// 1. absolute path "/"
	// 2. remove https:// (8 characters)
	const interimPath = "/" + uri.slice(8)

	await fs.writeFile(interimPath, moduleAsText, { encoding: "utf-8" })

	return import(interimPath)
}
