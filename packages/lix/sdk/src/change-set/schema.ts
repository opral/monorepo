import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
} from "./schema-definition.js";

export function applyChangeSetDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks">;
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
			id: () => nanoIdSync({ engine: engine }),
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
