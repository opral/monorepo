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
			beforeNode,
		);
	}

	// Handle case where node exists in before but not after (deleted)
	if (beforeNode && !afterNode) {
		return convertToDiffNode(
			beforeNode,
			"deleted",
			beforeNodesById,
			afterNodesById,
			beforeNode,
		);
	}

	// For nodes with IDs, we need to do a deep comparison of their content
	// to determine if they've been modified
	if (
		beforeNode?.attrs?.id &&
		afterNode?.attrs?.id &&
		beforeNode.attrs.id === afterNode.attrs.id
	) {
		// Check if the content has changed
		const hasContentChanged = contentHasChanged(beforeNode, afterNode);
		const diffState = hasContentChanged ? "updated" : "unmodified";

		return convertToDiffNode(
			afterNode,
			diffState,
			beforeNodesById,
			afterNodesById,
			beforeNode,
		);
	}

	// For other nodes, determine if they were modified using direct comparison
	const diffState = nodesAreEqual(beforeNode, afterNode)
		? "unmodified"
		: "updated";

	// Convert the after node (or before node if after is null) to a diff node
	return convertToDiffNode(
		afterNode || beforeNode,
		diffState,
		beforeNodesById,
		afterNodesById,
		beforeNode,
	);
}

/**
 * Checks if the content of two nodes has changed, including text content of children
 */
function contentHasChanged(beforeNode: any, afterNode: any): boolean {
	if (!beforeNode || !afterNode) return true;

	// Different types means content has changed
	if (beforeNode.type !== afterNode.type) return true;

	// For text nodes, compare text content
	if (beforeNode.text !== afterNode.text) return true;

	// If one has content and the other doesn't, content has changed
	if (
		(!beforeNode.content && afterNode.content) ||
		(beforeNode.content && !afterNode.content)
	)
		return true;

	// If content arrays have different lengths, content has changed
	if (beforeNode.content?.length !== afterNode.content?.length) return true;

	// Compare each child recursively
	if (beforeNode.content && afterNode.content) {
		for (let i = 0; i < beforeNode.content.length; i++) {
			if (contentHasChanged(beforeNode.content[i], afterNode.content[i])) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Converts a node to a DiffNode with the specified diff state
 */
function convertToDiffNode(
	node: any,
	diffState: DiffState,
	beforeNodesById: Map<string, any>,
	afterNodesById: Map<string, any>,
	beforeNode?: any, // Optional before node for text comparison
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

		// Special handling for text nodes - compare text content directly
		if (
			diffState !== "created" &&
			diffState !== "deleted" &&
			beforeNode &&
			beforeNode.text !== node.text
		) {
			// Ensure attrs exists before accessing it
			result.attrs = result.attrs || {};
			result.attrs.diff = "updated";
		}
	}

	// Process child nodes if any
	if (node.content && Array.isArray(node.content)) {
		result.content = [];
		let hasUpdatedChildren = false;

		// Track which child IDs have been processed
		const processedIds = new Set<string>();

		// For each child in the current node
		node.content.forEach((childNode: any, index: number) => {
			const childId = childNode.attrs?.id;

			// For text nodes or nodes without IDs, we need to compare by position
			if (!childId) {
				// Find corresponding child in the before node by index
				const beforeChild = beforeNode?.content?.[index];

				// Determine diff state based on content comparison and parent state
				let childDiffState = diffState;

				// For created or deleted parent nodes, children inherit the state
				if (diffState === "created" || diffState === "deleted") {
					childDiffState = diffState;
				}
				// Otherwise, determine state based on content comparison
				else if (
					beforeChild &&
					childNode.type === "text" &&
					beforeChild.text !== childNode.text
				) {
					childDiffState = "updated";
					hasUpdatedChildren = true;
				}

				const childDiffNode = convertToDiffNode(
					childNode,
					childDiffState,
					beforeNodesById,
					afterNodesById,
					beforeChild,
				);

				// Only count as updated if we're not already created or deleted
				if (
					diffState !== "created" &&
					diffState !== "deleted" &&
					(childDiffNode.attrs?.diff === "updated" ||
						childDiffNode.attrs?.diff === "created" ||
						childDiffNode.attrs?.diff === "deleted")
				) {
					hasUpdatedChildren = true;
				}

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

			// Only count as updated if we're not already created or deleted
			if (
				diffState !== "created" &&
				diffState !== "deleted" &&
				(mergedChild.attrs?.diff === "updated" ||
					mergedChild.attrs?.diff === "created" ||
					mergedChild.attrs?.diff === "deleted")
			) {
				hasUpdatedChildren = true;
			}

			result.content!.push(mergedChild);
		});

		// Add deleted nodes that exist in beforeDoc but not in afterDoc
		if (node.attrs?.id && diffState !== "created" && diffState !== "deleted") {
			const beforeNodeWithId = beforeNodesById.get(node.attrs.id);

			if (beforeNodeWithId?.content) {
				// Find deleted children that exist in beforeNode but not in afterNode
				beforeNodeWithId.content.forEach((beforeChild: any) => {
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
						hasUpdatedChildren = true;
					}
				});
			}
		}

		// If any children were updated, created, or deleted, mark this node as updated
		// But only if it's not already marked as created or deleted
		if (
			hasUpdatedChildren &&
			result.attrs &&
			diffState !== "created" &&
			diffState !== "deleted"
		) {
			result.attrs.diff = "updated";
		}
	}

	return result;
}

/**
 * Compares two nodes to determine if they are equal
 */
function nodesAreEqual(nodeA: any, nodeB: any): boolean {
	if (!nodeA || !nodeB) return false;

	// Check if types are the same
	if (nodeA.type !== nodeB.type) return false;

	// Check if text content is the same (for text nodes)
	if (nodeA.text !== nodeB.text) return false;

	// Check if attributes are the same (excluding the id attribute)
	if (nodeA.attrs || nodeB.attrs) {
		const attrsA = { ...nodeA.attrs };
		const attrsB = { ...nodeB.attrs };

		// Remove id attribute from comparison
		delete attrsA.id;
		delete attrsB.id;

		// Compare remaining attributes
		for (const key in attrsA) {
			if (attrsA[key] !== attrsB[key]) return false;
		}

		for (const key in attrsB) {
			if (attrsB[key] !== attrsA[key]) return false;
		}
	}

	// Check if content arrays have the same length
	const contentA = nodeA.content || [];
	const contentB = nodeB.content || [];
	if (contentA.length !== contentB.length) return false;

	// For nodes with IDs, we don't need to check their content
	// as they will be compared separately
	// For nodes without IDs, we need to check their content recursively
	if (!nodeA.attrs?.id) {
		// Check each child recursively
		for (let i = 0; i < contentA.length; i++) {
			if (!nodesAreEqual(contentA[i], contentB[i])) return false;
		}
	}

	return true;
}
