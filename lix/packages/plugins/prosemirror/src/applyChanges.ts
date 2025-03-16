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
	
	// Map for existing nodes by ID for quick lookup
	const nodeMap = new Map<string, ProsemirrorNode>();
	const contentOrder: string[] = [];
	
	// Build a map of existing nodes and track the content order
	if (currentDocument.content) {
		collectNodesAndOrder(currentDocument, nodeMap, contentOrder);
	}
	
	// Apply the changes
	for (const change of changes) {
		const entityId = change.entity_id;
		// We'll determine if it's a create/update or delete based on presence of snapshot in DB
		const snapshot = await getChangeSnapshot(lix, change);
		
		if (snapshot) {
			// This is a create or update operation
			const node = snapshot as ProsemirrorNode;
			if (node._id) {
				nodeMap.set(node._id, node);
				
				// Add to content order if it's a not already in the order
				if (!contentOrder.includes(node._id)) {
					contentOrder.push(node._id);
				}
			}
		} else {
			// This is a delete operation
			if (entityId) {
				// Remove from the map and content order
				nodeMap.delete(entityId);
				const index = contentOrder.indexOf(entityId);
				if (index !== -1) {
					contentOrder.splice(index, 1);
				}
			}
		}
	}
	
	// Rebuild the document
	const updatedDocument: ProsemirrorNode = {
		type: "doc",
		content: contentOrder
			.map(id => nodeMap.get(id))
			.filter(node => node !== undefined) as ProsemirrorNode[]
	};
	
	// Convert the document back to a Uint8Array
	const encodedDocument = new TextEncoder().encode(JSON.stringify(updatedDocument));
	
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
 * Recursively collects all nodes with IDs and tracks the content order
 */
function collectNodesAndOrder(
	node: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>,
	contentOrder: string[]
) {
	if (node.type === "doc" && node.content && Array.isArray(node.content)) {
		// For the root doc node, process its direct children
		for (const childNode of node.content) {
			if (childNode._id) {
				nodeMap.set(childNode._id, childNode);
				contentOrder.push(childNode._id);
			}
			
			// Still collect any deeper nodes in the map
			if (childNode.content && Array.isArray(childNode.content)) {
				for (const deeperNode of childNode.content) {
					collectDeepNodes(deeperNode, nodeMap);
				}
			}
		}
	} else if (node._id) {
		// For non-doc nodes with IDs, add them to the map
		nodeMap.set(node._id, node);
		
		// Process deeper nodes
		if (node.content && Array.isArray(node.content)) {
			for (const childNode of node.content) {
				collectDeepNodes(childNode, nodeMap);
			}
		}
	}
}

/**
 * Helper function to collect deeper nodes into the map (but not the order)
 */
function collectDeepNodes(
	node: ProsemirrorNode,
	nodeMap: Map<string, ProsemirrorNode>
) {
	if (node._id) {
		nodeMap.set(node._id, node);
	}
	
	if (node.content && Array.isArray(node.content)) {
		for (const childNode of node.content) {
			collectDeepNodes(childNode, nodeMap);
		}
	}
}
