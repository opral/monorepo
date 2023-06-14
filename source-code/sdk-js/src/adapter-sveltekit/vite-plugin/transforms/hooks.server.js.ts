import type { TransformConfig } from "../config.js"
import { types } from "recast"
import { parseModule, generateCode, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { findDefinition, mergeNodes } from "../../../helpers/ast.js"
import { dedent } from "ts-dedent"
import {
	getWrappedExport,
	replaceOrAddExportNamedFunction,
	replaceSdkImports,
} from "../../../helpers/inlangAst.js"
import type { ExpressionKind } from "ast-types/gen/kinds.js"
import { addImport, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { wrapExportedFunction } from '../../../utils/ast/wrap.js'
import { codeToNode, codeToSourceFile, nodeToCode } from '../../../utils/utils.js'
import type { SourceFile } from 'ts-morph'
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'

export const transformHooksServerJs1 = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const imports = (config) as any
	const importsAst = parseModule(imports)
	deepMergeObject(ast, importsAst)
	// export function handle({event, resolve}) {}
	const functionTemplate = b.exportNamedDeclaration(
		b.functionDeclaration(
			b.identifier("handle"),
			[
				b.objectPattern([
					b.property("init", b.identifier("event"), b.identifier("event")),
					b.property("init", b.identifier("resolve"), b.identifier("resolve")),
				]),
			],
			b.blockStatement([
				b.returnStatement(b.callExpression(b.identifier("resolve"), [b.identifier("event")])),
			]),
		),
	)
	// Replace imports from sdk
	replaceSdkImports(ast.$ast, "locals")
	// Make sure that exported "handle" function exists & has the parameters we need
	mergeNodes(ast.$ast, functionTemplate)
	const [def] = findDefinition(ast.$ast, "handle")
	if (def) {
		const exportAst = getWrappedExport(
			parseExpression(""),
			[def as ExpressionKind],
			"handle",
			"initHandleWrapper",
		)

		// Replace or add current export handle
		if (n.Program.check(ast.$ast)) {
			replaceOrAddExportNamedFunction(ast.$ast, "handle", exportAst)
		}
	}
	return generateCode(ast).code
}

// ------------------------------------------------------------------------------------------------

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
	wrapExportedFunction(sourceFile, options, wrapperFunctionName, "handle")
	// TODO: check if handle must return `resolve(event)`

	return nodeToCode(sourceFile)
}
