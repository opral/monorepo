import {
	addImport,
	isOptOutImportPresent,
	isSdkImportPresent,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import { findAllIdentifiersComingFromAnImport } from "../../ast-transforms/utils/usage.js"
import type { VirtualModule } from "../vite-plugin/config/index.js"
import { assertNodeInsideFunctionScope } from "./utils/assertions.js"

export const transformJs = (filePath: string, config: VirtualModule, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!isSdkImportPresent(sourceFile)) return code

	const identifiers = findAllIdentifiersComingFromAnImport(
		sourceFile,
		"@inlang/paraglide-js-sveltekit",
	)
	for (const identifier of identifiers) {
		assertNodeInsideFunctionScope(config, filePath, identifier)
		identifier.replaceWithText(`getRuntimeFromGlobalThis().${identifier.getText()}`)
	}

	removeImport(sourceFile, "@inlang/paraglide-js-sveltekit")
	addImport(
		sourceFile,
		"@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared",
		"getRuntimeFromGlobalThis",
	)

	return nodeToCode(sourceFile)
}
