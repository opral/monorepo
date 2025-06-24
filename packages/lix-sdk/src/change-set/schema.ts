import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoid } from "../database/nano-id.js";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Create change_set view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixChangeSetSchema,
		overrideName: "change_set",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoid(),
		},
	});

	// Create change_set_element views
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixChangeSetElementSchema,
		overrideName: "change_set_element",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});

	// Create change_set_edge views
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixChangeSetEdgeSchema,
		overrideName: "change_set_edge",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});

	// Create change_set_thread views
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixChangeSetThreadSchema,
		overrideName: "change_set_thread",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});

	// Create change_set_label views
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixChangeSetLabelSchema,
		overrideName: "change_set_label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});

	return sqlite;
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
export type ChangeSet = FromLixSchemaDefinition<typeof LixChangeSetSchema>;

export const LixChangeSetElementSchema = {
	"x-lix-key": "lix_change_set_element",
	"x-lix-version": "1.0",
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		change_id: {
			schemaKey: "lix_change",
			property: "id",
		},
		schema_key: {
			schemaKey: "lix_stored_schema",
			property: "key",
		},
	},
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

export type ChangeSetElement = FromLixSchemaDefinition<
	typeof LixChangeSetElementSchema
>;

export const LixChangeSetEdgeSchema = {
	"x-lix-key": "lix_change_set_edge",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["parent_id", "child_id"],
	"x-lix-foreign-keys": {
		parent_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		child_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
	},
	type: "object",
	properties: {
		parent_id: { type: "string" },
		child_id: { type: "string" },
	},
	required: ["parent_id", "child_id"],
	additionalProperties: false,
} as const;
LixChangeSetEdgeSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type ChangeSetEdge = FromLixSchemaDefinition<
	typeof LixChangeSetEdgeSchema
>;

export const LixChangeSetLabelSchema = {
	"x-lix-key": "lix_change_set_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["change_set_id", "label_id"],
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		label_id: {
			schemaKey: "lix_label",
			property: "id",
		},
	},
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
export type ChangeSetLabel = FromLixSchemaDefinition<
	typeof LixChangeSetLabelSchema
>;

export const LixChangeSetThreadSchema = {
	"x-lix-key": "lix_change_set_thread",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["change_set_id", "thread_id"],
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		thread_id: {
			schemaKey: "lix_thread",
			property: "id",
		},
	},
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		thread_id: { type: "string" },
	},
	required: ["change_set_id", "thread_id"],
	additionalProperties: false,
} as const;
LixChangeSetThreadSchema satisfies LixSchemaDefinition;

export type ChangeSetThread = FromLixSchemaDefinition<
	typeof LixChangeSetThreadSchema
>;
