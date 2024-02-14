import { normalizePath } from "@lix-js/fs"
import type { ImportFunction } from "@inlang/sdk"
import fs from "node:fs/promises"
import crypto from "node:crypto"
import path from "node:path"

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

const createImport = async (uri: string) => {
	if (!uri.startsWith("http")) {
		// support for local modules
		return import(normalizePath(process.cwd() + "/" + uri))
	}

	const moduleAsText = await (await fetch(uri)).text()
	// const moduleWithMimeType = "data:application/javascript," + encodeURIComponent(moduleAsText)

	// 1. absolute path "/"
	// 2. hash the uri to remove directory blabla stuff and add .mjs to make node load the module as ESM
	const interimPath = path.resolve(
		process.cwd() + "/" + crypto.createHash("sha256").update(uri).digest("hex") + ".js"
	)

	await fs.writeFile(interimPath, moduleAsText, { encoding: "utf-8" })

	// check if module exists
	fs.access("./" + crypto.createHash("sha256").update(uri).digest("hex") + ".js", fs.constants.F_OK)
		.then(() => {
			console.log("module exists")
		})
		.catch(() => {
			console.log("module does not exist")
		})

	return await import("./" + crypto.createHash("sha256").update(uri).digest("hex") + ".js")
		.then((module) => {
			console.log("imported module", module, module.default)
			return module
		})
		.catch((error) => {
			console.error("error", error)
		})
}
