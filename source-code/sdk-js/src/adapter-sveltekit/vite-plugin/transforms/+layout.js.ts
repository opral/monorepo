import type { TransformConfig } from "../config.js"
import { dedent } from "ts-dedent"
import { addImport, findImportDeclarations, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { wrapExportedFunction } from '../../../utils/ast/wrap.js'
import { codeToSourceFile, nodeToCode, n } from '../../../utils/utils.js'

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (ast: n.File, config: TransformConfig, root: boolean, wrapperFunctionName: string) => {
	addImport(ast, '$app/environment', 'browser')
	addImport(ast, '@inlang/sdk-js/adapter-sveltekit/shared', wrapperFunctionName)
	addImport(ast, '@inlang/sdk-js/detectors/client', 'initLocalStorageDetector', 'navigatorDetector')
}

// ------------------------------------------------------------------------------------------------

// TODO: test
const getOptions = (config: TransformConfig, root: boolean) =>
	config.languageInUrl
		? ''
		: dedent`
			{
				initDetectors: browser
					? () => [initLocalStorageDetector(), navigatorDetector]
					: undefined
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

export const transformLayoutJs = (config: TransformConfig, code: string, root: boolean) => {
	const ast = codeToSourceFile(code)

	assertNoImportsFromSdkJs(ast) // TODO: implement functionality
	if (!root) return code // for now we don't need to transform non-root files

	if (isOptOutImportPresent(ast)) return code

	const wrapperFunctionName = root ? 'initRootLayoutLoadWrapper' : 'initLayoutLoadWrapper'

	addImports(ast, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(ast, options, wrapperFunctionName, 'load')

	return nodeToCode(ast)
}
