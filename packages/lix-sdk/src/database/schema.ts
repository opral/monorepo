/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export type LixDatabaseSchema = {
	file: LixFileTable;
	change_queue: ChangeQueueTable;
	change_edge: ChangeEdgeTable;
	snapshot: SnapshotTable;
	label: LabelTable;

	change: ChangeTable;

	// change set
	change_set: ChangeSetTable;
	change_set_element: ChangeSetElementTable;
	change_set_label: ChangeSetLabelTable;

	// discussion
	discussion: DiscussionTable;
	comment: CommentTable;

	// version
	current_version: CurrentVersionTable;
	version: VersionTable;
	version_change_conflict: VersionChangeConflictTable;

	// change conflicts
	change_conflict: ChangeConflictTable;
	change_conflict_resolution: ChangeConflictResolutionTable;
};

export type ChangeQueueEntry = Selectable<ChangeQueueTable>;
export type NewChangeQueueEntry = Insertable<ChangeQueueTable>;
export type ChangeQueueEntryUpdate = Updateable<ChangeQueueTable>;
type ChangeQueueTable = {
	id: Generated<number>;
	file_id: string;
	path_before: string | null;
	path_after: string | null;
	data_before: ArrayBuffer | null;
	data_after: ArrayBuffer | null;
	metadata_before: Record<string, any> | null;
	metadata_after: Record<string, any> | null;
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
	 * The schema key that the change refers to.
	 */
	schema_key: string;
	snapshot_id: string;
	/**
	 * The time the change was created.
	 */
	created_at: Generated<string>;
};

export type ChangeGraphEdge = Selectable<ChangeEdgeTable>;
export type NewChangeGraphEdge = Insertable<ChangeEdgeTable>;
type ChangeEdgeTable = {
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

// ------ change sets ------

export type ChangeSet = Selectable<ChangeSetTable>;
export type NewChangeSet = Insertable<ChangeSetTable>;
export type ChangeSetUpdate = Updateable<ChangeSetTable>;
type ChangeSetTable = {
	id: Generated<string>;
};

export type ChangeSetElement = Selectable<ChangeSetElementTable>;
export type NewChangeSetElement = Insertable<ChangeSetElementTable>;
export type ChangeSetElementUpdate = Updateable<ChangeSetElementTable>;
type ChangeSetElementTable = {
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
	content: string;
};

// ----- tags -----

export type Label = Selectable<LabelTable>;
export type NewLabel = Insertable<LabelTable>;
export type LabelUpdate = Updateable<LabelTable>;
type LabelTable = {
	id: Generated<string>;
	name: string;
};

export type ChangeSetLabel = Selectable<ChangeSetLabelTable>;
export type NewChangeSetLabel = Insertable<ChangeSetLabelTable>;
export type ChangeSetLabelUpdate = Updateable<ChangeSetLabelTable>;
type ChangeSetLabelTable = {
	change_set_id: string;
	label_id: string;
};

// ------ versiones ------

export type Version = Selectable<VersionTable>;
export type Newversion = Insertable<VersionTable>;
export type VersionUpdate = Updateable<VersionTable>;
type VersionTable = {
	id: Generated<string>;
	change_set_id: string;
	name: string | null;
};

export type VersionChangePointer = Selectable<VersionChangePointerTable>;
export type NewVersionChangePointer = Insertable<VersionChangePointerTable>;
export type VersionChangePointerUpdate = Updateable<VersionChangePointerTable>;
type VersionChangePointerTable = {
	version_id: string;
	change_id: string;
	change_file_id: string;
	change_entity_id: string;
	change_schema_key: string;
};

export type VersionChangeConflict = Selectable<VersionChangeConflictTable>;
export type NewversionChangeConflict = Insertable<VersionChangeConflictTable>;
export type VersionChangeConflictUpdate =
	Updateable<VersionChangeConflictTable>;
type VersionChangeConflictTable = {
	version_id: string;
	change_conflict_id: string;
};

export type Currentversion = Selectable<CurrentVersionTable>;
export type NewCurrentversion = Insertable<CurrentVersionTable>;
export type CurrentversionUpdate = Updateable<CurrentVersionTable>;
type CurrentVersionTable = {
	id: string;
};

// export type versionTarget = Selectable<versionTargetTable>;
// export type NewversionTarget = Insertable<versionTargetTable>;
// export type versionTargetUpdate = Updateable<versionTargetTable>;
// type versionTargetTable = {
// 	source_version_id: string;
// 	target_version_id: string;
// };

// -------- change conflicts --------

export type ChangeConflict = Selectable<ChangeConflictTable>;
export type NewChangeConflict = Insertable<ChangeConflictTable>;
export type ChangeConflictUpdate = Updateable<ChangeConflictTable>;
type ChangeConflictTable = {
	id: Generated<string>;
	/**
	 * The key is used to identify the conflict.
	 *
	 * The key should be unique for the plugin and the conflict
	 * to avoid duplicate conflict reports.
	 *
	 * @example
	 *   - `csv-row-order-changed`
	 *   - `inlang-message-bundle-foreign-key-violation`
	 */
	key: string;
	change_set_id: string;
};

export type ChangeConflictResolution =
	Selectable<ChangeConflictResolutionTable>;
export type NewChangeConflictResolution =
	Insertable<ChangeConflictResolutionTable>;
export type ChangeConflictResolutionUpdate =
	Updateable<ChangeConflictResolutionTable>;
type ChangeConflictResolutionTable = {
	change_conflict_id: string;
	resolved_change_id: string;
};
