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

	// Process each version; only create commit if there is payload for that version
	for (const [versionId, vinfo] of versions) {
		if (!vinfo?.snapshot || vinfo.snapshot.id !== versionId) {
			throw new Error(
				`generateCommit: versions.get('${versionId}').snapshot.id must equal versionId`
			);
		}

		const domainChanges = input.filter(
			(c) =>
				((c as any).lixcol_version_id ?? (c as any).version_id) === versionId
		);

		if (domainChanges.length === 0) continue; // no commit for this version

		const commitId = generateUuid();
		const changeSetId = generateUuid();
		const parent_commit_ids = Array.isArray(vinfo.parent_commit_ids)
			? vinfo.parent_commit_ids
			: [];

		// Version update row
		const versionRow: LixChangeRaw = {
			id: generateUuid(),
			entity_id: versionId,
			schema_key: "lix_version",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				...vinfo.snapshot,
				commit_id: commitId,
			}),
			created_at: timestamp,
		};
		outputChanges.push(versionRow);

		// change_set row
		outputChanges.push({
			id: generateUuid(),
			entity_id: changeSetId,
			schema_key: "lix_change_set",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({ id: changeSetId, metadata: null }),
			created_at: timestamp,
		});

		// commit row with domain-only change_ids and author snapshot
		outputChanges.push({
			id: generateUuid(),
			entity_id: commitId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: commitId,
				change_set_id: changeSetId,
			}),
			created_at: timestamp,
		});

		// edge rows (one per parent)
		for (const parent of parent_commit_ids) {
			outputChanges.push({
				id: generateUuid(),
				entity_id: `${parent}~${commitId}`,
				schema_key: "lix_commit_edge",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					parent_id: parent,
					child_id: commitId,
				}),
				created_at: timestamp,
			});
		}

		// change_author rows for each domain change and each active account
		for (const dc of domainChanges) {
			for (const acct of activeAccounts ?? []) {
				outputChanges.push({
					id: generateUuid(),
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
				});
			}
		}

		// Materialize domain rows and domain-only CSE
		for (const dc of domainChanges) {
			materialized.push({
				...(sanitize(dc) as any),
				lixcol_version_id: versionId,
				lixcol_commit_id: commitId,
			});
			materialized.push({
				id: generateUuid(),
				entity_id: `${changeSetId}~${dc.id}`,
				schema_key: "lix_change_set_element",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: changeSetId,
					change_id: dc.id,
					entity_id: dc.entity_id,
					schema_key: dc.schema_key,
					file_id: dc.file_id,
				}),
				created_at: timestamp,
				lixcol_version_id: "global",
				lixcol_commit_id: commitId,
			} as MaterializedState);
		}
	}

	return { changes: outputChanges, materializedState: materialized };
}
