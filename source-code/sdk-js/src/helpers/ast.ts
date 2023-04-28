import type { Node, Program } from "estree"
import type { Result } from "@inlang/core/utilities"
import { walk as jsWalk, type SyncHandler } from "estree-walker"
import { walk as svelteWalk } from "svelte/compiler"
import type { types } from "recast"

export class FindAstError extends Error {
	readonly #id = "FindAstException"
}

type SyncHandlerParams = Parameters<SyncHandler>

type FindAstConditionParameter = {
	node?: types.namedTypes.Node | Node | null
	parent?: types.namedTypes.Node | Node | null
	key?: SyncHandlerParams[2]
	index?: SyncHandlerParams[3]
}

type FindAstCondition = (parameter: FindAstConditionParameter) => boolean

type FindAst = (
	walker: typeof jsWalk,
) => (
	sourceAst: types.namedTypes.Program | Program,
	matchers: [FindAstCondition, ...FindAstCondition[]],
	runOn: FindAstCondition,
	run: (parameter: FindAstConditionParameter) => any,
) => Result<any, FindAstError>
// Insert element only if all ancestors match matchers
// find a nodes parent where the node matches and where all ancestors match
// Create a map for matchingNodes: Map<Node, matchedCount>
//
const findAst = ((walker) => (sourceAst, matchers, runOn, run) => {
	const matchCount = new Map<Node, number>()
	let match: Node | undefined
	const nodeInfoMap = new Map<
		Node,
		{
			parent: SyncHandlerParams[1]
			key: SyncHandlerParams[2]
			index: SyncHandlerParams[3]
			runOnNode: boolean
		}
	>()
	// Find matching node, the corresponding parent and insertionPoint
	walker(sourceAst as Node, {
		enter(node, parent, key, index) {
			nodeInfoMap.set(node, {
				parent,
				key,
				index,
				runOnNode: runOn({ node, parent, key, index }),
			})
			const matchCountAncestor = !parent ? 0 : matchCount.get(parent) ?? 0
			if (matchCountAncestor < matchers.length) {
				const matcher = matchers[matchCountAncestor]
				const isMatching = matcher ? matcher({ node, parent, key, index }) : false
				if (isMatching) {
					matchCount.set(node, matchCountAncestor + 1)
					match = node
				}
			} else this.skip()
		},
	})
	if (!match)
		return [
			undefined,
			new Error("Can't find path in ast matching the passed matchers") as FindAstError,
		]
	const matchPath: Node[] = []
	let currentNode: Node | null | undefined = match
	while (currentNode) {
		matchPath.splice(0, 0, currentNode)
		currentNode = nodeInfoMap.get(currentNode)?.parent
	}
	// matchpath needs to contain one node that isInsertionRefNode
	const runOnNode = matchPath.find((node) => nodeInfoMap.get(node)?.runOnNode)
	if (!runOnNode)
		return [undefined, new Error("Can't find specified insertion point") as FindAstError]
	const runOnNodeMeta = nodeInfoMap.get(runOnNode)
	const runResult = run({ node: runOnNode, ...runOnNodeMeta })
	return [runResult, undefined]
}) satisfies FindAst

export const findAstJs = findAst(jsWalk)

export const findAstSvelte = findAst(svelteWalk)
