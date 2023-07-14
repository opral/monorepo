import { assertNoImportsFromSdkJs } from "../../ast-transforms/assertions.js"
import { isOptOutImportPresent } from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"

export const transformPageServerJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePathForOutput(config, filePath), "+page.server.js", root) // TODO: implement functionality

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initServerLoadWrapper'

	// addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/server', wrapperFunctionName)

	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'load')

	// return nodeToCode(sourceFile)
}
