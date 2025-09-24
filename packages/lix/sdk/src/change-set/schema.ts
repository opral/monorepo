import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
} from "./schema-definition.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";

export function applyChangeSetDatabaseSchema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef" | "executeQuerySync"
	>;
}): void {
	const { engine } = args;
	// Create change_set view using the generalized entity view builder
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixChangeSetSchema,
		overrideName: "change_set",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => uuidV7Sync({ engine: engine }),
		},
	});

	// Create change_set_element views
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixChangeSetElementSchema,
		overrideName: "change_set_element",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});

	// Create change_set_label views
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixChangeSetLabelSchema,
		overrideName: "change_set_label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}
