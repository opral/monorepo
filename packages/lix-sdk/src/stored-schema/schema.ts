import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";

export function applyStoredSchemaDatabaseSchema(
	sqlite: SqliteWasmDatabase
): void {
	// Create both primary and _all views for stored_schema with validation
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixStoredSchemaSchema,
		overrideName: "stored_schema",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			key: (row) => row.value?.["x-lix-key"] || "",
			version: (row) => row.value?.["x-lix-version"] || "",
		},
		validation: {
			onInsert: [
				{
					condition:
						"NEW.key IS NULL OR NEW.key = json_extract(NEW.value, '$.x-lix-key')",
					errorMessage: `Inserted key does not match value.x-lix-key: key=" || NEW.key || " x-lix-key=" || json_extract(NEW.value, '$.x-lix-key')`,
				},
				{
					condition:
						"NEW.version IS NULL OR NEW.version = json_extract(NEW.value, '$.x-lix-version')",
					errorMessage: `Inserted version does not match value.x-lix-version: version=" || NEW.version || " x-lix-version=" || json_extract(NEW.value, '$.x-lix-version')`,
				},
			],
			onUpdate: [
				{
					condition: "0", // Always fail
					errorMessage:
						"Schemas are immutable and cannot be updated for backwards compatibility. Bump the version number instead.",
				},
			],
		},
	});
}

export const LixStoredSchemaSchema = {
	"x-lix-key": "lix_stored_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["key", "version"],
	type: "object",
	properties: {
		key: { type: "string", "x-lix-generated": true },
		version: { type: "string", "x-lix-generated": true },
		value: JSONTypeSchema as any,
	},
	additionalProperties: false,
} as const;

LixStoredSchemaSchema satisfies LixSchemaDefinition;

export type StoredSchema = FromLixSchemaDefinition<
	typeof LixStoredSchemaSchema
> & {
	// override the value to any to allow any JSON type (instead of unknown which is annoying)
	value: any;
};
