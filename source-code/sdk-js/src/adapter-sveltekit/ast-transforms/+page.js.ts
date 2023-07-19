import { dedent } from "ts-dedent"
import type { SourceFile } from "ts-morph"
import { assertNoImportsFromSdkJs } from "../../ast-transforms/assertions.js"
import { addImport, isOptOutImportPresent } from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (
	ast: SourceFile,
	config: TransformConfig,
	root: boolean,
	wrapperFunctionName: string,
) => {
	addImport(ast, "$app/environment", "browser")
	addImport(
		ast,
		"@inlang/sdk-js/adapter-sveltekit/shared",
		wrapperFunctionName,
		"replaceLanguageInUrl",
	)
	addImport(ast, "@inlang/sdk-js/detectors/client", "initLocalStorageDetector", "navigatorDetector")
	if (config.languageInUrl && config.isStatic) {
		addImport(ast, "@sveltejs/kit", "redirect")
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: test
const getOptions = (config: TransformConfig, root: boolean) =>
	config.languageInUrl && config.isStatic
		? dedent`
			{
					browser,
					initDetectors: () => [navigatorDetector],
					redirect: {
						throwable: redirect,
						getPath: ({ url }, languageTag) => replaceLanguageInUrl(new URL(url), languageTag),
					},
			}`
		: dedent`
			{
			 		browser
			}`

// ------------------------------------------------------------------------------------------------

export const _FOR_TESTING = {
	addImports,
	getOptions,
}

// ------------------------------------------------------------------------------------------------

export const transformPageJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePathForOutput(config, filePath), "+page.js", root) // TODO: implement functionality

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? "initRootPageLoadWrapper" : "initLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")

	return nodeToCode(sourceFile)
}
