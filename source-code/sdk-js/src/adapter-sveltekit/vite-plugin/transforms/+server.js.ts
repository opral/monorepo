import type { SourceFile } from 'ts-morph'
import { findImportDeclarations, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { codeToSourceFile } from '../../../utils/utils.js'
import type { TransformConfig } from "../config.js"

const assertNoImportsFromSdkJs = (ast: SourceFile) => {
	if (findImportDeclarations(ast, "@inlang/sdk-js").length) {
		throw Error(
			`It is currently not supported to import something from '@inlang/sdk-js' in this file.`,
		)
	}
}

export const transformServerRequestJs = (config: TransformConfig, code: string, root: boolean) => {
	const ast = codeToSourceFile(code)

	assertNoImportsFromSdkJs(ast) // TODO: implement functionality

	if (isOptOutImportPresent(ast)) return code

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initRequestHandlerWrapper'

	// addImport(ast, '@inlang/sdk-js/adapter-sveltekit/server', initRequestHandlerWrapper)

	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'GET')
	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'POST')
	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'PUT')
	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'PATCH')
	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'DELETE')
	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'OPTIONS')

	// return astToCode(ast)
}
