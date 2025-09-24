import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { LixChangeAuthorSchema } from "./schema-definition.js";

export function applyChangeAuthorDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeQuerySync" | "executeSync">;
}): void {
	// Create change_author view using the generalized entity view builder
	const { engine } = args;
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixChangeAuthorSchema,
		overrideName: "change_author",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}
