import { type Change, type LixPlugin, type LixReadonly } from "@lix-js/sdk";
import type { ProsemirrorNode } from "./detectChanges.js";

// Common top-level node types in ProseMirror
const TOP_LEVEL_NODE_TYPES = [
	"paragraph",
	"heading",
	"blockquote",
	"code_block",
	"bullet_list",
	"ordered_list",
	"horizontal_rule",
	"table",
	"image",
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
		content: [] as ProsemirrorNode[],
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
	for (const [, node] of nodeMap.entries()) {
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
	nodeMap: Map<string, ProsemirrorNode>,
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
