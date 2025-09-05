import type { LixChangeRaw } from "../../change/schema.js";
import {
	LixVersionTipSchema,
	type LixVersion,
	type LixVersionTip,
} from "../../version/schema.js";

export type MaterializedState = LixChangeRaw & {
	lixcol_version_id: string;
	lixcol_commit_id: string;
};

/**
 * Generates commit change rows per version that has payload (domain changes)
 * and returns cache updates for domain rows and domain-only CSE.
 */
export function generateCommit(args: {
	timestamp: string;
	/**
	 * Accounts considered active at commit time. Used to derive commit authorship snapshots.
	 * Optional for now; implementation may ignore until author snapshots are wired.
	 */
	activeAccounts?: string[];
	changes: LixChangeRaw[];
	versions: Map<
		string,
		{
			parent_commit_ids: string[];
			snapshot: LixVersion;
		}
	>;
	generateUuid: () => string;
}): {
	changes: LixChangeRaw[];
	materializedState: MaterializedState[];
} {
	const { timestamp, changes, versions, generateUuid, activeAccounts } = args;

	if (!versions || !versions.size) {
		throw new Error("generateCommit: versions map is required");
	}

	const input: LixChangeRaw[] = Array.isArray(changes) ? changes : [];

	// Validate uniqueness of change ids in input
	const seenIds = new Set<string>();
	for (const c of input) {
		if (seenIds.has(c.id))
			throw new Error(`duplicate change id detected: '${c.id}'`);
		seenIds.add(c.id);
	}

	const outputChanges: LixChangeRaw[] = [];
	const materialized: MaterializedState[] = [];

	// Helper: shallow sanitize change rows
	const sanitize = (c: LixChangeRaw): LixChangeRaw => ({
		id: c.id,
		entity_id: c.entity_id,
		schema_key: c.schema_key,
		schema_version: c.schema_version,
		file_id: c.file_id,
		plugin_key: c.plugin_key,
		snapshot_content: c.snapshot_content,
		created_at: c.created_at,
	});

	// Always include domain changes as-is in the output
	for (const c of input) outputChanges.push(sanitize(c));

	// Group domain changes by version
	const domainByVersion = new Map<string, LixChangeRaw[]>();
	for (const c of input) {
		const vid = ((c as any).lixcol_version_id ??
			(c as any).version_id) as string;
		if (!vid) continue;
		const list = domainByVersion.get(vid) ?? [];
		list.push(c);
		domainByVersion.set(vid, list);
	}

	// Validate version snapshots
	for (const [versionId, vinfo] of versions) {
		if (!vinfo?.snapshot || vinfo.snapshot.id !== versionId) {
			throw new Error(
				`generateCommit: versions.get('${versionId}').snapshot.id must equal versionId`
			);
		}
	}

	// Decide which versions get commits: exactly those with domain changes
	const versionsToCommit = new Set<string>(domainByVersion.keys());

	// Pre-create commit + change_set ids for selected versions
	const metaByVersion = new Map<
		string,
		{ commitId: string; changeSetId: string; parents: string[] }
	>();
	for (const vid of versionsToCommit) {
		const vinfo = versions.get(vid)!;
		metaByVersion.set(vid, {
			commitId: generateUuid(),
			changeSetId: generateUuid(),
			parents: Array.isArray(vinfo.parent_commit_ids)
				? vinfo.parent_commit_ids
				: [],
		});
	}

	// Build metadata rows: version_tip updates and commits (change_set is synthesized)
	const metaChanges: LixChangeRaw[] = [];
	const commitChangeIdByVersion = new Map<string, string>();
	for (const [vid, meta] of metaByVersion) {
		// version_tip update
		metaChanges.push({
			id: generateUuid(),
			entity_id: vid,
			schema_key: LixVersionTipSchema["x-lix-key"],
			schema_version: LixVersionTipSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: vid,
				commit_id: meta.commitId,
			} satisfies LixVersionTip),
			created_at: timestamp,
		});

		// commit (write for the mutated version, including 'global' if it has changes)
		const commitChangeRowId = generateUuid();
		commitChangeIdByVersion.set(vid, commitChangeRowId);
		metaChanges.push({
			id: commitChangeRowId,
			entity_id: meta.commitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: meta.commitId,
				change_set_id: meta.changeSetId,
			}),
			created_at: timestamp,
		});

		// Skip materializing CSEs for meta (version/commit/change_set) to keep CSE domain-only
	}

	// (no commit-level author rows; authors are per-change in the cache)

	// Derived CSEs in materialized state only (no change rows in Step 1)
	for (const [vid, domainChanges] of domainByVersion) {
		const meta = metaByVersion.get(vid)!;
		for (const dc of domainChanges) {
			// materialized domain row
			materialized.push({
				...(sanitize(dc) as any),
				lixcol_version_id: vid,
				lixcol_commit_id: meta.commitId,
			});
			// materialized domain CSE (cache)
			// Note: domain CSE is stored in global cache with the GLOBAL commit id
			const globalMeta = metaByVersion.get("global");
			materialized.push({
				id: generateUuid(),
				entity_id: `${meta.changeSetId}~${dc.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: meta.changeSetId,
					change_id: dc.id,
					entity_id: dc.entity_id,
					schema_key: dc.schema_key,
					file_id: dc.file_id,
				}),
				created_at: timestamp,
				lixcol_version_id: "global",
				lixcol_commit_id: globalMeta ? globalMeta.commitId : meta.commitId,
			} as MaterializedState);
		}
	}

	// Materialize per-change author rows in cache (derived; change_id = domain change id),
	// and tie their lixcol_change_id to the commit change row id
	for (const [vid, domainChanges] of domainByVersion) {
		const meta = metaByVersion.get(vid)!;
		const commitChangeRowId = commitChangeIdByVersion.get(vid)!;
		for (const dc of domainChanges) {
			for (const acct of activeAccounts ?? []) {
				materialized.push({
					id: commitChangeRowId,
					entity_id: `${dc.id}~${acct}`,
					schema_key: "lix_change_author",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						change_id: dc.id,
						account_id: acct,
					}),
					created_at: timestamp,
					lixcol_version_id: "global",
					lixcol_commit_id: meta.commitId,
				} as MaterializedState);
			}
		}
	}

	// Update commit snapshots with change_ids (domain + author only; exclude meta)
	// Also set meta_change_ids to the associated version_tip change id
	// (control/meta membership kept separate from domain membership per Step 5)
	const tipChangeIdByVersion = new Map<string, string>();
	for (const ch of metaChanges) {
		if (ch.schema_key === LixVersionTipSchema["x-lix-key"]) {
			tipChangeIdByVersion.set(ch.entity_id, ch.id);
		}
	}
	for (const [vid, meta] of metaByVersion) {
		const commitIdx = metaChanges.findIndex(
			(m) => m.schema_key === "lix_commit" && m.entity_id === meta.commitId
		);
		if (commitIdx >= 0) {
			const snap = JSON.parse(
				metaChanges[commitIdx]!.snapshot_content as any
			) as any;
			const domainIds = (domainByVersion.get(vid) || []).map((c) => c.id);
			// Exclude meta (version/commit/change_set) and author rows from membership
			snap.change_ids = [...domainIds];
			// Commit-level authors
			snap.author_account_ids = Array.from(new Set(activeAccounts ?? []));
			// Add meta_change_ids (currently only version_tip change id)
			const tipId = tipChangeIdByVersion.get(vid);
			snap.meta_change_ids = tipId ? [tipId] : [];
			// Step 2: add parent_commit_ids from versions input
			snap.parent_commit_ids = meta.parents;
			metaChanges[commitIdx]!.snapshot_content = JSON.stringify(snap);
		}
	}

	// Materialize the commit rows so the commit view can resolve immediately
	for (const [, meta] of metaByVersion) {
		materialized.push({
			id: generateUuid(),
			entity_id: meta.commitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: meta.commitId,
				change_set_id: meta.changeSetId,
			}),
			created_at: timestamp,
			lixcol_version_id: "global",
			lixcol_commit_id: meta.commitId,
		} as MaterializedState);
	}

	// Materialize version tip rows to reflect pointers without SELECTs
	for (const [vid, meta] of metaByVersion) {
		const tipChangeId = tipChangeIdByVersion.get(vid) ?? generateUuid();
		materialized.push({
			id: tipChangeId,
			entity_id: vid,
			schema_key: LixVersionTipSchema["x-lix-key"],
			schema_version: LixVersionTipSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: vid,
				commit_id: meta.commitId,
			} satisfies LixVersionTip),
			created_at: timestamp,
			lixcol_version_id: "global",
			lixcol_commit_id: meta.commitId,
		} as MaterializedState);
	}

	// Derive commit edges for materialization (global scope)
	const edgeMaterialized: MaterializedState[] = [];
	{
		const globalMeta3 = metaByVersion.get("global");
		for (const [, meta] of metaByVersion) {
			for (const parent of meta.parents) {
				edgeMaterialized.push({
					id: generateUuid(),
					entity_id: `${parent}~${meta.commitId}`,
					schema_key: "lix_commit_edge",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						parent_id: parent,
						child_id: meta.commitId,
					}),
					created_at: timestamp,
					lixcol_version_id: "global",
					lixcol_commit_id: globalMeta3 ? globalMeta3.commitId : meta.commitId,
				} as MaterializedState);
			}
		}
	}

	// Materialize global commit edges unconditionally (edges are global topology)
	if (edgeMaterialized.length > 0) {
		for (const ch of edgeMaterialized) {
			materialized.push({
				...(sanitize(ch) as any),
				lixcol_version_id: "global",
				// keep the commit id chosen during edge derivation
				lixcol_commit_id: (ch as any).lixcol_commit_id,
			});
		}
	}

	outputChanges.push(...metaChanges);

	return { changes: outputChanges, materializedState: materialized };
}
