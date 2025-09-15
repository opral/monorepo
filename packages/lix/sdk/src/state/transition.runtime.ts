import type { LixCommit } from "../commit/schema.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
} from "../change-set/schema.js";
import { LixCommitSchema, LixCommitEdgeSchema } from "../commit/schema.js";
import type { LixVersion } from "../version/schema.js";
import { LixVersionTipSchema } from "../version/schema.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { LixChangeRaw } from "../change/schema.js";
import type { LixEngine } from "../engine/boot.js";
import { uuidV7Sync } from "../engine/deterministic/uuid-v7.js";
import { getTimestampSync } from "../engine/deterministic/timestamp.js";
import { updateStateCache } from "./cache/update-state-cache.js";

/**
 * Engine-local variant of transition that executes next to SQLite.
 *
 * Exposed via router as `lix_transition`.
 */
/**
 * @param args.engine - The engine context bound to SQLite
 */
export async function transitionInEngine(args: {
	engine: LixEngine;
	to: Pick<LixCommit, "id">;
	version?: Pick<LixVersion, "id">;
}): Promise<LixCommit> {
	const engine = args.engine;
	const db = engine.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const executeInTransaction = async (
		trx: Kysely<LixInternalDatabaseSchema>
	) => {
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

		if (sourceCommitId === args.to.id) {
			return await trx
				.selectFrom("commit")
				.where("id", "=", args.to.id)
				.selectAll()
				.executeTakeFirstOrThrow();
		}

		// Gather leaf changes for target
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
WHERE rn = 1;`.execute(trx);
		const leafChangesToApply = leafChangesToApplyRes.rows;

		// Gather leaf keys for source
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
WHERE rn = 1;`.execute(trx);

		const targetKeySet = new Set(
			leafChangesToApply.map(
				(c) => `${c.entity_id}|${c.schema_key}|${c.file_id}`
			)
		);
		const leafEntitiesToDelete = sourceLeavesRes.rows.filter(
			(c) => !targetKeySet.has(`${c.entity_id}|${c.schema_key}|${c.file_id}`)
		);

		// Create deletion changes (snapshot_content = null)
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
			const now = getTimestampSync({ engine });
			const deletionRows = leafEntitiesToDelete.map((c) => ({
				id: uuidV7Sync({ engine }),
				entity_id: c.entity_id,
				schema_key: c.schema_key,
				file_id: c.file_id,
				plugin_key: c.plugin_key,
				schema_version: c.schema_version,
				snapshot_content: null as null,
				created_at: now,
			}));
			await trx
				.insertInto("change")
				.values(deletionRows as any)
				.execute();
			deletionChanges.push(...deletionRows);
		}

		const combinedElements = [...leafChangesToApply, ...deletionChanges];
		if (combinedElements.length === 0) {
			return await trx
				.selectFrom("commit")
				.where("id", "=", args.to.id)
				.selectAll()
				.executeTakeFirstOrThrow();
		}

		// Create metadata changes
		const changeSetId = uuidV7Sync({ engine });
		const commitId = uuidV7Sync({ engine });
		const now = getTimestampSync({ engine });

		const metadataChanges: LixChangeRaw[] = [];
		const versionChangeId = uuidV7Sync({ engine });

		metadataChanges.push({
			id: uuidV7Sync({ engine }),
			entity_id: changeSetId,
			schema_key: LixChangeSetSchema["x-lix-key"],
			schema_version: LixChangeSetSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			metadata: null,
			snapshot_content: JSON.stringify({ id: changeSetId, metadata: null }),
			created_at: now,
		});

		for (const el of combinedElements) {
			metadataChanges.push({
				id: uuidV7Sync({ engine }),
				entity_id: `${changeSetId}~${el.id}`,
				schema_key: LixChangeSetElementSchema["x-lix-key"],
				schema_version: LixChangeSetElementSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				metadata: null,
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

		const commitChangeId = uuidV7Sync({ engine });
		metadataChanges.push({
			id: commitChangeId,
			entity_id: commitId,
			schema_key: LixCommitSchema["x-lix-key"],
			schema_version: LixCommitSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			metadata: null,
			snapshot_content: JSON.stringify({
				id: commitId,
				change_set_id: changeSetId,
				parent_commit_ids: [sourceCommitId, args.to.id],
				change_ids: combinedElements.map((e) => e.id),
				meta_change_ids: [versionChangeId],
			}),
			created_at: now,
		});

		// Add change_set_element for commit entity (edges derived later)
		metadataChanges.push({
			id: uuidV7Sync({ engine }),
			entity_id: `${changeSetId}~${commitChangeId}`,
			schema_key: LixChangeSetElementSchema["x-lix-key"],
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			metadata: null,
			snapshot_content: JSON.stringify({
				change_set_id: changeSetId,
				change_id: commitChangeId,
				entity_id: commitId,
				schema_key: LixCommitSchema["x-lix-key"],
				file_id: "lix",
			}),
			created_at: now,
		});

		// Write pointer ledger (tip)
		metadataChanges.push({
			id: versionChangeId,
			entity_id: version.id,
			schema_key: LixVersionTipSchema["x-lix-key"],
			schema_version: LixVersionTipSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			metadata: null,
			snapshot_content: JSON.stringify({ id: version.id, commit_id: commitId }),
			created_at: now,
		});

		if (metadataChanges.length > 0) {
			await trx
				.insertInto("change")
				.values(metadataChanges as any)
				.execute();
		}

		// Update cache: global graph metadata (derived edges) and per-version user entities
		const derivedEdgesForCache: LixChangeRaw[] = [
			{
				id: uuidV7Sync({ engine }),
				entity_id: `${sourceCommitId}~${commitId}`,
				schema_key: LixCommitEdgeSchema["x-lix-key"],
				schema_version: LixCommitEdgeSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				metadata: null,
				snapshot_content: JSON.stringify({
					parent_id: sourceCommitId,
					child_id: commitId,
				}),
				created_at: now,
			},
			{
				id: uuidV7Sync({ engine }),
				entity_id: `${args.to.id}~${commitId}`,
				schema_key: LixCommitEdgeSchema["x-lix-key"],
				schema_version: LixCommitEdgeSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				metadata: null,
				snapshot_content: JSON.stringify({
					parent_id: args.to.id,
					child_id: commitId,
				}),
				created_at: now,
			},
		];

		updateStateCache({
			engine,
			changes: [...metadataChanges, ...derivedEdgesForCache],
			version_id: "global",
			commit_id: commitId,
		});

		const userChangesForCache: LixChangeRaw[] = [
			...leafChangesToApply.map((c) => ({
				id: c.id,
				entity_id: c.entity_id,
				schema_key: c.schema_key,
				schema_version: c.schema_version,
				file_id: c.file_id,
				plugin_key: c.plugin_key,
				metadata: null,
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
				metadata: null,
				snapshot_content: null,
				created_at: c.created_at ?? now,
			})),
		];

		updateStateCache({
			engine,
			changes: userChangesForCache,
			version_id: version.id,
			commit_id: commitId,
		});

		return { id: commitId, change_set_id: changeSetId } satisfies LixCommit;
	};

	return db.isTransaction
		? executeInTransaction(db)
		: db.transaction().execute(executeInTransaction);
}
