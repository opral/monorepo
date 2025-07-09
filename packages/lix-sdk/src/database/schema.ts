import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
	LixChangeSetSchema,
} from "../change-set/schema.js";
import {
	LixVersionSchema,
	type ActiveVersion,
	// type ActiveVersionTable,
} from "../version/schema.js";
import { type InternalSnapshotTable } from "../snapshot/schema.js";
import { LixStoredSchemaSchema } from "../stored-schema/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixKeyValueSchema, type KeyValue } from "../key-value/schema.js";
import type {
	StateView,
	InternalStateCacheTable,
	InternalChangeInTransactionTable,
	StateAllView,
} from "../state/schema.js";
import type { StateHistoryView } from "../state-history/schema.js";
import { LixFileDescriptorSchema } from "../file/schema.js";
import { LixLogSchema } from "../log/schema.js";
import { LixAccountSchema, type ActiveAccount } from "../account/schema.js";
import { LixChangeAuthorSchema } from "../change-author/schema.js";
import { LixLabelSchema } from "../label/schema.js";
import {
	LixThreadSchema,
	LixThreadCommentSchema,
	type ThreadComment,
} from "../thread/schema.js";
import { LixChangeSetThreadSchema } from "../change-set/schema.js";
import type { EntityViews } from "../entity-views/entity-view-builder.js";
import type { ToKysely } from "../entity-views/types.js";

export const LixDatabaseSchemaJsonColumns = {
	snapshot: ["content"],
	change_set: ["metadata"],
} as const;

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
	internal_change_in_transaction: InternalChangeInTransactionTable;
	internal_change: InternalChangeTable;
	internal_snapshot: InternalSnapshotTable;
	internal_state_cache: InternalStateCacheTable;
};

export const LixSchemaViewMap: Record<string, LixSchemaDefinition> = {
	version: LixVersionSchema,
	change_set: LixChangeSetSchema,
	change_set_element: LixChangeSetElementSchema,
	change_set_edge: LixChangeSetEdgeSchema,
	change_set_label: LixChangeSetLabelSchema,
	change_set_thread: LixChangeSetThreadSchema,
	file: LixFileDescriptorSchema,
	log: LixLogSchema,
	stored_schema: LixStoredSchemaSchema,
	key_value: LixKeyValueSchema,
	account: LixAccountSchema,
	change_author: LixChangeAuthorSchema,
	label: LixLabelSchema,
	thread: LixThreadSchema,
	thread_comment: LixThreadCommentSchema,
};

export type LixDatabaseSchema = {
	active_account: ToKysely<ActiveAccount>;
	active_version: ToKysely<ActiveVersion>;

	state: StateView;
	state_all: StateAllView;
	state_history: StateHistoryView;

	change: ChangeView;
} & EntityViews<
	typeof LixKeyValueSchema,
	"key_value",
	{ value: KeyValue["value"] }
> &
	EntityViews<typeof LixAccountSchema, "account"> &
	EntityViews<typeof LixChangeSetSchema, "change_set"> &
	EntityViews<typeof LixChangeSetElementSchema, "change_set_element"> &
	EntityViews<typeof LixChangeSetEdgeSchema, "change_set_edge"> &
	EntityViews<typeof LixChangeSetLabelSchema, "change_set_label"> &
	EntityViews<typeof LixChangeSetThreadSchema, "change_set_thread"> &
	EntityViews<typeof LixChangeAuthorSchema, "change_author"> &
	EntityViews<typeof LixFileDescriptorSchema, "file", { data: Uint8Array }> &
	EntityViews<typeof LixLabelSchema, "label"> &
	EntityViews<typeof LixStoredSchemaSchema, "stored_schema", { value: any }> &
	EntityViews<typeof LixLogSchema, "log"> &
	EntityViews<typeof LixThreadSchema, "thread"> &
	EntityViews<
		typeof LixThreadCommentSchema,
		"thread_comment",
		{ body: ThreadComment["body"] }
	> &
	EntityViews<typeof LixVersionSchema, "version">;
