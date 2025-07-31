import { type Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixDatabaseSchema,
	LixInternalDatabaseSchema,
} from "../database/schema.js";
import { timestamp } from "../deterministic/index.js";
import { insertTransactionState } from "./insert-transaction-state.js";

export function handleStateMutation(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	entity_id: string,
	schema_key: string,
	file_id: string,
	plugin_key: string,
	snapshot_content: string | null, // stringified json
	version_id: string,
	schema_version: string
): 0 | 1 {
	// Use consistent timestamp for both changes and cache
	const currentTime = timestamp({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
	});

	insertTransactionState({
		lix: { sqlite, db },
		data: {
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content: snapshot_content, // Now supports null for deletions
			schema_version,
			version_id,
			untracked: false, // tracked entity
		},
		timestamp: currentTime,
	});

	return 0;
}
