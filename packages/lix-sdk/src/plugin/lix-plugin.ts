import type {
	ExperimentalChangeSchema,
	ExperimentalInferType,
} from "../change-schema/types.js";
import { type Change, type LixFile } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

// named lixplugin to avoid conflict with built-in plugin type
export type LixPlugin = {
	key: string;
	// TODO https://github.com/opral/lix-sdk/issues/37
	// idea:
	//   1. runtime reflection for lix on the change schema
	//   2. lix can validate the changes based on the schema
	// schema: {
	// 	bundle: Bundle,
	// 	message: Message,
	// 	variant: Variant,
	// },
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
	 * The function is invoked by lix based on the plugin's `glob` pattern.
	 */
	detectChanges?: (args: {
		before?: LixFile;
		after?: LixFile;
	}) => Promise<Array<DetectedChange>>;
	/**
	 * Detects changes from the source lix that conflict with changes in the target lix.
	 */
	detectConflicts?: (args: {
		lix: LixReadonly;
		changes: Array<Change>;
	}) => Promise<DetectedConflict[]>;
	applyChanges?: (args: {
		lix: LixReadonly;
		// todo a file can be-non existent
		// maybe it's better to remove the file from this api
		// and let the plugin handle the file selection and
		// , if needed, file creation
		file: LixFile;
		changes: Array<Change>;
	}) => Promise<{
		fileData: LixFile["data"];
	}>;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DetectedChange<Schema extends ExperimentalChangeSchema = any> = {
	entity_id: string;
	schema: Omit<ExperimentalChangeSchema, "schema">;
	/**
	 * The change is considered a deletion if `snapshot` is `undefined`.
	 */

	snapshot?: ExperimentalInferType<Schema>;
};

export type DetectedConflict = {
	/**
	 * @see {ChangeConflict.key}
	 */
	key: string;
	/**
	 * The changes that are conflicting.
	 */
	conflictingChangeIds: Set<Change["id"]>;
};

export type LixReadonly = Pick<Lix, "plugin"> & {
	db: {
		selectFrom: Lix["db"]["selectFrom"];
		withRecursive: Lix["db"]["withRecursive"];
	};
};
