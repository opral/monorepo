import type { TransformConfig } from "../config.js"
import { dedent } from "ts-dedent"
import {
	addImport,
	findImportDeclarations,
	isOptOutImportPresent,
} from "../../../utils/ast/imports.js"
import { wrapExportedFunction } from "../../../utils/ast/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../../utils/utils.js"
import type { SourceFile } from 'ts-morph'

// ------------------------------------------------------------------------------------------------

// TODO: test
const addImports = (
	sourceFile: SourceFile,
	config: TransformConfig,
	root: boolean,
	wrapperFunctionName: string,
) => {
	addImport(sourceFile, "$app/environment", "browser")
	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/shared", wrapperFunctionName)
	addImport(sourceFile, "@inlang/sdk-js/detectors/client", "initLocalStorageDetector", "navigatorDetector")
}

// ------------------------------------------------------------------------------------------------

// TODO: use ast transformation instead of string manipulation
// TODO: test
const getOptions = (config: TransformConfig, root: boolean) =>
	config.languageInUrl
		? ""
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

const assertNoImportsFromSdkJs = (sourceFile: SourceFile) => {
	if (findImportDeclarations(sourceFile, "@inlang/sdk-js").length) {
		throw Error(
			`It is currently not supported to import something from '@inlang/sdk-js' in this file.`,
		)
	}
}

export const transformLayoutJs = (config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile) // TODO: implement functionality
	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? "initRootLayoutLoadWrapper" : "initLayoutLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")

	return nodeToCode(sourceFile)
}
