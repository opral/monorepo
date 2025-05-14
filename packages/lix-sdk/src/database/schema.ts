import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	ChangeSetEdgeSchema,
	ChangeSetElementSchema,
	ChangeSetSchema,
	type ChangeSetElementView,
	type ChangeSetView,
	type ChangeSetEdgeView,
} from "../change-set-v2/schema.js";
import { VersionSchema, type VersionView } from "../version/schema.js";
import {
	SnapshotSchema,
	type InternalSnapshotTable,
	type SnapshotView,
} from "../snapshot/schema.js";
import { StoredSchemaSchema, type StoredSchemaView } from "../schema/schema.js";
import type { LixSchemaDefinition } from "../schema/definition.js";
import { KeyValueSchema, type KeyValueView } from "../key-value-v2/schema.js";
import type { EntityView } from "../entity-view/schema.js";

export const LixDatabaseSchemaJsonColumns = {
	snapshot: ["content"],
	change_set: ["metadata"],
} as const;

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
	internal_change: InternalChangeTable;
	internal_snapshot: InternalSnapshotTable;
};

export const LixSchemaMap: Record<string, LixSchemaDefinition> = {
	version: VersionSchema,
	change_set: ChangeSetSchema,
	change_set_element: ChangeSetElementSchema,
	change_set_edge: ChangeSetEdgeSchema,
	stored_schema: StoredSchemaSchema,
	key_value: KeyValueSchema,
	snapshot: SnapshotSchema,
};

export type LixDatabaseSchema = {
	entity: EntityView;
	// account
	// account: AccountTable;
	// active_account: ActiveAccountTable;

	// snapshot
	// snapshot: SnapshotTable;
	// label: LabelTable;

	// file
	// file: LixFileTable;
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
	// version: VersionTable;
	// active_version: ActiveVersionTable;

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
