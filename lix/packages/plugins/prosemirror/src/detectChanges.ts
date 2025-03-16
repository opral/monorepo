import type { DetectedChange, LixPlugin } from "@lix-js/sdk";

export interface ProsemirrorNode {
	type: string;
	_id?: string;
	content?: ProsemirrorNode[];
	text?: string;
	[key: string]: any;
}

// Define a schema for ProsemirrorNode
const ProsemirrorNodeSchema = {
	key: "prosemirror_node_v1",
	type: "json" as const,
};

// @ts-expect-error - ignore the "excessively deep type instantiation" error
export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	const documentBefore: ProsemirrorNode = before
		? JSON.parse(new TextDecoder().decode(before?.data))
		: { type: "doc", content: [] };
	const documentAfter: ProsemirrorNode = JSON.parse(
		new TextDecoder().decode(after?.data),
	);

	const detectedChanges: DetectedChange[] = [];

	// Build a map of nodes in the before document for easy lookup
	const beforeNodeMap = new Map<string, ProsemirrorNode>();
	if (documentBefore.content) {
		collectNodesWithId(documentBefore, beforeNodeMap);
	}

	// Check for new or modified nodes in the after document
	if (documentAfter.content) {
		detectChangesInNodes(documentAfter, beforeNodeMap, detectedChanges);
	}

	// Check for deleted nodes
	if (documentBefore.content) {
		detectDeletedNodes(documentBefore, documentAfter, detectedChanges);
	}

	return detectedChanges;
};

/**
 * Recursively collects all nodes with IDs into a map
 */
function collectNodesWithId(
	node: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
) {
	if (node._id) {
		nodeMap.set(node._id, node);
	}

	if (node.content && Array.isArray(node.content)) {
		for (const childNode of node.content) {
			collectNodesWithId(childNode, nodeMap);
		}
	}
}

/**
 * Recursively detects created or updated nodes
 */
function detectChangesInNodes(
	node: ProsemirrorNode,
	beforeNodeMap: Map<string, ProsemirrorNode>,
	detectedChanges: DetectedChange[],
) {
	if (node._id) {
		const beforeNode = beforeNodeMap.get(node._id);

		if (!beforeNode) {
			// Node is new
			detectedChanges.push({
				entity_id: node._id,
				schema: ProsemirrorNodeSchema,
				snapshot: node,
			});
		} else if (JSON.stringify(beforeNode) !== JSON.stringify(node)) {
			// Node has been modified
			detectedChanges.push({
				entity_id: node._id,
				schema: ProsemirrorNodeSchema,
				snapshot: node,
			});
		}
	}

	if (node.content && Array.isArray(node.content)) {
		for (const childNode of node.content) {
			detectChangesInNodes(childNode, beforeNodeMap, detectedChanges);
		}
	}
}

/**
 * Detects deleted nodes by comparing before and after documents
 */
function detectDeletedNodes(
	documentBefore: ProsemirrorNode,
	documentAfter: ProsemirrorNode,
	detectedChanges: DetectedChange[],
) {
	// Build a map of nodes in the after document
	const afterNodeMap = new Map<string, ProsemirrorNode>();
	if (documentAfter.content) {
		collectNodesWithId(documentAfter, afterNodeMap);
	}

	// Check for nodes in before that are not in after
	const checkForDeletedNodes = (node: ProsemirrorNode) => {
		if (node._id && !afterNodeMap.has(node._id)) {
			detectedChanges.push({
				entity_id: node._id,
				schema: ProsemirrorNodeSchema,
				// For deletions, omit the snapshot
				snapshot: undefined,
			});
		}

		if (node.content && Array.isArray(node.content)) {
			for (const childNode of node.content) {
				checkForDeletedNodes(childNode);
			}
		}
	};

	checkForDeletedNodes(documentBefore);
}
