import type { TransformConfig } from "../config.js"
import { parseModule, generateCode, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import {
	extractWrappableExpression,
	getWrappedExport,
	getSdkImportedModules,
	replaceOrAddExportNamedFunction,
} from "../../../helpers/inlangAst.js"
import { dedent } from "ts-dedent"

const requiredImports = (root: boolean) => `
import { browser } from "$app/environment";
import { ${
	root ? "initRootLayoutLoadWrapper" : "initLoadWrapper"
} } from "@inlang/sdk-js/adapter-sveltekit/shared";
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client";
`

const options = (config: TransformConfig) =>
	config.languageInUrl
		? `{}`
		: `
{initDetectors: browser
? () => [initLocalStorageDetector(), navigatorDetector]
: undefined}
`

export const transformLayoutJs = (config: TransformConfig, code: string, root: boolean) => {
	// TODO: implement this
	if (code.includes("'@inlang/sdk-js'") || code.includes('"@inlang/sdk-js"')) {
		throw Error(dedent`
			It is currently not supported to import something from '@inlang/sdk-js' in this file. You can use the following code to make it work:

			export const load = async (event, { i }) => {
				console.info(i('hello.inlang'))
			}
		`)
	}

	const n = types.namedTypes
	const ast = parseModule(code)
	// Remove imports, but save their names
	const importNames = getSdkImportedModules(ast.$ast)
	// Merge imports with required imports
	const importsAst = parseModule(requiredImports(root))
	deepMergeObject(ast, importsAst)
	const arrowOrFunctionNode = extractWrappableExpression({
		ast: ast.$ast,
		name: "load",
		availableImports: importNames,
	})
	const exportAst = getWrappedExport(
		parseExpression(root ? options(config) : "{}"),
		[arrowOrFunctionNode],
		"load",
		root ? "initRootLayoutLoadWrapper" : "initLoadWrapper",
	)
	// Replace or add current export handle
	if (n.Program.check(ast.$ast)) {
		replaceOrAddExportNamedFunction(ast.$ast, "load", exportAst)
	}
	return generateCode(ast).code
}
