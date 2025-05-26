import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";

export function applyLogDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
	CREATE VIEW IF NOT EXISTS log AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
		json_extract(snapshot_content, '$.key') AS key,
		json_extract(snapshot_content, '$.message') AS message,
		json_extract(snapshot_content, '$.level') AS level,
		created_at,
		version_id
	FROM state
	WHERE schema_key = 'lix_log';

	CREATE TRIGGER IF NOT EXISTS log_insert
	INSTEAD OF INSERT ON log
	BEGIN
		INSERT INTO state (entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id)
		SELECT
			with_default_values.id,
			'lix_log',
			'lix',
			'lix_own_entity',
			json_object(
				'id', with_default_values.id,
				'key', NEW.key,
				'message', NEW.message,
				'level', NEW.level
			),
			'${LixLogSchema["x-lix-version"]}',
			COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
		FROM (
			SELECT
				COALESCE(NEW.id, nano_id()) AS id
		) AS with_default_values;
	END;

CREATE TRIGGER IF NOT EXISTS log_delete
	INSTEAD OF DELETE ON log
	BEGIN
		DELETE FROM state
		WHERE entity_id = OLD.id
		AND schema_key = 'lix_log'
		AND file_id = 'lix'
		AND version_id = OLD.version_id;
	END;
`);
}

export const LixLogSchema = {
	"x-lix-key": "lix_log",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: {
			type: "string",
			description: "The unique identifier of the log entry",
		},
		key: {
			type: "string",
			description: "The key of the log entry",
		},
		message: {
			type: "string",
			description: "The message of the log entry",
		},
		level: {
			type: "string",
			description: "The level of the log entry",
		},
	},
	required: ["id", "key", "message", "level"],
} as const;
LixLogSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixLog = FromLixSchemaDefinition<typeof LixLogSchema>;

// Database view type (includes operational columns)
export type LogView = {
	/**
	 * The unique identifier of the log entry.
	 */
	id: Generated<string>;
	/**
	 * The key of the log entry.
	 *
	 * @example "lix.file_queue.skipped"
	 */
	key: string;
	/**
	 * The message of the log entry.
	 *
	 * @example "Something went wrong"
	 */
	message: string;
	/**
	 * The level of the log entry.
	 *
	 * @example "debug", "info", "warning", "error"
	 */
	level: string;
	/**
	 * The timestamp when the log entry was first created.
	 *
	 * Computed from the underlying change timestamps.
	 */
	created_at: Generated<string>;
	/**
	 * The version this log entry belongs to.
	 */
	version_id: Generated<string>;
};

// Kysely operation types
export type Log = Selectable<LogView>;
export type NewLog = Insertable<LogView>;
export type LogUpdate = Updateable<LogView>;
