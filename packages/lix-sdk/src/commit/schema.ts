import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Schema definition for commits.
 *
 * A commit represents state at a specific point in time and references
 * a change set that contains the actual changes.
 */
export const LixCommitSchema = {
	"x-lix-key": "lix_commit",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		id: { type: "string" },
		change_set_id: { type: "string" },
		// Step 1 (already in use): list of change ids that belong to this commit
		change_ids: { type: ["array", "null"], items: { type: "string" } },
		// Step 2: list of parent commit ids that this commit directly references
		parent_commit_ids: { type: ["array", "null"], items: { type: "string" } },
	},
	required: ["id", "change_set_id"],
	additionalProperties: false,
} as const;
LixCommitSchema satisfies LixSchemaDefinition;

/**
 * Schema definition for commit edges.
 *
 * Commit edges form a directed acyclic graph (DAG) that represents
 * the lineage of commits, replacing the previous change set edges.
 */
export const LixCommitEdgeSchema = {
	"x-lix-key": "lix_commit_edge",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["parent_id", "child_id"],
	"x-lix-foreign-keys": [
		{
			properties: ["parent_id"],
			references: {
				schemaKey: "lix_commit",
				properties: ["id"],
			},
		},
		{
			properties: ["child_id"],
			references: {
				schemaKey: "lix_commit",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		parent_id: { type: "string" },
		child_id: { type: "string" },
	},
	required: ["parent_id", "child_id"],
	additionalProperties: false,
} as const;
LixCommitEdgeSchema satisfies LixSchemaDefinition;

// Type definitions
export type LixCommit = FromLixSchemaDefinition<typeof LixCommitSchema>;
export type LixCommitEdge = FromLixSchemaDefinition<typeof LixCommitEdgeSchema>;

/**
 * Apply commit database schema by creating entity views for commits and commit edges.
 */
export function applyCommitDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	// Create commit views with UUID v7 as default ID
	createEntityViewsIfNotExists({
		lix,
		schema: LixCommitSchema,
		overrideName: "commit",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => uuidV7({ lix }),
		},
	});

	// Create commit edge views
	createEntityViewsIfNotExists({
		lix,
		schema: LixCommitEdgeSchema,
		overrideName: "commit_edge",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}
