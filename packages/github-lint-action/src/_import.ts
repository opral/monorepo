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
			return createImport(normalizePath(basePath + "/" + uri.slice(2)), basePath)
		}
		return createImport(uri, basePath)
	}
}

const createImport = async (uri: string, basePath: string) => {
	console.log("createImport")
	if (!uri.startsWith("http")) {
		// support for local modules
		return import(normalizePath(basePath + "/" + uri))
	}

	const moduleAsText = await(await fetch(uri)).text()

	// 1. absolute path "/"
	// 2. hash the uri to remove directory blabla stuff and add .mjs to make node load the module as ESM
	const interimPath = path.resolve(
		process.cwd() + "/" + crypto.createHash("sha256").update(uri).digest("hex") + ".mjs"
	)

	await fs.writeFile(interimPath, moduleAsText, { encoding: "utf-8" })

	const stat = await fs.stat(interimPath)

	console.log("stat", stat)

	return import(interimPath)
}
