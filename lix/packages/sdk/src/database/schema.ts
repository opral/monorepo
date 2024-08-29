import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { LixPlugin } from "../plugin.js";

export type LixDatabaseSchema = {
	file: LixFileTable;
	change: ChangeTable;
	commit: CommitTable;
	ref: RefTable;
	file_internal: LixFileTable;
	change_queue: ChangeQueueTable;
	conflict: ConflictTable;
};

export type Ref = Selectable<RefTable>;
export type NewRef = Insertable<RefTable>;
export type RefUpdate = Updateable<RefTable>;
type RefTable = {
	name: string;
	commit_id: string;
};

export type ChangeQueueEntry = Selectable<ChangeQueueTable>;
export type NewChangeQueueEntry = Insertable<ChangeQueueTable>;
export type ChangeQueueEntryUpdate = Updateable<ChangeQueueTable>;
type ChangeQueueTable = {
	id: Generated<number>;
	path: string;
	file_id: LixFileTable["id"];
	data: ArrayBuffer;
};

// named lix file to avoid conflict with built-in file type
export type LixFile = Selectable<LixFileTable>;
export type NewLixFile = Insertable<LixFileTable>;
export type LixFileUpdate = Updateable<LixFileTable>;
type LixFileTable = {
	id: Generated<string>;
	path: string;
	data: ArrayBuffer;
};

export type Commit = Selectable<CommitTable>;
export type NewCommit = Insertable<CommitTable>;
export type CommitUpdate = Updateable<CommitTable>;
type CommitTable = {
	id: Generated<string>;
	// todo:
	//  multiple authors can commit one change
	//  think of real-time collaboration scenarios
	author?: string;
	description: string;
	/**
	 * @deprecated use created_at instead
	 * todo remove before release
	 */
	created: Generated<string>;
	created_at: Generated<string>;
	parent_id: string;
};

export type Change = Selectable<ChangeTable>;
export type NewChange = Insertable<ChangeTable>;
export type ChangeUpdate = Updateable<ChangeTable>;
type ChangeTable = {
	id: Generated<string>;
	parent_id?: ChangeTable["id"];
	author?: string;
	file_id: string;
	/**
	 * If no commit id exists on a change,
	 * the change is considered uncommitted.
	 */
	commit_id?: CommitTable["id"];
	/**
	 * The plugin key that contributed the change.
	 *
	 * Exists to ease querying for changes by plugin,
	 * in case the user changes the plugin configuration.
	 */
	plugin_key: LixPlugin["key"];
	/**
	 * The operation that was performed.
	 *
	 * The operation is taken from the diff reports.
	 */
	operation: "create" | "update" | "delete";

	/**
	 * The type of change that was made.
	 *
	 * @example
	 *   - "cell" for csv cell change
	 *   - "message" for inlang message change
	 *   - "user" for a user change
	 */
	type: string;
	/**
	 * The value of the change.
	 *
	 * The value is `undefined` for a delete operation.
	 *
	 * @example
	 *   - For a csv cell change, the value would be the new cell value.
	 *   - For an inlang message change, the value would be the new message.
	 */
	value?: Record<string, any> & { id: string };
	/**
	 * Additional metadata for the change used by the plugin
	 * to process changes.
	 */
	meta?: Record<string, any>; // JSONB
	/**
	 * The time the change was created.
	 */
	created_at: Generated<string>;
};

export type Conflict = Selectable<ConflictTable>;
export type NewConflict = Insertable<ConflictTable>;
export type ConflictUpdate = Updateable<ConflictTable>;
type ConflictTable = {
	meta?: Record<string, any>;
	reason?: string;
	change_id: ChangeTable["id"];
	conflicting_change_id: ChangeTable["id"];
	/**
	 * The change id that the conflict was resolved with.
	 *
	 * Can be the change_id, conflicting_change_id, or another change_id
	 * that resulted from a merge.
	 */
	resolved_with_change_id?: ChangeTable["id"];
};
