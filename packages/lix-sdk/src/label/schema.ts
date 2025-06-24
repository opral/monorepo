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

export function populateLabelRecords(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Insert the default checkpoint label if missing
	// (this is a workaround for not having a separate creation and migration schema)
	const sql = `
  INSERT INTO state (
    entity_id, 
    schema_key, 
    file_id, 
    plugin_key, 
    snapshot_content, 
    schema_version,
    version_id
  )
  SELECT 
    nano_id(), 
    'lix_label', 
    'lix', 
    'lix_own_entity', 
    json_object('id', nano_id(), 'name', 'checkpoint'), 
    '${LixLabelSchema["x-lix-version"]}',
    'global'
  WHERE NOT EXISTS (
    SELECT 1 
    FROM state 
    WHERE json_extract(snapshot_content, '$.name') = 'checkpoint'
    AND schema_key = 'lix_label'
    AND version_id = 'global'
  );
`;

	return sqlite.exec(sql);
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
