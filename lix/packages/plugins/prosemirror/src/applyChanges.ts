import { type Change, type LixPlugin, type LixReadonly } from "@lix-js/sdk";
import type { ProsemirrorNode } from "./detectChanges.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	// Parse the current document
	const currentDocument: ProsemirrorNode = file.data
		? JSON.parse(new TextDecoder().decode(file.data))
		: { type: "doc", content: [] };

	// Create a clone of the original document structure
	// This way we preserve the exact structure including nodes without IDs
	const newDocument = JSON.parse(JSON.stringify(currentDocument));

	// Map of all nodes with IDs - both existing and from changes
	const nodeMap = new Map<string, ProsemirrorNode>();

	// Set to track IDs that have been processed
	const processedIds = new Set<string>();

	// Map to track parent-child relationships
	const parentChildMap = new Map<string, string[]>();

	// First, collect all nodes with IDs and track parent-child relationships
	if (currentDocument.content) {
		collectNodesWithIds(currentDocument, nodeMap, parentChildMap);
	}

	// Keep track of which nodes are in the original document
	// and which are new nodes that need to be added
	for (const [id] of nodeMap.entries()) {
		processedIds.add(id);
	}

	// Then, apply all change snapshots on top of existing nodes
	for (const change of changes) {
		const entityId = change.entity_id;
		if (!entityId) continue;

		// Get the snapshot which contains the updated node
		const snapshot = await getChangeSnapshot(lix, change);

		if (snapshot) {
			// Create or update - add to the map
			nodeMap.set(entityId, snapshot as ProsemirrorNode);
		} else {
			// Delete - remove from the map
			nodeMap.delete(entityId);
		}
	}

	// Apply the changes to the document structure
	updateDocumentWithChanges(newDocument, nodeMap, processedIds);

	// Find any new top-level nodes that weren't in the original document
	// Since we can't add just any node to the top level (it might be a child node),
	// we need to be more selective about what we add

	// First, collect all potential "new nodes" that haven't been processed yet
	const notProcessed = new Map<string, ProsemirrorNode>();
	const topLevelNodes = new Map<string, ProsemirrorNode>();

	for (const [id, node] of nodeMap.entries()) {
		if (!processedIds.has(id)) {
			notProcessed.set(id, node);
		}
	}

	// Then, identify which of these nodes are truly top-level
	// This is a heuristic based on node type and checking if it appears as a child elsewhere
	for (const [id, node] of notProcessed.entries()) {
		// Only consider nodes that have appropriate types for the top level
		// and don't appear as children in our parent-child map
		let hasKnownParent = false;

		// Check if this node is a child of any other node
		for (const [, children] of parentChildMap.entries()) {
			if (children.includes(id)) {
				hasKnownParent = true;
				break;
			}
		}

		// If it's not a child of any other node and has an appropriate type,
		// it's likely a top-level node
		if (!hasKnownParent && isTopLevelNode(node)) {
			topLevelNodes.set(id, node);
		}
	}

	// Now add the identified top-level nodes to the document
	for (const [id, node] of topLevelNodes.entries()) {
		newDocument.content.push(JSON.parse(JSON.stringify(node)));
		processedIds.add(id);

		// Mark all children of this node as processed too
		markChildrenAsProcessed(node, processedIds);
	}

	// Convert the document back to a Uint8Array
	const encodedDocument = new TextEncoder().encode(JSON.stringify(newDocument));

	return { fileData: encodedDocument };
};

/**
 * Gets the snapshot content from a change
 */
async function getChangeSnapshot(lix: LixReadonly, change: Change) {
	const snapshot = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", change.snapshot_id)
		.select("content")
		.executeTakeFirst();

	return snapshot?.content;
}

/**
 * Recursively collects all nodes with IDs into a map and tracks parent-child relationships
 */
function collectNodesWithIds(
	node: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
	parentChildMap: Map<string, string[]>,
	parentId?: string,
) {
	const nodeId = node.attrs?.id;

	if (nodeId) {
		nodeMap.set(nodeId, node);

		// Record parent-child relationship if we have a parent
		if (parentId) {
			const children = parentChildMap.get(parentId) || [];
			children.push(nodeId);
			parentChildMap.set(parentId, children);
		}
	}

	if (node.content && Array.isArray(node.content)) {
		for (const childNode of node.content) {
			collectNodesWithIds(childNode, nodeMap, parentChildMap, nodeId);
		}
	}
}

/**
 * Recursively mark all children of a node as processed
 */
function markChildrenAsProcessed(
	node: ProsemirrorNode,
	processedIds: Set<string>,
) {
	if (!node.content || !Array.isArray(node.content)) {
		return;
	}

	for (const child of node.content) {
		const childId = child.attrs?.id;
		if (childId) {
			processedIds.add(childId);
		}

		// Recursively process child's children
		markChildrenAsProcessed(child, processedIds);
	}
}

/**
 * Determines if a node is likely a top-level node based on its type
 * In ProseMirror documents, usually only certain node types are valid at the top level
 */
function isTopLevelNode(node: ProsemirrorNode): boolean {
	// Common top-level node types
	// Specifically exclude list_item which shouldn't be at the top level
	const topLevelTypes = [
		"paragraph",
		"heading",
		"blockquote",
		"code_block",
		"bullet_list",
		"ordered_list",
		"horizontal_rule",
		"table",
		"image",
		"title",
		"description",
		"inputs",
		"tool",
	];

	return topLevelTypes.includes(node.type);
}

/**
 * Recursively updates a document or node using the nodeMap of changed nodes
 */
function updateDocumentWithChanges(
	doc: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
	processedIds: Set<string>,
) {
	// Base case: if no content to process, return
	if (!doc.content || !Array.isArray(doc.content)) {
		return;
	}

	// Process each item in content array
	for (let i = 0; i < doc.content.length; i++) {
		const node = doc.content[i];
		// Skip undefined nodes (shouldn't happen, but TypeScript safety check)
		if (!node) continue;

		const nodeId = node.attrs?.id;

		// If this node has an ID and there's an updated node in the map
		if (nodeId && nodeMap.has(nodeId)) {
			// Mark as processed
			processedIds.add(nodeId);

			// Get the updated version
			const updatedNode = nodeMap.get(nodeId);

			// If the node was deleted (snapshot is undefined)
			if (updatedNode === undefined) {
				// Remove it from the content array
				doc.content.splice(i, 1);
				i--; // Adjust index since we removed an item
				continue;
			}

			// Replace with updated node (preserve content if needed)
			const hadContent = node.content && Array.isArray(node.content);
			doc.content[i] = JSON.parse(JSON.stringify(updatedNode));

			// If the original node had content but the updated doesn't have its own content structure,
			// we'll continue updating the node's children recursively
			if (
				hadContent &&
				(!updatedNode.content || !Array.isArray(updatedNode.content))
			) {
				const currentNode = doc.content[i];
				if (currentNode && node.content) {
					currentNode.content = JSON.parse(JSON.stringify(node.content));
				}
			}
		}

		// Regardless of whether this node was updated, process its children
		const currentNode = doc.content[i];
		if (currentNode) {
			updateDocumentWithChanges(currentNode, nodeMap, processedIds);
		}
	}
}
