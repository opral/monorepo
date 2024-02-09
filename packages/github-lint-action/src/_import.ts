import { normalizePath } from "@lix-js/fs"
import type { ImportFunction } from "@inlang/sdk"
import fs from "node:fs/promises"
import ts from "typescript"
import requireFromString from "require-from-string"

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
		? await (await fetch(uri)).text()
		: await fs.readFile(uri, { encoding: "utf-8" })

	const parts = uri.split("/")
	const savePath =
		basePath + "/" + parts.at(parts.length - 4) + "-" + parts.at(parts.length - 3) + ".js"
	await fs.writeFile(savePath, moduleAsText).catch((e) => {
		console.error("Error while saving file", e)
	})
	try {
		const asCjs = transpileToCjs(moduleAsText)
		const module = requireFromString(asCjs)
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

function transpileToCjs(code: string): string {
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2020,
	}

	const result = ts.transpileModule(code, { compilerOptions })
	return result.outputText
}
