import type { TransformConfig } from "../config.js"
import { codeToAst, n } from '../../../utils/recast.js'
import { findImportDeclarations, isOptOutImportPresent } from '../../../utils/ast/imports.js'

// ------------------------------------------------------------------------------------------------

const assertNoImportsFromSdkJs = (ast: n.File) => {
	if (findImportDeclarations(ast, '@inlang/sdk-js').length) {
		throw Error(`It is currently not supported to import something from '@inlang/sdk-js' in this file.`)
	}
}

export const transformPageServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const ast = codeToAst(code)

	assertNoImportsFromSdkJs(ast) // TODO: implement functionality

	if (isOptOutImportPresent(ast)) return code

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initServerLoadWrapper'

	// addImport(ast, '@inlang/sdk-js/adapter-sveltekit/server', wrapperFunctionName)

	// wrapExportedFunction(ast, '', wrapperFunctionName, 'load')

	// return astToCode(ast)
}
