import type { TransformConfig } from "../config.js"
import {
	addImport,
	isOptOutImportPresent,
} from "../../../utils/ast/imports.js"
import { wrapExportedFunction } from "../../../utils/ast/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../../utils/js.util.js"
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'

export const transformLayoutServerJs = (filePath: string, config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, '')) // TODO: implement functionality

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? "initRootLayoutServerLoadWrapper" : "initServerLoadWrapper"

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", wrapperFunctionName)

	wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, "load")

	return nodeToCode(sourceFile)
}
