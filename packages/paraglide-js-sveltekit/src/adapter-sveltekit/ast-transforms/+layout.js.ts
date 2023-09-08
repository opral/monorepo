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
	sourceFile: SourceFile,
	config: VirtualModule,
	root: boolean,
	wrapperFunctionName: string,
) => {
	addImport(
		sourceFile,
		"@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared",
		wrapperFunctionName,
	)
	if (root && !config.options.languageInUrl) {
		addImport(sourceFile, "$app/environment", "browser")
		addImport(
			sourceFile,
			"@inlang/paraglide-js-sveltekit/detectors/client",
			"initLocalStorageDetector",
			"navigatorDetector",
		)
	}
}

// ------------------------------------------------------------------------------------------------

// TODO: use ast transformation instead of string manipulation
// TODO: test
const getOptions = (config: VirtualModule, root: boolean) =>
	config.options.languageInUrl
		? "{}"
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

export const transformLayoutJs = (
	filePath: string,
	config: VirtualModule,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code
	if (!root && !isSdkImportPresent(sourceFile)) return code

	const wrapperFunctionName = root ? "initRootLayoutLoadWrapper" : "initLoadWrapper"

	addImports(sourceFile, config, root, wrapperFunctionName)

	injectHotReloadCode(sourceFile)

	const options = root ? getOptions(config, root) : undefined
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "load")
	removeImport(sourceFile, "@inlang/paraglide-js-sveltekit")

	return nodeToCode(sourceFile)
}

// ------------------------------------------------------------------------------------------------

const injectHotReloadCode = (sourceFile: SourceFile) => {
	// addImport(sourceFile, "@inlang/paraglide-js-sveltekit", "language")

	// sourceFile.addVariableStatement({
	// 	declarations: [{
	// 		name: 'inlang_hmr_language',
	// 		// type: 'string',
	// 	}]
	// })

	sourceFile.insertText(
		0,
		dedent`
		if (import.meta.hot) {
			import.meta.hot.on('inlang-messages-changed', async () => {
				location.reload()
			})
		}
	`,
	)

	// const loadFn = findOrCreateExport(sourceFile, 'load', '() => { }')
	// const block = findFunctionBodyBlock(loadFn)

	// block.insertStatements(0, dedent`
	// 	inlang_hmr_language = language
	// `)
}

// const findFunctionBodyBlock = (node: Node): Block => {
// 	if (Node.isSatisfiesExpression(node) || Node.isParenthesizedExpression(node)) {
// 		return findFunctionBodyBlock(node.getExpression())
// 	}
// 	if (Node.isCallExpression(node)) {
// 		return findFunctionBodyBlock(node.getArguments()[0]!)
// 	}

// 	if (Node.isVariableDeclaration(node)) {
// 		return findFunctionBodyBlock(node.getInitializer()!)
// 	}

// 	if (Node.isArrowFunction(node) || Node.isFunctionDeclaration(node)) {
// 		return node.getBody() as Block
// 	}

// 	throw new Error(`Could not find function body block for kind '${node.getKindName()}'.`)
// }
