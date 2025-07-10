import type { Generated } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type {
	LixGenerated,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

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
 * // Query entity history at a specific change set
 * const history = await lix.db
 *   .selectFrom("account_history")
 *   .where("lixcol_change_set_id", "=", changeSetId)
 *   .where("lixcol_depth", "=", 0) // Get the state at this exact change set
 *   .selectAll()
 *   .execute();
 * ```
 */
export type StateEntityHistoryView = {
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
	 * Change set ID that serves as the query root for depth calculation.
	 *
	 * When querying history, this represents the "perspective" from which
	 * you're viewing the entity's history. The depth is calculated relative
	 * to this change set.
	 */
	lixcol_change_set_id: Generated<string>;

	/**
	 * Depth of this entity state relative to the queried change_set_id.
	 *
	 * - `0`: The entity state at the exact queried change set
	 * - `1`: The entity state one change before the queried change set
	 * - `2+`: Earlier states, going back in history
	 *
	 * This is useful for blame functionality and understanding how an entity
	 * evolved to reach its current state.
	 */
	lixcol_depth: Generated<number>;
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
	 * Change set ID that serves as the query root for depth calculation.
	 *
	 * When querying history, this represents the "perspective" from which
	 * you're viewing the entity's history. The depth is calculated relative
	 * to this change set.
	 */
	lixcol_change_set_id: LixGenerated<string>;

	/**
	 * The root change set ID used as the starting point for traversing history.
	 *
	 * When querying history from a specific changeset, this field contains that
	 * changeset ID for all returned rows. Used with `depth` to understand how
	 * far back in history each entity state is from this root.
	 */
	lixcol_root_change_set_id: LixGenerated<string>;

	/**
	 * Depth of this entity state relative to the queried change_set_id.
	 *
	 * - `0`: The entity state at the exact queried change set
	 * - `1`: The entity state one change before the queried change set
	 * - `2+`: Earlier states, going back in history
	 *
	 * This is useful for blame functionality and understanding how an entity
	 * evolved to reach its current state.
	 */
	lixcol_depth: LixGenerated<number>;
};

/**
 * Creates SQL view for entity history based on its schema definition.
 *
 * This function generates a read-only view that extracts JSON properties from the state_history table,
 * providing access to historical entity states at different points in change set history.
 *
 * The view supports:
 * - Querying entity states at specific change sets
 * - Traversing entity history by depth (blame functionality)
 * - Filtering by change set ancestry relationships
 *
 * @throws Error if schema type is not "object" or x-lix-primary-key is not defined
 *
 * @example
 * ```typescript
 * // Basic usage for key-value entities
 * createEntityHistoryViewIfNotExists({
 *   lix,
 *   schema: LixKeyValueSchema,
 *   overrideName: "key_value_history",
 * });
 *
 * // Usage for account entities
 * createEntityHistoryViewIfNotExists({
 *   lix,
 *   schema: LixAccountSchema,
 *   overrideName: "account_history",
 * });
 * ```
 */
export function createEntityStateHistoryView(args: {
	lix: Pick<Lix, "sqlite">;
	schema: LixSchemaDefinition;
	/** Overrides the view name which defaults to schema["x-lix-key"] + "_history" */
	overrideName?: string;
}): void {
	if (!args.schema["x-lix-primary-key"]) {
		throw new Error(
			`Schema must define 'x-lix-primary-key' for entity history view generation`
		);
	}

	const view_name = args.overrideName ?? args.schema["x-lix-key"] + "_history";
	const schema_key = args.schema["x-lix-key"];
	const properties = Object.keys((args.schema as any).properties);

	// Generated SQL query for history view
	const sqlQuery = `
    CREATE VIEW IF NOT EXISTS ${view_name} AS
      SELECT
        ${properties
					.map(
						(prop) => `json_extract(snapshot_content, '$.${prop}') AS ${prop}`
					)
					.join(",\n        ")},
        entity_id,
        schema_key,
        file_id AS lixcol_file_id,
        plugin_key AS lixcol_plugin_key,
        schema_version AS lixcol_schema_version,
        change_id AS lixcol_change_id,
        change_set_id AS lixcol_change_set_id,
        depth AS lixcol_depth
      FROM state_history
      WHERE schema_key = '${schema_key}';
    `;

	args.lix.sqlite.exec(sqlQuery);
}
