import type { TransformConfig } from "../config.js"
import { dedent } from "ts-dedent"
import { nodeToCode, codeToSourceFile } from "../../../utils/js.util.js"
import {
	addImport,
	isOptOutImportPresent,
} from "../../../utils/ast/imports.js"
import { wrapExportedFunction } from "../../../utils/ast/wrap.js"
import type { SourceFile } from 'ts-morph'
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'

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
						getPath: ({ url }, language) => replaceLanguageInUrl(new URL(url), language),
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

export const transformPageJs = (filePath: string, config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, '')) // TODO: implement functionality

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? "initRootPageLoadWrapper" : "initLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")

	return nodeToCode(sourceFile)
}
