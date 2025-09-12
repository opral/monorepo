import type { Lix } from "../lix/index.js";
import { uuidV7 } from "../runtime/deterministic/uuid-v7.js";
// Using explicit commit-scoped leaf CTEs for performance and clarity
import type { LixCommit } from "../commit/schema.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
} from "../change-set/schema.js";
import { LixCommitSchema, LixCommitEdgeSchema } from "../commit/schema.js";
import { LixVersionTipSchema, type LixVersion } from "../version/schema.js";
import { sql } from "kysely";
import { getTimestamp } from "../runtime/deterministic/timestamp.js";
import type { LixChangeRaw } from "../change/schema.js";
import { updateStateCache } from "./cache/update-state-cache.js";

/**
 * Transitions a version's state to match the state at `toCommitId`.
 *
 * - If `versionId` is omitted, operates on the active version.
 * - If the version already points to `toCommitId`, it's a no-op and returns that commit.
 * - Otherwise, creates a transition commit whose changeset transforms source → target,
 *   links it to both the source and target commits, and updates the version to point to it.
 */
export async function transition(args: {
	lix: Lix;
	to: Pick<LixCommit, "id">;
	version?: Pick<LixVersion, "id">;
}): Promise<LixCommit> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Resolve target version
		const version = args.version
			? await trx
					.selectFrom("version")
					.where("id", "=", args.version.id)
					.selectAll()
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version", "version.id", "active_version.version_id")
					.selectAll("version")
					.executeTakeFirstOrThrow();

		const sourceCommitId = version.commit_id;

		// No-op if already at target
		if (sourceCommitId === args.to.id) {
			const commit = await trx
				.selectFrom("commit")
				.where("id", "=", args.to.id)
				.selectAll()
				.executeTakeFirstOrThrow();
			return commit;
		}

		// 1) Gather leaf changes for target and source via explicit commit-scoped CTEs
		const leafChangesToApplyRes = await sql<{
			id: string;
			entity_id: string;
			schema_key: string;
			file_id: string;
			plugin_key: string;
			schema_version: string;
			snapshot_content: any | null;
			created_at: string;
		}>`
WITH RECURSIVE ancestry(id, depth) AS (
  SELECT id, 0 FROM "commit" WHERE id = ${sql.lit(args.to.id)}
  UNION ALL
  SELECT ce.parent_id, ancestry.depth + 1
  FROM commit_edge ce
  JOIN ancestry ON ce.child_id = ancestry.id
),
change_sets AS (
  SELECT change_set_id FROM "commit" WHERE id IN (SELECT id FROM ancestry)
),
per_entity AS (
  SELECT 
    ch.id,
    ch.entity_id,
    ch.schema_key,
    ch.file_id,
    ch.plugin_key,
    ch.schema_version,
    ch.snapshot_content,
    ch.created_at,
    (SELECT depth FROM ancestry a JOIN "commit" c2 ON c2.id = a.id WHERE c2.change_set_id = cse.change_set_id LIMIT 1) AS depth_at
  FROM change_set_element cse
  JOIN change ch ON ch.id = cse.change_id
  WHERE cse.change_set_id IN (SELECT change_set_id FROM change_sets)
)
SELECT id, entity_id, schema_key, file_id, plugin_key, schema_version, json(snapshot_content) as snapshot_content, created_at
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id, schema_key, file_id
    ORDER BY depth_at ASC
  ) AS rn
  FROM per_entity
)
WHERE rn = 1;
    `.execute(trx);
		const leafChangesToApply = leafChangesToApplyRes.rows;

		const sourceLeavesRes = await sql<{
			id: string;
			entity_id: string;
			schema_key: string;
			file_id: string;
			plugin_key: string;
			schema_version: string;
		}>`
WITH RECURSIVE ancestry(id, depth) AS (
  SELECT id, 0 FROM "commit" WHERE id = ${sql.lit(sourceCommitId)}
  UNION ALL
  SELECT ce.parent_id, ancestry.depth + 1
  FROM commit_edge ce
  JOIN ancestry ON ce.child_id = ancestry.id
),
change_sets AS (
  SELECT change_set_id FROM "commit" WHERE id IN (SELECT id FROM ancestry)
),
per_entity AS (
  SELECT 
    ch.id,
    ch.entity_id,
    ch.schema_key,
    ch.file_id,
    ch.plugin_key,
    ch.schema_version,
    (SELECT depth FROM ancestry a JOIN "commit" c2 ON c2.id = a.id WHERE c2.change_set_id = cse.change_set_id LIMIT 1) AS depth_at
  FROM change_set_element cse
  JOIN change ch ON ch.id = cse.change_id
  WHERE cse.change_set_id IN (SELECT change_set_id FROM change_sets)
)
SELECT id, entity_id, schema_key, file_id, plugin_key, schema_version
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id, schema_key, file_id
    ORDER BY depth_at ASC
  ) AS rn
  FROM per_entity
)
WHERE rn = 1;
    `.execute(trx);

		// 2) Set-diff: deletions = source leaf keys minus target leaf keys
		const targetKeySet = new Set(
			leafChangesToApply.map(
				(c) => `${c.entity_id}|${c.schema_key}|${c.file_id}`
			)
		);
		const leafEntitiesToDelete = sourceLeavesRes.rows.filter(
			(c) => !targetKeySet.has(`${c.entity_id}|${c.schema_key}|${c.file_id}`)
		);

		// Create deletion changes as new rows (snapshot_content = null)
		const deletionChanges: Array<{
			id: string;
			entity_id: string;
			schema_key: string;
			file_id: string;
			plugin_key: string;
			schema_version: string;
			snapshot_content: null;
			created_at: string;
		}> = [];
		if (leafEntitiesToDelete.length > 0) {
			const deletionRows = await Promise.all(
				leafEntitiesToDelete.map(async (c) => ({
					id: await uuidV7({ lix: args.lix }),
					entity_id: c.entity_id,
					schema_key: c.schema_key,
					file_id: c.file_id,
					plugin_key: c.plugin_key,
					schema_version: c.schema_version,
					snapshot_content: null as null,
					created_at: await getTimestamp({ lix: args.lix }),
				}))
			);
			await trx
				.insertInto("change")
				.values(deletionRows as any)
				.execute();
			deletionChanges.push(...deletionRows);
		}

		const combinedElements = [...leafChangesToApply, ...deletionChanges];

		// If nothing to change, treat as no-op by returning target commit
		if (combinedElements.length === 0) {
			const commit = await trx
				.selectFrom("commit")
				.where("id", "=", args.to.id)
				.selectAll()
				.executeTakeFirstOrThrow();
			return commit;
		}

		// 3) Create change set + commit + edges + tip as tracked change rows
		const changeSetId = await uuidV7({ lix: args.lix });
		const commitId = await uuidV7({ lix: args.lix });
		const now = await getTimestamp({ lix: args.lix });

		// Collect all raw changes to insert (with explicit ids + created_at)
		const metadataChanges: LixChangeRaw[] = [];
		// Pre-generate tip change id so we can reference it in commit.meta_change_ids
		const versionChangeId = await uuidV7({ lix: args.lix });

		// change_set entity
		metadataChanges.push({
			id: await uuidV7({ lix: args.lix }),
			entity_id: changeSetId,
			schema_key: LixChangeSetSchema["x-lix-key"],
			schema_version: LixChangeSetSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({ id: changeSetId, metadata: null }),
			created_at: now,
		});

		// change_set_element entities
		for (const el of combinedElements) {
			metadataChanges.push({
				id: await uuidV7({ lix: args.lix }),
				entity_id: `${changeSetId}~${el.id}`,
				schema_key: LixChangeSetElementSchema["x-lix-key"],
				schema_version: LixChangeSetElementSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: changeSetId,
					change_id: el.id,
					entity_id: el.entity_id,
					schema_key: el.schema_key,
					file_id: el.file_id,
				}),
				created_at: now,
			});
		}

		// commit entity (track id for change_set_element)
		const commitChangeId = await uuidV7({ lix: args.lix });
		metadataChanges.push({
			id: commitChangeId,
			entity_id: commitId,
			schema_key: LixCommitSchema["x-lix-key"],
			schema_version: LixCommitSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				id: commitId,
				change_set_id: changeSetId,
				parent_commit_ids: [sourceCommitId, args.to.id],
				change_ids: combinedElements.map((e) => e.id),
				meta_change_ids: [versionChangeId],
			}),
			created_at: now,
		});

		// Do not emit commit_edge as change rows. Edges are derived from commit.parent_commit_ids.

		// Add change_set_element entries for commit and edges so materializer can reach metadata
		for (const meta of [
			{
				change_id: commitChangeId,
				entity_id: commitId,
				schema_key: LixCommitSchema["x-lix-key"],
				file_id: "lix" as const,
			},
		]) {
			metadataChanges.push({
				id: await uuidV7({ lix: args.lix }),
				entity_id: `${changeSetId}~${meta.change_id}`,
				schema_key: LixChangeSetElementSchema["x-lix-key"],
				schema_version: LixChangeSetElementSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					change_set_id: changeSetId,
					change_id: meta.change_id,
					entity_id: meta.entity_id,
					schema_key: meta.schema_key,
					file_id: meta.file_id,
				}),
				created_at: now,
			});
		}

		// version pointer move (tip) as tracked change (track id for CSE if needed)
		// Write the pointer ledger as a tip change
		metadataChanges.push({
			id: versionChangeId,
			entity_id: version.id,
			schema_key: LixVersionTipSchema["x-lix-key"],
			schema_version: LixVersionTipSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({ id: version.id, commit_id: commitId }),
			created_at: now,
		});

		// Insert all rows via change view to populate internal tables/snapshots deterministically
		if (metadataChanges.length > 0) {
			await trx
				.insertInto("change")
				.values(metadataChanges as any)
				.execute();
		}

		// Ensure FK validations and readers see commit/graph/change_set in global cache
		// Add derived edge cache rows (parent -> new commit) without inserting commit_edge changes
		const derivedEdgesForCache: LixChangeRaw[] = [
			{
				id: await uuidV7({ lix: args.lix }),
				entity_id: `${sourceCommitId}~${commitId}`,
				schema_key: LixCommitEdgeSchema["x-lix-key"],
				schema_version: LixCommitEdgeSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					parent_id: sourceCommitId,
					child_id: commitId,
				}),
				created_at: now,
			},
			{
				id: await uuidV7({ lix: args.lix }),
				entity_id: `${args.to.id}~${commitId}`,
				schema_key: LixCommitEdgeSchema["x-lix-key"],
				schema_version: LixCommitEdgeSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					parent_id: args.to.id,
					child_id: commitId,
				}),
				created_at: now,
			},
		];

		updateStateCache({
			runtime: args.lix.runtime!,
			changes: [...metadataChanges, ...derivedEdgesForCache],
			version_id: "global",
			commit_id: commitId,
		});

		// Version view reflects the new commit via tip and cache; no direct version update

		// Prepare user entity cache updates (target content + deletions)
		const userChangesForCache: LixChangeRaw[] = [
			...leafChangesToApply.map((c) => ({
				id: c.id,
				entity_id: c.entity_id,
				schema_key: c.schema_key,
				schema_version: c.schema_version,
				file_id: c.file_id,
				plugin_key: c.plugin_key,
				snapshot_content: c.snapshot_content
					? JSON.stringify(c.snapshot_content)
					: null,
				created_at: c.created_at,
			})),
			...deletionChanges.map((c) => ({
				id: c.id,
				entity_id: c.entity_id,
				schema_key: c.schema_key,
				schema_version: c.schema_version,
				file_id: c.file_id,
				plugin_key: c.plugin_key,
				snapshot_content: null,
				created_at: c.created_at ?? now,
			})),
		];

		// Update cache once at the very end for the scoped version (user entities only)
		updateStateCache({
			runtime: args.lix.runtime!,
			changes: userChangesForCache,
			version_id: version.id,
			commit_id: commitId,
		});

		// Return the created commit directly
		return { id: commitId, change_set_id: changeSetId } satisfies LixCommit;
	};

	return args.lix.db.isTransaction
		? executeInTransaction(args.lix.db)
		: args.lix.db.transaction().execute(executeInTransaction);
}
