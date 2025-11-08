import type { LixChangeRaw } from "../../../change/schema-definition.js";
import type { LixEngine } from "../../../engine/boot.js";
import type { StateCommitChange } from "../../../hooks/create-hooks.js";

const DESCRIPTOR_SCHEMA_KEY = "lix_version_descriptor";

/**
 * Represents a single version entry inside the inheritance map.
 */
export type VersionInheritanceNode = {
	versionId: string;
	inheritsFromVersionId: string | null;
	ancestors: readonly string[];
};

/**
 * Snapshot of all known versions keyed by their identifier.
 */
export type VersionInheritanceMap = Map<string, VersionInheritanceNode>;

type MutableInheritanceNode = {
	versionId: string;
	inheritsFromVersionId: string | null;
	ancestors: string[];
};

export type VersionInheritanceCache = {
	/**
	 * Returns the current snapshot of all cached versions.
	 */
	getSnapshot: () => VersionInheritanceMap;
};

type InternalVersionInheritanceCache = VersionInheritanceCache & {
	applyDescriptorChanges: (changes: readonly LixChangeRaw[]) => void;
};

/**
 * Creates an in-memory cache for version inheritance metadata.
 *
 * @example
 * ```ts
 * const cache = createVersionInheritanceCache();
 * cache.applyDescriptorChanges(changes);
 * ```
 */
export function createVersionInheritanceCache(): InternalVersionInheritanceCache {
	const nodes = new Map<string, MutableInheritanceNode>();
	const children = new Map<string, Set<string>>();

	const attachChild = (parentId: string | null, versionId: string) => {
		if (!parentId) {
			return;
		}
		let set = children.get(parentId);
		if (!set) {
			set = new Set<string>();
			children.set(parentId, set);
		}
		set.add(versionId);
	};

	const detachChild = (parentId: string | null, versionId: string) => {
		if (!parentId) {
			return;
		}
		const set = children.get(parentId);
		if (!set) {
			return;
		}
		set.delete(versionId);
		if (set.size === 0) {
			children.delete(parentId);
		}
	};

	const refreshBranch = (startId: string) => {
		const queue: string[] = [startId];
		const visited = new Set<string>();
		while (queue.length > 0) {
			const currentId = queue.shift()!;
			if (visited.has(currentId)) {
				continue;
			}
			visited.add(currentId);
			const node = nodes.get(currentId);
			if (!node) {
				continue;
			}
			const parentId = node.inheritsFromVersionId;
			const parentNode = parentId ? nodes.get(parentId) : undefined;
			const nextAncestors =
				parentId === null
					? []
					: parentNode
						? [parentId, ...parentNode.ancestors]
						: [parentId];
			if (!arraysEqual(node.ancestors, nextAncestors)) {
				node.ancestors = nextAncestors;
			}
			const childSet = children.get(currentId);
			if (childSet) {
				for (const child of childSet) {
					queue.push(child);
				}
			}
		}
	};

	const upsertNode = (versionId: string, inheritsFrom: string | null) => {
		const existing = nodes.get(versionId);
		const previousParent = existing?.inheritsFromVersionId ?? null;
		if (previousParent && previousParent !== inheritsFrom) {
			detachChild(previousParent, versionId);
		}
		if (inheritsFrom && inheritsFrom !== previousParent) {
			attachChild(inheritsFrom, versionId);
		}
		const target =
			existing ??
			({
				versionId,
				inheritsFromVersionId: inheritsFrom,
				ancestors: [],
			} satisfies MutableInheritanceNode);
		target.inheritsFromVersionId = inheritsFrom;
		nodes.set(versionId, target);
		refreshBranch(versionId);
	};

	const removeNode = (versionId: string) => {
		const node = nodes.get(versionId);
		if (!node) {
			return;
		}
		nodes.delete(versionId);
		detachChild(node.inheritsFromVersionId, versionId);
		const childSet = new Set(children.get(versionId) ?? []);
		for (const child of childSet) {
			refreshBranch(child);
		}
	};

	const cache: InternalVersionInheritanceCache = {
		applyDescriptorChanges(changes) {
			for (const change of changes) {
				if (change.schema_key !== DESCRIPTOR_SCHEMA_KEY) {
					continue;
				}
				const payload = parseDescriptorChange(change);
				if (!payload) {
					continue;
				}
				if (payload.snapshot === null) {
					removeNode(payload.versionId);
					continue;
				}
				upsertNode(payload.versionId, payload.snapshot.inheritsFrom);
			}
		},
		getSnapshot() {
			return new Map(
				Array.from(nodes.entries(), ([key, node]) => [
					key,
					{
						versionId: node.versionId,
						inheritsFromVersionId: node.inheritsFromVersionId,
						ancestors: [...node.ancestors],
					},
				])
			);
		},
	};

	return cache;
}

type ParsedDescriptorChange =
	| {
			versionId: string;
			snapshot: { inheritsFrom: string | null };
	  }
	| { versionId: string; snapshot: null };

function parseDescriptorChange(
	change: LixChangeRaw
): ParsedDescriptorChange | null {
	const versionId =
		(typeof change.entity_id === "string" && change.entity_id.length > 0
			? change.entity_id
			: undefined) ?? extractVersionId(change.snapshot_content);
	if (!versionId) {
		return null;
	}
	if (change.snapshot_content === null) {
		return { versionId, snapshot: null };
	}
	const parsed =
		typeof change.snapshot_content === "string"
			? safeJsonParse(change.snapshot_content)
			: change.snapshot_content;
	if (!parsed || typeof parsed !== "object") {
		return null;
	}
	const inheritsValue =
		"inherits_from_version_id" in parsed
			? (parsed as Record<string, unknown>).inherits_from_version_id
			: null;
	const inheritsFrom =
		typeof inheritsValue === "string" && inheritsValue.length > 0
			? inheritsValue
			: null;
	return {
		versionId,
		snapshot: { inheritsFrom },
	};
}

function extractVersionId(raw: unknown): string | undefined {
	if (typeof raw === "string") {
		const parsed = safeJsonParse(raw);
		return extractVersionId(parsed);
	}
	if (raw && typeof raw === "object" && "id" in raw) {
		const value = (raw as Record<string, unknown>).id;
		return typeof value === "string" && value.length > 0 ? value : undefined;
	}
	return undefined;
}

function safeJsonParse(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

const cacheByRuntime = new WeakMap<object, InternalVersionInheritanceCache>();
const subscriptionRefs = new WeakSet<object>();
const initializedRefs = new WeakSet<object>();

function getOrCreateCache(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): InternalVersionInheritanceCache {
	let cache = cacheByRuntime.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = createVersionInheritanceCache();
		cacheByRuntime.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

function ensureBootstrapCache(args: {
	engine: Pick<LixEngine, "runtimeCacheRef" | "sqlite">;
	cache: InternalVersionInheritanceCache;
}): void {
	if (initializedRefs.has(args.engine.runtimeCacheRef)) {
		return;
	}
	initializedRefs.add(args.engine.runtimeCacheRef);
	const rows = args.engine.sqlite.exec({
		sql: `
			SELECT
				entity_id,
				schema_key,
				schema_version,
				file_id,
				plugin_key,
				change_id,
				created_at,
				snapshot_content
			FROM lix_internal_state_vtable
			WHERE schema_key = ?
			  AND snapshot_content IS NOT NULL
		`,
		bind: [DESCRIPTOR_SCHEMA_KEY],
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	}) as Array<Record<string, unknown>>;
	if (rows.length === 0) {
		return;
	}
	const changes: LixChangeRaw[] = rows.map((row, index) => ({
		id:
			(typeof row.change_id === "string" && row.change_id.length > 0
				? row.change_id
				: typeof row.entity_id === "string" && row.entity_id.length > 0
					? row.entity_id
					: `bootstrap-${index}`) ?? `bootstrap-${index}`,
		entity_id:
			(typeof row.entity_id === "string" && row.entity_id.length > 0
				? row.entity_id
				: "") ?? "",
		schema_key: DESCRIPTOR_SCHEMA_KEY,
		schema_version:
			(typeof row.schema_version === "string" && row.schema_version.length > 0
				? row.schema_version
				: "1.0") ?? "1.0",
		file_id:
			(typeof row.file_id === "string" && row.file_id.length > 0
				? row.file_id
				: "lix") ?? "lix",
		plugin_key:
			(typeof row.plugin_key === "string" && row.plugin_key.length > 0
				? row.plugin_key
				: "lix_own_entity") ?? "lix_own_entity",
		created_at:
			(typeof row.created_at === "string" && row.created_at.length > 0
				? row.created_at
				: new Date().toISOString()) ?? new Date().toISOString(),
		snapshot_content: normalizeSnapshotContent(
			row.snapshot_content as Record<string, any> | string | null | undefined
		),
		metadata: null,
	}));
	args.cache.applyDescriptorChanges(changes);
}

function ensureSubscription(args: {
	engine: Pick<LixEngine, "runtimeCacheRef" | "hooks">;
	cache: InternalVersionInheritanceCache;
}): void {
	if (subscriptionRefs.has(args.engine.runtimeCacheRef)) {
		return;
	}
	subscriptionRefs.add(args.engine.runtimeCacheRef);
	args.engine.hooks.onStateCommit(({ changes }) => {
		const descriptorChanges = changes
			.filter((change) => change.schema_key === DESCRIPTOR_SCHEMA_KEY)
			.map(convertStateChangeToRaw);
		if (descriptorChanges.length === 0) {
			return;
		}
		args.cache.applyDescriptorChanges(descriptorChanges);
	});
}

function convertStateChangeToRaw(change: StateCommitChange): LixChangeRaw {
	return {
		id: change.id,
		entity_id: change.entity_id,
		schema_key: change.schema_key,
		schema_version: change.schema_version,
		file_id: change.file_id,
		plugin_key: change.plugin_key,
		created_at: change.created_at,
		snapshot_content: normalizeSnapshotContent(change.snapshot_content),
		metadata: change.metadata ? JSON.stringify(change.metadata) : null,
	};
}

function normalizeSnapshotContent(
	content: Record<string, any> | string | null | undefined
): string | null {
	if (content === null || content === undefined) {
		return null;
	}
	if (typeof content === "string") {
		return content;
	}
	return JSON.stringify(content);
}

export function getVersionInheritanceSnapshot(args: {
	engine: Pick<LixEngine, "runtimeCacheRef" | "hooks" | "sqlite">;
}): VersionInheritanceMap {
	const cache = getOrCreateCache(args);
	ensureBootstrapCache({ engine: args.engine, cache });
	ensureSubscription({ engine: args.engine, cache });
	return cache.getSnapshot();
}
