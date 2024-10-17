import type {
	Change,
	ChangeWithSnapshot,
	LixFile,
	NewConflict,
	Snapshot,
} from "./database/schema.js";
import type { LixReadonly } from "./types.js";

// named lixplugin to avoid conflict with built-in plugin type
export type LixPlugin = {
	key: string;
	glob?: string;
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
		sourceLix: LixReadonly;
		targetLix: LixReadonly;
		/**
		 * Leaf changes that are only in the source lix.
		 *
		 * You can traverse the parents of the leaf changes to find
		 * conflicting changes in the target lix.
		 */
		leafChangesOnlyInSource: ChangeWithSnapshot[];
	}) => Promise<NewConflict[]>;
	applyChanges?: (args: {
		lix: LixReadonly;
		file: LixFile;
		changes: Array<ChangeWithSnapshot>;
	}) => Promise<{
		fileData: LixFile["data"];
	}>;
	// TODO multiple resolution strategies should be reported to the user
	// similar to fixable lint rules. We likely need to expose in
	// detect conflicts how conflicts could potentially be resolved.
	// `resolveConflict` would then be called with the selected strategy.
	tryResolveConflict?: () => Promise<
		{ success: true; change: Change } | { success: false }
	>;
};

/**
 * A detected change that lix ingests in to the database.
 *
 * If the snapshot is `undefined`, the change is considered to be a deletion.
 */
export type DetectedChange = {
	type: string;
	entity_id: string;
	/**
	 * The change is considered a deletion if `snapshot` is `undefined`.
	 */
	snapshot?: Snapshot["value"];
};
