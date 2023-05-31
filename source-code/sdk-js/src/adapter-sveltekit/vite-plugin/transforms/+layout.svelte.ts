import type { TransformConfig } from "../config.js"
import { transformSvelte } from "./_.svelte.js"
import { parse, preprocess } from "svelte/compiler"
import { vitePreprocess } from "@sveltejs/kit/vite"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import {
	NodeInfoMapEntry,
	findAstJs,
	getReactiveImportIdentifiers,
	makeJsReactive,
	makeMarkupReactive,
	sortMarkup,
	htmlIsEmpty,
	variableDeclarationAst,
	initImportedVariablesAst,
	getRootReferenceIndexes,
} from "../../../helpers/ast.js"
import MagicStringImport from "magic-string"
import { types } from "recast"
import { getSdkImportedModules } from "../../../helpers/inlangAst.js"

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
				`import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`,
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

	const processedScript = await preprocess(codeWithScriptTag, {
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
			const importNames = getSdkImportedModules(ast.$ast)
			if (importNames.length === 0 || !importNames.some(([imported]) => imported === "language"))
				importNames?.push(["language", "language"])

			// Svelte bug: store imports need to come first
			importNames.sort(([identifier]) => (identifier === "language" || identifier === "i" ? -1 : 1))

			reactiveImportIdentifiers.push(...getReactiveImportIdentifiers(importNames))
			const reactiveImportNames = importNames.filter(([, local]) =>
				reactiveImportIdentifiers.includes(local),
			)

			// Deep merge imports that we need
			if (!options.attributes.context) {
				for (const importAst of requiredImportsAsts) {
					deepMergeObject(ast, importAst)
				}
			}
			// Initialize former imports & data
			const exportLetDataExportAst = b.exportNamedDeclaration(
				b.variableDeclaration("let", [b.variableDeclarator(b.identifier("data"))]),
			)

			const addRuntimeToContextAst = b.expressionStatement(
				b.callExpression(b.identifier("addRuntimeToContext"), [
					b.callExpression(b.identifier("getRuntimeFromData"), [b.identifier("data")]),
				]),
			)
			const nonReactiveLabeledStatementAst = (importNames: [string, string][]) =>
				b.labeledStatement(
					b.identifier("$"),
					b.blockStatement([
						addRuntimeToContextAst,
						...([initImportedVariablesAst(importNames)].filter(
							(n) => n !== undefined,
						) as types.namedTypes.ExpressionStatement[]),
					]),
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
						// TODO @benjaminpreiss: add this line only of `localStorage` is configured
						// TODO @benjaminpreiss: do the same for `sessionStorage`
						b.expressionStatement(
							b.callExpression(
								b.memberExpression(b.identifier("localStorage"), b.identifier("setItem")),
								[b.literal("language"), b.identifier("$" + localLanguageName)],
							),
						),
					]),
				),
			)
			// Return the index in ast body that contains our first declaration
			const usageIndexes = getRootReferenceIndexes(ast.$ast, [...importNames, ["data", "data"]])
			// prefix language and i aliases with $ if reactive
			if (!config.languageInUrl) makeJsReactive(ast.$ast, reactiveImportIdentifiers)
			// Add exportLetDataExportAst, addRuntimeToContextAst and initImportedVariablesAst before any usage of "data" or importNames
			if (n.Program.check(ast.$ast)) {
				ast.$ast.body.splice(
					usageIndexes?.[0] ?? ast.$ast.body.length,
					0,
					...([
						exportLetDataExportAst,
						variableDeclarationAst(importNames),
						addRuntimeToContextAst,
						initImportedVariablesAst(importNames),
						config.languageInUrl
							? nonReactiveLabeledStatementAst(reactiveImportNames)
							: reactiveLabeledStatementAst,
					].filter((n) => n !== undefined) as types.namedTypes.ExpressionStatement[]),
				)
			}

			const generated = generateCode(ast, {
				sourceMapName: config.sourceMapName,
			})

			return { ...options, ...generated }
		},
	})

	const processedMarkup = await preprocess(processedScript.code, {
		markup: (options) => {
			// We already iterated over .instance and .module
			// Find locations of nodes with i or language
			const s = new MagicString(options.content)
			const parsed = parse(s.toString())
			const insertSlot = htmlIsEmpty(parsed.html)
			s.appendRight(
				parsed.html.start,
				"" +
					(config.languageInUrl && config.isStatic ? `{#if ${localLanguageName}}` : "") +
					(config.languageInUrl ? `{#key ${localLanguageName}}` : `{#if $${localLanguageName}}`),
			)
			if (!config.languageInUrl) makeMarkupReactive(parsed, s, reactiveImportIdentifiers)
			sortMarkup(parsed, s)
			s.append(
				(insertSlot ? `<slot />` : ``) +
					(config.languageInUrl ? `{/key}` : `{/if}`) +
					(config.languageInUrl && config.isStatic ? `{/if}` : ""),
			)
			const map = s.generateMap({
				source: config.sourceFileName,
				file: config.sourceMapName,
				includeContent: true,
			})
			const code = s.toString()
			return { code, map }
		},
	})

	return processedMarkup.code
}

const transformGenericLayoutSvelte = transformSvelte
