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
        const vid = ((c as any).lixcol_version_id ?? (c as any).version_id) as string;
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

    // Decide which versions get commits: any with domain, plus global if any domain exists
    const versionsToCommit = new Set<string>();
    for (const vid of domainByVersion.keys()) versionsToCommit.add(vid);
    const hasAnyDomain = versionsToCommit.size > 0;
    if (hasAnyDomain && versions.has("global")) versionsToCommit.add("global");

    // Pre-create commit + change_set ids for selected versions
    const metaByVersion = new Map<string, { commitId: string; changeSetId: string; parents: string[] }>();
    for (const vid of versionsToCommit) {
        const vinfo = versions.get(vid)!;
        metaByVersion.set(vid, {
            commitId: generateUuid(),
            changeSetId: generateUuid(),
            parents: Array.isArray(vinfo.parent_commit_ids) ? vinfo.parent_commit_ids : [],
        });
    }

    // Build metadata rows: version updates, change_sets, commits, edges
    const metaChanges: LixChangeRaw[] = [];
    for (const [vid, meta] of metaByVersion) {
        const vinfo = versions.get(vid)!;

        // version update
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

        // change_set
        metaChanges.push({
            id: generateUuid(),
            entity_id: meta.changeSetId,
            schema_key: "lix_change_set",
            schema_version: "1.0",
            file_id: "lix",
            plugin_key: "lix_own_entity",
            snapshot_content: JSON.stringify({ id: meta.changeSetId, metadata: null }),
            created_at: timestamp,
        });

        // commit
        metaChanges.push({
            id: generateUuid(),
            entity_id: meta.commitId,
            schema_key: "lix_commit",
            schema_version: "1.0",
            file_id: "lix",
            plugin_key: "lix_own_entity",
            snapshot_content: JSON.stringify({ id: meta.commitId, change_set_id: meta.changeSetId }),
            created_at: timestamp,
        });

        // edges for each parent
        for (const parent of meta.parents) {
            metaChanges.push({
                id: generateUuid(),
                entity_id: `${parent}~${meta.commitId}`,
                schema_key: "lix_commit_edge",
                schema_version: "1.0",
                file_id: "lix",
                plugin_key: "lix_own_entity",
                snapshot_content: JSON.stringify({ parent_id: parent, child_id: meta.commitId }),
                created_at: timestamp,
            });
        }
    }

    // author rows (global metadata)
    const authorChanges: LixChangeRaw[] = [];
    for (const [vid, domainChanges] of domainByVersion) {
        for (const dc of domainChanges) {
            for (const acct of activeAccounts ?? []) {
                authorChanges.push({
                    id: generateUuid(),
                    entity_id: `${dc.id}~${acct}`,
                    schema_key: "lix_change_author",
                    schema_version: "1.0",
                    file_id: "lix",
                    plugin_key: "lix_own_entity",
                    snapshot_content: JSON.stringify({ change_id: dc.id, account_id: acct }),
                    created_at: timestamp,
                });
            }
        }
    }

    // Domain CSE changes (as changes) and materialized state
    const domainCseChanges: LixChangeRaw[] = [];
    for (const [vid, domainChanges] of domainByVersion) {
        const meta = metaByVersion.get(vid)!;
        for (const dc of domainChanges) {
            // materialized domain row
            materialized.push({ ...(sanitize(dc) as any), lixcol_version_id: vid, lixcol_commit_id: meta.commitId });
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
            // as change row
            domainCseChanges.push({
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
            });
        }
    }

    // Global CSE for metadata changes (under global commit's change set)
    const globalMeta = metaByVersion.get("global");
    const metaCseChanges: LixChangeRaw[] = [];
    if (globalMeta) {
        const allGlobalMeta = [...authorChanges, ...metaChanges];
        for (const ch of allGlobalMeta) {
            metaCseChanges.push({
                id: generateUuid(),
                entity_id: `${globalMeta.changeSetId}~${ch.id}`,
                schema_key: "lix_change_set_element",
                schema_version: "1.0",
                file_id: "lix",
                plugin_key: "lix_own_entity",
                snapshot_content: JSON.stringify({
                    change_set_id: globalMeta.changeSetId,
                    change_id: ch.id,
                    entity_id: ch.entity_id,
                    schema_key: ch.schema_key,
                    file_id: ch.file_id,
                }),
                created_at: timestamp,
            });
        }
    }

    // Meta-of-meta CSE for all CSE changes (domain + meta), under global change set
    const metaOfMetaCse: LixChangeRaw[] = [];
    if (globalMeta) {
        const allCse = [...domainCseChanges, ...metaCseChanges];
        for (const cse of allCse) {
            metaOfMetaCse.push({
                id: generateUuid(),
                entity_id: `${globalMeta.changeSetId}~${cse.id}`,
                schema_key: "lix_change_set_element",
                schema_version: "1.0",
                file_id: "lix",
                plugin_key: "lix_own_entity",
                snapshot_content: JSON.stringify({
                    change_set_id: globalMeta.changeSetId,
                    change_id: cse.id,
                    entity_id: cse.entity_id,
                    schema_key: cse.schema_key,
                    file_id: cse.file_id,
                }),
                created_at: timestamp,
            });
        }
    }

    // Materialize meta rows (authors + meta + cse + meta-of-meta) under GLOBAL
    const globalMeta2 = metaByVersion.get("global");
    if (globalMeta2) {
        const toMaterialize = [
            ...authorChanges,
            ...metaChanges,
            // domainCseChanges already materialized above
            ...metaCseChanges,
            ...metaOfMetaCse,
        ];
        for (const ch of toMaterialize) {
            materialized.push({
                ...(sanitize(ch) as any),
                lixcol_version_id: "global",
                lixcol_commit_id: globalMeta2.commitId,
            });
        }
    }

    // Assemble output: domain, authors, meta, cse, meta-of-meta
    outputChanges.push(
        ...authorChanges,
        ...metaChanges,
        ...domainCseChanges,
        ...metaCseChanges,
        ...metaOfMetaCse
    );

    return { changes: outputChanges, materializedState: materialized };
}
