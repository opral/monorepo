import type { Node } from "estree"
import type { Result } from "@inlang/core/utilities"
import { walk as jsWalk, type SyncHandler } from "estree-walker"
import { walk as svelteWalk } from "svelte/compiler"
import type { Ast } from "../../../../node_modules/svelte/types/compiler/interfaces.js"
import { types } from "recast"
import { parseModule, builders } from "magicast"
import type MagicStringImport from "magic-string"

export class FindAstError extends Error {
	readonly #id = "FindAstException"
}

type SyncHandlerParams = Parameters<SyncHandler>

type FindAstConditionParameter<N extends types.namedTypes.Node | Node> = {
	node?: N | null
	parent?: types.namedTypes.Node | Node | null
	key?: SyncHandlerParams[2]
	index?: SyncHandlerParams[3]
}

type FindAstCondition<N extends types.namedTypes.Node | Node> = (
	parameter: FindAstConditionParameter<N>,
) => boolean

export type NodeInfoMapEntry<P extends Node | types.namedTypes.Node | null> = {
	parent: P
	key: P extends null ? undefined | null : keyof P
	index: number | null | undefined
	runOnNode: boolean
}

export type NodeInfoMap<P extends Node | types.namedTypes.Node | null> = Map<
	Node | types.namedTypes.Node,
	NodeInfoMapEntry<P>
>

export type RunOn<N extends types.namedTypes.Node | Node, T> = (
	node: FindAstConditionParameter<N>["node"],
) => ((meta: NodeInfoMap<types.namedTypes.Node | Node | null>) => T) | undefined

type FindAst<T> = <W extends types.namedTypes.Node | Node | Ast>(
	walker: typeof jsWalk,
) => (
	sourceAst: W,
	matchers: [
		FindAstCondition<types.namedTypes.Node | Node>,
		...FindAstCondition<types.namedTypes.Node | Node>[],
	],
	runOn: RunOn<types.namedTypes.Node | Node, T>,
) => Result<T[], FindAstError>
// Insert element only if all ancestors match matchers
// find a nodes parent where the node matches and where all ancestors match
// Create a map for matchingNodes: Map<Node, matchedCount>
//

// TODO: rework error handling
const findAst = (<W>(walker: typeof jsWalk) =>
	(sourceAst: W, matchers, runOn) => {
		const matchCount = new Map<Node, number>()
		const matches: Node[] = []
		const nodeInfoMap: NodeInfoMap<Node | types.namedTypes.Node | null> = new Map()
		// Find matching node, the corresponding parent and insertionPoint
		walker(sourceAst as Node, {
			enter(node, parent, key, index) {
				nodeInfoMap.set(node, {
					parent,
					key: key as keyof typeof parent,
					index,
					runOnNode: runOn(node) !== undefined,
				})
				const matchCountAncestor = !parent ? 0 : matchCount.get(parent) ?? 0
				if (matchCountAncestor < matchers.length) {
					const matcher = matchers[matchCountAncestor]
					const isMatching = matcher ? matcher({ node, parent, key, index }) : false
					if (isMatching) {
						matchCount.set(node, matchCountAncestor + 1)
						if (matchCountAncestor === matchers.length - 1) matches.push(node)
					}
				} else this.skip()
			},
		})
		if (matches.length === 0)
			return [
				undefined,
				new Error("Can't find path in ast matching the passed matchers") as FindAstError,
			]
		const runResults = []
		for (const match of matches) {
			const matchPath: (Node | types.namedTypes.Node)[] = []
			let currentNode: Node | types.namedTypes.Node | null | undefined = match
			while (currentNode) {
				matchPath.splice(0, 0, currentNode)
				currentNode = nodeInfoMap.get(currentNode)?.parent
			}
			// matchpath needs to contain one node that isInsertionRefNode
			const runOnNode = matchPath.find((node) => nodeInfoMap.get(node)?.runOnNode)
			const fn = runOn(runOnNode)
			if (!runOnNode)
				return [undefined, new Error("Can't find specified insertion point") as FindAstError]
			if (fn) runResults.push(fn(nodeInfoMap))
		}

		return [runResults, undefined]
	}) satisfies FindAst<any>

export const findAstJs = findAst<types.namedTypes.Node | Node>(jsWalk)

export const findAstSvelte = findAst<Ast>(svelteWalk)

const n = types.namedTypes
const b = types.builders

const loadMatchers: Parameters<typeof findAstJs>[1] = [
	({ node }) => n.ExportNamedDeclaration.check(node),
	({ node }) => n.VariableDeclaration.check(node),
	({ node }) => n.VariableDeclarator.check(node),
	({ node }) => n.Identifier.check(node) && node.name === "load",
]

export const findLoadDeclaration = (ast: types.namedTypes.Node | Node) =>
	(findAstJs(ast, loadMatchers, (node) =>
		n.VariableDeclarator.check(node)
			? (meta) => {
					return { node, meta }
			  }
			: undefined,
	)[0] as {
		node: types.namedTypes.VariableDeclarator
	}[]) ?? []

const emptyLoadFunction = `export const load = async () => {};`
export const emptyLoadExportNodes = () =>
	(parseModule(emptyLoadFunction).$ast as types.namedTypes.Program).body

// NOTES: Test this with imports on a single line or on multiple lines
// Removes all the @inlang/sdk-js import(s) (There could theoretically be multiple imports on multiple lines)
// Returns an array with the import properties and their aliases
export const removeSdkJsImport = (ast: types.namedTypes.Node | Node): [string, string][] =>
	findAstJs(
		ast,
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
						// Remove the complete import from "@inlang/sdk-js"
						// (We assume that imports can only be top-level)
						if (n.Program.check(ast)) {
							const declarationIndex = ast.body.findIndex((node) => node === parent)
							declarationIndex != -1 && ast.body.splice(declarationIndex, 1)
						}
						return [node.imported.name, node.local?.name ?? node.imported.name]
				  }
				: undefined,
	)[0] ?? []

export const makeMarkupReactive = (
	parsed: Ast,
	s: MagicStringImport.default,
	reactiveIdentifiers: string[],
) => {
	const { instance, module } = parsed
	parsed.instance = undefined
	parsed.module = undefined
	const locations = findAstSvelte(
		parsed,
		[({ node }) => n.Identifier.check(node) && reactiveIdentifiers.includes(node.name)],
		(node) =>
			n.Identifier.check(node) && Object.hasOwn(node, "start") && Object.hasOwn(node, "end")
				? () => [(node as any).start, (node as any).end]
				: undefined,
	)[0] as [string, string][] | undefined

	//const s = new MagicString(options.content)
	// Prefix these exact locations with $signs by utilizing magicstring (which keeps the sourcemap intact)
	if (locations) {
		for (const [start] of locations) {
			s.appendLeft(+start, "$")
		}
	}
	parsed.instance = instance
	parsed.module = module
}

export const sortMarkup = (parsed: Ast, s: MagicStringImport.default) => {
	const { instance, module, css } = parsed
	parsed.instance = undefined
	parsed.module = undefined
	parsed.css = undefined
	const lastIndex = s.toString().length + 1
	for (const child of parsed.html.children ?? []) {
		s.move(child.start, child.end, lastIndex)
	}
	parsed.instance = instance
	parsed.module = module
	parsed.css = css
}

export const makeJsReactive = (ast: types.namedTypes.Node, reactiveIdentifiers: string[]) => {
	findAstJs(
		ast,
		[({ node }) => n.Identifier.check(node) && reactiveIdentifiers.includes(node.name)],
		(node) => (n.Identifier.check(node) ? () => (node.name = "$" + node.name) : undefined),
	)
}

const inlangSdkJsStores = ["i", "language"]

export const getReactiveImportIdentifiers = (importNames: [string, string][]) =>
	importNames.flatMap(([imported, local]) => (inlangSdkJsStores.includes(imported) ? [local] : []))

// Taken from mozilla docs: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace#whitespace_helper_functions
function is_all_ws(s: string) {
	return !/[^\t\n\r ]/.test(s)
}

export const htmlIsEmpty = (htmlAst: Ast["html"]) => {
	if (htmlAst.children == undefined || htmlAst.children.length === 0) return true
	return htmlAst.children.every(
		(templateNode) =>
			(templateNode.type === "Text" && is_all_ws(templateNode.data)) ||
			templateNode.type === "Comment",
	)
}

const functionMatchers = (name: string): Parameters<typeof findAstJs>[1] => [
	({ node }) => n.FunctionDeclaration.check(node),
	({ node }) => n.Identifier.check(node) && node.name === name,
]

const arrowFunctionMatchers = (name: string): Parameters<typeof findAstJs>[1] => [
	({ node }) => n.VariableDeclaration.check(node),
	({ node }) =>
		n.VariableDeclarator.check(node) && n.Identifier.check(node.id) && node.id.name === name,
	({ node }) => n.ArrowFunctionExpression.check(node),
]

export const getArrowOrFunction = (
	ast: types.namedTypes.Node,
	name: string,
	fallbackFunction: types.namedTypes.FunctionExpression | types.namedTypes.ArrowFunctionExpression,
) => {
	const arrowFunctionExpressionSearchResults = findAstJs(ast, arrowFunctionMatchers(name), (node) =>
		n.ArrowFunctionExpression.check(node) ? () => node : undefined,
	)[0]
	const functionDeclarationSearchResults = findAstJs(ast, functionMatchers(name), (node) =>
		n.FunctionDeclaration.check(node) ? () => node : undefined,
	)[0] as
		| [types.namedTypes.FunctionDeclaration, ...types.namedTypes.FunctionDeclaration[]]
		| undefined
	const arrowFunctionExpression =
		arrowFunctionExpressionSearchResults && arrowFunctionExpressionSearchResults.length > 0
			? (arrowFunctionExpressionSearchResults[0] as types.namedTypes.ArrowFunctionExpression)
			: undefined
	const functionDeclaration =
		functionDeclarationSearchResults && functionDeclarationSearchResults.length > 0
			? b.functionExpression.from({
					async: functionDeclarationSearchResults[0].async,
					body: functionDeclarationSearchResults[0].body,
					params: functionDeclarationSearchResults[0].params,
					generator: functionDeclarationSearchResults[0].generator,
					id: functionDeclarationSearchResults[0].id,
			  })
			: undefined
	return arrowFunctionExpression ?? functionDeclaration ?? fallbackFunction
}

export const replaceOrAddExportNamedFunction = (
	ast: types.namedTypes.Program,
	name: string,
	replacementAst: types.namedTypes.ExportNamedDeclaration,
) => {
	const runOn = ((node) =>
		n.ExportNamedDeclaration.check(node)
			? (meta) => {
					const { index } = meta.get(node) as NodeInfoMapEntry<types.namedTypes.Program>
					if (index != undefined) ast.body.splice(index, 1, replacementAst)
					return true
			  }
			: undefined) satisfies RunOn<types.namedTypes.Node, true | void>
	const functionWasReplacedResult = findAstJs(ast, functionMatchers(name), runOn)[0] as
		| true[]
		| undefined
	const functionWasReplaced =
		functionWasReplacedResult != undefined && functionWasReplacedResult.length > 0
	if (!functionWasReplaced) {
		const arrowFunctionWasReplacedResult = findAstJs(ast, arrowFunctionMatchers(name), runOn)[0] as
			| true[]
			| undefined
		const arrowFunctionWasReplaced =
			arrowFunctionWasReplacedResult != undefined && arrowFunctionWasReplacedResult.length > 0
		if (!functionWasReplaced && !arrowFunctionWasReplaced) ast.body.push(replacementAst)
	}
}

export const getWrappedExport = (
	options: unknown,
	params: (types.namedTypes.ArrowFunctionExpression | types.namedTypes.FunctionExpression)[],
	exportedName: string,
	wrapperName: string,
) => {
	const initHandleWrapperCall = builders.functionCall(wrapperName, options)
	const wrapperDeclarationAst = b.callExpression(
		b.memberExpression(initHandleWrapperCall.$ast, b.identifier("wrap")),
		params,
	)
	return b.exportNamedDeclaration(
		b.variableDeclaration("const", [
			b.variableDeclarator(b.identifier(exportedName), wrapperDeclarationAst),
		]),
	)
}
