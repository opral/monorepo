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
	engine: Pick<LixEngine, "sqlite">;
}): void {
	// Create both primary and _all views for stored_schema with validation
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixStoredSchemaSchema,
		overrideName: "stored_schema",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}
