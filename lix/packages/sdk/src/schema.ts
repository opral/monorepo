import type { LixPlugin } from "./plugin.js";

export type LixDatabase = {
	file: LixFile;
	change: Change;
	commit: Commit;
	ref: Ref;
	file_internal: LixFile;
	change_queue: ChangeQueueEntry;
	conflict: Conflict;
};

export type Ref = {
	name: string;
	commit_id: string;
};

export type ChangeQueueEntry = {
	id?: number;
	path: string;
	file_id: LixFile["id"];
	data: ArrayBuffer;
};

// named lix file to avoid conflict with built-in file type
export type LixFile = {
	id: string;
	path: string;
	data: ArrayBuffer;
};

export type Commit = {
	id: string; // uuid
	// todo:
	//  multiple authors can commit one change
	//  think of real-time collaboration scenarios
	author?: string;
	description: string;
	/**
	 * @deprecated use created_at instead
	 * todo remove before release
	 */
	created?: string;
	created_at?: string;
	parent_id: string;
	// @relation changes: Change[]
};

export type Change<
	T extends Record<string, any> = Record<string, { id: string }>,
> = {
	id: string;
	parent_id?: Change["id"];
	author?: string;
	file_id: LixFile["id"];
	/**
	 * If no commit id exists on a change,
	 * the change is considered uncommitted.
	 */
	commit_id?: Commit["id"];
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
	value?: T; // JSONB
	/**
	 * Additional metadata for the change used by the plugin
	 * to process changes.
	 */
	meta?: Record<string, any>; // JSONB
	/**
	 * The time the change was created.
	 */
	// TODO make selectable, updatable
	created_at?: string;
};

export type Conflict = {
	meta?: Record<string, any>;
	reason?: string;
	change_id: Change["id"];
	conflicting_change_id: Change["id"];
};
