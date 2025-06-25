import type { DetectedChange, LixPlugin } from "@lix-js/sdk";
import { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
import { parseMarkdown } from "./utilities/parseMarkdown.js";
import type { MdAstNode } from "./utilities/parseMarkdown.js";

export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = ({
	before,
	after,
}) => {
	const beforeMarkdown = new TextDecoder().decode(
		before?.data ?? new Uint8Array(),
	);
	const afterMarkdown = new TextDecoder().decode(
		after?.data ?? new Uint8Array(),
	);

	const beforeAst = parseMarkdown(beforeMarkdown);
	const afterAst = parseMarkdown(afterMarkdown);

	const detectedChanges: DetectedChange[] = [];

	// Create maps for fast lookup
	const beforeNodes = new Map<string, MdAstNode>();
	const afterNodes = new Map<string, MdAstNode>();
	const beforeOrder: string[] = [];
	const afterOrder: string[] = [];

	// Build node maps and order arrays (only for top-level nodes)
	for (const node of beforeAst.children) {
		beforeNodes.set(node.mdast_id, node);
		beforeOrder.push(node.mdast_id);
	}

	for (const node of afterAst.children) {
		afterNodes.set(node.mdast_id, node);
		afterOrder.push(node.mdast_id);
	}

	// Detect removed nodes
	for (const [id, beforeNode] of beforeNodes) {
		if (!afterNodes.has(id)) {
			detectedChanges.push({
				schema: MarkdownNodeSchemaV1,
				entity_id: id,
				snapshot_content: null,
			});
		}
	}

	// Detect added and modified nodes
	for (const [id, afterNode] of afterNodes) {
		const beforeNode = beforeNodes.get(id);

		if (!beforeNode) {
			// Node was added
			detectedChanges.push({
				schema: MarkdownNodeSchemaV1,
				entity_id: id,
				snapshot_content: afterNode,
			});
		} else if (JSON.stringify(beforeNode) !== JSON.stringify(afterNode)) {
			// Node was modified
			detectedChanges.push({
				schema: MarkdownNodeSchemaV1,
				entity_id: id,
				snapshot_content: afterNode,
			});
		}
	}

	// Check if order changed
	if (JSON.stringify(beforeOrder) !== JSON.stringify(afterOrder)) {
		detectedChanges.push({
			schema: MarkdownRootSchemaV1,
			entity_id: "root",
			snapshot_content: {
				order: afterOrder,
			},
		});
	}

	return detectedChanges;
};
