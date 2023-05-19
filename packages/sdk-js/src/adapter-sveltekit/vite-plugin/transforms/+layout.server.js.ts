import type { TransformConfig } from "../config.js"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import { getFunctionOrDeclarationValue } from "../../../helpers/ast.js"
import { dedent } from "ts-dedent"
import {
	extractWrappableExpression,
	getWrappedExport,
	getSdkImportedModules,
	replaceOrAddExportNamedFunction,
} from "../../../helpers/inlangAst.js"

const requiredImports = (root: boolean) =>
	root
		? `
import { initRootLayoutServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";
`
		: `
import { initServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";
`

// TODO: refactor together with `+page.server.js.ts`
export const transformLayoutServerJs = (config: TransformConfig, code: string, root: boolean) => {
	// TODO: implement this
	if (code.includes("'@inlang/sdk-js'") || code.includes('"@inlang/sdk-js"')) {
		throw Error(dedent`
			It is currently not supported to import something from '@inlang/sdk-js' in this file. You can use the following code to make it work:

			export const load = async (event, { i }) => {
				console.log(i('hello.inlang'))
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
		undefined,
		[arrowOrFunctionNode],
		"load",
		root ? "initRootLayoutServerLoadWrapper" : "initServerLoadWrapper",
	)
	// Replace or add current export handle
	if (n.Program.check(ast.$ast)) {
		replaceOrAddExportNamedFunction(ast.$ast, "load", exportAst)
	}
	return generateCode(ast).code
}
