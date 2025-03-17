import { type Change, type LixPlugin, type LixReadonly } from "@lix-js/sdk";
import type { ProsemirrorNode } from "./detectChanges.js";

// Common top-level node types in ProseMirror
const TOP_LEVEL_NODE_TYPES = [
	'paragraph', 
	'heading', 
	'blockquote', 
	'code_block', 
	'bullet_list',
	'ordered_list', 
	'horizontal_rule', 
	'table',
	'image'
];

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	// Parse the current document
	const currentDocument: ProsemirrorNode = file.data
		? JSON.parse(new TextDecoder().decode(file.data))
		: { type: "doc", content: [] };
	
	// Create a fresh document to rebuild from scratch
	// This approach prevents accidental inclusion of database records
	// Explicitly defining content as an array to avoid undefined errors
	const newDocument = {
		type: "doc",
		content: [] as ProsemirrorNode[]
	};
	
	// Map of all nodes with IDs - both existing and from changes
	const nodeMap = new Map<string, ProsemirrorNode>();
	
	// First, collect all nodes from the current document
	if (currentDocument.content) {
		collectNodesMap(currentDocument, nodeMap);
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
	
	// Now rebuild the document structure from the original document
	if (currentDocument.content && Array.isArray(currentDocument.content)) {
		// For top-level nodes, maintain the same order as in the original
		for (const node of currentDocument.content) {
			if (node && node._id && nodeMap.has(node._id)) {
				// Use the updated node from the map
				newDocument.content.push(nodeMap.get(node._id)!);
				// Remove from map to track what we've already added
				nodeMap.delete(node._id);
			}
		}
	}
	
	// Add any remaining nodes (new nodes) at the top level
	// These are nodes that didn't exist in the original document
	for (const [id, node] of nodeMap.entries()) {
		if (node && TOP_LEVEL_NODE_TYPES.includes(node.type)) {
			newDocument.content.push(node);
		}
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
 * Recursively collects all nodes with IDs into a map
 */
function collectNodesMap(
	node: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>
) {
	if (node._id) {
		nodeMap.set(node._id, node);
	}
	
	if (node.content && Array.isArray(node.content)) {
		for (const childNode of node.content) {
			collectNodesMap(childNode, nodeMap);
		}
	}
}

/**
 * Updates a node in the document by ID
 */
function updateNodeInDocument(
	document: ProsemirrorNode,
	nodeId: string,
	newNodeData: ProsemirrorNode
): boolean {
	// For the top-level document
	if (document.content && Array.isArray(document.content)) {
		// Check direct children first
		for (let i = 0; i < document.content.length; i++) {
			const node = document.content[i];
			// Skip if node is undefined
			if (!node) continue;
			
			if (node._id === nodeId) {
				// Found the node - update it
				document.content[i] = newNodeData;
				return true;
			}
			
			// Try to update in child nodes
			if (node.content && Array.isArray(node.content)) {
				if (updateNodeInDocument(node, nodeId, newNodeData)) {
					return true;
				}
			}
		}
	}
	
	return false;
}

/**
 * Removes a node from the document by ID
 */
function removeNodeFromDocument(
	document: ProsemirrorNode,
	nodeId: string
): boolean {
	if (document.content && Array.isArray(document.content)) {
		// Check direct children first
		for (let i = 0; i < document.content.length; i++) {
			const node = document.content[i];
			// Skip if node is undefined
			if (!node) continue;
			
			if (node._id === nodeId) {
				// Found the node - remove it
				document.content.splice(i, 1);
				return true;
			}
			
			// Try to remove from child nodes
			if (node.content && Array.isArray(node.content)) {
				if (removeNodeFromDocument(node, nodeId)) {
					return true;
				}
			}
		}
	}
	
	return false;
}

/**
 * Inserts a new node into the document
 * For new nodes, we need to determine where to insert them.
 * The strategy here is:
 * 1. If it's a top-level node (like paragraph, heading, etc.), append to the doc's content
 * 2. If it's a child node, try to find its parent and insert it there
 */
function insertNodeIntoDocument(
	document: ProsemirrorNode,
	node: ProsemirrorNode
): boolean {
	// Handle top-level nodes (directly under the document)
	if (isTopLevelNode(node.type)) {
		document.content = document.content || [];
		document.content.push(node);
		return true;
	}
	
	// For other nodes, try to find the parent based on node type or relationships
	return findParentAndInsert(document, node);
}

/**
 * Determines if a node type is typically a top-level node
 */
function isTopLevelNode(nodeType: string): boolean {
	// Common top-level node types in ProseMirror
	const topLevelTypes = [
		'paragraph', 
		'heading', 
		'blockquote', 
		'code_block', 
		'bullet_list',
		'ordered_list', 
		'horizontal_rule', 
		'table',
		'image'
	];
	
	return topLevelTypes.includes(nodeType);
}

/**
 * Tries to find a parent for a node and insert it in the appropriate place
 */
function findParentAndInsert(
	document: ProsemirrorNode,
	node: ProsemirrorNode
): boolean {
	// Handle common child node types based on their typical parent types
	// This is a simplification and might need to be adapted to the specific schema
	if (node.type === 'list_item') {
		// Find a bullet_list or ordered_list to insert this into
		return findParentByType(document, ['bullet_list', 'ordered_list'], node);
	} else if (node.type === 'table_row') {
		// Find a table to insert this into
		return findParentByType(document, ['table'], node);
	} else if (node.type === 'table_cell') {
		// Find a table_row to insert this into
		return findParentByType(document, ['table_row'], node);
	}
	
	// If we can't determine the parent type, add as top level as a fallback
	document.content = document.content || [];
	document.content.push(node);
	return true;
}

/**
 * Finds a parent node by type and inserts the child into it
 */
function findParentByType(
	document: ProsemirrorNode,
	parentTypes: string[],
	node: ProsemirrorNode
): boolean {
	if (document.content && Array.isArray(document.content)) {
		// Look for matching parent types
		for (const child of document.content) {
			if (parentTypes.includes(child.type)) {
				// Found a suitable parent, insert the node
				child.content = child.content || [];
				child.content.push(node);
				return true;
			}
			
			// Try recursively in child nodes
			if (child.content && Array.isArray(child.content)) {
				if (findParentByType(child, parentTypes, node)) {
					return true;
				}
			}
		}
	}
	
	return false;
}
