import type { TransformConfig } from "../config.js"
import {
	addImport,
	findImportDeclarations,
	isOptOutImportPresent,
} from "../../../utils/ast/imports.js"
import { wrapExportedFunction } from "../../../utils/ast/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../../utils/utils.js"
import type { SourceFile } from 'ts-morph'

const assertNoImportsFromSdkJs = (sourceFile: SourceFile) => {
	if (findImportDeclarations(sourceFile, "@inlang/sdk-js").length) {
		throw Error(
			`It is currently not supported to import something from '@inlang/sdk-js' in this file.`,
		)
	}
}

export const transformLayoutServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const sourceFile = codeToSourceFile(code)

	assertNoImportsFromSdkJs(sourceFile) // TODO: implement functionality

	if (isOptOutImportPresent(sourceFile)) return code

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? "initRootLayoutServerLoadWrapper" : "initServerLoadWrapper"

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", wrapperFunctionName)

	wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, "load")

	return nodeToCode(sourceFile)
}
