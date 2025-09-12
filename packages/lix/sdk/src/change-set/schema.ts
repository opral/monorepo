import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoIdSync } from "../runtime/deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";

export function applyChangeSetDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	// Create change_set view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix,
		schema: LixChangeSetSchema,
		overrideName: "change_set",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ lix }),
		},
	});

	// Create change_set_element views
	createEntityViewsIfNotExists({
		lix,
		schema: LixChangeSetElementSchema,
		overrideName: "change_set_element",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});

	// Create change_set_label views
	createEntityViewsIfNotExists({
		lix,
		schema: LixChangeSetLabelSchema,
		overrideName: "change_set_label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}

export const LixChangeSetSchema = {
	"x-lix-key": "lix_change_set",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		metadata: { type: "object", nullable: true },
	},
	required: ["id"],
	additionalProperties: false,
} as const;
LixChangeSetSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixChangeSet = FromLixSchemaDefinition<typeof LixChangeSetSchema>;

export const LixChangeSetElementSchema = {
	"x-lix-key": "lix_change_set_element",
	"x-lix-version": "1.0",
	"x-lix-foreign-keys": [
		{
			properties: ["change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["id"],
			},
		},
		{
			properties: ["change_id"],
			references: {
				schemaKey: "lix_change",
				properties: ["id"],
			},
		},
		{
			properties: ["schema_key"],
			references: {
				schemaKey: "lix_stored_schema",
				properties: ["key"],
			},
		},
	],
	"x-lix-primary-key": ["change_set_id", "change_id"],
	"x-lix-unique": [["change_set_id", "entity_id", "schema_key", "file_id"]],
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		change_id: { type: "string" },
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
	},
	required: [
		"change_set_id",
		"change_id",
		"entity_id",
		"schema_key",
		"file_id",
	],
	additionalProperties: false,
} as const;
LixChangeSetElementSchema satisfies LixSchemaDefinition;

export type LixChangeSetElement = FromLixSchemaDefinition<
	typeof LixChangeSetElementSchema
>;

export const LixChangeSetLabelSchema = {
	"x-lix-key": "lix_change_set_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["change_set_id", "label_id"],
	"x-lix-foreign-keys": [
		{
			properties: ["change_set_id"],
			references: {
				schemaKey: "lix_change_set",
				properties: ["id"],
			},
		},
		{
			properties: ["label_id"],
			references: {
				schemaKey: "lix_label",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		label_id: { type: "string" },
		metadata: { type: "object", nullable: true },
	},
	required: ["change_set_id", "label_id"],
	additionalProperties: false,
} as const;
LixChangeSetLabelSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixChangeSetLabel = FromLixSchemaDefinition<
	typeof LixChangeSetLabelSchema
>;
