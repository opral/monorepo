import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";
import { LixLogSchema } from "./schema-definition.js";

export function applyLogDatabaseSchema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}): void {
	const { engine } = args;
	// Create both primary and _all views for log
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixLogSchema,
		overrideName: "log",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => uuidV7Sync({ engine: engine }) },
	});
}
