import { type Kysely, sql } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Version } from "../version/schema.js";

export function getVersionRecordByIdOrThrow(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	version_id: string
): Version {
	let [versionRecord] = executeSync({
		lix: { sqlite },
		query: db
			.selectFrom("internal_state_cache")
			.where("schema_key", "=", "lix_version")
			.where("entity_id", "=", version_id)
			.select("snapshot_content as content"),
	}) as [{ content: string } | undefined];

	// If not found in cache, try the change/snapshot tables (normal operation)
	if (!versionRecord) {
		[versionRecord] = executeSync({
			lix: { sqlite },
			// TODO @samuelstroschein wouldn't we need the view that quieries the union of the temp table and this one?
			query: db
				.selectFrom("internal_change")
				.innerJoin(
					"internal_snapshot",
					"internal_change.snapshot_id",
					"internal_snapshot.id"
				)
				.where("internal_change.schema_key", "=", "lix_version")
				.where("internal_change.entity_id", "=", version_id)
				.where("internal_change.snapshot_id", "!=", "no-content")
				// TODO @samuelstroschein how does this ording work with a second branch in version?
				// @ts-expect-error - rowid is a valid SQLite column but not in Kysely types
				.orderBy("internal_change.rowid", "desc")
				.limit(1)
				.select(sql`json(internal_snapshot.content)`.as("content")),
		}) as [{ content: string } | undefined];
	}

	// Bootstrap is now handled through proper change tracking in newLixFile()

	if (!versionRecord) {
		throw new Error(`Version with id '${version_id}' not found.`);
	}

	return JSON.parse(versionRecord.content) as Version;
}
