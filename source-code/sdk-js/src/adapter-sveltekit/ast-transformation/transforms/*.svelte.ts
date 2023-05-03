import type { TransformConfig } from "../config.js"
import { parse, preprocess } from "svelte/compiler"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { findAstJs } from "../../../helpers/index.js"
import { types } from "recast"
import {
	NodeInfoMapEntry,
	getReactiveImportIdentifiers,
	makeJsReactive,
	makeMarkupReactive,
	removeSdkJsImport,
} from "../../../helpers/ast.js"
import MagicStringImport from "magic-string"
import { vitePreprocess } from "@sveltejs/kit/vite"

// the type definitions don't match
const MagicString = MagicStringImport as unknown as typeof MagicStringImport.default

// TODO: fix this soon !!
// supports multiple imports
// assumption: imports are always on top of the file
// no other variable can be named `i` or `language`
// no other code snippet can contain `i(`
// no other code snippet can contain `language`
export const transformSvelte = async (config: TransformConfig, code: string): Promise<string> => {
	const n = types.namedTypes
	const b = types.builders

	// This creates either "const { i: inn } = getRuntimeFromContext();" or "const { i } = getRuntimeFromContext();"
	const getRuntimeFromContextInsertion = (importIdentifiers: [string, string][]) =>
		b.variableDeclaration("const", [
			b.variableDeclarator(
				b.objectPattern(
					importIdentifiers?.map(([imported, local]) =>
						b.property("init", b.identifier(imported), b.identifier(local)),
					),
				),
				b.callExpression(b.identifier("getRuntimeFromContext"), []),
			),
		])

	const requiredImports = config.languageInUrl
		? `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";`
		: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`

	const reactiveImportIdentifiers: string[] = []

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
			const importsAst = parseModule(requiredImports)
			if (!options.attributes.context) {
				// Deep merge imports that we need
				deepMergeObject(ast, importsAst)
			}

			// Remove import "@inlang/sdk-js" but save the aliases of all imports
			const importNames = removeSdkJsImport(ast.$ast)
			reactiveImportIdentifiers.push(...getReactiveImportIdentifiers(importNames))
			// prefix language and i aliases with $ if reactive
			if (!config.languageInUrl) makeJsReactive(ast.$ast, reactiveImportIdentifiers)
			// Insert all variable declarations after the injected import for getRuntimeFromContext
			const insertion = getRuntimeFromContextInsertion(importNames)
			findAstJs(
				ast.$ast,
				[
					({ node }) => n.ImportDeclaration.check(node),
					({ node }) =>
						n.ImportSpecifier.check(node) && node.imported.name === "getRuntimeFromContext",
				],
				(node) =>
					n.ImportDeclaration.check(node)
						? (meta) => {
								const { parent, index } = meta.get(
									node,
								) as NodeInfoMapEntry<types.namedTypes.Program>
								if (index != undefined) parent.body.splice(index + 1, 0, insertion)
						  }
						: undefined,
			)
			const generated = generateCode(ast, {
				sourceMapName: config.sourceMapName,
			})

			return { ...options, ...generated }
		},
		markup: (options) => {
			const parsed = parse(options.content)
			const { instance, module } = parsed
			// We already iterated over .instance and .module
			parsed.instance = undefined
			parsed.module = undefined
			// Find locations of nodes with i or language
			const s = new MagicString(options.content)
			makeMarkupReactive(parsed, s, reactiveImportIdentifiers)
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

	return processed.code
}
