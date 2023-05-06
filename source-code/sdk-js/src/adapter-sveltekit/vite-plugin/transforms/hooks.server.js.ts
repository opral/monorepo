import type { TransformConfig } from "../config.js"
import { types } from "recast"
import { parseModule, generateCode, parseExpression } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import {
	getArrowOrFunction,
	getWrappedExport,
	replaceOrAddExportNamedFunction,
} from "../../../helpers/ast.js"

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
getLanguage: ({ url }) => url.pathname.split("/")[1],
`
		: `
getLanguage: () => undefined,
`) +
	(config.languageInUrl && !config.isStatic
		? `
initDetectors: ({ request }) => [initAcceptLanguageHeaderDetector(request.headers)],
redirect: {
throwable: redirect,
getPath: ({ url }, language) => replaceLanguageInUrl(url, language),
},
`
		: '') +
	"}"

export const transformHooksServerJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const imports = requiredImports(config)
	const importsAst = parseModule(imports)
	deepMergeObject(ast, importsAst)
	const emptyArrowFunctionDeclaration = b.arrowFunctionExpression(
		[
			b.objectPattern([
				b.property("init", b.identifier("event"), b.identifier("event")),
				b.property("init", b.identifier("resolve"), b.identifier("resolve")),
			]),
		],
		b.callExpression(b.identifier("resolve"), [b.identifier("event")]),
	)
	const arrowOrFunctionNode = getArrowOrFunction(ast.$ast, "handle", emptyArrowFunctionDeclaration)
	const exportAst = getWrappedExport(
		parseExpression(options(config)),
		[arrowOrFunctionNode],
		"handle",
		"initHandleWrapper",
	)

	// Replace or add current export handle
	if (n.Program.check(ast.$ast)) {
		replaceOrAddExportNamedFunction(ast.$ast, "handle", exportAst)
	}
	return generateCode(ast).code
}
