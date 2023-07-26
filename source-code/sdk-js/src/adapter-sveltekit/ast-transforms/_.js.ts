import { addImport, isOptOutImportPresent, isSdkImportPresent, removeImport } from '../../ast-transforms/utils/imports.js'
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import { findAllIdentifiersComingFromAnImport } from '../../ast-transforms/utils/usage.js'
import type { TransformConfig } from "../vite-plugin/config.js"

export const transformJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!isSdkImportPresent(sourceFile)) return code

	const identifiers = findAllIdentifiersComingFromAnImport(sourceFile, '@inlang/sdk-js')
	for (const identifier of identifiers) {
		// TODO: throw an error if not used within a function scope
		identifier.replaceWithText(`getRuntimeFromGlobalThis().${identifier.getText()}`)
	}

	removeImport(sourceFile, '@inlang/sdk-js')
	addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/client/shared', 'getRuntimeFromGlobalThis')

	return nodeToCode(sourceFile)
}
