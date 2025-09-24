import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { LixChangeProposalSchema } from "./schema-definition.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";

export function applyChangeProposalDatabaseSchema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef" | "executeQuerySync"
	>;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixChangeProposalSchema,
		overrideName: "change_proposal",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		hardcodedVersionId: "global",
		defaultValues: {
			id: () => uuidV7Sync({ engine: args.engine }),
			status: () => "open",
		},
	});
}
