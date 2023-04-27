import type { Node } from "estree"
import type { Result } from "@inlang/core/utilities"
import { walk, type SyncHandler } from "estree-walker"
import type { types } from "recast"

export class TransformAstAtMatchingError extends Error {
	readonly #id = "TransformAstAtMatchingException"
}

type SyncHandlerParams = Parameters<SyncHandler>

type TransformAstAtMatchingConditionParameter = {
	node?: types.namedTypes.Node | null
	parent?: types.namedTypes.Node | null
	key?: SyncHandlerParams[2]
	index?: SyncHandlerParams[3]
}

type TransformAstAtMatchingCondition = (
	parameter: TransformAstAtMatchingConditionParameter,
) => boolean

type TransformAstAtMatching = (
	sourceAst: types.namedTypes.Program,
	matchers: [TransformAstAtMatchingCondition, ...TransformAstAtMatchingCondition[]],
	insertionNodeRef: TransformAstAtMatchingCondition,
	manipulation: (parameter: TransformAstAtMatchingConditionParameter) => void,
) => Result<types.namedTypes.Program, TransformAstAtMatchingError>
// Insert element only if all ancestors match matchers
// find a nodes parent where the node matches and where all ancestors match
// Create a map for matchingNodes: Map<Node, matchedCount>
//
export const transformAstAtMatching = ((sourceAst, matchers, insertionNodeRef, manipulation) => {
	const matchCount = new Map<Node, number>()
	let match: Node | undefined
	const nodeInfoMap = new Map<
		Node,
		{
			parent: SyncHandlerParams[1]
			key: SyncHandlerParams[2]
			index: SyncHandlerParams[3]
			isInsertionNodeRef: boolean
		}
	>()
	// Find matching node, the corresponding parent and insertionPoint
	walk(sourceAst as Node, {
		enter(node, parent, key, index) {
			nodeInfoMap.set(node, {
				parent,
				key,
				index,
				isInsertionNodeRef: insertionNodeRef({ node, parent, key, index }),
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
			new Error(
				"Can't find path in ast matching the passed matchers",
			) as TransformAstAtMatchingError,
		]
	const matchPath: Node[] = []
	let currentNode: Node | null | undefined = match
	while (currentNode) {
		matchPath.splice(0, 0, currentNode)
		currentNode = nodeInfoMap.get(currentNode)?.parent
	}
	// matchpath needs to contain one node that isInsertionRefNode
	const insertionNode = matchPath.find((node) => nodeInfoMap.get(node)?.isInsertionNodeRef)
	if (!insertionNode)
		return [
			undefined,
			new Error("Can't find specified insertion point") as TransformAstAtMatchingError,
		]
	const insertionInfo = nodeInfoMap.get(insertionNode)
	manipulation({ node: insertionNode, ...insertionInfo })
	return [sourceAst, undefined]
}) satisfies TransformAstAtMatching
