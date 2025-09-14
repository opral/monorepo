import { sql, type Kysely } from "kysely";
import { executeSync } from "../../database/execute-sync.js";
import { uuidV7Sync } from "../../engine/deterministic/index.js";
import type { LixEngine } from "../../engine/boot.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { NewStateAllRow, StateAllRow } from "../index.js";

type NewTransactionStateRow = Omit<NewStateAllRow, "snapshot_content"> & {
	snapshot_content: string | null;
};

export type TransactionStateRow = Omit<StateAllRow, "snapshot_content"> & {
	snapshot_content: string | null;
};

/**
 * Inserts a state change into the transaction stage.
 *
 * This function handles the TRANSACTION stage of the state mutation flow, where
 * changes are temporarily stored in the transaction table before being committed
 * to permanent storage. All changes (both tracked and untracked) are stored
 * in the transaction table until commit time.
 *
 * @param args.engine - The engine with SQLite database and Kysely query builder
 * @param args.data - The state data to insert, including entity details and snapshot
 * @param args.timestamp - Timestamp to use for the changes
 * @param args.createChangeAuthors - Whether to create change_author records (defaults to true)
 *
 * @returns The inserted state row with generated fields like change_id
 *
 * @example
 * // Insert a new entity state
 * insertTransactionState({
 *   engine: { sqlite, db, hooks },
 *   data: {
 *     entity_id: "user-123",
 *     schema_key: "user",
 *     file_id: "file1",
 *     plugin_key: "my-plugin",
 *     snapshot_content: JSON.stringify({ name: "John", email: "john@example.com" }),
 *     schema_version: "1.0",
 *     version_id: "version-abc",
 *     untracked: false
 *   }
 * });
 *
 * @example
 * // Delete an entity (null snapshot_content)
 * insertTransactionState({
 *   engine: { sqlite, db, hooks },
 *   data: {
 *     entity_id: "user-123",
 *     schema_key: "user",
 *     file_id: "file1",
 *     plugin_key: "my-plugin",
 *     snapshot_content: null, // Deletion
 *     schema_version: "1.0",
 *     version_id: "version-abc",
 *     untracked: false
 *   }
 * });
 */
export function insertTransactionState(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
	data: NewTransactionStateRow[];
	timestamp: string;
	createChangeAuthors?: boolean;
}): TransactionStateRow[] {
	const _timestamp = args.timestamp;
	const engine = args.engine;

	if (args.data.length === 0) {
		return [];
	}

	// Generate change IDs for all entities upfront
	const dataWithChangeIds = args.data.map((data) => ({
		...data,
		change_id: uuidV7Sync({ engine: engine as any }),
	}));

	// Batch insert into internal_transaction_state
	const transactionRows = dataWithChangeIds.map((data) => ({
		id: data.change_id,
		entity_id: data.entity_id,
		schema_key: data.schema_key,
		file_id: data.file_id,
		plugin_key: data.plugin_key,
		writer_key: sql`lix_get_writer_key()` as unknown as string | null,
		snapshot_content: data.snapshot_content
			? sql`jsonb(${data.snapshot_content})`
			: null,
		schema_version: data.schema_version,
		version_id: data.version_id,
		created_at: _timestamp,
		untracked: data.untracked === true ? 1 : 0,
	}));

	executeSync({
		engine,
		query: (engine.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_transaction_state")
			.values(transactionRows)
			.onConflict((oc) =>
				oc
					.columns(["entity_id", "file_id", "schema_key", "version_id"])
					.doUpdateSet((eb) => ({
						id: eb.ref("excluded.id"),
						plugin_key: eb.ref("excluded.plugin_key"),
						snapshot_content: eb.ref("excluded.snapshot_content"),
						schema_version: eb.ref("excluded.schema_version"),
						created_at: eb.ref("excluded.created_at"),
						untracked: eb.ref("excluded.untracked"),
						writer_key: eb.ref("excluded.writer_key"),
					}))
			),
	});

	// Return results for all data
	return dataWithChangeIds.map((data) => ({
		entity_id: data.entity_id,
		schema_key: data.schema_key,
		file_id: data.file_id,
		plugin_key: data.plugin_key,
		snapshot_content: data.snapshot_content,
		schema_version: data.schema_version,
		version_id: data.version_id,
		created_at: _timestamp,
		updated_at: _timestamp,
		untracked: data.untracked === true,
		writer_key: data.writer_key ?? null,
		inherited_from_version_id: null,
		change_id: data.change_id,
		commit_id: "pending",
	}));
}
