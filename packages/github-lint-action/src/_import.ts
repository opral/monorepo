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
	const moduleAsText = uri.startsWith("http")
		? await(await fetch(uri)).text()
		: await fs.readFile(uri, { encoding: "utf-8" })

	const moduleWithMimeType = "data:application/javascript," + encodeURIComponent(moduleAsText)

	console.log("dataloss?", moduleAsText.length, moduleWithMimeType.length)

	// const parts = uri.split("/")
	// const savePath =
	// 	basePath + "/" + parts.at(parts.length - 4) + "-" + parts.at(parts.length - 3) + ".js"
	// await fs.writeFile(savePath, moduleAsText).catch((e) => {
	// 	console.error("Error while saving file", e)
	// })
	return await import(/* @vite-ignore */ moduleWithMimeType)
}
