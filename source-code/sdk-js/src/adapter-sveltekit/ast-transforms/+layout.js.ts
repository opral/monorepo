import { dedent } from "ts-dedent"
import type { SourceFile } from "ts-morph"
import { addImport, isOptOutImportPresent, isSdkImportPresent, removeImport } from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (
	sourceFile: SourceFile,
	config: TransformConfig,
	root: boolean,
	wrapperFunctionName: string,
) => {
	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/shared", wrapperFunctionName)
	if (root && !config.languageInUrl) {
		addImport(sourceFile, "$app/environment", "browser")
		addImport(
			sourceFile,
			"@inlang/sdk-js/detectors/client",
			"initLocalStorageDetector",
			"navigatorDetector",
		)
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: use ast transformation instead of string manipulation
// TODO: test
const getOptions = (config: TransformConfig, root: boolean) =>
	config.languageInUrl
		? "{}"
		: dedent`
			{
				initDetectors: browser
					? () => [initLocalStorageDetector(), navigatorDetector]
					: undefined
			}`

// ------------------------------------------------------------------------------------------------

export const _FOR_TESTING = {
	addImports,
	getOptions,
}

// ------------------------------------------------------------------------------------------------

export const transformLayoutJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!root && !isSdkImportPresent(sourceFile)) return code

	const wrapperFunctionName = root ? "initRootLayoutLoadWrapper" : "initLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")
	removeImport(sourceFile, "@inlang/sdk-js")

	return nodeToCode(sourceFile)
}
