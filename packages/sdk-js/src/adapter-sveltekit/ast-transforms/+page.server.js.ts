import {
	addImport,
	isOptOutImportPresent,
	isSdkImportPresent,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import type { TransformConfig } from "../vite-plugin/config.js"

export const transformPageServerJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!isSdkImportPresent(sourceFile)) return code

	const wrapperFunctionName = "initServerLoadWrapper"

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", wrapperFunctionName)

	wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, "load")
	removeImport(sourceFile, "@inlang/sdk-js")

	return nodeToCode(sourceFile)
}
