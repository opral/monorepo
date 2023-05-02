import type { TransformConfig } from "../config.js"
import { transformJs } from "./*.js.js"
import { parseModule, generateCode, builders, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import { findLoadDeclaration, emptyLoadExportNodes } from "../../../helpers/ast.js"

const requiredImports = `
import { browser } from "$app/environment";
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared";
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client";
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";
`

const options = `
{initDetectors: browser
? () => [initLocalStorageDetector(localStorageKey), navigatorDetector]
: undefined}
`

export const transformLayoutJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootLayoutJs(config, code)

	return transformGenericLayoutJs(config, code)
}

const transformRootLayoutJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const withOptions = !config.languageInUrl
	const ast = parseModule(code)

	// Merge imports with required imports
	const importsAst = parseModule(requiredImports)
	deepMergeObject(ast, importsAst)

	if (n.Program.check(ast.$ast)) {
		const loadVariableDeclarator = findLoadDeclaration(ast.$ast)
		const body = ast.$ast.body
		// Add load declaration with ast if needed
		if (loadVariableDeclarator.length === 0) {
			body.push(...emptyLoadExportNodes)
			loadVariableDeclarator.push(...findLoadDeclaration(ast.$ast))
		}
		const optionsAst = parseExpression(withOptions ? options : "{}")
		const initRootLayoutWrapperCall = builders.functionCall("initRootLayoutLoadWrapper", optionsAst)
		const wrapperDeclarationAst = b.callExpression(
			b.memberExpression(initRootLayoutWrapperCall.$ast, b.identifier("wrap")),
			[],
		)
		for (const { node: declarator } of loadVariableDeclarator) {
			if (declarator.init) wrapperDeclarationAst.arguments.push(declarator.init)
			declarator.init = wrapperDeclarationAst
		}
	}

	return generateCode(ast).code
}

const transformGenericLayoutJs = transformJs
