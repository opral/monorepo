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

const options = (config: TransformConfig) => dedent`
	{
		inlangConfigModule: import("../inlang.config.js"),
		getLanguage: ${
			config.languageInUrl ? `({ url }) => url.pathname.split("/")[1]` : `() => undefined`
		},
	${
		config.languageInUrl && !config.isStatic
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

export const transformHooksServerJs = (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const ast = parseModule(code)

	// Merge imports with required imports
	const imports = requiredImports(config)
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
			parseExpression(options(config)),
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
