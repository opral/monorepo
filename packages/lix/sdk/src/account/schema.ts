import type { LixEngine } from "../engine/boot.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { LixActiveAccountSchema } from "./schema-definition.js";

export function applyAccountDatabaseSchema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}): void {
	const { engine } = args;

	// createEntityViewsIfNotExists({
	// 	engine,
	// 	schema: LixActiveAccountSchema,
	// 	overrideName: "active_account",
	// 	pluginKey: "lix_own_entity",
	// 	hardcodedFileId: "lix",
	// 	hardcodedVersionId: "global",
	// });
}
