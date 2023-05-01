import type { TransformConfig } from "../config.js"
import { parse, preprocess } from "svelte/compiler"
import { parseModule, generateCode } from "magicast"
import { deepMergeObject } from "magicast/helpers"
import { typescript } from "svelte-preprocess"
import { findAstJs, findAstSvelte } from "../../../helpers/index.js"
import { types } from "recast"
import type { NodeInfoMapEntry, RunOn } from "../../../helpers/ast.js"
import MagicStringImport from "magic-string"

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

	// This matches either "import { i as inn } from '@inlang/sdk-js';" or "import { i } from '@inlang/sdk-js';"
	const inlangStoreMatchers: Parameters<typeof findAstJs>[1] = [
		({ node }) =>
			n.ImportDeclaration.check(node) &&
			n.Literal.check(node.source) &&
			node.source.value === "@inlang/sdk-js",
		({ node }) => n.ImportSpecifier.check(node),
		// TODO match all other imports from "@inlang/sdk-js"
		({ node }) => n.Identifier.check(node) && (node.name === "i" || node.name === "language"),
	]
	const requiredImports = config.languageInUrl
		? `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive";`
		: `import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";`

	// First, we need to remove typescript statements from script tag
	// While doing that we can merge the imports in the script tag

	const importIdentifiers: [string, string][] = []

	const processed = await preprocess(code, {
		script: async (options) => {
			const script = await typescript({}).script({
				...options,
				filename: "",
			})
			const ast = parseModule(script.code, {
				sourceFileName: config.sourceFileName,
			})
			const importsAst = parseModule(requiredImports)
			if (!options.attributes.context) {
				// Deep merge imports
				deepMergeObject(ast, importsAst)
			}

			if (n.Program.check(ast.$ast)) {
				const runOn = ((node) =>
					n.ImportSpecifier.check(node)
						? (meta) => {
							const { parent } = meta.get(
								node,
							) as NodeInfoMapEntry<types.namedTypes.ImportDeclaration>
							const specifierIndex = parent?.specifiers?.findIndex(
								(specifier) => specifier === node,
							)
							// Remove "i" and "lang" import from "@inlang/sdk-js"
							if (specifierIndex != undefined) parent?.specifiers?.splice(specifierIndex, 1)
							// Remove the complete import from "@inlang/sdk-js" if it is empty now
							if (parent?.specifiers?.length === 0 && n.Program.check(ast.$ast)) {
								const declarationIndex = ast.$ast.body.findIndex((node) => node === parent)
								declarationIndex != undefined && ast.$ast.body.splice(declarationIndex, 1)
							}
							return [node.imported.name, node.local?.name ?? node.imported.name]
						}
						: undefined) satisfies RunOn<types.namedTypes.Node, [string, string] | undefined>
				// TODO remove ALL imports from "@inlang/sdk-js"
				// Remove imports "i" and "language" from "@inlang/sdk-js" but save their aliases
				const importNames = findAstJs(ast.$ast, inlangStoreMatchers, runOn)[0]
				if (importNames) importIdentifiers.push(...(importNames as [string, string][]))
				// prefix language and i aliases with $ if reactive
				if (!config.languageInUrl) {
					findAstJs(
						ast.$ast,
						[
							({ node }) =>
								n.Identifier.check(node) && importIdentifiers.some(([, n]) => n === node.name),
						],
						(node) => (n.Identifier.check(node) ? () => (node.name = "$" + node.name) : undefined),
					)
				}
				// TODO Insert ALL previously imported aliases from "@inlang/sdk-js" in the following assignment
				// Insert i and language variable declarations after the injected import for getRuntimeFromContext
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
			return { ...script, ...generated }
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
				[
					({ node }) =>
						n.Identifier.check(node) && !!importIdentifiers.some(([, name]) => name === node.name),
				],
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
