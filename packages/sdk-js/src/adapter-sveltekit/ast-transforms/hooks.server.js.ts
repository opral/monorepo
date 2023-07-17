import { dedent } from "ts-dedent"
import type { SourceFile } from "ts-morph"
import { assertNoImportsFromSdkJs } from "../../ast-transforms/assertions.js"
import { addImport, isOptOutImportPresent } from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { nodeToCode, codeToNode, codeToSourceFile } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"

// TODO: test
const addImports = (
	sourceFile: SourceFile,
	config: TransformConfig,
	wrapperFunctionName: string,
) => {
	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", wrapperFunctionName)

	if (!config.isStatic && config.languageInUrl) {
		addImport(sourceFile, "@sveltejs/kit", "redirect")
		addImport(sourceFile, "@inlang/sdk-js/detectors/server", "initAcceptLanguageHeaderDetector")
		addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/shared", "replaceLanguageInUrl")
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: use ast transformation instead of string manipulation
// TODO: test
const getOptions = (config: TransformConfig) => {
	const options = dedent`
	{
		inlangConfigModule: import("../inlang.config.js"),
		getLanguage: ${
			config.languageInUrl ? `({ url }) => url.pathname.split("/")[1]` : `() => undefined`
		},
		${
			!config.isStatic && config.languageInUrl
				? `
			initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
			redirect: {
				throwable: redirect,
				getPath: ({ url }, language) => replaceLanguageInUrl(url, language),
			},
		`
				: ""
		}
	}`

	return nodeToCode(codeToNode(`const x = ${options}`))
}

// ------------------------------------------------------------------------------------------------

export const _FOR_TESTING = {
	addImports,
	getOptions,
}

// ------------------------------------------------------------------------------------------------

export const transformHooksServerJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePathForOutput(config, filePath), "hooks.server.js") // TODO: implement functionality

	const wrapperFunctionName = "initHandleWrapper"

	addImports(sourceFile, config, wrapperFunctionName)

	const options = getOptions(config)
	wrapExportedFunction(
		sourceFile,
		options,
		wrapperFunctionName,
		"handle",
		"({ resolve, event }) => resolve(event)",
	)

	return nodeToCode(sourceFile)
}
