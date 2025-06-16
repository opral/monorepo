import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists, type StateEntityView, type StateEntityAllView } from "../state/entity-view-builder.js";
import { nanoid } from "../database/nano-id.js";

export function applyLogDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Create both primary and _all views for log
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixLogSchema,
		overrideName: "log",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoid() },
	});

	return sqlite;
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

// Common log entry structure to avoid duplication
type LogEntryBase = {
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
};

// Database view type (includes operational columns) - active version only
export type LogView = LogEntryBase & StateEntityView;

// Database view type for cross-version operations
export type LogAllView = LogEntryBase & StateEntityAllView;

// Kysely operation types
export type Log = Selectable<LogView>;
export type NewLog = Insertable<LogView>;
export type LogUpdate = Updateable<LogView>;
