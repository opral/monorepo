import { normalizePath } from "@inlang-git/fs"
import type { $import as InlangEnvironment$import } from "@inlang/core/environment"
import fetch from "node-fetch"
import fs from "node:fs/promises"
import ts from "typescript"
import requireFromString from "require-from-string"

export const $import: InlangEnvironment$import = async (uri: string) => {
	// polyfill for environments that don't support dynamic
	// http imports yet like VSCode.
	const moduleAsText = uri.startsWith("http")
		? await (await fetch(uri)).text()
		: ((await fs.readFile(normalizePath(uri), { encoding: "utf-8" })) as string)
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
			{ cause: error },
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
