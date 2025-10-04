import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { LixKeyValueSchema, type LixKeyValue } from "./schema-definition.js";

export function applyKeyValueDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	return createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixKeyValueSchema,
		overrideName: "key_value",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

/**
 * Schema definition for key-value pairs in Lix.
 *
 * Key-value pairs provide a flexible storage mechanism for configuration,
 * settings, and metadata within a Lix instance.
 */
