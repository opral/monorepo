import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { ZettelDocJsonSchema, type ZettelDoc } from "@opral/zettel-ast";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoIdSync } from "../engine/deterministic/index.js";
import type { LixEngine } from "../engine/boot.js";

export function applyThreadDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	const { engine } = args;
	// Create both primary and _all views for thread with default ID generation
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixThreadSchema,
		overrideName: "thread",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: engine }),
		},
	});

	// Create both primary and _all views for thread_comment with default ID generation
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixThreadCommentSchema,
		overrideName: "thread_comment",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: engine }),
		},
	});
}

export const LixThreadSchema = {
	"x-lix-key": "lix_thread",
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
LixThreadSchema satisfies LixSchemaDefinition;

export const LixThreadCommentSchema = {
	"x-lix-key": "lix_thread_comment",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["thread_id"],
			references: {
				schemaKey: "lix_thread",
				properties: ["id"],
			},
		},
		{
			properties: ["parent_id"],
			references: {
				schemaKey: "lix_thread_comment",
				properties: ["id"],
			},
		},
	],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		thread_id: { type: "string" },
		parent_id: { type: "string", nullable: true },
		body: ZettelDocJsonSchema as any,
	},
	required: ["id", "thread_id", "body"],
	additionalProperties: false,
} as const;
LixThreadCommentSchema satisfies LixSchemaDefinition;

// Business logic types with LixGenerated markers
export type LixThread = FromLixSchemaDefinition<typeof LixThreadSchema>;
export type LixThreadComment = FromLixSchemaDefinition<
	typeof LixThreadCommentSchema
> & {
	body: ZettelDoc; // Override the body type
};
