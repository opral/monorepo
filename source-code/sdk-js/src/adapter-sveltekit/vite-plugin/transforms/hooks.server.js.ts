import type { TransformConfig } from "../config.js"
import { dedent } from "ts-dedent"
import { addImport, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { wrapExportedFunction } from '../../../utils/ast/wrap.js'
import { codeToNode, codeToSourceFile, nodeToCode } from '../../../utils/utils.js'
import type { SourceFile } from 'ts-morph'
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'

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
		getLanguage: ${config.languageInUrl ? `({ url }) => url.pathname.split("/")[1]` : `() => undefined`},
		${!config.isStatic && config.languageInUrl
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

export const transformHooksServerJs = (config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile) // TODO: implement functionality

	const wrapperFunctionName = "initHandleWrapper"

	addImports(sourceFile, config, wrapperFunctionName)

	const options = getOptions(config)
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "handle", '({ resolve, event }) => resolve(event)')

	return nodeToCode(sourceFile)
}
