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
			return createImport(normalizePath(basePath + "/" + uri.slice(2)))
		}
		return createImport(uri)
	}
}

const createImport: ImportFunction = async (uri: string) => {
	const moduleAsText = uri.startsWith("http")
		? await(await fetch(uri)).text()
		: await fs.readFile(uri, { encoding: "utf-8" })

	const savePath = "./" + uri.replace("https://cdn.jsdelivr.net/npm/", "")
	await fs.writeFile(savePath, moduleAsText)
	console.log("Saving to", savePath)
	// log dir content
	const root = await fs.readdir("./")
	console.log("Files in root dir:", root)
	return savePath
}
