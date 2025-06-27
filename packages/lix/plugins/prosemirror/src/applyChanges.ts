import { type LixPlugin } from "@lix-js/sdk";
import type { ProsemirrorNode } from "./schemas/node.js";
import type { ProsemirrorDocument } from "./schemas/document.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
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

	// Track document order changes
	let documentOrderChange: ProsemirrorDocument | null = null;

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

		// Check if this is a document order change
		if (entityId === "document-root" && change.snapshot_content) {
			documentOrderChange = change.snapshot_content as ProsemirrorDocument;
			continue;
		}

		if (change.snapshot_content) {
			// Create or update - add to the map
			nodeMap.set(entityId, change.snapshot_content as ProsemirrorNode);
		} else {
			// Delete - remove from the map
			nodeMap.delete(entityId);
		}
	}

	// Apply the changes to the document structure
	updateDocumentWithChanges(newDocument, nodeMap, processedIds);

	// Handle document order changes - reorder top-level nodes according to children_order
	if (documentOrderChange && documentOrderChange.children_order) {
		applyDocumentOrder(newDocument, nodeMap, documentOrderChange.children_order, processedIds);
	} else {
		// If no explicit order change, add any new top-level nodes that weren't processed
		addNewTopLevelNodes(newDocument, nodeMap, processedIds, parentChildMap);
	}

	// Convert the document back to a Uint8Array
	const encodedDocument = new TextEncoder().encode(JSON.stringify(newDocument));

	return { fileData: encodedDocument };
};

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
		"horizontalRule",
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

			// IMPORTANT: When updating a node, we need to preserve the child structure
			// if the content hasn't changed
			const originalHasContent =
				node.content && Array.isArray(node.content) && node.content.length > 0;
			const updatedHasContent =
				updatedNode.content &&
				Array.isArray(updatedNode.content) &&
				updatedNode.content.length > 0;

			// Make a deep copy of the updated node
			doc.content[i] = JSON.parse(JSON.stringify(updatedNode));

			// If the original had content but the updated node doesn't specify content,
			// then preserve the original content structure
			if (originalHasContent && !updatedHasContent) {
				const currentNode = doc.content[i];
				if (currentNode && node.content) {
					currentNode.content = JSON.parse(JSON.stringify(node.content));
				}
			}
			// If both have content, process children recursively but preserve structure
			else if (originalHasContent && updatedHasContent) {
				// Continue updating the node's children recursively
				// but preserve the existing structure
				const currentNode = doc.content[i];
				if (currentNode) {
					updateDocumentWithChanges(currentNode, nodeMap, processedIds);
				}
			}
		}
		// For nodes without IDs or not in the nodeMap, just process their children
		else {
			// Process this node's children recursively
			if (
				node.content &&
				Array.isArray(node.content) &&
				node.content.length > 0
			) {
				updateDocumentWithChanges(node, nodeMap, processedIds);
			}
		}
	}
}

/**
 * Apply document order by reordering top-level nodes according to children_order
 */
function applyDocumentOrder(
	document: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
	childrenOrder: string[],
	processedIds: Set<string>,
) {
	if (!document.content) {
		document.content = [];
	}

	// Create a new content array ordered according to children_order
	const newContent: ProsemirrorNode[] = [];

	// Add nodes in the specified order
	for (const nodeId of childrenOrder) {
		// First check if the node exists in the current document content
		const existingNode = document.content.find(node => 
			(node.attrs?.id || node._id) === nodeId
		);

		if (existingNode) {
			newContent.push(existingNode);
			processedIds.add(nodeId);
		} else {
			// If not in current content, check if it's in the nodeMap (new node)
			const newNode = nodeMap.get(nodeId);
			if (newNode && isTopLevelNode(newNode)) {
				newContent.push(JSON.parse(JSON.stringify(newNode)));
				processedIds.add(nodeId);
				markChildrenAsProcessed(newNode, processedIds);
			}
		}
	}

	// Add any remaining nodes that weren't in the children_order but exist in current content
	for (const node of document.content) {
		const nodeId = node.attrs?.id || node._id;
		if (nodeId && !processedIds.has(nodeId)) {
			newContent.push(node);
			processedIds.add(nodeId);
		} else if (!nodeId) {
			// Nodes without IDs (like plain text) should be preserved
			newContent.push(node);
		}
	}

	// Replace the document content with the reordered content
	document.content = newContent;
}

/**
 * Add new top-level nodes that weren't processed yet (fallback when no explicit order)
 */
function addNewTopLevelNodes(
	document: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
	processedIds: Set<string>,
	parentChildMap: Map<string, string[]>,
) {
	// Find any new top-level nodes that weren't in the original document
	const notProcessed = new Map<string, ProsemirrorNode>();
	const topLevelNodes = new Map<string, ProsemirrorNode>();

	for (const [id, node] of nodeMap.entries()) {
		if (!processedIds.has(id)) {
			notProcessed.set(id, node);
		}
	}

	// Then, identify which of these nodes are truly top-level
	for (const [id, node] of notProcessed.entries()) {
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
		if (!document.content) {
			document.content = [];
		}
		document.content.push(JSON.parse(JSON.stringify(node)));
		processedIds.add(id);

		// Mark all children of this node as processed too
		markChildrenAsProcessed(node, processedIds);
	}
}
