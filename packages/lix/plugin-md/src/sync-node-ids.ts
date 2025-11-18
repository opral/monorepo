import type { MarkdownNode } from "@opral/markdown-wc";

type SyncArgs = {
	before?: MarkdownNode | null;
	after: MarkdownNode;
	seenIds: Set<string>;
	mintId: () => string;
	reservedIds?: Set<string>;
};

const IGNORED_KEYS = new Set(["data", "position"]);

export function syncNodeIds(args: SyncArgs): void {
	const { before, after, seenIds, mintId, reservedIds } = args;
	assignId(after, before, seenIds, mintId, reservedIds);
	reconcileChildren(before, after, seenIds, mintId, reservedIds);
}

function reconcileChildren(
	before: MarkdownNode | null | undefined,
	after: MarkdownNode,
	seenIds: Set<string>,
	mintId: () => string,
	reservedIds?: Set<string>,
) {
	const beforeChildren = getChildNodes(before);
	const afterChildren = getChildNodes(after);
	if (!afterChildren.length) return;

	const beforeInfos = beforeChildren.map((node, idx) => ({
		node,
		idx,
		id: getNodeId(node),
		type: node.type,
		fingerprint: fingerprint(node),
	}));
	const afterInfos = afterChildren.map((node, idx) => ({
		node,
		idx,
		id: getNodeId(node),
		type: node.type,
		fingerprint: fingerprint(node),
	}));

	const usedBefore = new Set<number>();
	const usedAfter = new Set<number>();
	const pairs: Array<{ before?: MarkdownNode; after: MarkdownNode }> = [];

	// Stage 0: match by existing id
	for (let i = 0; i < afterInfos.length; i++) {
		const info = afterInfos[i]!;
		if (!info.id) continue;
		const beforeIdx = beforeInfos.findIndex(
			(b, idx) => !usedBefore.has(idx) && b.id === info.id,
		);
		if (beforeIdx >= 0) {
			usedBefore.add(beforeIdx);
			usedAfter.add(i);
			pairs.push({ before: beforeInfos[beforeIdx]!.node, after: info.node });
		}
	}

	// Stage 1: fingerprint match by type + structure
	for (let i = 0; i < afterInfos.length; i++) {
		if (usedAfter.has(i)) continue;
		const info = afterInfos[i]!;
		const beforeIdx = beforeInfos.findIndex(
			(b, idx) =>
				!usedBefore.has(idx) &&
				b.type === info.type &&
				b.fingerprint === info.fingerprint,
		);
		if (beforeIdx >= 0) {
			usedBefore.add(beforeIdx);
			usedAfter.add(i);
			pairs.push({ before: beforeInfos[beforeIdx]!.node, after: info.node });
		}
	}

	// Stage 2: fallback by type order
	for (let i = 0; i < afterInfos.length; i++) {
		if (usedAfter.has(i)) continue;
		const info = afterInfos[i]!;
		const beforeIdx = beforeInfos.findIndex(
			(b, idx) => !usedBefore.has(idx) && b.type === info.type,
		);
		if (beforeIdx >= 0) {
			usedBefore.add(beforeIdx);
			usedAfter.add(i);
			pairs.push({ before: beforeInfos[beforeIdx]!.node, after: info.node });
		}
	}

	// Stage 3: new nodes
	for (let i = 0; i < afterInfos.length; i++) {
		if (usedAfter.has(i)) continue;
		const info = afterInfos[i]!;
		pairs.push({ after: info.node });
	}

	for (const pair of pairs) {
		assignId(pair.after, pair.before, seenIds, mintId, reservedIds);
		reconcileChildren(pair.before, pair.after, seenIds, mintId, reservedIds);
	}
}

function assignId(
	after: MarkdownNode,
	before: MarkdownNode | null | undefined,
	seenIds: Set<string>,
	mintId: () => string,
	reservedIds?: Set<string>,
) {
	if (!after || typeof after !== "object") return;
	if (!after.data) after.data = {};
	const afterExisting = getNodeId(after);
	const beforeId = getNodeId(before);
	let chosen = claimId(beforeId, seenIds, reservedIds);
	if (!chosen) {
		chosen = claimId(afterExisting, seenIds, reservedIds);
	}
	if (!chosen) {
		chosen = claimNewId(mintId);
	}
	after.data.id = chosen;
}

function claimId(
	id: string | undefined,
	seenIds: Set<string>,
	reservedIds?: Set<string>,
): string | undefined {
	if (!id || id.length === 0) return undefined;
	if (seenIds.has(id)) return undefined;
	seenIds.add(id);
	if (reservedIds) reservedIds.delete(id);
	return id;
}

function claimNewId(mintId: () => string): string {
	return mintId();
}

function getNodeId(node: MarkdownNode | null | undefined): string | undefined {
	const val = node?.data?.id;
	return typeof val === "string" && val.length > 0 ? val : undefined;
}

function getChildNodes(node: MarkdownNode | null | undefined): MarkdownNode[] {
	if (!node || typeof node !== "object") return [];
	return (node.children ?? []).filter(
		(child: unknown): child is MarkdownNode =>
			!!child &&
			typeof child === "object" &&
			typeof (child as Record<string, unknown>).type === "string" &&
			(child as MarkdownNode).type !== "text",
	);
}

function fingerprint(node: MarkdownNode): string {
	return JSON.stringify(stripMeta(node));
}

function stripMeta(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(stripMeta);
	}
	if (!value || typeof value !== "object") return value;
	const result: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(value)) {
		if (IGNORED_KEYS.has(key)) continue;
		result[key] = stripMeta(val);
	}
	return result;
}
