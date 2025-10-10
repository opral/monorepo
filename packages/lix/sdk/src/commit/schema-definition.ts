import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

export type LixCommit = FromLixSchemaDefinition<typeof LixCommitSchema>;

export const LixCommitSchema = {
	"x-lix-key": "lix_commit",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	"x-lix-foreign-keys": [
		{
			properties: ["/change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["/id"],
			},
			mode: "materialized",
		},
	],
	type: "object",
	properties: {
		id: {
			type: "string",
			description: "Commit identifier",
			"x-lix-default": "lix_uuid_v7()",
		},
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

export type LixCommitEdge = FromLixSchemaDefinition<typeof LixCommitEdgeSchema>;

export const LixCommitEdgeSchema = {
	"x-lix-key": "lix_commit_edge",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/parent_id", "/child_id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_own_entity"',
	},
	"x-lix-foreign-keys": [
		{
			properties: ["/parent_id"],
			references: {
				schemaKey: "lix_commit",
				properties: ["/id"],
			},
		},
		{
			properties: ["/child_id"],
			references: {
				schemaKey: "lix_commit",
				properties: ["/id"],
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
