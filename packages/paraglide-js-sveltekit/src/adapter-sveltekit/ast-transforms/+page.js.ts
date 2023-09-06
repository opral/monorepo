import dedent from "dedent"
import type { SourceFile } from "ts-morph"
import {
	addImport,
	isOptOutImportPresent,
	isSdkImportPresent,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { VirtualModule } from "../vite-plugin/config/index.js"

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (
	ast: SourceFile,
	config: VirtualModule,
	root: boolean,
	wrapperFunctionName: string,
) => {
	addImport(ast, "$app/environment", "browser")
	addImport(ast, "@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared", wrapperFunctionName)

	if (config.options.languageInUrl && config.options.isStatic) {
		addImport(
			ast,
			"@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared",
			"replaceLanguageInUrl",
		)
		addImport(
			ast,
			"@inlang/paraglide-js-sveltekit/detectors/client",
			"initLocalStorageDetector",
			"navigatorDetector",
		)
		addImport(ast, "@sveltejs/kit", "redirect")
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: test
const getOptions = (config: VirtualModule, root: boolean) =>
	config.options.languageInUrl && config.options.isStatic
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
	config: VirtualModule,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!root && !isSdkImportPresent(sourceFile)) return code

	const wrapperFunctionName = root ? "initRootPageLoadWrapper" : "initLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")
	removeImport(sourceFile, "@inlang/paraglide-js-sveltekit")

	return nodeToCode(sourceFile)
}
