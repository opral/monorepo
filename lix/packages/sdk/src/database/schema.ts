import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { LixPlugin } from "../plugin.js";

export type LixDatabaseSchema = {
	file: LixFileTable;
	change: ChangeTable;
	change_view: ChangeView;
	branch: BranchTable;
	branch_change: BranchChangeMappingTable;
	file_internal: LixFileTable;
	change_queue: ChangeQueueTable;
	conflict: ConflictTable;

	// discussion
	discussion: DiscussionTable;
	comment: CommentTable;
	discussion_change_map: DiscussionChangeMapTable;
};

export type Ref = Selectable<BranchTable>;
export type NewRef = Insertable<BranchTable>;
export type RefUpdate = Updateable<BranchTable>;
type BranchTable = {
	id: Generated<string>;
	name: string;
	base_branch?: string;
	active: boolean;
};

type BranchChangeMappingTable = {
	id: Generated<string>;
	change_id: ChangeTable["id"];
	branch_id: BranchTable["id"];
	seq: number;
};

export type ChangeQueueEntry = Selectable<ChangeQueueTable>;
export type NewChangeQueueEntry = Insertable<ChangeQueueTable>;
export type ChangeQueueEntryUpdate = Updateable<ChangeQueueTable>;
type ChangeQueueTable = {
	id: Generated<number>;
	path: string;
	file_id: LixFileTable["id"];
	metadata: Record<string, any> | null;
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
	metadata: Record<string, any> | null;
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

export type ChangeView = ChangeTable & {
	branch_id: BranchTable["id"];
	seq: BranchChangeMappingTable["seq"];
};

export type Conflict = Selectable<ConflictTable>;
export type NewConflict = Insertable<ConflictTable>;
export type ConflictUpdate = Updateable<ConflictTable>;
type ConflictTable = {
	meta?: Record<string, any>;
	reason?: string;
	change_id: ChangeTable["id"];
	branch_id: BranchTable["id"];
	conflicting_change_id: ChangeTable["id"];
	/**
	 * The change id that the conflict was resolved with.
	 *
	 * Can be the change_id, conflicting_change_id, or another change_id
	 * that resulted from a merge.
	 */
	resolved_with_change_id?: ChangeTable["id"];
};

// ------ discussions ------

export type Discussion = Selectable<DiscussionTable>;
export type DiscussionUpdate = Updateable<DiscussionTable>;
type DiscussionTable = {
	id: Generated<string>;
};

export type DiscussionChangeMap = Selectable<DiscussionChangeMapTable>;
export type NewDiscussionChangeMap = Insertable<DiscussionChangeMapTable>;
export type DiscussionChangeMapUpdate = Updateable<DiscussionChangeMapTable>;
type DiscussionChangeMapTable = {
	change_id: string;
	discussion_id: string;
};

export type Comment = Selectable<CommentTable>;
export type NewComment = Insertable<CommentTable>;
export type CommentUpdate = Updateable<CommentTable>;
type CommentTable = {
	id: Generated<string>;
	parent_id?: string;
	discussion_id: string;
	author_id: string;
	created_at: Generated<string>;
	body: string;
};
