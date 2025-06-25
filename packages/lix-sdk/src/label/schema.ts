import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoid } from "../database/nano-id.js";

export function applyLabelDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Create both primary and _all views for label
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixLabelSchema,
		overrideName: "label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoid() },
	});

	return sqlite;
}

export const LixLabelSchema = {
	"x-lix-key": "lix_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixLabelSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type Label = FromLixSchemaDefinition<typeof LixLabelSchema>;
