import type { TransformConfig } from "../config.js"
import { types } from "recast"
import { parseModule, generateCode, builders, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { getArrowOrFunction, replaceOrAddExportNamed } from "../../../helpers/ast.js"

const requiredImports = (config: TransformConfig) =>
	`
import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";` +
	(config.isStatic || !config.languageInUrl
		? ``
		: `
import { initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors/server";
import { redirect } from "@sveltejs/kit";
import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared";
`)

const options = (config: TransformConfig) =>
	"{" +
	(config.languageInUrl
		? `
getLanguage: ({ url }) => url.pathname.split.skip("/")[1],
`
		: `
getLanguage: () => undefined,
`) +
	(config.isStatic || !config.languageInUrl
		? ``
		: `
initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
redirect: {
throwable: redirect,
getPath: ({ url }, language) => replaceLanguageInUrl(url, language),
},
`) +
	"}"

export const transformHooksServerJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const imports = requiredImports(config)
	const importsAst = parseModule(imports)
	deepMergeObject(ast, importsAst)

	const arrowOrFunctionNode = getArrowOrFunction(ast.$ast, "handle")
	const optionsAst = parseExpression(options(config))
	const initHandleWrapperCall = builders.functionCall("initHandleWrapper", optionsAst)
	const wrapperDeclarationAst = b.callExpression(
		b.memberExpression(initHandleWrapperCall.$ast, b.identifier("wrap")),
		[arrowOrFunctionNode],
	)
	const exportAst = b.exportNamedDeclaration(
		b.variableDeclaration("const", [
			b.variableDeclarator(b.identifier("handle"), wrapperDeclarationAst),
		]),
	)

	if (n.Program.check(ast.$ast)) {
		// Replace or add current export handle
		replaceOrAddExportNamed(ast.$ast, "handle", exportAst)
		/* const hasHandle = matchers.found
		const body = ast.$ast.body
		// Add load declaration with ast if needed
		const emptyHandleExportAst = parseModule(emptyHandleFunction)
		if (!hasHandle && n.Program.check(emptyHandleExportAst.$ast)) {
			body.push(...emptyHandleExportAst.$ast.body)
		}

		findAstJs(ast.$ast, matchers.matchers, (node) =>
			n.Identifier.check(node)
				? (meta) => {
						const { parent } = meta.get(node) ?? {}
						if (n.VariableDeclarator.check(parent) && parent.init) {
							wrapperDeclarationAst.arguments.push(parent.init)
							parent.init = wrapperDeclarationAst
						}
				  }
				: undefined,
		) */
	}
	return generateCode(ast).code
}
