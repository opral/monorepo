import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";
import { LixLabelSchema, type LixLabel } from "./schema-definition.js";

export { LixLabelSchema, type LixLabel } from "./schema-definition.js";

export function applyLabelDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	const { engine } = args;
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixLabelSchema,
		overrideName: "label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoIdSync({ engine: engine }) },
	});
}
