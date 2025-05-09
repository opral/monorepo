import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type {
	ChangeView,
	InternalChangeTable,
	InternalSnapshotTable,
	SnapshotView,
} from "../change/schema.js";
import type { ChangeSetView } from "../change-set-v2/schema.js";

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
	internal_change: InternalChangeTable;
	internal_snapshot: InternalSnapshotTable;
};

export type LixDatabaseSchema = {
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

	// change set
	change_set: ChangeSetView;
	// change_set: ChangeSetTable;
	// change_set_element: ChangeSetElementTable;
	// change_set_label: ChangeSetLabelTable;
	// change_set_edge: ChangeSetEdgeTable;
	// change_set_thread: ChangeSetThreadTable;

	// // key value
	// key_value: KeyValueTable;
	// key_value_v2: KeyValueV2Table;

	// // change proposal
	// // change_proposal: ChangeProposalTable;

	// // thread
	// thread: ThreadTable;
	// thread_comment: ThreadCommentTable;

	// // version
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
