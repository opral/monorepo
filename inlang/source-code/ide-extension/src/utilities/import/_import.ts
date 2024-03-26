import { normalizePath } from "@lix-js/fs"
import fetch from "node-fetch"
import ts from "typescript"
import requireFromString from "require-from-string"
import type { ImportFunction } from "@inlang/sdk"
import fs from "node:fs/promises"
import { HttpsProxyAgent } from "https-proxy-agent"
import { workspace } from "vscode"

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
	const httpsProxy =
		process.env.HTTPS_PROXY || workspace.getConfiguration().get("http.proxy") || undefined
	const httpsAgent = httpsProxy ? new HttpsProxyAgent(httpsProxy) : undefined

	// polyfill for environments that don't support dynamic
	// http imports yet like Visual Studio Code.

	const moduleAsText = uri.startsWith("http")
		? await (await fetch(uri, { agent: httpsAgent })).text()
		: await fs.readFile(uri, { encoding: "utf-8" })

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
