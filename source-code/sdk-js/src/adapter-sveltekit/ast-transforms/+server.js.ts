import { assertNoImportsFromSdkJs } from "../../ast-transforms/assertions.js"
import { isOptOutImportPresent } from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"

export const transformServerRequestJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePathForOutput(config, filePath), "+server.js", root) // TODO: implement functionality

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
