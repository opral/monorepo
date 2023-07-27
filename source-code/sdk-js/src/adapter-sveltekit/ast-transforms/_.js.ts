import { Identifier, Node } from 'ts-morph'
import { addImport, isOptOutImportPresent, isSdkImportPresent, removeImport } from '../../ast-transforms/utils/imports.js'
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import { findAllIdentifiersComingFromAnImport } from '../../ast-transforms/utils/usage.js'
import type { TransformConfig } from "../vite-plugin/config.js"
import { InlangSdkException } from '../vite-plugin/exceptions.js'
import { filePathForOutput } from '../vite-plugin/fileInformation.js'

export const transformJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!isSdkImportPresent(sourceFile)) return code

	const identifiers = findAllIdentifiersComingFromAnImport(sourceFile, '@inlang/sdk-js')
	for (const identifier of identifiers) {
		assertInsideFunctionScope(config, filePath, identifier)
		identifier.replaceWithText(`getRuntimeFromGlobalThis().${identifier.getText()}`)
	}

	removeImport(sourceFile, '@inlang/sdk-js')
	addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/client/shared', 'getRuntimeFromGlobalThis')

	return nodeToCode(sourceFile)
}

const assertInsideFunctionScope = (config: TransformConfig, filePath: string, identifier: Identifier) => {
	let node: Node | undefined = identifier.getParent()

	while (node) {
		if (Node.isFunctionLikeDeclaration(node)) return
		node = node.getParent()
	}

	throw new InlangSdkException(`You cannot directly access any '@inlang/sdk-js' imports in outside a function scope in this file (${filePathForOutput(config, filePath)}).
Please read the docs for more information on how to workaround this limitation:
https://inlang.com/documentation/sdk/sveltekit/advanced#*.js`)
}
