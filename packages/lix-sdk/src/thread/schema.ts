import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { ZettelDocJsonSchema, type ZettelDoc } from "@opral/zettel-ast";
import {
	createEntityViewsIfNotExists,
	type StateEntityView,
	type StateEntityAllView,
} from "../entity-views/entity-view-builder.js";
import { type StateEntityHistoryView } from "../entity-views/entity-state-history.js";

export function applyThreadDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	// Create both primary and _all views for thread with default ID generation
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixThreadSchema,
		overrideName: "thread",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => "nano_id()",
		},
	});

	// Create both primary and _all views for thread_comment with default ID generation
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixThreadCommentSchema,
		overrideName: "thread_comment",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => "nano_id()",
		},
	});

	return sqlite;
}

export const LixThreadSchema = {
	"x-lix-key": "lix_thread",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
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
	"x-lix-foreign-keys": {
		thread_id: {
			schemaKey: "lix_thread",
			property: "id",
		},
		parent_id: {
			schemaKey: "lix_thread_comment",
			property: "id",
		},
	},
	type: "object",
	properties: {
		id: { type: "string" },
		thread_id: { type: "string" },
		parent_id: { type: "string", nullable: true },
		body: ZettelDocJsonSchema as any,
	},
	required: ["id", "thread_id", "body"],
	additionalProperties: false,
} as const;
LixThreadCommentSchema satisfies LixSchemaDefinition;

// Pure business logic types
export type LixThread = FromLixSchemaDefinition<typeof LixThreadSchema>;
export type LixThreadComment = Omit<
	FromLixSchemaDefinition<typeof LixThreadCommentSchema>,
	"body"
> & { body: ZettelDoc };

// Database view types (active version only)
export type ThreadView = {
	id: Generated<string>;
	metadata: Record<string, any> | null;
} & StateEntityView;

export type ThreadCommentView = {
	id: Generated<string>;
	thread_id: string;
	parent_id: string | null;
	body: ZettelDoc;
} & StateEntityView;

// Database view types for cross-version operations
export type ThreadAllView = {
	id: Generated<string>;
	metadata: Record<string, any> | null;
} & StateEntityAllView;

export type ThreadCommentAllView = {
	id: Generated<string>;
	thread_id: string;
	parent_id: string | null;
	body: ZettelDoc;
} & StateEntityAllView;

// Database view type for historical operations
export type ThreadHistoryView = {
	id: Generated<string>;
	metadata: Record<string, any> | null;
} & StateEntityHistoryView;

export type ThreadCommentHistoryView = {
	id: Generated<string>;
	thread_id: string;
	parent_id: string | null;
	body: ZettelDoc;
} & StateEntityHistoryView;

// Kysely operation types
export type Thread = Selectable<ThreadView>;
export type NewThread = Insertable<ThreadView>;
export type ThreadUpdate = Updateable<ThreadView>;

export type ThreadComment = Selectable<ThreadCommentView>;
export type NewThreadComment = Insertable<ThreadCommentView>;
export type ThreadCommentUpdate = Updateable<ThreadCommentView>;
