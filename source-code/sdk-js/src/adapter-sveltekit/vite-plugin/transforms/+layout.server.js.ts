import type { TransformConfig } from "../config.js"
import { addImport, findImportDeclarations, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { wrapExportedFunction } from '../../../utils/ast/wrap.js'
import { codeToSourceFile, nodeToCode, n } from '../../../utils/recast.js'

const assertNoImportsFromSdkJs = (ast: n.File) => {
	if (findImportDeclarations(ast, '@inlang/sdk-js').length) {
		throw Error(`It is currently not supported to import something from '@inlang/sdk-js' in this file.`)
	}
}

export const transformLayoutServerJs = (config: TransformConfig, code: string, root: boolean) => {
	const ast = codeToSourceFile(code)

	assertNoImportsFromSdkJs(ast) // TODO: implement functionality

	if (isOptOutImportPresent(ast)) return code

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? 'initRootLayoutServerLoadWrapper' : 'initServerLoadWrapper'

	addImport(ast, '@inlang/sdk-js/adapter-sveltekit/server', wrapperFunctionName)

	wrapExportedFunction(ast, undefined, wrapperFunctionName, 'load')

	return nodeToCode(ast)
}
