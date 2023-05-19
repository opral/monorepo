import type { TransformConfig } from "../config.js"
import { parse, preprocess } from "svelte/compiler"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { types } from "recast"
import {
	getReactiveImportIdentifiers,
	getRootReferenceIndexes,
	initImportedVariablesAst,
	makeJsReactive,
	makeMarkupReactive,
	variableDeclarationAst,
} from "../../../helpers/ast.js"
import MagicStringImport from "magic-string"
import { vitePreprocess } from "@sveltejs/kit/vite"
import { getSdkImportedModules } from "../../../helpers/inlangAst.js"

// the type definitions don't match
const MagicString = MagicStringImport as unknown as typeof MagicStringImport.default

export const transformSvelte = async (config: TransformConfig, code: string): Promise<string> => {
	const n = types.namedTypes

	const requiredImports = config.languageInUrl
		? `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";`
		: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`

	const reactiveImportIdentifiers: string[] = []

	// First, we need to remove typescript statements from script tag
	const codeWithoutTypes = (await preprocess(code, vitePreprocess({ script: true, style: true })))
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
			const importsAst = parseModule(requiredImports)
			if (!options.attributes.context) {
				// Deep merge imports that we need
				deepMergeObject(ast, importsAst)
			}

			// Remove import "@inlang/sdk-js" but save the aliases of all imports
			const importNames = getSdkImportedModules(ast.$ast)
			reactiveImportIdentifiers.push(...getReactiveImportIdentifiers(importNames))
			const usageIndexes = getRootReferenceIndexes(ast.$ast, [...importNames, ["data", "data"]])
			// prefix language and i aliases with $ if reactive
			if (!config.languageInUrl) makeJsReactive(ast.$ast, reactiveImportIdentifiers)
			// Insert all variable declarations after the injected import for getRuntimeFromContext
			if (n.Program.check(ast.$ast)) {
				ast.$ast.body.splice(
					usageIndexes?.[0] ?? ast.$ast.body.length,
					0,
					...([variableDeclarationAst(importNames), initImportedVariablesAst(importNames)].filter(
						(n) => n !== undefined,
					) as types.namedTypes.ExpressionStatement[]),
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
			const parsed = parse(options.content)
			const { instance, module } = parsed
			// We already iterated over .instance and .module
			parsed.instance = undefined
			parsed.module = undefined
			// Find locations of nodes with i or language
			const s = new MagicString(options.content)
			if (!config.languageInUrl) makeMarkupReactive(parsed, s, reactiveImportIdentifiers)
			parsed.instance = instance
			parsed.module = module
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
