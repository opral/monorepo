import type {
	DetectedChange,
	LixPlugin,
	LixSchemaDefinition,
} from "@lix-js/sdk";

export interface ProsemirrorNode {
	type: string;
	_id?: string;
	content?: ProsemirrorNode[];
	text?: string;
	attrs?: Record<string, any>;
	marks?: Array<{
		type: string;
		attrs?: Record<string, any>;
	}>;
	[key: string]: any;
}

// Define a schema for ProsemirrorNode
const ProsemirrorNodeSchema: LixSchemaDefinition = {
	"x-lix-key": "prosemirror_node_v1",
	"x-lix-version": "1.0",
	type: "object",
};

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = ({
	before,
	after,
}) => {
	// Early return for identical files
	if (before && after && before.data === after.data) {
		return [];
	}

	const documentBefore: ProsemirrorNode = before
		? JSON.parse(new TextDecoder().decode(before?.data))
		: { type: "doc", content: [] };
	const documentAfter: ProsemirrorNode = JSON.parse(
		new TextDecoder().decode(after?.data),
	);

	const detectedChanges: DetectedChange<ProsemirrorNode>[] = [];

	// Build a map of nodes in the before document for easy lookup
	const beforeNodeMap = new Map<string, ProsemirrorNode>();
	if (documentBefore.content) {
		collectNodesWithId(documentBefore, beforeNodeMap);
	}

	// Build a map of nodes in the after document for lookup
	const afterNodeMap = new Map<string, ProsemirrorNode>();
	if (documentAfter.content) {
		collectNodesWithId(documentAfter, afterNodeMap);
	}

	// Find added or modified nodes (in after but not in before, or in both but modified)
	for (const [id, afterNode] of afterNodeMap.entries()) {
		const beforeNode = beforeNodeMap.get(id);

		if (!beforeNode) {
			// Node is new

			// Check if the parent node is also new in this diff.
			// If so, skip adding the child separately, as it's part of the parent's snapshot.
			const parentNode = findParentNode(documentAfter, id);
			const parentId = parentNode?.attrs?.id || parentNode?._id;
			if (parentId && !beforeNodeMap.has(parentId)) {
				continue; // Skip adding child node if parent is also new
			}

			detectedChanges.push({
				entity_id: id,
				schema: ProsemirrorNodeSchema,
				snapshot_content: afterNode,
			});
		} else {
			// Check if the node itself has changed (ignoring child content)
			const nodeItselfChanged = !areNodesEqual(beforeNode, afterNode, true);

			// Check if this node's content has changed
			const contentChanged = !areContentArraysEqual(
				beforeNode.content,
				afterNode.content,
			);

			// For leaf nodes (nodes with no children with IDs), we want to detect content changes
			// For parent nodes (nodes with children that have IDs), we only want to detect changes to the node itself

			// Determine if this is a leaf node in terms of ID hierarchy
			const isLeafNode = !hasChildrenWithIds(afterNode);

			if (nodeItselfChanged || (isLeafNode && contentChanged)) {
				// Node has been modified
				detectedChanges.push({
					entity_id: id,
					schema: ProsemirrorNodeSchema,
					snapshot_content: afterNode,
				});
			}
		}
	}

	// Find deleted nodes (in before but not in after)
	for (const [id] of beforeNodeMap.entries()) {
		if (!afterNodeMap.has(id)) {
			detectedChanges.push({
				entity_id: id,
				schema: ProsemirrorNodeSchema,
				// For deletions, omit the snapshot
				snapshot_content: null,
			});
		}
	}

	return detectedChanges;
};

/**
 * Recursively collects all nodes with IDs into a map
 * IDs can be either in node.attrs.id (preferred) or node._id (legacy)
 */
function collectNodesWithId(
	node: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
) {
	// Check for ID in node.attrs.id (preferred location)
	if (node.attrs && node.attrs.id) {
		nodeMap.set(node.attrs.id, node);
	}
	// Also check for legacy _id directly on the node
	else if (node._id) {
		nodeMap.set(node._id, node);
	}

	if (node.content && Array.isArray(node.content)) {
		for (const childNode of node.content) {
			collectNodesWithId(childNode, nodeMap);
		}
	}
}

/**
 * Checks if two nodes are equal by comparing their structure and content
 * @param ignoreChildContent When true, only compares node attributes and type, ignoring content changes
 */
function areNodesEqual(
	node1: ProsemirrorNode,
	node2: ProsemirrorNode,
	ignoreChildContent = false,
): boolean {
	// If types differ, they're not equal
	if (node1.type !== node2.type) {
		return false;
	}

	// Compare text content (only if not ignoring content)
	if (!ignoreChildContent && node1.text !== node2.text) {
		return false;
	}

	// Compare attributes
	if (!areAttributesEqual(node1.attrs, node2.attrs)) {
		return false;
	}

	// Compare marks (only if not ignoring content)
	if (!ignoreChildContent && !areMarksEqual(node1.marks, node2.marks)) {
		return false;
	}

	// If we're ignoring child content, we consider the nodes equal at this point
	if (ignoreChildContent) {
		return true;
	}

	// Deep compare content arrays (with special handling for text nodes)
	if (!areContentArraysEqual(node1.content, node2.content)) {
		return false;
	}

	// If we've made it here, the nodes are equal
	return true;
}

/**
 * Compares attributes
 */
function areAttributesEqual(
	attrs1?: Record<string, any>,
	attrs2?: Record<string, any>,
): boolean {
	if (!attrs1 && !attrs2) {
		return true;
	}

	if (!attrs1 || !attrs2) {
		return false;
	}

	// Use JSON.stringify for deep comparison of the entire attributes object
	// This is more reliable than comparing individual keys
	return JSON.stringify(attrs1) === JSON.stringify(attrs2);
}

/**
 * Compares marks arrays
 */
function areMarksEqual(marks1?: Array<any>, marks2?: Array<any>): boolean {
	if (!marks1 && !marks2) {
		return true;
	}

	if (!marks1 || !marks2) {
		return false;
	}

	if (marks1.length !== marks2.length) {
		return false;
	}

	// For a more robust comparison, we sort marks by type first
	const sortedMarks1 = [...marks1].sort((a, b) => a.type.localeCompare(b.type));
	const sortedMarks2 = [...marks2].sort((a, b) => a.type.localeCompare(b.type));

	// Compare each mark's type and attributes
	for (let i = 0; i < sortedMarks1.length; i++) {
		const mark1 = sortedMarks1[i];
		const mark2 = sortedMarks2[i];

		if (mark1.type !== mark2.type) {
			return false;
		}

		if (!areAttributesEqual(mark1.attrs, mark2.attrs)) {
			return false;
		}
	}

	return true;
}

/**
 * Compares content arrays more deeply
 */
function areContentArraysEqual(
	content1?: ProsemirrorNode[],
	content2?: ProsemirrorNode[],
): boolean {
	if (!content1 && !content2) {
		return true;
	}

	if (!content1 || !content2) {
		return false;
	}

	if (content1.length !== content2.length) {
		return false;
	}

	// More thorough content comparison - check structure and do deep comparison
	for (let i = 0; i < content1.length; i++) {
		const node1 = content1[i];
		const node2 = content2[i];

		// Skip undefined nodes (should not happen but TypeScript doesn't know that)
		if (!node1 || !node2) {
			return false;
		}

		// For text nodes, compare the text directly
		if (node1.type === "text" && node2.type === "text") {
			if (node1.text !== node2.text) {
				return false;
			}
			// Also compare marks on text nodes
			if (!areMarksEqual(node1.marks, node2.marks)) {
				return false;
			}
			continue;
		}

		// If types differ, they're not equal
		if (node1.type !== node2.type) {
			return false;
		}

		// For nodes with IDs, if IDs don't match, they're different
		if (node1._id && node2._id && node1._id !== node2._id) {
			return false;
		}

		// Compare attributes
		if (!areAttributesEqual(node1.attrs, node2.attrs)) {
			return false;
		}

		// Recursively compare content
		if (!areContentArraysEqual(node1.content, node2.content)) {
			return false;
		}
	}

	return true;
}

/**
 * Checks if a node has any children with IDs
 */
function hasChildrenWithIds(node: ProsemirrorNode): boolean {
	if (!node.content || !Array.isArray(node.content)) {
		return false;
	}

	for (const child of node.content) {
		if ((child.attrs && child.attrs.id) || child._id) {
			return true;
		}

		// Recursively check children
		if (hasChildrenWithIds(child)) {
			return true;
		}
	}

	return false;
}

/**
 * Finds the parent node of a node with a specific ID within a Prosemirror document tree.
 */
function findParentNode(
	currentNode: ProsemirrorNode,
	targetId: string,
	parent: ProsemirrorNode | null = null,
): ProsemirrorNode | null {
	const currentId = currentNode.attrs?.id || currentNode._id;
	if (currentId === targetId) {
		return parent;
	}

	if (currentNode.content && Array.isArray(currentNode.content)) {
		for (const childNode of currentNode.content) {
			const foundParent = findParentNode(childNode, targetId, currentNode);
			if (foundParent) {
				return foundParent;
			}
		}
	}

	return null;
}
