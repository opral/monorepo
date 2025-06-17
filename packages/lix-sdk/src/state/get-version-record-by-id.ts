import { type Kysely, sql } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { executeSync } from "../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import {
	INITIAL_VERSION_ID,
	INITIAL_CHANGE_SET_ID,
	INITIAL_WORKING_CHANGE_SET_ID,
	type LixVersion,
	INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
} from "../version/schema.js";

export function getVersionRecordById(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	version_id: string
):
	| {
			content: string;
	  }
	| undefined {
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

	// Bootstrap fallback: If this is the initial version during bootstrap, create a minimal version record
	if (!versionRecord && version_id === INITIAL_VERSION_ID) {
		versionRecord = {
			content: JSON.stringify({
				id: INITIAL_VERSION_ID,
				name: "main",
				change_set_id: INITIAL_CHANGE_SET_ID,
				working_change_set_id: INITIAL_WORKING_CHANGE_SET_ID,
			} satisfies LixVersion),
		};
	}

	// Bootstrap fallback: If this is the global version during bootstrap, create a minimal version record
	if (!versionRecord && version_id === "global") {
		versionRecord = {
			content: JSON.stringify({
				id: "global",
				name: "global",
				change_set_id: INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
				working_change_set_id: INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
			} satisfies LixVersion),
		};
	}

	return versionRecord;
}
