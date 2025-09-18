import type { LixChange } from "../change/schema.js";
import type { LixFile } from "../filesystem/file/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import type { QuerySync } from "./query-sync.js";

export type LixPlugin = {
	key: string;
	/**
	 * The glob pattern that should invoke `detectChanges()`.
	 *
	 * @example
	 *   `**\/*.json` for all JSON files
	 *   `**\/*.inlang` for all inlang files
	 */
	detectChangesGlob?: string;
	/**
	 * Detects changes between the `before` and `after` file update(s).
	 *
	 * `Before` is `undefined` if the file did not exist before (
	 * the file was created).
	 *
	 * `After` is always defined. Either the file was updated, or
	 * deleted. If the file is deleted, lix own change control
	 * will handle the deletion. Hence, `after` is always be defined.
	 */
	detectChanges?: ({
		before,
		after,
		querySync,
	}: {
		before?: Omit<LixFile, "data"> & { data?: Uint8Array };
		after: Omit<LixFile, "data"> & { data: Uint8Array };
		/**
		 * Build synchronous SQL queries.
		 *
		 * Detecting changes can require reading current state to preserve stable
		 * entity ids, compare snapshots, or infer ordering without reparsing
		 * files.
		 *
		 * Why is a sync possible and allowed?
		 *
		 * The engine can run in a separate thread/process. SQLite executes
		 * queries synchronously and the engine cannot await async calls to the
		 * host thread during `detectChanges()`. `querySync` provides a Kysely
		 * builder whose `.execute()` runs synchronously inside the engine.
		 *
		 * @example
		 * detectChanges: ({ after, querySync }) => {
		 *   const rows = querySync('state')
		 *     .where('file_id', '=', after.id)
		 *     .where('plugin_key', '=', 'plugin_md')
		 *     .select(['entity_id', 'schema_key', 'snapshot_content'])
		 *     .execute()
		 *   const latestById = new Map(rows.map(r => [r.entity_id, r]))
		 *   // ...use latestById to assign/reuse ids in emitted changes...
		 *   return []
		 * }
		 */
		querySync: QuerySync;
	}) => DetectedChange[];
	applyChanges?: ({
		file,
		changes,
	}: {
		/**
		 * The file to which the changes should be applied.
		 *
		 * The `file.data` might be undefined if the file does not
		 * exist at the time of applying the changes. This can
		 * happen when merging a version that created a new file
		 * that did not exist in the target version. Or, a file
		 * has been deleted and should be restored at a later point.
		 */
		file: Omit<LixFile, "data"> & { data?: Uint8Array };
		changes: Array<LixChange>;
	}) => { fileData: Uint8Array };
	/**
	 * UI components that are used to render the diff view.
	 */
	/**
	 * Render the diff for this plugin as HTML.
	 *
	 * Hosts can insert the returned markup directly or scope it inside a
	 * ShadowRoot. The HTML should rely on CSS custom properties (e.g.
	 * `--lix-diff-*`) instead of hardcoded colors so environments can theme it.
	 *
	 * @example
	 * const html = await plugin.renderDiff?.({ diffs })
	 * container.innerHTML = html ?? ""
	 */
	renderDiff?: (args: RenderDiffArgs) => Promise<string>;
	/**
	 * Detects changes from the source lix that conflict with changes in the target lix.
	 */
	// detectConflicts?: (args: {
	// 	lix: LixReadonly;
	// 	changes: Array<Change>;
	// }) => Promise<DetectedConflict[]>;
	// // TODO multiple resolution strategies should be reported to the user
	// // similar to fixable lint rules. We likely need to expose in
	// // detect conflicts how conflicts could potentially be resolved.
	// // `resolveConflict` would then be called with the selected strategy.
	// tryResolveConflict?: () => Promise<
	// 	{ success: true; change: Change } | { success: false }
	// >;
};

/**
 * A detected change that lix ingests in to the database.
 *
 * - If the `snapshot` is `undefined`, the change is considered to be a deletion.
 * - The `schema` type can be narrowed by providing a change schema.
 *
 * @example
 *   Type narrowing with a change schema:
 *
 *   ```
 * 	 const FooV1Schema = {
 *     key: "plugin-name-foo-v1",
 *     type: "json",
 *     schema: {
 *       type: "object",
 *       properties: {
 *         name: { type: "string" },
 * 		   }
 *     }
 *   } as const satisfies ChangeSchema;
 *
 *   const detectedChange: DetectedChange<typeof FooV1Schema>
 *
 *   detectedChange.snapshot.name // string
 *   ```
 */

export type DetectedChange<T = any> = {
	entity_id: string;
	schema: LixSchemaDefinition;
	/**
	 * The change is considered a deletion if `snapshot_content` is `null`.
	 */
	snapshot_content: T | null;
};

// export type DetectedConflict = {
// 	/**
// 	 * @see {ChangeConflict.key}
// 	 */
// 	key: string;
// 	/**
// 	 * The changes that are conflicting.
// 	 */
// 	conflictingChangeIds: Set<Change["id"]>;
// };

export type RenderDiffArgs = {
	diffs: Array<
		Pick<LixChange, "entity_id" | "plugin_key" | "schema_key"> & {
			before_snapshot_content: Record<string, any> | null;
			after_snapshot_content: Record<string, any> | null;
		}
	>;
};
