import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { uuidV7Sync } from "../engine/functions/uuid-v7.js";
import type { LixEngine } from "../engine/boot.js";
import {
	LixCommitSchema,
	LixCommitEdgeSchema,
	type LixCommit,
	type LixCommitEdge,
} from "./schema-definition.js";

export {
	LixCommitSchema,
	LixCommitEdgeSchema,
	type LixCommit,
	type LixCommitEdge,
} from "./schema-definition.js";

/**
 * Apply commit database schema by creating entity views for commits and commit edges.
 */
export function applyCommitDatabaseSchema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef" | "executeQuerySync"
	>;
}): void {
	const { engine } = args;
	// Create commit views with UUID v7 as default ID
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixCommitSchema,
		overrideName: "commit",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => uuidV7Sync({ engine: engine }),
		},
	});

	// Create commit_edge views (read-only)
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixCommitEdgeSchema,
		overrideName: "commit_edge",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		readOnly: true,
	});
}
