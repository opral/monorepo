import type { TransformConfig } from "../config.js"
import { transformSvelte } from "./*.svelte.js"
import { parse, preprocess } from "svelte/compiler"
import { vitePreprocess } from "@sveltejs/kit/vite"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import {
	NodeInfoMapEntry,
	findAstJs,
	getReactiveImportIdentifiers,
	astHasSlot,
	makeJsReactive,
	makeMarkupReactive,
	removeSdkJsImport,
	sortMarkup,
} from "../../../helpers/ast.js"
import MagicStringImport from "magic-string"
import { types } from "recast"

// the type definitions don't match
const MagicString = MagicStringImport as unknown as typeof MagicStringImport.default

export const transformLayoutSvelte = (config: TransformConfig, code: string, root: boolean) => {
	if (root) {
		return transformRootLayoutSvelte(config, code)
	}

	return transformGenericLayoutSvelte(config, code)
}

const transformRootLayoutSvelte = async (config: TransformConfig, code: string) => {
	const n = types.namedTypes
	const b = types.builders
	const requiredImportsAsts = [
		parseModule(`import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared";`),
	]
	const reactiveImportIdentifiers: string[] = []
	let localLanguageName: string
	if (config.languageInUrl)
		requiredImportsAsts.push(
			parseModule(
				`import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";`,
			),
		)
	else
		requiredImportsAsts.push(
			parseModule(
				`import { localStorageKey, getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`,
			),
			parseModule(`import { browser } from "$app/environment";`),
		)

	// First, we need to remove typescript statements from script tag
	const codeWithoutTypes = (await preprocess(code, vitePreprocess({ script: true, style: false })))
		.code

	// Insert script tag if we don't have one
	const svelteAst = parse(codeWithoutTypes)
	// TODO @benjaminpreiss I wonder how we could include adding the empty script tag to the sourcemap
	// TODO @benjaminpreiss Find out, why we have to add the lang="ts" attribute below... Otherwise preprocess doesn't recognize the script tag :/
	const codeWithScriptTag = !svelteAst.instance
		? `<script>
// Inserted by inlang
</script>
${codeWithoutTypes}`
		: codeWithoutTypes

	const processed = await preprocess(codeWithScriptTag, {
		script: async (options) => {
			const ast = parseModule(options.content, {
				sourceFileName: config.sourceFileName,
			})
			// Remove export let data statement
			findAstJs(
				ast.$ast,
				[
					({ node }) => n.ExportNamedDeclaration.check(node),
					({ node }) => n.VariableDeclaration.check(node),
					({ node }) => n.VariableDeclarator.check(node),
					({ node }) => n.Identifier.check(node) && node.name === "data",
				],
				(node) =>
					n.ExportNamedDeclaration.check(node)
						? (meta) => {
								const { parent, index } = meta.get(
									node,
								) as NodeInfoMapEntry<types.namedTypes.Program>
								if (index != undefined) parent.body.splice(index, 1)
						  }
						: undefined,
			)

			// Remove import "@inlang/sdk-js" but save the aliases of all imports
			// We need AT LEAST the language declaration for later.
			// Remove import "@inlang/sdk-js" but save the aliases of all imports
			const importNames = removeSdkJsImport(ast.$ast)
			reactiveImportIdentifiers.push(...getReactiveImportIdentifiers(importNames))
			if (importNames.length === 0 || !importNames.some(([imported]) => imported === "language"))
				importNames?.push(["language", "language"])
			if (!options.attributes.context) {
				// Deep merge imports that we need
				for (const importAst of requiredImportsAsts) {
					deepMergeObject(ast, importAst)
				}
			}
			// Initialize former imports & data
			const exportLetDataExportAst = b.exportNamedDeclaration(
				b.variableDeclaration("let", [b.variableDeclarator(b.identifier("data"))]),
			)
			const variableDeclarationAst = b.variableDeclaration(
				"let",
				importNames.map(([, local]) => b.variableDeclarator(b.identifier(local))),
			)
			const addRuntimeToContextAst = b.expressionStatement(
				b.callExpression(b.identifier("addRuntimeToContext"), [
					b.callExpression(b.identifier("getRuntimeFromData"), [b.identifier("data")]),
				]),
			)
			const initImportedVariablesAst = b.expressionStatement(
				b.assignmentExpression(
					"=",
					b.objectPattern(
						importNames.map(([imported, local]) =>
							b.property("init", b.identifier(imported), b.identifier(local)),
						),
					),
					b.callExpression(b.identifier("getRuntimeFromContext"), []),
				),
			)
			const nonReactiveLabeledStatementAst = b.labeledStatement(
				b.identifier("$"),
				b.blockStatement([addRuntimeToContextAst, initImportedVariablesAst]),
			)
			localLanguageName =
				importNames.find(([imported]) => imported === "language")?.[1] ?? "language"
			const reactiveLabeledStatementAst = b.labeledStatement(
				b.identifier("$"),
				b.ifStatement(
					b.logicalExpression("&&", b.identifier("browser"), b.identifier("$" + localLanguageName)),
					b.blockStatement([
						b.expressionStatement(
							b.chainExpression(
								b.callExpression(
									b.optionalMemberExpression(
										b.memberExpression(
											b.memberExpression(b.identifier("document"), b.identifier("body")),
											b.identifier("parentElement"),
										),
										b.identifier("setAttribute"),
									),
									[b.literal("lang"), b.identifier("$" + localLanguageName)],
								),
							),
						),
						b.expressionStatement(
							b.callExpression(
								b.memberExpression(b.identifier("localStorage"), b.identifier("setItem")),
								[b.identifier("localStorageKey"), b.identifier("$" + localLanguageName)],
							),
						),
					]),
				),
			)
			// Return the index in ast body that contains our first declaration
			const usageIndexes = findAstJs(
				ast.$ast,
				[
					({ node }) =>
						n.Identifier.check(node) &&
						(importNames.some(([, local]) => local === node.name) || node.name === "data"),
				],
				(node) =>
					n.Identifier.check(node)
						? (meta) => {
								let { parent, index } = meta.get(node) ?? {}
								while (parent != undefined && !n.Program.check(parent)) {
									const parentMeta = meta.get(parent)
									parent = parentMeta?.parent
									index = parentMeta?.index
								}
								if (n.Program.check(parent)) return index
								return undefined
						  }
						: undefined,
			)[0] as number[] | undefined
			// prefix language and i aliases with $ if reactive
			if (!config.languageInUrl) makeJsReactive(ast.$ast, reactiveImportIdentifiers)
			// Add exportLetDataExportAst, addRuntimeToContextAst and initImportedVariablesAst before any usage of "data" or importNames
			if (n.Program.check(ast.$ast)) {
				ast.$ast.body.splice(
					usageIndexes?.[0] ?? ast.$ast.body.length,
					0,
					exportLetDataExportAst,
					variableDeclarationAst,
					addRuntimeToContextAst,
					initImportedVariablesAst,
					config.languageInUrl ? nonReactiveLabeledStatementAst : reactiveLabeledStatementAst,
				)
			}

			const generated = generateCode(ast, {
				sourceMapName: config.sourceMapName,
			})

			return { ...options, ...generated }
		},
		markup: (options) => {
			// We already iterated over .instance and .module
			// Find locations of nodes with i or language
			const s = new MagicString(options.content)
			const parsed = parse(s.toString())
			const hasSlot = astHasSlot(parsed)
			s.appendRight(
				parsed.html.start,
				`{#key ${!config.languageInUrl ? "$" : ""}${localLanguageName}}`,
			)
			makeMarkupReactive(parsed, s, reactiveImportIdentifiers)
			sortMarkup(parsed, s)
			s.append(!hasSlot ? `<slot />{/key}` : `{/key}`)
			const map = s.generateMap({
				source: config.sourceFileName,
				file: config.sourceMapName,
				includeContent: true,
			})
			const code = s.toString()
			return { code, map }
		},
	})
	return processed.code
}

const transformGenericLayoutSvelte = transformSvelte
