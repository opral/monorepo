import type { TransformConfig } from "../config.js"
import { dedent } from "ts-dedent"
import { astToCode, codeToAst } from '../../../utils/recast.js'
import { addImport } from '../../../utils/ast/imports.js'
import { wrapExportedFunction } from '../../../utils/ast/wrap.js'
import type * as recast from "recast"

type ASTNode = recast.types.ASTNode

// ------------------------------------------------------------------------------------------------

const addImports = (ast: ASTNode, config: TransformConfig, root: boolean, wrapperFunctionName: string) => {
	addImport(ast, '$app/environment', 'browser')
	addImport(ast, '@inlang/sdk-js/adapter-sveltekit/shared', wrapperFunctionName, 'replaceLanguageInUrl')
	addImport(ast, '@inlang/sdk-js/detectors/client', 'initLocalStorageDetector', 'navigatorDetector')
	if (config.languageInUrl && config.isStatic) {
		addImport(ast, '@sveltejs/kit', 'redirect')
	}
}

// ------------------------------------------------------------------------------------------------

const getOptions = (config: TransformConfig) =>
	config.languageInUrl && config.isStatic
		? dedent`
			{
					browser,
					initDetectors: () => [navigatorDetector],
					redirect: {
						throwable: redirect,
						getPath: ({ url }, language) => replaceLanguageInUrl(new URL(url), language),
					},
			}`
		: dedent`
			{
			 		browser
			}`

// ------------------------------------------------------------------------------------------------

export const transformPageJs = (config: TransformConfig, code: string, root: boolean) => {
	// TODO: implement this
	if (code.includes("'@inlang/sdk-js'") || code.includes('"@inlang/sdk-js"')) {
		throw Error(dedent`
			It is currently not supported to import something from '@inlang/sdk-js' in this file. You can use the following code to make it work:

			export const load = async (event, { i }) => {
				console.info(i('hello.inlang'))
			}
		`)
	}

	const wrapperFunctionName = root ? 'initRootPageLoadWrapper' : 'initLoadWrapper'

	const ast = codeToAst(code)

	addImports(ast, config, root, wrapperFunctionName)

	const options = root ? getOptions(config) : ''
	wrapExportedFunction(ast, options, wrapperFunctionName)

	return astToCode(ast)
}

// ------------------------------------------------------------------------------------------------

export const _FOR_TESTING = {
	addImports,
	getOptions,
}