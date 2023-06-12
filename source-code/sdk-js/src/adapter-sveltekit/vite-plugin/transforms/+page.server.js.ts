import type { TransformConfig } from "../config.js"
import { codeToSourceFile } from "../../../utils/utils.js"
import { findImportDeclarations, isOptOutImportPresent } from "../../../utils/ast/imports.js"
import type { SourceFile } from 'ts-morph'

// ------------------------------------------------------------------------------------------------

const assertNoImportsFromSdkJs = (sourceFile: SourceFile) => {
	if (findImportDeclarations(sourceFile, "@inlang/sdk-js").length) {
		throw Error(
			`It is currently not supported to import something from '@inlang/sdk-js' in this file.`,
		)
	}
}

export const transformPageServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code)

	assertNoImportsFromSdkJs(sourceFile) // TODO: implement functionality

	if (isOptOutImportPresent(sourceFile)) return code

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initServerLoadWrapper'

	// addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/server', wrapperFunctionName)

	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'load')

	// return nodeToCode(sourceFile)
}
