import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
	LixChangeSetSchema,
	type ChangeSetElementView,
	type ChangeSetElementAllView,
	type ChangeSetElementHistoryView,
	type ChangeSetView,
	type ChangeSetAllView,
	type ChangeSetHistoryView,
	type ChangeSetEdgeView,
	type ChangeSetEdgeAllView,
	type ChangeSetEdgeHistoryView,
	type ChangeSetLabelView,
	type ChangeSetLabelAllView,
	type ChangeSetLabelHistoryView,
	type ChangeSetThreadView,
	type ChangeSetThreadAllView,
	type ChangeSetThreadHistoryView,
} from "../change-set/schema.js";
import {
	LixVersionSchema,
	type ActiveVersionTable,
	type VersionView,
	type VersionAllView,
	type VersionHistoryView,
} from "../version/schema.js";
import {
	LixSnapshotSchema,
	type InternalSnapshotTable,
	type SnapshotView,
} from "../snapshot/schema.js";
import {
	LixStoredSchemaSchema,
	type StoredSchemaView,
	type StoredSchemaAllView,
	type StoredSchemaHistoryView,
} from "../stored-schema/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixKeyValueSchema, type KeyValue } from "../key-value/schema.js";
import type {
	StateView,
	InternalStateCacheTable,
	InternalChangeInTransactionTable,
} from "../state/schema.js";
import type { StateHistoryView } from "../state-history/schema.js";
import {
	LixFileSchema,
	type LixFileView,
	type LixFileAllView,
	type LixFileHistoryView,
} from "../file/schema.js";
import { LixLogSchema } from "../log/schema.js";
import {
	LixAccountSchema,
	type AccountView,
	type AccountAllView,
	type AccountHistoryView,
	type ActiveAccountTable,
} from "../account/schema.js";
import {
	LixChangeAuthorSchema,
	type ChangeAuthorView,
	type ChangeAuthorAllView,
	type ChangeAuthorHistoryView,
} from "../change-author/schema.js";
import {
	LixLabelSchema,
	type LabelView,
	type LabelAllView,
	type LabelHistoryView,
} from "../label/schema.js";
import {
	LixThreadSchema,
	LixThreadCommentSchema,
	type ThreadComment,
} from "../thread/schema.js";
import { LixChangeSetThreadSchema } from "../change-set/schema.js";
import type { EntityViews } from "../entity-views/generic-types.js";

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
	state_active: StateView;
	state_history: StateHistoryView;
	// account
	account: AccountView;
	account_all: AccountAllView;
	account_history: AccountHistoryView;
	active_account: ActiveAccountTable;

	// snapshot
	snapshot: SnapshotView;
	label: LabelView;
	label_all: LabelAllView;
	label_history: LabelHistoryView;

	// file
	file: LixFileView;
	file_all: LixFileAllView;
	file_history: LixFileHistoryView;

	// change
	change: ChangeView;
	change_author: ChangeAuthorView;
	change_author_all: ChangeAuthorAllView;
	change_author_history: ChangeAuthorHistoryView;

	stored_schema: StoredSchemaView;
	stored_schema_all: StoredSchemaAllView;
	stored_schema_history: StoredSchemaHistoryView;

	// change set
	change_set: ChangeSetView;
	change_set_all: ChangeSetAllView;
	change_set_history: ChangeSetHistoryView;
	change_set_element: ChangeSetElementView;
	change_set_element_all: ChangeSetElementAllView;
	change_set_element_history: ChangeSetElementHistoryView;
	change_set_edge: ChangeSetEdgeView;
	change_set_edge_all: ChangeSetEdgeAllView;
	change_set_edge_history: ChangeSetEdgeHistoryView;
	change_set_label: ChangeSetLabelView;
	change_set_label_all: ChangeSetLabelAllView;
	change_set_label_history: ChangeSetLabelHistoryView;
	change_set_thread: ChangeSetThreadView;
	change_set_thread_all: ChangeSetThreadAllView;
	change_set_thread_history: ChangeSetThreadHistoryView;

	// // change proposal
	// // change_proposal: ChangeProposalTable;

	// version
	version: VersionView;
	version_all: VersionAllView;
	version_history: VersionHistoryView;
	active_version: ActiveVersionTable;
} & EntityViews<
	typeof LixKeyValueSchema,
	"key_value",
	{ value: KeyValue["value"] }
> &
	// -- logging
	EntityViews<typeof LixLogSchema, "log"> &
	// -- threads
	EntityViews<typeof LixThreadSchema, "thread"> &
	EntityViews<
		typeof LixThreadCommentSchema,
		"thread_comment",
		{ body: ThreadComment["body"] }
	>;

