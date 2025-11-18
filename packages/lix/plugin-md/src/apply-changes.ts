import { type LixPlugin } from "@lix-js/sdk";
import { serializeAst, AstSchemas } from "@opral/markdown-wc";
import type { Ast, MarkdownNode } from "@opral/markdown-wc";
import { syncNodeIds } from "./sync-node-ids.js";
import { createNodeIdPrefix } from "./node-id-prefix.js";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	changes,
	file,
}) => {
	// Extract order from root change (use the most recent one)
	const rootChanges = changes.filter(
		(c) => c.schema_key === AstSchemas.DocumentSchema["x-lix-key"],
	);
	const orderChange = rootChanges.sort((a, b) =>
		b.created_at.localeCompare(a.created_at),
	)[0];
	const order: string[] = orderChange?.snapshot_content?.order || [];

	// Build new AST from latest node snapshots
	const ast: Ast = { type: "root", children: [] } as any;
	const seenIds = new Set<string>();
	const reservedIds = new Set<string>();
	const idPrefix = createNodeIdPrefix(file?.id);
	let nestedIdCounter = 0;
	const mintNestedId = (): string => {
		let id: string;
		do {
			id = `${idPrefix}_${(++nestedIdCounter).toString(36)}`;
		} while (seenIds.has(id) || reservedIds.has(id));
		seenIds.add(id);
		return id;
	};

	// Group latest snapshot per entity_id across any markdown-wc node schema
	const latestById = new Map<string, (typeof changes)[number]>();
	for (const ch of changes) {
		if (
			ch.schema_key &&
			typeof ch.schema_key === "string" &&
			ch.schema_key.startsWith("markdown_wc_") &&
			ch.schema_key !== AstSchemas.DocumentSchema["x-lix-key"]
		) {
			const prev = latestById.get(ch.entity_id);
			if (!prev || ch.created_at > prev.created_at)
				latestById.set(ch.entity_id, ch);
		}
	}

	const collectReservedIds = (node: MarkdownNode | undefined) => {
		if (!node || typeof node !== "object") {
			return;
		}
		const nodeId = node.data?.id;
		if (typeof nodeId === "string" && nodeId.length > 0) {
			reservedIds.add(nodeId);
		}
		const children = Array.isArray(node.children) ? node.children : [];
		for (const child of children) {
			collectReservedIds(child as MarkdownNode);
		}
	};
	for (const change of latestById.values()) {
		if (change?.snapshot_content) {
			collectReservedIds(change.snapshot_content as MarkdownNode);
		}
	}

	// If no explicit order, fall back to created_at ordering
	const effectiveOrder = order.length
		? order
		: Array.from(latestById.values())
				.sort((a, b) => a.created_at.localeCompare(b.created_at))
				.map((c) => c.entity_id);

	for (const id of effectiveOrder) {
		const change = latestById.get(id);
		if (change?.snapshot_content) {
			const node = change.snapshot_content as any;
			node.data = { ...node.data, id };
			syncNodeIds({
				before: undefined,
				after: node as MarkdownNode,
				seenIds,
				mintId: mintNestedId,
				reservedIds,
			});
			(ast.children as any[]).push(node);
		}
	}

	// Serialize to markdown (markdown-wc ignores unknown node.data fields)
	const markdown = serializeAst(ast);
	return { fileData: new TextEncoder().encode(markdown) };
};
