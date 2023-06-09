import type { TransformConfig } from "../config.js"
import { dedent } from "ts-dedent"
import { astToCode, codeToAst, n } from '../../../utils/recast.js'
import { addImport, findImportDeclarations, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { wrapExportedFunction } from '../../../utils/ast/wrap.js'

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (ast: n.File, config: TransformConfig, root: boolean, wrapperFunctionName: string) => {
	addImport(ast, '$app/environment', 'browser')
	addImport(ast, '@inlang/sdk-js/adapter-sveltekit/shared', wrapperFunctionName, 'replaceLanguageInUrl')
	addImport(ast, '@inlang/sdk-js/detectors/client', 'initLocalStorageDetector', 'navigatorDetector')
	if (config.languageInUrl && config.isStatic) {
		addImport(ast, '@sveltejs/kit', 'redirect')
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: test
const getOptions = (config: TransformConfig, root: boolean) =>
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

export const _FOR_TESTING = {
	addImports,
	getOptions,
}

// ------------------------------------------------------------------------------------------------

const assertNoImportsFromSdkJs = (ast: n.File) => {
	if (findImportDeclarations(ast, '@inlang/sdk-js').length) {
		throw Error(`It is currently not supported to import something from '@inlang/sdk-js' in this file.`)
	}
}

export const transformPageJs = (config: TransformConfig, code: string, root: boolean) => {
	const ast = codeToAst(code)

	assertNoImportsFromSdkJs(ast) // TODO: implement functionality

	if (isOptOutImportPresent(ast)) return code

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? 'initRootPageLoadWrapper' : 'initLoadWrapper'

	addImports(ast, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : ''
	wrapExportedFunction(ast, options, wrapperFunctionName, 'load')

	return astToCode(ast)
}
