import type { SourceFile } from 'ts-morph'
import { findImportDeclarations, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { codeToSourceFile } from '../../../utils/utils.js'
import type { TransformConfig } from "../config.js"

const assertNoImportsFromSdkJs = (sourceFile: SourceFile) => {
	if (findImportDeclarations(sourceFile, "@inlang/sdk-js").length) {
		throw Error(
			`It is currently not supported to import something from '@inlang/sdk-js' in this file.`,
		)
	}
}

export const transformServerRequestJs = (config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile) // TODO: implement functionality

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initRequestHandlerWrapper'

	// addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/server', initRequestHandlerWrapper)

	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'GET')
	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'POST')
	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'PUT')
	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'PATCH')
	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'DELETE')
	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'OPTIONS')

	// return nodeToCode(sourceFile)
}
