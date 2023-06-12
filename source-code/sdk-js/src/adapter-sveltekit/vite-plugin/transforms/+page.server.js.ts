import type { TransformConfig } from "../config.js"
import { codeToSourceFile } from "../../../utils/utils.js"
import { findImportDeclarations, isOptOutImportPresent } from "../../../utils/ast/imports.js"
import type { SourceFile } from 'ts-morph'

// ------------------------------------------------------------------------------------------------

const assertNoImportsFromSdkJs = (ast: SourceFile) => {
	if (findImportDeclarations(ast, "@inlang/sdk-js").length) {
		throw Error(
			`It is currently not supported to import something from '@inlang/sdk-js' in this file.`,
		)
	}
}

export const transformPageServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const ast = codeToSourceFile(code)

	assertNoImportsFromSdkJs(ast) // TODO: implement functionality

	if (isOptOutImportPresent(ast)) return code

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initServerLoadWrapper'

	// addImport(ast, '@inlang/sdk-js/adapter-sveltekit/server', wrapperFunctionName)

	// wrapExportedFunction(ast, undefined, wrapperFunctionName, 'load')

	// return astToCode(ast)
}
