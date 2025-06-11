import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
	LixChangeSetSchema,
	type ChangeSetElementView,
	type ChangeSetView,
	type ChangeSetEdgeView,
	type ChangeSetLabelView,
	type ChangeSetThreadView,
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
} from "../stored-schema/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixKeyValueSchema, type KeyValueView } from "../key-value/schema.js";
import type { StateView, InternalStateCacheTable } from "../state/schema.js";
import { LixFileSchema, type LixFileView } from "../file/schema.js";
import { LixLogSchema, type LogView } from "../log/schema.js";
import {
	LixAccountSchema,
	type AccountView,
	type ActiveAccountTable,
} from "../account/schema.js";
import {
	LixChangeAuthorSchema,
	type ChangeAuthorView,
} from "../change-author/schema.js";
import { LixLabelSchema, type LabelView } from "../label/schema.js";
import {
	LixThreadSchema,
	LixThreadCommentSchema,
	type ThreadView,
	type ThreadCommentView,
} from "../thread/schema.js";
import { LixChangeSetThreadSchema } from "../change-set/schema.js";

export const LixDatabaseSchemaJsonColumns = {
	snapshot: ["content"],
	change_set: ["metadata"],
} as const;

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
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
	// account
	account: AccountView;
	active_account: ActiveAccountTable;

	// snapshot
	snapshot: SnapshotView;
	label: LabelView;

	// file
	file: LixFileView;

	// change
	change: ChangeView;
	change_author: ChangeAuthorView;

	stored_schema: StoredSchemaView;

	// change set
	change_set: ChangeSetView;
	change_set_element: ChangeSetElementView;
	change_set_edge: ChangeSetEdgeView;
	change_set_label: ChangeSetLabelView;
	change_set_thread: ChangeSetThreadView;

	// key value
	key_value: KeyValueView;

	// // change proposal
	// // change_proposal: ChangeProposalTable;

	// thread
	thread: ThreadView;
	thread_comment: ThreadCommentView;

	// version
	version: VersionView;
	active_version: ActiveVersionView;

	// logging
	log: LogView;
};
