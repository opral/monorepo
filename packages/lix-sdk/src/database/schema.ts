import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
	LixChangeSetSchema,
	type ChangeSetElementView,
	type ChangeSetElementAllView,
	type ChangeSetView,
	type ChangeSetAllView,
	type ChangeSetEdgeView,
	type ChangeSetEdgeAllView,
	type ChangeSetLabelView,
	type ChangeSetLabelAllView,
	type ChangeSetThreadView,
	type ChangeSetThreadAllView,
} from "../change-set/schema.js";
import {
	LixActiveVersionSchema,
	LixVersionSchema,
	type ActiveVersionView,
	type VersionView,
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
} from "../stored-schema/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixKeyValueSchema, type KeyValueView, type KeyValueAllView } from "../key-value/schema.js";
import type {
	StateView,
	InternalStateCacheTable,
	InternalChangeInTransactionTable,
} from "../state/schema.js";
import { LixFileSchema, type LixFileView, type LixFileAllView } from "../file/schema.js";
import { LixLogSchema, type LogView, type LogAllView } from "../log/schema.js";
import {
	LixAccountSchema,
	type AccountView,
	type AccountAllView,
	type ActiveAccountTable,
} from "../account/schema.js";
import {
	LixChangeAuthorSchema,
	type ChangeAuthorView,
	type ChangeAuthorAllView,
} from "../change-author/schema.js";
import { LixLabelSchema, type LabelView, type LabelAllView } from "../label/schema.js";
import {
	LixThreadSchema,
	LixThreadCommentSchema,
	type ThreadView,
	type ThreadCommentView,
	type ThreadAllView,
	type ThreadCommentAllView,
} from "../thread/schema.js";
import { LixChangeSetThreadSchema } from "../change-set/schema.js";

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
	active_version: LixActiveVersionSchema,
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
	// account
	account: AccountView;
	account_all: AccountAllView;
	active_account: ActiveAccountTable;

	// snapshot
	snapshot: SnapshotView;
	label: LabelView;
	label_all: LabelAllView;

	// file
	file: LixFileView;
	file_all: LixFileAllView;

	// change
	change: ChangeView;
	change_author: ChangeAuthorView;
	change_author_all: ChangeAuthorAllView;

	stored_schema: StoredSchemaView;
	stored_schema_all: StoredSchemaAllView;

	// change set
	change_set: ChangeSetView;
	change_set_all: ChangeSetAllView;
	change_set_element: ChangeSetElementView;
	change_set_element_all: ChangeSetElementAllView;
	change_set_edge: ChangeSetEdgeView;
	change_set_edge_all: ChangeSetEdgeAllView;
	change_set_label: ChangeSetLabelView;
	change_set_label_all: ChangeSetLabelAllView;
	change_set_thread: ChangeSetThreadView;
	change_set_thread_all: ChangeSetThreadAllView;

	// key value
	key_value: KeyValueView;
	key_value_all: KeyValueAllView;

	// // change proposal
	// // change_proposal: ChangeProposalTable;

	// thread
	thread: ThreadView;
	thread_all: ThreadAllView;
	thread_comment: ThreadCommentView;
	thread_comment_all: ThreadCommentAllView;

	// version
	version: VersionView;
	active_version: ActiveVersionView;

	// logging
	log: LogView;
	log_all: LogAllView;
};
