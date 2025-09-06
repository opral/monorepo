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
// Note on change_set_id foreign key:
// We intentionally do NOT enforce an SQL foreign key from commit.change_set_id to lix_change_set.id.
// Rationale:
// - The commit snapshot (id, change_set_id, parent_commit_ids, change_ids) is the authoritative source of truth.
// - The change_set entity is materialized from the commit snapshot into the global cache (change_set_all)
//   by updateStateCache, removing any insert-order dependency (no chicken-and-egg commit→change_set creation).
// - Keeping the FK would force clients/tests to pre-create change sets before commits, which conflicts with the
//   changes-only materializer model and makes write paths brittle.
// - We still require change_set_id at the schema level for traceability, and the cache always exposes the
//   corresponding change_set row derived from the commit.
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
			mode: "materialized",
		},
	],
	// No SQL-level foreign key for change_set_id; see rationale above.
	type: "object",
	properties: {
		id: { type: "string", description: "Commit identifier" },
		change_set_id: {
			type: "string",
			description:
				"Identifier of the change set associated with this commit (materialized in cache)",
		},
		change_ids: {
			type: ["array", "null"],
			items: { type: "string" },
			description:
				"Domain change identifiers contained in this commit. Excludes meta changes; used to derive change_set_elements.",
		},
		author_account_ids: {
			type: ["array", "null"],
			items: { type: "string" },
			description:
				"Commit-level author account identifiers. Explicit per-change overrides live in lix_change_author.",
		},
		parent_commit_ids: {
			type: ["array", "null"],
			items: { type: "string" },
			description:
				"Direct parent commit identifiers; used to derive commit edges and ancestry.",
		},
		meta_change_ids: {
			type: ["array", "null"],
			items: { type: "string" },
			description:
				"Meta change identifiers (e.g., version tip) associated with this commit and kept separate from domain membership.",
		},
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

	// Create commit_edge views (read-only)
	createEntityViewsIfNotExists({
		lix,
		schema: LixCommitEdgeSchema,
		overrideName: "commit_edge",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		readOnly: true,
	});
}
