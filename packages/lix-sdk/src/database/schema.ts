import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetEdgeSchema,
	LixChangeSetElementSchema,
	LixChangeSetSchema,
	type ChangeSetElementView,
	type ChangeSetView,
	type ChangeSetEdgeView,
} from "../change-set-v2/schema.js";
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
import {
	LixKeyValueSchema,
	type KeyValueView,
} from "../key-value-v2/schema.js";
import type { StateView } from "../state/schema.js";
import { LixFileSchema, type LixFileView } from "../file/schema.js";

export const LixDatabaseSchemaJsonColumns = {
	snapshot: ["content"],
	change_set: ["metadata"],
} as const;

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
	internal_change: InternalChangeTable;
	internal_snapshot: InternalSnapshotTable;
};

export const LixSchemaViewMap: Record<string, LixSchemaDefinition> = {
	active_version: LixActiveVersionSchema,
	version: LixVersionSchema,
	change_set: LixChangeSetSchema,
	change_set_element: LixChangeSetElementSchema,
	change_set_edge: LixChangeSetEdgeSchema,
	file: LixFileSchema,
	stored_schema: LixStoredSchemaSchema,
	key_value: LixKeyValueSchema,
	snapshot: LixSnapshotSchema,
};

export type LixDatabaseSchema = {
	state: StateView;
	// account
	// account: AccountTable;
	// active_account: ActiveAccountTable;

	// snapshot
	// snapshot: SnapshotTable;
	// label: LabelTable;

	// file
	file: LixFileView;
	// file_queue: FileQueueTable;

	// change
	// internal_change: InternalChangeTable;
	// internal_snapshot: InternalSnapshotTable;
	change: ChangeView;
	snapshot: SnapshotView;

	stored_schema: StoredSchemaView;

	// change set
	change_set: ChangeSetView;
	change_set_element: ChangeSetElementView;
	change_set_edge: ChangeSetEdgeView;
	// change_set_label: ChangeSetLabelTable;
	// change_set_thread: ChangeSetThreadTable;

	// // key value
	key_value: KeyValueView;

	// // change proposal
	// // change_proposal: ChangeProposalTable;

	// // thread
	// thread: ThreadTable;
	// thread_comment: ThreadCommentTable;

	// // version
	version: VersionView;
	active_version: ActiveVersionView;

	// // logging
	// log: LogTable;
};
// ----- tags -----

export type Label = Selectable<LabelTable>;
export type NewLabel = Insertable<LabelTable>;
export type LabelUpdate = Updateable<LabelTable>;
type LabelTable = {
	id: Generated<string>;
	name: string;
};
