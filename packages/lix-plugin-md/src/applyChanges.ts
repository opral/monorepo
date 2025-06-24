import { type LixPlugin } from "@lix-js/sdk";
import { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
import { serializeMarkdown } from "./utilities/serializeMarkdown.js";
import type { MdAst, MdAstNode } from "./utilities/parseMarkdown.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	file,
	changes,
}) => {
	// Extract order from root change (use the most recent one)
	const rootChanges = changes.filter(c => c.schema_key === MarkdownRootSchemaV1["x-lix-key"]);
	const orderChange = rootChanges.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
	const order = orderChange?.snapshot_content?.order || [];

	// Build new AST from changes
	const ast: MdAst = {
		type: "root",
		children: []
	};

	// Process each node in the specified order
	for (const nodeId of order) {
		// Find the most recent change for this node
		const nodeChanges = changes.filter(c => 
			c.entity_id === nodeId && 
			c.schema_key === MarkdownNodeSchemaV1["x-lix-key"]
		);
		const change = nodeChanges.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

		if (change?.snapshot_content) {
			// Add the node content
			ast.children.push(change.snapshot_content as MdAstNode);
		}
	}

	// Handle case where no order change exists - use all node changes in their original order
	if (order.length === 0) {
		const nodeChanges = changes.filter(c => c.schema_key === MarkdownNodeSchemaV1["x-lix-key"]);
		
		// Group changes by entity_id and take the most recent for each
		const nodesByEntity = new Map<string, typeof nodeChanges[0]>();
		for (const change of nodeChanges) {
			const existing = nodesByEntity.get(change.entity_id);
			if (!existing || change.created_at > existing.created_at) {
				nodesByEntity.set(change.entity_id, change);
			}
		}
		
		// Sort by creation time to maintain some order
		const latestChanges = Array.from(nodesByEntity.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
		
		for (const change of latestChanges) {
			if (change.snapshot_content) {
				ast.children.push(change.snapshot_content as MdAstNode);
			}
		}
	}

	// Serialize to markdown
	const skipIdComments = file.metadata?.skip_id_comments === true;
	const markdown = serializeMarkdown(ast, { skip_id_comments: skipIdComments });

	return {
		fileData: new TextEncoder().encode(markdown),
	};
};
