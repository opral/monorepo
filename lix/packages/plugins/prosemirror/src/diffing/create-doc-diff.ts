/**
 * Represents the possible diff states for a node
 */
export type DiffState = "created" | "unmodified" | "updated" | "deleted";

/**
 * Interface for a node with diff information
 */
export interface DiffNode {
	type: string;
	content?: DiffNode[];
	attrs?: Record<string, any>;
	text?: string;
}

/**
 * Creates a merged AST from before and after documents
 * Each node gets a diff attribute indicating how it changed
 *
 * @param beforeDoc The document before changes
 * @param afterDoc The document after changes
 * @returns A merged AST with diff information
 */
export function createDocDiff(beforeDoc: any, afterDoc: any): DiffNode {
	// Convert ProseMirror nodes to plain objects if needed
	const beforeNode =
		beforeDoc && typeof beforeDoc.toJSON === "function"
			? beforeDoc.toJSON()
			: beforeDoc;
	const afterNode =
		afterDoc && typeof afterDoc.toJSON === "function"
			? afterDoc.toJSON()
			: afterDoc;

	// Create a map of all nodes in the before document by ID
	const beforeNodesById = new Map<string, any>();
	collectNodesById(beforeNode, beforeNodesById);

	// Create a map of all nodes in the after document by ID
	const afterNodesById = new Map<string, any>();
	collectNodesById(afterNode, afterNodesById);

	// Create the merged AST starting from the root
	return createMergedNode(
		beforeNode,
		afterNode,
		beforeNodesById,
		afterNodesById,
	);
}

/**
 * Recursively collects all nodes with IDs into a map
 */
function collectNodesById(node: any, nodesById: Map<string, any>): void {
	if (!node) return;

	// Add this node to the map if it has an ID
	if (node.attrs && node.attrs.id) {
		nodesById.set(node.attrs.id, node);
	}

	// Process child nodes
	if (node.content && Array.isArray(node.content)) {
		node.content.forEach((child: any) => collectNodesById(child, nodesById));
	}
}

/**
 * Creates a merged node by comparing before and after versions
 */
function createMergedNode(
	beforeNode: any | null,
	afterNode: any | null,
	beforeNodesById: Map<string, any>,
	afterNodesById: Map<string, any>,
): DiffNode {
	// Handle case where node exists in after but not before (created)
	if (!beforeNode && afterNode) {
		return convertToDiffNode(
			afterNode,
			"created",
			beforeNodesById,
			afterNodesById,
		);
	}

	// Handle case where node exists in before but not after (deleted)
	if (beforeNode && !afterNode) {
		return convertToDiffNode(
			beforeNode,
			"deleted",
			beforeNodesById,
			afterNodesById,
		);
	}

	// Both nodes exist, determine if they were modified
	const diffState = nodesAreEqual(beforeNode, afterNode)
		? "unmodified"
		: "updated";

	// Convert the after node (or before node if after is null) to a diff node
	return convertToDiffNode(
		afterNode || beforeNode,
		diffState,
		beforeNodesById,
		afterNodesById,
	);
}

/**
 * Converts a node to a DiffNode with the specified diff state
 */
function convertToDiffNode(
	node: any,
	diffState: DiffState,
	beforeNodesById: Map<string, any>,
	afterNodesById: Map<string, any>,
): DiffNode {
	if (!node) {
		throw new Error("Cannot convert null node to DiffNode");
	}

	const result: DiffNode = {
		type: node.type,
		attrs: { ...node.attrs, diff: diffState },
	};

	// Add text content if this is a text node
	if (node.text) {
		result.text = node.text;
	}

	// Process child nodes if any
	if (node.content && Array.isArray(node.content)) {
		result.content = [];

		// Track which child IDs have been processed
		const processedIds = new Set<string>();

		// For each child in the current node
		node.content.forEach((childNode: any) => {
			const childId = childNode.attrs?.id;

			// Skip nodes without IDs
			if (!childId) {
				const childDiffNode = convertToDiffNode(
					childNode,
					diffState, // Inherit parent's diff state if no ID
					beforeNodesById,
					afterNodesById,
				);
				result.content!.push(childDiffNode);
				return;
			}

			// Mark this ID as processed
			processedIds.add(childId);

			// Find corresponding nodes in before and after documents
			const beforeChild = beforeNodesById.get(childId);
			const afterChild = afterNodesById.get(childId);

			// Create a merged node for this child
			const mergedChild = createMergedNode(
				beforeChild,
				afterChild,
				beforeNodesById,
				afterNodesById,
			);
			result.content!.push(mergedChild);
		});

		// Add deleted nodes that exist in beforeDoc but not in afterDoc
		if (node.attrs?.id) {
			const beforeNode = beforeNodesById.get(node.attrs.id);

			if (beforeNode?.content) {
				// Find deleted children that exist in beforeNode but not in afterNode
				beforeNode.content.forEach((beforeChild: any) => {
					const childId = beforeChild.attrs?.id;
					if (childId && !processedIds.has(childId)) {
						// This child exists in before but not in after (or hasn't been processed), so it was deleted
						const deletedChild = createMergedNode(
							beforeChild,
							null,
							beforeNodesById,
							afterNodesById,
						);
						result.content!.push(deletedChild);
					}
				});
			}
		}
	}

	return result;
}

/**
 * Compares two nodes to determine if they are equal
 * This is a simplified comparison - in a real implementation,
 * you might want to do a more thorough comparison
 */
function nodesAreEqual(nodeA: any, nodeB: any): boolean {
	if (!nodeA || !nodeB) return false;

	// Compare node types
	if (nodeA.type !== nodeB.type) return false;

	// Compare text content
	if (nodeA.text !== nodeB.text) return false;

	// Compare attributes (excluding id)
	const attrsA = { ...nodeA.attrs };
	const attrsB = { ...nodeB.attrs };

	delete attrsA.id;
	delete attrsB.id;

	if (JSON.stringify(attrsA) !== JSON.stringify(attrsB)) return false;

	// For leaf nodes without content, we're done
	if (!nodeA.content && !nodeB.content) return true;

	// If one has content and the other doesn't, they're not equal
	if ((!nodeA.content && nodeB.content) || (nodeA.content && !nodeB.content))
		return false;

	// If content arrays have different lengths, they're not equal
	if (nodeA.content?.length !== nodeB.content?.length) return false;

	// We don't compare child nodes here - that's handled by the recursive structure
	// of createMergedNode

	return true;
}
