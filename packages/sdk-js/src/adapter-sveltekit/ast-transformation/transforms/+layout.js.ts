import type { TransformConfig } from "../config.js"
import { transformJs } from "./*.js.js"
import { parseModule, generateCode, builders, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import { findAst } from "../../../helpers/index.js"

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

const emptyLoadFunction = `export const load = async () => {};`

export const transformLayoutJs = (config: TransformConfig, code: string, root: boolean) => {
	if (root) return transformRootLayoutJs(config, code)

	return transformGenericLayoutJs(config, code)
}

// ------------------------------------------------------------------------------------------------

const transformRootLayoutJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const withOptions = !config.languageInUrl
	const ast = parseModule(code)
	const optionsAst = parseExpression(withOptions ? options : "{}")
	const emptyLoadExportAst = parseModule(emptyLoadFunction)
	const importsAst = parseModule(requiredImports)
	const initRootLayoutWrapperCall = builders.functionCall("initRootLayoutLoadWrapper", optionsAst)
	const wrapperDeclarationAst = b.callExpression(
		b.memberExpression(initRootLayoutWrapperCall.$ast, b.identifier("wrap")),
		[],
	)

	// Merge imports with required imports
	deepMergeObject(ast, importsAst)

	const loadMatchers: Parameters<typeof findAst>[1] = [
		({ node }) => n.ExportNamedDeclaration.check(node),
		({ node }) => n.VariableDeclaration.check(node),
		({ node }) => n.VariableDeclarator.check(node),
		({ node }) => n.Identifier.check(node) && node.name === "load",
	]

	if (n.Program.check(ast.$ast)) {
		const hasLoad =
			findAst(
				ast.$ast,
				loadMatchers,
				({ node }) => n.Identifier.check(node),
				() => true,
			)[0] === true
		const body = ast.$ast.body
		// Add load declaration with ast if needed
		if (!hasLoad && n.Program.check(emptyLoadExportAst.$ast)) {
			body.push(...emptyLoadExportAst.$ast.body)
		}
		findAst(
			ast.$ast,
			loadMatchers,
			({ node }) => n.Identifier.check(node),
			({ parent }) => {
				if (n.VariableDeclarator.check(parent) && parent.init) {
					wrapperDeclarationAst.arguments.push(parent.init)
					parent.init = wrapperDeclarationAst
				}
			},
		)
	}
	return generateCode(ast).code
}

// ------------------------------------------------------------------------------------------------

const transformGenericLayoutJs = transformJs
