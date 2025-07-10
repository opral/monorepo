import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
// import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoid } from "../database/nano-id.js";

export function applyLogDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Temporarily bypassing view logic - using real table for logs
	// createEntityViewsIfNotExists({
	// 	lix: { sqlite },
	// 	schema: LixLogSchema,
	// 	overrideName: "log",
	// 	pluginKey: "lix_own_entity",
	// 	hardcodedFileId: "lix",
	// 	defaultValues: { id: () => nanoid() },
	// });

	// Create real table for logs instead of using views
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS log (
			-- Schema properties from LixLogSchema
			id TEXT NOT NULL DEFAULT (lower(hex(randomblob(12)))),
			key TEXT NOT NULL,
			message TEXT NOT NULL,
			level TEXT NOT NULL,
			payload TEXT, -- JSON stored as TEXT
			
			-- Operational columns similar to state views
			lixcol_file_id TEXT NOT NULL DEFAULT 'lix',
			lixcol_inherited_from_version_id TEXT,
			lixcol_created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (lixcol_created_at LIKE '%Z'),
			lixcol_updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL CHECK (lixcol_updated_at LIKE '%Z'),
			lixcol_change_id TEXT NOT NULL DEFAULT (lower(hex(randomblob(12)))),
			lixcol_untracked INTEGER DEFAULT 0 NOT NULL,
			lixcol_change_set_id TEXT,
			
			PRIMARY KEY (id)
		) STRICT;

		-- Create trigger to update lixcol_updated_at on changes
		CREATE TRIGGER IF NOT EXISTS log_update_timestamp
		AFTER UPDATE ON log
		BEGIN
			UPDATE log 
			SET lixcol_updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
			WHERE id = NEW.id;
		END;

		-- Create index for common queries
		CREATE INDEX IF NOT EXISTS idx_log_key ON log(key);
		CREATE INDEX IF NOT EXISTS idx_log_level ON log(level);
		CREATE INDEX IF NOT EXISTS idx_log_created_at ON log(lixcol_created_at);
	`);

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
			"x-lix-generated": true,
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
		payload: {
			type: "object",
			description: "Additional structured data associated with the log entry",
			additionalProperties: true,
		},
	},
	required: ["id", "key", "message", "level"],
	additionalProperties: false,
} as const;
LixLogSchema satisfies LixSchemaDefinition;

// Pure business logic type (runtime/selectable type)
export type LixLog = FromLixSchemaDefinition<typeof LixLogSchema>;
