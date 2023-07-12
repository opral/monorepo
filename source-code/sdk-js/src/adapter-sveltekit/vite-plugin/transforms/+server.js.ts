import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'
import { isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { codeToSourceFile } from '../../../utils/utils.js'
import type { TransformConfig } from "../config.js"

export const transformServerRequestJs = (filePath: string, config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, '')) // TODO: implement functionality

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
