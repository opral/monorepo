import { createEntityViewsIfNotExists } from "../../entity-views/entity-view-builder.js";
import type { LixEngine } from "../../engine/boot.js";
import { LixEntityLabelSchema } from "./schema-definition.js";

export function applyEntityLabelDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeQuerySync" | "executeSync">;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixEntityLabelSchema,
		overrideName: "entity_label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}
