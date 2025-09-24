import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import {
	LixStoredSchemaSchema,
	type LixStoredSchema,
} from "./schema-definition.js";

export {
	LixStoredSchemaSchema,
	type LixStoredSchema,
} from "./schema-definition.js";

export function applyStoredSchemaDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeQuerySync" | "executeSync">;
}): void {
	// Create both primary and _all views for stored_schema with validation
	createEntityViewsIfNotExists({
		engine: args.engine,
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
