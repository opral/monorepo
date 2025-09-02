import type { LixChangeRaw } from "../../change/schema.js";
import type { LixVersion } from "../../version/schema.js";

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

	// Build metadata rows: version updates, change_sets, commits
	const metaChanges: LixChangeRaw[] = [];
	for (const [vid, meta] of metaByVersion) {
		const vinfo = versions.get(vid)!;

		// version update (write for the mutated version, including 'global' if it has changes)
		metaChanges.push({
			id: generateUuid(),
			entity_id: vid,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...vinfo.snapshot,
				commit_id: meta.commitId,
			}),
			created_at: timestamp,
		});

		// change_set (write for the mutated version, including 'global' if it has changes)
		metaChanges.push({
			id: generateUuid(),
			entity_id: meta.changeSetId,
			schema_key: "lix_change_set",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: meta.changeSetId,
				metadata: null,
			}),
			created_at: timestamp,
		});

		// commit (write for the mutated version, including 'global' if it has changes)
		metaChanges.push({
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
		});

		// Skip materializing CSEs for meta (version/commit/change_set) to keep CSE domain-only
	}

	// author rows (global metadata)
	// Important: author row IDs must be stable across change rows and cache materialization
	// so that change_set_element.change_id can join to change.id.
	const authorChanges: LixChangeRaw[] = [];
	const authorIdByEntity = new Map<string, string>();
	for (const [, domainChanges] of domainByVersion) {
		for (const dc of domainChanges) {
			for (const acct of activeAccounts ?? []) {
				const entity = `${dc.id}~${acct}`;
				const id = generateUuid();
				authorIdByEntity.set(entity, id);
				authorChanges.push({
					id,
					entity_id: entity,
					schema_key: "lix_change_author",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						change_id: dc.id,
						account_id: acct,
					}),
					created_at: timestamp,
				});
			}
		}
	}

	// Materialize author rows into global cache (so views inherit them into active versions)
	for (const [vid, domainChanges] of domainByVersion) {
		const meta = metaByVersion.get(vid)!;
		for (const dc of domainChanges) {
			for (const acct of activeAccounts ?? []) {
				const entity = `${dc.id}~${acct}`;
				const authorId = authorIdByEntity.get(entity)!;
				// Domain author row in cache uses the SAME id as the change row
				materialized.push({
					id: authorId,
					entity_id: entity,
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
				// Materialize CSE for the author row under the commit's change set
				materialized.push({
					id: generateUuid(),
					entity_id: `${meta.changeSetId}~${authorId}`,
					schema_key: "lix_change_set_element",
					schema_version: "1.0",
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						change_set_id: meta.changeSetId,
						change_id: authorId,
						entity_id: entity,
						schema_key: "lix_change_author",
						file_id: "lix",
					}),
					created_at: timestamp,
					lixcol_version_id: "global",
					lixcol_commit_id: meta.commitId,
				} as MaterializedState);
			}
		}
	}

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

	// Update commit snapshots with change_ids (domain + author only; exclude meta)
	for (const [vid, meta] of metaByVersion) {
		const commitIdx = metaChanges.findIndex(
			(m) => m.schema_key === "lix_commit" && m.entity_id === meta.commitId
		);
		if (commitIdx >= 0) {
			const snap = JSON.parse(
				metaChanges[commitIdx]!.snapshot_content as any
			) as any;
			const domainIds = (domainByVersion.get(vid) || []).map((c) => c.id);
			// Include author change ids for domain changes of this version
			const localAuthorIds: string[] = [];
			for (const ac of authorChanges) {
				const sc =
					typeof ac.snapshot_content === "string"
						? JSON.parse(ac.snapshot_content as any)
						: (ac.snapshot_content as any);
				if (sc && domainIds.includes(sc.change_id)) localAuthorIds.push(ac.id);
			}
			// Exclude meta (version/commit/change_set) from membership
			snap.change_ids = [...domainIds, ...localAuthorIds];
			// Step 2: add parent_commit_ids from versions input
			snap.parent_commit_ids = meta.parents;
			metaChanges[commitIdx]!.snapshot_content = JSON.stringify(snap);
		}
	}

	// Materialize version rows into cache under GLOBAL only (version is a global entity)
	for (const [vid, meta] of metaByVersion) {
		const vinfo = versions.get(vid)!;
		materialized.push({
			id: generateUuid(),
			entity_id: vid,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...vinfo.snapshot,
				commit_id: meta.commitId,
			}),
			created_at: timestamp,
			lixcol_version_id: "global",
			lixcol_commit_id: meta.commitId,
		} as MaterializedState);

		// Also materialize the commit row so the commit view can resolve immediately
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

	// Optionally materialize other meta rows (authors/meta/CSE) under GLOBAL if a global meta exists.
	// Not required for correctness; queries read these from change/materializer.
	const globalMeta2 = metaByVersion.get("global");
	// No need to materialize meta CSEs under global here; commit membership covers it

	// Assemble output: domain, authors, meta (no CSE rows in Step 1)
	outputChanges.push(
		...authorChanges,
		...metaChanges
		// No commit_edge change rows in Step 2
		// CSEs are derived; do not include as change rows
	);

	return { changes: outputChanges, materializedState: materialized };
}
