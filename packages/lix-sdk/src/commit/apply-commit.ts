import type { Lix } from "../lix/index.js";
import type { LixCommit } from "./schema.js";
import type { LixVersion } from "../version/schema.js";
import { updateStateCache } from "../state/cache/update-state-cache.js";
import { LixVersionSchema } from "../version/schema.js";
import { LixCommitEdgeSchema } from "./schema.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { timestamp } from "../deterministic/timestamp.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Applies a commit to a version by updating the version's commit_id and applying its changes.
 *
 * This function:
 * 1. Updates the version to point to the new commit
 * 2. Applies all changes from the commit's change set
 *
 * @example
 * ```ts
 * // Apply a commit to the active version
 * await applyCommit({
 *   lix,
 *   commit: myCommit
 * });
 *
 * // Apply a commit to a specific version
 * await applyCommit({
 *   lix,
 *   commit: myCommit,
 *   version: specificVersion
 * });
 * ```
 */
export async function applyCommit(args: {
    lix: Lix;
    commit: Pick<LixCommit, "id">;
    version?: Pick<LixVersion, "id">;
}): Promise<void> {
    const executeInTransaction = async (trx: Lix["db"]) => {
        // Get the target version (use active version if not specified)
        const targetVersion = args.version
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

        // Get the commit details (global metadata)
        const commit = await trx
            .selectFrom("commit_all")
            .where("id", "=", args.commit.id)
            .where("lixcol_version_id", "=", "global")
            .selectAll()
            .executeTakeFirstOrThrow();

        // Fetch all changes belonging to this commit's change set
        const changeRows = await trx
            .selectFrom("change")
            .innerJoin(
                "change_set_element_all",
                "change_set_element_all.change_id",
                "change.id"
            )
            .where("change_set_element_all.change_set_id", "=", commit.change_set_id)
            .where("change_set_element_all.lixcol_version_id", "=", "global")
            .selectAll("change")
            .execute();

        // Prepare changes for cache (stringify snapshot_content for updateStateCache)
        const changesForCache = changeRows.map((c) => ({
            id: c.id,
            entity_id: c.entity_id,
            schema_key: c.schema_key,
            schema_version: c.schema_version,
            file_id: c.file_id,
            plugin_key: c.plugin_key,
            snapshot_content: c.snapshot_content ? JSON.stringify(c.snapshot_content) : null,
            created_at: c.created_at,
        }));

        // Also update the version's commit_id in cache (no vtable write)
        const intDb = trx as unknown as Kysely<LixInternalDatabaseSchema>;
        const versionRow = await intDb
            .selectFrom("internal_resolved_state_all")
            .where("schema_key", "=", "lix_version")
            .where("entity_id", "=", targetVersion.id)
            .where("snapshot_content", "is not", null)
            .select([sql`json(snapshot_content)`.as("snapshot_content")])
            .executeTakeFirstOrThrow();

        const currentVersion = versionRow.snapshot_content as unknown as LixVersion;
        const now = timestamp({ lix: args.lix });
        const versionChange = {
            id: uuidV7({ lix: args.lix }),
            entity_id: targetVersion.id,
            schema_key: "lix_version",
            schema_version: LixVersionSchema["x-lix-version"],
            file_id: "lix",
            plugin_key: "lix_own_entity",
            snapshot_content: JSON.stringify({ ...currentVersion, commit_id: commit.id }),
            created_at: now,
        };

        // Optional graph linkage: create a commit_edge from the previous commit to this commit
        const prevCommitId = currentVersion.commit_id;
        const graphChanges: any[] = [];
        if (prevCommitId && prevCommitId !== commit.id) {
            graphChanges.push({
                id: uuidV7({ lix: args.lix }),
                entity_id: `${prevCommitId}~${commit.id}`,
                schema_key: "lix_commit_edge",
                schema_version: LixCommitEdgeSchema["x-lix-version"],
                file_id: "lix",
                plugin_key: "lix_own_entity",
                snapshot_content: JSON.stringify({ parent_id: prevCommitId, child_id: commit.id }),
                created_at: now,
            });
        }

        // 1) Update target version cache with the commit's content changes
        if (changesForCache.length > 0) {
        updateStateCache({
            lix: args.lix,
            changes: changesForCache,
            version_id: targetVersion.id,
            commit_id: commit.id,
        });
        }

        // 2) Persist version + commit graph changes in the global change table (for materialization)
        await trx.insertInto("change").values([versionChange, ...graphChanges]).execute();

        // 3) Update global cache with the version entity patch (version rows live in global)
        updateStateCache({
            lix: args.lix,
            changes: [versionChange, ...graphChanges],
            version_id: "global",
            commit_id: commit.id,
        });
    };

    return args.lix.db.isTransaction
        ? executeInTransaction(args.lix.db)
        : args.lix.db.transaction().execute(executeInTransaction);
}
