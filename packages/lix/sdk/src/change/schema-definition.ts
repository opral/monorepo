import type { Insertable, Selectable, Generated } from "kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";

export type ChangeView = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	metadata?: Record<string, any> | null;
	created_at: Generated<string>;
	snapshot_content: Record<string, any> | null;
};

export type LixChange = Selectable<ChangeView>;
export type NewLixChange = Insertable<ChangeView>;

export type InternalChangeTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	snapshot_id: string;
	metadata?: Record<string, any> | null;
	created_at: Generated<string>;
};

export type InternalChange = Selectable<InternalChangeTable>;
export type NewInternalChange = Insertable<InternalChangeTable>;

/**
 * Raw change payload where `snapshot_content` remains as serialized JSON.
 *
 * Useful when piping changes between SQLite and the cache layer without
 * incurring double parse/serialize overhead.
 */
export type LixChangeRaw = Omit<LixChange, "snapshot_content" | "metadata"> & {
	snapshot_content: string | null;
	metadata?: string | null;
};

export const LixChangeSchema = {
	"x-lix-key": "lix_change",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-override-lixcols": {
		lixcol_file_id: '"lix"',
		lixcol_plugin_key: '"lix_sdk"',
	},
	type: "object",
	properties: {
		id: {
			type: "string",
			"x-lix-default": "lix_uuid_v7()",
		},
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		schema_version: { type: "string" },
		file_id: { type: "string" },
		plugin_key: { type: "string" },
		metadata: { type: ["object", "null"] },
		created_at: { type: "string" },
		snapshot_content: { type: ["object", "null"] },
	},
	required: [
		"id",
		"entity_id",
		"schema_key",
		"schema_version",
		"file_id",
		"plugin_key",
		"created_at",
	],
	additionalProperties: false,
} as const;
LixChangeSchema satisfies LixSchemaDefinition;

export type LixChangeSnapshot = FromLixSchemaDefinition<typeof LixChangeSchema>;
