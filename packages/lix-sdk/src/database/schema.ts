/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export type LixDatabaseSchema = {
	file: LixFileTable;
	change: ChangeTable;
	file_internal: LixFileTable;
	change_queue: ChangeQueueTable;
	change_graph_edge: ChangeGraphEdgeTable;
	conflict: ConflictTable;
	snapshot: SnapshotTable;

	// change set
	change_set: ChangeSetTable;
	change_set_item: ChangeSetItem;

	// discussion
	discussion: DiscussionTable;
	comment: CommentTable;
};

export type ChangeQueueEntry = Selectable<ChangeQueueTable>;
export type NewChangeQueueEntry = Insertable<ChangeQueueTable>;
export type ChangeQueueEntryUpdate = Updateable<ChangeQueueTable>;
type ChangeQueueTable = {
	id: Generated<number>;
	path: string;
	file_id: string;
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
	 * The type of change that was made.
	 *
	 * @example
	 *   - "cell" for csv cell change
	 *   - "message" for inlang message change
	 *   - "user" for a user change
	 */
	type: string;
	snapshot_id: string;
	/**
	 * The time the change was created.
	 */
	created_at: Generated<string>;
};

export type ChangeGraphEdge = Selectable<ChangeGraphEdgeTable>;
export type NewChangeGraphEdge = Insertable<ChangeGraphEdgeTable>;
type ChangeGraphEdgeTable = {
	parent_id: string;
	child_id: string;
};

export type Snapshot = Selectable<SnapshotTable>;
export type NewSnapshot = Insertable<SnapshotTable>;
type SnapshotTable = {
	id: Generated<string>;
	/**
	 * The value of the change.
	 *
	 * Lix interprets an undefined value as delete operation.
	 *
	 * @example
	 *   - For a csv cell change, the value would be the new cell value.
	 *   - For an inlang message change, the value would be the new message.
	 */
	content: Record<string, any> | null;
};

// TODO #185 rename content to snapshot_content
export type ChangeWithSnapshot = Change & { content: SnapshotTable["content"] };
export type NewChangeWithSnapshot = Omit<NewChange, "snapshot_id"> & {
	content: SnapshotTable["content"];
};

export type Conflict = Selectable<ConflictTable>;
export type NewConflict = Insertable<ConflictTable>;
export type ConflictUpdate = Updateable<ConflictTable>;
type ConflictTable = {
	change_id: string;
	conflicting_change_id: string;
	metadata: Record<string, any> | null;
	reason: string | null;
	/**
	 * The change id that the conflict was resolved with.
	 *
	 * Can be the change_id, conflicting_change_id, or another change_id
	 * that resulted from a merge.
	 */
	resolved_change_id: string | null;
};

// ------ change sets ------

export type ChangeSet = Selectable<ChangeSetTable>;
export type NewChangeSet = Insertable<ChangeSetTable>;
export type ChangeSetUpdate = Updateable<ChangeSetTable>;
type ChangeSetTable = {
	id: Generated<string>;
};

export type ChangeSetItem = Selectable<ChangeSetItemTable>;
export type NewChangeSetItem = Insertable<ChangeSetItemTable>;
export type ChangeSetItemUpdate = Updateable<ChangeSetItemTable>;
type ChangeSetItemTable = {
	change_set_id: string;
	change_id: string;
};

// ------ discussions ------

export type Discussion = Selectable<DiscussionTable>;
export type NewDiscussion = Insertable<DiscussionTable>;
export type DiscussionUpdate = Updateable<DiscussionTable>;
type DiscussionTable = {
	id: Generated<string>;
	change_set_id: string;
};

export type Comment = Selectable<CommentTable>;
export type NewComment = Insertable<CommentTable>;
export type CommentUpdate = Updateable<CommentTable>;
type CommentTable = {
	id: Generated<string>;
	parent_id: string | null;
	discussion_id: string;
	created_at: Generated<string>;
	body: string;
};
