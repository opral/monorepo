/**
 * Block-based change detection
 *
 * This plugin treats markdown at the block level:
 * - Only top-level mdast nodes (paragraph, heading, list, table, etc.) are persisted as entities.
 * - The root entity stores the top-level order (array of block ids).
 * - Nested nodes (listItem, tableRow/cell, inline text, etc.) are not persisted as standalone entities.
 *
 * Detect may assign ephemeral `data.id` to nested nodes to help reconciliation, but emitted changes
 * remain block-level (add/mod/del per top-level node + root order change).
 */
import type {
	DetectedChange,
	LixFile,
	StateRow,
	LixSchemaDefinition,
} from "@lix-js/sdk";
import { parseMarkdown, AstSchemas, serializeAst } from "@opral/markdown-wc";
import type { Ast } from "@opral/markdown-wc";
import { makeDiff, cleanupSemantic } from "@sanity/diff-match-patch";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
// Use markdown-wc exported Ast type; avoid mdast dependency

export const detectChanges = ({
	beforeState = [],
	before,
	after,
}: {
	beforeState?: StateRow[];
	before?: Omit<LixFile, "data"> & { data?: Uint8Array };
	after: Omit<LixFile, "data"> & { data: Uint8Array };
}): DetectedChange[] => {
	const afterMarkdown = new TextDecoder().decode(
		after?.data ?? new Uint8Array(),
	);

	const afterAst = parseMarkdown(afterMarkdown) as Ast;
	const detectedChanges: DetectedChange[] = [];

	// Build before index from state: entity_id -> node snapshot (top-level blocks)
	const beforeNodes = new Map<string, any>();
	for (const row of beforeState) {
		if (
			typeof row.schema_key === "string" &&
			row.schema_key.startsWith("markdown_wc_ast_") &&
			row.schema_key !== AstSchemas.RootSchema["x-lix-key"]
		) {
			if (row.snapshot_content) {
				beforeNodes.set(row.entity_id, row.snapshot_content as any);
			}
		}
	}

	// Try to derive previous order from a root order state entry (optional)
	let beforeOrder: string[] = [];
	const maybeRoot = beforeState
		.filter((r) => r.schema_key === MarkdownRootSchemaV1["x-lix-key"])
		.sort((a, b) => (a.created_at! < b.created_at! ? 1 : -1))[0];
	if (
		maybeRoot?.snapshot_content &&
		Array.isArray((maybeRoot as any).snapshot_content.order)
	) {
		beforeOrder = (maybeRoot as any).snapshot_content.order as string[];
	}

	// Fingerprint helper (ignore data/position)
	const omitMeta = (n: any): any => {
		if (!n || typeof n !== "object") return n;
		const { data, position, ...rest } = n as any;
		if (Array.isArray((rest as any).children)) {
			(rest as any).children = (rest as any).children.map(omitMeta);
		}
		return rest;
	};
	const fingerprint = (n: any): string => JSON.stringify(omitMeta(n));
	const hash = (s: string): string => {
		let h = 5381;
		for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
		return (h >>> 0).toString(36);
	};

	// Overlay: serialize before/after blocks and diff to help remap ids on edits/moves
	const buildComposite = (
		nodes: { id: string; node: any }[],
	): {
		markdown: string;
		spans: { id: string; type: string; start: number; end: number }[];
	} => {
		let offset = 0;
		const parts: string[] = [];
		const spans: { id: string; type: string; start: number; end: number }[] =
			[];
		for (let i = 0; i < nodes.length; i++) {
			const { id, node } = nodes[i]!;
			const root = { type: "root", children: [omitMeta(node)] } as any;
			const block = serializeAst(root);
			const start = offset;
			const end = start + block.length;
			parts.push(block);
			spans.push({ id, type: node.type, start, end });
			offset = end;
			// Separate blocks with a blank line to mimic Markdown spacing
			if (i < nodes.length - 1) {
				parts.push("\n\n");
				offset += 2;
			}
		}
		return { markdown: parts.join(""), spans };
	};

	// Before composite from state (ordered by beforeOrder if available)
	const beforeBlocksOrdered: { id: string; node: any }[] = [];
	const fallbackBeforeIds = Array.from(beforeNodes.keys());
	const orderedIds = beforeOrder.length ? beforeOrder : fallbackBeforeIds;
	for (const id of orderedIds) {
		const n = beforeNodes.get(id);
		if (n) beforeBlocksOrdered.push({ id, node: n });
	}
	const beforeComposite = buildComposite(beforeBlocksOrdered);

	// After composite from parsed AST
	const afterBlocks: { id: string; node: any }[] = (
		afterAst.children as any[]
	).map((n: any, i: number) => ({ id: `after_${i}`, node: n }));
	const afterComposite = buildComposite(afterBlocks);

	// String-similarity assignment (type-scoped) as a robust block matcher
	const beforeInfos = beforeBlocksOrdered.map(({ id, node }, idx) => ({
		id,
		type: node.type,
		idx,
		text: serializeAst({ type: "root", children: [omitMeta(node)] } as any),
	}));
	const afterInfos = (afterAst.children as any[]).map(
		(node: any, idx: number) => ({
			idx,
			node,
			type: node.type,
			text: serializeAst({ type: "root", children: [omitMeta(node)] } as any),
		}),
	);

	const used = new Set<string>();
	const afterOrder: string[] = [];
	const afterNodesById = new Map<string, any>();
	const sim = (a: string, b: string): number => {
		if (a === b) return 1;
		const diffs = cleanupSemantic(makeDiff(a, b));
		let del = 0,
			ins = 0,
			same = 0;
		for (const [op, text] of diffs) {
			const len = text.length;
			if (op === 0) same += len;
			else if (op === -1) del += len;
			else if (op === 1) ins += len;
		}
		const denom = same + del + ins;
		return denom === 0 ? 1 : same / denom;
	};

	for (const a of afterInfos) {
		let best: { id: string; score: number } | null = null;
		const candidates = beforeInfos.filter(
			(b) => b.type === a.type && !used.has(b.id),
		);
		for (const b of candidates) {
			if (b.type !== a.type) continue;
			if (used.has(b.id)) continue;
			const s = sim(b.text, a.text);
			const posBoost = 1 - Math.min(1, Math.abs(a.idx - b.idx)); // 1 when same index, 0 when 1+ apart
			const score = 0.8 * s + 0.2 * posBoost;
			if (!best || score > best.score) best = { id: b.id, score };
		}
		let id: string | undefined;
		if (candidates.length === 1) {
			// Only one viable candidate of same type; accept if similarity is reasonable
			const b = candidates[0]!;
			const s = sim(b.text, a.text);
			const posBoost = 1 - Math.min(1, Math.abs(a.idx - b.idx));
			const score = 0.8 * s + 0.2 * posBoost;
			id = score >= 0.4 ? b.id : undefined;
		} else {
			id = best && best.score >= 0.6 ? best.id : undefined;
		}
		if (!id) id = `mdwc_${hash(fingerprint(a.node))}`;
		a.node.data = { ...(a.node.data ?? {}), id };
		afterNodesById.set(id, a.node);
		afterOrder.push(id);
		if (id && beforeNodes.has(id)) used.add(id);
	}

	// Deletions
	for (const [id, node] of beforeNodes) {
		if (!afterNodesById.has(id)) {
			const schema = AstSchemas.schemasByType[
				(node as any).type
			] as unknown as LixSchemaDefinition;
			if (schema) {
				detectedChanges.push({
					schema,
					entity_id: id,
					snapshot_content: undefined,
				});
			}
		}
	}

	// Adds/Mods
	for (const [id, afterNode] of afterNodesById) {
		const beforeNode = beforeNodes.get(id);
		const schema = AstSchemas.schemasByType[
			(afterNode as any).type
		] as unknown as LixSchemaDefinition;
		if (!schema) continue;
		if (!beforeNode || fingerprint(beforeNode) !== fingerprint(afterNode)) {
			detectedChanges.push({
				schema,
				entity_id: id,
				snapshot_content: afterNode,
			});
		}
	}

	// Order change
	if (JSON.stringify(beforeOrder) !== JSON.stringify(afterOrder)) {
		detectedChanges.push({
			schema: MarkdownRootSchemaV1,
			entity_id: "root",
			snapshot_content: { order: afterOrder },
		});
	}

	return detectedChanges;
};
