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

export const detectChanges = (args: {
	beforeState?: StateRow[];
	before?: Omit<LixFile, "data"> & { data?: Uint8Array };
	after: Omit<LixFile, "data"> & { data: Uint8Array };
}): DetectedChange[] => {
	const { beforeState = [], after } = args;
	const THRESHOLDS = {
		simStrong: 0.6,
		headingSim: 0.3,
		idxSame: 0.3,
		scoreGood: 0.5,
		marginWin: 0.1,
		smallEditLen: 12,
		tieStrongMargin: 0.15,
	} as const;
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
			row.schema_key !== AstSchemas.RootSchema["x-lix-key"] &&
			row.schema_key !== AstSchemas.RootOrderSchema["x-lix-key"]
		) {
			if (row.snapshot_content) {
				beforeNodes.set(row.entity_id, row.snapshot_content as any);
			}
		}
	}

	// Try to derive previous order from a root order state entry (optional)
	let beforeOrder: string[] = [];
	const maybeRoot = beforeState
		.filter((r) => r.schema_key === AstSchemas.RootOrderSchema["x-lix-key"])
		.sort((a, b) => (a.created_at! < b.created_at! ? 1 : -1))[0];
	if (
		maybeRoot?.snapshot_content &&
		Array.isArray((maybeRoot as any).snapshot_content.order)
	) {
		beforeOrder = (maybeRoot as any).snapshot_content.order as string[];
	}

	// Fingerprint helper: drop meta and stable-stringify with normalized strings
	const omitMeta = (n: any): any => {
		if (!n || typeof n !== "object") return n;
		const obj: any = { ...(n as any) };
		if ("data" in obj) delete obj.data;
		if ("position" in obj) delete obj.position;
		if (Array.isArray(obj.children)) {
			obj.children = (obj.children as any[]).map(omitMeta);
		}
		return obj;
	};
	const stableStringify = (value: any): string => {
		const seen = new WeakSet();
		const enc = (v: any): any => {
			if (v === null || typeof v !== "object") {
				return typeof v === "string" ? norm(v) : v;
			}
			if (seen.has(v)) return null;
			seen.add(v);
			if (Array.isArray(v)) return v.map(enc);
			const obj: Record<string, any> = {};
			const keys = Object.keys(v).sort();
			for (const k of keys) obj[k] = enc((v as any)[k]);
			return obj;
		};
		return JSON.stringify(enc(omitMeta(value)));
	};
	const fingerprint = (n: any): string => stableStringify(n);
	const toNFC = (s: string) =>
		typeof (s as any).normalize === "function"
			? (s as any).normalize("NFC")
			: s;
	const norm = (s: string) =>
		toNFC(String(s)).replace(/\r\n?|\u2028|\u2029/g, "\n");
	// Note: previously had a string hasher here for experiments; removed as unused.

	const extractText = (node: any): string => {
		if (!node || typeof node !== "object") return "";
		if (typeof (node as any).value === "string")
			return String((node as any).value ?? "");
		let out = "";
		const children = (node.children ?? []) as any[];
		for (const ch of children) out += extractText(ch);
		return out;
	};
	const normEOL = (s: string) => norm(s);
	const stripTrailingNewlines = (s: string) => s.replace(/\n+$/g, "");
	const blockKey = (node: any): string => {
		const type = String(node?.type || "");
		switch (type) {
			case "paragraph":
				return stripTrailingNewlines(normEOL(extractText(node))).trim();
			case "heading":
				return (
					`${(node as any).depth ?? ""}|` +
					stripTrailingNewlines(normEOL(extractText(node)))
						.trim()
						.toLowerCase()
				);
			case "code":
				return (
					`${(node as any).lang ?? ""}|` +
					stripTrailingNewlines(normEOL(String((node as any).value ?? "")))
				);
			case "blockquote":
				return stripTrailingNewlines(normEOL(extractText(node))).trim();
			case "list": {
				const arr = (node.children ?? []) as any[];
				return arr.map((li: any) => normEOL(extractText(li)).trim()).join("\n");
			}
			case "table": {
				const rows = (node.children ?? []) as any[];
				return rows
					.map((row: any) =>
						((row.children ?? []) as any[])
							.map((cell: any) => normEOL(extractText(cell)).trim())
							.join("|"),
					)
					.join("\n");
			}
			default: {
				const s = serializeAst({
					type: "root",
					children: [omitMeta(node)],
				} as any);
				return stripTrailingNewlines(normEOL(s)).trim();
			}
		}
	};

	// Before composite from state (ordered by beforeOrder if available)
	const beforeBlocksOrdered: { id: string; node: any }[] = [];
	const fallbackBeforeIds = Array.from(beforeNodes.keys());
	const orderedIds = beforeOrder.length ? beforeOrder : fallbackBeforeIds;
	for (const id of orderedIds) {
		const n = beforeNodes.get(id);
		if (n) beforeBlocksOrdered.push({ id, node: n });
	}

	// Build (type,key) maps for a Stage 0 unique mapping
	type TK = string; // `${type}#${key}`
	const tk = (type: string, key: string): TK => `${type}#${key}`;

	const beforeByTK = new Map<TK, string[]>();
	const afterByTK = new Map<TK, number[]>();

	const beforeInfos = beforeBlocksOrdered.map(({ id, node }, idx) => {
		const key = blockKey(node);
		const type = node.type;
		const k = tk(type, key);
		const list = beforeByTK.get(k) ?? [];
		list.push(id);
		beforeByTK.set(k, list);
		return {
			id,
			type,
			idx,
			key,
			text: norm(
				serializeAst({ type: "root", children: [omitMeta(node)] } as any),
			),
			node,
		};
	});
	const afterInfos = (afterAst.children as any[]).map(
		(node: any, idx: number) => {
			const key = blockKey(node);
			const type = node.type;
			const k = tk(type, key);
			const list = afterByTK.get(k) ?? [];
			list.push(idx);
			afterByTK.set(k, list);
			return {
				idx,
				node,
				type,
				key,
				text: norm(
					serializeAst({ type: "root", children: [omitMeta(node)] } as any),
				),
			};
		},
	);

	const used = new Set<string>();
	const afterOrder: string[] = new Array(afterInfos.length).fill("");
	const afterNodesById = new Map<string, any>();
	const seenIds = new Set<string>(Array.from(beforeNodes.keys()));
	let idCounter = 0;
	const mintNewId = (): string => {
		let id: string;
		do {
			id = `mdwc_${(++idCounter).toString(36)}`;
		} while (seenIds.has(id));
		seenIds.add(id);
		return id;
	};

	// Stage 0: unique (type,key) present exactly once in before and after
	for (const [k, ids] of beforeByTK) {
		if (ids.length !== 1) continue;
		const afterIdxs = afterByTK.get(k);
		if (!afterIdxs || afterIdxs.length !== 1) continue;
		const id = ids[0]!;
		const idx = afterIdxs[0]!;
		const a = afterInfos[idx]!;
		a.node.data = { ...(a.node.data ?? {}), id };
		afterNodesById.set(id, a.node);
		afterOrder[idx] = id;
		used.add(id);
		seenIds.add(id);
	}
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

	// Build exact canonicalized text pools from remaining before nodes
	const exactPoolsByType = new Map<string, Map<string, string[]>>();
	for (const b of beforeInfos) {
		if (used.has(b.id)) continue;
		const text = stripTrailingNewlines(normEOL(b.text));
		let pool = exactPoolsByType.get(b.type);
		if (!pool) {
			pool = new Map();
			exactPoolsByType.set(b.type, pool);
		}
		const list = pool.get(text) ?? [];
		list.push(b.id);
		pool.set(text, list);
	}

	for (const a of afterInfos) {
		// Skip already assigned by Stage 0
		const alreadyId = (a.node.data as any)?.id;
		if (alreadyId) continue;

		// Stage 1: exact canonicalized text match
		let idFromExact: string | undefined;
		const text = stripTrailingNewlines(normEOL(a.text));
		const pool = exactPoolsByType.get(a.type);
		if (pool) {
			const list = pool.get(text);
			while (list && list.length) {
				const candidateId = list.shift()!;
				if (!used.has(candidateId)) {
					idFromExact = candidateId;
					break;
				}
			}
			if (list && list.length === 0) pool.delete(text);
		}
		if (idFromExact) {
			const id = idFromExact;
			a.node.data = { ...(a.node.data ?? {}), id };
			afterNodesById.set(id, a.node);
			afterOrder[a.idx] = id;
			used.add(id);
			seenIds.add(id);
			continue;
		}

		const candidates = beforeInfos.filter(
			(b) => b.type === a.type && !used.has(b.id),
		);
		const metrics = candidates.map((b) => {
			const s = sim(b.text, a.text);
			const idxDiff = Math.abs(a.idx - b.idx);
			const posBoost = 1 - Math.min(1, idxDiff);
			const score = 0.6 * s + 0.4 * posBoost;
			return { b, s, posBoost, score, idxDiff };
		});
		let chosen: (typeof metrics)[number] | undefined;
		let margin = 0;
		if (metrics.length === 1) {
			chosen = metrics[0];
		} else if (metrics.length > 1) {
			// Prefer highest similarity; break ties by posBoost then smaller idxDiff
			metrics.sort((m1, m2) => {
				if (m2.s !== m1.s) return m2.s - m1.s;
				if (m2.posBoost !== m1.posBoost) return m2.posBoost - m1.posBoost;
				return m1.idxDiff - m2.idxDiff;
			});
			// If top similarity clearly better, pick it; else fall back to best score
			const top = metrics[0]!;
			const second = metrics[1]!;
			margin = second ? top.s - second.s : Infinity;
			if (!second || margin >= THRESHOLDS.tieStrongMargin) {
				chosen = top;
			} else {
				metrics.sort((m1, m2) => m2.score - m1.score);
				chosen = metrics[0];
			}
		}
		let id: string | undefined;
		if (chosen) {
			// Type-specific relaxed acceptance: for paragraphs, accept small additive edits (substring relation)
			let smallEditOK = false;
			if (a.type === "paragraph") {
				const aTxt = extractText(omitMeta(a.node)).trim();
				const bTxt = extractText(omitMeta(chosen.b.node)).trim();
				const isSub =
					aTxt.length > 0 &&
					bTxt.length > 0 &&
					(aTxt.includes(bTxt) || bTxt.includes(aTxt));
				const lenDiff = Math.abs(aTxt.length - bTxt.length);
				smallEditOK = isSub && lenDiff <= THRESHOLDS.smallEditLen;
			}
			// Acceptance: strong textual similarity OR same index with modest similarity OR good combined score
			// Additionally, if chosen clearly wins by similarity, accept with a slightly lower threshold
			if (
				smallEditOK ||
				chosen.s >= THRESHOLDS.simStrong ||
				(a.type === "heading" && chosen.s >= THRESHOLDS.headingSim) ||
				(chosen.idxDiff === 0 && chosen.s >= THRESHOLDS.idxSame) ||
				chosen.score >= THRESHOLDS.scoreGood ||
				(margin >= THRESHOLDS.marginWin && chosen.s >= 0.4)
			) {
				id = chosen.b.id;
			}
		}
		if (!id) id = mintNewId();
		a.node.data = { ...(a.node.data ?? {}), id };
		afterNodesById.set(id, a.node);
		afterOrder[a.idx] = id;
		if (id && beforeNodes.has(id)) used.add(id);
		seenIds.add(id);
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
					snapshot_content: null,
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
			schema: AstSchemas.RootOrderSchema as unknown as LixSchemaDefinition,
			entity_id: "root",
			snapshot_content: { order: afterOrder },
		});
	}

	return detectedChanges;
};
