import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
	LixChangeSetSchema,
} from "../change-set/schema.js";
import {
	LixVersionSchema,
	type ActiveVersionTable,
} from "../version/schema.js";
import {
	LixSnapshotSchema,
	type InternalSnapshotTable,
	type Snapshot,
} from "../snapshot/schema.js";
import { LixStoredSchemaSchema } from "../stored-schema/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixKeyValueSchema, type KeyValue } from "../key-value/schema.js";
import type {
	StateView,
	InternalStateCacheTable,
	InternalChangeInTransactionTable,
} from "../state/schema.js";
import type { StateHistoryView } from "../state-history/schema.js";
import { LixFileSchema } from "../file/schema.js";
import { LixLogSchema } from "../log/schema.js";
import {
	LixAccountSchema,
	type ActiveAccountTable,
} from "../account/schema.js";
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
	file: LixFileSchema,
	log: LixLogSchema,
	stored_schema: LixStoredSchemaSchema,
	key_value: LixKeyValueSchema,
	snapshot: LixSnapshotSchema,
	account: LixAccountSchema,
	change_author: LixChangeAuthorSchema,
	label: LixLabelSchema,
	thread: LixThreadSchema,
	thread_comment: LixThreadCommentSchema,
};

export type LixDatabaseSchema = {
	state: StateView;
	state_all: StateView;
	state_history: StateHistoryView;
	// account
	active_account: ActiveAccountTable;

	snapshot: ToKysely<Snapshot>;

	change: ChangeView;

	// // change proposal
	// // change_proposal: ChangeProposalTable;

	active_version: ActiveVersionTable;
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
	EntityViews<typeof LixFileSchema, "file", { data: Uint8Array }> &
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
