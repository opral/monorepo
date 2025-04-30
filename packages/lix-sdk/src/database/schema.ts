import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type {
	AccountTable,
	ActiveAccountTable,
} from "../account/database-schema.js";
import type { KeyValueTable } from "../key-value/database-schema.js";
import type { ChangeSetEdgeTable } from "../change-set-edge/database-schema.js";
import type {
	ActiveVersionTable,
	VersionTable,
} from "../version/database-schema.js";
import type {
	ChangeSetElementTable,
	ChangeSetLabelTable,
	ChangeSetTable,
	ChangeSetThreadTable,
} from "../change-set/database-schema.js";
import type { FileQueueTable } from "../file-queue/database-schema.js";
import type {
	ThreadCommentTable,
	ThreadTable,
} from "../thread/database-schema.js";
import type { LixFileTable } from "../file/database-schema.js";
import type { SnapshotTable } from "../snapshot/database-schema.js";
import type { LogTable } from "../log/database-schema.js";

export type LixDatabaseSchema = {
	// account
	account: AccountTable;
	active_account: ActiveAccountTable;

	// snapshot
	snapshot: SnapshotTable;
	label: LabelTable;

	// file
	file: LixFileTable;
	file_queue: FileQueueTable;

	// change
	change: ChangeTable;
	change_author: ChangeAuthorTable;

	// change set
	change_set: ChangeSetTable;
	change_set_element: ChangeSetElementTable;
	change_set_label: ChangeSetLabelTable;
	change_set_edge: ChangeSetEdgeTable;
	change_set_thread: ChangeSetThreadTable;

	// key value
	key_value: KeyValueTable;

	// change proposal
	// change_proposal: ChangeProposalTable;

	// thread
	thread: ThreadTable;
	thread_comment: ThreadCommentTable;

	// version
	version: VersionTable;
	active_version: ActiveVersionTable;

	// logging
	log: LogTable;
};

export type Change = Selectable<ChangeTable>;
export type NewChange = Insertable<ChangeTable>;
type ChangeTable = {
	id: Generated<string>;
	/**
	 * The entity the change refers to.
	 */
	entity_id: string;
	file_id: string;
	/**
	 * The plugin key that contributed the change.
	 *
	 * Exists to ease querying for changes by plugin,
	 * in case the user changes the plugin configuration.
	 */
	plugin_key: string;
	/**
	 * The schema key that the change refers to.
	 */
	schema_key: string;
	snapshot_id: string;
	/**
	 * The time the change was created.
	 */
	created_at: Generated<string>;
};

export type ChangeAuthor = Selectable<ChangeAuthorTable>;
export type NewChangeAuthor = Insertable<ChangeAuthorTable>;
type ChangeAuthorTable = {
	change_id: string;
	account_id: string;
};

// ----- tags -----

export type Label = Selectable<LabelTable>;
export type NewLabel = Insertable<LabelTable>;
export type LabelUpdate = Updateable<LabelTable>;
type LabelTable = {
	id: Generated<string>;
	name: string;
};
