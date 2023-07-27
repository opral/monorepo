import { findExport } from "../../ast-transforms/utils/exports.js"
import {
	addImport,
	isOptOutImportPresent,
	isSdkImportPresent,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import type { TransformConfig } from "../vite-plugin/config.js"

export const transformServerRequestJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!isSdkImportPresent(sourceFile)) return code

	const wrapperFunctionName = "initRequestHandlerWrapper"

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", wrapperFunctionName)

	const exports = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
	for (const exportName of exports) {
		if (findExport(sourceFile, exportName)) {
			// TODO: only transform exports that actually use SDK imports
			wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, exportName)
		}
	}
	removeImport(sourceFile, "@inlang/sdk-js")

	return nodeToCode(sourceFile)
}
