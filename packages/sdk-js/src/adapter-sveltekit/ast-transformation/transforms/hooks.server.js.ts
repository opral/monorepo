import type { TransformConfig } from "../config.js"
import { types } from "recast"
import { parseModule, generateCode, builders, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { findAst } from "../../../helpers/index.js"

const requiredImports = `
import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";
import { initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors/server";
import { redirect } from "@sveltejs/kit";
import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared";
`

const options = (config: TransformConfig) =>
	"{" +
	(config.languageInUrl
		? `
getLanguage: ({ url }) => url.pathname.split("/")[1],
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

const emptyHandleFunction = `export const handle = async ({ event, resolve }) => resolve(event);`

export const transformHooksServerJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const importsAst = parseModule(requiredImports)
	deepMergeObject(ast, importsAst)

	const handleMatchers: Parameters<typeof findAst>[1] = [
		({ node }) => n.ExportNamedDeclaration.check(node),
		({ node }) => n.VariableDeclaration.check(node),
		({ node }) => n.VariableDeclarator.check(node),
		({ node }) => n.Identifier.check(node) && node.name === "handle",
	]

	if (n.Program.check(ast.$ast)) {
		const hasHandle =
			findAst(
				ast.$ast,
				handleMatchers,
				({ node }) => n.Identifier.check(node),
				() => true,
			)[0] === true
		const body = ast.$ast.body
		// Add load declaration with ast if needed
		const emptyHandleExportAst = parseModule(emptyHandleFunction)
		if (!hasHandle && n.Program.check(emptyHandleExportAst.$ast)) {
			body.push(...emptyHandleExportAst.$ast.body)
		}
		const optionsAst = parseExpression(options(config))
		const initHandleWrapperCall = builders.functionCall("initHandleWrapper", optionsAst)
		const wrapperDeclarationAst = b.callExpression(
			b.memberExpression(initHandleWrapperCall.$ast, b.identifier("wrap")),
			[],
		)
		findAst(
			ast.$ast,
			handleMatchers,
			({ node }) => n.Identifier.check(node),
			({ parent }) => {
				if (n.VariableDeclarator.check(parent) && parent.init) {
					wrapperDeclarationAst.arguments.push(parent.init)
					parent.init = wrapperDeclarationAst
				}
			},
		)
	}
	return generateCode(ast).code
}
