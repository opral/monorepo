import type { TransformConfig } from "../config.js"
import { codeToSourceFile } from "../../../utils/utils.js"
import { isOptOutImportPresent } from "../../../utils/ast/imports.js"
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'

// ------------------------------------------------------------------------------------------------

export const transformPageServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile) // TODO: implement functionality

	return code // for now we don't need to transform any files

	// const wrapperFunctionName = 'initServerLoadWrapper'

	// addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/server', wrapperFunctionName)

	// wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, 'load')

	// return nodeToCode(sourceFile)
}
