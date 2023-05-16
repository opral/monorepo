import type { TransformConfig } from "../config.js"
import { parseModule, generateCode, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import {
	getFunctionOrDeclarationValue,
	getWrappedExport,
	removeSdkJsImport,
	replaceOrAddExportNamedFunction,
} from "../../../helpers/ast.js"
import { dedent } from "ts-dedent"
import { extractWrappableExpression } from "../../../helpers/inlangAst.js"

const requiredImports = (config: TransformConfig, root: boolean) => `
import { browser } from "$app/environment";
import { ${
	root ? "initRootPageLoadWrapper" : "initLoadWrapper"
}, replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared";
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client";
import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";
${config.languageInUrl && config.isStatic ? `import { redirect } from "@sveltejs/kit";` : ""}
`

const options = (config: TransformConfig) =>
	config.languageInUrl && config.isStatic
		? `
{
	browser,
	initDetectors: () => [navigatorDetector],
	redirect: {
		throwable: redirect,
		getPath: ({ url }, language) => replaceLanguageInUrl(new URL(url), language),
	},
}
	`
		: `{browser}`

export const transformPageJs = (config: TransformConfig, code: string, root: boolean) => {
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
	const importNames = removeSdkJsImport(ast.$ast)
	// Merge imports with required imports
	const importsAst = parseModule(requiredImports(config, root))
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
		root ? "initRootPageLoadWrapper" : "initLoadWrapper",
	)
	// Replace or add current export handle
	if (n.Program.check(ast.$ast)) {
		replaceOrAddExportNamedFunction(ast.$ast, "load", exportAst)
	}
	return generateCode(ast).code
}
