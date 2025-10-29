import type { Generated } from "kysely";
import type { LixGenerated } from "../../schema-definition/definition.js";

/**
 * Base type for entity history views that include historical data from the state_history table.
 * These views provide access to entity states at different points in change set history,
 * enabling features like blame functionality and historical diffs.
 *
 * History views are read-only and show how entities evolved over time through changes.
 *
 * @example
 * ```typescript
 * // Define an entity history view type
 * export type AccountHistoryView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityHistoryView;
 *
 * // Query entity history at a specific commit
 * const history = await lix.db
 *   .selectFrom("account_history")
 *   .where("lixcol_commit_id", "=", commitId)
 *   .where("lixcol_depth", "=", 0) // Get the state at this exact commit
 *   .selectAll()
 *   .execute();
 * ```
 */
export type StateEntityHistoryView = {
	/**
	 * The unique identifier for this entity within its schema and file.
	 *
	 * This is the primary identifier used to reference this specific entity.
	 */
	lixcol_entity_id: Generated<string>;

	/**
	 * The schema key that defines the structure and type of this entity.
	 *
	 * This references the schema definition that validates and types this entity.
	 */
	lixcol_schema_key: Generated<string>;

	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state_history table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: Generated<string>;

	/**
	 * Plugin identifier that manages this entity type.
	 *
	 * This identifies which plugin is responsible for this entity's behavior
	 * and schema definition.
	 */
	lixcol_plugin_key: Generated<string>;

	/**
	 * Version of the schema used for this entity at this point in history.
	 *
	 * Format: "major.minor" (e.g., "1.0", "2.1")
	 * This allows tracking schema evolution over time.
	 */
	lixcol_schema_version: Generated<string>;

	/**
	 * ID of the change that created this specific entity state.
	 *
	 * Each modification to an entity creates a new change, and this ID
	 * references that specific change in the change table.
	 */
	lixcol_change_id: Generated<string>;

	/**
	 * Commit ID that serves as the query root for depth calculation.
	 *
	 * When querying history, this represents the "perspective" from which
	 * you're viewing the entity's history. The depth is calculated relative
	 * to this commit.
	 */
	lixcol_commit_id: Generated<string>;

	/**
	 * The root commit ID used as the starting point for traversing history.
	 *
	 * When querying history from a specific commit, this field contains that
	 * commit ID for all returned rows. Used with `depth` to understand how
	 * far back in history each entity state is from this root.
	 */
	lixcol_root_commit_id: Generated<string>;

	/**
	 * Depth of this entity state relative to the queried commit_id.
	 *
	 * - `0`: The entity state at the exact queried commit
	 * - `1`: The entity state one commit before the queried commit
	 * - `2+`: Earlier states, going back in history
	 *
	 * This is useful for blame functionality and understanding how an entity
	 * evolved to reach its current state.
	 */
	lixcol_depth: Generated<number>;

	/**
	 * Arbitrary metadata attached to the change that produced this historical state.
	 */
	lixcol_metadata: Generated<Record<string, any> | null>;
};

/**
 * Base type for entity history views using LixGenerated markers instead of Kysely's Generated type.
 * This type is compatible with the Lix SDK's type transformation system and provides
 * access to historical entity states.
 *
 * History views are read-only and show how entities evolved over time through changes.
 *
 * @example
 * ```typescript
 * // Define an entity history type
 * export type AccountHistory = {
 *   id: string;  // No LixGenerated marker in history views
 *   name: string;
 * } & StateEntityHistoryColumns;
 * ```
 */
export type StateEntityHistoryColumns = {
	/**
	 * The unique identifier for this entity within its schema and file.
	 *
	 * This is the primary identifier used to reference this specific entity.
	 */
	lixcol_entity_id: LixGenerated<string>;

	/**
	 * The schema key that defines the structure and type of this entity.
	 *
	 * This references the schema definition that validates and types this entity.
	 */
	lixcol_schema_key: LixGenerated<string>;

	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state_history table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: LixGenerated<string>;

	/**
	 * Plugin identifier that manages this entity type.
	 *
	 * This identifies which plugin is responsible for this entity's behavior
	 * and schema definition.
	 */
	lixcol_plugin_key: LixGenerated<string>;

	/**
	 * Version of the schema used for this entity at this point in history.
	 *
	 * Format: "major.minor" (e.g., "1.0", "2.1")
	 * This allows tracking schema evolution over time.
	 */
	lixcol_schema_version: LixGenerated<string>;

	/**
	 * ID of the change that created this specific entity state.
	 *
	 * Each modification to an entity creates a new change, and this ID
	 * references that specific change in the change table.
	 */
	lixcol_change_id: LixGenerated<string>;

	/**
	 * Commit ID that serves as the query root for depth calculation.
	 *
	 * When querying history, this represents the "perspective" from which
	 * you're viewing the entity's history. The depth is calculated relative
	 * to this commit.
	 */
	lixcol_commit_id: LixGenerated<string>;

	/**
	 * The root commit ID used as the starting point for traversing history.
	 *
	 * When querying history from a specific commit, this field contains that
	 * commit ID for all returned rows. Used with `depth` to understand how
	 * far back in history each entity state is from this root.
	 */
	lixcol_root_commit_id: LixGenerated<string>;

	/**
	 * Depth of this entity state relative to the queried commit_id.
	 *
	 * - `0`: The entity state at the exact queried commit
	 * - `1`: The entity state one commit before the queried commit
	 * - `2+`: Earlier states, going back in history
	 *
	 * This is useful for blame functionality and understanding how an entity
	 * evolved to reach its current state.
	 */
	lixcol_depth: LixGenerated<number>;

	/**
	 * Arbitrary metadata attached to the change that produced this historical state.
	 */
	lixcol_metadata: LixGenerated<Record<string, any> | null>;
};
