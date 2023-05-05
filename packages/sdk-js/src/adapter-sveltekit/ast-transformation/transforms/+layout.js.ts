import type { TransformConfig } from "../config.js"
import { transformJs } from "./*.js.js"
import { parseModule, generateCode, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import {
	getArrowOrFunction,
	getWrappedExport,
	replaceOrAddExportNamedFunction,
} from "../../../helpers/ast.js"

const requiredImports = `
import { browser } from "$app/environment";
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared";
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client";
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";
`

const options = (config: TransformConfig) =>
	config.languageInUrl
		? `{}`
		: `
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
	const ast = parseModule(code)

	// Merge imports with required imports
	const importsAst = parseModule(requiredImports)
	deepMergeObject(ast, importsAst)
	const emptyArrowFunctionDeclaration = b.arrowFunctionExpression([], b.blockStatement([]))
	const arrowOrFunctionNode = getArrowOrFunction(ast.$ast, "load", emptyArrowFunctionDeclaration)
	const exportAst = getWrappedExport(
		parseExpression(options(config)),
		[arrowOrFunctionNode],
		"load",
		"initRootLayoutLoadWrapper",
	)
	// Replace or add current export handle
	if (n.Program.check(ast.$ast)) {
		replaceOrAddExportNamedFunction(ast.$ast, "load", exportAst)
	}
	return generateCode(ast).code
}

const transformGenericLayoutJs = transformJs
