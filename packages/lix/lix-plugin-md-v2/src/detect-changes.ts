import type { DetectedChange, LixFile, StateRow } from "@lix-js/sdk";
import { parseMarkdown, AstSchemas } from "@opral/markdown-wc";
import type { Ast } from "@opral/markdown-wc";
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

	// Build before index from state: entity_id -> node snapshot
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

	// Build before lookup by type+fp
	const beforeByTypeFp = new Map<string, { id: string; node: any }[]>();
	for (const [id, node] of beforeNodes) {
		const key = `${(node as any).type}::${fingerprint(node)}`;
		const arr = beforeByTypeFp.get(key) ?? [];
		arr.push({ id, node });
		beforeByTypeFp.set(key, arr);
	}

	// Assign data.id to after nodes by matching fingerprints; mint new ids when unmatched
	const used = new Set<string>();
	const afterOrder: string[] = [];
	const afterNodesById = new Map<string, any>();
	for (const child of afterAst.children as any[]) {
		// Only consider block-level nodes at root
		const n: any = child as any;
		const key = `${n.type}::${fingerprint(n)}`;
		let id: string | undefined;
		const candidates = beforeByTypeFp.get(key) ?? [];
		for (const c of candidates) {
			if (!used.has(c.id)) {
				id = c.id;
				used.add(id);
				break;
			}
		}
		if (!id) id = `mdwc_${hash(key)}`;
		n.data = { ...(n.data ?? {}), id };
		afterNodesById.set(id, n);
		afterOrder.push(id);
	}

	// Deletions
	for (const [id, node] of beforeNodes) {
		if (!afterNodesById.has(id)) {
			const schema = AstSchemas.schemasByType[(node as any).type];
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
		const schema = AstSchemas.schemasByType[(afterNode as any).type];
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
