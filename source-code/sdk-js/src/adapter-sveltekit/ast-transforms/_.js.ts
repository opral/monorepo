import { isOptOutImportPresent, isSdkImportPresent } from '../../ast-transforms/utils/imports.js'
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"

export const transformJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!isSdkImportPresent(sourceFile)) return code

	// TODO

	return nodeToCode(sourceFile)
}
