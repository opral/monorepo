import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
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
export type Log = FromLixSchemaDefinition<typeof LixLogSchema>;
