import type { TransformConfig } from "../config.js"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import {
	getArrowOrFunction,
	getWrappedExport,
	replaceOrAddExportNamedFunction,
} from "../../../helpers/ast.js"

const requiredImports = (root: boolean) =>
	root
		? `
import { initRootPageServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";
`
		: `
import { initPageServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";
`

// TODO: refactor together with `+layout.server.js.ts`
export const transformPageServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const importsAst = parseModule(requiredImports(root))
	deepMergeObject(ast, importsAst)
	const emptyArrowFunctionDeclaration = b.arrowFunctionExpression([], b.blockStatement([]))
	const arrowOrFunctionNode = getArrowOrFunction(ast.$ast, "load", emptyArrowFunctionDeclaration)
	const exportAst = getWrappedExport(
		undefined,
		[arrowOrFunctionNode],
		"load",
		`init${root ? "Root" : ""}PageServerLoadWrapper`,
	)
	// Replace or add current export handle
	if (n.Program.check(ast.$ast)) {
		replaceOrAddExportNamedFunction(ast.$ast, "load", exportAst)
	}
	return generateCode(ast).code
}
