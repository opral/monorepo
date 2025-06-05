import type { Change } from "../change/schema.js";
import type { LixFile, LixFileType } from "../file/schema.js";
import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { Snapshot } from "../snapshot/schema.js";

// named lixplugin to avoid conflict with built-in plugin type
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
	}: {
		before?: LixFileType & { data?: Uint8Array };
		after: LixFileType & { data: Uint8Array };
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
		file: Omit<LixFile, "data" | "version_id"> & { data?: LixFile["data"] };
		changes: Array<Change & { snapshot_content: Snapshot["content"] }>;
	}) => { fileData: Uint8Array };
	/**
	 * UI components that are used to render the diff view.
	 */
	diffUiComponent?: CustomElementConstructor;
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

export type UiDiffComponentProps = {
	diffs: Array<
		Pick<Change, "entity_id" | "plugin_key" | "schema_key"> & {
			snapshot_content_before: Record<string, any> | null;
			snapshot_content_after: Record<string, any> | null;
		}
	>;
};
