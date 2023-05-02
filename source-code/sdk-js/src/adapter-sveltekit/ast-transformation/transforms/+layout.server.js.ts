import type { TransformConfig } from "../config.js"
import { transformJs } from "./*.js.js"
import { parseModule, generateCode, builders } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import { findLoadDeclaration, emptyLoadExportNodes } from "../../../helpers/ast.js"

const requiredImports = `
import { initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";
`

export const transformLayoutServerJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootLayoutServerJs(config, code)

	return transformGenericLayoutServerJs(config, code)
}

const transformRootLayoutServerJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const importsAst = parseModule(requiredImports)
	if (n.Program.check(ast.$ast)) {
		const loadVariableDeclarator = findLoadDeclaration(ast.$ast)
		const body = ast.$ast.body
		// Add load declaration with ast if needed
		if (loadVariableDeclarator.length === 0) {
			body.push(...emptyLoadExportNodes())
			loadVariableDeclarator.push(...findLoadDeclaration(ast.$ast))
		}
		const initRootLayoutWrapperCall = builders.functionCall("initRootServerLayoutLoadWrapper")
		const wrapperDeclarationAst = b.callExpression(
			b.memberExpression(initRootLayoutWrapperCall.$ast, b.identifier("wrap")),
			[],
		)
		for (const { node: declarator } of loadVariableDeclarator) {
			if (declarator.init) wrapperDeclarationAst.arguments.push(declarator.init)
			declarator.init = wrapperDeclarationAst
		}
	}
	deepMergeObject(ast, importsAst)
	return generateCode(ast).code
}

const transformGenericLayoutServerJs = transformJs
