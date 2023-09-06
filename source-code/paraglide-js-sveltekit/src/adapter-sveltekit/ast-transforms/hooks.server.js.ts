import dedent from "dedent"
import type { SourceFile } from "ts-morph"
import {
	addImport,
	isOptOutImportPresent,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { nodeToCode, codeToNode, codeToSourceFile } from "../../ast-transforms/utils/js.util.js"
import type { VirtualModule } from "../vite-plugin/config/index.js"

// TODO: test
const addImports = (sourceFile: SourceFile, config: VirtualModule, wrapperFunctionName: string) => {
	addImport(
		sourceFile,
		"@inlang/paraglide-js-sveltekit/adapter-sveltekit/server",
		wrapperFunctionName,
	)

	if (!config.options.isStatic && config.options.languageInUrl) {
		addImport(sourceFile, "@sveltejs/kit", "redirect")
		addImport(
			sourceFile,
			"@inlang/paraglide-js-sveltekit/detectors/server",
			"initAcceptLanguageHeaderDetector",
		)
		addImport(
			sourceFile,
			"@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared",
			"replaceLanguageInUrl",
		)
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: use ast transformation instead of string manipulation
// TODO: test
const getOptions = (config: VirtualModule) => {
	const options = dedent`
	{
		excludedRoutes: ${JSON.stringify(config.options.excludedRoutes)},
		parseLanguageTag: ${
			config.options.languageInUrl ? `({ url }) => url.pathname.split("/")[1]` : `() => undefined`
		},
		${
			!config.options.isStatic && config.options.languageInUrl
				? `
			initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
			redirect: {
				throwable: redirect,
				getPath: ({ url }, languageTag) => replaceLanguageInUrl(url, languageTag),
			},
		`
				: ""
		},
	}`

	return nodeToCode(codeToNode(`const x = ${options}`))
}

// ------------------------------------------------------------------------------------------------

export const _FOR_TESTING = {
	addImports,
	getOptions,
}

// ------------------------------------------------------------------------------------------------

export const transformHooksServerJs = (filePath: string, config: VirtualModule, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

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
	removeImport(sourceFile, "@inlang/paraglide-js-sveltekit")

	return nodeToCode(sourceFile)
}
