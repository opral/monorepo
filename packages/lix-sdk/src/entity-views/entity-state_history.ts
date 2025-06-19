import type { Generated } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

/**
 * Base type for entity history views that include historical data from the state_history table.
 * These views provide access to entity states at different points in change set history.
 *
 * @example
 * ```typescript
 * // Define an entity history view type
 * export type AccountHistoryView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityHistoryView;
 * ```
 */
export type StateEntityHistoryView = {
	/** File identifier where this entity is stored */
	lixcol_file_id: Generated<string>;
	/** Plugin identifier that manages this entity type */
	lixcol_plugin_key: Generated<string>;
	/** Version of the schema used for this entity */
	lixcol_schema_version: Generated<string>;
	/** ID of the change that created this entity state */
	lixcol_change_id: Generated<string>;
	/** Change set ID that serves as the root/starting point for depth calculation */
	lixcol_change_set_id: Generated<string>;
	/** Depth of this entity state relative to the queried change_set_id */
	lixcol_depth: Generated<number>;
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
