import type {
	Expression,
	Identifier,
	ImportDeclaration,
	ImportSpecifier,
	Node,
	Program,
} from "estree"
import type { Result } from "@inlang/core/utilities"
import { walk as jsWalk, type SyncHandler } from "estree-walker"
import { walk as svelteWalk } from "svelte/compiler"
import type { Ast } from "../../../../node_modules/svelte/types/compiler/interfaces.js"
import { types } from "recast"
import { parseModule } from "magicast"
import type MagicStringImport from "magic-string"
import type { ExpressionKind } from "ast-types/gen/kinds.js"

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
	// Leave tags that can not be wrapped at the beginning
	for (const child of parsed.html.children ?? []) {
		if (
			![
				"svelte:window",
				"svelte:document",
				"svelte:body",
				"svelte:head",
				"svelte:options",
			].includes(child.name)
		)
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

export const functionMatchers = (name: string): Parameters<typeof findAstJs>[1] => [
	({ node }) => n.FunctionDeclaration.check(node),
	({ node }) => n.Identifier.check(node) && node.name === name,
]

export const arrowFunctionMatchers = (name: string): Parameters<typeof findAstJs>[1] => [
	({ node }) => n.VariableDeclaration.check(node),
	({ node }) =>
		n.VariableDeclarator.check(node) && n.Identifier.check(node.id) && node.id.name === name,
	({ node }) => n.ArrowFunctionExpression.check(node),
]

export const variableDeclaratorMatchers = (name: string): Parameters<typeof findAstJs>[1] => [
	({ node }) => n.VariableDeclaration.check(node),
	({ node }) =>
		n.VariableDeclarator.check(node) && n.Identifier.check(node.id) && node.id.name === name,
]

export const findUsedImportsInAst = (
	ast: types.namedTypes.Node,
	availableImports: [string, string][] = [],
) => {
	if (availableImports.length === 0) return []
	else {
		const usedImportsLocal = (findAstJs(
			ast,
			[
				({ node }) =>
					n.Identifier.check(node) && availableImports.some(([, local]) => local === node.name),
			],
			(node) => {
				return n.Identifier.check(node) ? () => node.name : undefined
			},
		)[0] ?? []) as string[]
		return availableImports.filter(([, local]) => usedImportsLocal.includes(local))
	}
}

// TODO @benjaminpreiss
// if load is an (arrow) function, extend the parameters.
// The 2nd parameter needs to be all imported vars from @inlang/sdk-js that are USED within the function.
// 1. For that we pass a list of available vars into the function
// 2. We filter that list for the vars that we find in the load function
// 3. if that list is not empty, we create the 2nd parameter object
export const getFunctionOrDeclarationValue = (
	ast: types.namedTypes.Node,
	name: string,
	fallbackFunction: ExpressionKind = b.arrowFunctionExpression([], b.blockStatement([])),
) => {
	const variableDeclarationValueSearchResults = findAstJs(
		ast,
		variableDeclaratorMatchers(name),
		(node) =>
			n.VariableDeclarator.check(node) && node.init != undefined ? () => node.init : undefined,
	)[0]
	const functionDeclarationSearchResults = findAstJs(ast, functionMatchers(name), (node) =>
		n.FunctionDeclaration.check(node) ? () => node : undefined,
	)[0] as
		| [types.namedTypes.FunctionDeclaration, ...types.namedTypes.FunctionDeclaration[]]
		| undefined
	const variableDeclarationExpression =
		variableDeclarationValueSearchResults && variableDeclarationValueSearchResults.length > 0
			? (variableDeclarationValueSearchResults[0] as ExpressionKind)
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
	return variableDeclarationExpression ?? functionDeclaration ?? fallbackFunction
}

export const variableDeclarationAst = (importNames: [string, string][]) =>
	importNames.length > 0
		? b.variableDeclaration(
				"let",
				importNames.map(([, local]) => b.variableDeclarator(b.identifier(local))),
		  )
		: undefined

export const initImportedVariablesAst = (importNames: [string, string][]) =>
	importNames.length > 0
		? b.expressionStatement(
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
		: undefined

export const getRootReferenceIndexes = (ast: types.namedTypes.Node, names: [string, string][]) =>
	findAstJs(
		ast,
		[
			({ node }) =>
				n.Identifier.check(node) &&
				(names.some(([, local]) => local === node.name) || node.name === "data"),
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

// Returns true if all ancestors fulfill checks
// False if one ancestor breaks the chain
const typeCheckAncestors = (
	node: types.namedTypes.Node | Node | null | undefined,
	meta: NodeInfoMap<types.namedTypes.Node | Node | null>,
	...typeChecks: ((node: any) => boolean)[]
) => {
	let parent = node ? meta.get(node)?.parent : undefined
	for (const check of typeChecks) {
		if (!check(parent)) return false
		parent = parent ? meta.get(parent)?.parent : undefined
	}
	return true
}

// Returns true if node was declared in a certain type of ancestry
const isDeclaredIn = (
	node: types.namedTypes.Node | Node | null | undefined,
	meta: NodeInfoMap<types.namedTypes.Node | Node | null>,
	type: "ObjectPattern",
) => {
	const propertyCheck = (nd: any) =>
		(n.Property.check(nd) || n.ObjectProperty.check(nd)) && nd.value === node
	const objectPatternCheck = (node: any) => n.ObjectPattern.check(node)
	if (type === "ObjectPattern") {
		return typeCheckAncestors(node, meta, propertyCheck, objectPatternCheck)
	}
	return false
}

// Is this identifier already assigned to another identifier?
//
// E.g. you want to merge `const {key: alias} = ...` and `const {key: anotherAlias} = ...`, then we know that `key` is already assigned to `alias`
// 2. `const {key: alias, ...rest} = ...` and `const {key2} = ...` then `key2` is assigned to `rest`
// 3. `const blue = ...` and `const {key} = ...` then `key` is assigned to `blue`
// Returns the identifier to which the requested identifier is already assigned
// Value is already assigned to identifier
export class FindAliasError extends Error {
	readonly #id = "FindAliasException"
}

type Alias = types.namedTypes.Expression | Expression | types.namedTypes.Identifier | Identifier

// MANIPULATES the passed ast!
export const findAlias = (
	ast: types.namedTypes.Node | Node,
	identifier: string,
	deep = false,
	lastAlias?: Alias,
	ignore: (types.namedTypes.Node | Node)[] = [],
): Result<Alias, FindAliasError> => {
	let result = undefined as ReturnType<typeof findAlias> | undefined
	jsWalk(ast as Node, {
		enter(node: types.namedTypes.Node | Node) {
			if (result !== undefined || ignore.includes(node)) {
				this.skip()
			} else if (n.ObjectPattern.check(node)) {
				let rest
				for (const property of node.properties) {
					const found = findAlias(property, identifier)
					if (n.RestProperty.check(property)) rest = property.argument
					else if (found[0] !== undefined) {
						result = found
						ignore.push(node)
						this.skip()
					}
				}
				if (result === undefined && rest !== undefined) {
					result = [rest, undefined]
					ignore.push(node)
					this.skip()
				}
			} else if (
				(n.Property.check(node) || n.ObjectProperty.check(node)) &&
				((n.Identifier.check(node.key) && node.key.name === identifier) ||
					(n.Identifier.check(node.value) && node.value.name === identifier))
			) {
				result = [node.value, undefined]
				this.skip()
			} else if (n.FunctionDeclaration.check(node) && node.id != undefined) {
				const found = findAlias(node.id, identifier)
				if (found[0] !== undefined) {
					result = found
					ignore.push(node)
					this.skip()
				}
			} else if (n.VariableDeclaration.check(node)) {
				for (const declaration of node.declarations) {
					const found = findAlias(declaration, identifier)
					if (found[0] !== undefined) {
						result = found
						ignore.push(node)
						this.skip()
					}
				}
			} else if (n.VariableDeclarator.check(node)) {
				const found = findAlias(node.id, identifier)
				// `blue = green` & `green` -> `blue`
				if (
					n.Identifier.check(node.init) &&
					n.Identifier.check(node.id) &&
					node.init.name === identifier
				) {
					result = [node.id, undefined]
					ignore.push(node)
					this.skip()
				}
				// `blue = <anything else>` & `blue` -> `blue`
				else if (found[0] !== undefined) {
					result = found
					ignore.push(node)
					this.skip()
				}
			} else if (n.Identifier.check(node) && node.name === identifier) {
				result = [node, undefined]
				ignore.push(node)
				this.skip()
			}
		},
	})
	// Iterate through findAlias until no alias can be found
	if (result !== undefined) {
		if (result[0] !== undefined && deep) {
			if (lastAlias !== result[0] && n.Identifier.check(result[0])) {
				const nextAlias = findAlias(ast, result[0].name, true, result[0], ignore)
				if (nextAlias[0] !== undefined) return nextAlias
				else return result
			}
			return [
				undefined,
				new Error(
					"Deep searching for aliases for MemberExpressions is not supported yet.",
				) as FindAliasError,
			]
		}
		return result
	}
	return [
		undefined,
		new Error("Couldn't find alias or even the identifier itself") as FindAliasError,
	]
}

export class FindDefinitionError extends Error {
	readonly #id = "FindDefinitionException"
}

// Finds the original definition value of the searched for identifier
// If supplied, also makes sure that the definition is of a specific type
export const findDefinition = (
	ast: types.namedTypes.Node | Node,
	identifier: string,
	deep = false,
	ignore: (types.namedTypes.Node | Node)[] = [],
	type?: "function",
): Result<types.namedTypes.Node | Node, FindDefinitionError> => {
	// Iterates through ast, looks for declarations.
	let result = undefined as types.namedTypes.Node | Node | undefined
	jsWalk(ast as Node, {
		enter(node) {
			if (result !== undefined || ignore.includes(node)) this.skip()
			else if (
				n.VariableDeclarator.check(node) &&
				n.Identifier.check(node.id) &&
				node.id.name === identifier
			) {
				result = node.init ?? undefined
				ignore.push(node)
				this.skip()
			} else if (
				n.FunctionDeclaration.check(node) &&
				n.Identifier.check(node.id) &&
				node.id.name === identifier
			) {
				result = node
				ignore.push(node)
				this.skip()
			}
		},
	})
	if (result !== undefined) {
		if (deep) {
			if (n.Identifier.check(result)) return findDefinition(ast, result.name, true, ignore, type)
			return [result, undefined]
		}
		return [result, undefined]
	}
	return [undefined, new Error("Couldn't find definition") as FindDefinitionError]
}

export class IdentifierIsDeclarableError extends Error {
	readonly #id = "IdentifierIsDeclarableException"
}

export const identifierIsDeclarable = (
	ast: types.namedTypes.Node | Node,
	identifier: string,
): Result<boolean, IdentifierIsDeclarableError> => {
	try {
		const searchResults = (findAstJs(
			ast,
			[({ node }) => n.Identifier.check(node) && node.name === identifier],
			(node) =>
				n.Identifier.check(node)
					? (meta) => {
							// Is this name used as the value of an object pattern? If so, return false
							if (isDeclaredIn(node, meta, "ObjectPattern")) return false
							throw new Error("Cannot predict indentifier declarability for this ast.")
					  }
					: undefined,
		)[0] ?? [true]) as boolean[]
		return [searchResults.every((r) => r === true), undefined]
	} catch (error) {
		return [undefined, error as IdentifierIsDeclarableError]
	}
}

export class MergeNodesError extends Error {
	readonly #id = "MergeNodesException"
}

// This function merges 2 AST nodes, by merely adding the nodes missing in the first ast from the second ast.
// It does so by attaching all Nodes that can be found in the second node whose parent can be found in the first node.
// This relies heavily on the comparison function of two nodes

// RETURNS a map of declaration identifiers that were renamed ["old identifier" -> "new identifier"]
// Checks, whether an identifier is available for declaration. Only merges, if this is true
// {key: alias, ...rest} & {event} -> {key: alias, event, ...rest} with rest -> {...rest, event}
// or -> {key: alias, ...rest} with event -> rest.event
// {key: {key2: value2, ...rest2}, ...rest1} & {key: {event}}
type Renamings = {
	originalName: types.namedTypes.Identifier | Identifier
	newName: types.namedTypes.Expression | Expression | types.namedTypes.Identifier | Identifier
	scope?: types.namedTypes.Node | Node
}[]

// Merges nodes.
// If some things don't turn out to be as requested, try to rename stuff in the code (but only if a scope is provided). Otherwise return the stuff that has to be renamed
export const mergeNodes = (
	ast: types.namedTypes.Node | Node,
	node: types.namedTypes.Node | Node,
	renamingScope?: types.namedTypes.Node | Node,
): Result<Renamings, MergeNodesError> => {
	if (n.ObjectPattern.check(node)) {
		for (const property of node.properties) {
			return mergeNodes(ast, property, renamingScope)
		}
	} else if (n.Property.check(node)) {
		if (n.Identifier.check(node.value)) {
			if (n.Identifier.check(node.key)) {
				if (
					identifierIsDeclarable(ast, node.value.name)[0] === true ||
					node.key.name === node.value.name
				) {
					if (n.ObjectPattern.check(ast)) {
						const foundAlias = findAlias(ast, node.key.name)[0]
						if (n.Identifier.check(foundAlias) && foundAlias.name === node.key.name)
							return [[], undefined]
						if (foundAlias !== undefined) {
							return [
								[
									{
										originalName: b.identifier(node.value.name),
										newName: foundAlias,
										scope: renamingScope,
									},
								],
								undefined,
							]
						}
						ast.properties.push(node)
					} else if (n.Identifier.check(ast)) {
						return [
							[
								{
									originalName: b.identifier(node.value.name),
									newName: b.memberExpression(ast, node.key),
									scope: renamingScope,
								},
							],
							undefined,
						]
					} else {
						return [
							undefined,
							new Error("Cant merge Property into ast of different type") as MergeNodesError,
						]
					}
				} else {
					return [
						undefined,
						new Error("Some of the requested identifiers are already in use.") as MergeNodesError,
					]
				}
			} else {
				return [undefined, new Error("Unsupported type for key of Property.") as MergeNodesError]
			}
		} else {
			return [undefined, new Error("Unsupported type for value of Property") as MergeNodesError]
		}
	} else if (n.FunctionDeclaration.check(node)) {
		if (node.id != undefined) {
			if (n.Identifier.check(node.id)) {
				// Find the function definition in the ast
				const searchResult = findDefinition(ast, node.id.name, true)
				const def = searchResult[0]
				if (
					searchResult[1] instanceof Error &&
					searchResult[1].message === "Couldn't find definition"
				)
					return [undefined, new Error("Couldn't find a function to merge into") as MergeNodesError]
				else if (n.FunctionDeclaration.check(def) || n.ArrowFunctionExpression.check(def)) {
					const renamings: Renamings = []
					for (const [index, parameter] of node.params.entries()) {
						const targetParameter = def.params[index]
						if (targetParameter !== undefined) {
							const mergeResult = mergeNodes(targetParameter, parameter, def.body)
							if (mergeResult[0] !== undefined) renamings.push(...mergeResult[0])
							else
								return [
									undefined,
									new Error("Couldn't merge function parameters") as MergeNodesError,
								]
						} else def.params.push(parameter)
					}
					return [renamings, undefined]
				} else {
					return [
						undefined,
						new Error("Found variable declaration is not of type function") as MergeNodesError,
					]
				}
			} else {
				return [
					undefined,
					new Error(
						"Cannot merge function that is identified by something other than an Identifier",
					) as MergeNodesError,
				]
			}
		} else {
			return [undefined, new Error("Can't merge anonymous function into an ast") as MergeNodesError]
		}
	} else if (n.ExportNamedDeclaration.check(node) && node.declaration) {
		if (n.ExportNamedDeclaration.check(ast) && ast.declaration) {
			return mergeNodes(ast.declaration, node.declaration, renamingScope)
		} else if (n.Program.check(ast)) {
			/* const mergeResults: Renamings = []
			const errors: MergeNodesError[] = []
			for (const statement of ast.body) {
				// This line is bad
				const [namingsStatement, errorStatement] = mergeNodes(
					statement,
					node.declaration,
					renamingScope,
				)
				if (errorStatement instanceof Error) errors.push(errorStatement)
				else if (namingsStatement !== undefined) mergeResults.push(...namingsStatement)
			}
			if (errors.length === ast.body.length) {
				// There exists no function of this name. Push to body!
				if (
					errors.every((error) => error.message === "Couldn't find a function to merge into") ||
					errors[0] === undefined ||
					ast.body.length === 0
				) {
					ast.body.push(node)
				}
				// Merge fails for other reasons
				else return [undefined, errors[0]]
			} */
			const mergeResult = mergeNodes(ast, node.declaration)
			if (
				mergeResult[1] instanceof Error &&
				mergeResult[1].message === "Couldn't find a function to merge into"
			) {
				ast.body.push(node)
				return [[], undefined]
			}
			return mergeResult
		}
	}
	return [[], undefined]
}

// This function cannot error.
export const findDeclarableIdentifier = (ast: Node | types.namedTypes.Node, identifier: string) => {
	let newIdentifier: string | undefined
	jsWalk(ast as Node, {
		enter(node) {
			if (newIdentifier !== undefined) this.skip()
			else if (n.ImportDeclaration.check(node)) {
				for (const specifier of node.specifiers) {
					if (n.ImportSpecifier.check(specifier) && specifier.local.name === identifier) {
						newIdentifier = findDeclarableIdentifier(ast, `${identifier}_`)
						this.skip()
					}
				}
			} else if (n.Identifier.check(node) && node.name === identifier) {
				newIdentifier = findDeclarableIdentifier(ast, `${identifier}_`)
				this.skip()
			}
		},
	})
	return newIdentifier === undefined ? identifier : newIdentifier
}

export class ImportsAddError extends Error {
	readonly #id = "ImportsAddException"
}

export class ImportsGetAliasesError extends Error {
	readonly #id = "ImportsGetAliasesException"
}

export const imports = (target: Program | types.namedTypes.Program, source: string) => {
	const findReferences = (): [ImportDeclaration, ...ImportDeclaration[]] | undefined => {
		const references: ImportDeclaration[] = []
		jsWalk(target as Program, {
			enter(node) {
				if (
					n.ImportDeclaration.check(node) &&
					n.Literal.check(node.source) &&
					node.source.value === source
				) {
					references.push(node)
					this.skip()
				}
			},
		})
		return references.length === 0
			? undefined
			: (references as [ImportDeclaration, ...ImportDeclaration[]])
	}
	const base = {
		findReferences,
	}
	type AliasesMap = Map<string, types.namedTypes.Identifier | types.namedTypes.MemberExpression>
	return {
		...base,
		getAliases: function (
			...exportNames: string[]
		): typeof base &
			(
				| { aliases: AliasesMap; error?: never }
				| { aliases?: never; error: ImportsGetAliasesError }
			) {
			try {
				const matchingImports = this.findReferences()
				const aliases: AliasesMap = new Map()
				// There are no matching imports -> Return aliases: undefined
				if (matchingImports === undefined) return { ...this, aliases: aliases }
				// Construct map of aliases: exportN -> aliasN
				for (const { specifiers } of matchingImports) {
					for (const specifier of specifiers) {
						const newKey =
							specifier.type === "ImportDefaultSpecifier"
								? "default"
								: specifier.type === "ImportNamespaceSpecifier"
								? "*"
								: specifier.imported.name
						aliases.set(newKey, specifier.local)
					}
				}
				// Extend map of aliases with requested exportNames
				for (const exportN of exportNames) {
					if (!aliases.has(exportN)) {
						const namespaceAlias = aliases.get("*")
						if (n.Identifier.check(namespaceAlias))
							aliases.set(exportN, b.memberExpression(namespaceAlias, b.identifier(exportN)))
						else
							throw new ImportsGetAliasesError(
								`The alias for ${exportN} does not exist. Maybe call imports(...).add() first?`,
							)
					}
				}
				return { ...this, aliases }
			} catch (error) {
				return { ...this, error: error as ImportsGetAliasesError }
			}
		},
		add: function (
			exportN: string,
			aliasN?: string,
		): typeof base & { alias: types.namedTypes.Identifier | types.namedTypes.MemberExpression } {
			// The aliasN should be available. Find a declarable identifier.
			// This also goes through all import aliases to check for availability.
			const declarableIdentifier = findDeclarableIdentifier(target, aliasN ?? exportN)
			// Can the import be added?
			// Y -> Proceed
			const matchingImports = this.findReferences()
			if (
				// There has to be one line that does not include a namespace import
				matchingImports === undefined ||
				(matchingImports.some(({ specifiers }) =>
					specifiers.every(
						(specifier) =>
							n.ImportSpecifier.check(specifier) || n.ImportDefaultSpecifier.check(specifier),
					),
				) &&
					// exportN cannot be used already
					matchingImports.every(({ specifiers }) =>
						specifiers.every((specifier) =>
							specifier.type === "ImportSpecifier"
								? specifier.imported.name !== exportN
								: specifier.type === "ImportDefaultSpecifier"
								? exportN !== "default"
								: exportN !== "*",
						),
					))
			) {
				const localIdentifier =
					declarableIdentifier !== exportN ? b.identifier(declarableIdentifier) : undefined
				const newImportSpecifierAst =
					exportN === "*"
						? b.importNamespaceSpecifier(localIdentifier)
						: exportN === "default"
						? b.importDefaultSpecifier(localIdentifier)
						: b.importSpecifier(b.identifier(exportN), localIdentifier)
				// Should we add a new line?
				// Y -> Append new line
				// N -> Push specifier into existing import
				if (exportN === "*" || matchingImports === undefined) {
					const newImportDeclarationAst = b.importDeclaration(
						[newImportSpecifierAst],
						b.literal(source),
					)
					target.body.splice(0, 0, newImportDeclarationAst)
				} else {
					// Find the right line to add import
					const insertionPoint = matchingImports.find(({ specifiers }) =>
						specifiers.every(
							(specifier) =>
								n.ImportSpecifier.check(specifier) || n.ImportDefaultSpecifier.check(specifier),
						),
					)
					insertionPoint?.specifiers.push(newImportSpecifierAst as ImportSpecifier)
				}
			}
			// Return changed identifiers
			const newAliasN = this.getAliases(exportN).aliases?.get(exportN) as
				| types.namedTypes.Identifier
				| types.namedTypes.MemberExpression
			return { ...this, alias: newAliasN }
		},
		removeAll: function () {
			const matchingImports = this.findReferences()
			if (matchingImports !== undefined) {
				for (const declaration of matchingImports) {
					const indexToRemove = target.body.findIndex((statement) => statement === declaration)
					target.body.splice(indexToRemove, 1)
				}
			}
			return this
		},
	}
}
