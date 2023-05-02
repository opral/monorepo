import type { TransformConfig } from "../config.js"
import { parse, preprocess } from "svelte/compiler"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { findAstJs, findAstSvelte } from "../../../helpers/index.js"
import { types } from "recast"
import { NodeInfoMapEntry, inlangSdkJsStores } from "../../../helpers/ast.js"
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

	const importIdentifiers: [string, string][] = []
	const reactiveImportIdentifiers: string[] = []

	// First, we need to remove typescript statements from script tag
	const codeWithoutTypes = (await preprocess(code, vitePreprocess({ script: true, style: false })))
		.code

	const processed = await preprocess(codeWithoutTypes, {
		script: async (options) => {
			const ast = parseModule(options.content, {
				sourceFileName: config.sourceFileName,
			})
			const importsAst = parseModule(requiredImports)
			if (!options.attributes.context) {
				// Deep merge imports that we need
				deepMergeObject(ast, importsAst)
			}

			if (n.Program.check(ast.$ast)) {
				// Remove imports "i" and "language" from "@inlang/sdk-js" but save their aliases
				const importNames = findAstJs(
					ast.$ast,
					[
						({ node }) =>
							n.ImportDeclaration.check(node) &&
							n.Literal.check(node.source) &&
							node.source.value === "@inlang/sdk-js",
						({ node }) => n.ImportSpecifier.check(node),
					],
					(node) =>
						n.ImportSpecifier.check(node)
							? (meta) => {
									const { parent } = meta.get(
										node,
									) as NodeInfoMapEntry<types.namedTypes.ImportDeclaration>
									// Remove the complete import from "@inlang/sdk-js" if it is empty now
									// (We assume that imports can only be top-level)
									if (n.Program.check(ast.$ast)) {
										const declarationIndex = ast.$ast.body.findIndex((node) => node === parent)
										declarationIndex != -1 && ast.$ast.body.splice(declarationIndex, 1)
									}
									return [node.imported.name, node.local?.name ?? node.imported.name]
							  }
							: undefined,
				)[0]
				if (importNames) importIdentifiers.push(...(importNames as [string, string][]))
				reactiveImportIdentifiers.push(
					...importIdentifiers.flatMap(([imported, local]) =>
						inlangSdkJsStores.includes(imported) ? [local] : [],
					),
				)
				// prefix language and i aliases with $ if reactive
				if (!config.languageInUrl) {
					findAstJs(
						ast.$ast,
						[
							({ node }) =>
								n.Identifier.check(node) && reactiveImportIdentifiers.includes(node.name),
						],
						(node) => (n.Identifier.check(node) ? () => (node.name = "$" + node.name) : undefined),
					)
				}
				// Insert all variable declarations after the injected import for getRuntimeFromContext
				const insertion = getRuntimeFromContextInsertion(importIdentifiers)
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
			}
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
			const locations = findAstSvelte(
				parsed,
				[({ node }) => n.Identifier.check(node) && reactiveImportIdentifiers.includes(node.name)],
				(node) =>
					n.Identifier.check(node) && Object.hasOwn(node, "start") && Object.hasOwn(node, "end")
						? () => [(node as any).start, (node as any).end]
						: undefined,
			)[0] as [string, string][] | undefined

			const s = new MagicString(options.content)
			// Prefix these exact locations with $signs by utilizing magicstring (which keeps the sourcemap intact)
			if (locations) {
				for (const [start] of locations) {
					s.appendLeft(+start, "$")
				}
			}
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
