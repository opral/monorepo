import type { TransformConfig } from "../config.js"
import { transformJs } from "./*.js.js"
import { parseModule, generateCode, builders, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import { transformAstAtMatching } from "../../../helpers/ast.js"

export const requiredImports = `
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

	if (n.Program.check(ast.$ast)) {
		const body = ast.$ast.body
		// Add load declaration with ast if needed
		if (!ast.exports.load && n.Program.check(emptyLoadExportAst.$ast)) {
			body.push(...emptyLoadExportAst.$ast.body)
		}
		transformAstAtMatching(
			ast.$ast,
			[
				({ node }) => n.ExportNamedDeclaration.check(node),
				({ node }) => n.VariableDeclaration.check(node),
				({ node }) => n.VariableDeclarator.check(node),
				({ node }) => n.Identifier.check(node) && node.name === "load",
			],
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

export const createRootLayoutJs = (config: TransformConfig) => {
	const options = !config.languageInUrl
		? `
initDetectors: browser
? () => [initLocalStorageDetector(localStorageKey), navigatorDetector]
: undefined,
`
		: ""

	return `
import { browser } from "$app/environment"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client"
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

export const load = initRootLayoutLoadWrapper({${options}}).wrap(async () => { })
`
}

// TODO: transform
export const wrapRootLayoutJs = (config: TransformConfig, code: string) => {
	// TODO: more meaningful error messages
	throw new Error("currently not supported")
}

// ------------------------------------------------------------------------------------------------
